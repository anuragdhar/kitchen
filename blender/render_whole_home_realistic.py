"""Render the existing whole home with drawing-room finishes and selected decor.

Blender is an external process, never a browser/DLL dependency. See
 docs/WHOLE_HOME_REALISTIC.md. This script never saves over its source .blend.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from whole_home_render_contract import SIZES, PRESETS, QUALITY, load_job, support_fits

SOURCE = ROOT / 'blender/whole_home/lighting/A501-whole-home-lighting.blend'
PUBLIC = ROOT / 'react-configurator/public/renders/whole-home-realistic'


def digest(path):
    hasher = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def configure_cycles(scene, requested='AUTO'):
    """Try supported accelerators; AUTO falls back to CPU, never requires HIP."""
    import bpy
    scene.render.engine = 'CYCLES'
    if requested == 'CPU':
        scene.cycles.device = 'CPU'
        return 'CPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    choices = ['OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'] if requested == 'AUTO' else [requested]
    for backend in choices:
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            devices = [device for device in prefs.devices if device.type == backend]
            if not devices:
                continue
            for device in prefs.devices:
                device.use = device.type == backend
            scene.cycles.device = 'GPU'
            return backend
        except (TypeError, ValueError, RuntimeError):
            continue
    if requested != 'AUTO':
        raise RuntimeError(f'{requested} has no available Cycles device. Try --device CPU or AUTO.')
    scene.cycles.device = 'CPU'
    return 'CPU'


def world_bounds(obj, depsgraph):
    from mathutils import Vector
    evaluated = obj.evaluated_get(depsgraph)
    points = [evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box]
    return ([min(p[i] for p in points) for i in range(3)],
            [max(p[i] for p in points) for i in range(3)])


def supported_position(scene, obj, bounds, size, depsgraph):
    """Check the center AND footprint corners against actual evaluated surfaces."""
    from mathutils import Vector
    lo, hi = bounds
    x, y = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
    offsets = [(0, 0)] + [(dx * size[0]/2, dy * size[1]/2) for dx in (-1, 1) for dy in (-1, 1)]
    heights = []
    for dx, dy in offsets:
        hit, point, normal, _, target, _ = scene.ray_cast(
            depsgraph, Vector((x+dx, y+dy, hi[2]+.02)), Vector((0, 0, -1)), distance=.07)
        if not hit or target.original != obj.original or normal.z < .97:
            return None
        heights.append(point.z)
        # Check upward clearance for the complete artifact at each sample point.
        blocked, *_ = scene.ray_cast(depsgraph, point + Vector((0, 0, .004)),
                                     Vector((0, 0, 1)), distance=size[2]+.03)
        if blocked:
            return None
    if max(heights) - min(heights) > .003:
        return None
    return (x, y, max(heights)+.002)


def inventory(scene, job):
    import bpy
    depsgraph = bpy.context.evaluated_depsgraph_get()
    surfaces = []
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.hide_render or obj.hide_get():
            continue
        bounds = world_bounds(obj, depsgraph)
        for room in job['rooms']:
            kinds = [kind for kind, size in SIZES.items()
                     if support_fits(bounds, room['bounds'], kind)
                     and supported_position(scene, obj, bounds, size, depsgraph) is not None]
            if kinds:
                surfaces.append({'room': room['id'], 'object': obj.name,
                                 'bounds': bounds, 'kinds': kinds})
    return {'schema': 'a501.render-surfaces', 'version': 1,
            'source_sha256': digest(SOURCE), 'surfaces': surfaces,
            'notice': 'Candidate horizontal surfaces only. Confirm the selected object is a table, shelf or counter, not seating. Door swings and construction clearances are not certified.'}


def palette(scene):
    """Reuse the drawing-room's material/texture/wood helpers, not its coordinates."""
    import bpy
    import photoreal_drawing_room as drawing
    reference = bpy.data.objects.get('Finish metre reference')
    if reference is None:
        reference = bpy.data.objects.new('Finish metre reference', None)
        scene.collection.objects.link(reference)
    materials = {}
    for key, name, color, rough, metallic, grain, depth in [
        ('plaster', 'Whole home | warm ivory mineral plaster', (.65, .61, .54), .88, 0, 180, .00022),
        ('linen', 'Whole home | oatmeal linen', (.59, .52, .40), .90, 0, 850, .0005),
        ('stone', 'Whole home | honed limestone', (.52, .47, .39), .62, 0, 45, .00028),
        ('bronze', 'Whole home | champagne bronze', (.42, .29, .13), .32, .78, 650, .00004),
        ('ceramic', 'Whole home | ivory ceramic', (.57, .51, .41), .62, 0, 190, .00025),
        ('olive', 'Whole home | olive leaf', (.13, .16, .10), .82, 0, 450, .0001),
    ]:
        material = drawing.material(name, color, rough, metallic)
        drawing.texture(material, grain, depth, .22)
        materials[key] = material
    materials['linen'].node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value = .3
    materials['walnut'] = drawing.wood()
    # Explicit names only: never guess what an imported Material_123 represents.
    rules = [('Warm Beige Wall', 'plaster'), ('Sand cream ceiling paint', 'plaster'),
             ('Warm pale limestone floor', 'stone'), ('Bronze fixture trim', 'bronze')]
    changed = []
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.hide_render:
            continue
        role = obj.get('finishRole')  # Optional authored semantic role for furniture.
        if not isinstance(role, str):
            role = None
        for slot in obj.material_slots:
            old = slot.material
            key = role if role in materials else next((k for prefix, k in rules if old and old.name.startswith(prefix)), None)
            if key:
                # Object-linked slots avoid recoloring an unrelated linked-mesh instance.
                slot.link = 'OBJECT'
                slot.material = materials[key]
                changed.append({'object': obj.name, 'from': old.name if old else None, 'to': key})
    return materials, changed


def lathe(name, profile, material, location):
    import bpy
    segments = 48
    vertices = [(r*math.cos(i*math.tau/segments), r*math.sin(i*math.tau/segments), z)
                for z, r in profile for i in range(segments)]
    faces = [(j*segments+i, j*segments+(i+1)%segments,
              (j+1)*segments+(i+1)%segments, (j+1)*segments+i)
             for j in range(len(profile)-1) for i in range(segments)]
    faces.append(tuple(reversed(range(segments))))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    mesh.materials.append(material)
    for face in mesh.polygons:
        face.use_smooth = True
    shell = obj.modifiers.new('Ceramic or wood wall', 'SOLIDIFY')
    shell.thickness = .003
    shell.offset = -1
    return obj


def add_artifact(kind, location, materials, name):
    import bpy
    import photoreal_drawing_room as drawing
    x, y, z = location
    if kind == 'ceramic-vase':
        return [lathe(name, [(0,.045),(.02,.055),(.08,.07),(.14,.055),(.18,.027),(.22,.026)], materials['ceramic'], location)]
    if kind == 'wooden-bowl':
        return [lathe(name, [(0,.04),(.015,.075),(.04,.105),(.09,.13)], materials['walnut'], location)]
    if kind == 'books':
        objects = []
        for i in range(2):
            center = z + i*.035
            for label, dz, depth, mat in [('lower cover', .002, .004, 'linen'), ('pages', .017, .026, 'ceramic'), ('upper cover', .033, .004, 'linen')]:
                objects.append(drawing.box(f'{name} | {i} {label}', (x, y, center+dz), (.28, .20, depth), materials[mat], .001))
        return objects
    objects = [lathe(name, [(0,.06),(.13,.08),(.145,.08)], materials['ceramic'], location)]
    for i in range(7):
        angle = i*math.tau/7
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
            location=(x+.042*math.cos(angle), y+.042*math.sin(angle), z+.23))
        leaf = bpy.context.object
        leaf.name = f'{name} | leaf {i+1}'
        leaf.scale = (.045, .02, .14)
        leaf.rotation_euler = (.23*math.cos(angle), .23*math.sin(angle), angle)
        leaf.data.materials.append(materials['olive'])
        for face in leaf.data.polygons:
            face.use_smooth = True
        objects.append(leaf)
    return objects


def scene_signature(scene):
    """Authored vertices, topology, IDs, transforms and modifiers must survive."""
    import struct
    result = {}
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue
        h = hashlib.sha256()
        for vertex in obj.data.vertices:
            h.update(struct.pack('<3d', *vertex.co))
        for face in obj.data.polygons:
            h.update(struct.pack('<I', len(face.vertices)))
            h.update(struct.pack('<'+'I'*len(face.vertices), *face.vertices))
        result[obj.name] = (tuple(tuple(row) for row in obj.matrix_world), h.hexdigest(),
                            tuple((m.name, m.type) for m in obj.modifiers), obj.hide_render)
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--job', type=Path, default=ROOT/'blender/whole_home/realistic/job.json')
    parser.add_argument('--inspect', action='store_true', help='Publish candidate surfaces only; do not render')
    parser.add_argument('--device', choices=['AUTO','CPU','OPTIX','CUDA','HIP','ONEAPI','METAL'], default='AUTO')
    args = parser.parse_args(argv)
    job = load_job(args.job)
    if not SOURCE.is_file():
        raise FileNotFoundError(f'Missing authored source: {SOURCE}')
    import bpy
    from mathutils import Vector
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE), use_scripts=False)
    scene = bpy.context.scene
    baseline = scene_signature(scene)
    available = inventory(scene, job)
    atomic_json(PUBLIC/'surfaces.json', available)
    if args.inspect:
        print('SURFACE_INVENTORY', PUBLIC/'surfaces.json', flush=True)
        return
    # All selections are resolved before a material change, render or scene save.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    resolved = []
    for room in job['rooms']:
        for item in room['artifacts']:
            found = next((surface for surface in available['surfaces'] if surface['room']==room['id']
                          and surface['object']==item['support'] and item['kind'] in surface['kinds']), None)
            if found is None:
                raise ValueError(f"Unsupported placement in {room['name']}: {item}. Refresh the surface inventory.")
            obj = scene.objects[item['support']]
            position = supported_position(scene, obj, found['bounds'], SIZES[item['kind']], depsgraph)
            if position is None:
                raise ValueError(f'Obstructed support: {obj.name}')
            resolved.append((room['id'], item, position))
    materials, changes = palette(scene)
    placed = []
    for room_id, item, position in resolved:
        objects = add_artifact(item['kind'], position, materials, f"Decor | {room_id} | {item['kind']}")
        for obj in objects:
            obj['renderArtifact'] = item['kind']
            obj['supportObject'] = item['support']
        placed.append({'room':room_id, **item, 'position':position, 'objects':[o.name for o in objects]})
    bpy.context.view_layer.update()
    after = scene_signature(scene)
    if any(after.get(name) != signature for name, signature in baseline.items()):
        raise AssertionError('An authored mesh, transform, hidden flag or modifier was changed')
    backend = configure_cycles(scene, args.device)
    width, height, samples = QUALITY[job['quality']]
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.seed = 23
    scene.cycles.max_bounces = 12
    scene.cycles.diffuse_bounces = 6
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.exposure = 0
    world_strength, light_scale = PRESETS[job['preset']]
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get('Background')
    if background is None:
        raise RuntimeError('Expected source World Background node')
    background.inputs['Color'].default_value = (.68,.80,1,1)
    background.inputs['Strength'].default_value = world_strength
    for obj in scene.objects:
        if obj.type == 'LIGHT':
            obj.data = obj.data.copy()
            obj.data.energy *= light_scale
    dependencies = {str(path.relative_to(ROOT)):digest(path) for path in [
        Path(__file__), Path(__file__).with_name('photoreal_drawing_room.py'),
        Path(__file__).with_name('whole_home_render_contract.py'),
        *[ROOT/'react-configurator/public/textures/wood095'/name for name in ('color.jpg','roughness.jpg','displacement.jpg')]]}
    fingerprint = hashlib.sha256((json.dumps(job, sort_keys=True)+digest(SOURCE)
        +json.dumps(dependencies, sort_keys=True)+bpy.app.version_string+backend).encode()).hexdigest()[:12]
    output = PUBLIC/fingerprint
    output.mkdir(parents=True, exist_ok=True)
    evidence = ROOT/'blender/whole_home/realistic'/fingerprint
    evidence.mkdir(parents=True, exist_ok=True)
    ceilings = [obj for obj in scene.objects if ' | sand ceiling' in obj.name]
    ceiling_states = {obj.name:obj.hide_render for obj in ceilings}
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.name = 'Whole home realistic camera'
    scene.camera = camera
    # Prevent the saved aerial tour animation from moving the newly created camera.
    camera.data.clip_start = .04
    camera.data.clip_end = 300
    rendered = []
    try:
        for obj in ceilings:
            obj.hide_render = False  # Generated ceiling panels participate in room light transport.
        for room in job['rooms']:
            x1,y1,x2,y2 = room['bounds']
            cx, cy = (x1+x2)/2, (y1+y2)/2
            camera.data.type = 'PERSP'
            camera.data.lens = 19 if x2-x1 < 2.8 else 24
            camera.location = (cx, y1+.18, 1.55)
            camera.rotation_euler = (Vector((cx,y2-.20,1.25))-camera.location).to_track_quat('-Z','Y').to_euler()
            scene.render.filepath = str(output/f"{room['id']}.png")
            bpy.ops.render.render(write_still=True)
            rendered.append({'id':room['id'],'name':room['name'],
                             'image':f"/renders/whole-home-realistic/{fingerprint}/{room['id']}.png"})
            print('ROOM_RENDER_READY', room['id'], flush=True)
        x1,y1 = min(r['bounds'][0] for r in job['rooms']), min(r['bounds'][1] for r in job['rooms'])
        x2,y2 = max(r['bounds'][2] for r in job['rooms']), max(r['bounds'][3] for r in job['rooms'])
        for obj in ceilings:
            obj.hide_render = True
        camera.data.type = 'ORTHO'
        camera.data.ortho_scale = max(x2-x1, (y2-y1)*width/height)*1.12
        camera.location = ((x1+x2)/2, (y1+y2)/2, 30)
        camera.rotation_euler = (0,0,0)
        scene.render.filepath = str(output/'whole-home.png')
        bpy.ops.render.render(write_still=True)
        rendered.insert(0, {'id':'whole-home','name':'Whole-home cutaway',
                           'image':f'/renders/whole-home-realistic/{fingerprint}/whole-home.png'})
    finally:
        for obj in ceilings:
            obj.hide_render = ceiling_states[obj.name]
    after = scene_signature(scene)
    if any(after.get(name) != signature for name, signature in baseline.items()):
        raise AssertionError('An authored mesh changed during rendering')
    # Only new generated files are saved. Originals and currently published GLBs stay intact.
    bpy.ops.file.pack_all()
    blend = evidence/'A501-whole-home-realistic.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    provenance = {'source':str(SOURCE.relative_to(ROOT)), 'source_sha256':digest(SOURCE),
        'generator_sha256':digest(__file__), 'dependencies':dependencies, 'blender':bpy.app.version_string,
        'device':backend, 'job':job, 'preserved_meshes':len(baseline),
        'material_changes':changes, 'placed_artifacts':placed,
        'blend':str(blend.relative_to(ROOT)), 'blend_sha256':digest(blend),
        'images':{entry['id']:digest(ROOT/'react-configurator/public'/entry['image'].lstrip('/')) for entry in rendered},
        'limits':['Authored furniture retained; dedicated room additions are not transplanted.',
                  'Camera framing, appearance and construction clearances require human review.',
                  'Existing interactive baked GLBs are not replaced by this still-render pass.']}
    atomic_json(evidence/'provenance.json', provenance)
    # Publish last: a failed render never makes a partial job look complete in the gallery.
    atomic_json(PUBLIC/'manifest.json', {'schema':'a501.whole-home-output','version':1,
        'job':fingerprint,'preset':job['preset'],'quality':job['quality'],'rooms':rendered})
    print('WHOLE_HOME_RENDER_COMPLETE', blend, flush=True)


if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
