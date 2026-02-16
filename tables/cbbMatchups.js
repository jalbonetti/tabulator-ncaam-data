// tables/cbbMatchups.js - College Basketball Matchups Table
// Simple flat table - NO expandable rows, NO subtables
// Pulls from single Supabase table: CBBallMatchups
// Spread and Total are fixed-width, equal, no filters
//
// WIDTH FIX:
// DESKTOP: CSS override on #table0-container removes blanket width:100%!important and
//   overflow-y:scroll!important, then JS sets tight pixel widths (columns + scrollbar).
// MOBILE: Behaves identically to Prop Odds/Game Odds tables — clears JS widths, lets
//   CSS handle layout. Additionally sets tabulator background transparent so the grey
//   background of the 100%-width tabulator doesn't show past the actual column content.

import { BaseTable } from './baseTable.js';
import { isMobile, isTablet } from '../shared/config.js';

// Fixed width for Spread and Total columns - equal, slightly wider than needed
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
        style.textContent = `
            /* DESKTOP: Override blanket width:100% and overflow-y:scroll
               so JS can set tight pixel widths on the Matchups table. */
            @media screen and (min-width: 1025px) {
                #table0-container .tabulator {
                    width: auto !important;
                    max-width: none !important;
                }
                #table0-container .tabulator .tabulator-tableholder {
                    overflow-y: auto !important;
                }
            }
            
            /* MOBILE/TABLET: The tabulator is 100% of the container (full viewport width)
               but the actual column content is narrower (~850px on a 375px screen, so it 
               scrolls). The grey #e8e8e8 background on .tabulator would be visible past
               the column content since the tabulator is wider than the content. 
               Make it transparent so only the actual rows/cells are visible. */
            @media screen and (max-width: 1024px) {
                #table0-container .tabulator {
                    background: transparent !important;
                    background-color: transparent !important;
                }
                #table0-container .tabulator .tabulator-tableholder {
                    background: transparent !important;
                    background-color: transparent !important;
                }
                #table0-container {
                    background: transparent !important;
                }
            }
        `;
        document.head.appendChild(style);
        this._stylesInjected = true;
        console.log('CBB Matchups: Injected override styles');
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
        
        // Desktop only — matches Prop Odds / Game Odds pattern
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

    // Mobile: clear widths, let CSS handle (identical to Prop Odds pattern)
    // Desktop: set tight pixel widths (CSS override lets inline styles take effect)
    calculateAndApplyWidths() {
        if (!this.table) return;
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        // MOBILE/TABLET: Clear all JS widths, let CSS !important rules handle layout
        // This is exactly what cbbPlayerPropOdds and cbbGameOdds do on mobile.
        if (isMobile() || isTablet()) {
            tableElement.style.width = '';
            tableElement.style.minWidth = '';
            tableElement.style.maxWidth = '';
            const tc = tableElement.closest('.table-container');
            if (tc) { tc.style.width = ''; tc.style.minWidth = ''; tc.style.maxWidth = ''; }
            return;
        }
        
        // DESKTOP: Set tight pixel widths
        try {
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            
            let totalColumnWidth = 0;
            this.table.getColumns().forEach(col => { if (col.isVisible()) totalColumnWidth += col.getWidth(); });
            
            const SCROLLBAR_WIDTH = 17;
            const totalWidth = totalColumnWidth + SCROLLBAR_WIDTH;
            
            tableElement.style.width = totalWidth + 'px';
            tableElement.style.minWidth = totalWidth + 'px';
            tableElement.style.maxWidth = totalWidth + 'px';
            
            if (tableHolder) { 
                tableHolder.style.width = totalWidth + 'px'; 
                tableHolder.style.maxWidth = totalWidth + 'px'; 
            }
            
            const header = tableElement.querySelector('.tabulator-header');
            if (header) header.style.width = totalWidth + 'px';
            
            const tc = tableElement.closest('.table-container');
            if (tc) { 
                tc.style.width = 'fit-content'; 
                tc.style.minWidth = 'auto'; 
                tc.style.maxWidth = 'none';
            }
            
            console.log(`CBB Matchups: Desktop width set to ${totalWidth}px (columns: ${totalColumnWidth}px + scrollbar: ${SCROLLBAR_WIDTH}px)`);
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
