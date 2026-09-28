# Current implementation state

Baseline inspected: commit `898a7654726886aa73cabbd5910ba4a1a7765a5f` (2026-09-28).
This records implemented behavior, not approval of physical measurements or work.
Update this document and the baseline tests together for an intentional design change.

## Authority and entry points

The web entry point is `react-configurator/src/main.jsx` -> `HomeApp.jsx`.
The kitchen is mounted only when its room is opened. Its live defaults come from
`KITCHEN`, `EAST_INIT`, `WEST_INIT`, and `AIRY_WEST_INIT` in
`react-configurator/src/config/kitchenConfig.js`, with state/migrations in App.jsx.
Browser localStorage and saved variants may override startup values.

Other rooms have their own config modules in `src/config/`; the kitchen baseline
does not define their dimensions or coordinate frames.

## Implemented kitchen baseline (millimeters)

| Property | Implemented value |
| --- | --- |
| Room width / length / height | 2324 / 4746 / 2700 |
| West door clear zone along room y | 0 through 610 (end boundary excluded) |
| South opening width | 855 |
| North window width / sill | 1100 / 914 |
| East / west base depths | 600 / 600 |
| Nominal floor aisle | 2324 - 600 - 600 = 1124 |
| East hob y in EAST_INIT | NORTH_HOB_OPTION_Y_MM = 2400 |
| West baseline washing / sink / dishwasher y | 610 / 1210 / 1972 |
| West shaft y / along-wall length / depth | 3908 / 838 / 609 |

AIRY_WEST_INIT is a separate reversible variant: dishwasher y1946, sink and upper
rack y2546, washing y3308, slider y1200. Do not collapse it into WEST_INIT.
The tests freeze the implemented baseline, not every possible valid arrangement.

## Known conflicts: do not silently reconcile

- The archived original README describes a 1220 mm west clear zone, a 400 mm west
  counter, an 1100 mm door, and east wet appliances. These are not live defaults.
- The old `scripts/validate-3d-bolt.mjs` expects an east tall garage/wet-appliance
  layout. It remains available as `npm run test:bolt`, but is not the active gate.
- Even within kitchenConfig.js, `APPLIANCES` is older metadata. `LAYOUT_MODEL`
  references `CURRENT_APPLIANCES`, whose gas y is 1200; EAST_INIT uses 2400.
  CURRENT_VALIDATION_RULES and LAYOUT_MODEL.metadata also mention the older hob
  position. Do not directly export those constants assuming they match live state.
- The FreeCAD generator prefers a root React export containing layoutModel, then
  falls back to `freecad/kitchenConfig.json`; it also has legacy fallback dimensions.
  Inspect the actual input and resulting geometry before treating a CAD file as current.
- App.jsx still owns its legacy validation and migration logic. Its walkway row
  has a hard-coded pass status. The new dependency-free basic checks do not replace
  that UI implementation, certify its results, or cover full collision semantics.

A follow-up export/state unification must first capture behavior and migration
fixtures. Do not resolve disagreements during a cosmetic or structural refactor.

## Asset policy

Source code, live configurations, source drawings, authored models, and runtime
assets stay versioned. Dependency backups are not source. New test reports and
Blender backups are ignored; existing tracked evidence is not blanket-deleted.
When regenerating exports, record input variant, source commit/hash, generator, and
command. Historical notes and prompt files are context, not instructions to restore
an old layout.
