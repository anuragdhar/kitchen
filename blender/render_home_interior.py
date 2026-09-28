# SPDX-License-Identifier: GPL-3.0-or-later
# Home Interior Blender adapter. Runs separately; no Blender runtime is embedded in the web application.
import argparse, hashlib, json, math, pathlib, sys, time
import bpy
from mathutils import Vector

PRESETS = {'smoke': (480, 16), 'draft': (960, 32), 'balanced': (1600, 128), 'final': (2560, 512)}
def vec(v):
    if not isinstance(v, list) or len(v) != 3 or not all(isinstance(x,(int,float)) and math.isfinite(x) and abs(x)<10000 for x in v):
        raise ValueError('Invalid light vector')
    return Vector((v[0], -v[2], v[1]))  # glTF Y-up metres -> Blender Z-up

def setup_device(request):
    if request == 'cpu':
        bpy.context.scene.cycles.device='CPU'; return 'CPU'
    addon=bpy.context.preferences.addons.get('cycles')
    if addon:
        for backend in (['OPTIX','CUDA'] if request=='auto' else [request.upper()]):
            try:
                addon.preferences.compute_device_type=backend
                addon.preferences.get_devices()
                devices=[d for d in addon.preferences.devices if d.type==backend]
                if devices:
                    for d in addon.preferences.devices: d.use=d.type==backend
                    bpy.context.scene.cycles.device='GPU'; return backend+': '+', '.join(d.name for d in devices)
            except Exception:
                continue
    if request!='auto': raise RuntimeError('Requested GPU backend is unavailable: '+request)
    bpy.context.scene.cycles.device='CPU'; return 'CPU (auto fallback)'

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    parser=argparse.ArgumentParser();parser.add_argument('--job',required=True);parser.add_argument('--output',required=True)
    parser.add_argument('--quality',choices=PRESETS,default='balanced');parser.add_argument('--device',choices=['auto','cpu','cuda','optix'],default='auto');parser.add_argument('--overwrite',action='store_true')
    opt=parser.parse_args(args);start=time.time();job_path=pathlib.Path(opt.job).resolve()
    if job_path.stat().st_size>5_000_000: raise ValueError('Manifest too large')
    job=json.loads(job_path.read_text());out=pathlib.Path(opt.output).resolve();out.mkdir(parents=True,exist_ok=True)
    if not opt.overwrite and any((out/name).exists() for name in ['render.png','scene.blend','render-report.json']): raise FileExistsError('Output already exists')
    if job.get('format')!='home-interior-render' or job.get('schemaVersion')!=1 or job.get('unit')!='m' or job.get('coordinateSystem')!='Y_UP' or job.get('sceneFile')!='scene.glb': raise ValueError('Invalid job or scene path')
    glb=job_path.parent/'scene.glb'
    if glb.stat().st_size>300_000_000: raise ValueError('Scene too large')
    if hashlib.sha256(glb.read_bytes()).hexdigest()!=job['sceneSha256']: raise ValueError('Scene hash mismatch')
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(glb),import_pack_images=True)
    scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
    camera=bpy.data.objects.get(job.get('cameraName',''))
    if not camera or camera.type!='CAMERA': raise ValueError('Exported camera missing')
    scene.camera=camera
    imported_meshes=[o for o in scene.objects if o.type=='MESH']
    if not imported_meshes: raise ValueError('No imported mesh geometry')
    fixtures=job.get('fixtures',[]);punctual=job.get('punctualLights',[])
    if len(fixtures)>500 or len(punctual)>200: raise ValueError('Too many lights')
    for index,f in enumerate(fixtures):
        if not all(isinstance(f.get(k),(int,float)) and math.isfinite(f[k]) for k in ['width','height','previewIntensity','level','kelvin']): raise ValueError('Invalid fixture values')
        if not (0<f['width']<=100 and 0<f['height']<=100 and 0<=f['level']<=3 and 0<=f['previewIntensity']<=10000 and 1000<=f['kelvin']<=12000): raise ValueError('Fixture out of bounds')
        if f['level']==0: continue
        data=bpy.data.lights.new(f"{f.get('room','room')}/{f.get('layer','layer')}/{index}",'AREA');data.shape='RECTANGLE';data.size=f['width'];data.size_y=f['height']
        # Artistic conversion from preview luminance to Cycles radiant power, not measured lumens.
        data.energy=f['previewIntensity']*f['level']*f['width']*f['height']*.5
        data.use_nodes=True;nodes=data.node_tree.nodes;emission=next((n for n in nodes if n.type=='EMISSION'),None)
        if emission:
            blackbody=nodes.new('ShaderNodeBlackbody');blackbody.inputs['Temperature'].default_value=f['kelvin'];data.node_tree.links.new(blackbody.outputs['Color'],emission.inputs['Color'])
        obj=bpy.data.objects.new(data.name,data);scene.collection.objects.link(obj);obj.location=vec(f['position']);direction=vec(f['target'])-obj.location;obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
        if f.get('alongZ'): obj.rotation_euler.rotate_axis('Z',math.pi/2)
    for index,f in enumerate(punctual):
        if f.get('type') not in ['sun','point','spot'] or not isinstance(f.get('intensity'),(float,int)) or not math.isfinite(f['intensity']) or not 0<=f['intensity']<=100000: raise ValueError('Invalid punctual light')
        data=bpy.data.lights.new('daylight-'+str(index),{'sun':'SUN','point':'POINT','spot':'SPOT'}[f['type']]);data.energy=f['intensity'];data.color=f['color']
        if data.type=='SUN': data.angle=math.radians(8)
        else: data.shadow_soft_size=.08
        obj=bpy.data.objects.new(data.name,data);scene.collection.objects.link(obj);obj.location=vec(f['position']);obj.rotation_euler=(vec(f['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
    scene.world=bpy.data.worlds.new('Home Interior environment');scene.world.use_nodes=True
    world_strength=job.get('worldStrength',.1)
    if not isinstance(world_strength,(float,int)) or not math.isfinite(world_strength) or not 0<=world_strength<=10: raise ValueError('Invalid environment')
    background=scene.world.node_tree.nodes.get('Background');background.inputs['Color'].default_value=(.8,.85,1,1);background.inputs['Strength'].default_value=world_strength
    scene.render.engine='CYCLES';device=setup_device(opt.device);width,samples=PRESETS[opt.quality];aspect=job.get('aspect',1.5)
    if not isinstance(aspect,(float,int)) or not math.isfinite(aspect) or not .2<=aspect<=5: raise ValueError('Invalid aspect')
    scene.render.resolution_x=width;scene.render.resolution_y=max(64,round(width/aspect));scene.render.resolution_percentage=100
    scene.cycles.samples=samples;scene.cycles.use_denoising=True
    scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=4
    scene.cycles.seed=7;scene.render.threads_mode='FIXED';scene.render.threads=4
    for transform in ['AgX','Filmic','Standard']:
        try: scene.view_settings.view_transform=transform;break
        except (TypeError, ValueError): continue
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=str(out/'render.png')
    warnings=[]
    try:
        scene.cycles.denoiser='OPENIMAGEDENOISE'
    except TypeError as error:
        # Builds without any denoiser expose an empty dynamic enum.
        if 'OPENIMAGEDENOISE' not in str(error) or 'not found' not in str(error): raise
        scene.cycles.use_denoising=False
        warnings.append('OpenImageDenoise is unavailable in this Blender build; output is not denoised.')
    try:
        bpy.ops.render.render(write_still=True)
    except RuntimeError as error:
        # Retry only this known optional-feature failure, not unrelated errors.
        if 'Build without OpenImageDenois' not in str(error): raise
        scene.cycles.use_denoising=False
        warnings.append('This Blender build lacks OpenImageDenoise; output is rendered without denoising.')
        print('WARNING:', warnings[-1])
        bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'scene.blend'))
    report={'blenderVersion':bpy.app.version_string,'device':device,'engine':'CYCLES','quality':opt.quality,'samples':samples,'width':scene.render.resolution_x,'height':scene.render.resolution_y,'meshObjects':len(imported_meshes),'lights':sum(o.type=='LIGHT' for o in scene.objects),'seconds':round(time.time()-start,2),'sceneSha256':job['sceneSha256'],'room':job['room'],'status':'rendered','denoising':bool(scene.cycles.use_denoising),'warnings':warnings}
    (out/'render-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__': main()
