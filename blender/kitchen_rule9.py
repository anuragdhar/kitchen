"""
Blender Cycles skeleton for the Rule 9 kitchen render path.

Manual use only. Run this script from Blender with:
    blender --background --python blender/kitchen_rule9.py -- --plan Galley_2324x4746_Rule9_Current.json --render docs/renders/kitchen_4k.png

This file is intentionally a scaffold. It wires CLI parsing, JSON loading,
Cycles quality settings, and safe placeholder helper stubs, but the full scene
construction should be filled in after the shared layout/render config contract
is finalized.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import bpy


DEFAULT_RESOLUTION = (3840, 2160)
DEFAULT_SAMPLES = 512
DEFAULT_MAX_BOUNCES = 8
DEFAULT_ADAPTIVE_THRESHOLD = 0.01


def blender_script_args(argv: list[str]) -> list[str]:
    """Return arguments passed after Blender's `--` separator."""
    if "--" not in argv:
        return []
    return argv[argv.index("--") + 1 :]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render the kitchen layout with Blender Cycles.")
    parser.add_argument("--plan", required=True, type=Path, help="Path to the kitchen layout JSON file.")
    parser.add_argument("--render", required=True, type=Path, help="Output PNG/JPG path for the render.")
    parser.add_argument("--samples", type=int, default=DEFAULT_SAMPLES, help="Cycles samples per pixel.")
    parser.add_argument("--width", type=int, default=DEFAULT_RESOLUTION[0], help="Render width in pixels.")
    parser.add_argument("--height", type=int, default=DEFAULT_RESOLUTION[1], help="Render height in pixels.")
    return parser.parse_args(argv)


def load_plan(plan_path: Path) -> dict[str, Any]:
    if not plan_path.exists():
        raise FileNotFoundError(f"Missing kitchen plan JSON: {plan_path}")

    with plan_path.open("r", encoding="utf-8") as plan_file:
        data = json.load(plan_file)

    if not isinstance(data, dict):
        raise ValueError("Kitchen plan JSON must contain an object at the root.")

    return data


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def configure_cycles(args: argparse.Namespace) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = args.samples
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = DEFAULT_ADAPTIVE_THRESHOLD

    scene.cycles.max_bounces = DEFAULT_MAX_BOUNCES
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 8
    scene.cycles.transparent_max_bounces = 8

    scene.render.resolution_x = args.width
    scene.render.resolution_y = args.height
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1


def create_material(name: str, profile: dict[str, Any] | None = None) -> bpy.types.Material:
    """Create a placeholder Principled BSDF material from a future render profile."""
    profile = profile or {}
    material = bpy.data.materials.new(name)
    material.use_nodes = True

    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = profile.get("base_color", (0.8, 0.75, 0.68, 1.0))
        bsdf.inputs["Roughness"].default_value = profile.get("roughness", 0.55)
        bsdf.inputs["Metallic"].default_value = profile.get("metallic", 0.0)

    return material


def create_room(plan: dict[str, Any], materials: dict[str, bpy.types.Material]) -> None:
    """TODO: build floor, ceiling, walls, window opening, shaft, and tiled zones from the plan."""
    _ = plan
    _ = materials


def create_cabinets(plan: dict[str, Any], materials: dict[str, bpy.types.Material]) -> None:
    """TODO: build base, medium, top, and full-height cabinets from shared cabinet bands."""
    _ = plan
    _ = materials


def create_counters(plan: dict[str, Any], materials: dict[str, bpy.types.Material]) -> None:
    """TODO: build quartz counters, sink cutout, stove cutout, and side returns from the plan."""
    _ = plan
    _ = materials


def create_lighting(plan: dict[str, Any]) -> None:
    """TODO: map shared render lighting config to area lights, daylight, and warm LED emitters."""
    _ = plan


def create_camera(plan: dict[str, Any]) -> None:
    """TODO: create camera from shared camera preset once render config is exported for Blender."""
    _ = plan


def build_scene(plan: dict[str, Any]) -> None:
    materials = {
        "cabinet_light": create_material("cabinet_light", {"base_color": (0.94, 0.91, 0.87, 1.0), "roughness": 0.42}),
        "cabinet_wood": create_material("cabinet_wood", {"base_color": (0.72, 0.58, 0.42, 1.0), "roughness": 0.72}),
        "counter": create_material("counter_quartz", {"base_color": (0.91, 0.88, 0.83, 1.0), "roughness": 0.2}),
        "tile": create_material("tile_bitmap_placeholder", {"base_color": (0.9, 0.84, 0.75, 1.0), "roughness": 0.35}),
        "led": create_material("warm_led", {"base_color": (1.0, 0.85, 0.63, 1.0), "roughness": 0.2}),
    }

    create_room(plan, materials)
    create_cabinets(plan, materials)
    create_counters(plan, materials)
    create_lighting(plan)
    create_camera(plan)


def render_to_file(render_path: Path) -> None:
    render_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(render_path)
    bpy.ops.render.render(write_still=True)


def main() -> None:
    args = parse_args(blender_script_args(sys.argv))
    plan = load_plan(args.plan)

    clear_scene()
    configure_cycles(args)
    build_scene(plan)
    render_to_file(args.render)


if __name__ == "__main__":
    main()
