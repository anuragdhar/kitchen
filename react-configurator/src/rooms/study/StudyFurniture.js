import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {createStudyDesk} from '../shared/furniture/tables.js'
import {createSideChair} from '../shared/furniture/chairs.js'
import {upholsteryMaterial} from '../shared/furniture/hardForms.js'

export function createStudyFurniture(study){
 const W=study.dimensions.widthMm/1000
 const addBox=(w,h,d,x,y,z,material,parent)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
    const kidsGroup=new THREE.Group();kidsGroup.name="Bedroom 2 bed, desk and chair"
    const nightBeds=new THREE.Group();kidsGroup.add(nightBeds)
    const daySeats=new THREE.Group();kidsGroup.add(daySeats)
    const oak=new THREE.MeshStandardMaterial({color:'#b98a5d',roughness:.7})
    tagSurfaceMaterial(oak,'wood','study')
    const bedding=new THREE.MeshStandardMaterial({color:'#e7e9e7',roughness:.95})
    const rose=new THREE.MeshStandardMaterial({color:'#b68689',roughness:.9})
    const deskTop=new THREE.MeshStandardMaterial({color:'#f3e6cf',roughness:.66})
    tagSurfaceMaterial(deskTop,'wood','study')
    const deskAccent=new THREE.MeshStandardMaterial({color:'#273b52',roughness:.7})
    tagSurfaceMaterial(deskAccent,'wood','study')
    const chairFabric=new THREE.MeshStandardMaterial({color:'#6d7884',roughness:.88})
    const metal=new THREE.MeshStandardMaterial({color:'#565c61',roughness:.5,metalness:.35})
    const addBed=(parent,side,zStart,depth,color)=>{
      const centerX=side==='west'?depth/2+.055:W-depth/2-.055
      const centerZ=zStart+1
      addBox(depth,.34,2,centerX,.21,centerZ,oak,parent)
      addBox(depth-.05,.12,1.91,centerX,.43,centerZ,bedding,parent)
      addBox(depth-.08,.035,1.35,centerX,.51,centerZ+.23,color,parent)
      addBox(depth-.12,.08,.35,centerX,.53,zStart+.3,bedding,parent)
      addBox(.055,.64,2,side==='west'?.065:W-.065,.37,centerZ,oak,parent)
    }
    addBed(nightBeds,'east',1.05,.9,rose)
    addBed(daySeats,'east',1.05,.55,rose)
    const deskCenterX=W-.31,deskCenterZ=3.56
    // Desk and desk chair from rooms/shared/furniture (tables-and-chairs round, 2026-10-06), at the earlier boxes' sizes:
    // desk 580 x 800, top 762.5 high; chair seat 390 x 380, 480 high, back top 890, facing the desk (east).
    kidsGroup.add(createStudyDesk({centerX:deskCenterX,centerZ:deskCenterZ,materials:{top:deskTop,accent:deskAccent,metal}}))
    const deskChair=createSideChair({depth:.39,width:.38,seatH:.48,backTop:.89,name:'Desk chair',materials:{fabric:upholsteryMaterial(chairFabric.color),frame:metal}})
    deskChair.position.set(W-.91,0,deskCenterZ);kidsGroup.add(deskChair)

 daySeats.visible=false
 return {group:kidsGroup,nightBeds,daySeats}
}
