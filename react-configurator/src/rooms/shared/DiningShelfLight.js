import * as THREE from 'three'
import {pendantRodAnchors} from '../../domain/drawingLighting.mjs'
import {lampColour} from '../../render/renderQuality.mjs'
import {createPottedPlant} from './furniture/decor.js'
import {grainUV, rodThrough, woodMaterial} from './furniture/hardForms.js'

// Owner 2026-10-06: "Let's use this as a dining table light." Dimensions come from lobbyLightingConfig (PROPOSALS).
// Room mm -> Three metres, y up. Build the board with grain along local x, then turn it north-south for axis 'z'.
// PROPOSED visual styling 2026-10-06: material roughness/metalness and mesh segment counts here are preview choices.
export function createDiningShelfLight(p, table, heightMm, {realLights=false}={}){
  const group=new THREE.Group();group.name=p.label
  const mm=n=>n/1000,centre={x:table.centerXmm,z:table.centerZmm},top=p.bottomMm+p.thicknessMm
  const wood=woodMaterial(p.appearance.oak,{asset:'white_oak_veneer'})
  const metal=new THREE.MeshStandardMaterial({color:p.appearance.metal,roughness:.55,metalness:.4})
  const warm=new THREE.MeshStandardMaterial({color:'#fff1d4',emissive:lampColour(p.led.kelvin),emissiveIntensity:p.appearance.glowIntensity,roughness:.8})
  warm.userData.taskLightGlow=true
  const shelf=new THREE.Group();shelf.name='Oak shelf with recessed LED';shelf.position.set(mm(centre.x),mm(p.bottomMm),mm(centre.z))
  if(p.axis==='z')shelf.rotation.y=-Math.PI/2
  group.add(shelf)
  const box=(name,l,h,w,a,y,b,material)=>{
    const geometry=new THREE.BoxGeometry(mm(l),mm(h),mm(w))
    if(material===wood)grainUV(geometry,wood.userData.veneerSizeMetres)
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(mm(a),mm(y),mm(b));shelf.add(mesh);return mesh
  }
  // Five pieces form one board with a real underside channel; no emissive strip hidden inside an opaque solid box.
  const led=p.led,roof=p.thicknessMm-led.channelDepthMm,side=(p.bodyWidthMm-led.channelWidthMm)/2,end=(p.lengthMm-led.channelLengthMm)/2
  box('Shelf board top',p.lengthMm,roof,p.bodyWidthMm,0,led.channelDepthMm+roof/2,0,wood)
  for(const sign of [-1,1]){
    box('Shelf channel side',p.lengthMm,led.channelDepthMm,side,0,led.channelDepthMm/2,sign*(led.channelWidthMm+side)/2,wood)
    box('Shelf channel end',end,led.channelDepthMm,led.channelWidthMm,sign*(led.channelLengthMm+end)/2,led.channelDepthMm/2,0,wood)
  }
  box('Recessed warm LED',led.lengthMm,led.thicknessMm,led.widthMm,0,led.recessMm+led.thicknessMm/2,0,warm)
  box('Electrical cap (feed unresolved)',p.canopyLengthMm,p.canopyDepthMm,p.canopyWidthMm,0,heightMm-p.bottomMm-p.canopyDepthMm/2,0,metal)
  // The thin centre cable only represents the drop: the route feeding the cap is deliberately still undecided.
  const cableHeight=heightMm-p.canopyDepthMm-top
  box('LED cable drop',led.cableDiameterMm,cableHeight,led.cableDiameterMm,0,p.thicknessMm+cableHeight/2,0,metal)
  for(const [index,a] of pendantRodAnchors(p,centre).entries()){
    const mount=new THREE.Mesh(new THREE.CylinderGeometry(mm(p.rods.mountDiameterMm/2),mm(p.rods.mountDiameterMm/2),mm(p.rods.mountDepthMm),16),metal)
    mount.name=`Shelf RCC mount ${index+1}`;mount.position.set(mm(a.x),mm(heightMm-p.rods.mountDepthMm/2),mm(a.z));group.add(mount)
    const length=heightMm-p.rods.mountDepthMm-top
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(mm(p.rods.diameterMm/2),mm(p.rods.diameterMm/2),mm(length),8),metal)
    rod.name=`Shelf rod ${index+1}`;rod.position.set(mm(a.x),mm(top+length/2),mm(a.z));group.add(rod)
  }
  const plants=p.plants,decor=new THREE.Group();decor.name='Shelf plants and trailing vines';decor.userData.archvizExclude=true;shelf.add(decor)
  const green=new THREE.MeshStandardMaterial({color:'#52853b',roughness:.8}),stem=new THREE.MeshStandardMaterial({color:'#677443',roughness:.9})
  // PROPOSED visual styling 2026-10-06: two sparse vines per pot, eight low-poly leaves per vine; ratios below shape
  // the curves/leaves only. Their maximum drop/overhang and the pot envelopes are configured in millimetres.
  for(const [index,along] of plants.alongMm.entries()){
    const pot=createPottedPlant({heightM:mm(plants.heightMm),spreadM:mm(plants.spreadMm)})
    pot.name=`Shelf potted plant ${index+1}`;pot.position.set(mm(along),mm(p.thicknessMm),0);decor.add(pot)
    for(const sign of [-1,1]){
      const edge=sign*(p.bodyWidthMm/2+plants.trailOverhangMm),drop=plants.trailDropMm*(index===1?.8:1)
      const points=[[along,top+plants.heightMm/4,0],[along,top+plants.heightMm/8,sign*p.bodyWidthMm/2],
        [along,top-drop/2,edge],[along,top-drop,edge]].map(([a,y,b])=>[mm(a),mm(y-p.bottomMm),mm(b)])
      const vine=new THREE.Mesh(rodThrough(points,mm(plants.stemDiameterMm/2),{tubular:12,radial:4}),stem);decor.add(vine)
      const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)))
      for(let k=1;k<=8;k++){
        const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,5,3),green)
        leaf.scale.set(mm(plants.leafWidthMm/2),mm(plants.leafLengthMm/2),mm(plants.leafWidthMm/8))
        leaf.position.copy(curve.getPoint(k/8));leaf.rotation.set(sign*.3,sign*.5,k%2?.6:-.6);decor.add(leaf)
      }
    }
  }
  // Tag every decor descendant as well as the parent, for exporters that inspect meshes individually.
  decor.traverse(object=>{object.userData.archvizExclude=true})
  let light=null
  if(realLights){light=new THREE.PointLight(lampColour(led.kelvin),p.appearance.lightIntensity,p.appearance.lightRangeM,p.appearance.lightDecay)
    light.name='Dining shelf light illumination';light.position.set(mm(centre.x),mm(p.bottomMm-p.appearance.lightBelowMm),mm(centre.z));group.add(light)}
  group.userData.setLevel=level=>{
    warm.emissiveIntensity=p.appearance.glowIntensity*level
    if(light){light.userData.dimLevel=level;light.intensity=p.appearance.lightIntensity*level}
  }
  return group
}
