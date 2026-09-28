import * as THREE from 'three'

export function createDrawingRoomTelevision(room){
  const group=new THREE.Group();group.name='Drawing Room 55-inch television on swivel bracket'
  const tv=room.television
  if(!tv)return group
  const wall=room.widthMm/1000,z=tv.centerFromNorthMm/1000,y=tv.centerHeightMm/1000
  const projection=tv.projectionMm/1000
  const metal=new THREE.MeshStandardMaterial({color:'#292d31',metalness:.45,roughness:.42})
  const screen=new THREE.MeshStandardMaterial({color:'#18313c',roughness:.24,metalness:.15,emissive:'#142c34',emissiveIntensity:.22})
  const box=(w,h,d,x,cy,cz,material,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,cy,cz);mesh.castShadow=true;parent.add(mesh)
  }
  box(.025,.24,.32,wall-.03,y,z,metal)
  box(projection-.05,.045,.045,wall-projection/2,y,z,metal)
  const panel=new THREE.Group();panel.position.set(wall-projection,y,z)
  panel.rotation.y=tv.rotationYDegrees*Math.PI/180;group.add(panel)
  box(tv.widthMm/1000,tv.heightMm/1000,tv.depthMm/1000,0,0,0,metal,panel)
  box((tv.widthMm-24)/1000,(tv.heightMm-24)/1000,.003,0,0,tv.depthMm/2000+.002,screen,panel)
  box(.006,.003,.004,tv.widthMm/2000-.04,-tv.heightMm/2000+.006,tv.depthMm/2000+.005,new THREE.MeshBasicMaterial({color:'#8ac5bc'}),panel)
  return group
}
