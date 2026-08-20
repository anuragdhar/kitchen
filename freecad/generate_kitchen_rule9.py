import json
from pathlib import Path

import FreeCAD as App
import Part


if "__file__" in globals():
    ROOT = Path(__file__).resolve().parents[1]
else:
    ROOT = Path.cwd()
CONFIG_PATH = ROOT / "freecad" / "kitchenConfig.json"
OUT_PATH = ROOT / "freecad" / "kitchen_rule9.FCStd"


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


def main():
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
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
    add_box(doc, "East_600D_base_counter", width - 600, 0, 0, 600, usable_len, 900, "#c8b39d")
    add_box(doc, "West_full_height_door_clear_zone_0_1220", 0, 0, 0, 35, 1220, height, "#f5f1eb", 0.65)
    add_box(doc, "West_400D_base_counter_after_gap", 0, 1220, 0, 400, usable_len - 1220, 900, "#c8b39d")

    # Upper cabinets and LED strips
    add_box(doc, "East_lower_upper_320D", width - 320, 0, 1350, 320, usable_len, 500, "#dac8b7")
    add_box(doc, "West_lower_upper_320D_after_door_clear", 0, 1220, 1350, 320, usable_len - 1220, 500, "#dac8b7")
    add_box(doc, "East_top_upper_550D", width - 550, 0, 1900, 550, usable_len, 800, "#bfa891")
    add_box(doc, "West_top_upper_450D_after_door_clear", 0, 1220, 1900, 450, usable_len - 1220, 800, "#bfa891")
    add_box(doc, "East_warm_LED", width - 330, 0, 1330, 18, usable_len, 35, "#ffd38b")
    add_box(doc, "West_warm_LED_after_door_clear", 312, 1220, 1330, 18, usable_len - 1220, 35, "#ffd38b")

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
            add_box(doc, "East_gas_cooktop", width - 600, y, 900, 600, item_w, 45, "#151515")
            add_box(doc, "East_compact_chimney_hood", width - 360, y + 90, 1450, 330, 520, 260, "#2b2b2b")
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
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
