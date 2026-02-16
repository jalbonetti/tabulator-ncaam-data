// tables/cbbMatchups.js - College Basketball Matchups Table
// Simple flat table - NO expandable rows, NO subtables
// Pulls from single Supabase table: CBBallMatchups
// Spread and Total are fixed-width, equal, no filters
//
// WIDTH FIX:
// The problem: Multiple layers fight over container/tabulator width on mobile:
//   1. tableStyles.js CSS: .table-container { width: 100% !important; } 
//   2. TabManager.applyContainerWidth(): sets inline width:100%, overflow-x:hidden
//   3. tableStyles.js CSS: .tabulator { width: 100% !important; }
// All of these expand the container to full page width, creating void space
// past the narrow 3-column Matchups table.
//
// The fix: Inject CSS using #table0-container (ID selector + !important) which
// beats both the class-based CSS !important rules AND the TabManager inline styles.
// On mobile, we use fit-content + overflow-x:auto on the container itself,
// since Matchups has NO frozen columns and doesn't need the hidden/tableholder pattern.

import { BaseTable } from './baseTable.js';
import { isMobile, isTablet } from '../shared/config.js';

const SPREAD_TOTAL_WIDTH = 250;

export class CBBMatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'CBBallMatchups');
        this._stylesInjected = false;
    }

    _injectMatchupsStyles() {
        if (this._stylesInjected) return;
        const styleId = 'cbb-matchups-width-override';
        if (document.querySelector(`#${styleId}`)) { this._stylesInjected = true; return; }
        
        const style = document.createElement('style');
        style.id = styleId;
        // ID selector (#table0-container) + !important beats:
        //   - Class selectors with !important (.table-container, .tabulator)  
        //   - Inline styles from TabManager (no !important on those)
        style.textContent = `
            /* =====================================================
               ALL DEVICES: Core overrides for Matchups table.
               Container wraps to content width and scrolls if needed.
               ===================================================== */
            #table0-container {
                width: fit-content !important;
                max-width: 100vw !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            #table0-container .tabulator {
                width: auto !important;
                max-width: none !important;
            }
            
            #table0-container .tabulator .tabulator-tableholder {
                overflow-y: auto !important;
            }
            
            /* =====================================================
               DESKTOP (>1024px): No horizontal scroll needed, 
               container fits content exactly
               ===================================================== */
            @media screen and (min-width: 1025px) {
                #table0-container {
                    overflow-x: visible !important;
                }
            }
            
            /* =====================================================
               MOBILE/TABLET (<=1024px): Container is scroll target.
               No frozen columns in Matchups = no need for the 
               overflow-x:hidden + tableholder-scrolls pattern.
               ===================================================== */
            @media screen and (max-width: 1024px) {
                #table0-container {
                    width: fit-content !important;
                    min-width: 0 !important;
                    max-width: 100vw !important;
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                #table0-container .tabulator {
                    width: auto !important;
                    min-width: 0 !important;
                    max-width: none !important;
                }
                
                #table0-container .tabulator .tabulator-tableholder {
                    overflow-x: visible !important;
                }
            }
        `;
        document.head.appendChild(style);
        this._stylesInjected = true;
        console.log('CBB Matchups: Injected width override styles');
    }

    initialize() {
        this._injectMatchupsStyles();
        
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
        
        this.table.on("renderComplete", () => {
            setTimeout(() => this.calculateAndApplyWidths(), 100);
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
        
        let maxMatchupWidth = ctx.measureText("Matchup").width + HEADER_PADDING + SORT_ICON_WIDTH;
        
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
        
        const matchupColumn = this.table.getColumn("Matchup");
        if (matchupColumn) {
            const requiredWidth = maxMatchupWidth + CELL_PADDING + BUFFER;
            const currentWidth = matchupColumn.getWidth();
            if (requiredWidth > currentWidth) {
                matchupColumn.setWidth(Math.ceil(requiredWidth));
            }
        }
        
        const spreadColumn = this.table.getColumn("Spread");
        if (spreadColumn) spreadColumn.setWidth(SPREAD_TOTAL_WIDTH);
        
        const totalColumn = this.table.getColumn("Total");
        if (totalColumn) totalColumn.setWidth(SPREAD_TOTAL_WIDTH);
    }

    calculateAndApplyWidths() {
        if (!this.table) return;
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        const isSmallScreen = isMobile() || isTablet();
        
        try {
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            
            let totalColumnWidth = 0;
            this.table.getColumns().forEach(col => { if (col.isVisible()) totalColumnWidth += col.getWidth(); });
            
            const SCROLLBAR_WIDTH = isSmallScreen ? 0 : 17;
            const totalWidth = totalColumnWidth + SCROLLBAR_WIDTH;
            
            // Set tabulator to exact content width on both mobile and desktop.
            // CSS !important overrides ensure these take effect over blanket rules.
            tableElement.style.width = totalWidth + 'px';
            tableElement.style.minWidth = totalWidth + 'px';
            tableElement.style.maxWidth = totalWidth + 'px';
            
            if (tableHolder) { 
                tableHolder.style.width = totalWidth + 'px'; 
                tableHolder.style.maxWidth = totalWidth + 'px'; 
            }
            
            const header = tableElement.querySelector('.tabulator-header');
            if (header) header.style.width = totalWidth + 'px';
            
            // Container width is handled by CSS (fit-content !important).
            // On desktop: wraps to tabulator, no horizontal scroll.
            // On mobile: wraps to tabulator, capped at 100vw, overflow-x:auto scrolls.
            
            console.log(`CBB Matchups: Set width to ${totalWidth}px (columns: ${totalColumnWidth}px + scrollbar: ${SCROLLBAR_WIDTH}px, device: ${isSmallScreen ? 'mobile' : 'desktop'})`);
        } catch (error) {
            console.error('CBB Matchups calculateAndApplyWidths error:', error);
        }
    }

    forceRecalculateWidths() {
        const data = this.table ? this.table.getData() : [];
        if (data.length > 0) { this.scanDataForMaxWidths(data); }
        this.calculateAndApplyWidths();
    }
    
    expandNameColumnToFill() {
        this.calculateAndApplyWidths();
    }

    getColumns(isSmallScreen = false) {
        return [
            {
                title: "Matchup", 
                field: "Matchup", 
                // NOT frozen - Matchups table has no frozen columns
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
