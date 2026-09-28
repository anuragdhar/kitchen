# Whole-home PBR materials

Interior studio → Materials controls the whole-home finish, or a room override.
Teak, white oak, red oak and cherry use separate species-labeled Poly Haven CC0
veneer sets. Natural plaster uses Beige Wall 001; ivory/white plaster use its
normal and roughness with paint colour. Source URLs, licensing, physical scale,
byte lengths and SHA-256 hashes are in public/materials/manifest.json. The 1k JPEG
maps are bundled and served locally, not fetched from Poly Haven at runtime.

Only explicit wood/plaster material roles are themed. Steel racks, appliances,
metal trim, mirrors, glass, upholstery, stone and intentionally tiled walls keep
their authored materials. Original mode restores authored materials and UVs.
The initial appearance is teak wood and ivory plaster. Existing kitchen project
colour values remain saved unchanged beneath this whole-home rendering override.

Mappings cover the seven existing room/whole-home renderers, including shared
bedroom, pooja, entry, lobby and study furniture factories. Mounted renderer
coverage and map loading errors are displayed. Unmounted rooms adopt the current
settings when opened. Room-specific overrides inherit unspecified global values.
Existing structural and room configuration files are not edited by theme changes.

Texture mapping projects physical metre-scaled UVs onto cloned geometries. Mesh
positions, indices, transforms, dimensions and visibility are preserved. Original
geometry/material ownership is restored before legacy scene cleanup; generated
materials and textures are disposed by the binding. No blanket name-based colour
replacement or rewriting of generated reference drawings is used.

Appearance is stored separately in home-interior.appearance.v1. A previous value
is retained. A changed value from another tab or unreadable stored document blocks
silent overwrites. This is optimistic conflict detection, not simultaneous-write
locking. Keep exported project/reference data outside browser storage as well.

Tests check asset hashes, semantic roles, bounded scale and inheritance, plus the
actual entry-room WebGL scene: all four species resolve maps, pixel output changes,
geometry and non-themed materials stay invariant, and navigation cleans up and
recreates bindings. This is not proof of physically calibrated lighting or an
approved photorealistic reference match. A full room-by-room artistic review and
higher-resolution maps can refine the result further.
