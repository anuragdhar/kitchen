"""Render a warm Drawing Room material concept from the shared home GLB."""

from pathlib import Path
from mathutils import Vector
import bpy

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "exports" / "coohom" / "files" / "A501-furnished-reference.glb"
OUTPUT = ROOT / "blender" / "drawing_room"
PLASTER = ROOT / "blender" / "assets" / "beige_wall_001"
OUTPUT.mkdir(parents=True, exist_ok=True)


def material(name, color, roughness=0.85):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1)
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    return mat


def plaster_texture(mat, scale=115, strength=.08, distance=.004):
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 2
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])


def paint_variation(mat, dark, light):
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.5
    noise.inputs["Detail"].default_value = 3
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = .25
    ramp.color_ramp.elements[0].color = (*dark, 1)
    ramp.color_ramp.elements[1].position = .75
    ramp.color_ramp.elements[1].color = (*light, 1)
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])


def photographed_plaster(mat):
    """Poly Haven Beige Wall 001, CC0: measured color, normal, roughness maps."""
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    coords = nodes.new("ShaderNodeTexCoord")
    diffuse = nodes.new("ShaderNodeTexImage")
    diffuse.image = bpy.data.images.load(str(PLASTER / "diffuse.jpg"), check_existing=True)
    diffuse.projection = "BOX"
    diffuse.projection_blend = .22
    links.new(coords.outputs["Generated"], diffuse.inputs["Vector"])
    tint = nodes.new("ShaderNodeHueSaturation")
    tint.inputs["Saturation"].default_value = .76
    tint.inputs["Value"].default_value = 1.28
    links.new(diffuse.outputs["Color"], tint.inputs["Color"])
    links.new(tint.outputs["Color"], shader.inputs["Base Color"])
    rough = nodes.new("ShaderNodeTexImage")
    rough.image = bpy.data.images.load(str(PLASTER / "roughness.jpg"), check_existing=True)
    rough.image.colorspace_settings.name = "Non-Color"
    rough.projection = "BOX"
    rough.projection_blend = .22
    links.new(coords.outputs["Generated"], rough.inputs["Vector"])
    links.new(rough.outputs["Color"], shader.inputs["Roughness"])
    normal = nodes.new("ShaderNodeTexImage")
    normal.image = bpy.data.images.load(str(PLASTER / "normal.jpg"), check_existing=True)
    normal.image.colorspace_settings.name = "Non-Color"
    normal.projection = "BOX"
    normal.projection_blend = .22
    links.new(coords.outputs["Generated"], normal.inputs["Vector"])
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = .35
    links.new(normal.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], shader.inputs["Normal"])


def cube(name, center, dimensions, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


def area(name, position, target, power, size, color=(1, 1, 1)):
    bpy.ops.object.light_add(type="AREA", location=position)
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.size = size
    light.data.color = color
    light.rotation_euler = (Vector(target) - light.location).to_track_quat("-Z", "Y").to_euler()


def chandelier(center):
    metal = material("Existing chandelier bronze placeholder", (.42, .31, .20), .36)
    lens = material("Existing chandelier warm diffuser", (.97, .87, .70), .65)
    shader = lens.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Emission Color"].default_value = (1, .73, .43, 1)
    shader.inputs["Emission Strength"].default_value = .7
    cube("Chandelier ceiling canopy", (center[0], center[1], 2.67), (.16, .16, .035), metal, .015)
    cube("Chandelier suspension", (center[0], center[1], 2.45), (.012, .012, .42), metal)
    for radius, tube, height, mat in ((.34, .025, 2.22, metal), (.31, .017, 2.196, lens)):
        bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=tube, major_segments=48, minor_segments=12, location=(center[0], center[1], height))
        obj = bpy.context.object
        obj.name = "Existing chandelier schematic"
        obj.data.materials.append(mat)


def main():
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    # GLB is Z-up in Blender; exported plan north points toward negative Y.
    x1, x2 = 515 * 4.993 / 260, 688 * 4.993 / 260
    y_south, y_north = -449 * 3.277 / 163, -715 * 3.277 / 163
    kept = 0
    for obj in list(bpy.data.objects):
        if obj.type != "MESH":
            continue
        center = sum((obj.matrix_world @ Vector(c) for c in obj.bound_box), Vector()) / 8
        if not (x1 - .12 <= center.x <= x2 + .12 and y_north - .12 <= center.y <= y_south + .12):
            bpy.data.objects.remove(obj, do_unlink=True)
        else:
            kept += 1
            # Remove the front wall only for this eye-level cutaway render.
            if abs(center.y - y_south) < .095 and center.z > .65:
                obj.hide_render = True
    print("DRAWING_ROOM_RETAINED_MESHES", kept)

    walls = bpy.data.materials.get("Material_0")
    if walls:
        walls.name = "Poly Haven Beige Wall 001 — warm painted plaster"
        walls.diffuse_color = (.64, .51, .40, 1)
        shader = walls.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = (.64, .51, .40, 1)
        shader.inputs["Roughness"].default_value = .91
        photographed_plaster(walls)

    cx, cy = (x1 + x2) / 2, (y_north + y_south) / 2
    floor = material("Warm ivory stone floor", (.77, .70, .60), .72)
    ceiling = material("Soft sand cream ceiling", (.77, .65, .54), .95)
    rug = material("Woven natural jute rug", (.53, .41, .30), .98)
    plaster_texture(ceiling, 80, .045, .003)
    paint_variation(ceiling, (.75, .64, .53), (.79, .68, .57))
    plaster_texture(rug, 230, .22, .006)
    plaster_texture(floor, 160, .025, .002)
    fabric = bpy.data.materials.get("Material_23")
    if fabric:
        fabric.name = "Warm ivory sofa upholstery"
        fabric.diffuse_color = (.64, .53, .43, 1)
        fabric.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (.64, .53, .43, 1)
        plaster_texture(fabric, 260, .18, .002)
    table = bpy.data.materials.get("Material_24")
    if table:
        table.name = "Medium honey oak coffee table"
        table.diffuse_color = (.43, .27, .14, 1)
        table.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (.43, .27, .14, 1)
        table.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = .48
    cube("Drawing Room floor finish", (cx, cy, -.018), (x2-x1-.10, y_south-y_north-.10, .035), floor)
    cube("Tinted Drawing Room ceiling", (cx, cy, 2.74), (x2-x1+.10, y_south-y_north+.10, .07), ceiling)
    cube("Natural woven rug", (cx+.13, cy+.08, .03), (1.80, 2.37, .018), rug, .012)
    cushion = material("Ivory linen seat cushions", (.73, .64, .54), .97)
    clay = material("Muted clay cushions", (.47, .30, .23), .96)
    plaster_texture(cushion, 210, .15, .002)
    plaster_texture(clay, 210, .15, .002)
    for y in (-11.23, -11.95, -12.67):
        cube("Soft sofa seat cushion", (12.53, y, .55), (.57, .67, .12), cushion, .055)
    for y, mat in ((-11.23, clay), (-12.67, cushion)):
        cube("Sofa back cushion", (12.83, y, .80), (.13, .54, .43), mat, .05)

    # The photo's warm pools of light are a material and lighting reference.
    # Use surface lights under the modeled ceiling, without altering the plan.
    table_x = x2 - 1.745 / 3.353 * (x2-x1)
    table_y = y_north + 2.420 / 5.335 * (y_south-y_north)
    chandelier((table_x, table_y))
    area("Existing chandelier ambient glow", (table_x, table_y, 2.17), (table_x, table_y, .42), 260, 1.4, (1.0, .79, .55))
    wall_y = y_north + .85 / 5.335 * (y_south-y_north)
    sconce_metal = material("West sconce bronze", (.25, .20, .16), .44)
    sconce_glow = material("West sconce opal", (.93, .80, .62), .7)
    sconce_glow.node_tree.nodes.get("Principled BSDF").inputs["Emission Color"].default_value = (1, .72, .43, 1)
    sconce_glow.node_tree.nodes.get("Principled BSDF").inputs["Emission Strength"].default_value = .55
    cube("West wall uplight body", (x2-.045, wall_y, 1.80), (.06, .14, .19), sconce_metal, .01)
    cube("West wall uplight diffuser", (x2-.05, wall_y, 1.90), (.05, .11, .025), sconce_glow, .005)
    area("West wall upward bounce", (x2-.13, wall_y, 1.95), (x2-.25, wall_y, 2.6), 35, .5, (1, .76, .52))
    area("Ceiling bounce", (cx, cy, 2.48), (cx, cy, 2.74), 70, 3.0, (1.0, .88, .75))
    area("Soft south window daylight", (cx, y_south+.45, 2.05), (cx, cy, 1.05), 240, 2.2, (1.0, .91, .79))
    area("Lobby bounce", (x1-.5, cy, 2.1), (cx, cy, 1.0), 100, 2.0, (1.0, .83, .67))

    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes.get("Background").inputs["Color"].default_value = (.81, .73, .64, 1)
    world.node_tree.nodes.get("Background").inputs["Strength"].default_value = .16

    bpy.ops.object.camera_add(location=(cx, y_south+1.02, 1.56))
    cam = bpy.context.object
    cam.name = "Drawing Room eye-level toward entry"
    cam.rotation_euler = (Vector((cx-.18, y_north+1.12, 1.25)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 22

    scene = bpy.context.scene
    scene.camera = cam
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.use_raytracing = True
    scene.render.resolution_x = 1500
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.1
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "A501-drawing-warm-reference.blend"))
    scene.render.filepath = str(OUTPUT / "A501-drawing-warm-reference.png")
    bpy.ops.render.render(write_still=True)
    print("DRAWING_ROOM_WARM_RENDER_COMPLETE", scene.render.filepath)


if __name__ == "__main__":
    main()
