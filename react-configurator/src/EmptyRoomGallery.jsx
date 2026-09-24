import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {EMPTY_ROOM_SHELLS} from './config/roomShellConfig.js'

const mm=value=>value/1000

export default function EmptyRoomGallery({initialRoomKey='bedroom1',showSelector=true}){
  const [roomKey,setRoomKey]=useState(initialRoomKey)
  const [view,setView]=useState('overview')
  const [showSouthWall,setShowSouthWall]=useState(initialRoomKey==='lobby'||initialRoomKey==='drawing')
  const [showFurniture,setShowFurniture]=useState(initialRoomKey==='drawing'||initialRoomKey==='lobby')
  const mountRef=useRef(null)
  const sceneRef=useRef(null)
  const room=EMPTY_ROOM_SHELLS[roomKey]

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount) return
    const W=mm(room.widthMm),L=mm(room.lengthMm),H=mm(room.heightMm),extensionDepth=mm(room.balconyExtension?.depthMm||0),span=Math.max(W+extensionDepth,L)
    const openWest=room.openSide==='west'
    const scene=new THREE.Scene();scene.background=new THREE.Color('#eef3f6')
    const camera=new THREE.PerspectiveCamera(46,1,.01,100)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2.2));renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
    const shell=new THREE.Group();scene.add(shell)
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#d6d1c9',roughness:.86})
    const floorMaterial=new THREE.MeshStandardMaterial({color:room.color,roughness:.82})
    const trimMaterial=new THREE.MeshStandardMaterial({color:'#f8fafc',roughness:.65})
    const doorMaterial=new THREE.MeshStandardMaterial({color:'#a47149',roughness:.68})
    const frameMaterial=new THREE.MeshStandardMaterial({color:'#f1ede6',roughness:.6})
    const darkFrameMaterial=new THREE.MeshStandardMaterial({color:'#171a1e',metalness:.55,roughness:.28})
    const handleMaterial=new THREE.MeshStandardMaterial({color:'#b89a5c',metalness:.75,roughness:.25})
    const glassMaterial=new THREE.MeshStandardMaterial({color:'#b8e3ef',transparent:true,opacity:.42,roughness:.08,metalness:.15,side:THREE.DoubleSide,depthWrite:false})
    const addBox=(w,h,d,x,y,z,material=wallMaterial,parent=shell)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
    addBox(W,.055,L,W/2,-.028,L/2,floorMaterial)
    const T=.1
    const southWall=new THREE.Group();shell.add(southWall)
    const wallParent=side=>side==='south'?southWall:shell
    const addWallSpan=(side,from,to,bottom=0,top=H)=>{
      if(to<=from||top<=bottom) return
      const parent=wallParent(side),height=top-bottom,center=(from+to)/2
      if(side==='north'||side==='south'){
        const z=side==='north'?0:L
        addBox(to-from,height,T,center,(bottom+top)/2,z,wallMaterial,parent)
        if(bottom===0) addBox(to-from,.085,.035,center,.05,side==='north'?.055:L-.055,trimMaterial,parent)
      }else{
        const x=side==='west'?0:W
        addBox(T,height,to-from,x,(bottom+top)/2,center,wallMaterial,parent)
        if(bottom===0) addBox(.035,.085,to-from,side==='west'?.055:W-.055,.05,center,trimMaterial,parent)
      }
    }
    const openingsFor=side=>{
      const result=[]
      const passage=room.wallOpenings?.[side]
      if(passage) result.push({kind:'passage',from:mm(passage.fromMm),to:mm(passage.toMm),bottom:0,top:H})
      for(const door of room.doors||[]) if(door.wall===side) result.push({kind:'door',from:mm(door.fromMm),to:mm(door.fromMm+door.widthMm),bottom:0,top:mm(door.heightMm)})
      for(const window of room.windows||[]) if(window.wall===side) result.push({kind:'window',from:mm(window.fromMm),to:mm(window.fromMm+window.widthMm),bottom:mm(window.bottomMm),top:mm(window.topMm),frameStyle:window.frameStyle,mullionFractions:window.mullionFractions})
      return result.sort((a,b)=>a.from-b.from)
    }
    const addOpeningDetail=(side,opening)=>{
      if(side!=='north'&&side!=='south') return
      const parent=wallParent(side),z=side==='north'?0:L,width=opening.to-opening.from,center=(opening.from+opening.to)/2
      if(opening.kind==='door'){
        const h=opening.top
        for(const x of [opening.from+.025,opening.to-.025]) addBox(.05,h,.075,x,h/2,z,frameMaterial,parent)
        addBox(width,.05,.075,center,h-.025,z,frameMaterial,parent)
        addBox(width-.1,h-.08,.035,center,(h-.08)/2,z,doorMaterial,parent)
        addBox(.07,.025,.06,opening.to-.17,1.02,z+(side==='north'?.04:-.04),handleMaterial,parent)
      }
      if(opening.kind==='window'){
        const h=opening.top-opening.bottom,midY=(opening.top+opening.bottom)/2
        const windowFrame=opening.frameStyle==='dark'?darkFrameMaterial:frameMaterial
        addBox(width-.06,h-.06,.025,center,midY,z,glassMaterial,parent)
        for(const x of [opening.from+.025,...(opening.mullionFractions||[.5]).map(fraction=>opening.from+width*fraction),opening.to-.025]) addBox(.05,h,.065,x,midY,z,windowFrame,parent)
        for(const y of [opening.bottom+.025,opening.top-.025]) addBox(width,.05,.065,center,y,z,windowFrame,parent)
      }
    }
    for(const side of ['north','south','west','east']){
      if(room.openSide===side) continue
      const length=side==='north'||side==='south'?W:L
      let cursor=0
      for(const opening of openingsFor(side)){
        addWallSpan(side,cursor,opening.from)
        addWallSpan(side,opening.from,opening.to,0,opening.bottom)
        addWallSpan(side,opening.from,opening.to,opening.top,H)
        addOpeningDetail(side,opening)
        cursor=opening.to
      }
      addWallSpan(side,cursor,length)
    }
    for(const beam of room.hangingBeams||[]){
      const from=mm(beam.fromMm),to=mm(beam.toMm),drop=mm(beam.dropMm),width=mm(beam.widthMm)
      if(beam.wall==='east'||beam.wall==='west') addBox(width,drop,to-from,beam.wall==='east'?W:0,H-drop/2,(from+to)/2)
      else addBox(to-from,drop,width,(from+to)/2,H-drop/2,beam.wall==='south'?L:0)
    }
    if(room.balconyExtension){
      const balcony=room.balconyExtension,depth=mm(balcony.depthMm),length=mm(balcony.lengthMm),rail=mm(balcony.railingHeightMm)
      const balconyFloor=new THREE.MeshStandardMaterial({color:'#b79a78',roughness:.8})
      const aluminium=new THREE.MeshStandardMaterial({color:'#333b42',metalness:.72,roughness:.28})
      const balconyGlass=new THREE.MeshStandardMaterial({color:'#badbe4',transparent:true,opacity:.28,roughness:.08,side:THREE.DoubleSide,depthWrite:false})
      // The bedroom-side opening stops at the existing southeast return wall.
      addBox(depth,.055,length,W+depth/2,-.028,length/2,balconyFloor)
      addBox(.12,rail,length,W+depth,rail/2,length/2)
      addBox(.018,H-rail-.08,length-.08,W+depth,(H+rail)/2,length/2,balconyGlass)
      for(const z of [.035,length/2,length-.035]) addBox(.04,H-rail,.05,W+depth,(H+rail)/2,z,aluminium)
      for(const y of [rail+.015,H-.035]) addBox(.045,.04,length,W+depth,y,length/2,aluminium)
      addBox(depth,rail,.12,W+depth/2,rail/2,0)
      addBox(depth-.08,H-rail-.08,.018,W+depth/2,(H+rail)/2,0,balconyGlass)
      for(const x of [W+.035,W+depth/2,W+depth-.035]) addBox(.05,H-rail,.04,x,(H+rail)/2,0,aluminium)
      for(const y of [rail+.015,H-.035]) addBox(depth,.04,.045,W+depth/2,y,0,aluminium)
      addBox(depth,H,.10,W+depth/2,H/2,length)
    }
    if(room.poojaAlcove){
      const alcove=room.poojaAlcove,from=mm(alcove.fromMm),width=mm(alcove.widthMm),depth=mm(alcove.depthMm),center=from+width/2
      const oak=new THREE.MeshStandardMaterial({color:'#a98259',roughness:.68})
      const stone=new THREE.MeshStandardMaterial({color:'#f2e9d9',roughness:.8})
      const brass=new THREE.MeshStandardMaterial({color:'#b99955',metalness:.68,roughness:.28})
      const frostedGlass=new THREE.MeshStandardMaterial({color:'#e8ddd0',transparent:true,opacity:.32,roughness:.35,side:THREE.DoubleSide,depthWrite:false})
      // Recess the prayer niche one metre into the balcony, beyond the former window line.
      addBox(width,.055,depth,center,-.028,-depth/2,stone)
      addBox(width,H,.09,center,H/2,-depth,stone)
      for(const x of [from,from+width]){
        addBox(.07,1.05,depth,x,.525,-depth/2,oak)
        addBox(.018,H-1.05,depth,x,(H+1.05)/2,-depth/2,frostedGlass)
        addBox(.055,H,.055,x,H/2,0,oak)
      }
      addBox(width,.06,.09,center,H-.03,0,oak)
      addBox(width,.025,.12,center,.012,0,stone)
      // One sliding screen is parked over the left half, leaving a clear entrance.
      addBox(width/2-.035,H-.14,.018,from+width/4,H/2,.015,frostedGlass)
      addBox(.022,.23,.04,center-.10,1.05,.04,brass)
      addBox(.97,.38,.34,center,.27,-depth+.21,oak)
      addBox(1.03,.035,.43,center,.48,-depth+.22,stone)
      addBox(.96,1.22,.027,center,1.38,-depth+.07,oak)
      addBox(.88,.04,.28,center,.99,-depth+.25,stone)
      for(const x of [center-.36,center+.36]) addBox(.018,1.12,.032,x,1.45,-depth+.095,brass)
      const arch=new THREE.Mesh(new THREE.TorusGeometry(.33,.018,8,40,Math.PI),brass)
      arch.position.set(center,1.60,-depth+.10);shell.add(arch)
      const altarLight=new THREE.PointLight('#ffe6b4',1.2,2.2);altarLight.position.set(center,2.32,-depth+.42);scene.add(altarLight)
    }
    const furniture=new THREE.Group();shell.add(furniture)
    if(roomKey==='drawing'){
      const {sofa,coffeeTable,windowSeat}=room.furniture
      const sofaX=mm(sofa.centerXmm),sofaZ=mm(sofa.centerZmm),sofaW=mm(sofa.widthMm),sofaL=mm(sofa.lengthMm)
      const tableX=mm(coffeeTable.centerXmm),tableZ=mm(coffeeTable.centerZmm)
      const seatX=mm(windowSeat.centerXmm),seatZ=mm(windowSeat.centerZmm),seatW=mm(windowSeat.widthMm),seatD=mm(windowSeat.depthMm)
      const upholstery=new THREE.MeshStandardMaterial({color:'#ddd4c7',roughness:.94})
      const cushion=new THREE.MeshStandardMaterial({color:'#eee6d9',roughness:.98})
      const wood=new THREE.MeshStandardMaterial({color:'#9c714e',roughness:.62})
      const rug=new THREE.MeshStandardMaterial({color:'#e8dfcf',roughness:1})
      const metal=new THREE.MeshStandardMaterial({color:'#363b40',metalness:.55,roughness:.38})
      // West-facing seating leaves the northeast entry and east opening unobstructed.
      addBox(1.85,.012,2.75,1.27,.014,2.52,rug,furniture)
      addBox(sofaW,.24,sofaL,sofaX,.35,sofaZ,upholstery,furniture)
      addBox(.22,.57,sofaL,sofaX-.36,.64,sofaZ,upholstery,furniture)
      for(const z of [sofaZ-.75,sofaZ,sofaZ+.75]) addBox(.66,.12,.7,sofaX+.09,.50,z,cushion,furniture)
      for(const z of [sofaZ-sofaL/2-.005,sofaZ+sofaL/2+.005]) addBox(sofaW,.48,.16,sofaX,.54,z,upholstery,furniture)
      for(const x of [sofaX-.31,sofaX+.28]) for(const z of [sofaZ-.97,sofaZ+.97]) addBox(.055,.13,.055,x,.12,z,wood,furniture)
      const tableTop=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.055,48),wood)
      tableTop.scale.set(mm(coffeeTable.widthMm)/2,1,mm(coffeeTable.lengthMm)/2);tableTop.position.set(tableX,.43,tableZ);tableTop.castShadow=true;tableTop.receiveShadow=true;furniture.add(tableTop)
      for(const x of [tableX-.30,tableX+.30]) for(const z of [tableZ-.39,tableZ+.39]) addBox(.035,.39,.035,x,.215,z,metal,furniture)
      // The 450 mm seat top stays below the existing 550 mm south window sill.
      addBox(seatW,.39,seatD,seatX,.195,seatZ,wood,furniture)
      addBox(seatW-.03,.06,seatD-.02,seatX,.42,seatZ,cushion,furniture)
      for(const x of [seatX-.67,seatX,seatX+.67]) addBox(.48,.04,.16,x,.47,seatZ+.125,upholstery,furniture)
    }else if(roomKey==='lobby'){
      const {diningTable,chairRowsZmm,chairOffsetXmm}=room.furniture
      const tableX=mm(diningTable.centerXmm),tableZ=mm(diningTable.centerZmm)
      const oak=new THREE.MeshStandardMaterial({color:'#a98259',roughness:.66})
      const upholstery=new THREE.MeshStandardMaterial({color:'#ded2bd',roughness:.96})
      const metal=new THREE.MeshStandardMaterial({color:'#393b38',metalness:.45,roughness:.42})
      // A 1200 x 700 mm table sits west of the pooja alcove, leaving its east-side approach open.
      addBox(mm(diningTable.widthMm),.055,mm(diningTable.lengthMm),tableX,mm(diningTable.heightMm),tableZ,oak,furniture)
      addBox(.11,.67,.11,tableX,.38,tableZ,metal,furniture)
      addBox(.54,.035,.54,tableX,.035,tableZ,metal,furniture)
      for(const side of [-1,1]) for(const zMm of chairRowsZmm){
        const x=tableX+side*mm(chairOffsetXmm),z=mm(zMm)
        addBox(.44,.065,.46,x,.47,z,upholstery,furniture)
        addBox(.055,.47,.46,x+side*.205,.73,z,oak,furniture)
        for(const dx of [-.16,.16]) for(const dz of [-.17,.17]) addBox(.035,.44,.035,x+dx,.22,z+dz,metal,furniture)
      }
    }
    furniture.visible=showFurniture
    southWall.visible=showSouthWall
    const grid=new THREE.GridHelper(Math.ceil(span),Math.ceil(span),0xffffff,0xffffff);grid.material.opacity=.18;grid.material.transparent=true;grid.position.set(W/2,.006,L/2);shell.add(grid)
    const labelTextures=[]
    const addMarker=(text,x,z)=>{
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=80
      const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(255,255,255,.94)';ctx.beginPath();ctx.roundRect(4,4,152,72,18);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=room.color;ctx.stroke();ctx.fillStyle='#172033';ctx.font='900 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,80,41)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;labelTextures.push(texture)
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.set(x,.1,z);sprite.scale.set(.34,.17,1);sprite.renderOrder=1000;shell.add(sprite)
    }
    addMarker('N',W/2,.25);addMarker('S',W/2,L-.25);addMarker('W',.25,L/2);addMarker('E',W-.25,L/2)
    scene.add(new THREE.HemisphereLight('#ffffff','#718096',1.15))
    const sun=new THREE.DirectionalLight('#fff4dc',1.65);sun.position.set(-2,6,4);sun.castShadow=true;scene.add(sun)
    controls.target.set(W/2,H*.38,L/2)
    const setCamera=key=>{
      if(key==='top'){camera.position.set((W+extensionDepth)/2,span*1.22,L/2-.01);camera.up.set(0,0,1);controls.target.set((W+extensionDepth)/2,0,L/2)}
      else if(key==='pooja'&&room.poojaAlcove){const center=mm(room.poojaAlcove.fromMm+room.poojaAlcove.widthMm/2);camera.position.set(center-.75,1.82,2.85);camera.up.set(0,1,0);controls.target.set(center,1.28,-.55)}
      else if(roomKey==='lobby'){camera.position.set(W+span*.36,H*2.5,L+span*.42);camera.up.set(0,1,0);controls.target.set(W/2,H*.30,L/2)}
      else if(roomKey==='bedroom1'){camera.position.set(W+extensionDepth+span*.42,H*2.25,-span*.45);camera.up.set(0,1,0);controls.target.set((W+extensionDepth)/2,H*.40,L/2)}
      else{camera.position.set(openWest?-span*.46:W+span*.46,H*2.05,-span*.42);camera.up.set(0,1,0);controls.target.set(W/2,H*.42,L/2)}
      camera.lookAt(controls.target);controls.update()
    }
    setCamera('overview')
    const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    sceneRef.current={setCamera,setSouthVisible:value=>{southWall.visible=value},setFurnitureVisible:value=>{furniture.visible=value}}
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();labelTextures.forEach(texture=>texture.dispose());shell.traverse(object=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());else object.material?.dispose?.()});environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[roomKey])

  useEffect(()=>{sceneRef.current?.setCamera(view)},[view,roomKey])
  useEffect(()=>{sceneRef.current?.setSouthVisible(showSouthWall)},[showSouthWall,roomKey])
  useEffect(()=>{sceneRef.current?.setFurnitureVisible(showFurniture)},[showFurniture,roomKey])

  return <>
    {showSelector&&<div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
      {Object.entries(EMPTY_ROOM_SHELLS).map(([key,item])=><button key={key} onClick={()=>{setRoomKey(key);setView('overview');setShowSouthWall(key==='lobby'||key==='drawing');setShowFurniture(key==='drawing'||key==='lobby')}} style={{...buttonStyle(roomKey===key),padding:'9px 13px'}}>{item.name}</button>)}
    </div>}
    <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',gap:10,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:18,color:'#172033'}}>{room.name}</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>{room.widthMm.toLocaleString()} × {room.lengthMm.toLocaleString()} mm · provisional {room.heightMm.toLocaleString()} mm ceiling datum</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        <button onClick={()=>setView('overview')} style={buttonStyle(view==='overview')}>Overview</button>
        <button onClick={()=>setView('top')} style={buttonStyle(view==='top')}>Top</button>
        {room.poojaAlcove&&<button onClick={()=>setView('pooja')} style={buttonStyle(view==='pooja')}>Pooja view</button>}
        <button onClick={()=>setShowSouthWall(value=>!value)} style={buttonStyle(showSouthWall)}>{showSouthWall?'Hide south wall':'Show south wall'}</button>
        {(roomKey==='drawing'||roomKey==='lobby')&&<button onClick={()=>setShowFurniture(value=>!value)} style={buttonStyle(showFurniture)}>{showFurniture?'Hide furniture':'Show furniture'}</button>}
      </div>
    </div>
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1100px)',width:'100%'}}/>
    </section>
  </>
}

function buttonStyle(active){return{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'}}
