"""Drawing Room finish/detail pass; preserves the shared scene's authored meshes.

blender --background --python-exit-code 1 --python blender/photoreal_drawing_room.py
Append -- --preview for a small draft. Coordinates are Blender metres, Z up.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'blender/whole_home/lighting/A501-whole-home-lighting.blend'
OUT=ROOT/'blender/drawing_room/elegant'
WOOD=ROOT/'react-configurator/public/textures/wood095'
X1,X2=515*4.993/260,688*4.993/260
Y1,Y2=-715*3.277/163,-449*3.277/163
CX,CY=(X1+X2)/2,(Y1+Y2)/2


def material(name,color,rough=.75,metal=0):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    mat.diffuse_color=(*color,1)
    p=mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal
    return mat


def texture(mat,scale,distance=.0003,strength=.25):
    n,l=mat.node_tree.nodes,mat.node_tree.links
    p=n.get('Principled BSDF')
    uv=n.new('ShaderNodeTexCoord');uv.object=bpy.data.objects['Finish metre reference']
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale
    noise.inputs['Detail'].default_value=3
    bump=n.new('ShaderNodeBump');bump.inputs['Distance'].default_value=distance
    bump.inputs['Strength'].default_value=strength
    l.new(uv.outputs['Object'],noise.inputs['Vector'])
    l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
    return noise,bump


def wood():
    mat=material('Smoked walnut - photographed grain',(.23,.12,.064),.42)
    n,l=mat.node_tree.nodes,mat.node_tree.links;p=n.get('Principled BSDF')
    uv=n.new('ShaderNodeTexCoord');uv.object=bpy.data.objects['Finish metre reference']
    split=n.new('ShaderNodeSeparateXYZ');combine=n.new('ShaderNodeCombineXYZ')
    l.new(uv.outputs['Object'],split.inputs[0]);l.new(split.outputs['Z'],combine.inputs['X'])
    across=n.new('ShaderNodeMath');across.operation='ADD'
    l.new(split.outputs['X'],across.inputs[0]);l.new(split.outputs['Y'],across.inputs[1])
    l.new(across.outputs[0],combine.inputs['Y'])
    maps={}
    for name in ('color.jpg','roughness.jpg','displacement.jpg'):
        tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(WOOD/name),check_existing=True)
        if name!='color.jpg':tex.image.colorspace_settings.name='Non-Color'
        l.new(combine.outputs[0],tex.inputs[0]);maps[name]=tex
    ramp=n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position=.08;ramp.color_ramp.elements[0].color=(.07,.036,.021,1)
    ramp.color_ramp.elements[1].position=.65;ramp.color_ramp.elements[1].color=(.31,.19,.10,1)
    l.new(maps['color.jpg'].outputs['Color'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
    bump=n.new('ShaderNodeBump');bump.inputs['Distance'].default_value=.00025
    l.new(maps['displacement.jpg'].outputs[0],bump.inputs['Height']);l.new(bump.outputs[0],p.inputs['Normal'])
    rough=n.new('ShaderNodeMapRange');rough.inputs['To Min'].default_value=.34;rough.inputs['To Max'].default_value=.54
    l.new(maps['roughness.jpg'].outputs[0],rough.inputs['Value']);l.new(rough.outputs[0],p.inputs['Roughness'])
    return mat


def assign(names,mat):
    for name in names:
        obj=bpy.data.objects.get(name)
        if obj:
            obj.data.materials.clear();obj.data.materials.append(mat)


def box(name,loc,dims,mat,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    if bevel:
        m=o.modifiers.new('Upholstery edge softness','BEVEL');m.width=bevel;m.segments=5
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o


def pillow(name,loc,dims,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=loc)
    o=bpy.context.object;o.name=name
    for v in o.data.vertices:
        x,y,z=v.co
        v.co.x=math.copysign(abs(x)**.48,x)
        v.co.y=math.copysign(abs(y)**.48,y)
        v.co.z=z*(1+.04*math.sin(31*x+8*y)*(1-z*z))
    o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o


def area(name,pos,target,energy,size,color):
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name
    o.data.energy=energy;o.data.size=size;o.data.color=color
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o


def camera(name,pos,target,lens):
    bpy.ops.object.camera_add(location=pos);o=bpy.context.object;o.name=name;o.data.lens=lens
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o


def curtain(name,x,mat):
    vertices,faces=[],[]
    for j in range(49):
        t=j/48
        for i in range(41):
            u=i/40
            vertices.append((x+u*.29,-9.16+.032*math.sin(u*8*math.pi)+.006*math.sin(t*8+u*9),.60+t*1.78))
            if i<40 and j<48:
                a=j*41+i;faces.append((a,a+1,a+42,a+41))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(mat)
    for poly in mesh.polygons:poly.use_smooth=True
    thick=obj.modifiers.new('Linen hem thickness','SOLIDIFY');thick.thickness=.002


def vessel(mat):
    profile=[(0,.045),(.018,.060),(.06,.068),(.11,.051),(.14,.029),(.18,.026)]
    vertices=[(11.47+r*math.cos(i*2*math.pi/48),-11.77+r*math.sin(i*2*math.pi/48),.458+z) for z,r in profile for i in range(48)]
    faces=[]
    for j in range(len(profile)-1):
        for i in range(48):faces.append((j*48+i,j*48+(i+1)%48,(j+1)*48+(i+1)%48,(j+1)*48+i))
    faces.append(tuple(reversed(range(48))))
    mesh=bpy.data.meshes.new('Thrown ceramic profile');mesh.from_pydata(vertices,[],faces);mesh.update()
    o=bpy.data.objects.new('Open ceramic table vase',mesh);bpy.context.collection.objects.link(o);mesh.materials.append(mat)
    for p in mesh.polygons:p.use_smooth=True
    solid=o.modifiers.new('Ceramic wall thickness','SOLIDIFY');solid.thickness=.004


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--preview',action='store_true')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    OUT.mkdir(parents=True,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene
    baseline={o.name:(o.matrix_world.copy(),tuple(tuple(v.co) for v in o.data.vertices)) for o in scene.objects if o.type=='MESH'}
    focused=[]
    for o in scene.objects:
        if o.type=='LIGHT':o.data.energy=0
        if o.type!='MESH':continue
        c=sum((o.matrix_world@Vector(v) for v in o.bound_box),Vector())/8
        keep=X1-.12<=c.x<=X2+.12 and Y1-.10<=c.y<=Y2+.10
        if not keep:o.hide_render=True
        else:focused.append(o)
    reference=bpy.data.objects.new('Finish metre reference',None);scene.collection.objects.link(reference)
    plaster=material('Warm ivory mineral plaster',(.65,.61,.54),.88);texture(plaster,180,.00022,.18)
    linen=material('Olive woven upholstery',(.13,.16,.10),.88);texture(linen,900,.0006,.35)
    linen.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.35
    ivory=material('Oatmeal linen cushions',(.59,.52,.40),.9);texture(ivory,850,.0005,.3)
    ivory.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.3
    tobacco=material('Tobacco linen accent',(.30,.14,.072),.9);texture(tobacco,850,.00045,.25)
    walnut=wood()
    bronze=material('Brushed champagne bronze',(.42,.29,.13),.32,.78);texture(bronze,650,.00004,.1)
    stone=material('Honed limestone',(.52,.47,.39),.62)
    noise,bump=texture(stone,45,.00028,.25)
    ramp=stone.node_tree.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color=(.38,.34,.28,1);ramp.color_ramp.elements[1].color=(.64,.59,.50,1)
    stone.node_tree.links.new(noise.outputs[0],ramp.inputs[0]);stone.node_tree.links.new(ramp.outputs[0],stone.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    rug=material('Handwoven oatmeal rug',(.38,.33,.25),.96);texture(rug,1050,.0007,.45)
    # Larger-scale wool variation prevents the rug reading as a uniform slab.
    n,l=rug.node_tree.nodes,rug.node_tree.links
    variation=n.new('ShaderNodeTexNoise');variation.inputs['Scale'].default_value=55
    tint=n.new('ShaderNodeValToRGB');tint.color_ramp.elements[0].color=(.27,.23,.18,1);tint.color_ramp.elements[1].color=(.45,.39,.30,1)
    l.new(variation.outputs[0],tint.inputs[0]);l.new(tint.outputs[0],n.get('Principled BSDF').inputs['Base Color'])
    for o in focused:
        for slot in o.material_slots:
            if slot.material and (slot.material.name.startswith('Warm Beige Wall') or slot.material.name=='Material_3'):slot.material=plaster
    assign(['Element 165','Element 166','Element 173'],linen)
    for name in ('Element 165','Element 166'):
        obj=bpy.data.objects[name]
        edge=obj.modifiers.new('Soft upholstery corners','BEVEL');edge.width=.025;edge.segments=5
        obj.modifiers.new('Upholstery corner normals','WEIGHTED_NORMAL')
    assign([f'Element {i}' for i in range(150,165)]+['Element 172','Element 122','Element 123'],walnut)
    assign(['Element 167','drawing-room | limestone floor'],stone)
    assign(['Existing chandelier over oval table','Element 134','Element 135','Element 137','Element 139','Element 140','Element 141'],bronze)
    # Shading bevels retain every authored vertex and furniture envelope.
    for mat in (walnut,stone,bronze):
        n,l=mat.node_tree.nodes,mat.node_tree.links;p=n.get('Principled BSDF');bevel=n.new('ShaderNodeBevel')
        bevel.inputs['Radius'].default_value=.001;bevel.samples=4
        if p.inputs['Normal'].is_linked:l.new(p.inputs['Normal'].links[0].from_socket,bevel.inputs['Normal'])
        l.new(bevel.outputs[0],p.inputs['Normal'])
    glass=material('Clear window glass',(.92,.96,1),.04)
    gp=glass.node_tree.nodes.get('Principled BSDF');gp.inputs['Transmission Weight'].default_value=1;gp.inputs['IOR'].default_value=1.45
    assign(['Element 35'],glass)
    # Existing light geometry stays in place; use realistic warm diffuser values.
    glow=material('Warm opal diffuser',(.8,.7,.52),.55)
    p=glow.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.73,.43,1);p.inputs['Emission Strength'].default_value=2.5
    assign(['Element 136','Element 138','Element 142','Element 143'],glow)
    box('Render ceiling',(CX,CY,2.725),(X2-X1,Y2-Y1,.05),plaster)
    box('Drawing woven rug',(11.72,-11.91,.038),(1.85,2.95,.018),rug,.008)
    for i,y in enumerate((-11.21,-11.949,-12.688)):
        box(f'Tailored sofa seat {i}',(12.565,y,.587),(.68,.715,.114),linen,.047)
        pillow(f'Tailored sofa back {i}',(12.91,y,.745),(.21,.713,.29),linen)
    for x in (12.31,12.97):
        for y in (-10.94,-12.95):
            bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.025,depth=.14,location=(x,y,.10))
            leg=bpy.context.object;leg.name='Walnut sofa support';leg.data.materials.append(walnut)
    pillow('Oatmeal accent cushion',(12.73,-11.14,.77),(.22,.43,.39),ivory)
    pillow('Tobacco accent cushion',(12.73,-12.60,.75),(.22,.42,.35),tobacco)
    # Books and ceramic accent sit on the existing table; no furniture moves.
    book=material('Book cloth cover',(.15,.11,.075),.85)
    box('Coffee table design book',(11.51,-12.13,.474),(.25,.31,.032),book,.003)
    vase=material('Matte ivory ceramic',(.57,.51,.41),.62);texture(vase,190,.00025,.16)
    vessel(vase)
    curtain('Left oatmeal linen drape',10.40,ivory)
    curtain('Right oatmeal linen drape',12.53,ivory)
    # Open sky beyond the actual window; all sources have physical room locations.
    bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.68,.80,1,1);bg.inputs['Strength'].default_value=.28
    # Place the daylight proxy just inside the imported thick glazing, avoiding
    # the placeholder pane's unrealistic absorption while retaining its mesh.
    daylight=area('Large cool window daylight',(11.6,-9.13,1.70),(11.9,-11.8,.7),170,2.0,(.86,.93,1))
    daylight.visible_glossy=False;daylight.visible_transmission=False
    area('Warm chandelier downward',(11.483,-11.949,2.21),(11.483,-11.949,.5),65,.6,(1,.80,.58))
    area('West sconce wall wash',(13.08,-13.523,1.95),(13.14,-13.523,2.5),22,.22,(1,.79,.56))
    area('Window seat reading',(12.945,-9.718,1.49),(11.65,-9.35,.5),12,.14,(1,.84,.63))
    area('Soft lobby bounce',(9.55,-10.50,1.95),(12.5,-11.9,1.1),85,2.2,(1,.94,.86))
    scene.render.engine='CYCLES';prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='HIP';prefs.get_devices()
    for device in prefs.devices:device.use=device.type=='HIP'
    scene.cycles.device='GPU';scene.cycles.samples=32 if args.preview else 192;scene.cycles.use_denoising=True
    scene.cycles.max_bounces=12;scene.cycles.diffuse_bounces=6;scene.cycles.transparent_max_bounces=8
    scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=50 if args.preview else 100
    scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.2
    overview=camera('Drawing room interior',(11.1,-14.0,1.48),(11.78,-10.3,1.28),23)
    detail=camera('Drawing room seating detail',(10.30,-10.1,1.32),(12.5,-12.05,.83),32)
    scene.camera=overview
    for name,(matrix,vertices) in baseline.items():
        o=bpy.data.objects[name]
        assert o.matrix_world==matrix and tuple(tuple(v.co) for v in o.data.vertices)==vertices,name
    bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'A501-drawing-elegant.blend'))
    for cam,filename in ((overview,'overview.png'),(detail,'seating.png')):
        scene.camera=cam;scene.render.filepath=str(OUT/filename);bpy.ops.render.render(write_still=True)
    (OUT/'provenance.json').write_text(json.dumps({'source':str(SOURCE.relative_to(ROOT)),
        'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'generator_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'preserved_authored_meshes':len(baseline),'focused_meshes':len(focused),'preview':args.preview,
        'blender':bpy.app.version_string,'coordinates':'metres, Z up; all source vertices and transforms unchanged'},indent=2),encoding='utf-8')
    print('DRAWING_ELEGANT_COMPLETE',flush=True)


if __name__=='__main__':main()
