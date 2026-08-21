export const ROOM_WIDTH = 2324
export const ROOM_LENGTH = 4746
export const ROOM_HEIGHT = 2700
export const WEST_CLEAR_FROM = 300
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

export const KITCHEN = { width:ROOM_WIDTH, length:ROOM_LENGTH, height:ROOM_HEIGHT, door:{w:1100,x:612}, window:{w:1100,h:1800,sill:900,x:612, belowDepth:WINDOW_BELOW_DEPTH, transomHeight:610, sections:2, topFixed:true, bottomOperation:'sliding', bottomFixedCount:0, bottomSlidingCount:2}, shaft:{w:SHAFT_W,l:SHAFT_L,x:SHAFT_X,y:SHAFT_Y}, northClear:NORTH_CLEAR, windowBelow:{x:612,w:1100,depth:WINDOW_BELOW_DEPTH}, westGap:{from:WEST_CLEAR_FROM,to:WEST_CLEAR_TO,w:WEST_CLEAR_TO-WEST_CLEAR_FROM}, walkway:{floor:1324,eye:1004} }

// PS1 Garage East Near Window — implements Kitchen-design-2D-layout.ps1
// East 600D South→North: spice 150 open y1850, gas 700 y2000, dishwasher hidden y2850, washing hidden y3400 below garage, garage NE 600×550×2700 at y4146 framing window (matches shaft NW)
export const EAST_INIT = [
  {id:'spice', label:'Spice Open Slider 150W y1850', w:150, d:300, h:200, y:1850, x:1724, color:'#d9c2a5', z:150},
  {id:'gas', label:'Gas Middle 700W y2000 hidden chimney small', w:700, d:600, h:900, y:2000, x:1624, color:'#2a2a2a'},
  {id:'dishwasher', label:'Dishwasher 600W hidden behind shutter under counter y2850', w:600, d:600, h:880, y:2850, x:1724, color:'#A8A8A8', hidden:true, behindShutter:true},
  {id:'washing', label:'Washing 600W hidden behind shutter under counter y3400 below garage (last before garage)', w:600, d:600, h:880, y:3400, x:1724, color:'#E5E0DA', hidden:true, behindShutter:true, lastBeforeGarage:true},
  {id:'garage_NE', label:'Garage NE Tall 600×550×2700 y4146 framing window (matches shaft NW) — lower 0-900 washing, upper 1350-2700 microwave+foodprocessor beige tambour', w:600, d:550, h:2700, y:4146, x:1724, color:'#C4B5A5', fullHeight:true, last:true, matchesShaft:true, visualSingularity:true}
]
export const WEST_INIT = [
  {id:'sink', label:'Sink 800W y2850 — deep single-bowl 760×440 with drainboard for family of 6 (counter-placed, Domestic help wash zone)', w:800, d:400, h:900, y:2850, x:0, color:'#6a6a6a', z:0, sinkType:'single-bowl-drainboard-304'},
  {id:'waterpurifier', label:'Water Purifier 350W wall-mounted y3680 inside upper beyond rack (not on counter) — RO+UV 8L, north of sink rack', w:350, d:320, h:400, y:3680, x:0, color:'#7EB8E8', z:1350, mountedAbove:true},
  {id:'sinkUpperDishRack', label:'Over-sink Dish Rack 800W y2850 z1350 — 2-tier SS for family 6', w:800, d:320, h:700, y:2850, x:0, color:'#f0e6da', z:1350},
  {id:'shaft', label:'Shaft 61x83.8 LAST NW y4146 full height', w:610, d:838, h:2700, y:4146, x:0, color:'#999', fixed:true, last:true}
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
  window:{ id:'opening-window-north', category:'opening', wall:'north', x:612, y:ROOM_LENGTH-45, z:900, width:1100, depth:24, height:1800, locked:false, color:'#7eb8e8', material:'glass', clearance:null, label:'North Window — 2 Bays × 610 Fixed Top / 1190 Sliding Bottom (centre mullion) — LEFT-TOP 12\" Metal Exhaust', sill:900, sections:2, transomHeight:610, top:{ operation:'fixed', lights:2, height:610, leftTop:{ type:'exhaustFan', size:300, material:'metal', model:'12-inch heavy-duty', status:'installed' }, rightTop:{ type:'fixedGlass' } }, bottom:{ operation:'sliding', lights:2, height:1190, slidingCount:2, fixedCount:0, slidingPosition:'both' }, notes:{ shaftAlternative:'Hole in shaft wall (west shaft 61×83.8 at y4146) can also host exhaust — noted as alternative to window mount', exhaustChoice:'Metal 12-inch recommended for kitchen heat/grease — plastic not suggested' } },
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
  { id:'west-door-clear-zone', category:'clearZone', wall:'west', x:0, y:WEST_CLEAR_FROM, z:0, width:WEST_CLEAR_TO-WEST_CLEAR_FROM, depth:WEST_COUNTER_DEPTH, height:ROOM_HEIGHT, locked:true, color:'#fffaf3', material:'void', clearance:{ kind:'fullHeight', from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO }, label:'West door clear zone y300-y1220 no counter no upper no LED (gap 920 per PS1 — y300-1220)' },
  { id:'north-window-below-zone', category:'referenceZone', wall:'north', x:612, y:ROOM_LENGTH-WINDOW_BELOW_DEPTH, z:0, width:1100, depth:WINDOW_BELOW_DEPTH, height:900, locked:true, color:'#eaf6fd', material:'void', clearance:{ kind:'windowBelow', depth:WINDOW_BELOW_DEPTH }, label:'Window-only below-sill reference zone' }
]

export const APPLIANCES = [
  { id:'spice', category:'cabinet', wall:'east', x:1724, y:1850, z:150, width:150, depth:300, height:200, locked:false, color:'#d9c2a5', material:'laminate', clearance:null, label:'Spice Open Slider 150W y1850 — PS1' },
  { id:'gas', category:'appliance', wall:'east', x:1624, y:2000, z:900, width:700, depth:600, height:900, locked:false, color:'#2a2a2a', material:'stainless_steel', clearance:null, label:'Gas Middle 700W y2000 hidden chimney small — PS1 (was y2300)', subcomponents:[{id:'gas-cooktop', label:'cooktop slab'}, {id:'gas-burner-rings', label:'3 burner rings'}, {id:'hidden-chimney-insert', label:'hidden chimney insert inside upper cabinet'}, {id:'hidden-chimney-vent-slot', label:'slim under-cabinet vent slot'}] },
  { id:'dishwasher', category:'appliance', wall:'east', x:1724, y:2850, z:0, width:600, depth:600, height:880, locked:false, color:'#A8A8A8', material:'stainless_steel', clearance:{ kind:'hiddenBehindShutter', y:2850 }, label:'Dishwasher 600W hidden behind shutter under counter y2850 — PS1 (now dormant — India manual wash, help uses sink)', hidden:true, behindShutter:true, dormant:true },
  { id:'washing', category:'appliance', wall:'east', x:1724, y:3400, z:0, width:600, depth:600, height:880, locked:false, color:'#E5E0DA', material:'stainless_steel', clearance:{ kind:'belowGarageHidden', garageY:4146 }, label:'Washing 600W hidden behind shutter under counter y3400 below garage — PS1 (last before garage)', hidden:true, behindShutter:true, lastBeforeGarage:true },
  { id:'garage_NE', category:'cabinet', wall:'east', x:1724, y:4146, z:0, width:600, depth:550, height:2700, locked:true, color:'#C4B5A5', material:'laminate', clearance:{ kind:'tallGarageFullHeight', matchesShaft:true }, label:'Garage NE Tall 600×550×2700 y4146 framing window (matches shaft NW) — lower 0-900 washing inside, middle 900-1350 empty, upper 1350-2700 microwave+foodprocessor tambour beige matte #C4B5A5, LED #FFD8A0 at 1850', last:true, fullHeight:true, subcomponents:[{id:'microwave-inside-garage', label:'Microwave moved from west y1300 to east garage upper'}, {id:'foodprocessor-inside-garage', label:'Food processor moved from west y1900 to east garage upper'}] },
  { id:'sink', category:'plumbing', wall:'west', x:0, y:2850, z:0, width:800, depth:400, height:900, locked:false, color:'#6a6a6a', material:'stainless_steel', clearance:{ kind:'helpWashZone', familySize:6 }, label:'Sink 800W y2850 — 760×440 304 SS single-bowl with drainboard + 180mm depth for family 6 (help washes dirty vessels here)', sinkOptions:{ selected:'A-800-drainboard', alternatives:['B-860 double-bowl 400+340','C-900 granite composite quartz black']} },
  { id:'waterpurifier', category:'cabinet', wall:'west', x:45, y:3680, z:1350, width:350, depth:320, height:400, locked:false, color:'#7EB8E8', material:'laminate', clearance:{ kind:'mountedAboveCounterInsideUpper', sinkY:2850 }, label:'Water Purifier 350W wall-mounted y3680 inside upper beyond rack (not on counter) — RO+UV 8L, north of sink rack y2850', mountedAbove:true },
  { id:'sinkUpperDishRack', category:'cabinet', wall:'west', x:0, y:2850, z:1350, width:800, depth:320, height:700, locked:false, color:'#f0e6da', material:'laminate', clearance:{ kind:'overSinkStorage', sinkY:2850 }, label:'Over-sink Dish Cabinet 800W×320D×700H — 2-tier SS rack for 6 (12 dinner plates + 12 katoris + 6 glasses + cups), perforated tray drains to sink, open-bottom with drip channel — help cleans then places here' },
  { id:'shaft', category:'shaft', wall:'west', x:SHAFT_X, y:SHAFT_Y, z:0, width:SHAFT_W, depth:SHAFT_L, height:ROOM_HEIGHT, locked:true, color:'#999', material:'concrete', clearance:null, label:'Shaft 61x83.8 LAST NW y4146', fixed:true, last:true }
]

export const VALIDATION_RULES = [
  { id:'east-order', label:'East order PS1: spice y1850 < gas y2000 < dishwasher y2850 hidden < washing y3400 hidden < garage_NE y4146 last', wall:'east', kind:'order', expected:'spice.y < gas.y && gas.y < dishwasher.y && dishwasher.y < washing.y && washing.lastBeforeGarage && garage_NE.last && garage_NE.y===4146', severity:'error', fix:'Keep east order spice1850 → gas2000 → dishwasher2850 → washing3400 → garage_NE4146 per PS1' },
  { id:'west-order', label:'West order: sink y2850 (800W) + dish rack 800 above → purifier y3680 → shaft y4146', wall:'west', kind:'order', expected:'sink.y===2850 && sink.w===800 && sinkUpperDishRack.y===2850 && waterpurifier.y===3680 && shaft.last', severity:'error', fix:'Keep west: sink 800W at y2850 with dish rack 800W above sink, purifier y3680 north of rack, then shaft y4146' },
  { id:'purifier-near-sink', label:'Purifier north of rack — wall-mounted', wall:'west', kind:'proximity', expected:{ sinkY:2850, dishRackY:2850, purifierY:3680 }, severity:'warning', fix:'Purifier at y3680 z1350 north of sink rack, not on counter' },
  { id:'door-clear-zone', label:'West door clear zone y300-y1220 empty (PS1 gap 920)', wall:'west', kind:'clearZone', expected:{ from:WEST_CLEAR_FROM, to:WEST_CLEAR_TO, floorToCeiling:true }, severity:'error', fix:'Move any west object overlapping y300-y1220 beyond y1220 — gap 920 no counter' },
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
