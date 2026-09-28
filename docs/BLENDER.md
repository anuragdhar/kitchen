# Blender rendering from Home Interior

Blender runs separately from the React editor. The bridge does not embed Blender
as a DLL or start processes from a web page. It exports the currently visible
**authored scene**, camera and PBR textures as a self-contained GLB, plus independent
layered-light metadata. It does not rebuild a second approximate box model.

## Windows workflow

1. Open the desired room or whole-home **3D view**. Choose materials, lights and a
   camera angle. Wait for the material status to show ready.
2. Open **Interior studio → Blender render**, select quality, and export.
3. Extract the ZIP into a working directory such as `C:\Renders\entry`.
4. From the repository folder run:

```powershell
node react-configurator/scripts/blender-render.cjs --job "C:\Renders\entry\render-job.json" --output "C:\Renders\entry\output"
```

The runner finds Blender on PATH, through BLENDER_PATH, or in standard Windows
Blender Foundation installation directories. To select a specific installation:

```powershell
$env:BLENDER_PATH = "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
node react-configurator/scripts/blender-render.cjs --job "C:\Renders\entry\render-job.json" --output "C:\Renders\entry\output-final" --quality final --device auto
```

Use your installed version's actual path. `--device cpu` is portable. `auto` tries
OptiX/CUDA then reports a CPU fallback; explicitly requested unavailable backends
fail rather than pretending to use a GPU. This integration does not install drivers
or exercise the Blender installation on another user's machine.

Outputs are **render.png**, **scene.blend**, and **render-report.json**. The .blend
can be opened for artistic refinement. Existing outputs are protected; choose a
new output directory or explicitly pass `--overwrite`.

## Quality and fidelity

| Profile | Width | Cycles samples |
| --- | ---: | ---: |
| smoke (CI only) | 480 | 16 |
| draft | 960 | 32 |
| balanced | 1600 | 128 |
| final | 2560 | 512 |

Height follows the active camera aspect. Cycles uses denoising and indirect light
bounces, and resolves area-light shadows. Images and normal/roughness maps are
embedded in the GLB. A SHA-256 manifest detects altered or mismatched scene files.
Metres and Y-up to Blender Z-up conversion are explicit. The current cutaway and
visibility are preserved. Labels rendered as sprites are omitted deliberately.
Skinned/instanced meshes are rejected until a tested resolved-mesh adapter exists.

The GLB exporter retains visible mesh geometry and materials, not viewport-only
postprocessing, fog, custom shader effects or environment reflections. Blender uses
a controlled world background and artist-tuned light-power conversion. UV grain,
real model detail, camera placement and fixture choices still govern realism.
The low-resolution automated render is a smoke test, not photorealistic approval
or a construction/lighting certification. High-quality local renders need more time.

## Verification and security

`npm run test:render-export` starts its own loopback Vite server, opens the actual
entry scene, exports through the UI, checks the embedded images/camera/geometry and
writes a render package under `test-results/render-export`. CI then launches real
Blender Cycles CPU, validates the PNG/report/.blend and uploads evidence. The runner
uses separate process arguments without a shell, Blender factory startup, disabled
auto-execution and a fixed repository script. Job size, paths and numerical bounds
are checked; no arbitrary command supplied in a job is executed.

The Python adapter is SPDX GPL-3.0-or-later; see `blender/COPYING-home-adapter.txt`.
This notice concerns that adapter, not a blanket license change for existing code.
Texture provenance remains in `public/materials/manifest.json` and LICENSE.md.

Official references:
- https://www.blender.org/about/license/
- https://docs.blender.org/manual/en/latest/advanced/command_line/render.html
- https://docs.blender.org/api/current/bpy.ops.import_scene.html
- https://threejs.org/docs/pages/GLTFExporter.html
