// tables/cbbMatchups.js - College Basketball Matchups Table
// Simple flat table - NO expandable rows, NO subtables
// Pulls from single Supabase table: CBBallMatchups
// Column widths calculated from data content via scanDataForMaxWidths

import { BaseTable } from './baseTable.js';
import { isMobile, isTablet } from '../shared/config.js';

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
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) loadingDiv.remove();
                }
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
        
        this.table.on("renderComplete", () => {
            if (!isMobile() && !isTablet()) {
                setTimeout(() => this.calculateAndApplyWidths(), 100);
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); };
    }

    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const HEADER_PADDING = 16;
        const SORT_ICON_WIDTH = 16;
        
        const maxWidths = { "Matchup": 0, "Spread": 0, "Total": 0 };
        const fieldToTitle = { "Matchup": "Matchup", "Spread": "Spread", "Total": "Total" };
        
        Object.keys(maxWidths).forEach(field => {
            const title = fieldToTitle[field];
            maxWidths[field] = ctx.measureText(title).width + HEADER_PADDING + SORT_ICON_WIDTH;
        });
        
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16;
        const BUFFER = 8;
        
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    let displayValue = String(value);
                    if (field === 'Spread' || field === 'Total') {
                        const num = parseFloat(value);
                        if (!isNaN(num)) displayValue = num.toFixed(1);
                    }
                    const textWidth = ctx.measureText(displayValue).width;
                    if (textWidth > maxWidths[field]) maxWidths[field] = textWidth;
                }
            });
        });
        
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    const requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    const currentWidth = column.getWidth();
                    if (requiredWidth > currentWidth) {
                        column.setWidth(Math.ceil(requiredWidth));
                    }
                }
            }
        });
    }

    calculateAndApplyWidths() {
        if (!this.table) return;
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        if (isMobile() || isTablet()) {
            tableElement.style.width = '';
            tableElement.style.minWidth = '';
            tableElement.style.maxWidth = '';
            const tc = tableElement.closest('.table-container');
            if (tc) { tc.style.width = ''; tc.style.minWidth = ''; tc.style.maxWidth = ''; }
            return;
        }
        
        try {
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            if (tableHolder) tableHolder.style.overflowY = 'scroll';
            
            let totalColumnWidth = 0;
            this.table.getColumns().forEach(col => { if (col.isVisible()) totalColumnWidth += col.getWidth(); });
            
            const SCROLLBAR_WIDTH = 17;
            const totalWidth = totalColumnWidth + SCROLLBAR_WIDTH;
            
            tableElement.style.width = totalWidth + 'px';
            tableElement.style.minWidth = totalWidth + 'px';
            tableElement.style.maxWidth = totalWidth + 'px';
            
            if (tableHolder) { tableHolder.style.width = totalWidth + 'px'; tableHolder.style.maxWidth = totalWidth + 'px'; }
            
            const header = tableElement.querySelector('.tabulator-header');
            if (header) header.style.width = totalWidth + 'px';
            
            const tc = tableElement.closest('.table-container');
            if (tc) { tc.style.width = 'fit-content'; tc.style.minWidth = 'auto'; tc.style.maxWidth = 'none'; }
        } catch (error) {
            console.error('CBB Matchups calculateAndApplyWidths error:', error);
        }
    }

    forceRecalculateWidths() {
        const data = this.table ? this.table.getData() : [];
        if (data.length > 0) { this.scanDataForMaxWidths(data); this.calculateAndApplyWidths(); }
    }

    getColumns(isSmallScreen = false) {
        const lineFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        return [
            {
                title: "Matchup", 
                field: "Matchup", 
                frozen: isSmallScreen,
                widthGrow: 0,
                minWidth: isSmallScreen ? 120 : 200,
                sorter: "string",
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Spread", 
                field: "Spread", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "number",
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Total", 
                field: "Total", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "number",
                resizable: false,
                hozAlign: "center"
            }
        ];
    }
}
