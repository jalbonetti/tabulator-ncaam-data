// main.js - College Basketball Props Table System
// 3 tables: Matchups, Prop Odds, Game Odds
// No expandable rows, no global expanded state

import { injectStyles } from './styles/tableStyles.js';
import { CBBMatchupsTable } from './tables/cbbMatchups.js';
import { CBBPlayerPropOddsTable } from './tables/cbbPlayerPropOdds.js';
import { CBBGameOddsTable } from './tables/cbbGameOdds.js';
import { TabManager } from './components/tabManager.js';

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing college basketball table system");
    
    // Inject styles first
    injectStyles();
    
    // Find the existing cbb-table element
    const existingTable = document.getElementById('cbb-table');
    if (!existingTable) {
        console.log("No cbb-table element found - cannot proceed");
        return;
    }

    console.log("Found cbb-table element, creating structure...");

    try {
        createTableStructure(existingTable);
        
        const tableInstances = {
            table0: new CBBMatchupsTable("#matchups-table"),
            table1: new CBBPlayerPropOddsTable("#prop-odds-table"),
            table2: new CBBGameOddsTable("#game-odds-table")
        };
        
        const tabManager = new TabManager(tableInstances);
        window.tabManager = tabManager;
        window.cbbTables = tableInstances;
        
        console.log("College basketball table system initialized successfully!");
        
    } catch (error) {
        console.error("Error initializing CBB table system:", error);
    }
});

function createTableStructure(existingTable) {
    // Main wrapper
    const tabWrapper = document.createElement('div');
    tabWrapper.className = 'table-wrapper';
    tabWrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
    
    // Tabs container with 3 buttons
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    tabsContainer.innerHTML = `
        <div class="tab-buttons">
            <button class="tab-button active" data-tab="table0">Matchups</button>
            <button class="tab-button" data-tab="table1">Prop Odds</button>
            <button class="tab-button" data-tab="table2">Game Odds</button>
        </div>
    `;
    
    // Tables container
    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'tables-container';
    tablesContainer.style.cssText = 'width: 100%; position: relative;';
    
    // Table 0 - Matchups (active by default)
    const matchupsElement = document.createElement('div');
    matchupsElement.id = 'matchups-table';
    const table0Container = document.createElement('div');
    table0Container.className = 'table-container active-table';
    table0Container.id = 'table0-container';
    table0Container.style.cssText = 'width: 100%; display: block;';
    table0Container.appendChild(matchupsElement);
    tablesContainer.appendChild(table0Container);
    
    // Table 1 - Prop Odds (inactive)
    const propOddsElement = document.createElement('div');
    propOddsElement.id = 'prop-odds-table';
    const table1Container = document.createElement('div');
    table1Container.className = 'table-container inactive-table';
    table1Container.id = 'table1-container';
    table1Container.style.cssText = 'width: 100%; display: none;';
    table1Container.appendChild(propOddsElement);
    tablesContainer.appendChild(table1Container);
    
    // Table 2 - Game Odds (inactive)
    const gameOddsElement = document.createElement('div');
    gameOddsElement.id = 'game-odds-table';
    const table2Container = document.createElement('div');
    table2Container.className = 'table-container inactive-table';
    table2Container.id = 'table2-container';
    table2Container.style.cssText = 'width: 100%; display: none;';
    table2Container.appendChild(gameOddsElement);
    tablesContainer.appendChild(table2Container);
    
    // Assemble
    tabWrapper.appendChild(tabsContainer);
    tabWrapper.appendChild(tablesContainer);
    
    // Insert into DOM
    if (existingTable.parentElement) {
        existingTable.parentElement.insertBefore(tabWrapper, existingTable);
        existingTable.style.display = 'none';
    } else {
        document.body.appendChild(tabWrapper);
    }
    
    console.log("Table structure created (3 tables)");
}
