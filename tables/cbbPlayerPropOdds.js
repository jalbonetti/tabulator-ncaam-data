// tables/cbbPlayerPropOdds.js - College Basketball Player Prop Odds Table
// No Player Team column (not available in data)
// No team name abbreviations needed
// Simple flat table with fitData layout

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet } from '../shared/config.js';

// Minimum width for Player Name column
const NAME_COLUMN_MIN_WIDTH = 180;

// Minimum width for EV% and Kelly% columns
const EV_KELLY_COLUMN_MIN_WIDTH = 65;

export class CBBPlayerPropOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'CBBallPlayerPropOdds');
        
        // Prop type abbreviation mapping for display
        this.propAbbrevMap = {
            '3-Pointers': '3-Pt',
            'Points + Assists': 'P+A',
            'Points + Rebounds': 'P+R',
            'Points + Rebounds + Assists': 'P+R+A',
            'Rebounds + Assists': 'R+A',
            'Blocks + Steals': 'B+S',
            'Pts + Asts': 'P+A',
            'Pts + Rebs': 'P+R',
            'Pts + Rebs + Asts': 'P+R+A',
            'Rebs + Asts': 'R+A',
            'Blks + Stls': 'B+S',
            'Points + Reb': 'P+R',
            'Points + Ast': 'P+A',
            'Pts + Assists': 'P+A',
            'Pts + Rebounds': 'P+R',
            'Double Double': 'DD',
            'Triple Double': 'TD',
        };
    }

    // Abbreviate prop type for table display
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
            initialSort: [
                {column: "EV %", dir: "desc"}
            ],
            dataLoaded: (data) => {
                console.log(`CBB Player Prop Odds loaded ${data.length} records`);
                this.dataLoaded = true;
                
                if (data.length > 0) {
                    console.log('CBB Prop Odds first row:', {
                        'Player Name': data[0]["Player Name"],
                        'Player Prop Type': data[0]["Player Prop Type"],
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
                console.error("Error loading CBB player prop odds:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("CBB Player Prop Odds table built");
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
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        // Prop formatter - abbreviates combo props
        const propFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            return self.abbreviateProp(value);
        };

        // EV % formatter
        const evFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1) + '%';
        };

        // Quarter Kelly % formatter
        const kellyFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            
            const bankroll = getBankrollValue('CBB Quarter Kelly %');
            
            if (bankroll > 0) {
                const amount = (num / 100) * bankroll;
                return '$' + amount.toFixed(2);
            } else {
                return num.toFixed(1) + '%';
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
                title: "Name", 
                field: "Player Name", 
                frozen: true,
                widthGrow: 0,
                minWidth: NAME_COLUMN_MIN_WIDTH,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Prop", 
                field: "Player Prop Type", 
                widthGrow: 0,
                minWidth: 55,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                headerFilterParams: {
                    valuesLookup: function(cell) {
                        const values = cell.getTable().getData().map(row => row["Player Prop Type"]);
                        return [...new Set(values)].filter(v => v !== null && v !== undefined && v !== '').sort();
                    }
                },
                resizable: false,
                hozAlign: "center",
                formatter: propFormatter
            },
            {
                title: "Label", 
                field: "Player Over/Under", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Line", 
                field: "Player Prop Line", 
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
                field: "Player Book", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Book Odds", 
                field: "Player Prop Odds", 
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
                field: "Player Median Odds", 
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
                field: "Player Best Odds", 
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
                field: "Player Best Odds Books", 
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
                    bankrollKey: 'CBB Quarter Kelly %'
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
