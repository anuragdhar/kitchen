# Architecture and task map

Paths below are relative to `react-configurator/` unless otherwise stated.

| Task | Starting point |
| --- | --- |
| Whole-home navigation | src/main.jsx -> src/HomeApp.jsx |
| Kitchen defaults and named variants | src/config/kitchenConfig.js |
| Kitchen views and controls | src/App.jsx |
| Atomic project state and autosave status | src/hooks/useKitchenProject.js |
| Versioned project codecs and recovery storage | src/persistence/projectCodec.mjs; projectStorage.mjs |
| Runtime validation and nominal plan measurements | src/domain/kitchenValidation.mjs |
| Other room defaults | src/config/ |
| Material settings / creation | src/config/renderConfig.js; src/render/materialFactory.js |
| Balcony / study / whole-home rendering | src/BalconyOffice3D.jsx; src/StudyRoom3D.jsx; src/WholeHome3D.jsx |
| Headless kitchen inspection | scripts/headless-query.cjs; scripts/browser-helpers.cjs |
| Screenshot smoke checks | scripts/visual-qa.cjs |
| Dependency-free basic layout checks | src/domain/layoutChecks.mjs |
| Current-baseline and negative tests | tests/ |
| CAD input selection / generation | repository freecad/generate_kitchen_rule9.py |

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
