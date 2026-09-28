"""A material and lighting pass for the editable Bedroom 3 Blender scene."""

from pathlib import Path
import random

import bpy
from mathutils import Vector


OUTPUT = Path(__file__).resolve().parent / "bedroom3"
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
    tex.inputs["Scale"].default_value = scale
    tex.inputs["Detail"].default_value = 3
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    links.new(tex.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def honey_oak(mat_name, dark, light, roughness):
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        return
    mat.name = "Honey oak grain — " + mat_name
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    coords = nodes.new("ShaderNodeTexCoord")
    stretch = nodes.new("ShaderNodeVectorMath")
    stretch.operation = "MULTIPLY"
    stretch.inputs[1].default_value = (36, 48, 1.0)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.0
    noise.inputs["Detail"].default_value = 3.2
    noise.inputs["Roughness"].default_value = 0.68
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.28
    ramp.color_ramp.elements[0].color = (*dark, 1)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (*light, 1)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.07
    bump.inputs["Distance"].default_value = 0.003
    links.new(coords.outputs["Generated"], stretch.inputs[0])
    links.new(stretch.outputs["Vector"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = roughness
    mat.diffuse_color = (*light, 1)


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
    scene = bpy.context.scene
    wall = bpy.data.materials["Warm pink clay wall"]
    noise_bump(wall, 100, 0.10, 0.012)
    honey_oak("Material_69", (0.28, 0.15, 0.07), (0.45, 0.27, 0.13), 0.39)
    honey_oak("Material_68", (0.25, 0.13, 0.06), (0.41, 0.23, 0.11), 0.52)
    honey_oak("Material_60", (0.26, 0.14, 0.06), (0.43, 0.25, 0.12), 0.5)
    honey_oak("Material_61", (0.28, 0.15, 0.07), (0.45, 0.27, 0.13), 0.39)
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
        noise_bump(mat, 48, 0.08, 0.006)
    for index in range(25):
        x = 1.00 + index * 0.158
        shade = oak[index % len(oak)]
        box("Oak floor plank", (x, -5.89, -0.013), (0.153, 3.75, 0.024), shade, 0.0015)

    rug = material("Woven sand and rose rug", (0.50, 0.39, 0.35), 0.96)
    noise_bump(rug, 180, 0.25, 0.004)
    box("Bedside woven rug", (2.02, -5.90, 0.012), (2.08, 2.31, 0.015), rug, 0.018)
    pillow = material("Linen pillow — clay", (0.47, 0.28, 0.25), 0.95)
    noise_bump(pillow, 140, 0.16, 0.003)
    for y in (-5.43, -6.33):
        box("Soft clay pillow", (1.28, y, 0.54), (0.46, 0.57, 0.14), pillow, 0.06)
    throw = material("Linen throw — warm ivory", (0.71, 0.64, 0.55), 0.94)
    noise_bump(throw, 130, 0.12, 0.003)
    box("Folded linen throw", (2.48, -5.91, 0.50), (0.42, 1.52, 0.05), throw, 0.022)

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

    scene.world.node_tree.nodes.get("Background").inputs["Strength"].default_value = 0.25
    for obj in scene.objects:
        if obj.type == "LIGHT":
            obj.data.energy *= 0.70
    overview = camera("Bedroom 3 eye-level interior", (2.25, -3.25, 1.72), (3.08, -6.13, 1.16), 27)
    vanity = camera("Bedroom 3 eye-level vanity", (1.55, -4.35, 1.60), (4.40, -6.35, 1.23), 33)

    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.use_raytracing = True
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1150
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.45
    scene.camera = overview
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "A501-bedroom3-realistic.blend"))
    render(overview, "A501-bedroom3-realistic-overview.png")
    render(vanity, "A501-bedroom3-realistic-vanity.png")
    print("BEDROOM3_REALISTIC_RENDER_COMPLETE")


if __name__ == "__main__":
    main()
