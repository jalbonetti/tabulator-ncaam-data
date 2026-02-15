// styles/tableStyles.js - College Basketball Table Styles
// Blue theme instead of orange
// No expanded-row or subtable styles needed

import { isMobile, isTablet, getDeviceScale } from '../shared/config.js';

export function injectStyles() {
    // Check if Webflow custom styles are already applied
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        injectScrollbarFix();
        return;
    }

    injectFullStyles();
}

function injectScrollbarFix() {
    if (document.querySelector('style[data-source="cbb-scrollbar-fix"]')) return;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'cbb-scrollbar-fix');
    style.textContent = `
        /* Desktop scrollbar fix - counters Webflow's aggressive hiding */
        @media screen and (min-width: 1025px) {
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 12px !important;
                height: 12px !important;
                visibility: visible !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-track,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-track {
                display: block !important;
                background: #f1f1f1 !important;
                border-radius: 6px !important;
                visibility: visible !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: #b8860b !important;
                border-radius: 6px !important;
                min-height: 30px !important;
                visibility: visible !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #996515 !important;
            }
            
            html body .tabulator .tabulator-tableholder,
            html body div.tabulator div.tabulator-tableholder {
                scrollbar-width: thin !important;
                scrollbar-color: #b8860b #f1f1f1 !important;
            }
        }
        
        @media screen and (max-width: 1024px) {
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 4px !important;
                height: 4px !important;
                visibility: visible !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: #ccc !important;
                border-radius: 2px !important;
                visibility: visible !important;
            }
        }
    `;
    
    const webflowStyle = document.querySelector('style[data-table-styles="webflow"]');
    if (webflowStyle && webflowStyle.parentNode) {
        webflowStyle.parentNode.insertBefore(style, webflowStyle.nextSibling);
    } else {
        document.head.appendChild(style);
    }
}

function injectMinimalStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-cbb-minimal');
    style.textContent = `
        .table-wrapper {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .table-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .table-container.inactive-table {
            display: none !important;
        }
        
        /* Mobile frozen column support */
        @media screen and (max-width: 1024px) {
            .table-container {
                width: 100% !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
            }
            
            .table-container .tabulator {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
            }
            
            .table-container .tabulator .tabulator-tableholder {
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            .tabulator-row .tabulator-cell.tabulator-frozen {
                background: inherit !important;
                position: sticky !important;
                left: 0 !important;
                z-index: 10 !important;
            }
            
            .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
                background: #fafafa !important;
            }
            
            .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen {
                background: #ffffff !important;
            }
            
            .tabulator-row:hover .tabulator-cell.tabulator-frozen {
                background: #fdf6e3 !important;
            }
            
            .tabulator-header .tabulator-col.tabulator-frozen {
                position: sticky !important;
                left: 0 !important;
                z-index: 101 !important;
            }
        }
    `;
    document.head.appendChild(style);
}

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-cbb-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           COLLEGE BASKETBALL TABLE STYLES
           Blue theme - No subtable styles
           =================================== */
        
        /* GLOBAL FONT SIZE */
        .tabulator,
        .tabulator *,
        .tabulator-table,
        .tabulator-table *,
        .tabulator-header,
        .tabulator-header *,
        .tabulator-row,
        .tabulator-row *,
        .tabulator-cell,
        .tabulator-cell * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
        }
        
        /* Base container */
        .table-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            position: relative;
            background: #e8e8e8;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: visible;
        }
        
        .table-wrapper {
            background: #e8e8e8;
        }
        
        /* Tabulator base */
        .tabulator {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
            background-color: #e8e8e8;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: visible !important;
        }
        
        .tabulator .tabulator-tableholder {
            background-color: #e8e8e8;
        }
        
        /* HEADER STYLES */
        .tabulator .tabulator-header {
            background: linear-gradient(180deg, #faf8f0 0%, #e8dcc8 100%);
            border-bottom: 2px solid #b8860b;
        }
        
        .tabulator .tabulator-header .tabulator-col {
            background: transparent;
            border-right: 1px solid #d4c9a8;
            border-bottom: none;
        }
        
        .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
            padding: 6px 4px;
        }
        
        .tabulator .tabulator-header .tabulator-col .tabulator-col-title {
            text-align: center !important;
            white-space: normal !important;
            word-break: break-word;
            overflow-wrap: break-word;
            font-weight: 600;
            color: #3d2e00;
        }
        
        /* Header filter inputs */
        .tabulator .tabulator-header .tabulator-col .tabulator-header-filter input {
            font-size: 10px !important;
            padding: 3px 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }
        
        /* ROW STYLES */
        .tabulator .tabulator-row {
            border-bottom: 1px solid #f0f0f0;
            min-height: 28px;
        }
        
        .tabulator .tabulator-row:hover {
            background-color: #fdf6e3 !important;
        }
        
        .tabulator .tabulator-row.tabulator-row-even {
            background-color: #fafafa;
        }
        
        .tabulator .tabulator-row.tabulator-row-odd {
            background-color: #ffffff;
        }
        
        /* CELL STYLES */
        .tabulator .tabulator-cell {
            padding: 4px 6px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-right: 1px solid #f0f0f0;
        }
        
        /* Odds cluster styling */
        .tabulator .tabulator-cell.cluster-odds {
            background-color: rgba(184, 134, 11, 0.03);
        }
        
        .tabulator .tabulator-cell.cluster-ev-kelly {
            background-color: rgba(184, 134, 11, 0.06);
        }
        
        /* Header cluster backgrounds */
        .tabulator .tabulator-header .tabulator-col.cluster-odds {
            background-color: rgba(184, 134, 11, 0.05);
        }
        
        .tabulator .tabulator-header .tabulator-col.cluster-ev-kelly {
            background-color: rgba(184, 134, 11, 0.08);
        }
        
        /* Scrollbar styles for desktop */
        @media screen and (min-width: 1025px) {
            .tabulator .tabulator-tableholder {
                overflow-y: auto !important;
                overflow-x: auto !important;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 12px;
                height: 12px;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 6px;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
                background: #b8860b;
                border-radius: 6px;
                min-height: 30px;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #996515;
            }
        }
        
        /* Mobile frozen column support */
        @media screen and (max-width: 1024px) {
            .table-container {
                width: 100% !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
            }
            
            .table-container .tabulator {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
            }
            
            .table-container .tabulator .tabulator-tableholder {
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            .tabulator-row .tabulator-cell.tabulator-frozen {
                background: inherit !important;
                position: sticky !important;
                left: 0 !important;
                z-index: 10 !important;
            }
            
            .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
                background: #fafafa !important;
            }
            
            .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen {
                background: #ffffff !important;
            }
            
            .tabulator-row:hover .tabulator-cell.tabulator-frozen {
                background: #fdf6e3 !important;
            }
            
            .tabulator-header .tabulator-col.tabulator-frozen {
                position: sticky !important;
                left: 0 !important;
                z-index: 101 !important;
            }
        }
        
        /* Sort arrow styling */
        .tabulator .tabulator-header .tabulator-col.tabulator-sortable .tabulator-arrow {
            border-bottom-color: #b8860b;
        }
        
        /* Min/max filter number input spinners hidden */
        .min-max-input::-webkit-outer-spin-button,
        .min-max-input::-webkit-inner-spin-button,
        .bankroll-input::-webkit-outer-spin-button,
        .bankroll-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    `;
    document.head.appendChild(style);
}
