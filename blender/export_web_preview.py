"""Export the authored whole-home Blender lighting scene for the web viewer.

Run from the repository root:
  blender --background --python blender/export_web_preview.py
"""

from pathlib import Path
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "blender/whole_home/lighting/A501-whole-home-lighting.blend"
OUTPUT = ROOT / "react-configurator/public/models/A501-blender-lighting.glb"

bpy.ops.wm.open_mainfile(filepath=str(SOURCE))

# The ceiling panels obscure the interior from the orbit camera. The authored
# source remains untouched; only the web export omits these panels.
ceilings = [obj for obj in bpy.data.objects if "sand ceiling" in obj.name]
for obj in ceilings:
    bpy.data.objects.remove(obj, do_unlink=True)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_cameras=False,
    export_lights=False,
    export_apply=True,
)
print(f"WEB_PREVIEW_EXPORT {OUTPUT} {OUTPUT.stat().st_size} bytes; omitted {len(ceilings)} ceiling panels", flush=True)
