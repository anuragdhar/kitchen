import test from 'node:test'
import assert from 'node:assert/strict'
import {EAST_INIT,WEST_INIT,AIRY_WEST_INIT,KITCHEN,KITCHEN_MIRROR_SPLASHBACK} from '../src/config/kitchenConfig.js'
import {KITCHEN_MIRROR_MATERIAL} from '../src/config/renderConfig.js'
import {mirrorSplashbackRectangles} from '../src/domain/mirrorSplashback.mjs'
import {buildBOM,buildBOMCsv,buildBOMMarkdown} from '../src/kitchen/export/bom.mjs'

const layout={east:EAST_INIT,west:WEST_INIT}
const gas=EAST_INIT.find(it=>it.id==='gas')
const sink=WEST_INIT.find(it=>it.id==='sink')
const slider=EAST_INIT.find(it=>it.id==='eastBacksplashSlider')
const mirror=(data,wall)=>mirrorSplashbackRectangles(data).find(p=>p.wall===wall)
// Numeric fixtures below freeze the 2026-10-06 PROPOSAL, requested by the owner:
// "Can we have bronze mirror splashback behind gas and sink." Synthetic moved
// positions/obstructions exercise boundaries; they are not new layout defaults.
test('bronze mirror proposal uses live dimensions and existing slider face',()=>{
  const before=structuredClone(layout)
  assert.deepEqual(mirrorSplashbackRectangles(layout),[
    {id:'mirror-east-gas-0',wall:'east',applianceId:'gas',mounting:'slider face',x:2222,y:2250,z:900,w:1000,h:426},
    {id:'mirror-west-sink-0',wall:'west',applianceId:'sink',mounting:'wall',x:18,y:1060,z:900,w:1062,h:450},
  ])
  assert.deepEqual(layout,before)
  assert.equal(KITCHEN_MIRROR_SPLASHBACK.marginMm,150)
  assert.equal(KITCHEN_MIRROR_MATERIAL.color,'#c9a47c')
  assert.equal(KITCHEN_MIRROR_MATERIAL.metalness,.82)
  assert.equal(KITCHEN_MIRROR_MATERIAL.roughness,.2)
})

test('hob mirror follows moves and resized appliances without changing saved items',()=>{
  const moved={east:EAST_INIT.map(it=>it.id==='gas'?{...it,y:3000,w:800}:it)}
  assert.equal(mirror(moved,'east').y,2850)
  assert.equal(mirror(moved,'east').w,1100)
  assert.equal(mirror(moved,'east').x,KITCHEN.width-slider.d)
})

test('sink mirror follows the airy layout and independent sink movement',()=>{
  assert.equal(mirror({west:AIRY_WEST_INIT},'west').y,2396)
  assert.equal(mirror({west:[{...sink,y:1800}]},'west').y,1650)
})

test('panels clip to both run ends and keep the west door clear',()=>{
  assert.equal(mirror({east:[{...gas,y:0},slider]},'east').y,0)
  assert.equal(mirror({east:[{...gas,y:0},slider]},'east').w,850)
  const north=mirror({east:[{...gas,y:KITCHEN.length-gas.w},slider]},'east')
  assert.equal(north.y+north.w,KITCHEN.length)
  assert.equal(north.w,850)
  const southSink=mirror({west:[{...sink,y:KITCHEN.westGap.to}]},'west')
  assert.equal(southSink.y,KITCHEN.westGap.to)
  assert.equal(southSink.w,sink.w+150)
  assert.deepEqual(mirrorSplashbackRectangles({east:[{...gas,y:KITCHEN.length+1000},slider]}),[])
})

test('absent, hidden, zero-width appliances and disabled feature produce no panels',()=>{
  assert.deepEqual(mirrorSplashbackRectangles({}),[])
  assert.deepEqual(mirrorSplashbackRectangles({east:[{...gas,hidden:true}],west:[{...sink,hidden:true}]}),[])
  assert.deepEqual(mirrorSplashbackRectangles({east:[{...gas,w:0}]}),[])
  assert.deepEqual(mirrorSplashbackRectangles(layout,{...KITCHEN_MIRROR_SPLASHBACK,enabled:false}),[])
})

test('counter-height neighbours clip margins, while lower base appliances do not',()=>{
  const west=[sink,{id:'south cabinet',y:1000,w:150,d:300,z:900,h:450},
    {id:'north slider',y:2050,w:300,d:152,z:900,h:450,backsplashSlider:true}]
  const p=mirror({west},'west')
  assert.equal(p.y,1150)
  assert.equal(p.y+p.w,2050)
  assert.equal(mirror(layout,'west').w,1062)
  const hiddenSlider=mirror({west:west.map(it=>it.id==='north slider'?{...it,hidden:true}:it)},'west')
  assert.equal(hiddenSlider.y+hiddenSlider.w,sink.y+sink.w+150)
  const hiddenNorth=mirror({west:west.map(it=>({...it,hidden:it.id!=='sink'}))},'west')
  assert.equal(hiddenNorth.w,1062)
})

test('shaft and overlapping splash-zone storage never receive sink mirror',()=>{
  const shaft=WEST_INIT.find(it=>it.id==='shaft')
  const p=mirror({west:[{...sink,y:3200},shaft]},'west')
  assert.equal(p.y+p.w,shaft.y)
  const covered={id:'cabinet',y:1000,w:1500,d:600,h:2700,z:0}
  assert.deepEqual(mirrorSplashbackRectangles({west:[sink,covered]}),[])
})

test('lowest overlapping overhead limits height; no overhead falls back to tile top',()=>{
  const lowUpper={id:'upper',y:sink.y,w:sink.w,d:320,z:1200,h:500}
  assert.equal(mirror({west:[sink,lowUpper]},'west').h,300)
  assert.equal(mirror({west:[sink,{...lowUpper,hidden:true}]},'west').h,450)
  const config={...KITCHEN_MIRROR_SPLASHBACK,upperUndersideMm:null,hoodUndersideMm:null}
  assert.equal(mirrorSplashbackRectangles({west:[sink]},config)[0].h,600)
  assert.equal(mirrorSplashbackRectangles({west:[sink]},{...config,tileZoneHeightMm:0}).length,0)
})

test('hidden east slider reveals wall finish; moved/shorter slider splits the finish without moving it',()=>{
  assert.equal(mirror({east:[gas,{...slider,hidden:true}]},'east').mounting,'wall')
  const panels=mirrorSplashbackRectangles({east:[gas,{...slider,y:2500,w:500,h:200}]})
  assert.equal(panels.reduce((area,p)=>area+p.w*p.h,0),1000*426)
  assert.ok(panels.some(p=>p.mounting==='slider face' && p.y===2500 && p.w===500 && p.h===200))
  assert.ok(panels.some(p=>p.mounting==='wall' && p.z===1100))
  assert.equal(mirror({west:WEST_INIT},'west').id,mirror(layout,'west').id)
})

test('BOM, CSV and Markdown report proposed panels without increasing gross backsplash area',()=>{
  const ctx={KITCHEN,eastRunLength:KITCHEN.length,westRunLength:KITCHEN.length-KITCHEN.westGap.to,
    BACKSPLASH_HEIGHT:600,eastModules:[],westModules:[],activeEast:EAST_INIT,activeWest:WEST_INIT,
    isCabinetLikeItem:()=>false,planLabel:id=>id}
  const bom=buildBOM(ctx)
  assert.equal(bom.mirrorAreaM2,'0.90')
  assert.deepEqual(bom.mirrorPanels,mirrorSplashbackRectangles(layout))
  assert.equal(bom.backsplashAreaM2,((ctx.eastRunLength+ctx.westRunLength)*600/1e6).toFixed(2))
  const exportCtx={...ctx,bom,eastTopUpperDepth:550,westTopUpperDepth:600,COUNTER_THICKNESS:38,renderMaterials:{}}
  assert.match(buildBOMCsv(exportCtx),/Proposed bronze mirror east gas.*1000x426/)
  assert.match(buildBOMMarkdown(exportCtx),/Proposed bronze mirror west \/ sink: 1062 x 450 mm/)
})
