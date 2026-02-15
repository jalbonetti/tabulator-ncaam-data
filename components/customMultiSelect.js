// components/customMultiSelect.js - Custom Multi-Select Dropdown Filter for Tabulator
// Dropdowns open ABOVE the table header

export function createCustomMultiSelect(cell, onRendered, success, cancel, options = {}) {
    const dropdownWidth = options.dropdownWidth || 200;
    
    var button = document.createElement("button");
    button.className = "custom-multiselect-button";
    button.textContent = "Loading...";
    button.style.cssText = `
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        font-size: 11px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-radius: 3px;
    `;
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var dropdownId = 'dropdown_' + field.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
    var isOpen = false;
    var isInitialized = false;
    var filterTimeout = null;
    var clickTimeout = null;
    var loadAttempts = 0;
    
    var column = cell.getColumn();
    
    // Try to load values from the table data
    function tryLoadValues() {
        loadAttempts++;
        var tableData = table.getData();
        
        if (tableData && tableData.length > 0) {
            // Check if custom valuesLookup is provided
            var colDef = column.getDefinition();
            if (colDef.headerFilterParams && colDef.headerFilterParams.valuesLookup) {
                allValues = colDef.headerFilterParams.valuesLookup(cell);
            } else {
                var values = tableData.map(function(row) {
                    return String(row[field] || '');
                });
                allValues = [...new Set(values)].filter(function(v) { return v !== '' && v !== 'undefined' && v !== 'null'; });
                allValues.sort();
            }
            
            selectedValues = [...allValues];
            button.textContent = "All ▾";
            isInitialized = true;
            return true;
        }
        
        if (loadAttempts < 20) {
            setTimeout(tryLoadValues, 500);
        } else {
            button.textContent = "No data";
        }
        return false;
    }
    
    // Create dropdown element
    function createDropdown() {
        var existing = document.getElementById(dropdownId);
        if (existing) existing.remove();
        
        var dropdown = document.createElement("div");
        dropdown.id = dropdownId;
        dropdown.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #333;
            min-width: ${dropdownWidth}px;
            max-width: ${Math.max(dropdownWidth, 300)}px;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            display: none;
            padding: 0;
            border-radius: 4px;
        `;
        
        document.body.appendChild(dropdown);
        return dropdown;
    }
    
    // Filter function
    function customFilterFunction(headerValue, rowValue, rowData, filterParams) {
        if (!headerValue) return true;
        var rowValueStr = String(rowValue || '');
        if (headerValue === "IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING") return false;
        if (Array.isArray(headerValue)) return headerValue.indexOf(rowValueStr) !== -1;
        return rowValueStr === String(headerValue);
    }
    
    column.getDefinition().headerFilterFunc = customFilterFunction;
    
    // Debounced filter update
    function updateFilter() {
        if (filterTimeout) clearTimeout(filterTimeout);
        
        filterTimeout = setTimeout(() => {
            if (selectedValues.length === 0) {
                success("IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING");
            } else if (selectedValues.length === allValues.length) {
                success("");
            } else {
                success([...selectedValues]);
            }
        }, 150);
    }
    
    // Toggle dropdown
    function toggleDropdown() {
        if (!isInitialized) return;
        
        isOpen = !isOpen;
        var dropdown = document.getElementById(dropdownId);
        
        if (!dropdown) {
            dropdown = createDropdown();
        }
        
        if (isOpen) {
            // Position dropdown ABOVE the button
            var rect = button.getBoundingClientRect();
            dropdown.style.display = 'block';
            
            // Temporarily show to measure height
            var dropdownHeight = dropdown.offsetHeight || 200;
            
            dropdown.style.left = rect.left + 'px';
            dropdown.style.top = (rect.top - dropdownHeight - 2) + 'px';
            dropdown.style.width = Math.max(rect.width, dropdownWidth) + 'px';
            
            // Build dropdown content
            buildDropdownContent(dropdown);
        } else {
            dropdown.style.display = 'none';
        }
    }
    
    // Build dropdown content
    function buildDropdownContent(dropdown) {
        dropdown.innerHTML = '';
        
        // Select All / Deselect All buttons
        var controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = 'padding: 6px 8px; border-bottom: 1px solid #ddd; display: flex; gap: 8px;';
        
        var selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.style.cssText = 'flex: 1; padding: 4px; font-size: 10px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; background: #f0f0f0;';
        selectAllBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            selectedValues = [...allValues];
            updateCheckboxes(dropdown);
            updateButtonLabel();
            updateFilter();
        });
        
        var deselectAllBtn = document.createElement('button');
        deselectAllBtn.textContent = 'Deselect All';
        deselectAllBtn.style.cssText = 'flex: 1; padding: 4px; font-size: 10px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; background: #f0f0f0;';
        deselectAllBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            selectedValues = [];
            updateCheckboxes(dropdown);
            updateButtonLabel();
            updateFilter();
        });
        
        controlsDiv.appendChild(selectAllBtn);
        controlsDiv.appendChild(deselectAllBtn);
        dropdown.appendChild(controlsDiv);
        
        // Individual value checkboxes
        allValues.forEach(function(val) {
            var item = document.createElement('div');
            item.style.cssText = 'padding: 4px 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px;';
            item.addEventListener('mouseenter', function() { item.style.background = '#f0f0f0'; });
            item.addEventListener('mouseleave', function() { item.style.background = 'white'; });
            
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedValues.indexOf(val) !== -1;
            checkbox.style.cssText = 'margin: 0; cursor: pointer;';
            
            var label = document.createElement('span');
            label.textContent = val;
            label.style.cssText = 'white-space: nowrap;';
            
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = selectedValues.indexOf(val);
                if (idx === -1) {
                    selectedValues.push(val);
                } else {
                    selectedValues.splice(idx, 1);
                }
                checkbox.checked = selectedValues.indexOf(val) !== -1;
                updateButtonLabel();
                updateFilter();
            });
            
            item.appendChild(checkbox);
            item.appendChild(label);
            dropdown.appendChild(item);
        });
        
        // Reposition after content is built
        var rect = button.getBoundingClientRect();
        var dropdownHeight = dropdown.offsetHeight;
        dropdown.style.top = (rect.top - dropdownHeight - 2) + 'px';
    }
    
    // Update checkboxes to match selectedValues
    function updateCheckboxes(dropdown) {
        var checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        var items = Array.from(dropdown.children).slice(1); // Skip controls div
        items.forEach(function(item, index) {
            var checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && allValues[index] !== undefined) {
                checkbox.checked = selectedValues.indexOf(allValues[index]) !== -1;
            }
        });
    }
    
    // Update button label
    function updateButtonLabel() {
        if (selectedValues.length === 0) {
            button.textContent = "None ▾";
        } else if (selectedValues.length === allValues.length) {
            button.textContent = "All ▾";
        } else if (selectedValues.length === 1) {
            button.textContent = selectedValues[0] + " ▾";
        } else {
            button.textContent = selectedValues.length + " selected ▾";
        }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (isOpen && !button.contains(e.target)) {
            var dropdown = document.getElementById(dropdownId);
            if (dropdown && !dropdown.contains(e.target)) {
                isOpen = false;
                dropdown.style.display = 'none';
            }
        }
    });
    
    // Button click handler
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(function() {
            toggleDropdown();
        }, 50);
    });
    
    // Initialize
    onRendered(function() {
        tryLoadValues();
    });
    
    return button;
}

export default { createCustomMultiSelect };
