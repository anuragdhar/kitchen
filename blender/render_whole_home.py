"""Create an editable Blender scene and two first-pass home renders.

Run with Blender in background mode. The source GLB comes from the app's
whole-home exporter, so this scene is a visual concept rather than a survey.
"""

from pathlib import Path
from mathutils import Vector
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "exports" / "coohom" / "files" / "A501-furnished-reference.glb"
OUTPUT = ROOT / "blender" / "whole_home"


def make_camera(name, position, target, ortho_scale):
    bpy.ops.object.camera_add(location=position)
    camera = bpy.context.object
    camera.name = name
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = ortho_scale
    return camera


def make_area(name, position, power, size, target):
    bpy.ops.object.light_add(type="AREA", location=position)
    lamp = bpy.context.object
    lamp.name = name
    lamp.data.energy = power
    lamp.data.shape = "DISK"
    lamp.data.size = size
    lamp.rotation_euler = (Vector(target) - lamp.location).to_track_quat("-Z", "Y").to_euler()


def make_floor(bounds):
    low, high = bounds
    cx = (low.x + high.x) / 2
    cy = (low.y + high.y) / 2
    bpy.ops.mesh.primitive_plane_add(size=2, location=(cx, cy, -0.035))
    plane = bpy.context.object
    plane.name = "Continuous warm stone floor — concept only"
    plane.scale = ((high.x - low.x) / 2 + 0.2, (high.y - low.y) / 2 + 0.2, 1)
    material = bpy.data.materials.new("Warm ivory matte stone")
    material.diffuse_color = (0.69, 0.58, 0.51, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (0.69, 0.58, 0.51, 1)
    shader.inputs["Roughness"].default_value = 0.82
    plane.data.materials.append(material)


def render(camera, filename):
    scene = bpy.context.scene
    scene.camera = camera
    scene.render.filepath = str(OUTPUT / filename)
    bpy.ops.render.render(write_still=True)


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    # The export emits the shared wall finish first. Give it the requested
    # muted clay-beige tone while preserving the other source materials.
    wall_finish = bpy.data.materials["Material_0"]
    wall_finish.name = "Muted earthen blush walls"
    wall_finish.diffuse_color = (0.70, 0.53, 0.48, 1)
    wall_finish.use_nodes = True
    wall_bsdf = wall_finish.node_tree.nodes.get("Principled BSDF")
    wall_bsdf.inputs["Base Color"].default_value = (0.70, 0.53, 0.48, 1)
    wall_bsdf.inputs["Roughness"].default_value = 0.88
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    vertices = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    low = Vector(tuple(min(point[axis] for point in vertices) for axis in range(3)))
    high = Vector(tuple(max(point[axis] for point in vertices) for axis in range(3)))
    print("HOME_BOUNDS", tuple(low), tuple(high), "MESHES", len(meshes))
    make_floor((low, high))

    center = ((low.x + high.x) / 2, (low.y + high.y) / 2, 0.6)
    make_area("South daylight", (center[0] - 2, high.y + 3, 10), 2300, 10, center)
    make_area("North soft fill", (center[0] + 2, low.y - 3, 11), 1900, 10, center)
    make_area("East soft fill", (high.x + 4, center[1], 10), 1400, 8, center)

    world = bpy.context.scene.world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.78, 0.84, 0.9, 1)
    background.inputs["Strength"].default_value = 0.6

    top = make_camera("Plan aligned top — south up", (center[0], center[1], 28), center, 21.0)
    angle = make_camera(
        "Whole home angled overview",
        (center[0] + 14, high.y + 12, 23),
        (center[0], center[1], 0.3),
        25.0,
    )
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"

    scene.camera = angle
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "A501-whole-home.blend"))
    render(angle, "A501-whole-home-angled.png")
    render(top, "A501-whole-home-plan-aligned.png")
    print("WHOLE_HOME_RENDER_COMPLETE", str(OUTPUT))


if __name__ == "__main__":
    main()
