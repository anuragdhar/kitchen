import * as THREE from 'three'

export function createSeatedPoojaPerson(pooja,floorTopMm=0){
  const person=new THREE.Group()
  const foldedLegBottom=.17-.105
  person.position.set((pooja.fromMm+pooja.seatedPersonFromWestMm)/1000,(floorTopMm+pooja.platformHeightMm)/1000-foldedLegBottom,-pooja.depthMm/2000)
  person.name='Seated person facing east in Pooja Ghar'
  const clothing=new THREE.MeshStandardMaterial({color:'#d8c2a7',roughness:.92})
  const skin=new THREE.MeshStandardMaterial({color:'#a97859',roughness:.9})
  const addPart=(geometry,material,x,y,z)=>{
    const part=new THREE.Mesh(geometry,material)
    part.position.set(x,y,z);part.castShadow=true;person.add(part);return part
  }
  addPart(new THREE.CylinderGeometry(.15,.21,.43,16),clothing,0,.48,0)
  addPart(new THREE.SphereGeometry(.12,16,12),skin,0,.82,0)
  addPart(new THREE.SphereGeometry(.035,10,8),skin,.12,.81,0)
  for(const side of [-1,1]){
    const leg=addPart(new THREE.SphereGeometry(1,12,10),clothing,.13,.17,side*.17)
    leg.scale.set(.27,.105,.13)
    const arm=addPart(new THREE.CylinderGeometry(.045,.05,.38,10),skin,.15,.44,side*.16)
    arm.rotation.z=Math.PI/3
    addPart(new THREE.SphereGeometry(.045,10,8),skin,.29,.30,side*.16)
  }
  return person
}
