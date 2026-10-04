# Layered lighting proposals

Interior studio → Lighting applies day (4500 K), evening (3300 K), night (2700 K),
automatic local-time mode, or the original authored rig. Set global or room overrides
and independently enable daylight, ambient, cove, task, accent and cabinet layers.
Auto switches at the configurable local clock boundaries (default 07:00/18:00/21:00)
and refreshes every minute while the app is open. This is not a sunrise simulation,
smart-home hardware control, circadian-health prescription or wiring plan.

Every catalogued room has a normalized fixture proposal. Top-level room volumes
come from existing scene bounds; extra pooja/storage alcove bounds are inferred
from explicitly tagged furniture where necessary. Existing room configurations and
object geometry stay unchanged. Cove/cabinet/accent strips are removable emissive
fixture overlays; they are no longer drawn in rooms that have their own track lights
(`ownFixtures` in `src/home/lighting.mjs`: Drawing Room, Lobby, Pooja alcove, Bedroom 1,
Bedroom 3, Study, Kitchen; the overlay's lights stay). The kitchen planner draws its own
under-cabinet LED strips. Review actual fixture installation positions with the
designer before using them for construction.

Individual rooms use separate rectangle lights. Whole-home views aggregate layer
illumination into one rectangle per room, with visible strip emitters retained, to
avoid an unbounded shader-light count. The exported fixture metadata retains all
layers for independent Blender area lights. Three.js rectangle lights do not cast
shadows: direct daylight uses existing shadowing, while final area shadows and
indirect bounce belong to Blender. Preview strengths are artist-tuned, not lux values.

Lighting adjusts existing light intensities and environment brightness while its
rig is active. Whole-home Original mode restores the original lighting/background;
per-room original mixed with other room modes is necessarily an approximation in a
shared environment. Settings are independent from kitchen saved-layout geometry.
A previous lighting settings value is retained; unreadable/conflicting storage is
not silently overwritten. Source: https://threejs.org/docs/pages/RectAreaLight.html

Tests cover every room, schedule boundaries/midnight, CCT range, per-layer switching,
room inheritance, real day/night rendered differences, cabinet switch and unchanged
authored geometry. These checks are not an artistic approval or installation-safety
certificate. Camera, emissive display and monitor colour affect the perceived warmth.

## Designer render (live views, 2026-10-03)

Every live 3D view except the kitchen planner (Whole home 3D editable, the room pages, Main entry, Study, Storage, and the
Balcony office through its existing High quality switch) has a **Designer render** switch, on by default and remembered across
views (`home-interior.designer-render.v1`). It adds screen-space ambient occlusion (three.js GTAO, about a 1.2 m radius) so room
corners, skirting lines, the floor under sofas and cabinets, and cabinet interiors get the soft contact shading of real
indirect light. Source: `react-configurator/src/render/designerRender.js`.

It changes shading only. Geometry, materials, lights, tone mapping (ACES, as each view had), exposure and visibility are
unchanged. Labels, measuring lines, translucent ghosts, glass and the background colour are drawn after the AO, exactly as
before, so the AO never darkens or recolours them. AgX and Khronos Neutral tone mapping were tried and rejected: AgX greyed the
wood and floors, and Neutral showed the warm lighting rigs as pink. Cost: one extra depth/normal pass per frame; turn it off on
a slow computer. Not covered: the kitchen planner (`App.jsx`), the Blender views, and Blender/Cycles output, which already has
real global illumination.

## Track lighting per room (2026-10-04)

There is no false ceiling anywhere, so every room gets 48 V magnetic surface track fixed straight to the slab (white, 22 mm
section), with heads clipped on: `spot` (7 W, about 600 lm, aimed at the wall beside its run), `diffuse` (15 W, about
1,400 lm linear head for soft general light) and `reading` (12 W, about 1,000 lm, pointing straight down or aimed at a
chest, a desk or a worktop with a gentle tilt). Watts and lumens are typical catalogue figures, not a photometric design.

**One track = one circuit.** The heads on a run cannot be dimmed one by one, only the whole run (owner 2026-10-04). So each
run has its own 48 V driver (`driverWatts`, loaded to 80% at most; sizes 60 W or 100 W, the next standard step above the
load divided by 0.8) and its own wall dimmer, and the mix of light on a run is fixed by which heads are clipped on. The
3D pages have one slider per circuit (`DrawingLightDimmer.jsx`: Dark room, All off, Planned level), the general light
first where a room has one (chandelier, dining pendant, the kitchen's under-cabinet strips as a second circuit).

Configs (millimetres, x from the west wall, z from the north wall): `src/config/drawingLightingConfig.js`,
`lobbyLightingConfig.js`, `bedroom1LightingConfig.js`, `bedroom3LightingConfig.js`, `studyLightingConfig.js`,
`kitchenLightingConfig.js`. Pure checks: `src/domain/drawingLighting.mjs` `checkTrackLighting` (runs inside the room,
300 mm off the walls, 100 mm from furniture or cabinets that reach the ceiling, 50 mm from fan blades and 300 mm for
down-pointing heads, spots aimed at their own wall, reading heads onto a seat/bed/work spot with at most 35 degrees of
tilt, wall spots at most 1000 mm from their wall, each run's driver load, and the ceiling mouldings below). 3D: `src/rooms/drawing/DrawingRoomLighting.js` `createTrackLights` (dims by run id),
`src/rooms/shared/RoomTaskLighting.js`, `src/rooms/kitchen/KitchenTrackLights.js` (converts the room frame to the
kitchen planner's centimetre, west/north-positive scene). Tests: `tests/*-lighting.test.mjs`.

| Room (area) | Runs | Heads | Watts (drivers) | Lumens | lm/m2 | Fan |
| --- | --- | --- | --- | --- | --- | --- |
| Drawing Room, layout C (17.9 m2) | T1 TV wall 1.5 m; T2 west wall 2.45 m | 3 spot, 2 diffuse, 3 reading (1 aimed) | 87 (60 + 100) | 7,600 | 425 | two, from the phone scan |
| Lobby / Dining (16.4 m2) | L1 south wall 2.0 m; L2 ironing storage 1.5 m | 3 spot, 2 diffuse, 1 reading | 63 (60 + 60) | 5,600 | 342 | probable, at the scanned centre medallion (C22) |
| Bedroom 1 (10.9 m2) | B1 wardrobe 2.6 m; B2 over the bed 1.2 m | 4 spot, 2 diffuse, 2 reading | 82 (100 + 60) | 7,200 | 663 | assumed at centre (C23) |
| Bedroom 3 (14.8 m2) | B1 north side 2.75 m; B2 south side 2.75 m | 3 spot, 2 diffuse, 3 reading (2 aimed) | 87 (60 + 60) | 7,600 | 515 | from the phone scan (2030, 1820); blades assumed (C24) |
| Study / Bedroom 2 (15.9 m2) | S1 bookshelf 2.6 m; S2 bed and desk 2.6 m | 3 spot, 3 diffuse, 2 reading (aimed) | 90 (60 + 100) | 8,000 | 503 | assumed at centre (C25) |
| Kitchen (11.0 m2) | K1 walkway centre 3.95 m (4000 K) | 3 diffuse, 2 reading (aimed at hob and sink) | 69 (100) | 6,200 | 562 | none |

Bedrooms: the general layer and the wardrobe spots are on one run (the evening circuit); reading heads are on the other,
placed so the lamp is not over the pillows (straight down 750 mm from the headboard in Bedroom 1; aimed from the foot
side at about 19 degrees in Bedroom 3 and 16 degrees in the Study, because the fan sits over the bed there). Kitchen:
only the walkway between the top wall cabinets is free ceiling, so one run goes down its middle; the existing
under-cabinet LED strips stay for the backs of the counters. The assumed fans are drawn so the assumption is visible.

## Tracks and the plaster ceiling mouldings (2026-10-05)

The phone scans show the same plaster work on the Drawing Room, Lobby and Bedroom 3 ceilings: a flat painted border along
each wall, then a raised moulding line 60-80 mm wide about 350-450 mm in from the wall, a ring with a leaf in each corner
reaching 740-960 mm from the walls, and round medallions at the ceiling points. A track cannot be screwed flat across
any of these. Owner's note with the measurements, the before/after of every run and what is not verified:
`docs/changes/2026-10-05-tracks-and-mouldings.md`.

- **Config**: `ceilingMouldings` in the room's lighting config (`DRAWING_CEILING_MOULDINGS`, `LOBBY_CEILING_MOULDINGS`,
  `BEDROOM3_CEILING_MOULDINGS`): `border[wall] = {fromMm, toMm}` measured from that wall, `cornerRings = {fromMm, reachMm:
  {north, east, south, west}}` (the square each corner's ring and leaf fill, from its two walls), `medallions = [{xMm, zMm,
  diameterMm, label}]` from the west and north walls, plus `source`, `accuracy` and `projectionMm` (15, assumed: phone
  LiDAR smooths small relief). Band distances are kept from each wall because the app's rooms are a little larger than
  the scans.
- **Check** (`checkTrackLighting`, pure): `mouldingShapes(room, mouldings)` turns the record into rectangles and circles
  in the room frame. The centre line of every run, and of every head's base, must be `TRACK_TO_MOULDING_MM` (40: half the
  22 mm section, a clip lug, scan accuracy) clear of each shape, or the run must declare
  `crossings: [{moulding: '<shape label>', method: '<stand-off spacers bridging it, or the moulding cut and made good>'}]`.
  A crossing without a method, or of a moulding the run does not reach, is an issue. The flat painted border outboard of
  the moulding is allowed. The result lists `mouldingClearances` and `crossings`.
- **Result**: all six runs were moved to flat slab; **no run crosses a moulding**, so no crossing is declared.

| Run | Before | After | Nearest moulding now |
| --- | --- | --- | --- |
| Drawing T1 | z 440, x 300-2300, spots 700 / 1300 / 1900 | z 540, x 820-2320, spots 920 / 1420 / 1920 | north-west ring 50, north border 110 |
| Drawing T2 | x 640, z 2000-4700, last reading head 4600 | x 640, z 2000-4450, last reading head 4410 aimed at (640, 4700) | south-west ring 85, west border 200 |
| Lobby L1 | z 2740, x 2100-4700, diffused 3700 / 4300 | z 2740, x 2100-4100, diffused 3550 / 3930 | south-east ring 73, south border 97 |
| Lobby L2 | x 4050, z 500-2000 | x 4100, z 500-2000 | north border 50, north-east ring 73, dome-light rosette 110 |
| Bedroom 3 B1 | z 650 (650 off the north wall), x 300-3350 | z 820, x 600-3350 | west border 80, corner rings 80 |
| Bedroom 3 B2 | z 3100 (626 off the south wall), x 300-3350 | z 2906 (820 off the south wall), x 600-3350 | corner rings 70, west border 80 |

- **Lobby fan**: the centre medallion is modelled as a fan with `status: 'probable, from the scan'` at (2605, 1600) in
  the room frame, 1200 mm blades assumed. L1 is 540 mm and L2 895 mm outside the blade circle.
- **Dining pendant** (`pendantCeilingReport`): there is no ceiling point over the table at (2200, 620); the real points are
  on the centre line at z about 1600, the nearest (the fan's medallion) 1060 mm away. The 750 mm bar canopy as drawn lies
  across the north moulding, and is only 101 mm outside the assumed blade circle in plan (the body 22 mm, 670 mm below
  the blades). It needs a new point with a compact canopy inboard of the moulding, or a different fitting; not decided,
  nothing moved.
- **Bedroom 3 fan tolerance**: 400 mm about the room centre became 150 mm about the scanned point.
- **3D**: `createCeilingMouldings` (`DrawingRoomLighting.js`) draws the same shapes the check uses on the Drawing Room,
  Lobby and Bedroom 3 ceilings, on the room pages and in Whole home 3D. The painted border colour is not drawn.
- **Bedroom 1 and the Study** ceilings are not scanned. Their tracks (540-850 mm off the walls, some starting 300 mm from a
  wall) would meet the same border and corner rings if those rooms have them; nothing was changed there.
