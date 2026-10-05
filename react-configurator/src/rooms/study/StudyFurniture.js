import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {createBedMaterials,createMadeBed} from '../shared/furniture/Bed.js'

export function createStudyFurniture(study){
 const W=study.dimensions.widthMm/1000
 const addBox=(w,h,d,x,y,z,material,parent)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
    const kidsGroup=new THREE.Group();kidsGroup.name="Bedroom 2 bed, desk and chair"
    const nightBeds=new THREE.Group();kidsGroup.add(nightBeds)
    const daySeats=new THREE.Group();kidsGroup.add(daySeats)
    // Bed colours (the owner's: honey oak, white bedding, rose cover); the navy knit throw is new (2026-10-06 furniture pass).
    const bedMaterials=createBedMaterials({frame:'#b98a5d',headboard:'#b98a5d',mattress:'#e7e9e7',duvet:'#b68689',pillow:'#e7e9e7',throw:'#273b52',cushions:['#b68689','#e7e9e7']},{roomId:'study'})
    const deskTop=new THREE.MeshStandardMaterial({color:'#f3e6cf',roughness:.66})
    tagSurfaceMaterial(deskTop,'wood','study')
    const deskAccent=new THREE.MeshStandardMaterial({color:'#273b52',roughness:.7})
    tagSurfaceMaterial(deskAccent,'wood','study')
    const chairFabric=new THREE.MeshStandardMaterial({color:'#6d7884',roughness:.88})
    const metal=new THREE.MeshStandardMaterial({color:'#565c61',roughness:.5,metalness:.35})
    // The single bed against the east wall, head to the north: 2000 long from z 1050, 900 deep (550 as the day seat), its
    // oak box on short legs 40 mm off the floor (box top 380, mattress top 490) and a 55 mm oak back board 65 mm off the wall
    // up to 690, as drawn before the 2026-10-06 furniture pass (studyLightingConfig.js downTargets mirror this footprint).
    // Built in the bed's frame (rooms/shared/furniture/Bed.js: head at +x, back board on the +z side), then turned head-north.
    const addBed=(parent,zStart,depth,day)=>{
      const centerX=W-depth/2-.055,centerZ=zStart+1
      const bed=createMadeBed({
        name:day?'Bedroom 2 kids bed as a day seat':'Bedroom 2 kids bed',lengthMm:2000,widthMm:depth*1000,
        base:{topMm:380,bottomMm:40,legs:true},mattressMm:110,
        backboard:{zMm:(W-.065-centerX)*1000,thicknessMm:55,bottomMm:50,topMm:690},
        pillows:day?0:1,seed:day?7:5,
        duvet:day?{sideDropMm:{left:60,right:10},footDropMm:60,turnBack:false,folds:.4}:{sideDropMm:{left:120,right:12},footDropMm:120},
        throw:day?null:{fromFootMm:90,lengthMm:340,dropMm:{left:80,right:0}},backCushions:day?2:0,
      },bedMaterials)
      bed.position.set(centerX,0,centerZ);bed.rotation.y=Math.PI/2
      parent.add(bed)
    }
    addBed(nightBeds,1.05,.9,false)
    addBed(daySeats,1.05,.55,true)
    const deskCenterX=W-.31,deskCenterZ=3.56
    addBox(.58,.045,.8,deskCenterX,.74,deskCenterZ,deskTop,kidsGroup)
    addBox(.22,.012,.28,deskCenterX,.773,deskCenterZ,deskAccent,kidsGroup)
    for(const x of [W-.56,W-.06])for(const z of [deskCenterZ-.34,deskCenterZ+.34])addBox(.035,.71,.035,x,.355,z,metal,kidsGroup)
    addBox(.39,.06,.38,W-.91,.45,deskCenterZ,chairFabric,kidsGroup)
    addBox(.39,.42,.055,W-1.09,.68,deskCenterZ,chairFabric,kidsGroup)
    for(const x of [W-1.06,W-.77])for(const z of [deskCenterZ-.14,deskCenterZ+.14])addBox(.026,.43,.026,x,.215,z,metal,kidsGroup)

 daySeats.visible=false
 return {group:kidsGroup,nightBeds,daySeats}
}
