export const ROOM_WIDTH = 2324
export const KITCHEN_AUTOSAVE_KEY = 'kitchen-autosave-v4-west-wet-east-open-garage'
export const ROOM_LENGTH = 4746
export const ROOM_HEIGHT = 2700
export const WEST_CLEAR_FROM = 0
export const WEST_CLEAR_TO = 610 // 2ft clear from the south door side
export const NORTH_CLEAR = 0
export const WINDOW_BELOW_DEPTH = 300
export const SHAFT_X = 0
export const SHAFT_W = 609 // keep original depth (east-west)
export const SHAFT_L = 838 // 838×609 N-S (north to south)
export const SHAFT_Y = ROOM_LENGTH-SHAFT_L // shaft touches the moved north wall
export const KITCHEN_WINDOW_SILL_MM = 914 // approximately three feet
export const EAST_BASE_DEPTH = 600
export const EAST_LOWER_UPPER_DEPTH = 320
export const EAST_TOP_UPPER_DEPTH = 550
export const WEST_COUNTER_DEPTH = 600 // 24in nominal, equal to east for open wet appliances
export const WEST_LOWER_UPPER_DEPTH = 320
export const WEST_TOP_UPPER_DEPTH = 450

export const KITCHEN = { width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT, door:{w:855,x:0}, southWallReturn:{fromWestMm:855,lengthMm:ROOM_WIDTH-855}, window:{w:1100,h:ROOM_HEIGHT-KITCHEN_WINDOW_SILL_MM,sill:KITCHEN_WINDOW_SILL_MM,x:612, belowDepth:WINDOW_BELOW_DEPTH, transomHeight:610, sections:2, topFixed:true, bottomOperation:'sliding', bottomFixedCount:0, bottomSlidingCount:2}, shaft:{w:SHAFT_W,l:SHAFT_L,x:SHAFT_X,y:SHAFT_Y}, mergedShaftPlan:{x1:127,y1:667,x2:165,y2:703}, northClear:NORTH_CLEAR, windowBelow:{x:612,w:1100,depth:WINDOW_BELOW_DEPTH}, westGap:{from:WEST_CLEAR_FROM,to:WEST_CLEAR_TO,w:WEST_CLEAR_TO-WEST_CLEAR_FROM}, westCounterDepth:WEST_COUNTER_DEPTH, eastBacksplashSliderDepth:102, westSliderDepth:152, walkway:{floor:1124,eye:1004} }

// Outside the kitchen, where the former store was shown. Its north side meets
// the outer face of the south wall, and the two doors face west toward the lobby.
export const KITCHEN_REFRIGERATOR = {
  model:'LG GL-B257HDS3', depthMm:735, widthMm:913, heightMm:1790,
  fromKitchenWestMm:1400, southWallThicknessMm:45, faces:'west',
}

// Current configuration: west wet wall and east cooking/appliance wall.
// East South->North: open microwave, open appliance garage with food processor, gas cooktop, 4in backsplash slider storage.
export const EAST_INIT = [
  {id:'microwave', label:'Open microwave above backsplash at east south beginning y0', w:600, d:400, h:350, y:0, x:1924, z:1360, color:'#1a1a1a', open:true, noCover:true, wallMounted:true},
  {id:'applianceGarage', label:'Open appliance garage at counter height with food processor, pulls toward gas', w:850, d:600, h:450, y:0, x:1724, z:900, color:'#C4B5A5', open:true, noCover:true, pullToward:'gas', subcomponents:[{id:'foodprocessor-inside-applianceGarage', label:'Food processor inside open appliance garage'}]},
  {id:'eastBacksplashSlider', label:'4in backsplash slider storage along east wall behind counter and stove', w:ROOM_LENGTH, d:102, h:450, y:0, x:2222, z:900, color:'#d9c6af', backsplashSlider:true, sliderDoor:true},
  {id:'gas', label:'Gas Stove 700W y1200 east with hidden chimney above', w:700, d:600, h:900, y:1200, x:1724, color:'#2a2a2a', subcomponents:[{id:'gas-cooktop-east', label:'cooktop slab east'}, {id:'kitchen-chimney-east', label:'kitchen chimney above gas'}]},
  {id:'garage_NE', label:'East north tall cabinet removed for current option', w:0, d:0, h:0, y:0, x:1724, color:'#C4B5A5', hidden:true},
  {id:'garage_SE', label:'East south tall cabinet removed - replaced by open microwave and appliance garage', w:0, d:0, h:0, y:0, x:1724, color:'#C4B5A5', hidden:true},
  {id:'geyserEastTop', label:'Hot Water Geyser east top - kept for reference (now west)', w:200, d:200, h:300, y:2600, x:1724, color:'#c9d6e3', z:2100, wallMounted:true, topMounted:true, hidden:true}
]

export const WEST_INIT = [
  {id:'shaft', label:'Shaft 838 mm along the west wall × 609 mm deep, against the north wall', w:SHAFT_L, d:SHAFT_W, h:ROOM_HEIGHT, y:SHAFT_Y, x:SHAFT_X, color:'#999', fixed:true, last:true, inside:true},
  {id:'washing', label:'Open washing machine first after door on west y610', w:600, d:600, h:880, y:610, x:0, color:'#E5E0DA', z:0, open:true, noCover:true, doorOpens:'left'},
  {id:'sink', label:'Kitchen Sink 30 inch (762W x 457D) y1210 west after washing', w:762, d:457, h:900, y:1210, x:0, color:'#6a6a6a', z:0, sinkType:'single-bowl-drainboard-304-30x18'},
  {id:'sinkUpperDishRack', label:'Vast Utensil Storage 762W y1210 z1350 above west sink', w:762, d:320, h:700, y:1210, x:0, color:'#f0e6da', z:1350},
  {id:'dishwasher', label:'Open dishwasher 600W y1972 west after sink', w:600, d:600, h:880, y:1972, x:0, color:'#A8A8A8', z:0, open:true, noCover:true, ground:true, doorOpens:'down'},
  {id:'westSixInchSlider', label:'6in slider storage from counter height between sink/dishwasher zone and shaft', w:552, d:152, h:450, y:2572, x:0, color:'#d9c6af', z:900, backsplashSlider:true, sliderDoor:true},
  {id:'waterpurifier', label:'Water Purifier reference removed from active west run', w:0, d:0, h:0, y:0, x:0, color:'#7EB8E8', z:1350, mountedAbove:true, hidden:true},
  {id:'trashCan', label:'Trash pull-out removed from active current option', w:0, d:0, h:0, y:0, x:70, color:'#2b2b2b', hidden:true},
  {id:'geyser', label:'Hot Water Geyser reference hidden', w:0, d:0, h:0, y:0, x:0, color:'#c9d6e3', z:2100, wallMounted:true, topMounted:true, hidden:true},
  {id:'westGarage', label:'Appliance Garage west removed - now east', w:0, d:0, h:0, y:0, x:0, color:'#C4B5A5', hidden:true},
  {id:'gasWestRemoved', label:'Gas removed from west - now east', w:0, d:0, h:0, y:0, x:0, hidden:true},
  {id:'powerPointWest1', label:'Power point west near gas (now east gas, keep west)', w:20, d:10, h:100, y:1650, x:0, color:'#111', z:1100, powerPoint:true, wallMounted:true, hidden:true},
  {id:'powerPointWest2', label:'Extra power point west for charging y800', w:20, d:10, h:100, y:800, x:0, color:'#111', z:1100, powerPoint:true, extra:true, wallMounted:true, hidden:true},
  {id:'powerPointEast1', label:'Power point east near gas', w:20, d:10, h:100, y:1650, x:1724, color:'#111', z:1100, powerPoint:true, wallMounted:true, hidden:true},
  {id:'powerPointEast2', label:'Extra power point east for charging y2800', w:20, d:10, h:100, y:2800, x:1724, color:'#111', z:1100, powerPoint:true, extra:true, wallMounted:true, hidden:true}
]

// Reversible working option: keep the south entry clear and group the wet
// appliances at floor level beside the northwest shaft.
export const AIRY_WEST_INIT = WEST_INIT.map(item => {
  const positions = {
    dishwasher: 1946,
    sink: 2546,
    sinkUpperDishRack: 2546,
    washing: 3308,
    westSixInchSlider: 1200,
  }
  return positions[item.id] === undefined ? {...item} : {...item, y:positions[item.id]}
})


// Rich shared layout model - primary for FreeCAD/Blender/React consumption
export const ROOM = {
  id:'room-main',
  width:ROOM_WIDTH,
  length:ROOM_LENGTH,
  height:ROOM_HEIGHT,
  unit:'mm'
}

export const OPENINGS = {
  door:{ id:'opening-door-south', category:'opening', wall:'south', x:KITCHEN.door.x, y:0, z:0, width:KITCHEN.door.w, depth:35, height:2100, locked:false, color:'#fffaf3', material:'void', clearance:null, label:'South opening to Lobby / Dining' },
  window:{ id:'opening-window-north', category:'opening', wall:'north', x:612, y:ROOM_LENGTH-45, z:KITCHEN_WINDOW_SILL_MM, width:1100, depth:24, height:ROOM_HEIGHT-KITCHEN_WINDOW_SILL_MM, locked:false, color:'#7eb8e8', material:'glass', clearance:null, label:'North Window â€” 2 Bays Ã— 610 Fixed Top / 1176 Sliding Bottom (centre mullion) â€” LEFT-TOP 12\" Metal Exhaust', sill:KITCHEN_WINDOW_SILL_MM, sections:2, transomHeight:610, top:{ operation:'fixed', lights:2, height:610, leftTop:{ type:'exhaustFan', size:300, material:'metal', model:'12-inch heavy-duty', status:'installed' }, rightTop:{ type:'fixedGlass' } }, bottom:{ operation:'sliding', lights:2, height:ROOM_HEIGHT-KITCHEN_WINDOW_SILL_MM-610, slidingCount:2, fixedCount:0, slidingPosition:'both' }, notes:{ shaftAlternative:'Hole in shaft wall (west shaft 61Ã—83.8 at y4146) can also host exhaust â€” noted as alternative to window mount', exhaustChoice:'Metal 12-inch recommended for kitchen heat/grease â€” plastic not suggested' } },
  shaft:{ id:'opening-shaft-nw', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 60.9x83.8 NW' }
}

export const WALLS = {
  east:{ id:'wall-east', label:'East', axis:'y', orientation:'North (N) left to South (S) right', side:'right', length:ROOM_LENGTH, height:ROOM_HEIGHT, x:ROOM_WIDTH, y:0 },
  west:{ id:'wall-west', label:'West', axis:'y', orientation:'South (S) left to North (N) right', side:'left', length:ROOM_LENGTH, height:ROOM_HEIGHT, x:0, y:0 },
  north:{ id:'wall-north', label:'North', axis:'x', orientation:'West left to East right', side:'top', length:ROOM_WIDTH, height:ROOM_HEIGHT, x:0, y:ROOM_LENGTH },
  south:{ id:'wall-south', label:'South', axis:'x', orientation:'East left to West right', side:'bottom', length:ROOM_WIDTH, height:ROOM_HEIGHT, x:0, y:0 }
}

export const CABINET_RUNS = [
  { id:'east-base-run', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:0, z:0, width:ROOM_LENGTH, depth:EAST_BASE_DEPTH, height:900, locked:false, color:'#c8b39d', material:'laminate', clearance:null, label:'East 600D base run with continuous counter to north wall' },
  { id:'east-lower-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_LOWER_UPPER_DEPTH, y:0, z:1350, width:ROOM_LENGTH, depth:EAST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:null, label:'East 320D lower upper cabinets to north wall' },
  { id:'east-top-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_TOP_UPPER_DEPTH, y:0, z:1850, width:ROOM_LENGTH, depth:EAST_TOP_UPPER_DEPTH, height:850, locked:false, color:'#bfa891', material:'laminate', clearance:null, label:'East 550D top upper cabinets to north wall no gap' },
  { id:'west-counter-run', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:0, width:ROOM_LENGTH-WEST_CLEAR_TO, depth:WEST_COUNTER_DEPTH, height:900,
    locked:false, color:'#c8b39d', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 600D counter after 610mm door clear zone' },
  { id:'west-lower-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1350, width:ROOM_LENGTH-WEST_CLEAR_TO, depth:WEST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 320D lower upper after door clear zone' },
  { id:'west-top-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1850, width:ROOM_LENGTH-WEST_CLEAR_TO, depth:WEST_TOP_UPPER_DEPTH, height:850, locked:false, color:'#bfa891', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 450D top upper after door clear zone no gap' },
  { id:'west-door-clear-zone', category:'clearZone', wall:'west', x:0, y:WEST_CLEAR_FROM, z:0, width:WEST_CLEAR_TO-WEST_CLEAR_FROM, depth:WEST_COUNTER_DEPTH, height:ROOM_HEIGHT, locked:true, color:'#fffaf3', material:'void', clearance:{ kind:'fullHeight', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West door clear zone y0-y610 (2ft) no counter no upper no LED' },
  { id:'north-window-below-zone', category:'referenceZone', wall:'north', x:612, y:ROOM_LENGTH-WINDOW_BELOW_DEPTH, z:0, width:1100, depth:WINDOW_BELOW_DEPTH, height:900, locked:true, color:'#eaf6fd', material:'void', clearance:{ kind:'windowBelow', depth:WINDOW_BELOW_DEPTH }, label:'Window-only below-sill reference zone' }
]

export const APPLIANCES = [
  { id:'garage_NE', category:'cabinet', wall:'east', x:1724, y:3251, z:0, width:711, depth:600, height:2700, locked:true, color:'#C4B5A5', material:'laminate', clearance:{ kind:'tallGarageFullHeight', matchesShaft:true }, label:'East Tall NE 28in y3251 north - washing far north', last:true, fullHeight:true },
  { id:'garage_SE', category:'cabinet', wall:'east', x:1724, y:0, z:0, width:610, depth:600, height:2700, locked:true, color:'#C4B5A5', material:'laminate', clearance:{ kind:'tallGarageFullHeight' }, label:'East Tall SE 24in y0 south symmetrical', first:true, fullHeight:true },
  { id:'washing', category:'appliance', wall:'east', x:1724, y:3251, z:0, width:600, depth:600, height:880, locked:false, color:'#E5E0DA', material:'stainless_steel', clearance:{ kind:'insideTallCabinet', garageY:3251 }, label:'Washing far north y3251 east', hidden:true, behindShutter:true, insideTall:true },
  { id:'gas', category:'appliance', wall:'east', x:1724, y:1500, z:900, width:700, depth:600, height:900, locked:false, color:'#2a2a2a', material:'stainless_steel', clearance:null, label:'Gas Stove 700W y1500 east with chimney' },
  { id:'geyserEastTop', category:'appliance', wall:'east', x:1724, y:2600, z:2100, width:200, depth:200, height:300, locked:false, color:'#c9d6e3', material:'metal', clearance:null, label:'Geyser east top hidden', hidden:true },
  { id:'shaft', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 838×609 609x838 y3908 NW inside (838×609 N-S)' },
  { id:'waterpurifier', category:'cabinet', wall:'west', x:0, y:2600, z:1350, width:350, depth:320, height:400, locked:false, color:'#7EB8E8', material:'laminate', clearance:{ kind:'hiddenInsideUpper', sinkY:1800 }, label:'Water Purifier y2600 west after shaft' },
  { id:'sink', category:'plumbing', wall:'west', x:0, y:1800, z:0, width:762, depth:457, height:900, locked:false, color:'#6a6a6a', material:'stainless_steel', clearance:{ kind:'helpWashZone' }, label:'Kitchen Sink 30in y1800 west with utensil storage above' },
  { id:'sinkUpperDishRack', category:'cabinet', wall:'west', x:0, y:1800, z:1350, width:762, depth:320, height:700, locked:false, color:'#f0e6da', material:'laminate', clearance:{ kind:'overSinkStorage', sinkY:1800 }, label:'Vast Utensil Storage y1800 west above sink' },
  { id:'trashCan', category:'appliance', wall:'west', x:70, y:2000, z:100, width:350, depth:400, height:500, locked:false, color:'#2b2b2b', material:'stainless_steel', clearance:{ kind:'pullOutUnderSink', sinkY:1800 }, label:'Trash pull-out y2000 west below sink' },
  { id:'dishwasher', category:'appliance', wall:'west', x:0, y:1100, z:0, width:600, depth:600, height:880, locked:false, color:'#A8A8A8', material:'stainless_steel', clearance:{ kind:'ground', belowGeyser:true }, label:'Dishwasher y1100 west ground under cabinet below geyser' },
  { id:'geyser', category:'appliance', wall:'west', x:0, y:1100, z:2100, width:400, depth:400, height:550, locked:false, color:'#c9d6e3', material:'metal', clearance:{ kind:'wallMountedTop', aboveDishwasher:true }, label:'Hot Water Geyser y1100 west top above dishwasher' },
  { id:'powerPointWest1', category:'electrical', wall:'west', x:0, y:1650, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Power point west y1650' },
  { id:'powerPointWest2', category:'electrical', wall:'west', x:0, y:800, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Extra power point west y800' },
  { id:'powerPointEast1', category:'electrical', wall:'east', x:1724, y:1650, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Power point east y1650' },
  { id:'powerPointEast2', category:'electrical', wall:'east', x:1724, y:2800, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Extra power point east y2800' }
]

export const CURRENT_APPLIANCES = [
  { id:'microwave', category:'appliance', wall:'east', x:1924, y:0, z:1360, width:600, depth:400, height:350, locked:false, color:'#1a1a1a', material:'black_glass', clearance:{ kind:'openAboveBacksplash' }, label:'Open microwave above backsplash at east south beginning y0', open:true, noCover:true, wallMounted:true },
  { id:'applianceGarage', category:'cabinet', wall:'east', x:1724, y:0, z:900, width:850, depth:600, height:450, locked:false, color:'#C4B5A5', material:'laminate', clearance:{ kind:'counterHeightOpenGarage', pullToward:'gas' }, label:'Open appliance garage at counter height with food processor, pulls toward gas', open:true, noCover:true, pullToward:'gas' },
  { id:'eastBacksplashSlider', category:'storage', wall:'east', x:ROOM_WIDTH-102, y:0, z:900, width:ROOM_LENGTH, depth:102, height:450, locked:true, color:'#d9c6af', material:'laminate', clearance:{ kind:'backsplashSlider', depth:102 }, label:'4in backsplash slider storage along east wall behind counter and stove', backsplashSlider:true, sliderDoor:true },
  { id:'gas', category:'appliance', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:1200, z:900, width:700, depth:600, height:900, locked:false, color:'#2a2a2a', material:'stainless_steel', clearance:null, label:'Gas Stove 700W y1200 east with hidden chimney' },
  { id:'geyserEastTop', category:'appliance', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:2600, z:2100, width:200, depth:200, height:300, locked:false, color:'#c9d6e3', material:'metal', clearance:null, label:'Geyser east top hidden', hidden:true },
  { id:'shaft', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 838x609 y3908 NW inside' },
  { id:'washing', category:'appliance', wall:'west', x:0, y:610, z:0, width:600, depth:600, height:880, locked:false, color:'#E5E0DA', material:'stainless_steel', clearance:{ kind:'openAfterDoor' }, label:'Open washing machine first after door on west y610', open:true, noCover:true, doorOpens:'left' },
  { id:'sink', category:'plumbing', wall:'west', x:0, y:1210, z:0, width:762, depth:457, height:900, locked:false, color:'#6a6a6a', material:'stainless_steel', clearance:{ kind:'betweenWashingAndDishwasher' }, label:'Kitchen Sink 30in y1210 west after washing' },
  { id:'sinkUpperDishRack', category:'cabinet', wall:'west', x:0, y:1210, z:1350, width:762, depth:320, height:700, locked:false, color:'#f0e6da', material:'laminate', clearance:{ kind:'overSinkStorage', sinkY:1210 }, label:'Vast utensil storage y1210 west above sink' },
  { id:'dishwasher', category:'appliance', wall:'west', x:0, y:1972, z:0, width:600, depth:600, height:880, locked:false, color:'#A8A8A8', material:'stainless_steel', clearance:{ kind:'openAfterSink' }, label:'Open dishwasher 600W y1972 west after sink', open:true, noCover:true, ground:true, doorOpens:'down' },
  { id:'westSixInchSlider', category:'storage', wall:'west', x:0, y:2572, z:900, width:552, depth:152, height:450, locked:false, color:'#d9c6af', material:'laminate', clearance:{ kind:'sixInchSlider', depth:152 }, label:'6in slider storage from counter height between sink/dishwasher zone and shaft', backsplashSlider:true, sliderDoor:true },
  { id:'powerPointWest1', category:'electrical', wall:'west', x:0, y:1650, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Power point west y1650' },
  { id:'powerPointWest2', category:'electrical', wall:'west', x:0, y:800, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Extra charging west y800' },
  { id:'powerPointEast1', category:'electrical', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:1650, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Power point east y1650' },
  { id:'powerPointEast2', category:'electrical', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:2800, z:1100, width:20, depth:10, height:100, locked:false, color:'#111', material:'plastic', clearance:null, label:'Extra power point east y2800' }
]

export const CURRENT_VALIDATION_RULES = [
  { id:'east-order', label:'East S->N: microwave and open appliance garage first, then gas', wall:'east', kind:'order', expected:'microwave.y===0 && applianceGarage.y===0 && gas.y===1200', severity:'error', fix:'Keep east beginning open microwave/garage at y0 and gas at y1200' },
  { id:'west-order', label:'West S->N: washing, sink, dishwasher, 6in slider, shaft', wall:'west', kind:'order', expected:`washing.y===610 && sink.y===1210 && dishwasher.y===1972 && westSixInchSlider.y===2572 && shaft.y===${SHAFT_Y}`, severity:'error', fix:'Keep west order washing -> sink -> dishwasher -> 6in slider -> shaft' },
  { id:'door-clear-zone', label:'West door clear zone y0-y610 empty', wall:'west', kind:'clearZone', expected:{ from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO, floorToCeiling:true }, severity:'error', fix:'Keep all west counters and appliances at y610 or north of it' },
  { id:'slider-storage', label:'Backsplash slider storage depths', kind:'dimension', expected:{ eastDepth:102, westDepth:152 }, severity:'warning', fix:'Use 102mm east backsplash slider and 152mm west slider' },
  { id:'walkway-minimum', label:'Walkway minimum', kind:'dimension', expected:{ floor:1124, eye:1004 }, severity:'warning', fix:'Do not widen base runs beyond 600D east and 600D west' },
  { id:'collision', label:'Cabinet/appliance collision', kind:'collision', severity:'error', fix:'Separate overlapping appliances along y; backsplash sliders may overlap the backsplash zone only' },
  { id:'bounds', label:'Item outside room bounds', kind:'bounds', expected:{ width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT }, severity:'error', fix:`Keep all items inside ${ROOM_WIDTH}x${ROOM_LENGTH}x${ROOM_HEIGHT}` }
]


export const VALIDATION_RULES = [
  { id:'east-order', label:'East N->S: washing far north, appliance garage, gas + chimney, south tall SE', wall:'east', kind:'order', expected:'washing.y===3251 && gas.y===1500 && garage_SE.y===0', severity:'error', fix:'Keep east north->south washing (3251) -> appliance garage (2500) -> gas (1500) -> south tall (0)' },
  { id:'west-order', label:'West N->S: shaft 838×609 inside, purifier, sink+rack, dishwasher ground, geyser top', wall:'west', kind:'order', expected:'shaft.y===3908 && waterpurifier.y===2600 && sink.y===1800 && dishwasher.y===1100', severity:'error', fix:'Keep west north->south shaft (3908) -> purifier (2600) -> sink (1800) -> dishwasher (1100) + geyser above' },
  { id:'purifier-near-sink', label:'Purifier hidden inside upper cabinet north of sink', wall:'east', kind:'proximity', expected:{ sinkY:1800, dishRackY:1800, purifierY:2600 }, severity:'warning', fix:'Purifier at y2600 west after shaft; sink y1800 west with rack above y1800' },
  { id:'door-clear-zone', label:'West door clear zone y300-y910 (2ft) empty', wall:'west', kind:'clearZone', expected:{ from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO, floorToCeiling:true }, severity:'error', fix:'Move any west object overlapping y300-y910 (2ft) beyond y910' },
  { id:'walkway-minimum', label:'Walkway minimum', kind:'dimension', expected:{ floor:1324, eye:1004 }, severity:'warning', fix:'Do not widen cabinet depths beyond 600D east / 400D west' },
  { id:'collision', label:'Cabinet/appliance collision', kind:'collision', severity:'error', fix:'Separate overlapping items along y, except objects intentionally inside tall cabinets' },
  { id:'bounds', label:'Item outside room bounds', kind:'bounds', expected:{ width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT }, severity:'error', fix:'Keep all items inside 2324x4746x2700' }
]
export const MATERIALS = {
  palette:{
    cabinetBody:'#c8b39d',
    cabinetUpperLower:'#dac8b7',
    cabinetUpperTop:'#bfa891',
    ledWarm:'#ffc46d',
    counterTop:'#c8b39d',
    wall:'#f6efe6',
    floor:'#ded6cc',
    backsplash:'#faf6f1'
  },
  assignments:{
    applianceGarage:'laminate',
    gas:'stainless_steel',
    dishwasher:'stainless_steel',
    washing:'stainless_steel',
    waterpurifier:'laminate',
    sink:'stainless_steel',
    shaft:'concrete'
  },
  finishes:{
    handle:'brushed_nickel',
    shutter:'matte_laminate',
    countertop:'granite',
    backsplash:'ceramic_tile',
    floor:'vitrified_tile',
    wallPaint:'off_white'
  }
}

export const EXPORTS = {
  plan:{ svg:'kitchen-2d-plan-coohom-background.svg', png:'kitchen-2d-plan-coohom-background.png', dxf:'kitchen-2d-plan-coohom-background.dxf' },
  json:'Galley_2324x4746_Rule9_Current.json',
  coohomGuide:'coohom-native-rebuild-guide.md',
  threeScreenshot:'kitchen-3d-render.png'
}

export const LAYOUT_MODEL = {
  version:'1.0.0-phase1',
  rule:'Current configuration: West S->N washing machine, sink, dishwasher, 6in slider, shaft; East S->N open microwave, open appliance garage with food processor, gas cooktop, 4in backsplash slider',
  ruleId:'Rule9',
  unit:'mm',
  room:ROOM,
  openings:OPENINGS,
  walls:WALLS,
  cabinetRuns:CABINET_RUNS,
  appliances:CURRENT_APPLIANCES,
  validationRules:CURRENT_VALIDATION_RULES,
  materials:MATERIALS,
  exports:EXPORTS,
  metadata:{
    created:'Rule #9 locked layout',
    roomWidth:ROOM_WIDTH,
    roomLength:ROOM_LENGTH,
    roomHeight:ROOM_HEIGHT,
    westClearZone:{ from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO },
    northClearZone:NORTH_CLEAR,
    windowBelowDepth:WINDOW_BELOW_DEPTH,
    shaftPosition:{ x:SHAFT_X, y:SHAFT_Y, w:SHAFT_W, l:SHAFT_L },
    sliderStorage:{ eastDepth:102, westDepth:152 },
    note:'West wall: washing y610, sink y1210, dishwasher y1972, 6in slider y2572, shaft y3908. East wall: open microwave y0, open appliance garage y0 with food processor, gas y1200, 4in backsplash slider.'
  }
}

// Aliases for compatibility / convenience
export const LAYOUT = LAYOUT_MODEL
export const layoutModel = LAYOUT_MODEL

// Phase 4: cabinet module definitions
export const MODULE_WIDTHS = [300,450,600,750,900]
export const MODULE_DEFS = {
  300:{ id:'mod-300', width:300, type:'base', shutter:'single', drawers:0, handle:'none' },
  450:{ id:'mod-450', width:450, type:'base', shutter:'single', drawers:1, handle:'none' },
  600:{ id:'mod-600', width:600, type:'base', shutter:'double', drawers:2, handle:'none' },
  750:{ id:'mod-750', width:750, type:'base', shutter:'double', drawers:2, handle:'none' },
  900:{ id:'mod-900', width:900, type:'base', shutter:'double', drawers:3, handle:'none' },
  filler:{ id:'filler', type:'filler', shutter:'none', drawers:0, handle:'none' },
  endPanel:{ id:'end-panel', width:18, type:'endPanel', shutter:'none', drawers:0, handle:'none' }
}
export const PLINTH_HEIGHT = 100
export const COUNTER_THICKNESS = 38
export const BACKSPLASH_HEIGHT = 600
export function autoFillModules(totalLen){
  const sizes=[900,750,600,450,300]
  let remaining=totalLen
  const mods=[]
  let idx=0
  while(remaining>0){
    let pick=null
    for(const s of sizes){ if(s<=remaining){ pick=s; break } }
    if(pick===null){
      mods.push({ id:`mod-filler-${idx}`, width:remaining, type:'filler', shutter:'none', drawers:0, handle:'none', label:`Filler ${remaining} mm` })
      remaining=0
    } else {
      const def=MODULE_DEFS[pick]
      mods.push({ id:`${def.id}-${idx}`, width:pick, type:'base', shutter:def.shutter, drawers:def.drawers, handle:def.handle, label:`${pick} mm base ${def.shutter}` })
      remaining-=pick
    }
    idx++
  }
  return mods
}
