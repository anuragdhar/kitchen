import * as THREE from 'three'

// Local study coordinates: +Z runs south, out through the terrace door.
export function createStudyTerrace(study){
  const group=new THREE.Group()
  group.name='Study south terrace with three open railings'
  const width=study.dimensions.widthMm/1000
  const wallZ=study.dimensions.lengthMm/1000
  const depth=study.southTerrace.depthMm/1000
  const height=study.southTerrace.railingHeightMm/1000
  const floor=new THREE.MeshStandardMaterial({color:'#c9c5bc',roughness:.85})
  const metal=new THREE.MeshStandardMaterial({color:'#343b40',metalness:.6,roughness:.36})
  const addBox=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z)
    mesh.castShadow=true
    mesh.receiveShadow=true
    group.add(mesh)
    return mesh
  }
  addBox(width,.06,depth,width/2,.015,wallZ+depth/2,floor)
  const railing=(x1,z1,x2,z2)=>{
    const dx=x2-x1,dz=z2-z1,length=Math.hypot(dx,dz)
    const along=(t,y,w,h)=>{
      const mesh=addBox(w,h,.035,x1+dx*t,y,z1+dz*t,metal)
      mesh.rotation.y=-Math.atan2(dz,dx)
    }
    along(.5,height-.018,length,.036)
    along(.5,.13,length,.025)
    const posts=Math.ceil(length/.8)
    for(let i=0;i<=posts;i++)addBox(.045,height,.045,x1+dx*i/posts,height/2,z1+dz*i/posts,metal)
    const pickets=Math.ceil(length/.12)
    for(let i=1;i<pickets;i++){
      if(i%Math.max(1,Math.round(pickets/posts))===0)continue
      addBox(.014,height-.16,.014,x1+dx*i/pickets,(height+.13)/2,z1+dz*i/pickets,metal)
    }
  }
  railing(0,wallZ,0,wallZ+depth)
  railing(0,wallZ+depth,width,wallZ+depth)
  railing(width,wallZ+depth,width,wallZ)
  return group
}
