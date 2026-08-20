export const ROOM_WIDTH = 2324
export const ROOM_LENGTH = 4746
export const ROOM_HEIGHT = 2700
export const WEST_CLEAR_FROM = 0
export const WEST_CLEAR_TO = 1220
export const NORTH_CLEAR = 300
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

export const KITCHEN = { width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT, door:{w:1100,x:612}, window:{w:1100,h:1800,sill:900,x:612}, shaft:{w:SHAFT_W,l:SHAFT_L,x:SHAFT_X,y:SHAFT_Y}, northClear:NORTH_CLEAR, westGap:{from:WEST_CLEAR_FROM,to:WEST_CLEAR_TO,w:WEST_CLEAR_TO-WEST_CLEAR_FROM}, walkway:{floor:1324,eye:1004} }

// Compatibility exports - preserved verbatim values for existing imports
export const EAST_INIT = [
  {id:'spice', label:'Spice 150 open', w:150, d:500, h:200, y:1850, x:1724, color:'#D9C7B5'},
  {id:'gas', label:'Gas Middle 700W hidden chimney small', w:700, d:600, h:900, y:2000, x:1624, color:'#2a2a2a'},
  {id:'dishwasher', label:'Dishwasher 600W north of Gas', w:600, d:600, h:880, y:2850, x:1724, color:'#A8A8A8'},
  {id:'washing', label:'Washing LAST near North y3800', w:600, d:600, h:880, y:3800, x:1724, color:'#E5E0DA', last:true}
]
export const WEST_INIT = [
  {id:'microwave', label:'Microwave 500W', w:500, d:400, h:350, y:1300, x:0, color:'#1a1a1a'},
  {id:'foodprocessor', label:'Food Processor 500W', w:500, d:400, h:300, y:1900, x:0, color:'#C0C0C0'},
  {id:'waterpurifier', label:'Water Purifier near Sink hidden under 320D LED touching shaft', w:300, d:300, h:400, y:3350, x:0, color:'#7EB8E8'},
  {id:'sink', label:'Sink 600W almost touching shaft', w:600, d:400, h:900, y:3550, x:0, color:'#222'},
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
  { id:'east-base-run', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_BASE_DEPTH, y:0, z:0, width:4746-NORTH_CLEAR, depth:EAST_BASE_DEPTH, height:900, locked:false, color:'#c8b39d', material:'laminate', clearance:null, label:'East 600D base run with continuous counter' },
  { id:'east-lower-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_LOWER_UPPER_DEPTH, y:0, z:1350, width:4746-NORTH_CLEAR, depth:EAST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:null, label:'East 320D lower upper cabinets' },
  { id:'east-top-upper', category:'cabinetRun', wall:'east', x:ROOM_WIDTH-EAST_TOP_UPPER_DEPTH, y:0, z:1900, width:4746-NORTH_CLEAR, depth:EAST_TOP_UPPER_DEPTH, height:800, locked:false, color:'#bfa891', material:'laminate', clearance:null, label:'East 550D top upper cabinets' },
  { id:'west-counter-run', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:0, width:(4746-NORTH_CLEAR)-WEST_CLEAR_TO, depth:WEST_COUNTER_DEPTH, height:900, locked:false, color:'#c8b39d', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 400D counter after door clear zone' },
  { id:'west-lower-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1350, width:(4746-NORTH_CLEAR)-WEST_CLEAR_TO, depth:WEST_LOWER_UPPER_DEPTH, height:500, locked:false, color:'#dac8b7', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 320D lower upper after door clear zone' },
  { id:'west-top-upper', category:'cabinetRun', wall:'west', x:0, y:WEST_CLEAR_TO, z:1900, width:(4746-NORTH_CLEAR)-WEST_CLEAR_TO, depth:WEST_TOP_UPPER_DEPTH, height:800, locked:false, color:'#bfa891', material:'laminate', clearance:{ kind:'doorClearZone', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West 450D top upper after door clear zone' },
  { id:'west-door-clear-zone', category:'clearZone', wall:'west', x:0, y:WEST_CLEAR_FROM, z:0, width:WEST_CLEAR_TO-WEST_CLEAR_FROM, depth:WEST_COUNTER_DEPTH, height:ROOM_HEIGHT, locked:true, color:'#fffaf3', material:'void', clearance:{ kind:'fullHeight', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West full-height door clear zone y0-y1220 no counter no upper no LED' },
  { id:'north-clear-zone', category:'clearZone', wall:'north', x:0, y:ROOM_LENGTH-NORTH_CLEAR, z:0, width:ROOM_WIDTH, depth:NORTH_CLEAR, height:900, locked:true, color:'#eaf6fd', material:'void', clearance:{ kind:'northClear', depth:NORTH_CLEAR }, label:'North 300mm clear zone no counter' }
]

export const APPLIANCES = [
  { id:'spice', category:'storage', wall:'east', x:1724, y:1850, z:900, width:150, depth:500, height:200, locked:false, color:'#D9C7B5', material:'melamine', clearance:null, label:'Spice 150 open' },
  { id:'gas', category:'appliance', wall:'east', x:1624, y:2000, z:900, width:700, depth:600, height:900, locked:false, color:'#2a2a2a', material:'stainless_steel', clearance:null, label:'Gas Middle 700W hidden chimney small', subcomponents:[{id:'gas-cooktop', label:'cooktop slab'}, {id:'gas-burner-rings', label:'4 burner rings'}, {id:'gas-hood', label:'compact chimney hood'}] },
  { id:'dishwasher', category:'appliance', wall:'east', x:1724, y:2850, z:0, width:600, depth:600, height:880, locked:false, color:'#A8A8A8', material:'stainless_steel', clearance:null, label:'Dishwasher 600W north of Gas' },
  { id:'washing', category:'appliance', wall:'east', x:1724, y:3800, z:0, width:600, depth:600, height:880, locked:false, color:'#E5E0DA', material:'stainless_steel', clearance:{ kind:'northClear', distanceToNorth:ROOM_LENGTH-3800-600 }, label:'Washing LAST near North y3800', last:true },
  { id:'microwave', category:'appliance', wall:'west', x:0, y:1300, z:900, width:500, depth:400, height:350, locked:false, color:'#1a1a1a', material:'black_glass', clearance:{ kind:'doorClearZone', offsetFromClear:1300-WEST_CLEAR_TO }, label:'Microwave 500W' },
  { id:'foodprocessor', category:'appliance', wall:'west', x:0, y:1900, z:900, width:500, depth:400, height:300, locked:false, color:'#C0C0C0', material:'plastic_steel', clearance:null, label:'Food Processor 500W' },
  { id:'waterpurifier', category:'appliance', wall:'west', x:0, y:3350, z:1350, width:300, depth:300, height:400, locked:false, color:'#7EB8E8', material:'plastic', clearance:{ kind:'nearSink', maxDistance:350, actualDistance:200 }, label:'Water Purifier near Sink hidden under 320D LED touching shaft' },
  { id:'sink', category:'plumbing', wall:'west', x:0, y:3550, z:0, width:600, depth:400, height:900, locked:false, color:'#222', material:'stainless_steel', clearance:{ kind:'shaftClear', distanceToShaft:SHAFT_Y-3550-600 }, label:'Sink 600W almost touching shaft' },
  { id:'shaft', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 61x83.8 LAST NW y4146', fixed:true, last:true }
]

export const VALIDATION_RULES = [
  { id:'east-order', label:'East order: gas before dishwasher before washing', wall:'east', kind:'order', expected:'gas.y < dishwasher.y < washing.y && washing.last', severity:'error', fix:'Move gas south of dishwasher and washing to north end' },
  { id:'west-order', label:'West order: microwave before processor before purifier before sink before shaft', wall:'west', kind:'order', expected:'microwave < foodprocessor < waterpurifier < sink < shaft && shaft.last && |purifier-sink|<350', severity:'error', fix:'Restore west appliance order and keep purifier within 350mm of sink' },
  { id:'purifier-near-sink', label:'Purifier near sink (<350mm)', wall:'west', kind:'proximity', expected:350, severity:'warning', fix:'Move waterpurifier within 350mm of sink' },
  { id:'door-clear-zone', label:'West door clear zone y0-y1220 empty', wall:'west', kind:'clearZone', expected:{ from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO, floorToCeiling:true }, severity:'error', fix:'Move any west object overlapping y0-y1220 beyond y1220' },
  { id:'north-clear-zone', label:'North 300mm clear zone empty', wall:'north', kind:'clearZone', expected:{ depth:NORTH_CLEAR }, severity:'error', fix:'Keep all counters and appliances south of y4446' },
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
    spice:'melamine',
    gas:'stainless_steel',
    dishwasher:'stainless_steel',
    washing:'stainless_steel',
    microwave:'black_glass',
    foodprocessor:'plastic_steel',
    waterpurifier:'plastic',
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
  rule:'Rule9: Gas middle to DW to WM LAST, MW to FP to Purifier near sink to Sink to Shaft LAST',
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
    shaftPosition:{ x:SHAFT_X, y:SHAFT_Y, w:SHAFT_W, l:SHAFT_L }
  }
}

// Aliases for compatibility / convenience
export const LAYOUT = LAYOUT_MODEL
export const layoutModel = LAYOUT_MODEL

// Phase 4: cabinet module definitions
export const MODULE_WIDTHS = [300,450,600,750,900]
export const MODULE_DEFS = {
  300:{ id:'mod-300', width:300, type:'base', shutter:'single', drawers:0, handle:'bar' },
  450:{ id:'mod-450', width:450, type:'base', shutter:'single', drawers:1, handle:'bar' },
  600:{ id:'mod-600', width:600, type:'base', shutter:'double', drawers:2, handle:'bar' },
  750:{ id:'mod-750', width:750, type:'base', shutter:'double', drawers:2, handle:'bar' },
  900:{ id:'mod-900', width:900, type:'base', shutter:'double', drawers:3, handle:'bar' },
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
