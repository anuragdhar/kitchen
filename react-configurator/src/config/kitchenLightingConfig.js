import {ROOM_WIDTH, ROOM_LENGTH, ROOM_HEIGHT, EAST_INIT, WEST_INIT, EAST_TOP_UPPER_DEPTH, WEST_TOP_UPPER_DEPTH, WEST_CLEAR_TO, WEST_COUNTER_DEPTH, SHAFT_W, SHAFT_L} from './kitchenConfig.js'

// Kitchen track lighting (owner 2026-10-04). No false ceiling; 48 V magnetic surface track on the slab, the same vocabulary
// as drawingLightingConfig.js; one run = one circuit with its own driver and wall dimmer.
//
// FRAME: millimetres, x from the west wall and z from the NORTH wall, like every other room's lighting config. The kitchen
// planner (kitchenConfig.js, App.jsx) measures y from the SOUTH wall, so z = ROOM_LENGTH - y; rooms/kitchen/KitchenTrackLights.js
// does that conversion (and the planner's centimetre scene units) in one place.
//
// What the ceiling is like (kitchenConfig.js CABINET_RUNS): the top wall cabinets on both long walls run up to the slab, 550
// deep on the east and 600 on the west (from the 610 door clear zone northward), and the shaft fills the north-west corner;
// the chimney is hidden inside the east uppers over the hob. Only the walkway between the uppers (x 600-1774) is free
// ceiling, so one run goes down its middle. The under-cabinet LED strips of the cabinet design (App.jsx, under the lower
// uppers at 1322 mm) stay: a ceiling light cannot reach the back of a counter under a cabinet that goes to the ceiling, so
// they do that job and the track does the walkway, the fronts of the counters, the hob and the sink. There is no ceiling
// fan in the kitchen (the exhaust fan is in the window).
const yToZ = yMm => ROOM_LENGTH - yMm
const gas = EAST_INIT.find(item => item.id === 'gas'), sink = WEST_INIT.find(item => item.id === 'sink')
// Work spots the down lights shine on, in this frame: the hob (east counter) and the sink (west counter).
export const KITCHEN_WORK_SPOTS = [
  {x1: gas.x, x2: ROOM_WIDTH, z1: yToZ(gas.y + gas.w), z2: yToZ(gas.y), label: 'hob'},
  {x1: 0, x2: WEST_COUNTER_DEPTH, z1: yToZ(sink.y + sink.w), z2: yToZ(sink.y), label: 'sink'},
]
// What reaches the ceiling: a run keeps 100 mm clear of these (domain/drawingLighting.mjs TRACK_TO_OBSTACLE_MM).
export const KITCHEN_CEILING_OBSTACLES = [
  {x1: ROOM_WIDTH - EAST_TOP_UPPER_DEPTH, x2: ROOM_WIDTH, z1: 0, z2: ROOM_LENGTH, label: 'east top wall cabinets'},
  {x1: 0, x2: WEST_TOP_UPPER_DEPTH, z1: 0, z2: yToZ(WEST_CLEAR_TO), label: 'west top wall cabinets'},
  {x1: 0, x2: SHAFT_W, z1: 0, z2: SHAFT_L, label: 'shaft'},
]
const walkwayMidX = Math.round((WEST_TOP_UPPER_DEPTH + ROOM_WIDTH - EAST_TOP_UPPER_DEPTH) / 2) // 1187
const hobZ = Math.round((KITCHEN_WORK_SPOTS[0].z1 + KITCHEN_WORK_SPOTS[0].z2) / 2), sinkZ = Math.round((KITCHEN_WORK_SPOTS[1].z1 + KITCHEN_WORK_SPOTS[1].z2) / 2)

export const KITCHEN_LIGHTING = {
  room: {widthMm: ROOM_WIDTH, lengthMm: ROOM_LENGTH, heightMm: ROOM_HEIGHT},
  ceilingFans: null,
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 4000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
    // Down the middle of the walkway, from near the window to near the door. Three diffused heads for shadow-free general
    // light along both counters; a down light aimed at the front of the hob and one aimed at the sink (both tilted under
    // 30 degrees, onto the 900 mm worktop). Neutral white 4000 K here: a work room, not a sitting room.
    {id: 'K1', label: 'Kitchen track: down the middle of the ceiling', axis: 'z', atMm: walkwayMidX, fromMm: 400, toMm: 4350, driverWatts: 100, heads: [
      {kind: 'diffuse', atMm: 900, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'reading', atMm: hobZ, watts: 12, lumens: 1000, targetMm: {xMm: ROOM_WIDTH - 450, zMm: hobZ}, targetHeightMm: 900, label: 'hob'},
      {kind: 'diffuse', atMm: 2575, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'reading', atMm: sinkZ, watts: 12, lumens: 1000, targetMm: {xMm: 300, zMm: sinkZ}, targetHeightMm: 900, label: 'sink'},
      {kind: 'diffuse', atMm: 3950, watts: 15, lumens: 1400, lengthMm: 300}]},
  ]},
  // The existing under-cabinet LED strips (App.jsx 'east warm LED strip', 'west warm LED strip ...'): kept, as their own
  // dimmable circuit. Not part of the track check.
  underCabinetLed: {label: 'Under-cabinet LED strips', heightMm: 1322, kept: true},
}

// Sliders on the Kitchen 3D view, one per circuit: [circuit id, label]. 'led' is the under-cabinet strip circuit.
export const KITCHEN_DIMMER_CIRCUITS = [['K1', 'Ceiling track'], ['led', 'Under-cabinet LED strips']]
