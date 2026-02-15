// styles/tableStyles.js - College Basketball Table Styles
// DIRECT COPY of NBA basketball tableStyles.js with color changes:
//   #f97316 -> #b8860b (dark goldenrod)
//   #ea580c -> #996515 (darker gold)
//   #fff7ed -> #fdf6e3 (light parchment hover)
//   #ffedd5 -> #f5ecd0 (parchment)
// Includes: grey background, min/max stacking, frozen columns, scrollbar fix,
//   standalone header alignment, mobile frozen column support

import { isMobile, isTablet, getDeviceScale } from '../shared/config.js';

export function injectStyles() {
    // Check if Webflow custom styles are already applied
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        injectScrollbarFix();
        return;
    }

    // Full style injection for non-Webflow environments
    injectFullStyles();
}

function injectScrollbarFix() {
    if (document.querySelector('#cbb-scrollbar-fix')) return;
    
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.id = 'cbb-scrollbar-fix';
    scrollbarStyle.textContent = `
        /* Counter Webflow's aggressive scrollbar hiding */
        .tabulator .tabulator-tableholder::-webkit-scrollbar {
            display: block !important;
            width: 16px !important;
            height: 16px !important;
        }
        .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            display: block !important;
        }
        .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
            background: #b8860b !important;
            border-radius: 8px !important;
            min-height: 50px !important;
            display: block !important;
        }
        .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
            background: #996515 !important;
        }
        @media screen and (max-width: 1024px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 4px !important;
                height: 4px !important;
            }
        }
    `;
    
    // Insert AFTER any Webflow styles
    const webflowStyle = document.querySelector('style[data-table-styles="webflow"]');
    if (webflowStyle && webflowStyle.nextSibling) {
        webflowStyle.parentNode.insertBefore(scrollbarStyle, webflowStyle.nextSibling);
    } else {
        document.head.appendChild(scrollbarStyle);
    }
}

function injectMinimalStyles() {
    if (document.querySelector('style[data-source="cbb-minimal"]')) return;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'cbb-minimal');
    style.textContent = `
        /* Ensure table and containers are visible */
        .tabulator {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            background: #e8e8e8 !important;
        }
        
        .table-container {
            display: block !important;
            visibility: visible !important;
            background: #e8e8e8 !important;
        }
        
        /* HEADERS: Allow word wrapping, center-justified */
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        /* DATA CELLS: Single-line with ellipsis */
        .tabulator-cell {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* DROPDOWNS: Position ABOVE the table */
        .custom-multiselect-dropdown,
        [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        /* DESKTOP: Grey background fills empty space */
        @media screen and (min-width: 1025px) {
            .table-container {
                background: #e8e8e8 !important;
            }
            .table-wrapper {
                background: #e8e8e8 !important;
            }
            .tabulator {
                background-color: #e8e8e8 !important;
            }
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important;
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }
        }
        
        /* Standalone header alignment on mobile/tablet */
        @media screen and (max-width: 1024px) {
            .tabulator-header {
                display: flex !important;
                align-items: stretch !important;
            }
            .tabulator-header > .tabulator-headers > .tabulator-col {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
            }
            .tabulator-col:not(.tabulator-col-group) > .tabulator-col-content {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                height: 100% !important;
                padding-top: 8px !important;
            }
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title {
                text-align: center !important;
                padding-top: 4px !important;
            }
            /* Frozen columns should have solid background */
            .tabulator-header .tabulator-frozen {
                background: linear-gradient(135deg, #b8860b 0%, #996515 100%) !important;
                z-index: 100 !important;
            }
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #b8860b 0%, #996515 100%) !important;
            }
        }
        
        /* Min/Max filter - MUST stack vertically */
        .min-max-filter-container,
        .tabulator .min-max-filter-container,
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            gap: 2px !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        
        .min-max-input,
        .min-max-filter-container > input {
            width: 100% !important;
            flex-shrink: 0 !important;
            font-size: 9px !important;
            padding: 2px 3px !important;
        }
        
        /* Base overflow for tableholder */
        .tabulator .tabulator-tableholder {
            overflow-y: auto !important;
            overflow-x: auto !important;
        }
        
        /* Mobile styles */
        @media screen and (max-width: 768px) {
            .tabulator-col, .tabulator-cell {
                padding: 2px 1px !important;
            }
            .min-max-input { font-size: 8px !important; padding: 1px 2px !important; }
            .min-max-filter-container { max-width: 35px !important; }
        }
        
        /* Desktop grey background and scrollbar */
        @media screen and (min-width: 1025px) {
            .tabulator {
                width: 100% !important;
                max-width: 100% !important;
                background-color: #e8e8e8 !important;
            }
            .table-container {
                overflow-x: auto !important;
                background: #e8e8e8 !important;
            }
            .table-wrapper {
                background: #e8e8e8 !important;
            }
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important;
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }
        }
        
        /* Header text filter input styling */
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            box-sizing: border-box !important;
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
    console.log('CBB minimal styles injected with grey background, min/max stacking, frozen column fix');
}

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const scale = getDeviceScale();
    
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'cbb-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           CBB TABLE STYLES
           Direct copy of NBA with color changes
           =================================== */
        
        /* GLOBAL FONT SIZE - Responsive */
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
        
        /* Base table container styles - grey background for empty space */
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
        
        /* Table wrapper - grey background */
        .table-wrapper {
            background: #e8e8e8;
        }
        
        /* Tabulator base styles - grey background */
        .tabulator {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
            background-color: #e8e8e8;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: visible !important;
        }
        
        /* Tableholder - grey background fills empty space */
        .tabulator .tabulator-tableholder {
            background-color: #e8e8e8;
        }
        
        /* Header styles - dark goldenrod gradient */
        .tabulator-header {
            background: linear-gradient(135deg, #b8860b 0%, #996515 100%);
            color: white;
            font-weight: 600;
        }
        
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255,255,255,0.2);
        }
        
        /* Header title - wrap at word boundaries, CENTER-JUSTIFIED */
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 4px 2px !important;
        }
        
        /* Column group sub-headers border */
        .tabulator-col-group-cols {
            border-top: 1px solid rgba(255,255,255,0.3);
        }
        
        /* Row styles */
        .tabulator-row {
            border-bottom: 1px solid #e8e8e8;
            min-height: 32px;
        }
        
        .tabulator-row:nth-child(even) {
            background-color: #fafafa;
        }
        
        .tabulator-row:hover {
            background-color: #fdf6e3;
        }
        
        /* Cell styles - SINGLE LINE with ellipsis */
        .tabulator-cell {
            padding: 6px 4px;
            border-right: 1px solid #f0f0f0;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* Scrollbar styles - Desktop only */
        @media screen and (min-width: 1025px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 16px !important;
                height: 16px !important;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 8px;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
                background: #b8860b;
                border-radius: 8px;
                min-height: 50px;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #996515;
            }
            
            /* Firefox */
            .tabulator .tabulator-tableholder {
                scrollbar-width: auto;
                scrollbar-color: #b8860b #f1f1f1;
            }
        }
        
        /* Dropdown filter styles - ABOVE the table */
        .custom-multiselect-dropdown,
        [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        .custom-multiselect-button {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid #ccc;
            background: white;
            cursor: pointer;
            font-size: 11px !important;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-radius: 3px;
            transition: border-color 0.2s ease;
        }
        
        .custom-multiselect-button:hover {
            border-color: #b8860b;
        }
        
        .custom-multiselect-button:focus {
            outline: none;
            border-color: #b8860b;
            box-shadow: 0 0 0 2px rgba(184, 134, 11, 0.2);
        }
        
        /* =====================================================
           FROZEN COLUMN STYLES - For Name column on mobile/tablet
           ===================================================== */
        .tabulator-frozen {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: white !important;
        }
        
        .tabulator-frozen.tabulator-frozen-left {
            border-right: 1px solid rgba(184, 134, 11, 0.4) !important;
            box-shadow: 1px 0 3px rgba(0,0,0,0.05) !important;
        }
        
        /* Frozen column in header - SOLID background */
        .tabulator-header .tabulator-frozen {
            background: linear-gradient(135deg, #b8860b 0%, #996515 100%) !important;
            z-index: 100 !important;
        }
        
        /* Frozen column in rows - maintain alternating colors */
        .tabulator-row .tabulator-frozen {
            background: inherit !important;
        }
        
        .tabulator-row:nth-child(even) .tabulator-frozen {
            background: #fafafa !important;
        }
        
        .tabulator-row:hover .tabulator-frozen {
            background: #fdf6e3 !important;
        }
        
        /* =====================================================
           COMPACT Min/Max Filter Styles - MUST stack vertically
           High specificity to prevent override by flexbox rules
           ===================================================== */
        .min-max-filter-container,
        .tabulator .min-max-filter-container,
        .tabulator-header .min-max-filter-container,
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            gap: 2px !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        
        .min-max-input,
        .min-max-filter-container > input {
            width: 100% !important;
            flex-shrink: 0 !important;
            padding: 2px 3px !important;
            font-size: 9px !important;
            border: 1px solid #ccc !important;
            border-radius: 2px !important;
            text-align: center !important;
            box-sizing: border-box !important;
            -moz-appearance: textfield !important;
            -webkit-appearance: none !important;
            appearance: none !important;
        }
        
        /* Hide number input arrows */
        .min-max-input::-webkit-outer-spin-button,
        .min-max-input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
        }
        
        .min-max-input:focus {
            outline: none !important;
            border-color: #b8860b !important;
            box-shadow: 0 0 0 1px rgba(184, 134, 11, 0.2) !important;
        }
        
        /* =====================================================
           STANDALONE HEADER ALIGNMENT
           On mobile/tablet, standalone columns need top-alignment
           ===================================================== */
        @media screen and (max-width: 1024px) {
            .tabulator-header {
                display: flex !important;
                align-items: stretch !important;
            }
            
            .tabulator-header > .tabulator-headers > .tabulator-col {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
            }
            
            .tabulator-col:not(.tabulator-col-group) > .tabulator-col-content {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                height: 100% !important;
                padding-top: 8px !important;
            }
            
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title {
                text-align: center !important;
                padding-top: 4px !important;
            }
            
            /* Frozen columns solid background in header */
            .tabulator-header .tabulator-frozen {
                background: linear-gradient(135deg, #b8860b 0%, #996515 100%) !important;
                z-index: 100 !important;
            }
            
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #b8860b 0%, #996515 100%) !important;
            }
            
            /* Mobile/tablet: thin scrollbar */
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 4px !important;
                height: 4px !important;
            }
        }
        
        /* =====================================================
           RESPONSIVE BREAKPOINTS
           ===================================================== */
        
        /* Mobile styles */
        @media screen and (max-width: 768px) {
            .tabulator-col,
            .tabulator-cell {
                padding: 2px 1px !important;
            }
            
            .min-max-input {
                font-size: 8px !important;
                padding: 1px 2px !important;
            }
            
            .min-max-filter-container {
                max-width: 35px !important;
            }
        }
        
        /* Desktop: grey background and scrollbar */
        @media screen and (min-width: 1025px) {
            .tabulator {
                width: 100% !important;
                max-width: 100% !important;
                background-color: #e8e8e8 !important;
            }
            
            .table-container {
                overflow-x: auto !important;
                background: #e8e8e8 !important;
            }
            
            .table-wrapper {
                background: #e8e8e8 !important;
            }
            
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important;
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }
        }
        
        /* Header text filter input styling */
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            box-sizing: border-box !important;
        }
        
        /* =====================================================
           MOBILE FROZEN COLUMN SUPPORT
           Constrain container/tabulator so tableholder scrolls
           ===================================================== */
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
    console.log('CBB full styles injected with grey background, min/max stacking, frozen columns, desktop scrollbar');
}
