# Coohom Native Cabinet Rebuild Guide

Use the exported 2D plan as a background only. Rebuild the room, counters, cabinets, appliances, window, and door with Coohom native objects.

## Import Background

1. Export SVG, PNG, or DXF from the React app.
2. In Coohom Floorplanner, import it as a plan/background reference.
3. Set scale using the full room size: 2324 mm wide x 4746 mm long.
4. Confirm North is at the top of the imported plan and South is at the bottom.
5. Lock the background layer before placing native cabinets.

## Room

- Room width: 2324 mm.
- Room length: 4746 mm.
- Wall height: 2700 mm.
- South door: 1100 mm wide, centered at x612 mm.
- North window: 1100 mm wide, 1800 mm high, sill 900 mm.
- North clear zone: 300 mm with no counter.

## Native Cabinet Runs

- East wall: create a 600D base counter from South y0 to y4446.
- East wall: create 320D lower upper cabinets and 550D top upper cabinets above the counter.
- West wall: keep y0 to y1220 completely clear for the door zone from floor to ceiling.
- West wall: create a 400D counter only from y1220 to y4446.
- West wall: create 320D lower upper cabinets and 450D top upper cabinets only after the door clear zone.

## Placement Table

Y is measured in millimeters from the South wall toward the North wall.

| Wall | Item | South Y mm | Width Along Wall mm | Depth mm | Height mm |
| --- | --- | ---: | ---: | ---: | ---: |
| East | spice | 1850 | 150 | 500 | 200 |
| East | gas | 2000 | 700 | 600 | 900 |
| East | dishwasher | 2850 | 600 | 600 | 880 |
| East | washing | 3800 | 600 | 600 | 880 |
| West | microwave | 1300 | 500 | 400 | 350 |
| West | foodprocessor | 1900 | 500 | 400 | 300 |
| West | waterpurifier | 3350 | 300 | 300 | 400 |
| West | sink | 3550 | 600 | 400 | 900 |
| West | shaft | 4146 | 610 | 838 | 2700 |

## Coohom Rebuild Notes

- Use Coohom native base cabinets, wall cabinets, appliances, sink, chimney, and shaft objects.
- Keep the East gas as a cooktop with a compact chimney above it.
- Keep dishwasher north of gas, and washing machine last near the north window.
- Keep purifier close to sink on the West wall.
- Keep the West shaft fixed at the north-west end.
- Hide or delete the imported background after native cabinets are rebuilt.
