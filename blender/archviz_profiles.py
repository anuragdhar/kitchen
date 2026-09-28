"""Resolve shared quality settings and independently owned room profiles (no bpy)."""
import copy
import hashlib
import json
import math
from pathlib import Path
import re

ROOM_ID = re.compile(r"[a-z][a-z0-9-]{0,63}")
FIELDS = {"label", "lens", "eyeHeight", "corner", "target", "note", "native", "cameras"}


def number(value, low, high):
    return type(value) in (int, float) and math.isfinite(value) and low <= value <= high


def validate_profile(value):
    if not isinstance(value, dict) or set(value) - FIELDS:
        raise ValueError("Invalid room profile or unknown field")
    if not isinstance(value.get("label"), str) or not 1 <= len(value["label"].strip()) <= 200:
        raise ValueError("Invalid room label")
    if not number(value.get("lens"), 10, 150) or not number(value.get("eyeHeight"), .5, 3):
        raise ValueError("Invalid lens or eye height")
    for key in ("corner", "target"):
        v = value.get(key)
        if not isinstance(v, list) or len(v) != 2 or not all(number(x, 0, 1) for x in v):
            raise ValueError("Invalid normalized camera coordinates")
    if "native" in value:
        native = value["native"]
        if not isinstance(native, str) or not re.fullmatch(r"blender/[A-Za-z0-9_./-]+\.blend", native) or any(p in ("", ".", "..") for p in native.split("/")):
            raise ValueError("Native source must be a repository Blender file")
    if "cameras" in value and (not isinstance(value["cameras"], list) or not 1 <= len(value["cameras"]) <= 16 or any(not isinstance(x, str) or not 1 <= len(x) <= 200 for x in value["cameras"])):
        raise ValueError("Invalid authored camera names")
    if "note" in value and (not isinstance(value["note"], str) or len(value["note"]) > 4000):
        raise ValueError("Invalid room note")
    return value


def resolve_profiles(manifest, read_room):
    if not isinstance(manifest, dict) or type(manifest.get("version")) is not int or manifest["version"] not in (1, 2):
        raise ValueError("Unsupported profile format")
    if set(manifest) != {"version", "quality", "rooms"}:
        raise ValueError("Unknown manifest field")
    quality = manifest["quality"]
    if not isinstance(quality, dict) or set(quality) != {"draft", "final", "portfolio", "test"}:
        raise ValueError("Invalid quality presets")
    for value in quality.values():
        if not isinstance(value, dict) or set(value) != {"width", "height", "samples", "noiseThreshold"}:
            raise ValueError("Invalid quality fields")
        if any(type(value[k]) is not int or not 1 <= value[k] <= 16384 for k in ("width", "height", "samples")) or not number(value["noiseThreshold"], 0, 1):
            raise ValueError("Invalid quality values")
    rooms = manifest["rooms"]
    if not isinstance(rooms, dict) or not 1 <= len(rooms) <= 32:
        raise ValueError("Invalid room registry")
    resolved = {}
    for room, source in rooms.items():
        if not isinstance(room, str) or not ROOM_ID.fullmatch(room):
            raise ValueError("Invalid room ID")
        if manifest["version"] == 2:
            if source != f"archviz/rooms/{room}.json":
                raise ValueError("Room profile must use its canonical path")
            source = read_room(source)
        resolved[room] = copy.deepcopy(validate_profile(source))
    # Preserve the original in-memory consumer contract and ordering.
    return {"version": 1, "quality": copy.deepcopy(quality), "rooms": resolved}


def load_profiles(path):
    path = Path(path).resolve()
    def read(file):
        if file.stat().st_size > 256 * 1024:
            raise ValueError("Profile file is too large")
        return json.loads(file.read_text(encoding="utf-8-sig"))
    def read_room(name):
        file = (path.parent / name).resolve()
        if not file.is_relative_to(path.parent):
            raise ValueError("Profile symlink escapes the config folder")
        return read(file)
    return resolve_profiles(read(path), read_room)


def profile_digest(profiles, room, detail_sha=None):
    value = {"quality": profiles["quality"], "room": profiles["rooms"][room], "detailSha256": detail_sha}
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()
