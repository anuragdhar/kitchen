import {KITCHEN, KITCHEN_MIRROR_SPLASHBACK} from '../config/kitchenConfig.js'

// Legacy kitchen frame, all mm: y runs south -> north, z is height, x grows east.
// PROPOSAL, 2026-10-06: base appliances below the counter do not trim margins;
// objects occupying the splash zone do. Use the lowest overhead underside across
// each remaining span for a rectangular top (not a stepped fabrication profile).
export function mirrorSplashbackRectangles({east=[],west=[]}, config=KITCHEN_MIRROR_SPLASHBACK, room=KITCHEN) {
  if(!config.enabled) return []
  const rectangles=[]
  for(const [wall,items,targetId] of [['east',east,'gas'],['west',west,'sink']]){
    const active=items.filter(it=>!it.hidden && it.w>0 && it.d>0)
    const target=active.find(it=>it.id===targetId)
    if(!target) continue
    let panelIndex=0
    const bottom=config.counterTopMm
    const zoneTop=bottom+config.tileZoneHeightMm
    const runStart=wall==='east'?0:room.westGap.to
    let spans=[{from:Math.max(runStart,target.y-config.marginMm),to:Math.min(room.length,target.y+target.w+config.marginMm)}].filter(span=>span.to>span.from)
    const slider=wall==='east' && config.eastSliderTreatment==='face'
      ?active.find(it=>it.id==='eastBacksplashSlider'):null
    const neighbours=active.filter(it=>it!==target && it!==slider && !it.powerPoint)
    // Remove occupied horizontal intervals; touching boundaries are allowed.
    for(const it of neighbours.filter(it=>(it.z??0)<=bottom && (it.z??0)+it.h>bottom)){
      spans=spans.flatMap(span=>it.y>=span.to || it.y+it.w<=span.from?[span]:[
        {from:span.from,to:Math.min(span.to,it.y)},
        {from:Math.max(span.from,it.y+it.w),to:span.to},
      ].filter(part=>part.to>part.from))
    }
    // Split at an east slider edge if a moved hob straddles face and wall.
    if(slider) spans=spans.flatMap(span=>{
      const cuts=[span.from,...[slider.y,slider.y+slider.w].filter(y=>y>span.from && y<span.to),span.to].sort((a,b)=>a-b)
      return cuts.slice(1).map((to,i)=>({from:cuts[i],to}))
    })
    for(const span of spans){
      if(span.to<=span.from) continue
      const overhead=neighbours.filter(it=>!it.backsplashSlider && (it.z??0)>bottom && it.y<span.to && it.y+it.w>span.from)
      const top=Math.min(zoneTop,config.upperUndersideMm??zoneTop,
        targetId==='gas'?(config.hoodUndersideMm??zoneTop):zoneTop,...overhead.map(it=>it.z))
      if(top<=bottom) continue
      const onSlider=slider && slider.y<span.to && slider.y+slider.w>span.from
      const sliderBottom=slider?.z??bottom
      const cuts=[bottom,...(onSlider?[sliderBottom,sliderBottom+slider.h].filter(z=>z>bottom && z<top):[]),top].sort((a,b)=>a-b)
      for(let i=1;i<cuts.length;i++){
        const z=cuts[i-1], h=cuts[i]-z
        if(h<=0) continue
        const face=onSlider && z>=sliderBottom && cuts[i]<=sliderBottom+slider.h
        const depth=face?slider.d:config.tileFaceDepthMm
        rectangles.push({id:`mirror-${wall}-${targetId}-${panelIndex++}`,wall,applianceId:targetId,
          mounting:face?'slider face':'wall',x:wall==='east'?room.width-depth:depth,
          y:span.from,z,w:span.to-span.from,h})
      }
    }
  }
  return rectangles
}
