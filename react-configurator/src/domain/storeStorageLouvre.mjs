// Pure mm geometry: x east from kitchen west, z south from kitchen south, y above floor.
// West-facing slats project toward smaller x. Builders alone convert these boxes to metres.
export function louvreSlatPositions(from,to,origin,width,pitch){
  if(![from,to,origin,width,pitch].every(Number.isFinite)||width<=0||pitch<width||to<=from)throw new RangeError('Invalid louvre slat dimensions')
  const slats=[]
  for(let i=Math.floor((from-origin)/pitch);origin+i*pitch<to;i++){
    const start=Math.max(from,origin+i*pitch),end=Math.min(to,origin+i*pitch+width)
    if(end>start)slats.push({index:i,fromMm:start,widthMm:end-start})
  }
  return slats
}

export function storeStorageLouvre(storage,fridge,openFraction=0){
  const c=storage.slidingCover,l=storage.louvre
  if(!Number.isFinite(openFraction)||openFraction<0||openFraction>1)throw new RangeError('Cover opening must be between zero and one')
  const backingX=storage.fromKitchenWestMm-c.frontOffsetMm,frontX=backingX-l.slatDepthMm
  const top=l.ceilingHeightMm-l.ceilingClearanceMm,origin=fridge.southWallThicknessMm
  const panel=(id,x,z,width,bottom,height,sliding=false)=>({id,x,y:bottom,z,w:l.slatDepthMm+l.backingMm,h:height,d:width,sliding,
    slats:louvreSlatPositions(z,z+width,origin,l.slatWidthMm,l.pitchMm)})
  const slider=panel('storage sliding cover front',frontX,c.fromSouthMm,c.widthMm,l.floorClearanceMm,c.heightMm,true)
  // Both elevations share one z lattice. The fixed backing is recessed by one full panel thickness plus passing gap;
  // truly coplanar solid leaves would collide when parked. No appliance moves to make this work.
  const fixedWidth=l.bridgeToStorage?Math.max(fridge.widthMm,storage.fromKitchenSouthMm-origin):fridge.widthMm
  const fixedBottom=fridge.heightMm+l.ventilationGapMm
  const fixed=panel('storage fixed fridge louvre',frontX+slider.w+l.passingGapMm,origin,fixedWidth,fixedBottom,top-fixedBottom)
  const shift=c.travelMm*openFraction
  slider.z-=shift;slider.slats=slider.slats.map(s=>({...s,fromMm:s.fromMm-shift}))
  const track={name:'storage sliding track',x:frontX-l.track.frontOverhangMm,y:l.ceilingHeightMm-l.track.heightMm,
    z:c.fromSouthMm-c.travelMm,w:l.track.depthMm,h:l.track.heightMm,d:c.widthMm+c.travelMm,color:l.hardwareColor}
  // A stationary side guide remains alongside the leaf in both positions (not through its solid backing).
  const guide={name:'storage floor guide',x:backingX+l.backingMm,y:0,z:c.fromSouthMm,
    w:l.guide.depthMm,h:l.guide.heightMm,d:l.guide.widthMm,color:l.hardwareColor}
  const handle={name:'storage sliding cover handle',x:frontX-l.handle.depthMm,y:l.handle.bottomMm,
    z:slider.z+c.widthMm-l.handle.endInsetMm,w:l.handle.depthMm,h:l.handle.heightMm,d:l.handle.widthMm,color:l.handleColor,sliding:true}
  return {slider,fixed,track,guide,handle}
}

const overlaps=(a,b)=>['x','y','z'].every((axis,i)=>Math.min(a[axis]+a[['w','h','d'][i]],b[axis]+b[['w','h','d'][i]])>Math.max(a[axis],b[axis]))

export function checkStoreStorageLouvre(storage,fridge){
  const issues=[],need=(ok,message)=>{if(!ok)issues.push(message)},l=storage.louvre,c=storage.slidingCover
  const positive=[c.widthMm,c.heightMm,c.travelMm,l.ceilingHeightMm,l.slatWidthMm,l.slatDepthMm,l.pitchMm,l.backingMm,l.ventilationGapMm,l.passingGapMm,
    ...Object.values(l.track),...Object.values(l.guide),...Object.values(l.handle)]
  if(!positive.every(n=>Number.isFinite(n)&&n>0)||![l.floorClearanceMm,l.ceilingClearanceMm].every(n=>Number.isFinite(n)&&n>=0)||l.pitchMm<l.slatWidthMm)
    return {ok:false,issues:['Invalid louvre dimensions or clearances']}
  const parts=storeStorageLouvre(storage,fridge),{slider,fixed,track,guide}=parts
  need(slider.z<=storage.fromKitchenSouthMm&&slider.z+slider.d>=storage.fromKitchenSouthMm+storage.widthMm,'Closed cover must span the full storage opening')
  need(slider.y===l.floorClearanceMm&&slider.y+slider.h===l.ceilingHeightMm-l.ceilingClearanceMm,'Cover must reach floor to ceiling within configured clearances')
  need(slider.y+slider.h>=storage.heightMm,'Cover must hide the full storage height')
  need(fixed.h>0&&fixed.y-fridge.heightMm>=l.ventilationGapMm,'Ventilation gap must remain above the fridge')
  need(fixed.z<=fridge.southWallThicknessMm&&fixed.z+fixed.d>=fridge.southWallThicknessMm+fridge.widthMm,'Fixed panel must span the fridge width')
  need(fixed.z+fixed.d>=slider.z,'Upper panels must meet across the fridge/storage gap')
  need(fixed.x-(slider.x+slider.w)>=l.passingGapMm,'Slider must pass in front of fixed slats with clearance')
  // The swept box proves separation throughout travel, not just in the parked pose.
  const sweep={...slider,z:slider.z-c.travelMm,d:slider.d+c.travelMm}
  need(!overlaps(sweep,fixed),'Slider sweep overlaps fixed panel')
  need(track.y>=slider.y+slider.h&&track.y+track.h<=l.ceilingHeightMm,'Track must fit above the slider below the ceiling')
  need(!overlaps(sweep,track)&&!overlaps(sweep,guide),'Track or guide intersects the moving panel')
  need(guide.y+guide.h>slider.y&&guide.z>=slider.z&&guide.z+guide.d<=slider.z-c.travelMm+slider.d,'Floor guide must engage the leaf throughout travel')
  return {ok:issues.length===0,issues,parts,passingGapMm:fixed.x-slider.x-slider.w,ventilationGapMm:fixed.y-fridge.heightMm}
}
