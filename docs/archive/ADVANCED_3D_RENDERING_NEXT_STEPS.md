# Advanced 3D Rendering Next Steps

Use this after the React layout is stable. Keep React as the design source of truth; do not manually rebuild geometry in a separate renderer.

## Best Path

1. Keep the current React Three.js view as the fast interactive design preview.
2. Export the React shared layout JSON.
3. Regenerate the exact FreeCAD model from that JSON.
4. Export the FreeCAD model to GLTF or OBJ.
5. Use Blender Cycles for final photoreal renders.

## React 3D Upgrade Ideas

- Add `three-mesh-bvh` only if large geometry becomes slow.
- Add `@react-three/fiber` only if the Three.js scene becomes hard to maintain manually.
- Add better materials:
  - wood grain normal/roughness maps.
  - stone countertop texture maps.
  - brushed metal appliance material.
  - frosted/translucent glass cabinet material.
- Add contact shadows and screen-space ambient occlusion if the renderer supports it cleanly.
- Add camera bookmarks for:
  - East wall front render.
  - West wall front render.
  - Walkthrough.
  - Sink/purifier detail.
  - Cooktop/hidden chimney detail.

## Blender Render Target

Use Blender for the high-quality output:

- Render engine: Cycles.
- Device: GPU.
- Resolution: 3840 x 2160 or higher.
- Samples: 128 to 512 depending on render time.
- Denoise: enabled.
- Color management: Filmic or AgX, medium-high contrast.
- Lighting:
  - warm LED strips under wall cabinets.
  - north window daylight.
  - soft area light from ceiling.
- Camera lenses:
  - 18-24 mm for full kitchen walkthrough.
  - 35-50 mm for wall/front renders.

## Acceptance Check

- Blender render must come from the FreeCAD/React-derived model.
- East and West sides must remain correctly oriented.
- Dishwasher remains adjacent to washing.
- Washing door opens left.
- Dishwasher door opens down.
- Gas stays at y2300 with hidden chimney body.
- No Coohom dependency.
