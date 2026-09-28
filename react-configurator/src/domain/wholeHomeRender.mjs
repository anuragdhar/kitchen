// Render-only schema. Never mutate kitchen projects or duplicate room measurements.
export const ARTIFACTS=Object.freeze([
  {id:'ceramic-vase',label:'Ivory ceramic vase',size:[.14,.14,.22]},
  {id:'wooden-bowl',label:'Walnut decorative bowl',size:[.26,.26,.09]},
  {id:'books',label:'Cloth-bound design books',size:[.28,.20,.07]},
  {id:'planter',label:'Small olive-green planter',size:[.24,.24,.38]},
])
export const PRESETS=Object.freeze(['day','evening','night'])
export const QUALITIES=Object.freeze(['draft','final'])
const finite=value=>typeof value==='number'&&Number.isFinite(value)
const slug=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(value)

export function buildHomeRenderJob(roomViews,scale,selections={},preset='day',quality='draft'){
  if(!PRESETS.includes(preset)||!QUALITIES.includes(quality))throw new Error('Unknown render preset or quality.')
  const {xMetresPerPixel:sx,zMetresPerPixel:sy}=scale||{}
  if(!finite(sx)||!finite(sy)||sx<=0||sy<=0)throw new Error('Invalid plan scale.')
  const supports=new Set()
  const rooms=Object.values(roomViews).map(room=>{
    if(!slug(room.key)||!Array.isArray(room.bounds)||room.bounds.length!==4||!room.bounds.every(finite))throw new Error('Invalid room bounds.')
    if(typeof room.name!=='string'||!room.name.trim()||room.name.length>200||room.bounds.some(value=>Math.abs(value)>1000))throw new Error('Invalid room name or bounds.')
    const [x1,y1,x2,y2]=room.bounds
    if(x1>=x2||y1>=y2)throw new Error('Empty room bounds.')
    const artifacts=(selections[room.key]||[]).map(item=>{
      if(!ARTIFACTS.some(asset=>asset.id===item.kind))throw new Error('Unknown artifact.')
      if(typeof item.support!=='string'||!item.support.trim()||item.support.length>200)throw new Error('Choose an existing support surface for every artifact.')
      if(supports.has(item.support))throw new Error('Each support surface can hold only one selected artifact.')
      supports.add(item.support)
      return {kind:item.kind,support:item.support}
    })
    if(artifacts.length>4||new Set(artifacts.map(a=>a.support)).size!==artifacts.length)throw new Error('Use at most one artifact per support surface (four per room).')
    return {id:room.key,name:room.name,bounds:[x1*sx,-y2*sy,x2*sx,-y1*sy],artifacts}
  })
  if(!rooms.length||rooms.length>32||new Set(rooms.map(room=>room.id)).size!==rooms.length)throw new Error('Invalid or duplicate rooms.')
  return {schema:'a501.whole-home-render',version:1,units:'metres',axes:'BLENDER_Z_UP',preset,quality,rooms}
}

export function readRenderIndex(value){
  if(value?.schema!=='a501.whole-home-output'||value.version!==1||!Array.isArray(value.rooms)||value.rooms.length>33||!PRESETS.includes(value.preset)||!QUALITIES.includes(value.quality))throw new Error('Invalid render output index.')
  for(const room of value.rooms){
    if(!slug(room.id)||typeof room.name!=='string'||!/^\/renders\/whole-home-realistic\/[a-f0-9]{12}\/[a-z][a-z0-9-]*\.png$/.test(room.image))throw new Error('Invalid render image path.')
  }
  return value
}
