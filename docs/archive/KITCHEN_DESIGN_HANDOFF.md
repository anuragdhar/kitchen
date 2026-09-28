# Kitchen Design Handoff

Current design date: 2026-08-25

## Room And Coordinate Basis

- Unit: millimeters.
- Room: 2324 W x 3962 L x 2700 H.
- Coordinate origin: south door side is y0; north/window side is y3962.
- South door: 1100 W, centered.
- North window: 1100 W x 1800 H, sill 900.
- Shaft: west wall, y3124 to y3962, 609 D x 838 L.
- Walkway: 1124 mm at floor level, 1004 mm at eye/upper-cabinet level.

## West Wall Layout

West side counter has been extended toward the door and now starts after a 610 mm clear zone.

South to North:

| Item | Y start | Width along wall | Depth | Height | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| Door clear zone | 0 | 610 | 600 | 2700 | Leave fully clear from floor to ceiling. |
| Washing machine | 610 | 600 | 600 | 880 | Open/visible, not covered by shutter. Door opens left. |
| Kitchen sink | 1210 | 762 | 457 | 900 | 30 in x 18 in sink. |
| Over-sink utensil storage | 1210 | 762 | 320 | 700 | Aligned above sink from z1350. |
| Dishwasher | 1972 | 600 | 600 | 880 | Open/visible, not covered by shutter. Door opens down. |
| 6 in slider storage | 2572 | 552 | 152 | 450 | Counter-height to below middle cabinet, before shaft. |
| Shaft | 3124 | 838 | 609 | 2700 | Fixed NW shaft. |

## East Wall Layout

South to North:

| Item | Y start | Width along wall | Depth | Height | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| Open microwave | 0 | 600 | 400 | 350 | Above backsplash, no cover/shutter. |
| Open appliance garage | 0 | 850 | 600 | 450 | Counter-height garage with food processor inside; pull-out direction toward gas. |
| 4 in backsplash slider | 0 | 3962 | 102 | 450 | Runs above counter behind the stove/counter with slider door. |
| Gas cooktop | 1200 | 700 | 600 | 900 | Hidden chimney/vent above. |

## Cabinet Runs

- East base run: 600D, y0 to y3962.
- East lower upper: 320D, z1350 to z1850.
- East top upper: 550D, z1850 to z2700.
- West base/counter run: 600D, y610 to y3962.
- West lower upper: 320D, z1350 to z1850, after door clear zone.
- West top upper: 450D, z1850 to z2700, after door clear zone.

## Validation

React validation currently passes 7/7:

- East order: microwave + appliance garage at y0, gas at y1200, 4 in slider depth 102 mm.
- West order: washing y610, sink y1210, dishwasher y1972, 6 in slider y2572, shaft y3124.
- Over-sink storage aligns with sink.
- West door clear zone y0-y610 is empty.
- Walkway is 1124 mm floor / 1004 mm eye.
- No appliance/cabinet collisions.
- All active items are within 2324 x 3962 x 2700.

## Export For Interior Designer

Open the React configurator and use **Export Project Package**. It generates a ZIP containing:

- Layout JSON.
- 2D plan SVG.
- 2D plan DXF.
- BOM CSV.
- BOM Markdown.
- Project summary PDF.
- Validation results JSON.

Use the East/West/North/South elevation buttons to export individual SVG, PNG, or PDF wall projections.
