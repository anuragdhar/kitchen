"""Bake static Blender illumination into an orbitable glTF, preserving source meshes.

blender --background --python-exit-code 1 --python blender/bake_web_lighting.py -- --scene bedroom3
Use --scene home for the shared whole-home/room model. Sources are never saved.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "home": ROOT / "blender/whole_home/lighting/A501-whole-home-lighting.blend",
    "bedroom3": ROOT / "blender/bedroom3/daylight/A501-bedroom3-realistic.blend",
    "drawing": ROOT / "blender/drawing_room/elegant/A501-drawing-elegant.blend",
}


def reflective_or_transparent(obj):
    # These surfaces need view-dependent reflections/transmission in the viewer.
    for material in obj.data.materials:
        if not material:
            continue
        if material.diffuse_color[3] < 0.98:
            return True
        for node in material.node_tree.nodes if material.use_nodes else []:
            if node.type == "BSDF_PRINCIPLED":
                for socket, threshold in [("Metallic", .6), ("Transmission Weight", .1)]:
                    if node.inputs[socket].default_value > threshold:
                        return True
                if node.inputs["Alpha"].default_value < .98:
                    return True
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scene", choices=SOURCES, default="home")
    parser.add_argument("--size", type=int, default=4096)
    parser.add_argument("--samples", type=int, default=64)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    source = SOURCES[args.scene]
    output = ROOT / "react-configurator/public/models" / f"A501-{args.scene}-baked.glb"
    evidence = ROOT / "blender" / "web-lighting" / args.scene
    evidence.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    preferences = bpy.context.preferences.addons["cycles"].preferences
    preferences.compute_device_type = "HIP"
    preferences.get_devices()
    assert any(d.type == "HIP" for d in preferences.devices), "This bake requires the local HIP GPU"
    for device in preferences.devices:
        device.use = device.type == "HIP"
    scene.cycles.device = "GPU"
    scene.cycles.samples = args.samples
    scene.cycles.max_bounces = 12
    scene.cycles.diffuse_bounces = 6
    scene.cycles.seed = 23

    # Keep ceilings present during light transport. Omit only in the web cutaway.
    meshes = [o for o in scene.objects if o.type == "MESH" and not o.hide_render
              and "sand ceiling" not in o.name and o.name != "Render ceiling"]
    # Unwrap the evaluated surface, including existing bevels. Joining raw cubes
    # before evaluating modifiers loses the non-active objects' bevels and gives
    # the bake different edges from the glTF export.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_meshes = {o.name: bpy.data.meshes.new_from_object(
        o.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph) for o in meshes}
    for obj in meshes:
        obj.data = evaluated_meshes[obj.name]
        obj.modifiers.clear()
    baseline = {o.name: (o.matrix_world.copy(), [v.co.copy() for v in o.data.vertices]) for o in meshes}
    targets = [o for o in meshes if not reflective_or_transparent(o)]
    image = bpy.data.images.new("Baked Blender lighting", width=args.size, height=args.size, float_buffer=True)
    image.colorspace_settings.name = "Linear Rec.709"

    # A shared non-overlapping atlas; the old UV layers/material inputs stay intact
    # during baking. Multi-object edit mode packs all islands together.
    bpy.ops.object.select_all(action="DESELECT")
    for obj in targets:
        obj.hide_set(False)
        obj.select_set(True)
        # Imported linked meshes need independent lightmap coordinates.
        obj.data = obj.data.copy()
        obj.data.uv_layers.new(name="BakedLightingUV")
        obj.data.uv_layers.active_index = len(obj.data.uv_layers) - 1
        if not obj.data.materials:
            mat = bpy.data.materials.new("Bake default")
            mat.use_nodes = True
            obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002,
                             area_weight=0.5, correct_aspect=True, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    for obj in targets:
        for mat in obj.data.materials:
            if not mat:
                continue
            mat.use_nodes = True
            node = mat.node_tree.nodes.get("Bake target") or mat.node_tree.nodes.new("ShaderNodeTexImage")
            node.name = "Bake target"
            node.image = image
            mat.node_tree.nodes.active = node

    # Bake one temporary joined copy to avoid 1000 separate GPU bake launches.
    # Original objects, IDs, mesh vertices and transforms survive the export.
    bpy.ops.object.select_all(action="DESELECT")
    copies = []
    for obj in targets:
        duplicate = obj.copy()
        duplicate.data = obj.data.copy()
        scene.collection.objects.link(duplicate)
        duplicate.select_set(True)
        copies.append(duplicate)
        obj.hide_render = True
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    combined = bpy.context.object
    if args.scene == "drawing":
        # A tiny normal bias on the bake-only copy avoids self-intersection
        # across the imported CAD triangle edges. Exported vertices are untouched.
        biased = [vertex.co + vertex.normal * 0.00005 for vertex in combined.data.vertices]
        for vertex, coordinate in zip(combined.data.vertices, biased):
            vertex.co = coordinate
        combined.data.update()
    combined.data.uv_layers.active = combined.data.uv_layers["BakedLightingUV"]
    combined.data.uv_layers.active.active_render = True
    bake = scene.render.bake
    bake.use_pass_direct = True
    bake.use_pass_indirect = True
    bake.use_pass_diffuse = True
    bake.use_pass_glossy = False
    bake.use_pass_transmission = False
    bake.use_pass_emit = True
    bake.margin = 2
    bake.use_clear = True
    print(f"BAKE_START {args.scene}: {len(targets)} objects, {args.size}px, {args.samples} samples", flush=True)
    bpy.ops.object.bake(type="COMBINED")

    # Store HDR illumination in a portable PNG with four stops of headroom.
    # The viewer restores this linear scale; it must not add a second diffuse light.
    scale = 16.0
    pixels = np.empty(args.size * args.size * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    pixels = pixels.reshape((-1, 4))
    assert np.isfinite(pixels).all(), "Non-finite bake"
    assert pixels[:, :3].max() > 0.01, "Empty lighting bake"
    print("BAKE_LINEAR_PERCENTILES", np.percentile(pixels[:, :3], [50, 90, 99, 100]), flush=True)
    pixels[:, :3] /= scale
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = str(evidence / "lighting.png")
    image.file_format = "PNG"
    # Explicitly encode linear radiance as sRGB; Image.save on a generated float
    # buffer can write linear PNG bytes that glTF would then decode a second time.
    transform, look, exposure = scene.view_settings.view_transform, scene.view_settings.look, scene.view_settings.exposure
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "16"
    image.save_render(image.filepath_raw, scene=scene)
    scene.view_settings.view_transform, scene.view_settings.look, scene.view_settings.exposure = transform, look, exposure
    # Reload the encoded PNG so glTF embeds exactly the verified stored pixels.
    texture_image = bpy.data.images.load(image.filepath_raw, check_existing=False)
    mat = bpy.data.materials.new("Baked Blender illumination")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "BakedLightingUV"
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = texture_image
    emit = nodes.new("ShaderNodeEmission")
    # Preserve brightness in standard glTF viewers too, through
    # KHR_materials_emissive_strength rather than app-only metadata.
    emit.inputs["Strength"].default_value = scale
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(uv.outputs[0], tex.inputs["Vector"])
    links.new(tex.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs[0], out.inputs["Surface"])
    bpy.data.objects.remove(combined, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in targets:
        obj.hide_render = False
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        for poly in obj.data.polygons:
            poly.material_index = 0
        obj["bakedLightingScale"] = scale
    for obj in meshes:
        matrix, vertices = baseline[obj.name]
        assert obj.matrix_world == matrix and all(v.co == old for v, old in zip(obj.data.vertices, vertices)), obj.name
        obj.select_set(True)
        if args.scene == "drawing" and obj.name in {"Element 12", "Element 15", "Element 16", "Element 46"}:
            obj["bakedSurfaceOffset"] = -1
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB", use_selection=True,
                             export_cameras=False, export_lights=False, export_apply=True, export_extras=True)
    manifest = {"source": str(source.relative_to(ROOT)), "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "generator_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                "blender": bpy.app.version_string, "arguments": vars(args),
                "output": str(output.relative_to(ROOT)), "output_sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
                "preserved_meshes": len(meshes), "baked_meshes": len(targets), "linear_scale": scale,
                "coordinates": "glTF metres: (x, y, z) = Blender (x, z, -y); authored transforms unchanged"}
    (evidence / "provenance.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("BAKE_COMPLETE", output, output.stat().st_size, flush=True)


if __name__ == "__main__":
    main()
