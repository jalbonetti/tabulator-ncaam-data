// tables/cbbGameOdds.js - College Basketball Game Odds Table
// Always displays full team names (no abbreviations available)
// EV% and Kelly% values multiplied by 100 before display
// Full width management: scanDataForMaxWidths, equalizeClusteredColumns, calculateAndApplyWidths

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet } from '../shared/config.js';

const EV_KELLY_COLUMN_MIN_WIDTH = 65;

export class CBBGameOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'CBBallGameOdds');
    }

    initialize() {
        const isSmallScreen = isMobile() || isTablet();
        const baseConfig = this.getBaseConfig();
        
        const config = {
            ...baseConfig,
            placeholder: "Loading game odds...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [{column: "EV %", dir: "desc"}],
            dataLoaded: (data) => {
                console.log(`CBB Game Odds loaded ${data.length} records`);
                this.dataLoaded = true;
                const element = document.querySelector(this.elementId);
                if (element) { const ld = element.querySelector('.loading-indicator'); if (ld) ld.remove(); }
            },
            ajaxError: (error) => { console.error("Error loading CBB game odds:", error); }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("CBB Game Odds table built");
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) {
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
                }
            }, 200);
            
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0 && !isMobile() && !isTablet()) {
                    this.calculateAndApplyWidths();
                }
            }, 250));
        });
        
        this.table.on("dataLoaded", () => {
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) {
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
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
        if (isMobile() || isTablet()) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        
        const maxWidths = {
            "Game Matchup": 0, "Game Prop Type": 0, "Game Label": 0, "Game Book": 0,
            "Game Odds": 0, "Game Median Odds": 0, "Game Best Odds": 0,
            "Game Best Odds Books": 0, "EV %": 0, "Quarter Kelly %": 0, "Link": 0
        };
        
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    let displayValue = String(value);
                    if (field.includes('Odds') && field !== 'Game Best Odds Books') {
                        const num = parseInt(value, 10);
                        if (!isNaN(num)) displayValue = num > 0 ? `+${num}` : `${num}`;
                    }
                    if (field === 'EV %' || field === 'Quarter Kelly %') {
                        const num = parseFloat(value);
                        if (!isNaN(num)) displayValue = (num * 100).toFixed(1) + '%';
                    }
                    if (field === 'Link') displayValue = 'Bet';
                    const textWidth = ctx.measureText(displayValue).width;
                    if (textWidth > maxWidths[field]) maxWidths[field] = textWidth;
                }
            });
        });
        
        const CELL_PADDING = 16;
        const BUFFER = 8;
        
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    const requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    const currentWidth = column.getWidth();
                    if (requiredWidth > currentWidth) column.setWidth(Math.ceil(requiredWidth));
                }
            }
        });
    }

    equalizeClusteredColumns() {
        if (!this.table || isMobile() || isTablet()) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16;
        const SORT_ICON_WIDTH = 20;
        
        // Odds cluster
        const oddsCluster = ['Game Odds', 'Game Median Odds', 'Game Best Odds'];
        let maxOddsWidth = 0;
        oddsCluster.forEach(field => {
            const column = this.table.getColumn(field);
            if (column) {
                if (column.getWidth() > maxOddsWidth) maxOddsWidth = column.getWidth();
                const title = column.getDefinition().title;
                if (title) {
                    const hw = ctx.measureText(title).width + CELL_PADDING + SORT_ICON_WIDTH;
                    if (hw > maxOddsWidth) maxOddsWidth = hw;
                }
            }
        });
        if (maxOddsWidth > 0) {
            oddsCluster.forEach(field => {
                const col = this.table.getColumn(field);
                if (col) col.setWidth(Math.ceil(maxOddsWidth));
            });
        }
        
        // EV/Kelly cluster
        const evKellyCluster = ['EV %', 'Quarter Kelly %'];
        let maxEvKellyWidth = EV_KELLY_COLUMN_MIN_WIDTH;
        evKellyCluster.forEach(field => {
            const column = this.table.getColumn(field);
            if (column) {
                if (column.getWidth() > maxEvKellyWidth) maxEvKellyWidth = column.getWidth();
                const title = column.getDefinition().title;
                if (title) {
                    const hw = ctx.measureText(title).width + CELL_PADDING + SORT_ICON_WIDTH;
                    if (hw > maxEvKellyWidth) maxEvKellyWidth = hw;
                }
            }
        });
        if (maxEvKellyWidth > 0) {
            evKellyCluster.forEach(field => {
                const col = this.table.getColumn(field);
                if (col) col.setWidth(Math.ceil(maxEvKellyWidth));
            });
        }
    }

    calculateAndApplyWidths() {
        if (!this.table) return;
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        if (isMobile() || isTablet()) {
            tableElement.style.width = ''; tableElement.style.minWidth = ''; tableElement.style.maxWidth = '';
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
            console.error('CBB Game Odds calculateAndApplyWidths error:', error);
        }
    }

    forceRecalculateWidths() {
        const data = this.table ? this.table.getData() : [];
        if (data.length > 0) {
            this.scanDataForMaxWidths(data);
            if (!isMobile() && !isTablet()) {
                this.equalizeClusteredColumns();
                this.calculateAndApplyWidths();
            }
        }
    }

    oddsSorter(a, b) {
        const g = (v) => { if (v == null || v === '' || v === '-') return -99999; const s = String(v).trim(); if (s.startsWith('+')) return parseInt(s.substring(1),10)||-99999; return parseInt(s,10)||(-99999); };
        return g(a) - g(b);
    }
    percentSorter(a, b) {
        const g = (v) => { if (v == null || v === '' || v === '-') return -99999; return parseFloat(v)||(-99999); };
        return g(a) - g(b);
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        const oddsFormatter = (cell) => {
            const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-';
            const n = parseInt(v, 10); if (isNaN(n)) return '-'; return n > 0 ? `+${n}` : `${n}`;
        };
        const lineFormatter = (cell) => {
            const v = cell.getValue(); if (v == null || v === '') return '';
            const n = parseFloat(v); if (isNaN(n)) return ''; return n.toFixed(1);
        };
        // EV % formatter - multiply by 100
        const evFormatter = (cell) => {
            const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-';
            const n = parseFloat(v); if (isNaN(n)) return '-';
            return (n * 100).toFixed(1) + '%';
        };
        // Kelly formatter - multiply by 100
        const kellyFormatter = (cell) => {
            const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-';
            const n = parseFloat(v); if (isNaN(n)) return '-';
            const bankroll = getBankrollValue('CBB Game Quarter Kelly %');
            if (bankroll > 0) {
                const amount = n * bankroll;
                return '$' + amount.toFixed(2);
            }
            return (n * 100).toFixed(1) + '%';
        };
        const linkFormatter = (cell) => {
            const v = cell.getValue(); if (!v || v === '-' || v === '') return '-';
            const a = document.createElement('a'); a.href = v; a.target = '_blank'; a.rel = 'noopener noreferrer';
            a.textContent = 'Bet'; a.style.cssText = 'color: #b8860b; text-decoration: underline; font-weight: 500;'; return a;
        };

        return [
            {
                title: "Matchup", field: "Game Matchup", frozen: true, widthGrow: 0,
                minWidth: isSmallScreen ? 120 : 180, sorter: "string",
                headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "left"
            },
            {
                title: "Prop", field: "Game Prop Type", widthGrow: 0, minWidth: 60,
                sorter: "string", headerFilter: createCustomMultiSelect,
                resizable: false, hozAlign: "center"
            },
            {
                title: "Label", field: "Game Label", widthGrow: 0, minWidth: 60,
                sorter: "string", headerFilter: createCustomMultiSelect,
                resizable: false, hozAlign: "center"
            },
            {
                title: "Line", field: "Game Line", widthGrow: 0, minWidth: 50,
                sorter: "number", headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false,
                resizable: false, hozAlign: "center", formatter: lineFormatter
            },
            {
                title: "Book", field: "Game Book", widthGrow: 0, minWidth: 60,
                sorter: "string", headerFilter: createCustomMultiSelect,
                resizable: false, hozAlign: "center"
            },
            {
                title: "Book Odds", field: "Game Odds", widthGrow: 0, minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter,
                hozAlign: "center", cssClass: "cluster-odds"
            },
            {
                title: "Median Odds", field: "Game Median Odds", widthGrow: 0, minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter,
                hozAlign: "center", cssClass: "cluster-odds"
            },
            {
                title: "Best Odds", field: "Game Best Odds", widthGrow: 0, minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter,
                hozAlign: "center", cssClass: "cluster-odds"
            },
            {
                title: "Best Books", field: "Game Best Odds Books", widthGrow: 0, minWidth: 70,
                sorter: "string", resizable: false, hozAlign: "center"
            },
            {
                title: "EV %", field: "EV %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b) { return self.percentSorter(a, b); },
                resizable: false, formatter: evFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly"
            },
            {
                title: "Bet Size", field: "Quarter Kelly %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b) { return self.percentSorter(a, b); },
                headerFilter: createBankrollInput, headerFilterFunc: bankrollFilterFunction,
                headerFilterLiveFilter: false, headerFilterParams: { bankrollKey: 'CBB Game Quarter Kelly %' },
                resizable: false, formatter: kellyFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly"
            },
            {
                title: "Link", field: "Link", width: 50, widthGrow: 0,
                minWidth: 40, maxWidth: 50,
                sorter: "string", resizable: false, hozAlign: "center",
                formatter: linkFormatter, headerSort: false
            }
        ];
    }
}
