"""Add lighting and preview images for the remaining clickable home spaces."""
from pathlib import Path
from mathutils import Vector
import bpy

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'blender/whole_home/lighting'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'A501-whole-home-lighting.blend'))
SX=4.993/260;SY=3.277/163
spaces={
    'pooja-ghar':(255,612,317,662),
    'storage':(145,396,205,451),
    'bedroom-one-balcony':(273,672,339,794),
}
def rect(plan):
    a,b,c,d=plan
    return a*SX,-d*SY,c*SX,-b*SY

added=[]
for name,plan in spaces.items():
    x1,y1,x2,y2=rect(plan);cx=(x1+x2)/2;cy=(y1+y2)/2
    for old in list(bpy.data.objects):
        if old.name in (f'{name} | warm ambient',f'{name} | warm floor'):
            bpy.data.objects.remove(old,do_unlink=True)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,cy,.012))
    slab=bpy.context.object;slab.name=f'{name} | warm floor'
    slab.dimensions=(x2-x1-.02,y2-y1-.02,.02)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    slab.data.materials.append(bpy.data.materials['Warm pale limestone floor'])
    bpy.ops.object.light_add(type='AREA',location=(cx,cy,2.45))
    lamp=bpy.context.object;lamp.name=f'{name} | warm ambient'
    lamp.data.energy=190;lamp.data.size=1.2;lamp.data.color=(1,.86,.72)
    lamp.rotation_euler=(Vector((cx,cy,.4))-lamp.location).to_track_quat('-Z','Y').to_euler()
    added.append(lamp)

bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'A501-whole-home-lighting.blend'))
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE';scene.eevee.use_raytracing=True
scene.render.image_settings.file_format='PNG'
scene.render.resolution_x=1080;scene.render.resolution_y=780
cam=scene.camera;cam.animation_data_clear()
for name,plan in spaces.items():
    x1,y1,x2,y2=rect(plan);cx=(x1+x2)/2;cy=(y1+y2)/2
    for obj in bpy.data.objects:
        if obj.type=='MESH':
            c=sum((obj.matrix_world@Vector(v) for v in obj.bound_box),Vector())/8
            obj.hide_render=not(x1-.18<=c.x<=x2+.18 and y1-.18<=c.y<=y2+.18)
            if c.z>2.5 and obj.dimensions.x>1.0 and obj.dimensions.y>1.0:obj.hide_render=True
        elif obj.type=='LIGHT':
            obj.hide_render=not(name in obj.name)
    cam.location=(cx,cy,5.5)
    cam.rotation_euler=(Vector((cx,cy,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=max(x2-x1,y2-y1)+.55
    scene.render.filepath=str(OUT/f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print('SMALL_SPACE_RENDER_READY',name,flush=True)
