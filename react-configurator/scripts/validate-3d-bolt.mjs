#!/usr/bin/env node
// Testing step: validate new east wet wall + west cooking wall + 3D should pass.
import { EAST_INIT, WEST_INIT, APPLIANCES } from '../src/config/kitchenConfig.js'
import fs from 'fs'
import { fileURLToPath } from 'url'

function ok(cond, msg){ if(!cond){ console.error('FAIL:',msg); process.exit(1);} else console.log('PASS:',msg)}

const e = EAST_INIT, w = WEST_INIT

// East bolt to end: garage_NE last at y4146, matching the west shaft mass.
const garage = e.find(x=>x.id==='garage_NE')
ok(garage && garage.y===4146 && garage.last, 'East garage_NE bolts to north at y4146 last')

// East North->South order: washing/tall > purifier > sink > dishwasher.
const dw=e.find(x=>x.id==='dishwasher'), wm=e.find(x=>x.id==='washing'), purifier=e.find(x=>x.id==='waterpurifier'), sink=e.find(x=>x.id==='sink'), rack=e.find(x=>x.id==='sinkUpperDishRack')
ok(wm && wm.y===4146 && wm.hidden && wm.insideTall, 'washing hidden y4146 inside east tall cabinet')
ok(purifier && purifier.y===3796 && purifier.z===1350 && purifier.mountedAbove && purifier.hidden, 'purifier hidden in east upper y3796 z1350')
ok(sink && sink.w===800 && sink.y===2996, 'east sink 800 @ y2996')
ok(rack && rack.y===sink.y && rack.w===800 && rack.z===1350, 'east dish storage 800 above sink y2996 z1350')
ok(dw && dw.y===2396 && dw.hidden, 'dishwasher hidden y2396 south of sink')
ok(dw.y < sink.y && sink.y < purifier.y && purifier.y < wm.y && wm.y===garage.y, 'east N->S order washing -> purifier -> sink -> dishwasher')

// West North->South: shaft, food-processor garage, gap, gas stove with chimney.
const gas=w.find(x=>x.id==='gas'), westGarage=w.find(x=>x.id==='westGarage'), shaft = w.find(x=>x.id==='shaft')
ok(shaft && shaft.y===4146 && shaft.last, 'shaft bolts to north y4146 last')
ok(westGarage && westGarage.y===3546 && westGarage.garage, 'west food-processor garage y3546')
ok(gas && gas.y===2000 && gas.w===700, 'west gas stove y2000')
ok(gas.y + gas.w < westGarage.y && westGarage.y + westGarage.w === shaft.y, 'west N->S shaft -> garage -> gap -> gas')

const dishRack = APPLIANCES.find(x=>x.id==='sinkUpperDishRack')
const purifierModel = APPLIANCES.find(x=>x.id==='waterpurifier')
ok(dishRack && dishRack.wall==='east' && dishRack.y===2996 && (dishRack.w===800 || dishRack.width===800), 'dish rack model is on east above sink')
ok(purifierModel && purifierModel.wall==='east' && purifierModel.mountedAbove && purifierModel.z===1350, 'purifier model is hidden in east upper cabinet')

// 3D clickable cabinets check.
const appJs = fs.readFileSync(fileURLToPath(new URL('../src/App.jsx', import.meta.url)), 'utf8')
ok(appJs.includes('clickableCabinets') && appJs.includes('raycaster') && appJs.includes('onClick'), '3D clickable cabinets raycaster + onClick present')
ok(appJs.includes('isCabinetFront') && appJs.includes('cabinet-toggle'), 'cabinet front open/close with toast')
ok(appJs.includes('west gas cooktop glass slab') && appJs.includes('west hidden chimney vent slot'), 'west gas stove and chimney render branch present')
console.log('All new configuration checks PASS - east wet wall + west cooking wall + clickable cabinets')
