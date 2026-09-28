"""Shared warm-finish Blender concept, room stills, and an aerial home tour."""

from pathlib import Path
from mathutils import Vector
import bpy
import math

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'blender/whole_home/current-source/A501-furnished-reference.glb'
OUT = ROOT / 'blender/whole_home/lighting'
ASSET = ROOT / 'blender/assets/beige_wall_001'
OUT.mkdir(parents=True, exist_ok=True)

SX = 4.993 / 260
SY = 3.277 / 163
ROOMS = {
    'drawing-room': (515, 449, 688, 715),
    'lobby-dining': (255, 449, 515, 612),
    'bedroom-one': (339, 612, 515, 794),
    'bedroom-three': (50, 198, 255, 390),
    'study-bedroom-two': (255, 198, 424, 444),
    'kitchen': (130, 503, 255, 703),
    'main-entry': (515, 715, 688, 874),
    'balcony-office': (424, 188, 496, 316),
    'terrace': (255, 69, 424, 188),
}

def bounds(plan):
    a,b,c,d = plan
    return a*SX, -d*SY, c*SX, -b*SY

def mat(name, color, rough=.8):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    m.diffuse_color=(*color,1)
    return m

def box(name, loc, dims, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    return o

def light(name, pos, target, power, size, color=(1,.83,.66)):
    bpy.ops.object.light_add(type='AREA', location=pos)
    o=bpy.context.object; o.name=name; o.data.energy=power
    o.data.size=size; o.data.color=color
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o

def center(name):
    x1,y1,x2,y2=bounds(ROOMS[name]); return (x1+x2)/2,(y1+y2)/2

bpy.ops.import_scene.gltf(filepath=str(SOURCE))
original_meshes=[o for o in bpy.data.objects if o.type=='MESH']
original_centers={o.name:sum((o.matrix_world@Vector(c) for c in o.bound_box),Vector())/8 for o in original_meshes}

# Shared photographed wall finish. The glTF wall material is the main neutral shell.
walls=bpy.data.materials.get('Material_0')
if walls:
    walls.name='Warm Beige Wall 001 painted plaster - Poly Haven CC0'
    p=walls.node_tree.nodes.get('Principled BSDF')
    coord=walls.node_tree.nodes.new('ShaderNodeTexCoord')
    tex=walls.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image=bpy.data.images.load(str(ASSET/'diffuse.jpg'),check_existing=True)
    tex.projection='BOX'; tex.projection_blend=.25
    tint=walls.node_tree.nodes.new('ShaderNodeHueSaturation')
    tint.inputs['Saturation'].default_value=.78
    tint.inputs['Value'].default_value=1.22
    walls.node_tree.links.new(coord.outputs['Generated'],tex.inputs['Vector'])
    walls.node_tree.links.new(tex.outputs['Color'],tint.inputs['Color'])
    walls.node_tree.links.new(tint.outputs['Color'],p.inputs['Base Color'])
    p.inputs['Roughness'].default_value=.91

ceiling=mat('Sand cream ceiling paint',(.78,.68,.58),.95)
floor_mat=mat('Warm pale limestone floor',(.72,.67,.59),.76)
glow=mat('Warm opal lighting diffuser',(.95,.80,.61),.55)
gp=glow.node_tree.nodes.get('Principled BSDF')
gp.inputs['Emission Color'].default_value=(1,.72,.45,1)
gp.inputs['Emission Strength'].default_value=.8
bronze=mat('Bronze fixture trim',(.34,.24,.16),.42)

fixtures={}
for name,plan in ROOMS.items():
    x1,y1,x2,y2=bounds(plan); cx,cy=center(name)
    members=[]
    # A tinted slab makes the ceiling tone visible in the saved model. It is
    # hidden for the cutaway room stills so the interior remains readable.
    members.append(box(f'{name} | limestone floor',(cx,cy,.015),(x2-x1-.02,y2-y1-.02,.026),floor_mat))
    if name != 'terrace':
        members.append(box(f'{name} | sand ceiling',(cx,cy,2.665),(x2-x1-.02,y2-y1-.02,.025),ceiling))
    if name == 'drawing-room':
        # Existing chandelier comes from the shared GLB. Do not add a second one.
        positions=[(cx,cy,195)]
    elif name in ('kitchen','study-bedroom-two','lobby-dining','bedroom-three','bedroom-one'):
        positions=[(cx,cy,185)]
    else:
        positions=[(cx,cy,95)]
    for j,(px,py,power) in enumerate(positions):
        members.append(light(f'{name} | warm ambient {j+1}',(px,py,2.50),(px,py,.75),power,2.0))
    # Add a second independent lighting layer suited to each room.
    if name == 'kitchen':
        members.append(light('kitchen | west counter task',(x1+.38,cy,2.08),(x1+.55,cy,.84),85,1.6,(1,.91,.78)))
        members.append(light('kitchen | east counter task',(x2-.35,cy,2.08),(x2-.55,cy,.84),85,1.6,(1,.91,.78)))
    elif name == 'lobby-dining':
        members.append(light('lobby | dining task',(cx,cy,2.27),(cx,cy,.72),100,1.0))
    elif name == 'study-bedroom-two':
        members.append(light('study | desk task',(x2-.30,y1+.65,1.58),(x2-.50,y1+.65,.72),75,.5,(1,.91,.78)))
    elif name == 'bedroom-three':
        members.append(light('bedroom three | dressing mirror',(x2-.20,y2-.40,1.76),(x2-.55,y2-.40,1.45),75,.55))
    elif name == 'bedroom-one':
        members.append(light('bedroom one | bedside task',(x2-.35,cy,1.55),(cx,cy,.64),55,.6))
    elif name == 'drawing-room':
        members.append(light('drawing | west wall wash',(x2-.18,y1+.85,1.95),(x2-.25,y1+.85,2.55),45,.55))
        members.append(light('drawing | window seat reading',(cx,y1+.30,1.65),(cx,y1+.30,.55),45,.5))
    elif name == 'balcony-office':
        members.append(light('balcony office | desk task',(cx,cy,1.75),(cx,cy,.78),55,.5))
    elif name == 'main-entry':
        members.append(light('entry | shoe storage accent',(cx,cy,2.3),(cx,cy,1.1),45,.7))
    elif name == 'terrace':
        members.append(light('terrace | wall accent',(cx,cy,2.4),(cx,cy,.7),110,1.7))
    fixtures[name]=members

world=bpy.context.scene.world
world.use_nodes=True
world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.78,.72,.66,1)
world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.34
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.eevee.use_raytracing=True
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=-.45
scene.render.image_settings.file_format='PNG'
scene.render.resolution_x=1080
scene.render.resolution_y=780
scene.render.resolution_percentage=100

bpy.ops.object.camera_add()
camera=bpy.context.object
camera.name='Home tour camera'
scene.camera=camera
camera.data.lens=22

for name,plan in ROOMS.items():
    x1,y1,x2,y2=bounds(plan); cx,cy=center(name)
    for obj in original_meshes:
        c=original_centers[obj.name]
        obj.hide_render=not(x1-.22<=c.x<=x2+.22 and y1-.22<=c.y<=y2+.22)
        # Hide only the front/south wall for this eye-level cutaway.
        if abs(c.y-y1)<.10 and c.z>.65:
            obj.hide_render=True
    for room,objects in fixtures.items():
        for obj in objects:
            obj.hide_render=(room!=name)
    # Include adjacent warm daylight from the open side of the cutaway.
    daylight=light(f'{name} | soft daylight',(cx,y1-.25,2.15),(cx,cy,1.0),170,2.4,(1,.94,.86))
    camera.location=(cx,y1-.95,1.65)
    camera.rotation_euler=(Vector((cx,y2-.30,1.25))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.lens=19 if (x2-x1)<2.8 else 22
    scene.render.filepath=str(OUT/f'{name}.png')
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(daylight,do_unlink=True)
    print('ROOM_RENDER_READY',name,flush=True)

# Short guided overhead tour. The camera stays above the walls, so the route
# never incorrectly appears to pass through solid partitions.
for obj in original_meshes: obj.hide_render=False
for objects in fixtures.values():
    for obj in objects: obj.hide_render=('sand ceiling' in obj.name)
tour=['main-entry','drawing-room','lobby-dining','kitchen','bedroom-one','study-bedroom-two','bedroom-three']
scene.frame_start=1; scene.frame_end=73
camera.data.lens=27
for i,name in enumerate(tour):
    cx,cy=center(name)
    f=1+i*12
    camera.location=(cx+.8,cy-1.0,9.2)
    camera.rotation_euler=(Vector((cx,cy,0))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.keyframe_insert(data_path='location',frame=f)
    camera.keyframe_insert(data_path='rotation_euler',frame=f)
scene.render.resolution_x=960; scene.render.resolution_y=540
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.fps=10
scene.render.filepath=str(OUT/'tour-frames'/'frame_')
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'A501-whole-home-lighting.blend'))
bpy.ops.render.render(animation=True)
print('HOME_LIGHTING_FRAMES_COMPLETE',flush=True)
