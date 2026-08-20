export const ROOM_WIDTH = 2324
export const ROOM_LENGTH = 4746
export const ROOM_HEIGHT = 2700
export const WEST_CLEAR_FROM = 0
export const WEST_CLEAR_TO = 1220
export const NORTH_CLEAR = 0
export const WINDOW_BELOW_DEPTH = 300
export const SHAFT_X = 0
export const SHAFT_Y = 4146
export const SHAFT_W = 610
export const SHAFT_L = 838
export const EAST_BASE_DEPTH = 600
export const EAST_LOWER_UPPER_DEPTH = 320
export const EAST_TOP_UPPER_DEPTH = 550
export const WEST_COUNTER_DEPTH = 400
export const WEST_LOWER_UPPER_DEPTH = 320
export const WEST_TOP_UPPER_DEPTH = 450

export const KITCHEN = { width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT, door:{w:1100,x:612}, window:{w:1100,h:1800,sill:900,x:612, belowDepth:WINDOW_BELOW_DEPTH}, shaft:{w:SHAFT_W,l:SHAFT_L,x:SHAFT_X,y:SHAFT_Y}, northClear:NORTH_CLEAR, windowBelow:{x:612,w:1100,depth:WINDOW_BELOW_DEPTH}, westGap:{from:WEST_CLEAR_FROM,to:WEST_CLEAR_TO,w:WEST_CLEAR_TO-WEST_CLEAR_FROM}, walkway:{floor:1324,eye:1004} }

// Compatibility exports - preserved verbatim values for existing imports
// East appliance garage near South door stores microwave + food processor as countertop clutter (counter-mounted)
export const EAST_INIT = [
  {id:'applianceGarage', label:'Appliance Garage 850W (Microwave + Food Processor) counter-mounted', w:850, d:350, h:550, y:300, x:1974, color:'#8c7a65', z:900},
  {id:'gas', label:'Gas Middle 700W shifted north hidden chimney small', w:700, d:600, h:900, y:2300, x:1624, color:'#2a2a2a'},
  {id:'dishwasher', label:'Dishwasher 600W adjacent to washing y3546', w:600, d:600, h:880, y:3546, x:1724, color:'#A8A8A8'},
  {id:'washing', label:'Washing LAST touching North y4146', w:600, d:600, h:880, y:4146, x:1724, color:'#E5E0DA', last:true}
]
export const WEST_INIT = [
  {id:'sink', label:'Sink 600W real kitchen sink y3146', w:600, d:400, h:900, y:3146, x:0, color:'#4a4a4a', z:0},
  {id:'waterpurifier', label:'Water Purifier Cabinet 400W x 350D x 550H near shaft', w:400, d:350, h:550, y:3746, x:0, color:'#7EB8E8', z:900},
  {id:'shaft', label:'Shaft 61x83.8 LAST NW y4146', w:610, d:838, h:2700, y:4146, x:0, color:'#999', fixed:true, last:true}
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
  window:{ id:'opening-window-north', category:'opening', wall:'north', x:612, y:ROOM_LENGTH-45, z:900, width:1100, depth:24, height:1800, locked:false, color:'#7eb8e8', material:'glass', clearance:null, label:'North Window', sill:900 },
  shaft:{ id:'opening-shaft-nw', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 61x83.8 NW' }
}

export const WALLS = {
  east:{ id:'wall-east', label:'East', axis:'y', orientation:'North (N) left to South (S) right', side:'right', length:ROOM_LENGTH, height:ROOM_HEIGHT, x:ROOM_WIDTH, y:0 },
  west:{ id:'wall-west', label:'West', axis:'y', orientation:'South (S) left to North (N) right', side:'left', length:ROOM_LENGTH, height:ROOM_HEIGHT, x:0, y:0 },
  north:{ id:'wall-north', label:'North', axis:'x', orientation:'West left to East right', side:'top', length:ROOM_WIDTH, height:ROOM_HEIGHT, x:0, y:ROOM_LENGTH },
  south:{ id:'wall-south', label:'South', axis:'x', orientation:'East left to West right', side:'bottom', length:ROOM_WIDTH, height:ROOM_HEIGHT, x:0, y:0 }
}

export const CABINET_RUNS = [
  { id:'east-base-run', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:0, z:0, width:4746, depth:EAST_BASE_DEPTH, height:900, locked:false, color:'#c8b39d', material:'laminate', clearance:null, label:'East 600D base run with continuous counter to north wall' },
  { id:'east-lower-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_LOWER_UPPER_DEPTH, y:0, z:1350, width:4746, depth:EAST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:null, label:'East 320D lower upper cabinets to north wall' },
  { id:'east-top-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_TOP_UPPER_DEPTH, y:0, z:1900, width:4746, depth:EAST_TOP_UPPER_DEPTH, height:800, locked:false, color:'#bfa891', material:'laminate', clearance:null, label:'East 550D top upper cabinets to north wall' },
  { id:'west-counter-run', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:0, width:4746-WEST_CLEAR_TO, depth:WEST_COUNTER_DEPTH, height:900, locked:false, color:'#c8b39d', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 400D counter after door clear zone' },
  { id:'west-lower-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1350, width:4746-WEST_CLEAR_TO, depth:WEST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 320D lower upper after door clear zone' },
  { id:'west-top-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1900, width:4746-WEST_CLEAR_TO, depth:WEST_TOP_UPPER_DEPTH, height:800, locked:false, color:'#bfa891', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 450D top upper after door clear zone' },
  { id:'west-door-clear-zone', category:'clearZone', wall:'west', x:0, y:WEST_CLEAR_FROM, z:0, width:WEST_CLEAR_TO-WEST_CLEAR_FROM, depth:WEST_COUNTER_DEPTH, height:ROOM_HEIGHT, locked:true, color:'#fffaf3', material:'void', clearance:{ kind:'fullHeight', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West full-height door clear zone y0-y1220 no counter no upper no LED' },
  { id:'north-window-below-zone', category:'referenceZone', wall:'north', x:612, y:ROOM_LENGTH-WINDOW_BELOW_DEPTH, z:0, width:1100, depth:WINDOW_BELOW_DEPTH, height:900, locked:true, color:'#eaf6fd', material:'void', clearance:{ kind:'windowBelow', depth:WINDOW_BELOW_DEPTH }, label:'Window-only below-sill reference zone' }
]

export const APPLIANCES = [
  { id:'applianceGarage', category:'cabinet', wall:'east', x:1974, y:300, z:900, width:850, depth:350, height:550, locked:false, color:'#8c7a65', material:'laminate', clearance:{ kind:'counterMounted', base:900 }, label:'Appliance Garage 850W (Microwave + Food Processor) counter-mounted South near door', subcomponents:[{id:'microwave-stored', label:'Microwave inside garage'}, {id:'foodprocessor-stored', label:'Food processor inside garage'}] },
  { id:'gas', category:'appliance', wall:'east', x:1624, y:2300, z:900, width:700, depth:600, height:900, locked:false, color:'#2a2a2a', material:'stainless_steel', clearance:null, label:'Gas Middle 700W shifted north hidden chimney small', subcomponents:[{id:'gas-cooktop', label:'cooktop slab'}, {id:'gas-burner-rings', label:'3 burner rings'}, {id:'hidden-chimney-insert', label:'hidden chimney insert inside upper cabinet'}, {id:'hidden-chimney-vent-slot', label:'slim under-cabinet vent slot'}] },
  { id:'dishwasher', category:'appliance', wall:'east', x:1724, y:3546, z:0, width:600, depth:600, height:880, locked:false, color:'#A8A8A8', material:'stainless_steel', clearance:{ kind:'adjacentToWashing', washingY:4146, gap:0, doorSwing:'down' }, label:'Dishwasher 600W adjacent to washing y3546, door opens down' },
  { id:'washing', category:'appliance', wall:'east', x:1724, y:4146, z:0, width:600, depth:600, height:880, locked:false, color:'#E5E0DA', material:'stainless_steel', clearance:{ kind:'touchingNorth', distanceToNorth:0 }, label:'Washing LAST touching North y4146', last:true },
  { id:'sink', category:'plumbing', wall:'west', x:0, y:3146, z:0, width:600, depth:400, height:900, locked:false, color:'#4a4a4a', material:'stainless_steel', clearance:{ kind:'purifierCabinetGap', distanceToShaft:SHAFT_Y-3146-600-400, purifierY:3746 }, label:'Sink 600W real kitchen sink y3146 (ends at y3746 leaves gap for purifier)' },
  { id:'waterpurifier', category:'cabinet', wall:'west', x:0, y:3746, z:900, width:400, depth:350, height:550, locked:false, color:'#7EB8E8', material:'laminate', clearance:{ kind:'betweenSinkAndShaft', sinkEnd:3746, shaftY:SHAFT_Y }, label:'Water Purifier Cabinet 400W x 350D x 550H y3746 closest to shaft between sink and shaft' },
  { id:'shaft', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 61x83.8 LAST NW y4146', fixed:true, last:true }
]

export const VALIDATION_RULES = [
  { id:'east-order', label:'East order: gas before dishwasher before washing, dishwasher adjacent to washing (garage allowed near South)', wall:'east', kind:'order', expected:'gas.y < dishwasher.y && dishwasher.y + dishwasher.w === washing.y && washing.last', severity:'error', fix:'Move gas south of dishwasher and keep dishwasher directly adjacent to washing at the north end; garage may be before gas' },
  { id:'west-order', label:'West order: sink before purifier cabinet before shaft', wall:'west', kind:'order', expected:'sink (y3146,600W) < waterpurifier (y3746,400W) < shaft (y4146) && shaft.last', severity:'error', fix:'Restore west order sink -> purifier cabinet -> shaft with sink at y3146 purifier at y3746' },
  { id:'purifier-near-sink', label:'Purifier cabinet between sink and shaft', wall:'west', kind:'proximity', expected:{ sinkEnd:3746, purifierY:3746, shaftY:4146 }, severity:'warning', fix:'Keep waterpurifier y3746 between sink (ends 3746) and shaft 4146' },
  { id:'door-clear-zone', label:'West door clear zone y0-y1220 empty', wall:'west', kind:'clearZone', expected:{ from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO, floorToCeiling:true }, severity:'error', fix:'Move any west object overlapping y0-y1220 beyond y1220' },
  { id:'walkway-minimum', label:'Walkway minimum', kind:'dimension', expected:{ floor:1324, eye:1004 }, severity:'warning', fix:'Do not widen cabinet depths beyond 600D east / 400D west' },
  { id:'collision', label:'Cabinet/appliance collision', kind:'collision', severity:'error', fix:'Separate overlapping items along y' },
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
  rule:'Rule9 updated: Garage (MW+FP) south east, Gas shifted north to y2300, DW y3546 adjacent to WM LAST y4146; West Sink y3146 to Purifier Cabinet y3746 to Shaft LAST',
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
