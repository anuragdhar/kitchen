# Blender Cycles Render Skeleton

This is an optional offline render path for future high-quality kitchen images.
It does not run from the React app, and Blender should be launched manually only
when a 4K path-traced render is needed.

## Files

- `blender/kitchen_rule9.py` - Cycles script skeleton.
- Layout input example: `Galley_2324x4746_Rule9_Current.json`.
- Future output example: `docs/renders/kitchen_4k.png`.

## Manual Command

Run later from the repository root after Blender is installed:

```powershell
blender --background --python blender/kitchen_rule9.py -- --plan Galley_2324x4746_Rule9_Current.json --render docs/renders/kitchen_4k.png
```

Optional quality controls:

```powershell
blender --background --python blender/kitchen_rule9.py -- --plan Galley_2324x4746_Rule9_Current.json --render docs/renders/kitchen_4k.png --samples 512 --width 3840 --height 2160
```

## Current Scope

The script currently provides the workflow skeleton only:

- CLI parsing for `--plan` and `--render`.
- JSON plan loading.
- Cycles setup with 512 samples by default.
- 3840 x 2160 default resolution.
- OpenImageDenoise.
- Adaptive sampling with threshold `0.01`.
- Bounce limits matching the planned high-quality render path.
- TODO-safe helper stubs for room, cabinet, counter, lighting, camera, and material creation.

The helper stubs intentionally do not duplicate React scene logic yet. They
should be filled only after the shared layout and render configuration contract
is stable.

## Source Of Truth

The Blender path should conceptually reuse the same render source of truth as
the browser renderer:

- room dimensions
- cabinet vertical bands
- cabinet depths
- material profiles
- tile texture metadata, including physical 600 x 1200 mm scale
- lighting presets
- camera presets

Until that contract is exported in a Blender-readable format, avoid hard-coding
the final kitchen geometry inside this script.

## Notes

This file was not executed as part of implementation. Do not run Blender from
the React app. Treat this as a manual, opt-in render workflow.
