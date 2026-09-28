"""A material and lighting pass for the editable Bedroom 3 Blender scene."""

from pathlib import Path
import argparse
import hashlib
import json
import math
import random
import sys

import bpy
from mathutils import Vector


OUTPUT = Path(__file__).resolve().parent / "bedroom3"
SOURCE = OUTPUT / "A501-bedroom3-detail.blend"
WOOD_TEXTURES = Path(__file__).resolve().parents[1] / "react-configurator/public/textures/wood095"
random.seed(23)


def material(name, color, roughness=0.75):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def noise_bump(mat, scale, strength, distance):
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    tex = nodes.new("ShaderNodeTexNoise")
    coords = nodes.new("ShaderNodeTexCoord")
    # Object coordinates are metres for these applied-scale meshes. Generated
    # coordinates stretch the texture differently on every piece of furniture.
    links.new(coords.outputs["Object"], tex.inputs["Vector"])
    tex.inputs["Scale"].default_value = scale
    tex.inputs["Detail"].default_value = 3
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    links.new(tex.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def honey_oak(mat_name, dark, light, roughness, grain=(36, 48, 1.0)):
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        return
    mat.name = "Honey oak grain — " + mat_name
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    coords = nodes.new("ShaderNodeTexCoord")
    # Use the same metre-based reference across imported and generated meshes.
    reference = bpy.data.objects.get("Wood texture metre reference")
    if reference is None:
        reference = bpy.data.objects.new("Wood texture metre reference", None)
        bpy.context.collection.objects.link(reference)
    coords.object = reference
    separate = nodes.new("ShaderNodeSeparateXYZ")
    combine = nodes.new("ShaderNodeCombineXYZ")
    links.new(coords.outputs["Object"], separate.inputs[0])
    links.new(separate.outputs["Y" if grain == (9, 1.2, 24) else "Z"], combine.inputs["X"])
    across = nodes.new("ShaderNodeMath")
    across.operation = "ADD"
    links.new(separate.outputs["X"], across.inputs[0])
    if grain != (9, 1.2, 24):
        links.new(separate.outputs["Y"], across.inputs[1])
    links.new(across.outputs[0], combine.inputs["Y"])
    mapping = nodes.new("ShaderNodeVectorMath")
    mapping.operation = "SCALE"
    mapping.inputs[3].default_value = 0.7
    links.new(combine.outputs[0], mapping.inputs[0])
    maps = {}
    for filename in ("color.jpg", "roughness.jpg", "displacement.jpg"):
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = bpy.data.images.load(str(WOOD_TEXTURES / filename), check_existing=True)
        if filename != "color.jpg":
            texture.image.colorspace_settings.name = "Non-Color"
        links.new(mapping.outputs[0], texture.inputs["Vector"])
        maps[filename] = texture
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.12
    ramp.color_ramp.elements[0].color = (*dark, 1)
    ramp.color_ramp.elements[1].position = 0.65
    ramp.color_ramp.elements[1].color = (*light, 1)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.07
    bump.inputs["Distance"].default_value = 0.00025
    links.new(maps["color.jpg"].outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(maps["displacement.jpg"].outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = roughness
    rough = nodes.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = max(0.2, roughness - 0.12)
    rough.inputs["To Max"].default_value = roughness + 0.12
    links.new(maps["roughness.jpg"].outputs["Color"], rough.inputs["Value"])
    links.new(rough.outputs[0], bsdf.inputs["Roughness"])
    # Cycles-only shading bevel adds edge highlights without altering meshes.
    edge = nodes.new("ShaderNodeBevel")
    edge.inputs["Radius"].default_value = 0.001
    edge.samples = 4
    links.new(bump.outputs["Normal"], edge.inputs["Normal"])
    links.new(edge.outputs["Normal"], bsdf.inputs["Normal"])
    mat.diffuse_color = (*light, 1)


def cushion(name, center, dimensions, mat):
    """Puffed sewn silhouette inside the existing decorative pillow envelope."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1, location=center)
    obj = bpy.context.object
    obj.name = name
    for vertex in obj.data.vertices:
        x, y, z = vertex.co
        vertex.co.x = math.copysign(abs(x) ** 0.48, x)
        vertex.co.y = math.copysign(abs(y) ** 0.48, y)
        vertex.co.z = z * (1 + 0.035 * math.sin(30 * x + 7 * y) * (1 - z * z))
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def folded_cloth(name, center, dimensions, mat):
    """Small uneven folds within the previous throw footprint, in metres."""
    nx, ny = 36, 100
    vertices, faces = [], []
    for j in range(ny + 1):
        y = j / ny
        for i in range(nx + 1):
            x = i / nx
            # Keep the underside above the measured duvet top: z=0.5075 m.
            z = 0.018 + 0.005 * math.sin(y * 17 * math.pi + 0.6 * math.sin(x * 5))
            z += 0.002 * math.sin(y * 31 + x * 7)
            vertices.append(((x - 0.5) * dimensions[0], (y - 0.5) * dimensions[1], z))
            if i < nx and j < ny:
                a = j * (nx + 1) + i
                faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = center
    mesh.materials.append(mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    solidify = obj.modifiers.new("Folded fabric thickness", "SOLIDIFY")
    solidify.thickness = 0.003
    return obj


def box(name, center, dimensions, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Softened edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


def camera(name, position, target, lens):
    bpy.ops.object.camera_add(location=position)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    obj.data.lens = lens
    return obj


def render(cam, filename):
    scene = bpy.context.scene
    scene.camera = cam
    scene.render.filepath = str(OUTPUT / filename)
    bpy.ops.render.render(write_still=True)


def main():
    global OUTPUT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--engine", choices=("CYCLES", "BLENDER_EEVEE"), default="CYCLES")
    parser.add_argument("--device", choices=("CPU", "HIP"), default="HIP")
    parser.add_argument("--output", type=Path, default=OUTPUT / "daylight")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    OUTPUT = args.output.resolve()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Always start from the authored source: repeated runs must not multiply
    # lights, duplicate props or accumulate material nodes.
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    baseline = {o.name: (tuple(tuple(row) for row in o.matrix_world), tuple(v.co[:] for v in o.data.vertices))
                for o in scene.objects if o.type == "MESH"}
    wall = bpy.data.materials["Warm pink clay wall"]
    noise_bump(wall, 190, 0.12, 0.0003)
    honey_oak("Material_69", (0.28, 0.15, 0.07), (0.45, 0.27, 0.13), 0.39)
    honey_oak("Material_68", (0.25, 0.13, 0.06), (0.41, 0.23, 0.11), 0.52)
    honey_oak("Material_60", (0.26, 0.14, 0.06), (0.43, 0.25, 0.12), 0.5)
    honey_oak("Material_61", (0.28, 0.15, 0.07), (0.45, 0.27, 0.13), 0.39)
    honey_oak("Material_58", (0.22, 0.12, 0.065), (0.32, 0.21, 0.12), 0.5)
    for name, color in [("Material_57", (0.34, 0.39, 0.33)),
                        ("Material_56", (0.64, 0.60, 0.52)),
                        ("Material_59", (0.47, 0.28, 0.25))]:
        fabric = bpy.data.materials[name]
        surface = fabric.node_tree.nodes.get("Principled BSDF")
        surface.inputs["Base Color"].default_value = (*color, 1)
        surface.inputs["Roughness"].default_value = 0.88
        surface.inputs["Sheen Weight"].default_value = 0.3
        noise_bump(fabric, 950, 0.3, 0.0005)
        # Broad wrinkles are normal detail only: the source mattress stays intact.
        if name == "Material_57":
            nodes, links = fabric.node_tree.nodes, fabric.node_tree.links
            fine = surface.inputs["Normal"].links[0].from_socket
            noise = nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 24
            bump = nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = 0.3
            bump.inputs["Distance"].default_value = 0.007
            links.new(noise.outputs["Fac"], bump.inputs["Height"])
            links.new(fine, bump.inputs["Normal"])
            links.new(bump.outputs["Normal"], surface.inputs["Normal"])
    mirror = bpy.data.materials.get("Material_64")
    if mirror:
        mirror.name = "Clear vanity mirror"
        mirror.diffuse_color = (0.95, 0.95, 0.95, 1)
        surface = mirror.node_tree.nodes.get("Principled BSDF")
        surface.inputs["Base Color"].default_value = (0.95, 0.95, 0.95, 1)
        surface.inputs["Metallic"].default_value = 1.0
        surface.inputs["Roughness"].default_value = 0.02
    for mat in bpy.data.materials:
        if mat == wall or not mat.use_nodes:
            continue
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf and not bsdf.inputs["Roughness"].is_linked and mat.name.startswith("Material_"):
            bsdf.inputs["Roughness"].default_value = max(0.35, bsdf.inputs["Roughness"].default_value)

    old_floor = bpy.data.objects.get("Bedroom 3 warm beige oak floor")
    if old_floor:
        old_floor.hide_render = True
    oak = [
        material("Natural oak — honey", (0.48, 0.32, 0.21)),
        material("Natural oak — warm", (0.55, 0.39, 0.27)),
        material("Natural oak — light", (0.61, 0.46, 0.34)),
        material("Natural oak — muted", (0.52, 0.38, 0.29)),
    ]
    for mat in oak:
        color = tuple(mat.diffuse_color[:3])
        honey_oak(mat.name, tuple(c * 0.75 for c in color), color, 0.48, (9, 1.2, 24))
    for index in range(25):
        x = 1.00 + index * 0.158
        shade = random.choice(oak)
        box("Oak floor plank", (x, -5.89, -0.013), (0.153, 3.75, 0.024), shade, 0.0015)

    rug = material("Woven sand and rose rug", (0.50, 0.39, 0.35), 0.96)
    noise_bump(rug, 750, 0.35, 0.0008)
    box("Bedside woven rug", (2.02, -5.90, 0.012), (2.08, 2.31, 0.015), rug, 0.018)
    pillow = material("Linen pillow — clay", (0.47, 0.28, 0.25), 0.95)
    noise_bump(pillow, 950, 0.25, 0.0004)
    pillow.node_tree.nodes.get("Principled BSDF").inputs["Sheen Weight"].default_value = 0.28
    for y in (-5.43, -6.33):
        cushion("Soft clay pillow", (1.28, y, 0.54), (0.46, 0.57, 0.14), pillow)
    throw = material("Linen throw — warm ivory", (0.71, 0.64, 0.55), 0.94)
    noise_bump(throw, 850, 0.22, 0.0004)
    folded_cloth("Folded linen throw", (2.48, -5.91, 0.50), (0.42, 1.52, 0.05), throw)

    # The view looks into the room from the balcony side. Hide only the front
    # wall and balcony rail meshes for this cutaway image.
    hidden = 0
    for obj in scene.objects:
        if obj.type != "MESH" or not obj.name.startswith("Element"):
            continue
        center = sum((obj.matrix_world @ Vector(c) for c in obj.bound_box), Vector()) / 8
        glazing = any(mat and mat.diffuse_color[3] < 0.8 for mat in obj.data.materials)
        if center.y > -3.92 or glazing:
            obj.hide_render = True
            hidden += 1
    print("BEDROOM3_FRONT_OBJECTS_HIDDEN", hidden)

    # Match the existing 2.7 m wall tops. This render-only ceiling closes the
    # light transport shell without moving any authored surface or furniture.
    ceiling = material("Matte warm white ceiling", (0.72, 0.69, 0.64), 0.9)
    box("Render ceiling", (2.93, -5.91, 2.72), (3.94, 3.86, 0.04), ceiling)
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.66, 0.77, 1.0, 1)
    background.inputs["Strength"].default_value = 0.12
    for obj in scene.objects:
        if obj.type == "LIGHT":
            obj.data.energy = 0
    bpy.ops.object.light_add(type="AREA", location=(2.6, -3.7, 2.05))
    daylight = bpy.context.object
    daylight.name = "Balcony daylight softbox"
    daylight.data.energy = 100
    daylight.data.shape = "RECTANGLE"
    daylight.data.size = 2.5
    daylight.data.size_y = 1.8
    daylight.data.color = (0.82, 0.90, 1.0)
    daylight.rotation_euler = (Vector((2.8, -6.1, 0.8)) - daylight.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 5))
    sun = bpy.context.object
    sun.name = "Warm afternoon sun"
    sun.data.energy = 2.5
    sun.data.angle = math.radians(5)
    sun.data.color = (1.0, 0.79, 0.57)
    sun.rotation_euler = Vector((0.35, -1.0, -0.22)).to_track_quat("-Z", "Y").to_euler()
    # Level cameras keep architectural verticals parallel; optical shift
    # includes more floor without tilting the whole room.
    overview = camera("Bedroom 3 eye-level interior", (2.8, -4.10, 1.45), (2.8, -6.25, 1.45), 20)
    overview.data.shift_y = -0.12
    vanity = camera("Bedroom 3 eye-level vanity", (1.65, -4.25, 1.45), (4.35, -6.25, 1.45), 30)
    vanity.data.shift_y = -0.08

    scene.render.engine = args.engine
    if args.engine == "CYCLES":
        if args.device == "HIP":
            preferences = bpy.context.preferences.addons["cycles"].preferences
            preferences.compute_device_type = "HIP"
            preferences.get_devices()
            available = [d for d in preferences.devices if d.type == "HIP"]
            if not available:
                raise RuntimeError("No HIP GPU available; choose --device CPU or --engine BLENDER_EEVEE")
            for device in preferences.devices:
                device.use = device.type == "HIP"
            scene.cycles.device = "GPU"
        else:
            scene.cycles.device = "CPU"
        scene.cycles.samples = 32 if args.preview else 256
        scene.cycles.use_denoising = True
        scene.cycles.use_adaptive_sampling = True
        scene.cycles.adaptive_threshold = 0.03 if args.preview else 0.01
        scene.cycles.max_bounces = 12
        scene.cycles.diffuse_bounces = 6
        scene.cycles.glossy_bounces = 6
        scene.cycles.seed = 23
    else:
        scene.eevee.use_raytracing = True
        scene.eevee.taa_render_samples = 128
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1150
    scene.render.resolution_percentage = 50 if args.preview else 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.0
    scene.camera = overview
    for name, (matrix, vertices) in baseline.items():
        obj = bpy.data.objects[name]
        assert tuple(tuple(row) for row in obj.matrix_world) == matrix, f"Authored transform changed: {name}"
        assert tuple(v.co[:] for v in obj.data.vertices) == vertices, f"Authored mesh changed: {name}"
    provenance = {
        "source": str(SOURCE), "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "generator": str(Path(__file__).resolve()),
        "generator_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "blender": bpy.app.version_string, "arguments": vars(args) | {"output": str(OUTPUT)},
        "authored_meshes_unchanged": len(baseline),
        "coordinates": "Blender metres; Z up; no change to authored geometry",
    }
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "A501-bedroom3-realistic.blend"))
    render(overview, "A501-bedroom3-realistic-overview.png")
    render(vanity, "A501-bedroom3-realistic-vanity.png")
    provenance["renders"] = {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                             for path in OUTPUT.glob("A501-bedroom3-realistic-*.png")}
    provenance["completed"] = True
    (OUTPUT / "provenance.json").write_text(json.dumps(provenance, indent=2), encoding="utf-8")
    print("BEDROOM3_REALISTIC_RENDER_COMPLETE")


if __name__ == "__main__":
    main()
