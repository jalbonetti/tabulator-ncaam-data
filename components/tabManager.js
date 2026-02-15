// components/tabManager.js - Tab Manager for College Basketball Tables
// Simplified: 3 tabs only (Matchups, Prop Odds, Game Odds)

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
        const containerMap = {
            'table0': 'table0-container',
            'table1': 'table1-container',
            'table2': 'table2-container'
        };
        return containerMap[tabId] || `${tabId}-container`;
    }

    setupTabSwitching() {
        const buttons = document.querySelectorAll('.tab-button');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                if (targetTab === this.currentActiveTab) return;
                
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(targetTab) {
        console.log(`TabManager: Switching from ${this.currentActiveTab} to ${targetTab}`);
        
        // Save state of current table
        const currentTable = this.tables[this.currentActiveTab];
        if (currentTable && currentTable.saveState) {
            currentTable.saveState();
        }
        
        // Update button styles
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === targetTab);
        });
        
        // Hide current container, show target
        const currentContainer = document.getElementById(this.getContainerIdForTab(this.currentActiveTab));
        const targetContainer = document.getElementById(this.getContainerIdForTab(targetTab));
        
        if (currentContainer) {
            currentContainer.className = 'table-container inactive-table';
            currentContainer.style.display = 'none';
        }
        
        if (targetContainer) {
            targetContainer.className = 'table-container active-table';
            targetContainer.style.display = 'block';
        }
        
        this.currentActiveTab = targetTab;
        
        // Initialize tab if first time
        if (!this.tabInitialized[targetTab]) {
            this.initializeTab(targetTab);
        } else {
            // Redraw existing table
            const table = this.tables[targetTab];
            if (table && table.table) {
                table.table.redraw(true);
            }
        }
    }

    initializeTab(tabId) {
        const table = this.tables[tabId];
        if (!table) {
            console.error(`TabManager: No table found for ${tabId}`);
            return;
        }
        
        console.log(`TabManager: Initializing ${tabId}`);
        
        try {
            table.initialize();
            this.tabInitialized[tabId] = true;
            console.log(`TabManager: ${tabId} initialized successfully`);
        } catch (error) {
            console.error(`TabManager: Error initializing ${tabId}:`, error);
        }
    }
}
