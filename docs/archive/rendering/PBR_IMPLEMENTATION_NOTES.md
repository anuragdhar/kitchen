# PBR Renderer Implementation Notes

## Direction

Use the current direct Three.js renderer first. The app already has a working 3D scene, exports, camera controls, and layout integration, so the lowest-risk upgrade path is to improve the existing renderer before considering React Three Fiber, Babylon.js, or Blender.

The renderer should read from one shared render configuration instead of defining dimensions, colors, lighting, texture scale, and camera presets inline. Keep the visual views in sync by having 3D, elevations, top plan, exports, BOM, and validation consume the same layout and render metadata.

## Shared Source of Truth

Create or continue using a shared `renderConfig` layer for:

- room dimensions and wall depths
- cabinet vertical bands, plinth, counter, upper, medium, and top cabinet zones
- material profiles for cabinet body, medium wood cabinet, counter, wall, floor, backsplash, tile, glass, appliances, LED, and metal
- camera presets
- lighting presets
- texture metadata, including physical tile size

App components should ask this layer for values instead of repeating literals such as `900`, `1350`, `1850`, `2700`, counter depth, cabinet depth, tile repeat size, or material colors.

## Three.js PBR Baseline

Use `MeshStandardMaterial` as the default material path and configure each material through a profile:

- `color` / albedo
- `roughness`
- `metalness`
- `clearcoat` where supported
- `opacity` / transparency
- `emissive` and `emissiveIntensity` for LEDs
- texture maps with physically scaled repeat values

Target renderer setup:

- `THREE.ACESFilmicToneMapping`
- `THREE.SRGBColorSpace`
- `THREE.PCFSoftShadowMap`
- `RoomEnvironment`
- `PMREMGenerator`
- calibrated area, directional, hemisphere, and emissive lighting
- receive/cast shadows enabled on major surfaces

The existing direct Three.js scene should remain deterministic. Avoid `Math.random()` for procedural textures unless seeded.

## Material Profiles

Recommended starting profiles:

- top cabinets and floor-to-ceiling side cabinets: light matte finish
- medium upper cabinets: warm wood material with subtle grain texture
- counter: light quartz, low roughness, mild clearcoat
- tile backsplash and shaft wall: bitmap texture, physically repeated
- LED strips: warm emissive material, not only point lights
- metal hardware/faucet: high metalness, lower roughness
- glass: transparent material with controlled opacity

Keep the profile names stable so all views can map semantic roles to visuals consistently.

## Tile Texture Metadata

The tile image should be treated as a real material, not simplified into a procedural pattern. Store metadata next to the material profile:

- source image path
- tile physical width: `600 mm`
- tile physical height: `1200 mm`
- intended orientation
- repeat policy

Every tiled surface should compute repeat count from physical surface size. This keeps backsplash, walls below the window, shaft wall, and future tiled zones visually consistent.

## Future React Three Fiber

React Three Fiber can be introduced later as a separate experimental renderer only after the direct Three.js renderer is clean. It should consume the same render configuration and material factory. Do not duplicate scene dimensions or material definitions in a parallel renderer.

## Future Blender Cycles

Blender should be added as an offline render path, not as a replacement for the browser renderer.

Planned skeleton:

- `blender/kitchen_rule9.py`
- `docs/rendering/BLENDER_CYCLES.md`
- optional wrapper script for local manual execution

The Blender script should read the same layout JSON and render material profiles, then map them to Principled BSDF settings. Suggested quality target:

- 3840 x 2160 output
- 512 samples
- adaptive sampling enabled
- OpenImageDenoise
- max bounces around 8

Do not execute Blender from the app. Treat it as an opt-in high-quality export workflow.

## Implementation Order

1. Centralize render configuration and material profiles.
2. Replace inline Three.js material literals with a material factory.
3. Move lighting and camera presets into shared config.
4. Use physical tile metadata for repeat scaling.
5. Upgrade shadows, tone mapping, environment, and deterministic textures.
6. Add optional headless screenshot/validation scripts.
7. Add Blender Cycles script skeleton.
8. Consider React Three Fiber only if it reduces renderer complexity.
