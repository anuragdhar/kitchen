// Material IDs are stable project data. Original texture provenance lives in public/materials/manifest.json.
export const MATERIALS = Object.freeze([
  {id:'teak',label:'Teak veneer',role:'wood',asset:'teak_veneer',sizeMetres:1,normalStrength:.25,roughness:.82},
  {id:'white-oak',label:'White oak veneer',role:'wood',asset:'white_oak_veneer',sizeMetres:.5,normalStrength:.22,roughness:.88},
  {id:'red-oak',label:'Red oak veneer',role:'wood',asset:'red_oak_veneer',sizeMetres:1,normalStrength:.22,roughness:.88},
  {id:'cherry',label:'Cherry veneer',role:'wood',asset:'cherry_veneer',sizeMetres:1,normalStrength:.22,roughness:.82},
  {id:'plaster-natural',label:'Natural beige plaster',role:'plaster',asset:'beige_wall_001',sizeMetres:3,normalStrength:.3,roughness:1},
  {id:'plaster-ivory',label:'Ivory painted plaster',role:'plaster',asset:'beige_wall_001',sizeMetres:3,normalStrength:.3,roughness:1,color:'#f4eee3',reliefOnly:true},
  {id:'plaster-white',label:'Soft white painted plaster',role:'plaster',asset:'beige_wall_001',sizeMetres:3,normalStrength:.25,roughness:1,color:'#faf9f5',reliefOnly:true},
].map(Object.freeze));
export function getMaterial(id,role){
  if(id==='original')return null;
  const material=MATERIALS.find(value=>value.id===id&&(!role||value.role===role));
  if(!material)throw new Error(`Unknown ${role||''} material: ${id}`);
  return material;
}
export function mapPath(material,channel){
  if(!['basecolor','normal','roughness'].includes(channel))throw new Error('Unknown PBR map channel.');
  return `materials/${material.asset}/${channel}.jpg`;
}
