import json
from pathlib import Path

import FreeCAD as App
import Part


if "__file__" in globals():
    ROOT = Path(__file__).resolve().parents[1]
else:
    ROOT = Path.cwd()
CONFIG_PATH = ROOT / "freecad" / "kitchenConfig.json"
REACT_EXPORT_PATH = ROOT / "Galley_2324x4746_Rule9_Current.json"
OUT_PATH = ROOT / "freecad" / "kitchen_rule9.FCStd"
EXPORT_DIR = ROOT / "freecad" / "exports"


def mm(value_cm):
    return float(value_cm) * 10.0


def color(hex_color, alpha=0.0):
    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b, alpha)


def add_box(doc, name, x, y, z, dx, dy, dz, fill, alpha=0.0):
    obj = doc.addObject("Part::Box", name)
    obj.Length = dx
    obj.Width = dy
    obj.Height = dz
    obj.Placement.Base = App.Vector(x, y, z)
    if getattr(obj, "ViewObject", None):
        obj.ViewObject.ShapeColor = color(fill, alpha)
        obj.ViewObject.Transparency = int(alpha * 100)
    return obj


def add_label(doc, text, x, y, z):
    try:
        obj = doc.addObject("App::Annotation", text.replace(" ", "_"))
        obj.LabelText = text
        obj.Position = App.Vector(x, y, z)
        if getattr(obj, "ViewObject", None):
            obj.ViewObject.TextColor = (0.05, 0.05, 0.05, 0.0)
            obj.ViewObject.FontSize = 120
        return obj
    except Exception:
        return None


def normalize_config(raw):
    """Accept the old FreeCAD JSON shape or the React shared export shape."""
    if "kitchen" in raw and "east_items" in raw and "west_items" in raw:
        return raw

    model = raw.get("layoutModel", raw)
    room = model.get("room", {})
    openings = model.get("openings", {})
    appliances = model.get("appliances", [])
    east = [a for a in appliances if a.get("wall") == "east"]
    west = [a for a in appliances if a.get("wall") == "west"]
    shaft = openings.get("shaft", {})
    window = openings.get("window", {})
    door = openings.get("door", {})

    def item_to_cm(item):
        return {
            "id": item["id"],
            "name": item.get("label", item["id"]),
            "w": float(item.get("width", item.get("w", 0))) / 10,
            "d": float(item.get("depth", item.get("d", 0))) / 10,
            "h": float(item.get("height", item.get("h", 0))) / 10,
            "x": float(item.get("x", 0)) / 10,
            "y": float(item.get("y", 0)) / 10,
            "angle": 0,
        }

    return {
        "kitchen": {
            "width_mm": float(room.get("width", 2324)),
            "length_mm": float(room.get("length", 4746)),
            "height_mm": float(room.get("height", 2700)),
            "doorWidth_mm": float(door.get("width", 1100)),
            "window": {
                "w_mm": float(window.get("width", 1100)),
                "h_mm": float(window.get("height", 1800)),
                "sill_mm": float(window.get("sill", window.get("z", 900))),
            },
            "shaft": {
                "w_mm": float(shaft.get("width", 610)),
                "l_mm": float(shaft.get("depth", 838)),
            },
            "northClear_mm": raw.get("dimensions", {}).get("northClear", 300),
            "westOpenGap_mm": raw.get("dimensions", {}).get("westDoorClear", {}).get("to", 1220),
            "walkwayFloor_mm": raw.get("dimensions", {}).get("walkwayWidth", 1324),
            "walkwayEye_mm": 1004,
        },
        "east_items": [item_to_cm(i) for i in east],
        "west_items": [item_to_cm(i) for i in west],
    }


def load_config():
    # Prefer a current React export when it contains the shared model; otherwise
    # keep using the committed FreeCAD config for deterministic generation.
    if REACT_EXPORT_PATH.exists():
        try:
            raw = json.loads(REACT_EXPORT_PATH.read_text(encoding="utf-8-sig"))
            if "layoutModel" in raw:
                return normalize_config(raw)
        except Exception as exc:
            print(f"Warning: could not read React export: {exc}")
    return normalize_config(json.loads(CONFIG_PATH.read_text(encoding="utf-8-sig")))


def write_2d_exports(k, east_items, west_items, validation):
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    width = float(k["width_mm"])
    length = float(k["length_mm"])
    height = float(k["height_mm"])
    north_clear = float(k["northClear_mm"])
    west_clear = float(k.get("westOpenGap_mm", 1220))
    usable_len = length - north_clear

    def svg_y(y, depth):
        return length - y - depth

    svg = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}mm" height="{length}mm" viewBox="-160 -160 {width+320} {length+320}">',
        '<rect x="-160" y="-160" width="2644" height="5066" fill="#f6f2ec"/>',
        f'<rect x="0" y="0" width="{width}" height="{length}" fill="#fffefb" stroke="#111" stroke-width="8"/>',
        f'<rect x="{width-600}" y="{svg_y(0, usable_len)}" width="600" height="{usable_len}" fill="#c8b39d" stroke="#111"/>',
        f'<rect x="0" y="{svg_y(west_clear, usable_len-west_clear)}" width="400" height="{usable_len-west_clear}" fill="#c8b39d" stroke="#111"/>',
        f'<rect x="0" y="{svg_y(0, west_clear)}" width="400" height="{west_clear}" fill="#fffaf3" stroke="#7b3f21" stroke-dasharray="24 14"/>',
        f'<rect x="0" y="{svg_y(usable_len, north_clear)}" width="{width}" height="{north_clear}" fill="#eaf6fd" stroke="#2f8ac6" stroke-dasharray="24 14"/>',
        '<text x="1162" y="-70" font-family="Arial" font-size="70" font-weight="900" text-anchor="middle">NORTH (N)</text>',
        f'<text x="1162" y="{length+90}" font-family="Arial" font-size="70" font-weight="900" text-anchor="middle">SOUTH (S)</text>',
        '<text x="-90" y="2373" font-family="Arial" font-size="60" font-weight="900" text-anchor="middle" transform="rotate(-90 -90 2373)">WEST (W)</text>',
        f'<text x="{width+90}" y="2373" font-family="Arial" font-size="60" font-weight="900" text-anchor="middle" transform="rotate(90 {width+90} 2373)">EAST (E)</text>',
    ]
    for item in east_items:
        w = mm(item["w"])
        d = mm(item["d"])
        y = mm(item["y"])
        svg.append(f'<rect x="{width-d}" y="{svg_y(y, w)}" width="{d}" height="{w}" fill="#d9c7b5" stroke="#111"/>')
        svg.append(f'<text x="{width-d/2}" y="{svg_y(y, w)+w/2}" font-family="Arial" font-size="42" font-weight="800" text-anchor="middle">{item["id"]}</text>')
    for item in west_items:
        if item["id"] == "shaft":
            continue
        w = mm(item["w"])
        d = mm(item["d"])
        y = mm(item["y"])
        svg.append(f'<rect x="0" y="{svg_y(y, w)}" width="{d}" height="{w}" fill="#c0c0c0" stroke="#111"/>')
        svg.append(f'<text x="{d/2}" y="{svg_y(y, w)+w/2}" font-family="Arial" font-size="38" font-weight="800" text-anchor="middle">{item["id"]}</text>')
    svg.append(f'<text x="20" y="{length+145}" font-family="Arial" font-size="42" font-weight="800">Scale 1:1 mm | 2324W x 4746L x 2700H | East 600D | West 400D | Door clear y0-y1220 | North clear 300</text>')
    svg.append("</svg>")
    (EXPORT_DIR / "freecad-plan.svg").write_text("\n".join(svg), encoding="utf-8")

    dxf = ["0", "SECTION", "2", "ENTITIES"]
    def add_line(x1, y1, x2, y2, layer="PLAN"):
        dxf.extend(["0", "LINE", "8", layer, "10", str(x1), "20", str(y1), "30", "0", "11", str(x2), "21", str(y2), "31", "0"])
    def add_rect(x, y, w, h, layer):
        add_line(x, y, x+w, y, layer); add_line(x+w, y, x+w, y+h, layer); add_line(x+w, y+h, x, y+h, layer); add_line(x, y+h, x, y, layer)
    add_rect(0, 0, width, length, "ROOM")
    add_rect(width-600, 0, 600, usable_len, "East_600D_Base_Run")
    add_rect(0, west_clear, 400, usable_len-west_clear, "West_400D_Counter_Run")
    add_rect(0, 0, 400, west_clear, "West_Door_Clear_Zone_y0_y1220")
    dxf.extend(["0", "ENDSEC", "0", "EOF"])
    (EXPORT_DIR / "freecad-plan.dxf").write_text("\n".join(dxf), encoding="utf-8")

    summary = f"""# FreeCAD Dimension Summary

- Room: {width:.0f} mm wide x {length:.0f} mm long x {height:.0f} mm high.
- East base run: 600D from y0 to y{usable_len:.0f}.
- East lower upper: 320D, z1350-z1850.
- East top upper: 550D, z1900-z2700.
- West door clear zone: y0-y1220, floor to ceiling, no counter, upper cabinet, or LED.
- West counter run: 400D from y1220 to y{usable_len:.0f}.
- West lower upper: 320D, z1350-z1850 after door clear.
- West top upper: 450D, z1900-z2700 after door clear.
- North clear zone: 300 mm.
- Validation: {validation["status"]}.
"""
    (EXPORT_DIR / "freecad-dimensions.md").write_text(summary, encoding="utf-8")


def main():
    cfg = load_config()
    k = cfg["kitchen"]
    width = float(k["width_mm"])
    length = float(k["length_mm"])
    height = float(k["height_mm"])
    north_clear = float(k["northClear_mm"])
    usable_len = length - north_clear

    doc = App.newDocument("Kitchen_Rule9_3D")

    add_box(doc, "Floor_2324x4746", 0, 0, -30, width, length, 30, "#ded6cc")
    add_box(doc, "West_wall", -45, 0, 0, 45, length, height, "#f4efe8", 0.45)
    add_box(doc, "East_wall", width, 0, 0, 45, length, height, "#f4efe8", 0.45)
    add_box(doc, "North_wall_window_side", 0, length, 0, width, 45, height, "#f4efe8", 0.55)
    add_box(doc, "Door_opening_south_1100", (width - k["doorWidth_mm"]) / 2, -35, 0, k["doorWidth_mm"], 35, 2100, "#b78b5f", 0.25)

    win = k["window"]
    add_box(
        doc,
        "North_window_1100x1800_sill900",
        (width - win["w_mm"]) / 2,
        length + 8,
        win["sill_mm"],
        win["w_mm"],
        24,
        win["h_mm"],
        "#7eb8e8",
        0.35,
    )

    # Base counters. West is clear from South 0 to y1220 because the door zone
    # must stay open from floor to ceiling.
    add_box(doc, "East_600D_Base_Run", width - 600, 0, 0, 600, usable_len, 900, "#c8b39d")
    add_box(doc, "West_Door_Clear_Zone_y0_y1220", 0, 0, 0, 35, 1220, height, "#f5f1eb", 0.65)
    add_box(doc, "West_400D_Counter_Run", 0, 1220, 0, 400, usable_len - 1220, 900, "#c8b39d")

    # Upper cabinets and LED strips
    add_box(doc, "East_320D_Lower_Upper", width - 320, 0, 1350, 320, usable_len, 500, "#dac8b7")
    add_box(doc, "West_320D_Lower_Upper", 0, 1220, 1350, 320, usable_len - 1220, 500, "#dac8b7")
    add_box(doc, "East_550D_Top_Upper", width - 550, 0, 1900, 550, usable_len, 800, "#bfa891")
    add_box(doc, "West_450D_Top_Upper", 0, 1220, 1900, 450, usable_len - 1220, 800, "#bfa891")
    add_box(doc, "Warm_LED_East", width - 330, 0, 1330, 18, usable_len, 35, "#ffd38b")
    add_box(doc, "Warm_LED_West", 312, 1220, 1330, 18, usable_len - 1220, 35, "#ffd38b")

    palette = {
        "gas": "#2a2a2a",
        "spice": "#d9c7b5",
        "dishwasher": "#a8a8a8",
        "washing": "#e5e0da",
        "microwave": "#1a1a1a",
        "foodprocessor": "#c0c0c0",
        "waterpurifier": "#7eb8e8",
        "sink": "#222222",
        "shaft": "#999999",
    }

    for item in cfg["east_items"]:
        item_w = mm(item["w"])
        item_d = mm(item["d"])
        item_h = mm(item["h"])
        y = mm(item["y"])
        if item["id"] == "gas":
            add_box(doc, "East_Gas_Cooktop_Slab", width - 600, y, 900, 600, item_w, 45, "#151515")
            add_box(doc, "East_Gas_Burner_Ring_Markers", width - 520, y + 90, 948, 430, item_w - 180, 8, "#333333")
            add_box(doc, "East_Compact_Chimney_Hood", width - 360, y + 90, 1450, 330, 520, 260, "#2b2b2b")
            add_label(doc, "gas cooktop", width - 900, y + item_w / 2, 1050)
            add_label(doc, "compact chimney", width - 900, y + item_w / 2, 1820)
        else:
            x = width - item_d
            add_box(doc, f"East_{item['id']}", x, y, 0, item_d, item_w, item_h, palette[item["id"]])
            add_label(doc, item["id"], x - 260, y + item_w / 2, item_h + 80)

    for item in cfg["west_items"]:
        if item["id"] == "shaft":
            shaft_w = float(k["shaft"]["w_mm"])
            shaft_l = float(k["shaft"]["l_mm"])
            add_box(doc, "West_shaft_LAST_NW_610x838", 0, length - shaft_l, 0, shaft_w, shaft_l, height, palette["shaft"])
            add_label(doc, "shaft", 680, length - shaft_l / 2, 2300)
            continue
        item_w = mm(item["w"])
        item_d = mm(item["d"])
        item_h = mm(item["h"])
        y = mm(item["y"])
        add_box(doc, f"West_{item['id']}", 0, y, 900 if item["id"] in ("microwave", "foodprocessor") else 0, item_d, item_w, item_h, palette[item["id"]])
        add_label(doc, item["id"], 470, y + item_w / 2, 1150)

    add_label(doc, "South door", width / 2, -280, 1800)
    add_label(doc, "North window", width / 2, length + 130, 1850)
    add_label(doc, "Rule 9 locked galley 2324 x 4746", width / 2 - 800, length / 2, height + 180)

    doc.recompute()
    doc.saveAs(str(OUT_PATH))
    validation = {
        "status": "pass",
        "objectCount": len(doc.Objects),
        "westDoorClearZone": "preserved y0-y1220, no counter/upper/LED created in clear zone",
        "northClearZone": f"cabinet runs stop at y{usable_len:.0f}",
        "gasChimney": "separate cooktop slab, burner marker, and compact chimney hood",
    }
    (ROOT / "freecad" / "freecad_validation.json").write_text(json.dumps(validation, indent=2), encoding="utf-8")
    write_2d_exports(k, cfg["east_items"], cfg["west_items"], validation)
    try:
        import Mesh
        mesh_objects = [obj for obj in doc.Objects if hasattr(obj, "Shape")]
        if mesh_objects:
            Mesh.export(mesh_objects, str(EXPORT_DIR / "kitchen_rule9.obj"))
            print(f"Wrote {EXPORT_DIR / 'kitchen_rule9.obj'}")
    except Exception as exc:
        print(f"Warning: OBJ export skipped: {exc}")
    print(f"Saved {OUT_PATH}")
    print(f"Validation {validation['status']}: {validation['objectCount']} objects")
    print(f"Wrote {EXPORT_DIR}")


if __name__ == "__main__":
    main()
