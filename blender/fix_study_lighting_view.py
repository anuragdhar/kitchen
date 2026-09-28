"""Reframe the Study preview from inside the room beyond its south cabinet."""
from pathlib import Path
from mathutils import Vector
import bpy

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'blender/whole_home/lighting'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'A501-whole-home-lighting.blend'))
x1,x2=255*4.993/260,424*4.993/260
y1,y2=-444*3.277/163,-198*3.277/163
cx=(x1+x2)/2
for o in bpy.data.objects:
    if o.type=='MESH':
        c=sum((o.matrix_world@Vector(v) for v in o.bound_box),Vector())/8
        o.hide_render=not(x1-.15<=c.x<=x2+.15 and y1-.15<=c.y<=y2+.15)
        if c.z>2.5 and o.dimensions.x>1.5 and o.dimensions.y>1.5: o.hide_render=True
    elif o.type=='LIGHT':
        o.hide_render=not('study' in o.name)
bpy.ops.object.light_add(type='AREA',location=(cx,y1+.65,2.3))
l=bpy.context.object;l.name='Study preview soft front fill';l.data.energy=200;l.data.size=2.5
l.rotation_euler=(Vector((cx,(y1+y2)/2,1))-l.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.context.scene.camera
cam.animation_data_clear()
cam.location=(cx,(y1+y2)/2,7.2)
cam.rotation_euler=(Vector((cx,(y1+y2)/2,0))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=5.9
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.eevee.use_raytracing=True
s.render.image_settings.file_format='PNG';s.render.resolution_x=1080;s.render.resolution_y=780
s.render.filepath=str(OUT/'study-bedroom-two.png')
bpy.ops.render.render(write_still=True)
