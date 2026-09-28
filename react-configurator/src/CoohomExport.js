import * as THREE from 'three'
import JSZip from 'jszip'
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js'

const hull=points=>{
 const p=[...new Map(points.map(v=>[v.join(','),v])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const lo=[],hi=[]
 for(const v of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),v)<=0)lo.pop();lo.push(v)}
 for(const v of [...p].reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),v)<=0)hi.pop();hi.push(v)}return lo.slice(0,-1).concat(hi.slice(0,-1))
}
function dxf(outlines,labels){
 const lines=[],put=(...pairs)=>lines.push(...pairs.map(String))
 put(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1015',9,'$INSUNITS',70,4,9,'$MEASUREMENT',70,1,0,'ENDSEC',0,'SECTION',2,'TABLES',0,'TABLE',2,'LAYER',70,4)
 for(const [name,color] of [['WALLS',7],['WINDOWS',4],['FURNITURE',8],['ROOM_LABELS',3]])put(0,'LAYER',100,'AcDbSymbolTableRecord',100,'AcDbLayerTableRecord',2,name,70,0,62,color,6,'CONTINUOUS')
 put(0,'ENDTAB',0,'ENDSEC',0,'SECTION',2,'ENTITIES')
 for(const {points,layer} of outlines){if(points.length<3)continue;put(0,'LWPOLYLINE',100,'AcDbEntity',8,layer,100,'AcDbPolyline',90,points.length,70,1);for(const [x,y] of points)put(10,x,20,y)}
 for(const label of labels)put(0,'TEXT',100,'AcDbEntity',8,'ROOM_LABELS',100,'AcDbText',10,label.x,20,label.y,30,0,40,150,1,label.name,50,0)
 put(0,'ENDSEC',0,'EOF');return lines.join('\n')+'\n'
}
export async function exportCoohomPackage({model,wallMeshes,rooms,scaleX,scaleZ,kitchenSnapshot,download=true}){
 model.updateMatrixWorld(true)
 const walls=new Set(wallMeshes),architecture=[],furniture=[],seen=new Set(),vector=new THREE.Vector3()
 const scene=new THREE.Group();scene.name='A501 current furnished model'
 let meshes=0,triangles=0
 model.traverseVisible(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position)return
  const bounds=new THREE.Box3().setFromObject(mesh)
  if(bounds.max.y<.05)return
  const pos=mesh.geometry.attributes.position,points=[]
  for(let i=0;i<pos.count;i++){vector.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);points.push([Math.round(-vector.x*1000),Math.round(vector.z*1000)])}
  const polygon=hull(points),isWall=walls.has(mesh),transparent=mesh.material?.transparent&&mesh.material?.opacity<.6
  if(polygon.length>=3){
   const layer=isWall?(transparent?'WINDOWS':'WALLS'):'FURNITURE'
   // Cut structural walls at 1.2m so lintels do not close door openings.
   if(!isWall||(bounds.min.y<1.2&&bounds.max.y>1.2)){
    const key=layer+JSON.stringify(polygon);if(!seen.has(key)){seen.add(key);(isWall?architecture:furniture).push({points:polygon,layer})}
   }
  }
  const geometry=mesh.geometry.clone();geometry.applyMatrix4(mesh.matrixWorld)
  const copy=new THREE.Mesh(geometry,mesh.material);copy.name=mesh.name||'Element '+(++meshes);scene.add(copy)
  triangles+=(geometry.index?.count||pos.count)/3
 })
 const labels=rooms.map(room=>({name:room.name,x:-(room.bounds[0]+room.bounds[2])*scaleX*500,y:(room.bounds[1]+room.bounds[3])*scaleZ*500}))
 const binary=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true})
 const zip=new JSZip()
 zip.file('A501-floor-plan-import.dxf',dxf(architecture,labels))
 zip.file('A501-furnished-plan-reference.dxf',dxf([...architecture,...furniture],labels))
 zip.file('A501-furnished-reference.glb',binary)
 const summary={generatedAt:new Date().toISOString(),cadUnits:'millimetres',cadOrientation:'north +Y, east +X',glbUnits:'metres; Y up; north +Z, east -X',wallOutlines:architecture.length,furnitureOutlines:furniture.length,triangles,kitchenSnapshot,limitations:['CAD is exported from the current whole-home geometry, not a surveyed construction drawing.','Individual rooms are scaled to the source plan bounds in the whole-home view; compare imported room dimensions against the dedicated room dimensions before construction.','Furniture DXF is a reference projection, not editable Coohom furniture.','GLB is a furnished reference; normal Coohom personal model upload excludes full-home models.','GLB preserves current modeled detail, not every detail of the dedicated kitchen.','Door and window recognition and dimensions need review after CAD import.']}
 zip.file('export-manifest.json',JSON.stringify(summary,null,2))
 zip.file('START-HERE.txt',[
 'A501 — Coohom trial import package','',
 '1. In Coohom create a design and choose Import floor plan / CAD.',
 '2. Select A501-floor-plan-import.dxf. Units are MILLIMETRES.',
 '3. Review wall recognition, door gaps, windows and room dimensions before accepting.',
 '4. Use A501-furnished-plan-reference.dxf as a separate placement reference, not as the wall-recognition input.',
 '5. A501-furnished-reference.glb preserves the modeled home for compatible 3D viewers. It is NOT a native editable Coohom project and normal Coohom model upload does not accept a whole furnished home.',
 '6. Recreate Coohom furniture or import supported individual objects separately. No Coohom import has been validated yet.',
 '',...summary.limitations,'',
 'Kitchen source: '+(kitchenSnapshot?'saved browser layout':'code defaults; export from your usual browser using the export button to include its saved kitchen'),
 '',
 'Official guidance:',
 'https://blog.coohom.com/autocad-drawing-and-coohom-design-3d-design-and-fast-rendering/',
 'https://www.coohom.com/en_US/helpcenter/article/how-to-upload-my-own-3d-models'
 ].join('\n'))
 const blob=await zip.generateAsync({type:'blob'})
 scene.traverse(mesh=>mesh.geometry?.dispose())
 if(download){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='A501-Coohom-import-package.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
 return {blob,summary}
}
