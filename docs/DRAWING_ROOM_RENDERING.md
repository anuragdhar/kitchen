# Drawing Room finishes and lighting

The focused scene uses the current shared home model, with soft window daylight,
warm chandelier and sconce light, ivory plaster, walnut cabinetry, olive fabric,
honed stone, and brushed bronze. Added seat cushions, accent pillows, sofa feet,
a woven rug, narrow linen drapes, a book and an open ceramic vase give the simple
source furniture more detail. The existing photographed Wood095 maps are reused.

## Files and reproduction

Source: `blender/whole_home/lighting/A501-whole-home-lighting.blend`.
Generator: `blender/photoreal_drawing_room.py`.
Derived scene and two images: `blender/drawing_room/elegant/`.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/photoreal_drawing_room.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/bake_web_lighting.py -- --scene drawing --size 4096 --samples 96
Copy-Item blender/drawing_room/elegant/overview.png react-configurator/public/renders/home-lighting/drawing-room.png
Copy-Item blender/drawing_room/elegant/seating.png react-configurator/public/renders/drawing-room-elegant-seating.png
```

Uses Blender 5.2.2, Cycles HIP, 192 samples, denoising, AgX and 1600 × 1100
images. Append `-- --preview` to the first command for 32 samples at half size.
Source textures are packed into the derived blend. Provenance files record source
and generator hashes; the bake also records export hashes and geometry checks.

## Preserved layout

Coordinates are metres, Z up in Blender; glTF maps `(x,y,z)` to `(x,z,-y)`.
All 1,069 authored meshes retain their raw vertices and world transforms, checked
by the generator. Materials change, and sofa bevel modifiers soften corners
within the existing furniture envelope. New decorative meshes are separate.

| Existing measurement | Before | After |
| --- | --- | --- |
| Room plan span | approximately 3.322 × 5.348 m | unchanged |
| Wall height | 2.700 m | unchanged |
| Sofa base footprint | approximately 0.872 × 2.255 m | unchanged |
| Oval table footprint | approximately 0.644 × 1.103 m | unchanged |

Openings, cabinetry positions, object IDs and saved layouts remain unchanged.
The focused derivative hides adjacent rooms for export. A separate ceiling
contributes to light transport but is omitted from the interactive cutaway.
The original source scene is never saved by either script.

For the drawing-room bake, the temporary lighting surface uses a 0.05 mm normal
bias to reduce self-intersections. Exported geometry stays unchanged. Four overlapping wall
finish objects carry a small depth offset for the web renderer, avoiding flicker
between coplanar surfaces without hiding or moving authored objects.

## Viewing and limits

Open **Drawing Room → Blender model → Blender lighting → Eye-level view**.
Brightness keeps the existing 10–200% range. The **Blender render** tab shows the
new overview and seating detail; the earlier chandelier concept remains available.

The interactive model bakes diffuse illumination into a 4096 atlas. Reflections
and transparent surfaces use browser PBR, so they differ from Cycles stills.
The imported thick window pane uses an interior daylight proxy to avoid excessive
attenuation. Small fabric detail is clearer in the stills than in the atlas.
Lighting changes require rebaking. The whole-home and original studio models
retain the earlier shared scene; this update applies to the dedicated Drawing Room.
