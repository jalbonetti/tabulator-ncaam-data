// tables/baseTable.js - Base Table Class for College Basketball Props
// Simplified: No expandable rows, no IndexedDB, memory cache only

import { API_CONFIG, isMobile, isTablet } from '../shared/config.js';

// Global data cache to persist between tab switches
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.dataLoaded = false;
        this.filterState = [];
        this.sortState = [];
    }
    
    // Filter out NULL/empty rows from Supabase
    filterNullRows(records) {
        if (!records || !Array.isArray(records)) return records;
        
        const originalCount = records.length;
        
        const primaryIdentifierFields = [
            "Player Name",      // Player prop odds
            "Game Matchup",     // Game odds
            "Matchup",          // Matchups table
        ];
        
        const filtered = records.filter(row => {
            // Check if ANY primary identifier has a value
            const hasPrimaryId = primaryIdentifierFields.some(field => {
                const value = row[field];
                return value !== null && value !== undefined && value !== '';
            });
            
            if (hasPrimaryId) return true;
            
            // Fallback: check if ALL values are null/empty
            const values = Object.entries(row)
                .filter(([key]) => !key.startsWith('_'))
                .map(([, value]) => value);
            
            return !values.every(v => v === null || v === undefined || v === '');
        });
        
        if (originalCount !== filtered.length) {
            console.warn(`Filtered out ${originalCount - filtered.length} NULL/empty rows from ${this.endpoint}`);
        }
        
        return filtered;
    }

    // Memory cache helpers
    getCachedData(key) {
        const cached = dataCache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        dataCache.delete(key);
        return null;
    }
    
    setCachedData(key, data) {
        dataCache.set(key, { data, timestamp: Date.now() });
    }
    
    // Get base table configuration with AJAX
    getBaseConfig() {
        const self = this;
        const url = API_CONFIG.baseURL + this.endpoint;
        const cacheKey = `cbb_${this.endpoint}`;
        
        return {
            height: "600px",
            maxHeight: "600px",
            layout: "fitData",
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "basic",
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            pagination: false,
            columnHeaderSortMulti: true,
            headerSortClickElement: "header",
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            placeholder: "Loading data...",
            
            ajaxURL: url,
            ajaxConfig: {
                method: "GET",
                headers: API_CONFIG.headers
            },
            
            // Custom request function with caching
            ajaxRequestFunc: async function(url, config, params) {
                // Check memory cache
                const memoryCached = self.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Cache hit for ${self.endpoint}`);
                    self.dataLoaded = true;
                    return self.filterNullRows(memoryCached);
                }
                
                // Fetch from API
                console.log(`Fetching ${self.endpoint} from API...`);
                let allRecords = await self.fetchAllRecords(url, config);
                
                allRecords = self.filterNullRows(allRecords);
                self.setCachedData(cacheKey, allRecords);
                self.dataLoaded = true;
                return allRecords;
            }
        };
    }

    // Fetch all records with pagination (Supabase returns max 1000 per request)
    async fetchAllRecords(url, config) {
        const pageSize = API_CONFIG.fetchConfig.pageSize;
        let allRecords = [];
        let offset = 0;
        let hasMore = true;
        let retries = 0;
        const maxRetries = API_CONFIG.fetchConfig.maxRetries;
        
        while (hasMore) {
            const pageUrl = `${url}?offset=${offset}&limit=${pageSize}`;
            
            try {
                const response = await fetch(pageUrl, {
                    method: config.method || "GET",
                    headers: config.headers || API_CONFIG.headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data && data.length > 0) {
                    allRecords = allRecords.concat(data);
                    offset += pageSize;
                    
                    if (data.length < pageSize) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
                
                retries = 0;
                
            } catch (error) {
                retries++;
                console.error(`Fetch error (attempt ${retries}/${maxRetries}):`, error);
                
                if (retries >= maxRetries) {
                    console.error(`Max retries reached for ${this.endpoint}`);
                    hasMore = false;
                } else {
                    await new Promise(r => setTimeout(r, API_CONFIG.fetchConfig.retryDelay * retries));
                }
            }
        }
        
        console.log(`Fetched ${allRecords.length} total records from ${this.endpoint}`);
        return allRecords;
    }

    // Save current filter/sort state
    saveState() {
        if (!this.table) return;
        this.filterState = this.table.getHeaderFilters();
        this.sortState = this.table.getSorters();
    }

    // Restore saved filter/sort state
    restoreState() {
        if (!this.table) return;
        
        if (this.filterState && this.filterState.length > 0) {
            this.filterState.forEach(filter => {
                this.table.setHeaderFilterValue(filter.field, filter.value);
            });
        }
        
        if (this.sortState && this.sortState.length > 0) {
            this.table.setSort(this.sortState);
        }
    }

    // Force refresh data from API
    refreshData() {
        const cacheKey = `cbb_${this.endpoint}`;
        dataCache.delete(cacheKey);
        
        if (this.table) {
            this.table.setData();
        }
    }

    // Destroy table instance
    destroy() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
    }
}
