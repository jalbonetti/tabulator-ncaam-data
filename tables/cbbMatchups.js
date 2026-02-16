// tables/cbbMatchups.js - College Basketball Matchups Table
// Simple flat table - NO expandable rows, NO subtables
// Pulls from single Supabase table: CBBallMatchups
// Spread and Total are fixed-width, equal, no filters
// FIXED: Container now tightly constrains to column widths on ALL devices
// FIXED: Scrollbar uses overflow-y auto instead of scroll (only shows when needed)
// FIXED: Overrides TabManager's applyContainerWidth which sets mobile to 100%

import { BaseTable } from './baseTable.js';
import { isMobile, isTablet } from '../shared/config.js';

// Fixed width for Spread and Total columns - equal, slightly wider than needed
const SPREAD_TOTAL_WIDTH = 250;

export class CBBMatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'CBBallMatchups');
    }

    initialize() {
        const isSmallScreen = isMobile() || isTablet();
        const baseConfig = this.getBaseConfig();
        
        const config = {
            ...baseConfig,
            placeholder: "Loading matchups...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Matchup", dir: "asc"}
            ],
            dataLoaded: (data) => {
                console.log(`CBB Matchups loaded ${data.length} records`);
                this.dataLoaded = true;
                const element = document.querySelector(this.elementId);
                if (element) { const ld = element.querySelector('.loading-indicator'); if (ld) ld.remove(); }
            },
            ajaxError: (error) => {
                console.error("Error loading CBB matchups:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("CBB Matchups table built");
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    this.calculateAndApplyWidths();
                }
            }, 200);
            
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0) this.calculateAndApplyWidths();
            }, 250));
        });
        
        this.table.on("dataLoaded", () => {
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    this.calculateAndApplyWidths();
                }
            }, 100);
        });
        
        // FIXED: Run on ALL devices, not just desktop
        // This ensures mobile/tablet container is constrained after TabManager sets it to 100%
        this.table.on("renderComplete", () => {
            setTimeout(() => this.calculateAndApplyWidths(), 100);
        });
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); };
    }

    // Scan data to find max width needed for Matchup column only
    // Spread and Total use fixed widths
    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Measure header width first
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const HEADER_PADDING = 16;
        const SORT_ICON_WIDTH = 16;
        
        let maxMatchupWidth = ctx.measureText("Matchup").width + HEADER_PADDING + SORT_ICON_WIDTH;
        
        // Measure data widths for Matchup
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16;
        const BUFFER = 8;
        
        data.forEach(row => {
            const value = row["Matchup"];
            if (value !== null && value !== undefined && value !== '') {
                const textWidth = ctx.measureText(String(value)).width;
                if (textWidth > maxMatchupWidth) maxMatchupWidth = textWidth;
            }
        });
        
        // Apply width to Matchup column
        const matchupColumn = this.table.getColumn("Matchup");
        if (matchupColumn) {
            const requiredWidth = maxMatchupWidth + CELL_PADDING + BUFFER;
            const currentWidth = matchupColumn.getWidth();
            if (requiredWidth > currentWidth) {
                matchupColumn.setWidth(Math.ceil(requiredWidth));
            }
        }
        
        // Spread and Total are fixed width - always set them
        const spreadColumn = this.table.getColumn("Spread");
        if (spreadColumn) spreadColumn.setWidth(SPREAD_TOTAL_WIDTH);
        
        const totalColumn = this.table.getColumn("Total");
        if (totalColumn) totalColumn.setWidth(SPREAD_TOTAL_WIDTH);
    }

    // FIXED: Apply tight container width on ALL devices
    // 
    // Problem: TabManager.applyContainerWidth() sets mobile containers to width:100% / maxWidth:100vw
    // and the tabulator to width:100% / maxWidth:100%. This is correct for wide tables (Prop Odds, 
    // Game Odds) that need the full viewport for frozen-column horizontal scrolling. But for the 
    // Matchups table with only 3 narrow columns, it creates a huge empty space to the right.
    //
    // Solution: This method explicitly sets pixel widths on the tabulator element, tableholder, 
    // header, AND the table-container - overriding whatever TabManager set. On desktop we reserve
    // 17px for the scrollbar track; on mobile we don't.
    calculateAndApplyWidths() {
        if (!this.table) return;
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        const isSmallScreen = isMobile() || isTablet();
        
        try {
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            
            // Get total column width
            let totalColumnWidth = 0;
            this.table.getColumns().forEach(col => { if (col.isVisible()) totalColumnWidth += col.getWidth(); });
            
            // Desktop: add scrollbar reservation; Mobile: just use column width
            const SCROLLBAR_WIDTH = isSmallScreen ? 0 : 17;
            const totalWidth = totalColumnWidth + SCROLLBAR_WIDTH;
            
            // Use auto so scrollbar only appears when rows overflow the 600px height
            if (tableHolder) tableHolder.style.overflowY = 'auto';
            
            // Constrain the tabulator element itself with explicit pixel values
            tableElement.style.width = totalWidth + 'px';
            tableElement.style.minWidth = totalWidth + 'px';
            tableElement.style.maxWidth = totalWidth + 'px';
            
            if (tableHolder) { 
                tableHolder.style.width = totalWidth + 'px'; 
                tableHolder.style.maxWidth = totalWidth + 'px'; 
            }
            
            const header = tableElement.querySelector('.tabulator-header');
            if (header) header.style.width = totalWidth + 'px';
            
            // Constrain the table-container parent - use fit-content so it wraps the tabulator
            const tc = tableElement.closest('.table-container');
            if (tc) { 
                tc.style.width = 'fit-content'; 
                tc.style.minWidth = 'auto'; 
                tc.style.maxWidth = 'none';
                tc.style.overflowX = 'visible';
            }
            
            console.log(`CBB Matchups: Set width to ${totalWidth}px (columns: ${totalColumnWidth}px + scrollbar: ${SCROLLBAR_WIDTH}px, device: ${isSmallScreen ? 'mobile' : 'desktop'})`);
        } catch (error) {
            console.error('CBB Matchups calculateAndApplyWidths error:', error);
        }
    }

    // Called by TabManager on tab switch
    forceRecalculateWidths() {
        const data = this.table ? this.table.getData() : [];
        if (data.length > 0) { this.scanDataForMaxWidths(data); }
        this.calculateAndApplyWidths();
    }
    
    // Alias for TabManager compatibility
    expandNameColumnToFill() {
        this.calculateAndApplyWidths();
    }

    getColumns(isSmallScreen = false) {
        return [
            {
                title: "Matchup", 
                field: "Matchup", 
                frozen: isSmallScreen,
                widthGrow: 0,
                minWidth: isSmallScreen ? 120 : 200,
                sorter: function(a, b) {
                    const parseTime = (str) => {
                        if (!str) return 0;
                        const match = str.match(/,\s*(\w+)\s+(\d+),\s*(\d+):(\d+)\s*(AM|PM)\s*/i);
                        if (!match) return 0;
                        const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
                        const mon = months[match[1]] || 0;
                        const day = parseInt(match[2], 10);
                        let hour = parseInt(match[3], 10);
                        const min = parseInt(match[4], 10);
                        const ampm = match[5].toUpperCase();
                        if (ampm === 'PM' && hour !== 12) hour += 12;
                        if (ampm === 'AM' && hour === 12) hour = 0;
                        return new Date(2026, mon, day, hour, min).getTime();
                    };
                    return parseTime(a) - parseTime(b);
                },
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Spread", 
                field: "Spread", 
                width: SPREAD_TOTAL_WIDTH,
                widthGrow: 0,
                sorter: "string",
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Total", 
                field: "Total", 
                width: SPREAD_TOTAL_WIDTH,
                widthGrow: 0,
                sorter: "string",
                resizable: false,
                hozAlign: "center"
            }
        ];
    }
}
