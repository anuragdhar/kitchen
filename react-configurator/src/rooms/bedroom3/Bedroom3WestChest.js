import * as THREE from 'three'
import {createBedroom3OakMaterial} from './Bedroom3OakMaterial.js'
import {markItem} from '../../render/dimensionPick.js'

// Config: mm, x east from west wall / z south from north wall / y up.
// Width runs along the west wall (z); convert to Three.js metres here.
export function createBedroom3WestChest(room){
  const group=new THREE.Group();group.name='Bedroom 3 west chest and artwork'
  const c=room.furniture?.westChest
  if(!c)return group
  const d=c.depthMm/1000,w=c.widthMm/1000,h=c.heightMm/1000,p=c.panelMm/1000
  const plinth=c.plinthMm/1000,z=(c.fromNorthMm+c.widthMm/2)/1000
  const oak=createBedroom3OakMaterial({base:'#96633d',roughness:.6})
  const front=createBedroom3OakMaterial({base:'#b27d4c',roughness:.42})
  const dark=new THREE.MeshStandardMaterial({color:'#44382c',roughness:.65})
  const chest=markItem(new THREE.Group(),'West honey-oak chest of drawers');group.add(chest)
  const box=(dx,dy,dz,x,y,z,material,parent=chest)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(dx,dy,dz),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
    return mesh
  }
  box(d-.06,plinth,w-.1,d/2,plinth/2,z,dark)
  box(p,h-plinth,w,p/2,(h+plinth)/2,z,oak)
  for(const end of [z-w/2+p/2,z+w/2-p/2])box(d,h-plinth,p,d/2,(h+plinth)/2,end,oak)
  for(const y of [plinth+p/2,h-p/2])box(d,p,w,d/2,y,z,front)
  const rowH=(h-plinth-2*p)/c.drawerRows,colW=(w-2*p)/c.drawerColumns
  for(let row=0;row<c.drawerRows;row++)for(let col=0;col<c.drawerColumns;col++){
    const y=plinth+p+rowH*(row+.5),cz=z-w/2+p+colW*(col+.5)
    box(p,rowH-.006,colW-.006,d-p/2,y,cz,front)
    // Recessed dark pull, flush with the closed overall 450 mm depth.
    box(.002,.012,.18,d-.001,y+rowH/2-.025,cz,dark)
  }
  const a=c.artwork,aw=a.widthMm/1000,ah=a.heightMm/1000,ad=a.depthMm/1000,f=a.frameMm/1000,ay=(a.bottomMm+a.heightMm/2)/1000
  const art=markItem(new THREE.Group(),'Framed abstract artwork');group.add(art)
  art.position.x=a.wallOffsetMm/1000
  const paper=new THREE.MeshStandardMaterial({color:'#eee4d3',roughness:1})
  box(ad-.006,ah-2*f,aw-2*f,(ad-.006)/2,ay,z,paper,art)
  for(const y of [ay-ah/2+f/2,ay+ah/2-f/2])box(ad,f,aw,ad/2,y,z,front,art)
  for(const end of [z-aw/2+f/2,z+aw/2-f/2])box(ad,ah,f,ad/2,ay,end,front,art)
  // Simple geometric print built in the scene: muted clay, sand and olive.
  const pigment=color=>new THREE.MeshStandardMaterial({color,roughness:1})
  box(.002,ah*.25,aw*.72,ad-.005,ay-ah*.2,z,pigment('#b8a484'),art)
  box(.002,ah*.42,aw*.22,ad-.003,ay-ah*.02,z+aw*.2,pigment('#7f8874'),art)
  const sun=new THREE.Mesh(new THREE.CircleGeometry(ah*.19,48),pigment('#b77555'))
  sun.rotation.y=Math.PI/2;sun.position.set(ad-.003,ay+ah*.14,z-aw*.16);art.add(sun)
  return group
}
