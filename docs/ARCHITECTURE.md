# Architecture and task map

Paths below are relative to `react-configurator/` unless otherwise stated.

| Task | Starting point |
| --- | --- |
| Whole-home navigation | src/main.jsx -> src/HomeApp.jsx |
| Local GitHub update button | src/HomeApp.jsx; vite.config.mjs; scripts/local-update-plugin.mjs; scripts/local-update.mjs |
| Kitchen defaults and named variants | src/config/kitchenConfig.js |
| Kitchen views and controls | src/App.jsx |
| Atomic project state and autosave status | src/hooks/useKitchenProject.js |
| Versioned project codecs and recovery storage | src/persistence/projectCodec.mjs; projectStorage.mjs |
| Runtime validation and nominal plan measurements | src/domain/kitchenValidation.mjs |
| Other room defaults | src/config/ |
| Material settings / creation | src/config/renderConfig.js; src/render/materialFactory.js |
| Balcony / study / whole-home rendering | src/BalconyOffice3D.jsx; src/StudyRoom3D.jsx; src/WholeHome3D.jsx |
| Blender whole-home views | blender/export_web_preview.py; public/models/A501-blender-lighting.glb; src/BlenderHomeView.jsx; src/HomeLightingGallery.jsx |
| Individual room Blender views | src/config/homeRoomViews.js; src/HomeApp.jsx; src/BlenderHomeView.jsx |
| Headless kitchen inspection | scripts/headless-query.cjs; scripts/browser-helpers.cjs |
| Screenshot smoke checks | scripts/visual-qa.cjs |
| Dependency-free basic layout checks | src/domain/layoutChecks.mjs |
| Current-baseline and negative tests | tests/ |
| CAD input selection / generation | repository freecad/generate_kitchen_rule9.py |

## Local updates

The home page's Update from GitHub control is available only on the local Vite
development server. Its loopback-only endpoint fetches the current branch from
`origin`, requires a clean checkout, fast-forwards, runs `npm ci` if the app's
package files changed, and restarts Vite. The page reloads after the restart.
The Codespaces preview uses the same endpoint through `.devcontainer/vite.config.mjs`
and accepts only the current Codespace's private forwarded host. It is not included
in a production static build.

## Blender whole-home preview

The Whole home 3D page switches between a Blender-authored lighting model, the
Blender stills and tour, and the live editable Three.js view. The model is exported
from `blender/whole_home/lighting/A501-whole-home-lighting.blend` with
`blender --background --python blender/export_web_preview.py`. The export omits
the eight ceiling panels for a cutaway orbit view; it does not edit the `.blend`.
The GLB is a snapshot of that scene, so saved kitchen edits still appear in the
editable view only. The default viewer now uses a Cycles lighting bake exported by
`blender/bake_web_lighting.py`; the former GLB is the Studio lighting option.
See INTERACTIVE_BLENDER_LIGHTING.md for source files, rebuild commands and limits.
Most individual room views clip the shared GLB to each room's A501 plan bounds and show
its Blender still. The shared bounds live in `src/config/homeRoomViews.js`; the
viewer converts plan pixels to GLB metres with the existing `ENTRY.planScale`
X/Z factors. Bedroom and kitchen workspace geometry and saved projects remain
with their existing live components under the Editable workspace tab. Bedroom 3 and Drawing Room each
uses its dedicated baked model in Blender lighting mode, with metre-based framing
and an eye-level camera; Studio mode retains its shared-plan model region.

## Coordinate contract

For legacy EAST_INIT/WEST_INIT kitchen items, all values are millimeters. `x`
increases west to east, `y` increases south to north, and `z` is height above floor.
`w` is length ALONG THE WALL (the y extent), `d` is the x extent, and `h` the z
extent. Missing z means floor level in the basic-check input contract.
Do not apply this shape blindly to OPENINGS or the richer export model: the shaft
is one example whose width/depth names have different meanings there.

The whole-home floor-plan image uses south-up / north-down / east-left / west-right
screen directions. Screen, room-local and Three.js coordinates are not identical.
Keep transformations at explicit boundaries and add fixture tests before changing them.

## Pure checks boundary

`checkLayoutBasics({room, east, west}, constraints)` accepts the legacy kitchen
shape and reports invalid inputs, duplicate IDs, active-item bounds, the protected
west door zone, and nominal base-run aisle clearance. It does not mutate its input.
It deliberately does not claim collision, door-swing, installation, structural,
electrical, appliance-service, or CAD-export validation. Hidden legacy placeholders
are excluded from active bounds checks, but their IDs and hidden flag are checked.

The runtime validator now composes these basic checks with the existing saved-
variant order rules and all-pair AABB collision checks. summarizeValidation requires
all eight rule IDs and every row to pass. App.jsx uses that same result for its
panel, browser API and exported validation. See kitchenValidation.mjs for the
explicit backing-panel/electrical exclusions and legacy hob collision envelope.
getPlanDimensions supplies the nominal run measurements to the UI and both plan
exporters. Broader export-state normalization and migrations are still separate.

## Refactoring sequence

Capture fixtures first. Extract normalization/migrations and validation into pure
modules, then state/persistence hooks, then individual render/export responsibilities.
Do not combine geometry changes with moving functions. Keep old save formats working
until a tested migration is introduced. Avoid introducing another duplicate layout
model or a new state framework just to split a large file.

## Project persistence boundary

The kitchen now holds serializable project state in one object. Imports prepare a
complete schema-checked replacement before committing it; view selection remains
separate. v0 adapters preserve supplied coordinates rather than infer a version
from appliance positions. See PROJECT_FORMAT.md for formats, limits, storage keys
and recovery. Geometry-validation failures are not data-format failures: editable
drafts retain their measurements and the runtime validator still reports issues.
