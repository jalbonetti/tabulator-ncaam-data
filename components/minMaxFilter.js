// components/minMaxFilter.js - Min/Max Range Filter for Tabulator
// Compact dual-input filter for numeric columns (prop values, odds)

export function createMinMaxFilter(cell, onRendered, success, cancel, editorParams = {}) {
    const maxWidth = editorParams.maxWidth || 45;
    
    const container = document.createElement('div');
    container.className = 'min-max-filter-container';
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        max-width: ${maxWidth}px;
        margin: 0 auto;
    `;
    
    const inputStyle = `
        width: 100%;
        padding: 2px 3px;
        font-size: 9px;
        border: 1px solid #ccc;
        border-radius: 2px;
        text-align: center;
        box-sizing: border-box;
        -moz-appearance: textfield;
        -webkit-appearance: none;
        appearance: none;
    `;
    
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.className = 'min-max-input min-input';
    minInput.placeholder = 'Min';
    minInput.style.cssText = inputStyle;
    
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'min-max-input max-input';
    maxInput.placeholder = 'Max';
    maxInput.style.cssText = inputStyle;
    
    let filterTimeout = null;
    
    function applyFilter() {
        if (filterTimeout) clearTimeout(filterTimeout);
        
        filterTimeout = setTimeout(() => {
            const minVal = minInput.value !== '' ? parseFloat(minInput.value) : null;
            const maxVal = maxInput.value !== '' ? parseFloat(maxInput.value) : null;
            
            if (minVal === null && maxVal === null) {
                success(null);
            } else {
                success({ min: minVal, max: maxVal });
            }
        }, 300);
    }
    
    minInput.addEventListener('input', applyFilter);
    maxInput.addEventListener('input', applyFilter);
    
    minInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') applyFilter();
        if (e.key === 'Escape') { minInput.value = ''; maxInput.value = ''; success(null); }
    });
    
    maxInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') applyFilter();
        if (e.key === 'Escape') { minInput.value = ''; maxInput.value = ''; success(null); }
    });
    
    // Focus styling
    [minInput, maxInput].forEach(input => {
        input.addEventListener('focus', function() {
            input.style.borderColor = '#b8860b';
            input.style.boxShadow = '0 0 0 1px rgba(184, 134, 11, 0.2)';
        });
        input.addEventListener('blur', function() {
            input.style.borderColor = '#ccc';
            input.style.boxShadow = 'none';
        });
    });
    
    container.appendChild(minInput);
    container.appendChild(maxInput);
    
    return container;
}

export function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams) {
    if (!headerValue || (headerValue.min === null && headerValue.max === null)) return true;
    
    if (rowValue === null || rowValue === undefined || rowValue === '' || rowValue === '-') return false;
    
    const strValue = String(rowValue).trim();
    const numValue = parseFloat(strValue);
    
    if (isNaN(numValue)) return false;
    
    const { min, max } = headerValue;
    
    if (min !== null && max !== null) return numValue >= min && numValue <= max;
    if (min !== null) return numValue >= min;
    if (max !== null) return numValue <= max;
    
    return true;
}

export default { createMinMaxFilter, minMaxFilterFunction };
