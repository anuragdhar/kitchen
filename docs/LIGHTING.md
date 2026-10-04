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
tilt, each run's driver load). 3D: `src/rooms/drawing/DrawingRoomLighting.js` `createTrackLights` (dims by run id),
`src/rooms/shared/RoomTaskLighting.js`, `src/rooms/kitchen/KitchenTrackLights.js` (converts the room frame to the
kitchen planner's centimetre, west/north-positive scene). Tests: `tests/*-lighting.test.mjs`.

| Room (area) | Runs | Heads | Watts (drivers) | Lumens | lm/m2 | Fan |
| --- | --- | --- | --- | --- | --- | --- |
| Drawing Room, layout C (17.9 m2) | T1 TV wall 2.0 m; T2 west wall 2.7 m | 3 spot, 2 diffuse, 3 reading | 87 (60 + 100) | 7,600 | 425 | two, from the phone scan |
| Lobby / Dining (16.4 m2) | L1 south wall 2.6 m; L2 ironing storage 1.5 m | 3 spot, 2 diffuse, 1 reading | 63 (60 + 60) | 5,600 | 342 | not confirmed (C22) |
| Bedroom 1 (10.9 m2) | B1 wardrobe 2.6 m; B2 over the bed 1.2 m | 4 spot, 2 diffuse, 2 reading | 82 (100 + 60) | 7,200 | 663 | assumed at centre (C23) |
| Bedroom 3 (14.8 m2) | B1 north side 3.05 m; B2 south side 3.05 m | 3 spot, 2 diffuse, 3 reading (2 aimed) | 87 (60 + 60) | 7,600 | 515 | assumed at centre, scan pending (C24) |
| Study / Bedroom 2 (15.9 m2) | S1 bookshelf 2.6 m; S2 bed and desk 2.6 m | 3 spot, 3 diffuse, 2 reading (aimed) | 90 (60 + 100) | 8,000 | 503 | assumed at centre (C25) |
| Kitchen (11.0 m2) | K1 walkway centre 3.95 m (4000 K) | 3 diffuse, 2 reading (aimed at hob and sink) | 69 (100) | 6,200 | 562 | none |

Bedrooms: the general layer and the wardrobe spots are on one run (the evening circuit); reading heads are on the other,
placed so the lamp is not over the pillows (straight down 750 mm from the headboard in Bedroom 1; aimed from the foot
side at about 24 degrees in Bedroom 3 and 16 degrees in the Study, because the fan sits over the bed there). Kitchen:
only the walkway between the top wall cabinets is free ceiling, so one run goes down its middle; the existing
under-cabinet LED strips stay for the backs of the counters. The assumed fans are drawn so the assumption is visible.
