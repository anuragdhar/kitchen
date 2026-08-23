export const ROOM_WIDTH = 2324
export const ROOM_LENGTH = 3962 // 13ft
export const ROOM_HEIGHT = 2700
export const WEST_CLEAR_FROM = 300
export const WEST_CLEAR_TO = 910 // 2ft (reduced from 1220)
export const NORTH_CLEAR = 0
export const WINDOW_BELOW_DEPTH = 300
export const SHAFT_X = 0
export const SHAFT_Y = 3124 // 13ft 3962-838 attached north, inside kitchen
export const SHAFT_W = 609 // keep original depth (east-west)
export const SHAFT_L = 838 // 838×609 N-S (north to south)
export const EAST_BASE_DEPTH = 600
export const EAST_LOWER_UPPER_DEPTH = 320
export const EAST_TOP_UPPER_DEPTH = 550
export const WEST_COUNTER_DEPTH = 610 // 24in (interpreting 7ft as length, depth kept 24in — see note)
export const WEST_LOWER_UPPER_DEPTH = 320
export const WEST_TOP_UPPER_DEPTH = 450

export const KITCHEN = { width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT, door:{w:1100,x:612}, window:{w:1100,h:1800,sill:900,x:612, belowDepth:WINDOW_BELOW_DEPTH, transomHeight:610, sections:2, topFixed:true, bottomOperation:'sliding', bottomFixedCount:0, bottomSlidingCount:2}, shaft:{w:SHAFT_W,l:SHAFT_L,x:SHAFT_X,y:SHAFT_Y}, northClear:NORTH_CLEAR, windowBelow:{x:612,w:1100,depth:WINDOW_BELOW_DEPTH}, westGap:{from:WEST_CLEAR_FROM,to:WEST_CLEAR_TO,w:WEST_CLEAR_TO-WEST_CLEAR_FROM}, walkway:{floor:1124,eye:1004} }

// New configuration: east wet wall and west cooking wall.
// East North->South: tall cabinet + washing, hidden water purifier, sink with dish storage above, dishwasher.
export const EAST_INIT = [
  {id:'garage_NE', label:'East Tall NE 28in (711x600x2700) y3251 north - washing inside far north under cabinet', w:711, d:600, h:2700, y:3251, x:1724, color:'#C4B5A5', fullHeight:true, last:true, matchesShaft:true, visualSingularity:true, subcomponents:[{id:'washing-inside-tall-NE', label:'Washing far north under cabinet inside tall'}]},
  {id:'washing', label:'Washing 600W far north under cabinet y3251 east', w:600, d:600, h:880, y:3251, x:1724, color:'#E5E0DA', hidden:true, behindShutter:true, insideTall:true, farNorth:true},
  {id:'gas', label:'Gas Stove 700W y1500 east with kitchen chimney above', w:700, d:600, h:900, y:1500, x:1724, color:'#2a2a2a', subcomponents:[{id:'gas-cooktop-east', label:'cooktop slab east'}, {id:'kitchen-chimney-east', label:'kitchen chimney above gas'}]},
  {id:'garage_SE', label:'East Tall SE 24in (610x600x2700) y0 south - symmetrical bottom to top', w:610, d:600, h:2700, y:0, x:1724, color:'#C4B5A5', fullHeight:true, first:true, matchesShaft:false, visualSingularity:true, subcomponents:[{id:'washing-inside-tall-SE', label:'Washing inside lower bay SE'}, {id:'microwave-inside-tall-SE', label:'Microwave above washing inside tall SE'}]},
  {id:'geyserEastTop', label:'Hot Water Geyser east top - kept for reference (now west)', w:200, d:200, h:300, y:2600, x:1724, color:'#c9d6e3', z:2100, wallMounted:true, topMounted:true, hidden:true}
]

export const WEST_INIT = [
  {id:'shaft', label:'Shaft 838×609 609x838 y3124 NW inside kitchen (838×609 N-S)', w:609, d:838, h:2700, y:3124, x:0, color:'#999', fixed:true, last:true, inside:true},
  {id:'waterpurifier', label:'Water Purifier 350W y2600 west after shaft', w:350, d:320, h:400, y:2600, x:0, color:'#7EB8E8', z:1350, mountedAbove:true, hidden:true},
  {id:'sink', label:'Kitchen Sink 30 inch (762W x 457D) y1800 west with vast utensil storage above', w:762, d:457, h:900, y:1800, x:0, color:'#6a6a6a', z:0, sinkType:'single-bowl-drainboard-304-30x18'},
  {id:'sinkUpperDishRack', label:'Vast Utensil Storage 762W y1800 z1350 above west sink', w:762, d:320, h:700, y:1800, x:0, color:'#f0e6da', z:1350},
  {id:'trashCan', label:'Trash pull-out Saints frame below sink y2000 west', w:350, d:400, h:500, y:2000, x:70, color:'#2b2b2b', pullOut:true, underSink:true, saintsFrame:true, z:100},
  {id:'dishwasher', label:'Dishwasher 600W y1100 west ground under cabinet after sink - below geyser', w:600, d:600, h:880, y:1100, x:0, color:'#A8A8A8', hidden:true, behindShutter:true, ground:true},
  {id:'geyser', label:'Hot Water Geyser 400x400x550 on west top y1100 z2100 above dishwasher', w:400, d:400, h:550, y:1100, x:0, color:'#c9d6e3', z:2100, wallMounted:true, topMounted:true, aboveDishwasher:true},
  {id:'westGarage', label:'Appliance Garage west removed - now east', w:0, d:0, h:0, y:0, x:0, color:'#C4B5A5', hidden:true},
  {id:'gasWestRemoved', label:'Gas removed from west - now east', w:0, d:0, h:0, y:0, x:0, hidden:true},
  {id:'powerPointWest1', label:'Power point west near gas (now east gas, keep west)', w:20, d:10, h:100, y:1650, x:0, color:'#111', z:1100, powerPoint:true, wallMounted:true},
  {id:'powerPointWest2', label:'Extra power point west for charging y800', w:20, d:10, h:100, y:800, x:0, color:'#111', z:1100, powerPoint:true, extra:true, wallMounted:true},
  {id:'powerPointEast1', label:'Power point east near gas', w:20, d:10, h:100, y:1650, x:1724, color:'#111', z:1100, powerPoint:true, wallMounted:true},
  {id:'powerPointEast2', label:'Extra power point east for charging y2800', w:20, d:10, h:100, y:2800, x:1724, color:'#111', z:1100, powerPoint:true, extra:true, wallMounted:true}
]


// Rich shared layout model - primary for FreeCAD/Blender/React consumption
export const ROOM = {
  id:'room-main',
  width:ROOM_WIDTH,
  length:ROOM_LENGTH,
  height:ROOM_HEIGHT,
  unit:'mm'
}

export const OPENINGS = {
  door:{ id:'opening-door-south', category:'opening', wall:'south', x:612, y:0, z:0, width:1100, depth:35, height:2100, locked:false, color:'#fffaf3', material:'void', clearance:null, label:'South Door' },
  window:{ id:'opening-window-north', category:'opening', wall:'north', x:612, y:ROOM_LENGTH-45, z:900, width:1100, depth:24, height:1800, locked:false, color:'#7eb8e8', material:'glass', clearance:null, label:'North Window â€” 2 Bays Ã— 610 Fixed Top / 1190 Sliding Bottom (centre mullion) â€” LEFT-TOP 12\" Metal Exhaust', sill:900, sections:2, transomHeight:610, top:{ operation:'fixed', lights:2, height:610, leftTop:{ type:'exhaustFan', size:300, material:'metal', model:'12-inch heavy-duty', status:'installed' }, rightTop:{ type:'fixedGlass' } }, bottom:{ operation:'sliding', lights:2, height:1190, slidingCount:2, fixedCount:0, slidingPosition:'both' }, notes:{ shaftAlternative:'Hole in shaft wall (west shaft 61Ã—83.8 at y4146) can also host exhaust â€” noted as alternative to window mount', exhaustChoice:'Metal 12-inch recommended for kitchen heat/grease â€” plastic not suggested' } },
  shaft:{ id:'opening-shaft-nw', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 60.9x83.8 NW' }
}

export const WALLS = {
  east:{ id:'wall-east', label:'East', axis:'y', orientation:'North (N) left to South (S) right', side:'right', length:ROOM_LENGTH, height:ROOM_HEIGHT, x:ROOM_WIDTH, y:0 },
  west:{ id:'wall-west', label:'West', axis:'y', orientation:'South (S) left to North (N) right', side:'left', length:ROOM_LENGTH, height:ROOM_HEIGHT, x:0, y:0 },
  north:{ id:'wall-north', label:'North', axis:'x', orientation:'West left to East right', side:'top', length:ROOM_WIDTH, height:ROOM_HEIGHT, x:0, y:ROOM_LENGTH },
  south:{ id:'wall-south', label:'South', axis:'x', orientation:'East left to West right', side:'bottom', length:ROOM_WIDTH, height:ROOM_HEIGHT, x:0, y:0 }
}

export const CABINET_RUNS = [
  { id:'east-base-run', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:0, z:0, width:3962, depth:EAST_BASE_DEPTH, height:900, locked:false, color:'#c8b39d', material:'laminate', clearance:null, label:'East 600D base run with continuous counter to north wall' },
  { id:'east-lower-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_LOWER_UPPER_DEPTH, y:0, z:1350, width:3962, depth:EAST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:null, label:'East 320D lower upper cabinets to north wall' },
  { id:'east-top-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_TOP_UPPER_DEPTH, y:0, z:1850, width:3962, depth:EAST_TOP_UPPER_DEPTH, height:850, locked:false, color:'#bfa891', material:'laminate', clearance:null, label:'East 550D top upper cabinets to north wall no gap' },
  { id:'west-counter-run', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:0, width:2134, depth:WEST_COUNTER_DEPTH, height:900, // 7ft length as requested
    locked:false, color:'#c8b39d', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 600D counter after door clear zone - equal to east' },
  { id:'west-lower-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1350, width:3962-WEST_CLEAR_TO, depth:WEST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 320D lower upper after door clear zone' },
  { id:'west-top-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1850, width:3962-WEST_CLEAR_TO, depth:WEST_TOP_UPPER_DEPTH, height:850, locked:false, color:'#bfa891', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 450D top upper after door clear zone no gap' },
  { id:'west-door-clear-zone', category:'clearZone', wall:'west', x:0, y:WEST_CLEAR_FROM, z:0, width:WEST_CLEAR_TO-WEST_CLEAR_FROM, depth:WEST_COUNTER_DEPTH, height:ROOM_HEIGHT, locked:true, color:'#fffaf3', material:'void', clearance:{ kind:'fullHeight', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West door clear zone y300-y910 (2ft) no counter no upper no LED - west counter now 600D equal east' },
  { id:'north-window-below-zone', category:'referenceZone', wall:'north', x:612, y:ROOM_LENGTH-WINDOW_BELOW_DEPTH, z:0, width:1100, depth:WINDOW_BELOW_DEPTH, height:900, locked:true, color:'#eaf6fd', material:'void', clearance:{ kind:'windowBelow', depth:WINDOW_BELOW_DEPTH }, label:'Window-only below-sill reference zone' }
]

export const APPLIANCES = [
  { id:'garage_NE', category:'cabinet', wall:'east', x:1724, y:3251, z:0, width:711, depth:600, height:2700, locked:true, color:'#C4B5A5', material:'laminate', clearance:{ kind:'tallGarageFullHeight', matchesShaft:true }, label:'East Tall NE 28in y3251 north - washing far north', last:true, fullHeight:true },
  { id:'garage_SE', category:'cabinet', wall:'east', x:1724, y:0, z:0, width:610, depth:600, height:2700, locked:true, color:'#C4B5A5', material:'laminate', clearance:{ kind:'tallGarageFullHeight' }, label:'East Tall SE 24in y0 south symmetrical', first:true, fullHeight:true },
  { id:'washing', category:'appliance', wall:'east', x:1724, y:3251, z:0, width:600, depth:600, height:880, locked:false, color:'#E5E0DA', material:'stainless_steel', clearance:{ kind:'insideTallCabinet', garageY:3251 }, label:'Washing far north y3251 east', hidden:true, behindShutter:true, insideTall:true },
  { id:'gas', category:'appliance', wall:'east', x:1724, y:1500, z:900, width:700, depth:600, height:900, locked:false, color:'#2a2a2a', material:'stainless_steel', clearance:null, label:'Gas Stove 700W y1500 east with chimney' },
  { id:'geyserEastTop', category:'appliance', wall:'east', x:1724, y:2600, z:2100, width:200, depth:200, height:300, locked:false, color:'#c9d6e3', material:'metal', clearance:null, label:'Geyser east top hidden', hidden:true },
  { id:'shaft', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 838×609 609x838 y3124 NW inside (838×609 N-S)' },
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


export const VALIDATION_RULES = [
  { id:'east-order', label:'East N->S: washing far north, appliance garage, gas + chimney, south tall SE', wall:'east', kind:'order', expected:'washing.y===3251 && gas.y===1500 && garage_SE.y===0', severity:'error', fix:'Keep east north->south washing (3251) -> appliance garage (2500) -> gas (1500) -> south tall (0)' },
  { id:'west-order', label:'West N->S: shaft 838×609 inside, purifier, sink+rack, dishwasher ground, geyser top', wall:'west', kind:'order', expected:'shaft.y===3124 && waterpurifier.y===2600 && sink.y===1800 && dishwasher.y===1100', severity:'error', fix:'Keep west north->south shaft (3124) -> purifier (2600) -> sink (1800) -> dishwasher (1100) + geyser above' },
  { id:'purifier-near-sink', label:'Purifier hidden inside upper cabinet north of sink', wall:'east', kind:'proximity', expected:{ sinkY:1800, dishRackY:1800, purifierY:2600 }, severity:'warning', fix:'Purifier at y2600 west after shaft; sink y1800 west with rack above y1800' },
  { id:'door-clear-zone', label:'West door clear zone y300-y910 (2ft) empty', wall:'west', kind:'clearZone', expected:{ from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO, floorToCeiling:true }, severity:'error', fix:'Move any west object overlapping y300-y910 (2ft) beyond y910' },
  { id:'walkway-minimum', label:'Walkway minimum', kind:'dimension', expected:{ floor:1324, eye:1004 }, severity:'warning', fix:'Do not widen cabinet depths beyond 600D east / 400D west' },
  { id:'collision', label:'Cabinet/appliance collision', kind:'collision', severity:'error', fix:'Separate overlapping items along y, except objects intentionally inside tall cabinets' },
  { id:'bounds', label:'Item outside room bounds', kind:'bounds', expected:{ width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT }, severity:'error', fix:'Keep all items inside 2324x3962x2700' }
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
  rule:'New configuration: East wet wall N->S tall cabinet/washing, hidden purifier, sink, dishwasher; West N->S shaft, food-processor garage, gap, gas stove with chimney',
  ruleId:'Rule9',
  unit:'mm',
  room:ROOM,
  openings:OPENINGS,
  walls:WALLS,
  cabinetRuns:CABINET_RUNS,
  appliances:APPLIANCES,
  validationRules:VALIDATION_RULES,
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
    shaftPosition:{ x:SHAFT_X, y:SHAFT_Y, w:SHAFT_W, l:SHAFT_L }
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





