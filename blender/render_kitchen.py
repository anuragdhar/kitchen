from pathlib import Path
import math

import bpy


ROOT = Path(__file__).resolve().parents[1]
OBJ_PATH = ROOT / "freecad" / "exports" / "kitchen_rule9.obj"
OUT_DIR = ROOT / "blender" / "renders"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def material(name, color, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def assign_materials():
    mats = {
        "cabinet": material("warm_laminate", (0.73, 0.63, 0.52, 1)),
        "counter": material("stone_counter", (0.55, 0.52, 0.48, 1)),
        "wall": material("soft_wall", (0.86, 0.83, 0.78, 1)),
        "black": material("black_glass", (0.02, 0.02, 0.02, 1), 0.18, 0.1),
        "metal": material("brushed_metal", (0.72, 0.72, 0.70, 1), 0.32, 0.7),
        "floor": material("matte_floor", (0.66, 0.63, 0.58, 1)),
        "glass": material("window_glass", (0.42, 0.72, 0.95, 0.45), 0.05),
    }
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        name = obj.name.lower()
        if "wall" in name:
            obj.data.materials.append(mats["wall"])
        elif "floor" in name:
            obj.data.materials.append(mats["floor"])
        elif "gas" in name or "microwave" in name:
            obj.data.materials.append(mats["black"])
        elif "sink" in name or "dishwasher" in name or "washing" in name:
            obj.data.materials.append(mats["metal"])
        elif "window" in name:
            obj.data.materials.append(mats["glass"])
        elif "counter" in name:
            obj.data.materials.append(mats["counter"])
        else:
            obj.data.materials.append(mats["cabinet"])


def add_lights():
    bpy.ops.object.light_add(type="AREA", location=(1.2, -3.0, 4.2))
    bpy.context.object.name = "large_softbox"
    bpy.context.object.data.energy = 650
    bpy.context.object.data.size = 5.0

    bpy.ops.object.light_add(type="POINT", location=(-1.0, 2.0, 2.1))
    bpy.context.object.name = "warm_led_fill"
    bpy.context.object.data.energy = 120
    bpy.context.object.data.color = (1.0, 0.74, 0.42)


def add_camera(name, location, rotation_deg):
    bpy.ops.object.camera_add(location=location, rotation=tuple(math.radians(v) for v in rotation_deg))
    cam = bpy.context.object
    cam.name = name
    cam.data.lens = 24
    return cam


def render_camera(camera, filename):
    bpy.context.scene.camera = camera
    bpy.context.scene.render.filepath = str(OUT_DIR / filename)
    bpy.ops.render.render(write_still=True)


def main():
    if not OBJ_PATH.exists():
        raise FileNotFoundError(f"Missing OBJ export: {OBJ_PATH}. Run Generate-FreeCAD-3D.bat first.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    clear_scene()
    bpy.ops.wm.obj_import(filepath=str(OBJ_PATH))
    assign_materials()
    add_lights()

    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 96
    bpy.context.scene.render.resolution_x = 3840
    bpy.context.scene.render.resolution_y = 2160

    cameras = [
        add_camera("wide_kitchen_view", (2.8, -5.8, 2.8), (62, 0, 28)),
        add_camera("east_wall_detail", (4.2, -1.6, 2.0), (72, 0, 78)),
        add_camera("west_wall_detail", (-2.8, -1.6, 2.0), (72, 0, -72)),
        add_camera("cooktop_chimney_detail", (3.2, -0.7, 1.7), (70, 0, 62)),
        add_camera("sink_purifier_detail", (-2.4, 1.8, 1.8), (68, 0, -46)),
    ]
    for cam in cameras:
        render_camera(cam, f"{cam.name}.png")


if __name__ == "__main__":
    main()
