"""Lobby / Dining detailing extension: interior-photography finishes.

Owned by feat/archviz/lobby. See docs/PARALLEL_ROOM_WORK.md for the contract.

Everything here is shading, one photographic light and two small table props.
No authored mesh, vertex, transform or visibility is touched; the framework
verifies that after this hook runs. Replace apply() with `return []` to revert.

What changes (see docs/room-reviews/lobby/README.md for the reasoning):
- Floor: the editable app paints the floor slab in the room's plan colour
  (teal for the lobby). That is an identification colour, not a finish, and it
  dominates every render. An untextured floor is re-shaded as 600 x 1200 mm
  matte porcelain with 2.5 mm grout. FLOOR below is the single place to change it.
- Wood (teak veneer etc.): satin lacquer coat over the existing maps.
- Plaster: dead-flat sheen, plus fine trowel relief when no relief map exists.
- Chair upholstery: woven fabric sheen and weave relief (colour unchanged).
- Dark metal: satin powder coat on legs/base, brushed finish on small pulls.
- Brass: brushed brass.
- Dining pendant: the existing emissive diffuser becomes a real light source
  (a matching area light under it), so the table is lit by its own fixture.
- Table styling: a linen runner and one ceramic bowl, placed from the actual
  table top found in the export (skipped, with a record, if it is not found).
- Ceiling: the editable lobby export has walls but no ceiling, so generated
  views show the render background overhead. When no ceiling slab exists, a
  plain painted ceiling is added over the floor footprint at the wall top
  (the 2700 mm datum). If the export already has one, nothing is added.
  With it comes the west hanging beam from roomShellConfig.js (305 mm drop,
  180 mm wide, full room length), which closes the gap above the partition.
"""

import math

ROOM = 'lobby'
PREFIX = f'ArchvizDetail | {ROOM} | '

# Floor finish. Colours are sRGB hex; sizes are metres.
FLOOR = {
    'tile_long': 1.2, 'tile_short': 0.6, 'grout': 0.0025,
    'tile_a': '#d2c9bb', 'tile_b': '#cbc1b2', 'grout_colour': '#a39a8c',
    'roughness': 0.34,
}
# The same values the app uses for the dining table (roomShellConfig.js lobby).
# roomShellConfig.js lobby.hangingBeams[0]: west wall, full length.
BEAM = {'drop': 0.305, 'width': 0.18}
TABLE = {'short': 0.70, 'long': 1.20, 'thickness': 0.055, 'height': 0.745}
PENDANT_WATTS = 32.0


def _linear(hex_colour):
    value = hex_colour.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(value[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def _principled(material):
    if not material or not material.use_nodes:
        return None
    return next((n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)


def _input(node, *names):
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            return socket
    return None


def _set(node, names, value):
    """Set the first matching unlinked input. Covers Blender 3.x and 4.x/5.x names."""
    socket = _input(node, *names)
    if socket is None or socket.is_linked:
        return False
    socket.default_value = value
    return True


def _value(node, names, default=None):
    socket = _input(node, *names)
    if socket is None or socket.is_linked:
        return default
    value = socket.default_value
    try:
        return tuple(value)
    except TypeError:
        return value


def _luma(rgba):
    return 0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2]


def _world_box(obj):
    from mathutils import Vector
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    return lo, hi


def _rounded(values):
    return [round(float(v), 4) for v in values]


def _add_bump(material, principled, scale, strength, distance):
    nodes, links = material.node_tree.nodes, material.node_tree.links
    normal = _input(principled, 'Normal')
    if normal is None:
        return False
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = scale
    noise.inputs['Detail'].default_value = 6.0
    coords = nodes.new('ShaderNodeNewGeometry')
    links.new(coords.outputs['Position'], noise.inputs['Vector'])
    bump = nodes.new('ShaderNodeBump')
    bump.label = f'{PREFIX}relief (shading only)'
    bump.inputs['Strength'].default_value = strength
    bump.inputs['Distance'].default_value = distance
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    if normal.is_linked:
        links.new(normal.links[0].from_socket, bump.inputs['Normal'])
    links.new(bump.outputs['Normal'], normal)
    return True


def _users(scene):
    users = {}
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.hide_render:
            continue
        for material in obj.data.materials:
            if material:
                users.setdefault(material.name, (material, []))[1].append(obj)
    return users


def _floor(scene):
    """Largest thin horizontal slab at the bottom of the export."""
    best = None
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.hide_render or obj.name.startswith(PREFIX):
            continue
        lo, hi = _world_box(obj)
        size = hi - lo
        if size.z > 0.08:
            continue
        area = size.x * size.y
        if best is None or area > best[0] + 1e-6 or (abs(area - best[0]) < 1e-6 and lo.z < best[1].z):
            best = (area, lo, hi, obj)
    if best is None or best[0] < 4.0:
        return None
    return best[3], best[1], best[2]


def _floor_material(lo):
    import bpy
    material = bpy.data.materials.new(f'{PREFIX}porcelain floor')
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    principled = _principled(material)
    geometry = nodes.new('ShaderNodeNewGeometry')
    mapping = nodes.new('ShaderNodeMapping')
    mapping.inputs['Location'].default_value = (-lo.x, -lo.y, 0.0)
    links.new(geometry.outputs['Position'], mapping.inputs['Vector'])
    brick = nodes.new('ShaderNodeTexBrick')
    brick.offset, brick.offset_frequency = 0.0, 2
    brick.inputs['Scale'].default_value = 1.0
    brick.inputs['Mortar Size'].default_value = FLOOR['grout']
    brick.inputs['Mortar Smooth'].default_value = 0.2
    brick.inputs['Brick Width'].default_value = FLOOR['tile_long']
    brick.inputs['Row Height'].default_value = FLOOR['tile_short']
    brick.inputs['Bias'].default_value = 0.0
    brick.inputs['Color1'].default_value = _linear(FLOOR['tile_a'])
    brick.inputs['Color2'].default_value = _linear(FLOOR['tile_b'])
    brick.inputs['Mortar'].default_value = _linear(FLOOR['grout_colour'])
    links.new(mapping.outputs['Vector'], brick.inputs['Vector'])
    # Soft cloudy variation so large tiles do not read as flat CG planes.
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 2.2
    noise.inputs['Detail'].default_value = 8.0
    links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    tint = nodes.new('ShaderNodeMix')
    tint.data_type = 'RGBA'
    tint.blend_type = 'MULTIPLY'
    tint.inputs['Factor'].default_value = 0.12
    links.new(brick.outputs['Color'], tint.inputs['A'])
    links.new(noise.outputs['Color'], tint.inputs['B'])
    links.new(tint.outputs['Result'], _input(principled, 'Base Color'))
    rough = nodes.new('ShaderNodeMapRange')
    rough.inputs['To Min'].default_value = FLOOR['roughness']
    rough.inputs['To Max'].default_value = 0.92
    links.new(brick.outputs['Fac'], rough.inputs['Value'])
    links.new(rough.outputs['Result'], _input(principled, 'Roughness'))
    bump = nodes.new('ShaderNodeBump')
    bump.invert = True
    bump.inputs['Strength'].default_value = 0.35
    bump.inputs['Distance'].default_value = 0.0015
    links.new(brick.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], _input(principled, 'Normal'))
    _set(principled, ('Specular IOR Level', 'Specular'), 0.5)
    return material


def _fabric_material(name, colour):
    import bpy
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = _principled(material)
    principled.inputs['Base Color'].default_value = colour
    _set(principled, ('Roughness',), 0.95)
    _set(principled, ('Sheen Weight', 'Sheen'), 0.6)
    _set(principled, ('Sheen Roughness',), 0.45)
    _add_bump(material, principled, 900.0, 0.12, 0.0004)
    return material


def _ceramic_material(name):
    import bpy
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = _principled(material)
    principled.inputs['Base Color'].default_value = _linear('#e8e2d6')
    _set(principled, ('Roughness',), 0.42)
    _set(principled, ('Coat Weight', 'Clearcoat'), 0.6)
    _set(principled, ('Coat Roughness', 'Clearcoat Roughness'), 0.12)
    return material


def _new_object(scene, name, vertices, faces, material, smooth=False):
    import bpy
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    if smooth:
        for polygon in mesh.polygons:
            polygon.use_smooth = True
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def _box(cx, cy, cz, sx, sy, sz):
    xs, ys, zs = (cx - sx / 2, cx + sx / 2), (cy - sy / 2, cy + sy / 2), (cz - sz / 2, cz + sz / 2)
    vertices = [(x, y, z) for x in xs for y in ys for z in zs]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return vertices, faces


def _bowl(cx, cy, base_z, radius=0.14, height=0.085, wall=0.007, segments=64):
    """Closed lathe profile: foot, outer wall, rim, inner wall, inner floor."""
    outer = [(radius * 0.36, 0.0), (radius * 0.42, 0.006), (radius * 0.62, 0.02),
             (radius * 0.82, 0.042), (radius * 0.95, 0.066), (radius, height)]
    inner = [(radius - wall, height), (radius * 0.93 - wall, 0.066), (radius * 0.79 - wall, 0.044),
             (radius * 0.56 - wall, 0.024), (radius * 0.30, 0.016)]
    profile = outer + inner
    vertices = []
    for r, z in profile:
        for i in range(segments):
            a = 2 * math.pi * i / segments
            vertices.append((cx + r * math.cos(a), cy + r * math.sin(a), base_z + z))
    faces = []
    for ring in range(len(profile) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            a, b = ring * segments + i, ring * segments + j
            faces.append((a, b, b + segments, a + segments))
    bottom = len(vertices)
    vertices.append((cx, cy, base_z))
    inner_floor = len(vertices)
    vertices.append((cx, cy, base_z + 0.016))
    last = (len(profile) - 1) * segments
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((bottom, j, i))
        faces.append((inner_floor, last + i, last + j))
    return vertices, faces


def _has_ceiling(scene, floor_lo, floor_hi, top):
    area = (floor_hi.x - floor_lo.x) * (floor_hi.y - floor_lo.y)
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.hide_render or obj.name.startswith(PREFIX):
            continue
        lo, hi = _world_box(obj)
        if hi.z - lo.z < 0.15 and lo.z > top - 0.12 and (hi.x - lo.x) * (hi.y - lo.y) > 0.5 * area:
            return True
    return False


def _paint_material(name):
    import bpy
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = _principled(material)
    principled.inputs['Base Color'].default_value = _linear('#f3f0ea')
    _set(principled, ('Roughness',), 0.92)
    return material


def _find_table(scene, floor_z, wood_names):
    """The dining top: a wood slab of the configured size at table height."""
    want = sorted((TABLE['short'], TABLE['long']))
    best = None
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.hide_render or obj.name.startswith(PREFIX):
            continue
        if not any(m and m.name in wood_names for m in obj.data.materials):
            continue
        lo, hi = _world_box(obj)
        size = hi - lo
        plan = sorted((size.x, size.y))
        error = abs(plan[0] - want[0]) + abs(plan[1] - want[1]) + abs(size.z - TABLE['thickness'])
        centre_height = (lo.z + hi.z) / 2 - floor_z
        if error < 0.04 and abs(centre_height - TABLE['height']) < 0.05 and (best is None or error < best[0]):
            best = (error, obj, lo, hi)
    return best


def apply(scene, profile):
    """Return JSON-safe change records; preserve every authored mesh and transform."""
    import bpy
    changes = []
    users = _users(scene)

    floor = _floor(scene)
    floor_z = floor[2].z if floor else 0.0
    if floor:
        obj, lo, hi = floor
        principled = _principled(obj.data.materials[0]) if obj.data.materials else None
        textured = principled is not None and _input(principled, 'Base Color').is_linked
        if textured:
            changes.append({'kind': 'floor', 'object': obj.name, 'action': 'kept textured source finish'})
        else:
            material = _floor_material(lo)
            if obj.data.users > 1:
                obj.data = obj.data.copy()  # Same vertices/faces; only the slot changes.
            for index in range(max(1, len(obj.data.materials))):
                if index < len(obj.data.materials):
                    obj.data.materials[index] = material
                else:
                    obj.data.materials.append(material)
            changes.append({'kind': 'floor', 'object': obj.name, 'material': material.name,
                            'tileMetres': [FLOOR['tile_long'], FLOOR['tile_short']], 'groutMetres': FLOOR['grout'],
                            'note': 'Replaced the untextured plan-colour floor; geometry unchanged.'})
    else:
        changes.append({'kind': 'floor', 'action': 'skipped', 'reason': 'no floor slab found'})

    summary = {}

    def record(finish, material_name):
        summary.setdefault(finish, []).append(material_name)

    wood_names = {name for name, (material, _) in users.items() if material.get('interiorRole') == 'wood'}
    table = _find_table(scene, floor_z, wood_names)
    pendant_meshes = []
    for name, (material, objects) in sorted(users.items()):
        if floor and objects == [floor[0]]:
            continue
        principled = _principled(material)
        if principled is None:
            continue
        role = material.get('interiorRole')
        base = _value(principled, ('Base Color',))
        metallic = _value(principled, ('Metallic',), 0.0) or 0.0
        roughness = _value(principled, ('Roughness',))
        alpha = _value(principled, ('Alpha',), 1.0)
        emission = _value(principled, ('Emission Color', 'Emission'))
        strength = _value(principled, ('Emission Strength',), 1.0) or 0.0
        largest = max(max(_world_box(o)[1] - _world_box(o)[0]) for o in objects)

        if emission and _luma(emission) * strength > 0.05:
            # Only a diffuser hanging directly over the dining top counts; pooja and
            # other decorative glows are left exactly as authored.
            found = []
            for obj in objects if table else []:
                lo, hi = _world_box(obj)
                size = hi - lo
                centre = (lo + hi) / 2
                over = table[2].x - 0.1 <= centre.x <= table[3].x + 0.1 and table[2].y - 0.1 <= centre.y <= table[3].y + 0.1
                if over and size.z < 0.03 and max(size.x, size.y) > 0.5 and min(size.x, size.y) > 0.06 and lo.z - floor_z > 1.4:
                    found.append((obj, lo, hi))
            if found:
                pendant_meshes.extend(found)
                _set(principled, ('Emission Color', 'Emission'), (1.0, 0.78, 0.52, 1.0))
                _set(principled, ('Emission Strength',), 9.0)
                record('lit pendant diffuser', name)
            continue

        if role == 'wood':
            _set(principled, ('Coat Weight', 'Clearcoat'), 0.22)
            _set(principled, ('Coat Roughness', 'Clearcoat Roughness'), 0.32)
            record('satin lacquer coat', name)
        elif role == 'plaster':
            _set(principled, ('Roughness',), 0.93)
            relief = False
            normal = _input(principled, 'Normal')
            if normal is not None and not normal.is_linked:
                relief = _add_bump(material, principled, 38.0, 0.05, 0.002)
            record('matte plaster' + (' with relief' if relief else ''), name)
        elif alpha is not None and alpha < 0.7:
            _set(principled, ('Alpha',), 1.0)
            _set(principled, ('Transmission Weight', 'Transmission'), 1.0)
            _set(principled, ('Roughness',), 0.02)
            _set(principled, ('IOR',), 1.5)
            record('glass (authored tint kept)', name)
        elif base and metallic > 0.3:
            brass = base[0] > base[2] * 1.8 and _luma(base) > 0.12
            if brass:
                _set(principled, ('Metallic',), 1.0)
                _set(principled, ('Roughness',), 0.3)
                record('brushed brass', name)
            elif largest < 0.2:
                _set(principled, ('Metallic',), 1.0)
                _set(principled, ('Roughness',), 0.34)
                record('brushed gunmetal hardware', name)
            else:
                _set(principled, ('Metallic',), 0.0)
                _set(principled, ('Roughness',), 0.46)
                _set(principled, ('Coat Weight', 'Clearcoat'), 0.25)
                _set(principled, ('Coat Roughness', 'Clearcoat Roughness'), 0.4)
                record('satin powder coat', name)
        elif base and roughness is not None and roughness >= 0.9 and 0.3 < _luma(base) < 0.85:
            _set(principled, ('Sheen Weight', 'Sheen'), 0.55)
            _set(principled, ('Sheen Roughness',), 0.45)
            _add_bump(material, principled, 900.0, 0.1, 0.0004)
            record('woven upholstery', name)

    for finish, names in sorted(summary.items()):
        changes.append({'kind': 'finish', 'finish': finish, 'materials': len(names), 'examples': sorted(names)[:3]})

    for obj, lo, hi in pendant_meshes:
        data = bpy.data.lights.new(f'{PREFIX}dining pendant light', 'AREA')
        data.shape = 'RECTANGLE'
        data.size, data.size_y = max(0.05, hi.x - lo.x), max(0.05, hi.y - lo.y)
        data.energy = PENDANT_WATTS
        data.color = (1.0, 0.8, 0.6)
        if hasattr(data, 'spread'):
            data.spread = math.radians(130)
        light = bpy.data.objects.new(f'{PREFIX}dining pendant light', data)
        scene.collection.objects.link(light)
        light.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z - 0.004)
        changes.append({'kind': 'light', 'name': light.name, 'watts': PENDANT_WATTS,
                        'sizeMetres': _rounded((data.size, data.size_y)), 'source': obj.name,
                        'note': 'Photographic source matching the existing pendant diffuser.'})

    if floor:
        _, lo, hi = floor
        tops = [_world_box(o)[1].z for o in scene.objects if o.type == 'MESH' and not o.hide_render]
        top = max(tops)
        if top - floor_z < 2.2:
            changes.append({'kind': 'ceiling', 'action': 'skipped', 'reason': 'walls lower than 2.2 m above the floor'})
        elif _has_ceiling(scene, lo, hi, top):
            changes.append({'kind': 'ceiling', 'action': 'kept existing ceiling'})
        else:
            size = (hi.x - lo.x, hi.y - lo.y, 0.02)
            ceiling = _new_object(scene, f'{PREFIX}painted ceiling',
                                  *_box((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, top + 0.01, *size),
                                  _paint_material(f'{PREFIX}ceiling paint'))
            changes.append({'kind': 'ceiling', 'added': ceiling.name, 'undersideMetres': round(top, 4),
                            'sizeMetres': _rounded(size[:2]),
                            'note': 'Export has no ceiling; plain slab at the wall top over the floor footprint.'})
            beam = _new_object(scene, f'{PREFIX}west hanging beam',
                               *_box(lo.x, (lo.y + hi.y) / 2, top - BEAM['drop'] / 2,
                                     BEAM['width'], hi.y - lo.y, BEAM['drop']),
                               ceiling.data.materials[0])
            changes.append({'kind': 'beam', 'added': beam.name, 'dropMetres': BEAM['drop'],
                            'widthMetres': BEAM['width'], 'note': 'Configured west beam; not in the editable export.'})

    if table is None:
        changes.append({'kind': 'styling', 'action': 'skipped', 'reason': 'dining table top not found'})
        return changes
    _, top, lo, hi = table
    cx, cy, top_z = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z
    along_x = (hi.x - lo.x) >= (hi.y - lo.y)
    length = max(hi.x - lo.x, hi.y - lo.y) - 0.16
    runner_size = (length, 0.30, 0.003) if along_x else (0.30, length, 0.003)
    runner = _new_object(scene, f'{PREFIX}linen table runner',
                         *_box(cx, cy, top_z + 0.0015, *runner_size),
                         _fabric_material(f'{PREFIX}oatmeal linen', _linear('#c9bca5')))
    bowl = _new_object(scene, f'{PREFIX}ceramic bowl', *_bowl(cx, cy, top_z + 0.003),
                       _ceramic_material(f'{PREFIX}glazed stoneware'), smooth=True)
    changes.append({'kind': 'styling', 'table': top.name, 'added': [runner.name, bowl.name],
                    'runnerMetres': _rounded(runner_size), 'bowlDiameterMetres': 0.28,
                    'note': 'Modest table styling; removable, never collides with seating.'})
    return changes
