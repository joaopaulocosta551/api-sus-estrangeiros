# Frontend Implementation Plan: Interactive Brazil Heatmap

## Objective
Implement an interactive choropleth map (heatmap) of Brazil in the Next.js dashboard. This map will visually represent the density of SUS attendances for foreigners per state, allowing users to quickly identify geographical concentrations.

## Key Features
- **Visual Scale:** States with a higher volume of attendances will be colored darker (e.g., from light blue to dark blue).
- **Interactivity:** Hovering over a state will reveal a tooltip displaying the state's name and the exact number of attendances.
- **Integration:** The map will be a central component of the existing Dashboard, complementing the current bar and line charts.

## Tech Stack & Dependencies
- **Mapping Library:** `react-simple-maps` (A declarative API built on top of D3 for creating SVG maps in React).
- **Color Scaling:** `d3-scale` (To map attendance quantities to a color gradient dynamically).
- **Geodata:** A GeoJSON or TopoJSON file containing the geographical coordinates and boundaries of all 27 Brazilian federative units.
- **Tooltips:** `react-tooltip` (For displaying data on hover).

## Implementation Steps

### 1. Install New Dependencies
- Run `npm install react-simple-maps d3-scale react-tooltip` in the `web-sus-estrangeiros` directory.
- Install type definitions: `npm install -D @types/react-simple-maps @types/d3-scale`.

### 2. Acquire Geodata
- Obtain a reliable TopoJSON/GeoJSON file representing Brazil's states (e.g., from a public IBGE repository or a standard geographical library) and place it in the `public/` directory (e.g., `public/brazil-states.json`).

### 3. Create the `BrazilHeatmap` Component
- Create a new file `components/BrazilHeatmap.tsx`.
- Implement the mapping logic:
  - Calculate the maximum number of attendances across all states to define the upper bound of the color scale.
  - Create a `scaleLinear` from `d3-scale` mapping `[0, maxAttendances]` to a color range (e.g., `["#eff6ff", "#1e3a8a"]`).
  - Use `ComposableMap`, `Geographies`, and `Geography` from `react-simple-maps` to render the SVG map.
  - Apply the calculated color to each `Geography` path based on the state's data.
  - Implement `onMouseEnter` and `onMouseLeave` handlers to update a tooltip state.

### 4. Integrate with the Dashboard
- Update `components/DashboardCharts.tsx` to include the `BrazilHeatmap` component, passing the aggregated state data as a prop.
- Ensure responsive styling so the map fits nicely alongside the existing charts.

## Verification
- Verify the map renders correctly without breaking the page layout.
- Confirm the color scale accurately reflects the data density (states with more attendances are visibly darker).
- Test the interactive tooltips to ensure they display the correct state name and numerical value on hover.