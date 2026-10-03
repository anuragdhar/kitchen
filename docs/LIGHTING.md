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
fixture overlays. The kitchen has two opposing under-cabinet strips. Review actual
fixture installation positions with the designer before using them for construction.

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
