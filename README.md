# Kitchen - Galley 2324x4746 Rule #9 Locked

**Current locked layout based on Rule #9:**
- **RIGHT EAST 600D South->North (bottom->top when looking North from South door):** Gas stove middle 700W y2000 (hidden chimney small covered) + Spice slider 150W open y1850 -> Dishwasher 600W y2850 north of gas -> Washing Machine LAST y3800 closest to North window far north end. Continuous shelves till north window wall end, no tall box going to roof, LED warm, upper lower 320D 500H + top 550D 800H till ceiling 2700.
- **LEFT WEST 400D uniform South->North:** 920 open gap 300-1220 no counter near South door -> Microwave 500W y1300 -> Food Processor 500W y1900 -> Water Purifier 300W near sink y3350 hidden under upper 320D LED touching shaft side -> Sink 600W y3550 almost touching shaft 610x838 -> Shaft LAST y4146 at NW behind sink.
- Dimensions: 2324W x 4746L x 2700H, Door South 1100W, Window North 1100W x 1800H sill 900 no counter under, 300 clear zone north no counter, Walkway 1324 floor / 1004 eye-level with 320 shallow.

## Files
- `sweethome3d/Galley_2324x4746_Rule9_Current.sh3d` - Open in Sweet Home 3D (2D + 3D + dimensions)
- `sweethome3d/Galley_2324x4746_Rule9_Current.json` - JSON for AI API configurator
- `react-configurator/` - React app with AI API `window.kitchenAPI.moveItem()`
- `docs/` - 3D renders

## Sweet Home 3D Links (can import .sh3d)
- Desktop download: https://www.sweethome3d.com/download.jsp
- Online (no install): https://www.sweethome3d.com/SweetHome3DOnline.jsp
- JS Online API: https://www.sweethome3d.com/SweetHome3DJSOnline.jsp
- How to open: File -> Open -> select .sh3d

## AI Programmatic API (open source)
The React configurator exposes AI API:
```js
// In browser console:
window.kitchenAPI.moveItem('west','sink', 3550) // almost touching shaft
window.kitchenAPI.moveItem('east','washing', 3800) // LAST near north
window.kitchenAPI.moveItem('west','waterpurifier', 3350) // near sink
window.kitchenAPI.getLayout() // returns JSON
window.kitchenAPI.validate() // checks Rule #9
```

### Open Source Stack for AI
- **Sweet Home 3D JS** - `PlanComponent`, `Home`, `HomeFurniture.setX/Y()` - pure HTML5/JS editor + 3D view
- **FreeCAD BIM + MCP Bridge** - `romanbsd/freecad_mcp`, `ascriba/freecad-bim-agent` - AI controls FreeCAD via Python API / MCP
- **React-Planner** - JSON model where AI edits JSON

## Run React Configurator
```bash
cd react-configurator
npm install
npm run dev
```

Then open console and type `window.kitchenAPI.moveItem(...)` - this is how AI changes plan programmatically.

## 2D Order Validation
- East: Gas middle (y2000) < Dishwasher (y2850) < Washing Machine LAST (y3800) = true
- West: Microwave (y1300) < Food Processor (y1900) < Purifier near sink (y3350) < Sink (y3550) < Shaft LAST (y4146) = true
