// tables/cbbGameOdds.js - College Basketball Game Odds Table
// Simple flat table - no expandable rows, no grouped headers
// Always displays full team names (no abbreviations available)
// fitData layout - table width = sum of column content widths

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet } from '../shared/config.js';

// Minimum width for EV% and Kelly% columns
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
            initialSort: [
                {column: "EV %", dir: "desc"}
            ],
            dataLoaded: (data) => {
                console.log(`CBB Game Odds loaded ${data.length} records`);
                this.dataLoaded = true;
                
                if (data.length > 0) {
                    console.log('CBB Game Odds first row:', {
                        'Game Matchup': data[0]["Game Matchup"],
                        'Game Prop Type': data[0]["Game Prop Type"],
                        'EV %': data[0]["EV %"]
                    });
                }
                
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) loadingDiv.remove();
                }
            },
            ajaxError: (error) => {
                console.error("Error loading CBB game odds:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("CBB Game Odds table built");
        });
    }

    // Custom sorter for odds with +/- prefix
    oddsSorter(a, b) {
        const getOddsNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const str = String(val).trim();
            if (str.startsWith('+')) return parseInt(str.substring(1), 10) || -99999;
            const num = parseInt(str, 10);
            return isNaN(num) ? -99999 : num;
        };
        return getOddsNum(a) - getOddsNum(b);
    }

    // Custom sorter for percentage values
    percentSorter(a, b) {
        const getNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const num = parseFloat(val);
            return isNaN(num) ? -99999 : num;
        };
        return getNum(a) - getNum(b);
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        // Odds formatter
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Line formatter - 1 decimal place
        const lineFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '';
            const num = parseFloat(value);
            if (isNaN(num)) return '';
            return num.toFixed(1);
        };

        // EV % formatter
        const evFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            const pct = num * 100;
            return pct.toFixed(1) + '%';
        };

        // Quarter Kelly % formatter
        const kellyFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            
            const bankroll = getBankrollValue('CBB Game Quarter Kelly %');
            
            if (bankroll > 0) {
                const amount = num * bankroll;
                return '$' + amount.toFixed(2);
            } else {
                const pct = num * 100;
                return pct.toFixed(1) + '%';
            }
        };

        // Link formatter
        const linkFormatter = (cell) => {
            const value = cell.getValue();
            if (!value || value === '-' || value === '') return '-';
            const link = document.createElement('a');
            link.href = value;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Bet';
            link.style.cssText = 'color: #b8860b; text-decoration: underline; font-weight: 500;';
            return link;
        };

        return [
            {
                title: "Matchup", 
                field: "Game Matchup", 
                frozen: true,
                widthGrow: 0,
                minWidth: isSmallScreen ? 120 : 180,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Prop", 
                field: "Game Prop Type", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Label", 
                field: "Game Label", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Line", 
                field: "Game Line", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "number", 
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                hozAlign: "center",
                formatter: lineFormatter
            },
            {
                title: "Book", 
                field: "Game Book", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Book Odds", 
                field: "Game Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Median Odds", 
                field: "Game Median Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Odds", 
                field: "Game Best Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Books", 
                field: "Game Best Odds Books", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "string",
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "EV %", 
                field: "EV %", 
                widthGrow: 0,
                minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b) { return self.percentSorter(a, b); },
                resizable: false,
                formatter: evFormatter,
                hozAlign: "center",
                cssClass: "cluster-ev-kelly"
            },
            {
                title: "Bet Size", 
                field: "Quarter Kelly %", 
                widthGrow: 0,
                minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b) { return self.percentSorter(a, b); },
                headerFilter: createBankrollInput,
                headerFilterFunc: bankrollFilterFunction,
                headerFilterLiveFilter: false,
                headerFilterParams: {
                    bankrollKey: 'CBB Game Quarter Kelly %'
                },
                resizable: false,
                formatter: kellyFormatter,
                hozAlign: "center",
                cssClass: "cluster-ev-kelly"
            },
            {
                title: "Link", 
                field: "Link", 
                widthGrow: 0,
                minWidth: 40,
                sorter: "string",
                resizable: false,
                hozAlign: "center",
                formatter: linkFormatter,
                headerSort: false
            }
        ];
    }
}
