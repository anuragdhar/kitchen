import * as THREE from 'three'

// The same room-local group is used by the lobby view and the whole-home view.
export function createLobbyEastIroningStorage(room){
  const group=new THREE.Group()
  group.name='Lobby east storage with concealed pull-out ironing board'
  const item=room.furniture?.eastIroningStorage
  if(!item)return group
  const east=room.widthMm/1000,from=item.fromNorthMm/1000,length=item.lengthMm/1000
  const depth=item.depthMm/1000,height=item.heightMm/1000
  const centerZ=from+length/2,centerX=east-depth/2
  const body=new THREE.MeshStandardMaterial({color:'#ad8968',roughness:.7})
  const door=new THREE.MeshStandardMaterial({color:'#e4dacb',roughness:.62})
  const metal=new THREE.MeshStandardMaterial({color:'#5e625f',metalness:.6,roughness:.34})
  const board=new THREE.MeshStandardMaterial({color:'#d4c9ba',roughness:.9})
  const box=(w,h,d,x,y,z,material,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
    return mesh
  }
  box(depth,.065,length,centerX,.06,centerZ,body)
  box(depth,.065,length,centerX,height-.03,centerZ,body)
  for(const z of [from+.025,from+length-.025])box(depth,height-.1,.05,centerX,height/2,z,body)
  box(.025,height-.1,length,east-.02,height/2,centerZ,body)
  const centerBay=(item.centerBayWidthMm||600)/1000
  const bayWidths=[(length-centerBay)/2,centerBay,(length-centerBay)/2]
  const centerPanel=[]
  let cursor=from
  for(let i=0;i<bayWidths.length;i++){
    const span=bayWidths[i],z=cursor+span/2
    if(i===1){
      box(.028,.65,span-.012,east-depth-.015,.405,z,door)
      box(.024,.14,.025,east-depth-.04,.48,z,metal)
      centerPanel.push(box(.028,.14,span-.012,east-depth-.015,.845,z,door))
      centerPanel.push(box(.024,.018,.14,east-depth-.04,.845,z,metal))
    }else{
      box(.028,height-.17,span-.012,east-depth-.015,height/2,z,door)
      box(.024,.14,.025,east-depth-.04,height*.56,z,metal)
    }
    cursor+=span
    if(i<2)box(depth-.04,height-.12,.018,centerX,height/2,cursor,body)
  }
  const deployed=new THREE.Group()
  deployed.name='Pull-out ironing board deployed'
  const boardLength=item.boardLengthMm/1000,boardWidth=item.boardWidthMm/1000
  const front=east-depth
  box(boardLength,.04,boardWidth,front-boardLength/2,.89,centerZ,board,deployed)
  box(boardLength-.05,.018,boardWidth-.04,front-boardLength/2,.919,centerZ,new THREE.MeshStandardMaterial({color:'#e7ded2',roughness:1}),deployed)
  box(.006,.003,boardWidth-.03,front-boardLength/2,.930,centerZ,metal,deployed)
  for(const z of [centerZ-.12,centerZ+.12])box(.40,.018,.015,front-.12,.855,z,metal,deployed)
  box(.03,.87,.03,front-boardLength+.14,.435,centerZ,metal,deployed)
  deployed.visible=false
  group.add(deployed)
  group.userData.setBoardOpen=value=>{deployed.visible=value;centerPanel.forEach(mesh=>{mesh.visible=!value})}
  return group
}
