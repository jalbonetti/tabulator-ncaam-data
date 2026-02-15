// tables/cbbMatchups.js - College Basketball Matchups Table
// Simple flat table - NO expandable rows, NO subtables
// Pulls from single Supabase table: CBBallMatchups
// Table width = sum of column content widths (fitData layout)

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
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
        });
    }

    getColumns(isSmallScreen = false) {
        // Line formatter - 1 decimal place
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
                minWidth: isSmallScreen ? 120 : 180,
                sorter: "string",
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Spread", 
                field: "Spread", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "number",
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                hozAlign: "center",
                formatter: lineFormatter
            },
            {
                title: "Total", 
                field: "Total", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "number",
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                hozAlign: "center",
                formatter: lineFormatter
            }
        ];
    }
}
