// tables/cbbPlayerPropOdds.js - College Basketball Player Prop Odds Table
// No Player Team column (not available)
// Includes Player Matchup column (full names, no abbreviations)
// EV% and Kelly% values multiplied by 100 before display
// Full width management: scanDataForMaxWidths, equalizeClusteredColumns, calculateAndApplyWidths

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet } from '../shared/config.js';

const NAME_COLUMN_MIN_WIDTH = 180;
const EV_KELLY_COLUMN_MIN_WIDTH = 65;

export class CBBPlayerPropOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'CBBallPlayerPropOdds');
        
        this.propAbbrevMap = {
            '3-Pointers': '3-Pt',
            'Points + Assists': 'P+A', 'Points + Rebounds': 'P+R',
            'Points + Rebounds + Assists': 'P+R+A', 'Rebounds + Assists': 'R+A',
            'Blocks + Steals': 'B+S', 'Pts + Asts': 'P+A', 'Pts + Rebs': 'P+R',
            'Pts + Rebs + Asts': 'P+R+A', 'Rebs + Asts': 'R+A', 'Blks + Stls': 'B+S',
            'Points + Reb': 'P+R', 'Points + Ast': 'P+A', 'Pts + Assists': 'P+A',
            'Pts + Rebounds': 'P+R', 'Double Double': 'DD', 'Triple Double': 'TD',
        };
    }

    abbreviateProp(prop) {
        if (!prop) return '-';
        return this.propAbbrevMap[prop] || prop;
    }

    initialize() {
        const isSmallScreen = isMobile() || isTablet();
        const baseConfig = this.getBaseConfig();
        
        const config = {
            ...baseConfig,
            placeholder: "Loading player prop odds...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [{column: "EV %", dir: "desc"}],
            dataLoaded: (data) => {
                console.log(`CBB Player Prop Odds loaded ${data.length} records`);
                this.dataLoaded = true;
                const element = document.querySelector(this.elementId);
                if (element) { const ld = element.querySelector('.loading-indicator'); if (ld) ld.remove(); }
            },
            ajaxError: (error) => { console.error("Error loading CBB player prop odds:", error); }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("CBB Player Prop Odds table built");
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) {
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
                    this.ensureNameColumnWidth();
                }
            }, 200);
            
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0 && !isMobile() && !isTablet()) {
                    this.calculateAndApplyWidths();
                    this.ensureNameColumnWidth();
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
                    this.ensureNameColumnWidth();
                }
            }, 100);
        });
        
        this.table.on("renderComplete", () => {
            if (!isMobile() && !isTablet()) {
                setTimeout(() => this.calculateAndApplyWidths(), 100);
            }
            setTimeout(() => this.ensureNameColumnWidth(), 50);
        });
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); };
    }

    ensureNameColumnWidth() {
        if (!this.table) return;
        const nameColumn = this.table.getColumn("Player Name");
        if (nameColumn) {
            const currentWidth = nameColumn.getWidth();
            if (currentWidth < NAME_COLUMN_MIN_WIDTH) nameColumn.setWidth(NAME_COLUMN_MIN_WIDTH);
        }
    }

    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        const isSmallScreen = isMobile() || isTablet();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxWidths = { "Player Best Odds Books": 0 };
        
        if (!isSmallScreen) {
            Object.assign(maxWidths, {
                "Player Matchup": 0, "Player Prop Type": 0, "Player Over/Under": 0,
                "Player Book": 0, "Player Prop Odds": 0, "Player Median Odds": 0,
                "Player Best Odds": 0, "EV %": 0, "Quarter Kelly %": 0, "Link": 0
            });
        }
        
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const HEADER_PADDING = 16;
        const SORT_ICON_WIDTH = 16;
        
        const fieldToTitle = {
            "Player Matchup": "Matchup", "Player Prop Type": "Prop", "Player Over/Under": "Label",
            "Player Book": "Book", "Player Prop Odds": "Book Odds", "Player Median Odds": "Median Odds",
            "Player Best Odds": "Best Odds", "Player Best Odds Books": "Best Books",
            "EV %": "EV %", "Quarter Kelly %": "Bet Size", "Link": "Link"
        };
        
        Object.keys(maxWidths).forEach(field => {
            const title = fieldToTitle[field] || field;
            maxWidths[field] = ctx.measureText(title).width + HEADER_PADDING + SORT_ICON_WIDTH;
        });
        
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    let displayValue = String(value);
                    if (field.includes('Odds') && field !== 'Player Best Odds Books') {
                        const num = parseInt(value, 10);
                        if (!isNaN(num)) displayValue = num > 0 ? `+${num}` : `${num}`;
                    }
                    if (field === 'EV %' || field === 'Quarter Kelly %') {
                        const num = parseFloat(value);
                        if (!isNaN(num)) displayValue = (num * 100).toFixed(1) + '%';
                    }
                    if (field === 'Player Prop Type') displayValue = this.abbreviateProp(value);
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
        
        this.ensureNameColumnWidth();
    }

    equalizeClusteredColumns() {
        if (!this.table || isMobile() || isTablet()) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16;
        const SORT_ICON_WIDTH = 20;
        
        // Odds cluster
        const oddsCluster = ['Player Prop Odds', 'Player Median Odds', 'Player Best Odds'];
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
            this.ensureNameColumnWidth();
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
            console.error('CBB Prop Odds calculateAndApplyWidths error:', error);
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
        this.ensureNameColumnWidth();
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
            const v = cell.getValue(); if (v == null || v === '') return '-';
            const n = parseFloat(v); if (isNaN(n)) return '-'; return n.toFixed(1);
        };
        const propFormatter = (cell) => {
            const v = cell.getValue(); if (v == null || v === '') return '-'; return self.abbreviateProp(v);
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
            const bankroll = getBankrollValue('CBB Quarter Kelly %');
            if (bankroll > 0) {
                const amount = (n) * bankroll;
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
                title: "Name", field: "Player Name", frozen: true, widthGrow: 0,
                minWidth: NAME_COLUMN_MIN_WIDTH, sorter: "string", headerFilter: true,
                resizable: false, hozAlign: "left"
            },
            {
                title: "Matchup", field: "Player Matchup", widthGrow: 0, minWidth: 70,
                sorter: "string", headerFilter: createCustomMultiSelect,
                resizable: false, hozAlign: "center"
            },
            {
                title: "Prop", field: "Player Prop Type", widthGrow: 0, minWidth: 55,
                sorter: "string", headerFilter: createCustomMultiSelect,
                headerFilterParams: {
                    valuesLookup: function(cell) {
                        const values = cell.getTable().getData().map(row => row["Player Prop Type"]);
                        return [...new Set(values)].filter(v => v != null && v !== '').sort();
                    }
                },
                resizable: false, hozAlign: "center", formatter: propFormatter
            },
            {
                title: "Label", field: "Player Over/Under", widthGrow: 0, minWidth: 50,
                sorter: "string", headerFilter: createCustomMultiSelect,
                resizable: false, hozAlign: "center"
            },
            {
                title: "Line", field: "Player Prop Line", widthGrow: 0, minWidth: 50,
                sorter: "number", headerFilter: createCustomMultiSelect,
                resizable: false, hozAlign: "center", formatter: lineFormatter
            },
            {
                title: "Book", field: "Player Book", widthGrow: 0, minWidth: 60,
                sorter: "string", headerFilter: createCustomMultiSelect,
                resizable: false, hozAlign: "center"
            },
            {
                title: "Book Odds", field: "Player Prop Odds", widthGrow: 0, minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter,
                hozAlign: "center", cssClass: "cluster-odds"
            },
            {
                title: "Median Odds", field: "Player Median Odds", widthGrow: 0, minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter,
                hozAlign: "center", cssClass: "cluster-odds"
            },
            {
                title: "Best Odds", field: "Player Best Odds", widthGrow: 0, minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter,
                hozAlign: "center", cssClass: "cluster-odds"
            },
            {
                title: "Best Books", field: "Player Best Odds Books", widthGrow: 0, minWidth: 70,
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
                headerFilterLiveFilter: false, headerFilterParams: { bankrollKey: 'CBB Quarter Kelly %' },
                resizable: false, formatter: kellyFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly"
            },
            {
                title: "Link", field: "Link", widthGrow: 0, minWidth: 40,
                sorter: "string", resizable: false, hozAlign: "center",
                formatter: linkFormatter, headerSort: false
            }
        ];
    }
}
