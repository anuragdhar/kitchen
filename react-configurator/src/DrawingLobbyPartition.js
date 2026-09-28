import * as THREE from 'three'

export function createDrawingLobbyPartition(room,key){
  const group=new THREE.Group();group.name='South-to-north folding drawing-room partition'
  if(key!=='drawing'&&key!=='lobby')return group
  const x=key==='drawing'?room.widthMm/1000:0
  const start=key==='drawing'?room.wallOpenings.east.fromMm/1000:0
  const end=room.lengthMm/1000,span=end-start
  const height=(room.heightMm-305)/1000,panels=[]
  const finish=new THREE.MeshStandardMaterial({color:'#c8b49a',roughness:.72})
  const metal=new THREE.MeshStandardMaterial({color:'#635d54',metalness:.45,roughness:.4})
  const box=(w,h,d,cx,cy,cz,mat,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(cx,cy,cz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh
  }
  box(.075,.055,span,x,height-.028,(start+end)/2,metal)
  for(const z of [start,end])box(.055,height,.035,x,height/2,z,metal)
  const count=10,leaf=span/count
  for(let i=0;i<count;i++){
    const pivot=new THREE.Group();group.add(pivot);panels.push(pivot)
    box(.03,height-.075,leaf-.005,0,(height-.075)/2+.012,0,finish,pivot)
    if(i===count-1)for(const side of [-1,1])box(.028,.18,.02,side*.03,1.05,-leaf/2+.065,metal,pivot)
  }
  group.userData.setOpen=open=>{
    const angle=open?Math.acos(.4/span):0
    panels.forEach((panel,i)=>{
      panel.position.set(x+leaf*Math.sin(angle)/2,0,end-(i+.5)*leaf*Math.cos(angle))
      panel.rotation.y=i%2?angle:-angle
    })
  }
  group.userData.setOpen(false)
  return group
}
