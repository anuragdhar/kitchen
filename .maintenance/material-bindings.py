from pathlib import Path
import re,json,subprocess
r=Path('.');sroot=r/'react-configurator/src'
def read(n): return (sroot/n).read_text()
def put(n,s): (sroot/n).write_text(s)
def imp(s,what): return what+'\n'+s
roles={
 'Bedroom3Bed.js':{'wood':['frame','headboard']},
 'Bedroom3DressingTable.js':{'wood':['dark']},
 'Bedroom3EntryDoor.js':{'wood':['frame','timber']},
 'Bedroom3SouthExtension.js':{'wood':['wood','front']},
 'Bedroom3Wardrobe.js':{'wood':['edge']},
 'DrawingLobbyPartition.js':{'wood':['finish']},
 'EntryArrivalDoor.js':{'wood':['wood','frame']},
 'EntryRecessStorage.js':{'wood':['wood','front']},
 'LobbyConcealedDoor.js':{'wood':['finish']},
 'LobbyEastIroningStorage.js':{'wood':['body','door']},
 'LobbyNorthStorage.js':{'wood':['wood','door','top']},
 'PoojaDoorAndInterior.js':{'wood':['wood','edgeWood'],'plaster':['warmWall']},
 'PoojaPlatform.js':{'wood':['oak','drawer']},
 'StudyFurniture.js':{'wood':['oak','deskTop','deskAccent']},
 'EmptyRoomGallery.jsx':{'wood':['doorMaterial','body','door','doors','oak','wood','bedFrame','headboardMaterial','front','tabletop'],'plaster':['wallMaterial']},
 'StudyRoom3D.jsx':{'wood':['shelfTimberMaterial','shelfPanelMaterial','shelfInteriorMaterial','cabinetMaterial','cabinetInteriorMaterial','cabinetDoorMaterial'],'plaster':['wallMaterial']},
 'EntryGallery3D.jsx':{'wood':['timber','doorMaterial'],'plaster':['wallMaterial']},
 'WholeHome3D.jsx':{'wood':['wood','paleWood','cabinet','rackBody','rackDoors','cabinetBody','cabinetFront','body','front','bedFrame','headboardMaterial','tableMat','kitchenCabinet'],'plaster':['wallMaterial','drawingWallMaterial']},
}
roommap={'Bedroom3':'bedroom3','Drawing':'drawing','Entry':'entry','Lobby':'lobby','Pooja':'pooja','StudyFurniture':'study'}
for name,kinds in roles.items():
 s=read(name);assert 'tagSurfaceMaterial' not in s
 s=imp(s,"import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'")
 room=next((v for k,v in roommap.items() if name.startswith(k)),None) if name.endswith('.js') else None
 for kind,names in kinds.items():
  for var in names:
   pat=r'(?m)^(\s*)const '+re.escape(var)+r'=new THREE.Mesh(?:Standard|Physical)Material\([^\n]*\)\s*$'
   def add(m):
    indent=m.group(1).split('\n')[-1]
    return m.group(0)+f"\n{indent}tagSurfaceMaterial({var},'{kind}'"+(f",'{room}'" if room else '')+")"
   s,count=re.subn(pat,add,s);assert count>0,(name,var)
 put(name,s)
s=read('Bedroom3OakMaterial.js');s=imp(s,"import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'");s=s.replace("return new THREE.MeshStandardMaterial({map,roughness})","return tagSurfaceMaterial(new THREE.MeshStandardMaterial({map,roughness}),'wood','bedroom3')");put('Bedroom3OakMaterial.js',s)
s=read('StoreStorage.js');s=imp(s,"import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'");s=s.replace("    mesh.name=p.name;", "    if(p.name==='storage sliding cover front')tagSurfaceMaterial(mesh.material,'wood','storage')\n    mesh.name=p.name;");put('StoreStorage.js',s)
s=read('App.jsx');s=imp(s,"import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'");anchor='      const material=(c,opacity=1)=>{';assert s.count(anchor)==1;s=s.replace(anchor,"      for(const key of ['cabinet','tallCabinet','topCabinet','middleCabinet','shutter'])tagSurfaceMaterial(surface[key],'wood','kitchen')\n      tagSurfaceMaterial(surface.wall,'plaster','kitchen')\n"+anchor);put('App.jsx',s)
s=read('BalconyOffice3D.jsx');s=imp(s,"import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'")
anchor="const makeMaterial=(color,roughness=.72,map=null,metalness=0)=>new THREE.MeshStandardMaterial({color,map,roughness,metalness,side:THREE.DoubleSide,envMapIntensity:.8})";assert s.count(anchor)==1
s=s.replace(anchor,"const makeMaterial=(color,roughness=.72,map=null,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,map,roughness,metalness,side:THREE.DoubleSide,envMapIntensity:.8});return map===woodTexture?tagSurfaceMaterial(m,'wood','balcony'):m}")
s=s.replace("      const mesh=new THREE.Mesh(geometry,material)","      if(map===woodTexture)tagSurfaceMaterial(material,'wood','balcony')\n      const mesh=new THREE.Mesh(geometry,material)")
s=s.replace("      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,map,roughness,metalness,side:THREE.DoubleSide,envMapIntensity:.8}))", "      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),makeMaterial(color,roughness,map,metalness))")
s=s.replace("addBox({w:W,h:H,d:.08,x:W/2,y:H/2,z:-.04,color:'#f4f1eb'})","tagSurfaceMaterial(addBox({w:W,h:H,d:.08,x:W/2,y:H/2,z:-.04,color:'#f4f1eb'}).material,'plaster','balcony')")
s=s.replace("    printerShelf.position", "    tagSurfaceMaterial(printerShelf.material,'wood','balcony')\n    printerShelf.position",1);put('BalconyOffice3D.jsx',s)
bindings={
 'StorageGallery3D.jsx':("  let raf;", "  const interiorScene=registerInteriorScene({id:'storage',scene,camera,renderer,zones:[{id:'storage',min:[0,0,0],max:[3,2.7,2.5]}]})\n",'return()=>{cancelAnimationFrame(raf);'),
 'EntryGallery3D.jsx':("    let raf=0;", "    const interiorScene=registerInteriorScene({id:'entry',scene,camera,renderer,zones:[{id:'entry',min:[0,0,0],max:[width,height,length]}]})\n",'return()=>{cancelAnimationFrame(raf);'),
 'StudyRoom3D.jsx':("    let raf=0;", "    const interiorScene=registerInteriorScene({id:'study',scene,camera,renderer,zones:[{id:'study',min:[0,0,0],max:[W,H,L]}]})\n",'return()=>{cancelAnimationFrame(raf);'),
 'EmptyRoomGallery.jsx':("    let raf=0;", "    const interiorScene=registerInteriorScene({id:roomKey,scene,camera,renderer,zones:[{id:roomKey,min:[0,0,0],max:[W,H,L]}]})\n",'return()=>{cancelAnimationFrame(raf);'),
 'WholeHome3D.jsx':("    let raf=0;", "    const interiorRoomIds=['bedroom3','study','balcony','terrace','kitchen','lobby','drawing','bedroom1','bedroom1-balcony','entry']\n    const interiorScene=registerInteriorScene({id:'whole-home',scene,camera,renderer,zones:ROOMS.map((r,index)=>({id:interiorRoomIds[index],min:[X(r.bounds[0]),0,Z(r.bounds[1])],max:[X(r.bounds[2]),HEIGHT,Z(r.bounds[3])]}))})\n",'return()=>{cancelAnimationFrame(raf);'),
 'BalconyOffice3D.jsx':("    sceneRef.current={setCamera", "    const interiorScene=registerInteriorScene({id:'balcony',scene,camera,renderer,zones:[{id:'balcony',min:[0,0,0],max:[W,H,L]}]})\n",'return ()=>{\n      cancelAnimationFrame'),
 'App.jsx':("      threeViewRef.current={renderer", "      const interiorScene=registerInteriorScene({id:'kitchen',scene,camera,renderer,metresPerUnit:.01,zones:[{id:'kitchen',min:[-KITCHEN.width/20,0,-KITCHEN.length/20],max:[KITCHEN.width/20,KITCHEN.height/10,KITCHEN.length/20]}]})\n",'return ()=>{cancelAnimationFrame(frameId);'),
}
for name,(anchor,code,cleanup) in bindings.items():
 s=read(name);s=imp(s,"import {registerInteriorScene} from './render/interiorScene.js'");assert s.count(anchor)==1,(name,anchor);s=s.replace(anchor,code+anchor);assert s.count(cleanup)==1,(name,cleanup);s=s.replace(cleanup,cleanup.replace('{','{interiorScene.dispose();',1),1);put(name,s)
s=read('App.jsx');anchor='        if(part.sliding){storageSliding';assert s.count(anchor)==1;s=s.replace(anchor,"        if(part.name==='storage sliding cover front')tagSurfaceMaterial(mesh.material,'wood','storage')\n"+anchor);put('App.jsx',s)
s=read('StudyRoom3D.jsx');s=s.replace('mainDoor.rotation.y=-Math.PI*.38',"mainDoor.rotation.y=-Math.PI*.38\n    tagSurfaceMaterial(mainLeaf.material,'wood','study')");put('StudyRoom3D.jsx',s)
s=read('WholeHome3D.jsx');a="      const itemMaterial=new THREE.MeshStandardMaterial({color:item.color||'#c4b5a5',roughness:.72})";assert s.count(a)==1;s=s.replace(a,a+"\n      if(['applianceGarage','eastBacksplashSlider','westSixInchSlider','sinkUpperDishRack'].includes(item.id))tagSurfaceMaterial(itemMaterial,'wood','kitchen')");put('WholeHome3D.jsx',s)
p=r/'react-configurator/package.json';d=json.loads(p.read_text());d['scripts']['test']+=' tests/interior-materials.test.mjs';d['scripts']['test:materials']='node scripts/material-scene-browser.cjs';p.write_text(json.dumps(d,indent=2)+'\n')
expected={"react-configurator/package.json":"a18fdc74d895571a53b2b611beb1ab85d285dd28","react-configurator/src/App.jsx":"8d1444507cf95ab63320c87dd4a966eb9f1615dc","react-configurator/src/BalconyOffice3D.jsx":"893d6edd83ab9624c4606fe82613d643b4ba1675","react-configurator/src/Bedroom3Bed.js":"f7841115e49bfe125074cace2b0163a863f43c7a","react-configurator/src/Bedroom3DressingTable.js":"c652bea302608ff30ab7d8a57a58dbb7b87bea4b","react-configurator/src/Bedroom3EntryDoor.js":"7bba8b0769fe7baa4d7774138d357e1efe94113b","react-configurator/src/Bedroom3OakMaterial.js":"acde6c302285c9ce3465620bd40db752a57dc9db","react-configurator/src/Bedroom3SouthExtension.js":"3d7de2cb035b7ef0e25e31b5dc0f394f981a1fdc","react-configurator/src/Bedroom3Wardrobe.js":"fe87a15e112c462a6157082c28c46f31228da1c9","react-configurator/src/DrawingLobbyPartition.js":"7cfe4f910eebc457ebd393650c53bf8e67ae422c","react-configurator/src/EmptyRoomGallery.jsx":"b3f035a706b710347d7ccb895397cf15eaba86cd","react-configurator/src/EntryArrivalDoor.js":"e4677d6df73a4749fe6f9f6a66c8629fac7c0997","react-configurator/src/EntryGallery3D.jsx":"107d5193be810d2251c917c7669fd9918dee90e6","react-configurator/src/EntryRecessStorage.js":"de0605521f9d4343f9a29bd7bf8808807e4fb175","react-configurator/src/LobbyConcealedDoor.js":"e130deb9d5dd28d69964bc88f84e03ec44374ff6","react-configurator/src/LobbyEastIroningStorage.js":"d1d439e56aea50bd992a41fdc2c6d660b1119f5e","react-configurator/src/LobbyNorthStorage.js":"7a14d343268d5bbf6d86470f66361a9241103d3d","react-configurator/src/PoojaDoorAndInterior.js":"e2aaf8a5535f57fe56ba26f27440ebca2a73bc6e","react-configurator/src/PoojaPlatform.js":"102a7fb32bf4dd4b67977a3eaa51505aa7f19ffd","react-configurator/src/StorageGallery3D.jsx":"71bff53a03f929abac680f16f1059cece276b614","react-configurator/src/StoreStorage.js":"b8977f6a04ed01ddfeb5e104b4c91c21fc1fc842","react-configurator/src/StudyFurniture.js":"4def51de1ea1b1061742e0db45924de0a2b7dd48","react-configurator/src/StudyRoom3D.jsx":"89ea3911ba71b4e52148eab38a02ef188a97a2f9","react-configurator/src/WholeHome3D.jsx":"c3fd89b54470fb15bb43b7684a1dd8101ab78b5f"}
for name,sha in expected.items(): assert subprocess.check_output(['git','hash-object',name],text=True).strip()==sha,'Unexpected output: '+name
print('All 24 integration outputs match reviewed local Git blob hashes.')
