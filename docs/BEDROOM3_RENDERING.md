# Bedroom 3 daylight render

The earlier image used EEVEE, three broad fill lights, comparatively strong world
lighting, exaggerated plaster bump and simple bedding blocks. This produced even
illumination and few of the reflections, contact shadows and surface details seen
in interior photography.

`blender/photoreal_bedroom3.py` now starts from the authored
`blender/bedroom3/A501-bedroom3-detail.blend` on every run. It writes a separate
`blender/bedroom3/daylight/` scene and two PNGs, retaining the previous renders and
authored files. The app's two `public/renders/bedroom3-*.png` images are copies of
the completed daylight images.

## Changes

- Cycles, adaptive sampling, denoising, 256 maximum samples and six diffuse bounces.
- Cool balcony fill with low warm sunlight; the three old fill lights are disabled.
- A render-only ceiling closes the room at the existing 2.7 m wall height.
- Submillimetre plaster and fabric bump, the existing ambientCG Wood095 color,
  roughness and displacement maps on timber, Cycles shading bevels, and linen
  sheen. Texture projection uses a common metre-based reference; images are
  packed in the saved Blender file. See the texture folder's existing CC0 notice.
- Puffed decorative pillows and a gently folded throw within their previous
  footprints. The authored bed and mattress meshes stay unchanged.
- Level perspective cameras with optical shift, at 1.45 m eye height.

Coordinates are Blender metres, Z up. All 145 source meshes retain their vertex
positions and world transforms, checked by assertions on each run. The existing
cutaway recipe still hides the same 75 front/balcony/glazing objects and the old
floor plane. No application layout, opening, stable ID or saved-project format
changes. The additional ceiling is a rendering surface, not a plan change.

## Reproduce on this Windows machine

From the repository root, using Blender 5.2.2:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/photoreal_bedroom3.py
```

Add `-- --preview` for 800 × 575 / 32 samples. Final output is 1600 × 1150.
The default uses the AMD HIP GPU available on this machine. On another machine,
use `-- --device CPU`, or `-- --engine BLENDER_EEVEE` for a preview fallback.
CPU Cycles crashed here with `EXCEPTION_ACCESS_VIOLATION` in `embree4.dll`;
HIP completed the preview successfully. The CUDA initialization warning is not
fatal for the selected AMD HIP backend.

Each completed run records source and generator SHA-256 hashes, Blender version,
arguments, preserved mesh count and output image hashes in `provenance.json`.
Implementation starting commit: `4178a9df22c76797f19a0650633438cb9b9b0305`.

## Verification (2026-09-28)

- The final reproduction command above completed with exit code 0 on HIP, rendering
  both 1600 × 1150 views with 256 maximum samples. Both PNGs were visually reviewed.
- Each run passed the 145 authored-mesh transform/vertex assertions. The original
  source blend SHA-256 remains `60c9a43b113587fb08820239d2abb031d522c1a2feb6d260b9075e5d740d6d40`.
- Reopened the generated blend in background Blender and asserted `CYCLES`,
  `samples == 256`, `resolution_percentage == 100`, and all three wood images packed:
  exit code 0, `SAVED_SCENE_VERIFIED 1600 1150 GPU 3`.
- `python -m py_compile blender/photoreal_bedroom3.py`: exit code 0.
- `git diff --check`: exit code 0 (Git reports its normal LF/CRLF conversion notice).
- `Get-FileHash` confirmed each app image matches its generated PNG exactly.
- CPU Cycles: failed with the Embree access violation described above; not a pass.
- App build, Node tests and live browser inspection: not run. Node/npm are absent
  from this shell's PATH; this change updates static render assets and the Blender
  recipe, with no application JavaScript changes. Visual checks cover the PNGs,
  not their surrounding browser interface.

## Practical limits

This remains a relatively simple architectural model. The duvet silhouette,
doorway backgrounds and sparse furnishings still limit realism compared with a
fully dressed scene containing simulated bedding, detailed joinery and exterior
context. The lighting and finish pass does not imply that these details were
modelled or that real-world dimensions have been certified.
