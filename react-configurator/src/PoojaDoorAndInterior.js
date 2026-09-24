import * as THREE from 'three'

export function createPoojaDoorAndInterior(pooja,ceilingHeightMm=2700,floorTopMm=0){
  const group=new THREE.Group()
  group.name='Pooja Ghar right-folding wooden doors and warm interior'
  const from=pooja.fromMm/1000,width=pooja.widthMm/1000,depth=pooja.depthMm/1000
  const center=from+width/2,east=from+width,doorHeight=2.24,leafWidth=(width-.15)/2
  const wood=new THREE.MeshStandardMaterial({color:'#4a2e22',roughness:.7})
  const edgeWood=new THREE.MeshStandardMaterial({color:'#65402c',roughness:.64})
  const warmWall=new THREE.MeshStandardMaterial({color:'#d9b98d',roughness:.88})
  const glass=new THREE.MeshPhysicalMaterial({color:'#a9703d',transparent:true,opacity:.58,roughness:.16,metalness:0,side:THREE.DoubleSide,depthWrite:false})
  const cane=new THREE.MeshStandardMaterial({color:'#d2b897',roughness:.96,side:THREE.DoubleSide})
  const weave=new THREE.MeshStandardMaterial({color:'#a98a68',roughness:.95})
  const brass=new THREE.MeshStandardMaterial({color:'#c6a15b',metalness:.72,roughness:.27})
  const addBox=(parent,w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
    return mesh
  }

  // Fixed walnut frame and a light plaster lintel above the two leaves.
  for(const x of [from+.04,east-.04])addBox(group,.08,doorHeight,.12,x,doorHeight/2,.035,wood)
  addBox(group,width,.10,.12,center,doorHeight-.05,.035,wood)
  addBox(group,width,ceilingHeightMm/1000-doorHeight,.11,center,(ceilingHeightMm/1000+doorHeight)/2,0,warmWall)

  const makeLeaf=(parent,hinge,direction,offsetZ=0)=>{
    const leaf=new THREE.Group();leaf.position.set(hinge,0,offsetZ);parent.add(leaf)
    const x=direction*leafWidth/2
    const innerWidth=leafWidth-.12,innerX=x
    const leafBottom=(floorTopMm+pooja.platformHeightMm)/1000+.02,leafTop=doorHeight-.10
    // Amber upper glass has the rounded shoulders from the reference door.
    const bottom=leafBottom+.95,top=leafTop-.10,half=innerWidth/2
    const outline=new THREE.Shape()
    outline.moveTo(-half,bottom);outline.lineTo(half,bottom);outline.lineTo(half,top-.14)
    outline.quadraticCurveTo(half,top,half-.14,top)
    outline.lineTo(-half+.14,top);outline.quadraticCurveTo(-half,top,-half,top-.14)
    outline.lineTo(-half,bottom)
    const window=new THREE.Mesh(new THREE.ShapeGeometry(outline),glass)
    window.position.set(innerX,0,.024);leaf.add(window)
    for(const side of [-1,1]){
      const corner=new THREE.Shape()
      const edge=side*half,inset=side*(half-.14)
      corner.moveTo(edge,top-.14);corner.lineTo(edge,top);corner.lineTo(inset,top)
      corner.quadraticCurveTo(edge,top,edge,top-.14)
      const infill=new THREE.Mesh(new THREE.ShapeGeometry(corner),wood)
      infill.position.set(innerX,0,.030);leaf.add(infill)
    }
    for(const railX of [x-direction*(leafWidth/2-.035),x+direction*(leafWidth/2-.035)])addBox(leaf,.065,leafTop-leafBottom,.055,railX,(leafTop+leafBottom)/2,.025,wood)
    for(const y of [leafBottom+.035,leafBottom+.61,bottom-.03,leafTop-.035])addBox(leaf,leafWidth-.06,.065,.055,x,y,.025,wood)
    // The lower inset is a close woven cane panel, with a small brass floral medallion above it.
    const caneCenter=leafBottom+.31,medallionY=leafBottom+.80
    addBox(leaf,innerWidth,.48,.012,innerX,caneCenter,.033,cane)
    for(let i=0;i<14;i++){
      const xx=innerX-innerWidth/2+(i+.5)*innerWidth/14
      addBox(leaf,.003,.46,.002,xx,caneCenter,.041,weave)
    }
    for(let i=0;i<18;i++)addBox(leaf,innerWidth,.002,.002,innerX,caneCenter-.23+i*.027,.044,weave)
    addBox(leaf,innerWidth,.27,.009,innerX,medallionY,.030,wood)
    const medallion=new THREE.Mesh(new THREE.TorusGeometry(.055,.008,8,24),brass)
    medallion.position.set(innerX,medallionY,.040);leaf.add(medallion)
    for(const side of [-1,1]){
      const petal=new THREE.Mesh(new THREE.SphereGeometry(.018,8,8),brass)
      petal.position.set(innerX+side*.034,medallionY,.044);petal.scale.set(1,.46,.3);leaf.add(petal)
    }
    addBox(leaf,.015,.12,.025,innerX+direction*.14,medallionY,.06,brass)
    return leaf
  }
  // The inner hinge rides with the right leaf. Opposite rotations keep the
  // free end on the opening line while both leaves park at the east jamb.
  const right=makeLeaf(group,east-.075,-1,.095)
  const left=makeLeaf(right,-leafWidth,-1)
  addBox(group,width-.15,.025,.035,center,doorHeight-.13,.13,brass)
  const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,doorHeight-(floorTopMm+pooja.platformHeightMm)/1000-.18,10),brass)
  hinge.position.set(-leafWidth,(doorHeight+(floorTopMm+pooja.platformHeightMm)/1000)/2,0)
  right.add(hinge)
  group.userData.setDoorsOpen=open=>{
    const angle=open?Math.PI*.48:0
    right.rotation.y=angle
    left.rotation.y=-2*angle
  }
  group.userData.setDoorsOpen(true)

  // A warm interior and shallow east-facing prayer shelf retain the existing sitting space.
  addBox(group,width-.13,1.82,.02,center,1.23,-depth+.055,warmWall)
  addBox(group,.020,1.4,depth-.20,from+.045,1.30,-depth/2,warmWall)
  const templeDepth=pooja.templeDepthMm/1000
  addBox(group,templeDepth,.045,.72,east-templeDepth/2,.77,-depth/2,edgeWood)
  addBox(group,.027,1.08,.72,east-.025,1.34,-depth/2,wood)
  for(const z of [-depth/2-.27,-depth/2+.27])addBox(group,.035,.90,.038,east-.06,1.37,z,brass)
  addBox(group,.040,.035,.58,east-.08,1.84,-depth/2,brass)
  // Keep the reference artwork flush with the alcove's back wall.
  const artX=from+width*.68,artZ=-depth+.066
  const ink=new THREE.LineBasicMaterial({color:'#734d35'})
  const stroke=points=>{
    const geometry=new THREE.BufferGeometry().setFromPoints(points.map(([x,y])=>new THREE.Vector3(artX+x,y,artZ)))
    group.add(new THREE.Line(geometry,ink))
  }
  stroke([[-.28,.85],[.28,.85],[.28,1.45],[-.28,1.45],[-.28,.85]])
  stroke([[-.31,1.45],[.31,1.45],[.31,1.52],[-.31,1.52],[-.31,1.45]])
  stroke([[-.27,1.52],[0,1.82],[.27,1.52]])
  stroke([[-.22,1.58],[0,1.76],[.22,1.58]])
  stroke([[-.17,.85],[-.17,1.30],[-.11,1.38],[.11,1.38],[.17,1.30],[.17,.85]])
  stroke([[-.24,1.02],[.24,1.02]])
  stroke([[0,1.82],[0,1.94],[-.045,1.96],[0,2.01],[.045,1.96],[0,1.94]])
  for(const x of [-.23,.23])stroke([[x,.87],[x,1.42]])
  const leaf=new THREE.MeshBasicMaterial({color:'#49643f',transparent:true,opacity:.72,side:THREE.DoubleSide})
  stroke([[-.47,.84],[-.47,1.58]])
  for(const [x,y,angle] of [[-.52,1.05,-.45],[-.36,1.18,.55],[-.52,1.37,-.55],[-.36,1.54,.55]]){
    const blade=new THREE.Mesh(new THREE.CircleGeometry(.11,12),leaf)
    blade.position.set(artX+x,y,artZ+.001)
    blade.scale.set(.55,1.35,1);blade.rotation.z=angle;group.add(blade)
  }
  const light=new THREE.PointLight('#ffc77d',1.25,1.7)
  light.position.set(center,2.16,-depth*.62);group.add(light)
  return group
}
