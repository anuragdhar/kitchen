"""Room-by-room Cycles stills from the ACTUAL editable scene or a detailed native room.

blender --background --python-exit-code 1 --python blender/render_archviz.py -- --bundle room.zip
blender --background --python-exit-code 1 --python blender/render_archviz.py -- --room drawing
"""
import argparse
from contextlib import contextmanager
import hashlib
import json
import math
from pathlib import Path
import sys
import tempfile
import threading
import time
import uuid

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from archviz_contract import atomic_json, blender_bounds, load_bundle, sha256
from archviz_profiles import load_profiles, profile_digest
from archviz_room_details import apply_room_details
PROFILES = ROOT/'configs/archviz-profiles.json'


@contextmanager
def progress(label):
    stop, started = threading.Event(), time.monotonic()
    def report():
        while not stop.wait(30):
            print(f'ARCHVIZ_PROGRESS {label}: {time.monotonic()-started:.0f}s elapsed', flush=True)
    thread = threading.Thread(target=report, daemon=True)
    thread.start()
    print('ARCHVIZ_START', label, flush=True)
    try:
        yield
    finally:
        stop.set()
        thread.join(timeout=1)
        print(f'ARCHVIZ_END {label}: {time.monotonic()-started:.1f}s', flush=True)


def cycles_device(scene, requested):
    import bpy
    scene.render.engine = 'CYCLES'
    if requested == 'CPU':
        scene.cycles.device = 'CPU'
        return 'CPU'
    preferences = bpy.context.preferences.addons['cycles'].preferences
    for backend in (['OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'] if requested == 'AUTO' else [requested]):
        try:
            preferences.compute_device_type = backend
            preferences.get_devices()
            if not any(device.type == backend for device in preferences.devices):
                continue
            for device in preferences.devices:
                device.use = device.type == backend
            scene.cycles.device = 'GPU'
            return backend
        except (TypeError, ValueError, RuntimeError):
            continue
    if requested != 'AUTO':
        raise RuntimeError(f'{requested} is not available; try --device CPU or AUTO')
    scene.cycles.device = 'CPU'
    return 'CPU'


def source_id(obj):
    while obj:
        if obj.get('archvizSourceId'):
            return obj['archvizSourceId']
        obj = obj.parent
    return None


def bounds(objects):
    import bpy
    from mathutils import Vector
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in objects:
        evaluated = obj.evaluated_get(depsgraph)
        if evaluated.type == 'MESH':
            points.extend(evaluated.matrix_world @ v.co for v in evaluated.data.vertices)
    if not points:
        raise ValueError('No visible mesh vertices')
    return (Vector(tuple(min(p[i] for p in points) for i in range(3))),
            Vector(tuple(max(p[i] for p in points) for i in range(3))))


def verify_import(scene, capture):
    groups = {}
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue
        key = source_id(obj)
        if not key:
            raise ValueError(f'Imported mesh lost its source ID: {obj.name}')
        groups.setdefault(key, []).append(obj)
    expected = {item['id']: item for item in capture['meshes']}
    if set(groups) != set(expected):
        raise ValueError(f'Missing/unexpected source mesh IDs: {set(groups)^set(expected)}')
    max_error = 0
    for key, objects in groups.items():
        lo, hi = bounds(objects)
        want_lo, want_hi = blender_bounds(expected[key]['min'], expected[key]['max'])
        error = max(abs(a-b) for a,b in zip([*lo,*hi], [*want_lo,*want_hi]))
        max_error = max(max_error, error)
        triangles = sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
        if error > .0001 or triangles != expected[key]['triangles']:
            raise ValueError(f'{key}: geometry mismatch; bounds error {error:.6f} m, triangles {triangles}/{expected[key]["triangles"]}')
    return {'sourceObjects':len(expected), 'importedMeshes':sum(map(len, groups.values())),
            'maximumBoundsErrorMetres':max_error, 'triangleCountsMatch':True,
            'scope':'Source IDs, per-object world bounds and triangle counts; not a construction/collision certificate.'}


def geometry_signature(scene):
    import struct
    result = {}
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue
        digest = hashlib.sha256()
        for v in obj.data.vertices:
            digest.update(struct.pack('<3d', *v.co))
        for p in obj.data.polygons:
            digest.update(struct.pack('<I', len(p.vertices)))
            digest.update(struct.pack('<'+'I'*len(p.vertices), *p.vertices))
        result[obj.name] = (digest.hexdigest(), tuple(tuple(row) for row in obj.matrix_world), obj.hide_render)
    return result


def finish_pass(scene):
    """Retain color, wood species, UVs, PBR maps, roughness and geometry.
    Add Cycles-only edge shading to known wood/plaster/stone/metal surfaces.
    """
    seen, changes = set(), []
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.hide_render:
            continue
        for mat in obj.data.materials:
            if not mat or not mat.use_nodes or mat.name in seen:
                continue
            seen.add(mat.name)
            role = mat.get('interiorRole')
            explicit = mat.name.lower()
            if not role:
                role = next((role for word,role in [('walnut','wood'),('limestone','stone'),('mineral plaster','plaster'),('bronze','metal')]
                             if word in explicit), None)
            if role not in ('wood','plaster','stone','metal'):
                continue
            nodes, links = mat.node_tree.nodes, mat.node_tree.links
            for principled in [node for node in nodes if node.type == 'BSDF_PRINCIPLED']:
                bevel = nodes.new('ShaderNodeBevel')
                bevel.label = 'Archviz edge shading only - geometry unchanged'
                bevel.inputs['Radius'].default_value = .0008 if role == 'wood' else .0004
                bevel.samples = 4
                normal = principled.inputs['Normal']
                if normal.is_linked:
                    links.new(normal.links[0].from_socket, bevel.inputs['Normal'])
                links.new(bevel.outputs['Normal'], normal)
                changes.append({'material':mat.name, 'role':role, 'normalBevelMetres':bevel.inputs['Radius'].default_value})
    return changes


def make_camera(scene, name, position, target, lens):
    import bpy
    from mathutils import Vector
    data = bpy.data.cameras.new(name)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.lens, data.clip_start, data.clip_end = lens, .02, 300
    return obj


def cameras(scene, capture, profile, visible):
    from mathutils import Quaternion, Vector
    lo, hi = bounds(visible)
    center = (lo+hi)/2
    result = []
    if capture:
        info = capture['camera']
        position = info['position']
        camera = make_camera(scene, 'Captured design camera', (position[0],-position[2],position[1]), center, 28)
        camera.rotation_mode = 'QUATERNION'
        x,y,z,w = info['quaternion']
        camera.rotation_quaternion = Quaternion((1,0,0), math.pi/2) @ Quaternion((w,x,y,z))
        if info['type'] == 'orthographic':
            camera.data.type = 'ORTHO'
            camera.data.sensor_fit = 'HORIZONTAL'
            camera.data.ortho_scale = info['verticalSpan']*info['aspect']
        else:
            camera.data.sensor_fit = 'VERTICAL'
            camera.data.sensor_height = 24
            camera.data.lens = 24/(2*math.tan(math.radians(info['fov'])/2))
        result.append(('current', 'Current editable camera', camera, info['aspect']))
    else:
        authored = [scene.objects.get(name) for name in profile.get('cameras', [])]
        authored = [obj for obj in authored if obj and obj.type == 'CAMERA']
        if not authored and scene.camera:
            authored = [scene.camera]
        for index, obj in enumerate(authored):
            # Copy camera/data so no authored camera is edited.
            camera = obj.copy();camera.data = obj.data.copy();camera.animation_data_clear()
            scene.collection.objects.link(camera)
            result.append((f'authored-{index+1}', obj.name, camera, scene.render.resolution_x/max(1,scene.render.resolution_y)))
    x,y = profile['corner'];tx,ty = profile['target']
    eye = lo.z+min(profile['eyeHeight'],max(.5,hi.z-lo.z-.15))
    target = (lo.x+(hi.x-lo.x)*tx, lo.y+(hi.y-lo.y)*ty, lo.z+1.15)
    for key, label, px,py in [('hero','Room composition',x,y),('reverse','Reverse room view',1-x,1-y)]:
        position = (lo.x+(hi.x-lo.x)*px, lo.y+(hi.y-lo.y)*py, eye)
        # Check a short viewing clearance; never hide geometry to force a shot.
        import bpy
        depsgraph = bpy.context.evaluated_depsgraph_get()
        hit,*_ = scene.ray_cast(depsgraph, Vector(position), (Vector(target)-Vector(position)).normalized(), distance=.15)
        if hit:
            print(f'ARCHVIZ_CAMERA_SKIPPED {key}: obstructed. Use the captured camera.', flush=True)
            continue
        result.append((key,label,make_camera(scene, f'Archviz {key}', position,target,profile['lens']),1.5))
    if not result:
        raise ValueError('No usable camera; export an interior view from the app')
    return result


def studio_lighting(scene, capture, visible, mode):
    """Lighting-only treatment. Native room fixtures are kept; live exports use
    daylight proxies at transmissive vertical panes plus a named studio fill.
    These are photographic light sources, not a new electrical plan.
    """
    import bpy
    from mathutils import Vector
    if not capture:
        return [{'kind':'authored', 'note':'Detailed native room lighting retained.'}]
    lo, hi = bounds(visible);center = (lo+hi)/2
    scene.world = bpy.data.worlds.new('Archviz photographic environment')
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (.76,.84,1,1)
    bg.inputs['Strength'].default_value = .22 if mode=='day' else .025
    lights = []
    def area(name,position,target,width,height,energy,color):
        data = bpy.data.lights.new(name,'AREA');data.shape = 'RECTANGLE'
        data.size,data.size_y,data.energy,data.color = width,height,energy,color
        obj = bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location = position
        obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
        obj.visible_glossy = False
        lights.append({'name':name,'position':list(position),'target':list(target),'width':width,'height':height,'watts':energy})
    panes = []
    for item in capture['meshes']:
        if not item.get('transparent'):
            continue
        a,b = blender_bounds(item['min'],item['max'])
        w,d,h = [b[i]-a[i] for i in range(3)]
        if h>.4 and min(w,d)<.12 and max(w,d)>.4:
            panes.append((h*max(w,d),item,a,b))
    for _,item,a,b in sorted(panes,key=lambda row:row[0],reverse=True)[:4]:
        p = Vector([(a[i]+b[i])/2 for i in range(3)])
        axis = 0 if b[0]-a[0]<b[1]-a[1] else 1
        p[axis] += .025 if center[axis]>=p[axis] else -.025
        width,height = min(3,max(b[0]-a[0],b[1]-a[1])),min(2.5,b[2]-a[2])
        area(f'Daylight proxy | {item["id"]}',p,(center.x,center.y,max(lo.z+.8,p.z)),width,height,
             width*height*(85 if mode=='day' else 8),(.86,.93,1))
    # An explicit photographic fill, not floating fixture geometry. Never add a second ceiling mesh.
    width,height = max(.3,min(2,(hi.x-lo.x)*.65)),max(.3,min(2,(hi.y-lo.y)*.65))
    area('Photographic ceiling fill', (center.x,center.y,hi.z-.04),(center.x,center.y,lo.z+.7),
         width,height,90 if mode=='day' else 135,(1,.88,.72) if mode=='day' else (1,.72,.43))
    return lights


def run(args, temporary):
    import bpy
    profiles = load_profiles(PROFILES)
    capture = None
    if args.bundle:
        capture, source = load_bundle(args.bundle, temporary)
        room = capture['room']
        if args.room and args.room != room:
            raise ValueError('--room disagrees with the exported bundle')
        bpy.ops.wm.read_factory_settings(use_empty=True)
        with progress(f'{room}: import current design'):
            bpy.ops.import_scene.gltf(filepath=str(source), merge_vertices=False)
        audit = verify_import(bpy.context.scene,capture)
        source_kind = 'editable-snapshot'
    else:
        room = args.room
        profile = profiles['rooms'].get(room,{})
        if not profile.get('native'):
            raise ValueError('This room requires a current editable export. No fallback to the obsolete shared scene is permitted.')
        source = ROOT/profile['native']
        if not source.is_file():
            raise FileNotFoundError(source)
        bpy.ops.wm.open_mainfile(filepath=str(source),use_scripts=False)
        audit = {'scope':'Native detailed snapshot; live editable geometry has not been compared.'}
        source_kind = 'detailed-native-snapshot'
    if room not in profiles['rooms']:
        raise ValueError('No room render profile')
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    print('ARCHVIZ_GEOMETRY_OK',room,json.dumps(audit),flush=True)
    if args.check_only:
        return
    visible = [o for o in scene.objects if o.type=='MESH' and not o.hide_render]
    shots = cameras(scene,capture,profiles['rooms'][room],visible)
    if args.shots != 'all':
        wanted = set(args.shots.split(','));shots = [shot for shot in shots if shot[0] in wanted]
        if not shots:
            raise ValueError('None of the requested shots is usable')
    details = apply_room_details(scene, room, profiles['rooms'][room], ROOT, geometry_signature)
    # Original meshes were checked by the hook. Include additions in the final
    # invariant so nothing moves during subsequent shading or rendering.
    detailed_baseline = geometry_signature(scene)
    changes = finish_pass(scene)
    lighting = studio_lighting(scene,capture,visible,args.lighting)
    device = cycles_device(scene,args.device)
    quality = profiles['quality'][args.quality]
    scene.cycles.samples = quality['samples'];scene.cycles.use_denoising = True
    scene.cycles.use_adaptive_sampling = True;scene.cycles.adaptive_threshold = quality['noiseThreshold']
    scene.cycles.max_bounces = 12;scene.cycles.diffuse_bounces = 6;scene.cycles.glossy_bounces = 6
    scene.cycles.transmission_bounces = 8;scene.cycles.transparent_max_bounces = 12;scene.cycles.seed = 23
    scene.render.image_settings.file_format = 'PNG';scene.render.image_settings.color_depth = '16'
    scene.render.resolution_percentage = 100
    scene.render.use_compositing = False  # No stale compositor/denoiser from a native source.
    scene.render.use_sequencer = False
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.exposure = .15
    try:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except (TypeError,ValueError):
        pass  # AgX look names differ between supported Blender versions.
    # A unique immutable result folder prevents failed rerenders corrupting an older gallery.
    job = uuid.uuid4().hex[:16]
    public = args.public.resolve();output = public/'renders/archviz'/job
    output.mkdir(parents=True,exist_ok=False)
    images = []
    for key,label,camera,aspect in shots:
        scene.camera = camera
        width,height = quality['width'],max(64,round(quality['width']/aspect))
        scene.render.resolution_x,scene.render.resolution_y = width,height
        image = output/f'{key}.png';scene.render.filepath = str(image)
        with progress(f'{room}: {key} / {args.quality} / {device}'):
            bpy.ops.render.render(write_still=True)
        images.append({'label':label,'url':f'/renders/archviz/{job}/{key}.png','sha256':sha256(image),'size':[width,height]})
    if geometry_signature(scene) != detailed_baseline:
        raise AssertionError('Authored geometry, visibility or transforms changed')
    if args.save_scene:
        bpy.ops.file.pack_all()
        bpy.ops.wm.save_as_mainfile(filepath=str(output/'scene.blend'))
    provenance = {'room':room,'job':job,'sourceKind':source_kind,'sourceName':source.name,
        'sourceSha256':sha256(source),'capture':capture,'profileSha256':profile_digest(profiles,room,details['moduleSha256']),
        'generatorSha256':sha256(__file__),'contractSha256':sha256(HERE/'archviz_contract.py'),
        'blender':bpy.app.version_string,'device':device,'quality':args.quality,'lighting':args.lighting if capture else 'authored',
        'geometryAudit':audit,'geometryUnchangedDuringRendering':True,'roomDetails':details,
        'profileLoaderSha256':sha256(HERE/'archviz_profiles.py'),'detailLoaderSha256':sha256(HERE/'archviz_room_details.py'),'finishChanges':changes,'lights':lighting,
        'images':images,'reviewStatus':'unreviewed',
        'limitations':['Generated camera composition and appearance need image review.',
                       'Photographic light sources are not surveyed fixture placements.',
                       'No existing interactive baked GLB or saved project was replaced.']}
    atomic_json(output/'provenance.json',provenance)
    index_path = public/'renders/archviz/manifest.json'
    gallery = json.loads(index_path.read_text()) if index_path.exists() else {'schema':'a501.archviz-gallery','version':1,'renders':[]}
    if gallery.get('schema') != 'a501.archviz-gallery' or gallery.get('version') != 1:
        raise ValueError('Existing gallery has an unknown format; it was not overwritten')
    entry = {key:provenance[key] for key in ('room','job','sourceKind','quality','lighting','images','reviewStatus')}
    # One last completed run per room. Historical folders remain intact.
    gallery['renders'] = [r for r in gallery['renders'] if r['room'] != room]+[entry]
    atomic_json(index_path,gallery)
    print('ARCHVIZ_COMPLETE',room,output,flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle',type=Path)
    parser.add_argument('--room')
    parser.add_argument('--quality',choices=['draft','final','portfolio','test'],default='draft')
    parser.add_argument('--lighting',choices=['day','evening'],default='day')
    parser.add_argument('--device',choices=['AUTO','CPU','OPTIX','CUDA','HIP','ONEAPI','METAL'],default='AUTO')
    parser.add_argument('--shots',default='all',help='all, current, hero, reverse, or comma-separated shot IDs')
    parser.add_argument('--check-only',action='store_true')
    parser.add_argument('--save-scene',action='store_true')
    parser.add_argument('--public',type=Path,default=ROOT/'react-configurator/public')
    args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    with tempfile.TemporaryDirectory(prefix='a501-archviz-') as temporary:
        run(args,Path(temporary))


if __name__=='__main__':
    main()
