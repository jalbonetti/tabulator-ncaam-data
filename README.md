# College Basketball Props Tables

Modular Tabulator-based data tables for displaying NCAA men's basketball betting information. Simplified version of the NBA basketball-props repository with 3 tables and no expandable rows.

## Tables

| Table | Supabase Source | Description |
|-------|----------------|-------------|
| Matchups | `CBBallMatchups` | Game matchups with spread and total |
| Prop Odds | `CBBallPlayerPropOdds` | Player prop odds with EV% and Kelly sizing |
| Game Odds | `CBBallGameOdds` | Game-level odds with EV% and Kelly sizing |

## Key Differences from NBA Version

- **3 tables only** (vs 7 in NBA)
- **No expandable rows** in any table
- **No team abbreviation maps** - NCAA uses full team names everywhere
- **No Player Team column** in Prop Odds (not available in data)
- **No subtable data** - each table pulls from a single Supabase endpoint
- **No IndexedDB caching** - memory cache only
- **No service worker**
- **Blue theme** instead of orange

## Directory Structure

```
cbb-props/
├── main.js                          # Entry point (3 tabs)
├── README.md                        # This file
├── shared/
│   ├── config.js                    # Supabase config + responsive helpers
│   └── utils.js                     # Minimal utility functions
├── components/
│   ├── customMultiSelect.js         # Multi-select dropdown filter
│   ├── minMaxFilter.js              # Min/Max range filter
│   ├── bankrollInput.js             # Kelly % bankroll input
│   └── tabManager.js                # 3-tab manager
├── tables/
│   ├── baseTable.js                 # Simplified base table class
│   ├── cbbMatchups.js               # Matchups flat table
│   ├── cbbPlayerPropOdds.js         # Player prop odds table
│   └── cbbGameOdds.js               # Game odds table
└── styles/
    └── tableStyles.js               # Blue-themed CSS styles
```

## Setup

### 1. HTML Structure

Add a table element to your HTML:

```html
<div id="cbb-table"></div>
```

### 2. Include Tabulator

```html
<link href="https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator.min.css" rel="stylesheet">
<script src="https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min.js"></script>
```

### 3. Include Scripts

Via jsDelivr CDN:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/cbb-props@main/main.js"></script>
```

## Features

### Filters
- **Text Search**: Name/Matchup columns have free-text search
- **Multi-Select Dropdown**: Prop, Label, Book columns (opens above table)
- **Min/Max Range**: Line, Odds columns support min/max filtering
- **Bankroll Input**: Enter bankroll amount to convert Kelly % to dollar amounts

### Sorting
- All columns are sortable
- Custom sorters for odds (+/- prefix) and percentage values
- Default sort: Matchups by name, Prop Odds and Game Odds by EV% descending

### Responsive Design
- Desktop: Full table with scrollbar
- Mobile/Tablet: Frozen first column (Name/Matchup), horizontal scroll for remaining columns

## Debugging

Access via console:

```javascript
// Get table instances
window.cbbTables

// Force refresh a table
window.cbbTables.table0.refreshData()

// Get current tab manager
window.tabManager
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires ES6 module support.

## Responsive Breakpoints

| Breakpoint | Screen Width | Behavior |
|------------|--------------|----------|
| Mobile | <= 768px | Frozen first column, 10px font |
| Tablet | 769-1024px | Frozen first column, 11px font |
| Desktop | > 1024px | Full table, 12px font, visible scrollbar |
