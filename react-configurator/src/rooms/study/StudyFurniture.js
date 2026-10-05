import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {createBedMaterials,createMadeBed} from '../shared/furniture/Bed.js'
import {createStudyDesk} from '../shared/furniture/tables.js'
import {createSideChair} from '../shared/furniture/chairs.js'
import {upholsteryMaterial} from '../shared/furniture/hardForms.js'

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
    // Desk and desk chair from rooms/shared/furniture (tables-and-chairs round, 2026-10-06), at the earlier boxes' sizes:
    // desk 580 x 800, top 762.5 high; chair seat 390 x 380, 480 high, back top 890, facing the desk (east).
    kidsGroup.add(createStudyDesk({centerX:deskCenterX,centerZ:deskCenterZ,materials:{top:deskTop,accent:deskAccent,metal}}))
    const deskChair=createSideChair({depth:.39,width:.38,seatH:.48,backTop:.89,name:'Desk chair',materials:{fabric:upholsteryMaterial(chairFabric.color),frame:metal}})
    deskChair.position.set(W-.91,0,deskCenterZ);kidsGroup.add(deskChair)

 daySeats.visible=false
 return {group:kidsGroup,nightBeds,daySeats}
}
