"""Create a focused, editable Bedroom 3 scene from the shared home model."""

from pathlib import Path
from mathutils import Vector
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "blender" / "bedroom3" / "open-source" / "A501-furnished-reference.glb"
OUTPUT = ROOT / "blender" / "bedroom3"


def camera(name, position, target, scale):
    bpy.ops.object.camera_add(location=position)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    obj.data.type = "ORTHO"
    obj.data.ortho_scale = scale
    return obj


def light(name, position, power, size, target):
    bpy.ops.object.light_add(type="AREA", location=position)
    obj = bpy.context.object
    obj.name = name
    obj.data.energy = power
    obj.data.size = size
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def floor(name, center, size, color):
    bpy.ops.mesh.primitive_plane_add(size=2, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.scale = (size[0] / 2, size[1] / 2, 1)
    mat = bpy.data.materials.new(name + " finish")
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = 0.82
    obj.data.materials.append(mat)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    keep_count = 0
    for obj in list(bpy.data.objects):
        if obj.type != "MESH":
            continue
        corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        center = sum(corners, Vector()) / len(corners)
        if not (0.72 <= center.x <= 5.08 and -8.1 <= center.y <= -1.25):
            bpy.data.objects.remove(obj, do_unlink=True)
        else:
            keep_count += 1
    print("BEDROOM3_MESHES", keep_count)

    wall = bpy.data.materials.get("Material_0")
    if wall:
        wall.name = "Warm pink clay wall"
        wall.diffuse_color = (0.70, 0.53, 0.48, 1)
        wall.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (0.70, 0.53, 0.48, 1)

    floor("Bedroom 3 warm beige oak floor", (2.95, -5.9, -0.035), (4.15, 3.88), (0.60, 0.46, 0.35))
    floor("Bedroom 3 balcony stone", (2.95, -2.75, -0.04), (4.15, 2.35), (0.67, 0.57, 0.50))

    light("Soft daylight from south balcony", (2.2, 0.5, 6.7), 950, 5.0, (3, -5.4, 0.7))
    light("Wardrobe daylight fill", (0.2, -5.8, 5.0), 750, 4.0, (4.2, -6.2, 1.3))
    light("Warm interior fill", (3.0, -8.2, 4.5), 450, 3.0, (2.8, -5.7, 1.0))
    world = bpy.context.scene.world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.84, 0.79, 0.74, 1)
    background.inputs["Strength"].default_value = 0.55

    overview = camera("Bedroom 3 overview", (0.0, -1.0, 8.6), (2.95, -5.4, 0.55), 8.6)
    vanity = camera("Northwest integrated vanity", (0.1, -3.6, 4.6), (4.25, -6.45, 1.25), 5.2)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1500
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.camera = overview
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "A501-bedroom3-detail.blend"))
    for cam, filename in [(overview, "A501-bedroom3-overview.png"), (vanity, "A501-bedroom3-vanity.png")]:
        scene.camera = cam
        scene.render.filepath = str(OUTPUT / filename)
        bpy.ops.render.render(write_still=True)
    print("BEDROOM3_RENDER_COMPLETE", str(OUTPUT))


if __name__ == "__main__":
    main()
