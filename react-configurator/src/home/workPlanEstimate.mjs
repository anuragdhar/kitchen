import {ironingStorageTopMm} from '../domain/lobbyIroningStorage.mjs'
// Rough budget for the work plan (pure: no React, DOM or Node). PLANNING RANGES, NOT QUOTES.
//
// Every figure is quantity x rate. Quantities come from the app's own configs (cabinet sizes, door sizes, track runs and
// head counts, room sizes), so they are model sizes, not site measurements. Rates are typical 2025-26 Delhi NCR figures
// for mid-range quality, labour and material together unless the rate says otherwise; GST, contractor margin on top of
// these, and a contingency are NOT included. The owner corrects a rate here (RATES) and re-runs
//   node scripts/work-plan-estimate.mjs
// which rewrites the estimate fields in work-plan/plan.json and the two generated documents.
//
// Units: lengths in the configs are millimetres; carpentry and painting are priced the way local contractors quote them,
// per square foot (1 sq m = 10.764 sq ft) or per running foot (1 m = 3.281 ft). Conversions happen only in sqft() / rft().

import {EMPTY_ROOM_SHELLS as SHELLS} from '../config/roomShellConfig.js'
import {ENTRY} from '../config/entryConfig.js'
import {ENTRY_LIGHTING} from '../config/entryLightingConfig.js'
import {BALCONY_OFFICE} from '../config/balconyOfficeConfig.js'
import {STUDY_ROOM} from '../config/studyRoomConfig.js'
import {DRAWING_ELECTRICAL} from '../config/drawingElectricalConfig.js'
import {DRAWING_LIGHTING} from '../config/drawingLightingConfig.js'
import {LOBBY_LIGHTING} from '../config/lobbyLightingConfig.js'
import {BEDROOM1_LIGHTING} from '../config/bedroom1LightingConfig.js'
import {BEDROOM3_LIGHTING} from '../config/bedroom3LightingConfig.js'
import {STUDY_LIGHTING} from '../config/studyLightingConfig.js'
import {KITCHEN_LIGHTING} from '../config/kitchenLightingConfig.js'
import {BEDROOM1_CLOSED_DOOR} from '../config/bedroom1ClosedDoor.js'
import {BEDROOM1_DESIGN} from '../config/bedroom1LayoutConfig.js'
import {AC_PLAN} from '../config/acPlanConfig.js'
import {pipeRoute, resolveRoute} from '../domain/acPlan.mjs'
import {roomElectricalReport} from '../domain/roomElectricalModels.mjs'
import {CABINET_RUNS, WEST_INIT, KITCHEN, KITCHEN_STORE_STORAGE, BACKSPLASH_HEIGHT} from '../config/kitchenConfig.js'

/** One table of every rate used. `unit` is what the quantity is counted in; low/high are INR per unit. */
export const RATES = {
  engineer: {label: 'Structural engineer: site visit, checks and a signed note or drawing', unit: 'job', low: 15000, high: 40000},
  electricianSurvey: {label: 'Electrician: survey visit and test of the existing wiring', unit: 'visit', low: 1500, high: 4000},
  wallCut: {label: 'Cut an opening in a brick wall with a cutter, carry the debris to the pile', unit: 'sq ft', low: 120, high: 220},
  lintel: {label: 'Lintel over a new opening (precast or steel), fixed and packed', unit: 'each', low: 5000, high: 10000},
  reveal: {label: 'Plaster the two jambs and the head of a new opening', unit: 'each', low: 2500, high: 5000},
  debrisTrip: {label: 'Debris removal, one tractor-trolley load, carried down from the fifth floor', unit: 'load', low: 3500, high: 6500},
  brickPartition: {label: 'Half-brick partition, plastered on both faces', unit: 'sq ft', low: 190, high: 300},
  sheetInfill: {label: 'Close a doorway: frame and 12 mm fibre-cement sheet, jointed and ready for paint', unit: 'sq ft', low: 160, high: 280},
  msSteel: {label: 'Mild steel, fabricated, primed, painted and fixed', unit: 'kg', low: 110, high: 170},
  ssDoor: {label: 'Stainless steel 304 grille door with frame and insect mesh, fabricated and fixed', unit: 'sq ft', low: 1600, high: 2600},
  doorLock: {label: 'Mortise lock with lever handles, deadbolt and night latch', unit: 'each', low: 5000, high: 12000},
  pointLight: {label: 'Light or switch point: conduit, wire, box, modular switch', unit: 'point', low: 900, high: 1500},
  pointSocket: {label: '6 A socket or charging point with a modular plate (USB module included)', unit: 'point', low: 1200, high: 2000},
  pointPower: {label: '16 A power point with a modular plate', unit: 'point', low: 1800, high: 3000},
  circuit: {label: 'Dedicated circuit from the board: 4 sq mm wire, own breaker, AC or power socket', unit: 'each', low: 4500, high: 8000},
  pointData: {label: 'Data, TV, phone or intercom cable run with its outlet', unit: 'run', low: 1200, high: 2200},
  conduit50: {label: '50 mm conduit with a pull wire', unit: 'm', low: 250, high: 450},
  floorBox: {label: 'Flush floor box, chased into the floor, with socket and USB', unit: 'each', low: 4500, high: 9000},
  switchboard: {label: 'Replace or move a switchboard: modular box, plate, switches and regulators, wires extended', unit: 'each', low: 4000, high: 9000},
  trackFeed: {label: 'Feed point and a dimmed line back to the switchboard for one track run', unit: 'run', low: 2000, high: 3500},
  chase: {label: 'Close a wall chase and patch the plaster', unit: 'running ft', low: 40, high: 70},
  floorPatch: {label: 'Floor and skirting repair at a cut wall, matched to the old floor', unit: 'sq ft', low: 250, high: 450},
  skirting: {label: 'Take off the old skirting and fix a slim or flush tile skirting', unit: 'running ft', low: 90, high: 180},
  pvcCeiling: {label: 'PVC plank ceiling on a frame, with edge trim', unit: 'sq ft', low: 90, high: 160},
  carpTall: {label: 'Wardrobe or tall cabinet: 18 mm waterproof ply, laminate, soft-close hardware, by front area', unit: 'sq ft', low: 1500, high: 2300},
  carpShallow: {label: 'Shallow cabinet (under 150 mm deep) or a sliding cover: doors, shelves, laminate, by front area', unit: 'sq ft', low: 800, high: 1300},
  carpLow: {label: 'Low unit, console or chest of drawers, by length along the wall', unit: 'running ft', low: 3500, high: 6000},
  carpTop: {label: 'Loose top or shelf: 25 mm ply, laminate, edged', unit: 'sq ft', low: 350, high: 600},
  kitchenBase: {label: 'Kitchen base cabinets with drawers and soft-close fittings, by front area', unit: 'sq ft', low: 1900, high: 2900},
  kitchenWall: {label: 'Kitchen wall cabinets, by front area', unit: 'sq ft', low: 1400, high: 2100},
  counter: {label: 'Kitchen counter: granite (low) to quartz (high), cut, polished and fixed', unit: 'sq ft', low: 400, high: 900},
  backsplash: {label: 'Kitchen backsplash tile, fixed and grouted', unit: 'sq ft', low: 150, high: 300},
  pullOut: {label: 'Tall pull-out pantry or rack fittings', unit: 'set', low: 15000, high: 30000},
  flutedPanel: {label: 'Fluted wall panelling on battens, finished', unit: 'sq ft', low: 450, high: 800},
  ledStrip: {label: 'LED strip in an aluminium profile with its driver', unit: 'm', low: 350, high: 700},
  mirror: {label: '5 mm mirror, cut and fixed', unit: 'sq ft', low: 150, high: 280},
  hiddenDoorSet: {label: 'Concealed hinges and push latch for a hidden door', unit: 'set', low: 4000, high: 8000},
  ironingFitting: {label: 'Pull-out ironing board fitting', unit: 'each', low: 6000, high: 12000},
  foldSeat: {label: 'Wall-hinged fold-down seat with 120 kg brackets, anchored', unit: 'each', low: 4500, high: 9000},
  flushDoor: {label: 'Door frame, flush door with laminate, hinges, lock and stopper, hung', unit: 'each', low: 18000, high: 32000},
  woodShutter: {label: 'Wooden window shutters to match, glazed, with hardware', unit: 'sq ft', low: 1200, high: 2000},
  woodRefinish: {label: 'Strip paint from old woodwork, stain and PU polish', unit: 'sq ft', low: 250, high: 450},
  paint: {label: 'Repaint: putty touch-up, primer, two coats of premium emulsion', unit: 'sq ft', low: 22, high: 40},
  trackMetre: {label: '48 V magnetic surface track with end feed', unit: 'm', low: 900, high: 1800},
  headSpot: {label: 'Track spot head, 7 W', unit: 'each', low: 900, high: 1800},
  headDiffuse: {label: 'Track linear diffused head, 15 W', unit: 'each', low: 1300, high: 2500},
  headReading: {label: 'Track reading or down-light head, 12 W', unit: 'each', low: 1200, high: 2200},
  driver60: {label: '48 V driver, 60 W, dimmable', unit: 'each', low: 1800, high: 3000},
  driver100: {label: '48 V driver, 100 W, dimmable', unit: 'each', low: 2500, high: 4500},
  dimmer: {label: 'Wall dimmer matched to the driver, modular', unit: 'each', low: 1500, high: 3500},
  trackFit: {label: 'Fix one track run to the slab, connect, clip in and aim the heads (labour)', unit: 'run', low: 1000, high: 2000},
  panelLight: {label: 'Round LED panel light, 8 W, fitted', unit: 'each', low: 350, high: 700},
  testing: {label: 'Fit the plates, test every circuit, label the board', unit: 'job', low: 2000, high: 4000},
  tvMount: {label: 'TV wall bracket and mounting, cables dressed', unit: 'job', low: 2500, high: 6000},
  acSplit: {label: '1.5 ton inverter split AC, 3 to 5 star, with the standard installation kit', unit: 'each', low: 38000, high: 55000},
  acExtras: {label: 'AC installation extras: bracket or stand, core cut, labour', unit: 'each', low: 3000, high: 6000},
  acDrain: {label: 'AC condensate drain pipe, clipped or cased, laid to a fall', unit: 'm', low: 150, high: 300},
  samples: {label: 'Sample boards, fabric swatches, a handle and two test lamps', unit: 'set', low: 1500, high: 4000},
  acPipe: {label: 'Extra copper pipe pair with insulation, drain and cable beyond the 3 m in the kit', unit: 'm', low: 800, high: 1300},
  windowAcFit: {label: 'Fit a window AC on its frame: seal, drain tray and pipe', unit: 'job', low: 2500, high: 6000},
  glazingCut: {label: 'Alter one aluminium glazing panel to take the AC casing', unit: 'job', low: 2500, high: 6000},
  rollerNet: {label: 'Roller mosquito net with cassette and side channels', unit: 'sq ft', low: 250, high: 450},
  outdoorBlind: {label: 'Ready-made outdoor HDPE roll-up blind, one section, with hooks', unit: 'each', low: 800, high: 1800},
  alumSliding: {label: 'Slim aluminium sliding doors, 8 mm toughened fluted glass, top-hung track, soft close', unit: 'sq ft', low: 1100, high: 1800},
  deepClean: {label: 'Deep clean of the flat after the work', unit: 'job', low: 6000, high: 12000},
}

const SQFT_PER_SQM = 10.764, FT_PER_M = 3.281
export const sqft = (widthMm, heightMm) => widthMm * heightMm / 1e6 * SQFT_PER_SQM
export const rft = lengthMm => lengthMm / 1000 * FT_PER_M
const metres = mm => mm / 1000

// ---- Quantities from the configs ------------------------------------------------------------------------------------

const {bedroom1, bedroom3, lobby, drawing} = SHELLS
const trackOf = lighting => {
  const runs = lighting.tracks.runs, heads = runs.flatMap(run => run.heads), count = kind => heads.filter(head => head.kind === kind).length
  return {runs: runs.length, metres: runs.reduce((total, run) => total + metres(run.toMm - run.fromMm), 0), spot: count('spot'), diffuse: count('diffuse'), reading: count('reading'),
    driver60: runs.filter(run => run.driverWatts === 60).length, driver100: runs.filter(run => run.driverWatts === 100).length}
}
const TRACKS = {drawing: trackOf(DRAWING_LIGHTING.southSofas), lobby: trackOf(LOBBY_LIGHTING), bedroom1: trackOf(BEDROOM1_LIGHTING), bedroom3: trackOf(BEDROOM3_LIGHTING), study: trackOf(STUDY_LIGHTING), kitchen: trackOf(KITCHEN_LIGHTING)}

// Paintable area of a room: four walls and the ceiling, less 20 % for doors, windows and full-height cabinets.
const paintArea = (widthMm, lengthMm, heightMm = 2700, wallShare = 1) => (sqft(2 * (widthMm + lengthMm), heightMm) * wallShare + sqft(widthMm, lengthMm)) * 0.8
const entryAreaSqft = sqft(ENTRY.approachLengthMm, ENTRY.clearWidthMm)
const PAINT_SQFT = paintArea(drawing.widthMm, drawing.lengthMm) + paintArea(lobby.widthMm, lobby.lengthMm) + paintArea(bedroom1.widthMm, bedroom1.lengthMm)
  + paintArea(bedroom3.widthMm, bedroom3.lengthMm) + paintArea(STUDY_ROOM.dimensions.widthMm, STUDY_ROOM.dimensions.lengthMm)
  + paintArea(KITCHEN.width, KITCHEN.length, KITCHEN.height, 0.5) // kitchen walls are mostly cabinets and tile
  + paintArea(BALCONY_OFFICE.dimensions?.widthMm ?? 1200, BALCONY_OFFICE.dimensions?.lengthMm ?? 2623)
  + paintArea(ENTRY.clearWidthMm, ENTRY.approachLengthMm) * 2.5 // corridor plus the longer inner gallery
const SKIRTING_RFT = [drawing, lobby, bedroom1, bedroom3].reduce((total, room) => total + rft(2 * (room.widthMm + room.lengthMm)), rft(2 * (STUDY_ROOM.dimensions.widthMm + STUDY_ROOM.dimensions.lengthMm))) * 0.75

// Owner 2026-10-06: no door is allowed in the landing opening; the steel door is priced for the arrival (wooden door) opening.
const outerDoor = {widthMm: Math.round(Math.abs(ENTRY.arrivalDoor.toPlanY - ENTRY.arrivalDoor.fromPlanY) * ENTRY.planScale.zMetresPerPixel * 1000), heightMm: ENTRY.arrivalDoor.heightMm}
const storage = drawing.wallStorage // the west cabinet behind the Drawing Room north wall
const b1Door = lobby.doors.find(door => door.leadsTo === 'Bedroom 1')
const oldB1DoorWidthMm = Math.abs(BEDROOM1_CLOSED_DOOR.planXWest - BEDROOM1_CLOSED_DOOR.planXEast) * lobby.widthMm / (515 - 255) // lobby plan bounds x 255-515
const southWindow = drawing.windows[0]
const windowBays = (() => { const [a, b] = southWindow.mullionFractions, w = southWindow.widthMm; return [a * w, (b - a) * w, (1 - b) * w] })()
const transomMm = southWindow.transomMm ?? 2040
const slidingOpening = {widthMm: drawing.hangingBeams[0].toMm - drawing.hangingBeams[0].fromMm, heightMm: drawing.heightMm - drawing.hangingBeams[0].dropMm}
const tvPanel = {widthMm: 2100 - 40, heightMm: 1800} // docs/DRAWING_ROOM_TV_WALL.md: panelling x 40-2100, floor to 1800
const consoleUnit = drawing.southLayout?.console ?? {lengthMm: 1600}
const east = bedroom3.furniture.eastCabinet, chest = bedroom3.furniture.westChest
const office = BALCONY_OFFICE, north = office.cabinetry.northWall, desk = office.worktop
const run = id => CABINET_RUNS.find(item => item.id === id)
const shaftMm = KITCHEN.shaft.l, westRunMm = run('west-counter-run').width - shaftMm
const openAppliancesMm = WEST_INIT.filter(item => ['washing', 'dishwasher'].includes(item.id)).reduce((total, item) => total + item.w, 0)
const elecPoints = DRAWING_ELECTRICAL.points
const remainingPoints = elecPoints.filter(point => !['N1', 'N2', 'N4', 'W1', 'E1', 'F1'].includes(point.id)) // those six have their own tasks or are dropped
const windowAc = bedroom1.balconyExtension.windowAc

// AC routes (docs/AC_PLAN.md): refrigerant pipe length with the plan's own allowance, and the drawn drain length, in metres.
const KIT_PIPE_M = 3 // the pipe that usually comes with the machine
const acSpace = id => AC_PLAN.spaces.find(space => space.id === id)
const acRun = route => ({pipeM: pipeRoute(route.pipe, AC_PLAN).lengthM, drainM: route.drain ? Math.round(resolveRoute(route.drain, AC_PLAN).lengthMm / 100) / 10 : 0})
const AC_RUNS = {drawing: acRun(acSpace('drawing')), drawingShoeRack: acRun({pipe: acSpace('drawing').alternatives[0].pipe}), lobby: acRun(acSpace('lobby'))}
const extraPipe = metres => Math.max(0, Math.round((metres - KIT_PIPE_M) * 10) / 10)

// Electrical points per room (docs/ELECTRICAL_PLAN.md), less the points that are priced in a task of their own: the track
// driver feeds (the track-feed tasks), the Lobby switchboard and its junction box (the switchboard move), the dining pendant point (its own feed task), the Lobby and
// window AC points and the undecided Bedroom 1 split AC point (the AC tasks).
const OWN_TASK_POINTS = ['L-N1', 'L-N2', 'L-N4', 'L-C1', 'B1-B1', 'B1-W1']
const roomPoints = key => {
  const all = roomElectricalReport(key).points, points = all.filter(point => !/Track \d driver feed/.test(point.name) && !OWN_TASK_POINTS.includes(point.id))
  const count = test => points.filter(test).length, heavy = point => /16 A/.test(String(point.outlets ?? ''))
  return {all: all.length, counted: points.length, light: count(point => point.kind === 'lighting'), socket: count(point => point.kind === 'charging' || (point.kind === 'power' && !heavy(point))),
    power: count(point => point.kind === 'power' && heavy(point)), data: count(point => point.kind === 'data'), dedicated: count(point => point.kind === 'dedicated')}
}
const ROOM_POINTS = Object.fromEntries(['lobby', 'bedroom1', 'bedroom3', 'study', 'office', 'entry'].map(key => [key, roomPoints(key)]))

export const QUANTITIES = {
  tracks: TRACKS, paintSqft: PAINT_SQFT, skirtingRft: SKIRTING_RFT, outerDoor, slidingOpening, windowBays, oldB1DoorWidthMm,
  kitchen: {eastRunMm: run('east-base-run').width, westRunMm, openAppliancesMm}, remainingDrawingPoints: remainingPoints.map(point => point.id),
  acRuns: AC_RUNS, roomPoints: ROOM_POINTS,
}

// ---- One estimator per task -----------------------------------------------------------------------------------------
// item(what, quantity, rateId): quantity may be [low, high] when the quantity itself is the unknown.
const item = (what, quantity, rate) => ({what, quantity, rate})
const priced = (confidence, items, note = '') => ({confidence, items, note})
const free = why => ({confidence: 'medium', items: [], note: why})
const none = why => ({none: why})
const OWNER_TIME = 'No contractor cost: the owner\'s own time.'

const trackFeeds = track => priced('medium', [item('track runs', track.runs, 'trackFeed')], 'Run and head counts from the lighting config.')
const trackLights = (track, note = '') => priced('medium', [
  item('track', track.metres, 'trackMetre'), item('spot heads', track.spot, 'headSpot'), item('diffused heads', track.diffuse, 'headDiffuse'),
  item('reading heads', track.reading, 'headReading'), item('60 W drivers', track.driver60, 'driver60'), item('100 W drivers', track.driver100, 'driver100'),
  item('dimmers', track.runs, 'dimmer'), item('fixing', track.runs, 'trackFit'),
].filter(line => line.quantity > 0), `Counts from the lighting config; one maker for track, heads and drivers.${note}`)
const firstFix = (key, note = '') => { const p = ROOM_POINTS[key]; return priced('low', [
  item('light, fan and switch points', p.light, 'pointLight'), item('socket and charging points', p.socket, 'pointSocket'), item('16 A points', p.power, 'pointPower'),
  item('data points', p.data, 'pointData'), item('own circuit for an existing AC or water heater, if it has none', [0, p.dedicated], 'circuit'),
].filter(line => lowHigh(line.quantity)[1] > 0), `${p.counted} of the ${p.all} points in docs/ELECTRICAL_PLAN.md; the rest are priced in the track-feed, switchboard, pendant and AC tasks. Existing points that are reused are counted as new, so expect the low end.${note}`) }
const opening = (widthMm, heightMm, what) => [item(`${what} ${Math.round(widthMm)} x ${heightMm}`, sqft(widthMm, heightMm), 'wallCut'), item('lintel', 1, 'lintel'), item('reveals', 1, 'reveal')]

export const ESTIMATORS = {
  // 1. Measure, decide, approvals
  'site-measure': () => free(OWNER_TIME),
  'engineer-check': () => priced('low', [item('engineer', 1, 'engineer')], 'Fee depends on whether a drawing and a signed certificate are asked for.'),
  'pocket-check': () => free('Inspection by the owner with the mason; no separate cost.'),
  'society-permission': () => none('The society\'s fee or refundable deposit for renovation work is not known.'),
  'entry-ceiling-plan': () => free(OWNER_TIME),
  'electrician-survey': () => priced('medium', [item('survey', 1, 'electricianSurvey')]),
  'plumbing-scope': () => free(OWNER_TIME),
  'finalise-layouts': () => free(OWNER_TIME),
  'ac-choose': () => free('A decision; the AC itself is priced in the fitting task.'),
  'ac-plan-home': () => free('Decisions with the AC dealer; the work is priced in the Lobby AC and window AC tasks.'),
  'ac-drain-survey': () => free('Looked at by the owner with the AC installer; no separate cost.'),
  'ac-record-existing': () => free(OWNER_TIME),
  'palette-floor-record': () => free(OWNER_TIME),
  'palette-samples': () => priced('medium', [item('samples', 1, 'samples')], 'Most dealers lend laminate and fabric samples; paint sample pots and two lamps are bought.'),
  'lighting-plan-drawing': () => free(OWNER_TIME), 'lighting-plan-lobby': () => free(OWNER_TIME), 'lighting-plan-bedroom1': () => free(OWNER_TIME),
  'lighting-plan-bedroom3': () => free(OWNER_TIME), 'lighting-plan-study': () => free(OWNER_TIME), 'lighting-plan-kitchen': () => free(OWNER_TIME),
  'lighting-track-mouldings': () => free(OWNER_TIME),
  'lobby-pendant-decide': () => free('A decision; the new feed is priced in its own task.'),
  'elec-other-rooms': () => free('A review of the drawn plans with the electrician; the work is priced room by room.'),
  'palette-choose': () => free('A decision; samples are priced in their own task.'),
  'bedroom1-design-freeze': () => free('A decision between two drawn layouts; what layout B adds is priced in its own task.'),
  'drawing-switchboard-decide': () => free('A decision with the electrician; the work is priced in the switchboard task.'),
  'window-screen-trial': () => priced('medium', [item('trial blind', 1, 'outdoorBlind')], 'One ready-made piece for one section.'),

  // 2. Demolition and civil
  'shoe-rack-wall': () => priced('low', opening(ENTRY.shoeRack.widthMm, ENTRY.shoeRack.heightMm, 'window and wall, taken as the rack size'), 'The opening is not measured (A3).'),
  'shoe-rack-support': () => priced('low', [item('angle frame, about', 30, 'msSteel')], 'Weight assumed for a plain frame the size of the rack; an AC platform (proposal) would be two to three times this.'),
  'lobby-switchboard-move': () => priced('low', [item('switchboard moved', 1, 'switchboard')], 'What the board controls is not known (A14).'),
  'lobby-bedroom3-opening': () => priced('low', opening(b1Door.widthMm, b1Door.heightMm, 'doorway'), 'Wall thickness not measured.'),
  'bedroom1-old-door-close': () => priced('low', [item(`old doorway about ${Math.round(oldB1DoorWidthMm)} x ${BEDROOM1_CLOSED_DOOR.heightMm}`, sqft(oldB1DoorWidthMm, BEDROOM1_CLOSED_DOOR.heightMm), 'sheetInfill')], 'Opening scaled from the plan drawing.'),
  'north-wall-door': () => priced('low', opening(storage.widthMm, storage.heightMm, 'opening'), 'In a 9-inch wall; the engineer may ask for more support.'),
  'west-cabinet-frame': () => priced('low', [item('steel floor, about', 62, 'msSteel')], `Angles, hollow section and 5 mm plate over about ${storage.cabinet.widthMm} x ${storage.depthMm}; the engineer's design decides the real weight. A cast slab is the alternative.`),
  'pocket-partition': () => priced('low', [item('partition', sqft(storage.depthMm, ENTRY.wallHeightMm), 'brickPartition')], 'Length taken as the pocket depth; not measured.'),
  'main-gate': () => priced('low', [item(`door for the ${outerDoor.widthMm} x ${outerDoor.heightMm} opening`, sqft(outerDoor.widthMm, outerDoor.heightMm), 'ssDoor'), item('lock', 1, 'doorLock')], 'Opening from the plan, not measured (A7).'),
  'shaft-cover': () => none('The cover is not measured and has no size in the model (A7); the type is not chosen (C8).'),
  'bedroom3-cupboard-remove': () => priced('low', [item('half a load of debris', 0.5, 'debrisTrip')], 'Labour to dismantle is small if it is a wooden cupboard; more if masonry.'),
  debris: () => priced('low', [item('loads', [2, 4], 'debrisTrip')], 'Three openings, one closed doorway and the old window.'),

  // 3. Plumbing
  'plumbing-rough': () => none('No plumbing change is listed yet (plumbing-scope).'),

  // 4. Electrical first fix and AC piping
  'elec-chase-drawing': () => priced('low', [
    item('light points', remainingPoints.filter(point => point.kind === 'lighting').length, 'pointLight'),
    item('socket and charging points', remainingPoints.filter(point => point.kind === 'charging' || (point.kind === 'power' && !/16 A/.test(point.outlets))).length, 'pointSocket'),
    item('6/16 A points', remainingPoints.filter(point => point.kind === 'power' && /16 A/.test(point.outlets)).length, 'pointPower'),
  ], 'From the 17-point plan less the TV wall, AC, floor box and the east-wall switchboard (C28); the uplight and reading-light points may go now that the tracks do that work.'),
  'elec-tv-wall': () => priced('medium', [item('socket boxes', 3, 'pointPower'), item('own circuit', 1, 'circuit'), item('conduit', 1, 'conduit50')]),
  'elec-drawing-switchboard': () => priced('low', [item('switchboard', 1, 'switchboard')], 'More if it is moved to another wall (C28).'),
  'elec-drawing-west-sockets': () => priced('low', [item('plates moved', [0, 3], 'pointSocket')], 'Nothing if they stay for fixed plugs; three points if they move (C29).'),
  'elec-floor-box': () => priced('low', [item('floor box', [0, 1], 'floorBox')], 'Optional (C32).'),
  'elec-data': () => priced('medium', [item('cable runs', 4, 'pointData')], 'CAT6, coax, phone, intercom.'),
  'elec-entry-ceiling': () => firstFix('entry', ' The four ceiling light points and their switches are in this count.'),
  'ac-piping': () => priced('low', [
    item(`pipe beyond the ${KIT_PIPE_M} m kit`, [extraPipe(AC_RUNS.drawing.pipeM), extraPipe(AC_RUNS.drawingShoeRack.pipeM)], 'acPipe'),
    item('drain', AC_RUNS.drawing.drainM, 'acDrain'), item('core cut and fixing', 1, 'acExtras'),
  ], `Route lengths from docs/AC_PLAN.md: ${AC_RUNS.drawing.pipeM} m of pipe to the west wall (recommended) or ${AC_RUNS.drawingShoeRack.pipeM} m to the shoe rack (C15); the drain is drawn ${AC_RUNS.drawing.drainM} m along the outside to the toilet.`),
  'elec-ac-point': () => priced('medium', [item('AC circuits: Drawing Room, and the Lobby if agreed', [1, 2], 'circuit')]),
  'elec-first-fix-lobby': () => firstFix('lobby', ' Includes the Pooja light switch and socket (L-P1).'),
  'elec-first-fix-bedroom1': () => firstFix('bedroom1', ' Planned for layout A; in layout B the two bedside points move to the south wall (C35). The split AC point B1-W1 is left out until C31 is decided.'),
  'elec-first-fix-bedroom3': () => firstFix('bedroom3'),
  'elec-first-fix-study': () => firstFix('study'),
  'elec-first-fix-office': () => firstFix('office', ' The water heater and router points exist already.'),
  'elec-first-fix-kitchen': () => none('The kitchen has its own services plan, worked out in the kitchen planner from where the appliances stand; it has no fixed point schedule to count until the kitchen layout is frozen.'),
  'elec-ac-window-point': () => priced('medium', [item('AC circuit', 1, 'circuit')]),
  'elec-track-feed': () => trackFeeds(TRACKS.drawing), 'elec-track-feed-lobby': () => trackFeeds(TRACKS.lobby), 'elec-track-feed-bedroom1': () => trackFeeds(TRACKS.bedroom1),
  'elec-track-feed-bedroom3': () => trackFeeds(TRACKS.bedroom3), 'elec-track-feed-study': () => trackFeeds(TRACKS.study), 'elec-track-feed-kitchen': () => trackFeeds(TRACKS.kitchen),
  'elec-track-setout': () => free('Part of the electrician\'s first fix for the track feeds; no separate charge expected.'),
  'elec-lobby-pendant-feed': () => priced('low', [item('new ceiling point', [0, 1], 'pointLight')], 'Nothing if the pendant is dropped or goes on an existing point (C33).'),
  'ac-piping-other': () => priced('low', [
    item(`pipe beyond the ${KIT_PIPE_M} m kit`, [0, extraPipe(AC_RUNS.lobby.pipeM)], 'acPipe'), item('drain', [0, AC_RUNS.lobby.drainM], 'acDrain'),
    item('two core cuts and fixing', [0, 1], 'acExtras'), item('solid panel in the balcony glazing head', [0, 1], 'glazingCut'),
  ], `Nothing if no Lobby AC is wanted (C40). Route from docs/AC_PLAN.md: ${AC_RUNS.lobby.pipeM} m of pipe and ${AC_RUNS.lobby.drainM} m of drain.`),

  // 5. Plaster, making good, flooring
  plaster: () => { const points = 30 + Object.values(ROOM_POINTS).reduce((total, room) => total + room.counted, 0); return priced('low', [item(`chases, about ${points} points x 8 ft`, points * 8, 'chase')], 'About 30 points in the Drawing Room, track feeds and AC lines plus the counted points of the six room plans; the kitchen adds to it. Opening reveals are priced with each opening.') },
  flooring: () => priced('low', [item('patches at three openings and the closed doorway', 30, 'floorPatch')], 'Area assumed; matching an old floor is the risk.'),
  skirting: () => priced('low', [item('skirting', SKIRTING_RFT, 'skirting')], 'OPTIONAL. Room perimeters less a quarter for doors and cabinets; flush skirting costs more than the range.'),
  'entry-ceiling': () => priced('medium', [item(`corridor ${ENTRY.approachLengthMm} x ${ENTRY.clearWidthMm}`, entryAreaSqft, 'pvcCeiling')], 'A small job: expect a minimum charge near the high figure.'),

  // 6. Carpentry and steel fabrication
  'carp-west-cabinet': () => priced('low', [item(`cabinet box, front ${storage.cabinet.widthMm} x ${ENTRY.wallHeightMm}`, sqft(storage.cabinet.widthMm, ENTRY.wallHeightMm), 'carpTall'), item('hidden door fittings', 1, 'hiddenDoorSet')], 'A deep box (about 1.1 m) with sides and back: expect the high figure.'),
  'carp-tv-panel': () => priced('medium', [item(`panelling ${tvPanel.widthMm} x ${tvPanel.heightMm}`, sqft(tvPanel.widthMm, tvPanel.heightMm), 'flutedPanel'), item('cap light', metres(tvPanel.widthMm), 'ledStrip')]),
  'carp-tv-console': () => priced('medium', [item(`console ${consoleUnit.lengthMm} long`, rft(consoleUnit.lengthMm), 'carpLow')]),
  'carp-shoe-rack': () => priced('low', [item(`rack ${ENTRY.shoeRack.widthMm} x ${ENTRY.shoeRack.heightMm}`, sqft(ENTRY.shoeRack.widthMm, ENTRY.shoeRack.heightMm), 'carpTall'), item('mirror doors', sqft(ENTRY.shoeRack.widthMm, ENTRY.shoeRack.heightMm), 'mirror')], 'Weatherproof back and sides are extra; height and width to be confirmed (C1).'),
  'carp-entry-seat': () => priced('medium', [item('seat', 1, 'foldSeat')]),
  'carp-lobby-bedroom3-door': () => priced('medium', [item('door', 1, 'flushDoor')]),
  'carp-bedroom1-medicine-cabinet': () => priced('low', [item(`shallow cabinet about ${Math.round(oldB1DoorWidthMm)} x ${BEDROOM1_CLOSED_DOOR.heightMm}`, sqft(oldB1DoorWidthMm, BEDROOM1_CLOSED_DOOR.heightMm), 'carpShallow')], 'Usable depth is only about 50 mm in the model; measure the wall first.'),
  'carp-bedroom1': () => { const f = bedroom1.furniture, p = bedroom1.balconyExtension.poojaWallWardrobe; return priced('low', [
    item(`west wardrobe ${f.wardrobe.lengthMm} x ${f.wardrobe.heightMm}`, sqft(f.wardrobe.lengthMm, f.wardrobe.heightMm), 'carpTall'),
    item(`north-east recess wardrobe ${f.northEastRecessWardrobe.widthMm} x ${f.northEastRecessWardrobe.heightMm}`, sqft(f.northEastRecessWardrobe.widthMm, f.northEastRecessWardrobe.heightMm), 'carpTall'),
    item(`balcony wardrobe ${p.widthMm} x ${p.heightMm}`, sqft(p.widthMm, p.heightMm), 'carpTall'),
  ], 'The same three wardrobes in layout A and layout B; sliding panels on the balcony wardrobe are inside the rate.') },
  'carp-bedroom1-layout-b': () => { const b = BEDROOM1_DESIGN.layouts.headSouth; return priced('low', [
    item(`dressing table ${b.dressingTable.widthMm} long`, [0, rft(b.dressingTable.widthMm)], 'carpLow'),
    item(`wall mirror ${b.dressingTable.mirror.widthMm} x ${b.dressingTable.mirror.heightMm}`, [0, sqft(b.dressingTable.mirror.widthMm, b.dressingTable.mirror.heightMm)], 'mirror'),
    item(`bedside table ${b.bedsideTable.widthMm} long`, [0, rft(b.bedsideTable.widthMm)], 'carpLow'),
  ], 'Nothing if layout A stays (C35). The stool and any acoustic board behind the bed head are not included.') },
  // Owner 2026-10-05: full-height storage at the north end, the mirror dressing cabinet at the south end (was a low cabinet).
  'carp-bedroom3-east': () => priced('low', [
    item(`full-height storage cabinet ${east.north.widthMm} x ${east.north.heightMm}`, sqft(east.north.widthMm, east.north.heightMm), 'carpTall'),
    item(`dressing cabinet ${east.south.widthMm} x ${east.south.heightMm}`, sqft(east.south.widthMm, east.south.heightMm), 'carpTall'),
    item(`overhead run ${east.bridge.widthMm} x ${east.bridge.heightMm}`, sqft(east.bridge.widthMm, east.bridge.heightMm), 'carpTall'),
    item('mirror', sqft(east.south.widthMm, east.south.mirrorTopMm - east.south.mirrorBottomMm), 'mirror'),
    item('headboard shelf', sqft(east.shelf.widthMm, east.shelf.depthMm), 'carpTop'),
  ], 'The slatted AC bay is priced as overhead cabinet front.'),
  'carp-bedroom3-chest': () => priced('medium', [item(`chest ${chest.widthMm} long, six drawers`, rft(chest.widthMm), 'carpLow')], 'The artwork is the owner\'s purchase and is not included.'),
  'carp-kitchen': () => { const k = QUANTITIES.kitchen, uppers = run('east-lower-upper').height + run('east-top-upper').height; return priced('low', [
    item(`base cabinets, ${k.eastRunMm} east + ${k.westRunMm - k.openAppliancesMm} west, 900 high`, sqft(k.eastRunMm + k.westRunMm - k.openAppliancesMm, run('east-base-run').height), 'kitchenBase'),
    item(`wall cabinets, ${k.eastRunMm} east + ${k.westRunMm} west, ${uppers} high in two tiers`, sqft(k.eastRunMm + k.westRunMm, uppers), 'kitchenWall'),
    item('counter', sqft(k.eastRunMm + k.westRunMm, run('east-base-run').depth), 'counter'),
    item('backsplash', sqft(k.eastRunMm + k.westRunMm, BACKSPLASH_HEIGHT), 'backsplash'),
  ], 'Run lengths from the kitchen config. Sink, hob, chimney, dishwasher and other appliances are NOT included.') },
  'carp-kitchen-store': () => priced('low', [
    item(`store unit ${KITCHEN_STORE_STORAGE.widthMm} x ${KITCHEN_STORE_STORAGE.heightMm}`, sqft(KITCHEN_STORE_STORAGE.widthMm, KITCHEN_STORE_STORAGE.heightMm), 'carpTall'),
    item(`sliding cover ${KITCHEN_STORE_STORAGE.slidingCover.widthMm} x ${KITCHEN_STORE_STORAGE.slidingCover.heightMm}`, sqft(KITCHEN_STORE_STORAGE.slidingCover.widthMm, KITCHEN_STORE_STORAGE.slidingCover.heightMm), 'carpShallow'),
    item('pull-out racks', 1, 'pullOut'),
  ], 'The refrigerator is not included.'),
  'carp-office-desk': () => priced('low', [
    item(`moving top ${desk.westAdjustable.widthMm} x ${desk.westAdjustable.depthMm}`, sqft(desk.westAdjustable.widthMm, desk.westAdjustable.depthMm), 'carpTop'),
    item(`fixed top ${desk.southFixed.lengthMm} x ${desk.southFixed.depthMm}`, sqft(desk.southFixed.lengthMm, desk.southFixed.depthMm), 'carpTop'),
    item(`cabinet under the fixed section ${desk.southFixed.lengthMm}`, rft(desk.southFixed.lengthMm), 'carpLow'),
    item(`rear cabinet ${desk.rearCabinet.widthMm}`, rft(desk.rearCabinet.widthMm), 'carpLow'),
  ], 'The sit-stand frame is taken as already owned. The fixed section is cut to the taped room length (A15, A17).'),
  'carp-office-north-cabinet': () => priced('low', [item(`upper cabinet ${north.lower.widthMm} x ${north.upper.heightMm}`, sqft(north.lower.widthMm, north.upper.heightMm), 'carpTall'), item(`shallow book section ${north.lower.widthMm} x ${north.lower.heightMm}`, sqft(north.lower.widthMm, north.lower.heightMm), 'carpShallow')], 'The heater bay may have to be widened (A16).'),
  'carp-lobby-ironing': () => { const s = lobby.furniture.eastIroningStorage; return priced('low', [item(`storage ${s.lengthMm} long`, rft(s.lengthMm), 'carpLow'), ...(s.upper?.toCeiling ? [item(`upper storage ${s.lengthMm} x ${ironingStorageTopMm(lobby) - s.heightMm}`, sqft(s.lengthMm, ironingStorageTopMm(lobby) - s.heightMm), 'carpTall')] : []), item('ironing board', 1, 'ironingFitting')]) },
  'carp-pooja': () => priced('low', [item(`unit across the ${lobby.poojaAlcove.widthMm} alcove, full height`, sqft(lobby.poojaAlcove.widthMm, lobby.heightMm), 'carpTall')], 'No detailed design in the config; stone, brass or carved work is extra.'),
  'carp-study': () => none('The kids layout (bed, desk) has no config of its own yet and is not settled (C25); the bookshelf and the south cabinet already exist.'),
  'carp-window-centre': () => priced('medium', [item(`centre pair ${Math.round(windowBays[1])} x ${transomMm - southWindow.bottomMm}`, sqft(windowBays[1], transomMm - southWindow.bottomMm), 'woodShutter')], 'Sizes from the phone scan.'),
  'ac-window-frame': () => priced('low', [item('angle frame, about', 22, 'msSteel')], `For a casing about ${windowAc.widthMm} x ${windowAc.heightMm} x ${windowAc.depthMm}, ${windowAc.weightKg} kg; the real unit is not measured (A23).`),

  // 7. Paint
  paint: () => priced('medium', [item('walls and ceilings', PAINT_SQFT, 'paint')], 'Eight spaces from the model, less 20 % for openings and cabinets; toilets and balconies not included. Colours from the palette once it is chosen (C42); an accent wall per room costs the same.'),
  'window-wood-finish': () => priced('low', [item('frame and six shutters, both faces', 2 * sqft(southWindow.widthMm, southWindow.topMm - southWindow.bottomMm), 'woodRefinish')], 'Stripping old paint is slow; the outside face needs an exterior finish.'),

  // 8. Fit-out
  'elec-second-fix': () => priced('medium', [item('fit and test', 1, 'testing')], 'The plates and switches are inside the point rates.'),
  'elec-second-fix-other': () => priced('medium', [item('fit and test, rooms', 6, 'testing')], 'Lobby, Bedroom 1, Bedroom 3, Study, Home Office, Main entry. The plates and switches are inside the point rates.'),
  'lights-pooja': () => priced('medium', [item('round panel', 1, 'panelLight')], `One ${lobby.poojaAlcove.ceilingLight?.watts ?? 8} W round surface panel; its switch point is in the Lobby first fix.`),
  'doors-repolish': () => priced('low', [item('doors, both faces, 8 assumed', [0, 8 * 2 * sqft(900, 2100)], 'woodRefinish')], 'Nothing if the palette chosen keeps the doors as they are (C42). The number of wooden doors is not in the model: count them (A28).'),
  'lights-track-drawing': () => trackLights(TRACKS.drawing), 'lights-track-lobby': () => trackLights(TRACKS.lobby), 'lights-track-bedroom1': () => trackLights(TRACKS.bedroom1),
  'lights-track-bedroom3': () => trackLights(TRACKS.bedroom3), 'lights-track-study': () => trackLights(TRACKS.study),
  'lights-track-kitchen': () => trackLights(TRACKS.kitchen, ' The under-cabinet strips are part of the kitchen cabinets.'),
  'plumbing-second-fix': () => none('No plumbing change is listed yet (plumbing-scope).'),
  'tv-mount': () => priced('medium', [item('bracket and mounting', 1, 'tvMount')], 'The TV and the sound system are owned.'),
  'elec-entry-lights': () => priced('medium', [item('round panels', ENTRY_LIGHTING.fittings.length, 'panelLight')]),
  'ac-install': () => priced('medium', [item('1.5 ton split AC', 1, 'acSplit')], 'Tonnage to be confirmed by the dealer; a stabiliser, if needed, is extra.'),
  'ac-window-install': () => priced('low', [item('fitting', 1, 'windowAcFit'), item('glazing panel', 1, 'glazingCut')], 'The AC itself is already owned.'),
  'ac-install-other': () => priced('low', [item('1.5 ton split AC', [0, 1], 'acSplit')], 'Nothing if the Lobby AC is not wanted, or if only its pipes go in now and the machine is bought later (C40).'),
  'window-mosquito-net': () => priced('medium', [item('three nets', sqft(southWindow.widthMm, transomMm - southWindow.bottomMm), 'rollerNet')], 'Sizes from the phone scan.'),
  'lobby-shutter': () => priced('low', [item(`opening ${slidingOpening.widthMm} x ${slidingOpening.heightMm}`, sqft(slidingOpening.widthMm, slidingOpening.heightMm), 'alumSliding')], 'Model sizes (scan: about 3100 x 2445). Toughened fluted glass may not be stocked locally.'),
  'window-outside-chick': () => priced('low', [item('pieces', [2, 3], 'outdoorBlind')], 'After the trial piece; a made-to-measure bamboo chick is in the same range.'),

  // 9. Furnish, snag, handover
  furniture: () => none('It is not recorded which pieces (sofas, table, rug) are bought new and which are already owned.'),
  snag: () => priced('medium', [item('deep clean', 1, 'deepClean')]),
}

const round = (value, up) => { const step = value >= 100000 ? 1000 : 500; return (up ? Math.ceil : Math.floor)(value / step - (up ? 1e-9 : -1e-9)) * step }
const amount = value => value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)
const money = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const lowHigh = quantity => Array.isArray(quantity) ? quantity : [quantity, quantity]

/** The estimate for one task id: {estimateLow, estimateHigh, estimateBasis, estimateConfidence}, or only a basis when it cannot be priced. Null when the id has no estimator. */
export function estimateTask(id) {
  const result = ESTIMATORS[id]?.()
  if (!result) return null
  if (result.none) return {estimateBasis: `Not estimated: ${result.none}`}
  let low = 0, high = 0
  const parts = result.items.map(({what, quantity, rate}) => {
    const {unit, low: rateLow, high: rateHigh} = RATES[rate], [qLow, qHigh] = lowHigh(quantity)
    low += qLow * rateLow; high += qHigh * rateHigh
    const count = qLow === qHigh ? amount(qLow) : `${amount(qLow)} to ${amount(qHigh)}`
    return `${what}: ${count} ${unit} x Rs ${money(rateLow)}-${money(rateHigh)}`
  })
  const basis = [parts.join('; '), result.note].filter(Boolean).join('. ').replace(/\.\.$/, '.')
  return {estimateLow: round(low, false), estimateHigh: round(high, true), estimateBasis: /[.!]$/.test(basis) ? basis : `${basis}.`, estimateConfidence: result.confidence}
}

/** Writes the estimate fields onto every task that has an estimator (in place). Returns the ids of tasks with none. */
export function applyEstimates(plan) {
  const missing = []
  for (const task of plan.tasks) {
    const estimate = estimateTask(task.id)
    if (!estimate) { missing.push(task.id); continue }
    for (const key of ['estimateLow', 'estimateHigh', 'estimateBasis', 'estimateConfidence']) { if (estimate[key] == null) delete task[key]; else task[key] = estimate[key] }
  }
  return missing
}

/**
 * Which rates move the total most: for every rate, the money it carries across the given tasks (quantity x low, x high).
 * A rate that carries Rs X at the high end moves the high total by X/10 for every 10 % it is wrong.
 */
export function rateContributions(taskIds) {
  const totals = new Map()
  for (const id of taskIds) for (const {quantity, rate} of ESTIMATORS[id]?.()?.items ?? []) {
    const [qLow, qHigh] = lowHigh(quantity), row = totals.get(rate) ?? {rate, quantityLow: 0, quantityHigh: 0, low: 0, high: 0, tasks: []}
    row.quantityLow += qLow; row.quantityHigh += qHigh; row.low += qLow * RATES[rate].low; row.high += qHigh * RATES[rate].high; row.tasks.push(id)
    totals.set(rate, row)
  }
  return [...totals.values()].sort((a, b) => b.high - a.high)
}
