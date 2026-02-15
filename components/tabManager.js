// components/tabManager.js - Tab Manager for College Basketball Tables
// 3 tabs: Matchups, Prop Odds, Game Odds
// Includes applyContainerWidth and forceRecalculateWidths matching NBA pattern

export const TAB_STYLES = `
    .table-wrapper {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 100% !important;
        margin: 0 auto !important;
    }
    
    .tabs-container {
        width: 100%;
        margin-bottom: 0;
        z-index: 10;
    }
    
    .tab-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 5px;
        padding: 10px;
        background: linear-gradient(135deg, #b8860b 0%, #996515 100%);
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
    }
    
    .tab-button {
        padding: 10px 16px;
        border: none;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .tab-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
    
    .tab-button.active {
        background: white;
        color: #996515;
        font-weight: bold;
    }
    
    .tables-container {
        width: 100%;
        position: relative;
        min-height: 500px;
    }
    
    .table-container {
        width: 100%;
    }
    
    .table-container.active-table {
        display: block !important;
    }
    
    .table-container.inactive-table {
        display: none !important;
    }
    
    .table-container .tabulator {
        border-radius: 0 0 6px 6px;
        border-top: none;
    }
    
    @media screen and (max-width: 768px) {
        .tab-button {
            padding: 8px 12px;
            font-size: 11px;
        }
        .tab-buttons {
            gap: 4px;
            padding: 8px;
        }
    }
`;

export class TabManager {
    constructor(tables) {
        this.tables = tables;
        this.currentActiveTab = 'table0';
        this.tabInitialized = {};
        this.isTransitioning = false;
        
        Object.keys(tables).forEach(tabId => {
            this.tabInitialized[tabId] = false;
        });
        
        this.injectStyles();
        this.setupTabSwitching();
        this.initializeTab(this.currentActiveTab);
        
        console.log("TabManager: Initialized with tabs:", Object.keys(tables));
    }
    
    injectStyles() {
        if (!document.querySelector('#tab-manager-styles')) {
            const style = document.createElement('style');
            style.id = 'tab-manager-styles';
            style.textContent = TAB_STYLES;
            document.head.appendChild(style);
        }
    }

    getContainerIdForTab(tabId) {
        return { 'table0': 'table0-container', 'table1': 'table1-container', 'table2': 'table2-container' }[tabId] || `${tabId}-container`;
    }

    applyContainerWidth(tableContainer) {
        if (!tableContainer) return;
        
        const tabulator = tableContainer.querySelector('.tabulator');
        
        if (window.innerWidth <= 1024) {
            tableContainer.style.width = '100%';
            tableContainer.style.maxWidth = '100vw';
            tableContainer.style.overflowX = 'hidden';
            if (tabulator) {
                tabulator.style.width = '100%';
                tabulator.style.minWidth = '0';
                tabulator.style.maxWidth = '100%';
            }
        } else {
            tableContainer.style.width = 'fit-content';
            tableContainer.style.maxWidth = 'none';
            tableContainer.style.overflowX = '';
            if (tabulator) {
                tabulator.style.width = '';
                tabulator.style.minWidth = '';
                tabulator.style.maxWidth = '';
            }
        }
    }

    setupTabSwitching() {
        const self = this;
        
        document.addEventListener('click', async function(e) {
            if (!e.target.classList.contains('tab-button')) return;
            e.preventDefault();
            
            if (self.isTransitioning) return;
            
            const targetTab = e.target.getAttribute('data-tab');
            if (targetTab === self.currentActiveTab) return;
            
            self.isTransitioning = true;
            
            try {
                // Save current table state
                const currentTable = self.tables[self.currentActiveTab];
                if (currentTable && currentTable.saveState) currentTable.saveState();
                
                // Hide current container and reset its width styles
                const currentContainerId = self.getContainerIdForTab(self.currentActiveTab);
                const currentContainer = document.querySelector(`#${currentContainerId}`);
                if (currentContainer) {
                    currentContainer.style.display = 'none';
                    currentContainer.classList.remove('active-table');
                    currentContainer.classList.add('inactive-table');
                    currentContainer.style.width = '';
                    currentContainer.style.minWidth = '';
                    currentContainer.style.maxWidth = '';
                    currentContainer.style.overflowX = '';
                    const currentTabulator = currentContainer.querySelector('.tabulator');
                    if (currentTabulator) {
                        currentTabulator.style.width = '';
                        currentTabulator.style.minWidth = '';
                        currentTabulator.style.maxWidth = '';
                    }
                }
                
                // Update active tab button
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Initialize target tab if needed
                if (!self.tabInitialized[targetTab]) {
                    self.initializeTab(targetTab);
                }
                
                // Show target container
                const targetContainerId = self.getContainerIdForTab(targetTab);
                const targetContainer = document.querySelector(`#${targetContainerId}`);
                if (targetContainer) {
                    targetContainer.style.display = 'block';
                    targetContainer.classList.add('active-table');
                    targetContainer.classList.remove('inactive-table');
                }
                
                self.currentActiveTab = targetTab;
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Redraw and recalculate widths
                const targetTableWrapper = self.tables[targetTab];
                if (targetTableWrapper && targetTableWrapper.table) {
                    targetTableWrapper.table.redraw(true);
                    
                    setTimeout(() => {
                        if (window.innerWidth > 1024) {
                            if (targetTableWrapper.equalizeClusteredColumns) targetTableWrapper.equalizeClusteredColumns();
                            if (targetTableWrapper.forceRecalculateWidths) targetTableWrapper.forceRecalculateWidths();
                            else if (targetTableWrapper.calculateAndApplyWidths) targetTableWrapper.calculateAndApplyWidths();
                        }
                        
                        const tableContainer = targetTableWrapper.table?.element?.closest('.table-container');
                        requestAnimationFrame(() => self.applyContainerWidth(tableContainer));
                    }, 100);
                }
            } catch (error) {
                console.error("TabManager: Error during tab switch:", error);
            } finally {
                self.isTransitioning = false;
            }
        });
    }

    initializeTab(tabId) {
        if (this.tabInitialized[tabId]) return;
        
        const table = this.tables[tabId];
        if (!table) return;
        
        try {
            table.initialize();
            this.tabInitialized[tabId] = true;
            console.log(`TabManager: ${tabId} initialized`);
        } catch (error) {
            console.error(`TabManager: Error initializing ${tabId}:`, error);
        }
    }
}
