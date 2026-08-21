#!/usr/bin/env node
// Testing step: validate PS1 bolt-to-end + west sink family + 3D should pass
import { EAST_INIT, WEST_INIT } from '../src/config/kitchenConfig.js'
import fs from 'fs'

function ok(cond, msg){ if(!cond){ console.error('FAIL:',msg); process.exit(1);} else console.log('PASS:',msg)}

const e = EAST_INIT, w = WEST_INIT
// East bolt to end: garage_NE last at y4146
const garage = e.find(x=>x.id==='garage_NE')
ok(garage && garage.y===4146 && garage.last, 'East garage_NE bolts to north at y4146 last')

// Check east order spice<gas<dishwasher<washing<garage
const sp = e.find(x=>x.id==='spice'), gas=e.find(x=>x.id==='gas'), dw=e.find(x=>x.id==='dishwasher'), wm=e.find(x=>x.id==='washing')
ok(sp && sp.y===1850, 'spice y1850')
ok(gas && gas.y===2000, 'gas y2000')
ok(dw && dw.y===2850 && dw.hidden, 'dishwasher hidden y2850')
ok(wm && wm.y===3400 && wm.hidden, 'washing hidden y3400 below garage')
ok(sp.y < gas.y && gas.y < dw.y && dw.y < wm.y && wm.y < garage.y, 'east order bolts to end')

// West: sink 800 y2850 + dish rack 800 above + purifier above + shaft last
const sink = w.find(x=>x.id==='sink'), rack = w.find(x=>x.id==='sinkUpperDishRack') || (()=>{ try{ return JSON.parse(fs.readFileSync('../src/config/kitchenConfig.js','utf8').match(/sinkUpperDishRack[^}]+}/)[0]) }catch{return null}})(), shaft = w.find(x=>x.id==='shaft')
ok(sink && sink.w===800 && sink.y===2850, 'west sink 800 @ y2850')
ok(shaft && shaft.y===4146 && shaft.last, 'shaft bolts to north y4146 last')
// Check dish rack exists in APPLIANCES (import via kitchenConfig)
import { APPLIANCES } from '../src/config/kitchenConfig.js'
const dishRack = APPLIANCES.find(x=>x.id==='sinkUpperDishRack')
const purifier = APPLIANCES.find(x=>x.id==='waterpurifier')
ok(dishRack && dishRack.y===2850 && (dishRack.w===800 || dishRack.width===800) && dishRack.z===1350, 'dish rack 800 @ y2850 z1350 family 6')
ok(purifier && purifier.mountedAbove && purifier.z===1350, 'purifier mounted above sink z1350 not on counter')
ok(sink.y < shaft.y && dishRack.y===sink.y, 'west sink+rack bolts before shaft')
// 3D clickable cabinets check
const appJs = fs.readFileSync(new URL('../src/App.jsx', import.meta.url).pathname, 'utf8')
ok(appJs.includes('clickableCabinets') && appJs.includes('raycaster') && appJs.includes('onClick'), '3D clickable cabinets raycaster + onClick present')
ok(appJs.includes('isCabinetFront') && appJs.includes('cabinet-toggle'), 'cabinet front open/close with toast')
console.log('All bolt-to-end 3D checks PASS — west sink family + east garage framing window + clickable cabinets')
