import test from 'node:test'
import assert from 'node:assert/strict'
import {BALCONY_OFFICE} from '../src/config/balconyOfficeConfig.js'
import {balconyDeskLayout, checkBalconyDesk, movingParts, fixedObstacles, boxClearanceMm, solidSegments} from '../src/domain/balconyDesk.mjs'

const office = BALCONY_OFFICE
const wt = office.worktop
const patched = patch => { const o = structuredClone(office); patch(o); return o }

test('owner defaults of 2026-10-04: 1500 mm sit-stand top, one-inch gap, 743 mm fixed south section at the seated preset', () => {
  assert.equal(wt.movingGapMm, 25)
  assert.equal(wt.westAdjustable.widthMm, 1500)
  assert.equal(wt.westAdjustable.depthMm, 762)
  assert.deepEqual([wt.westAdjustable.minHeightMm, wt.westAdjustable.maxHeightMm, wt.westAdjustable.seatedPresetMm], [737, 1209, 838])
  assert.equal(wt.southFixed.present, true)
  assert.equal(wt.southFixed.lengthMm, 743)
  assert.equal(wt.southFixed.topHeightMm, wt.westAdjustable.seatedPresetMm)
  assert.equal(wt.southFixed.gapToAdjustableMm, 25)
  assert.equal(wt.westAdjustable.widthMm + wt.movingGapMm + wt.southFixed.lengthMm, 2268, 'the run is as long as the old single top')
  assert.equal(wt.rearCabinet.widthMm, 1500)
  assert.deepEqual(wt.rearCabinet.bayLengthsMm, [720, 780])
  assert.equal(wt.westAdjustable.customBeyondRatedWidth, false)
})

test('the layout puts the fixed section in the south corner and the moving top one inch north of it, both an inch off the wall', () => {
  const l = balconyDeskLayout(office)
  assert.equal(l.fixed.zEnd, office.dimensions.lengthMm)
  assert.equal(l.fixed.zStart, 2623 - 743)
  assert.equal(l.moving.zEnd, l.fixed.zStart - 25)
  assert.equal(l.moving.zStart, 355, 'same north edge as the old 2268 mm top')
  assert.deepEqual([l.moving.x0, l.moving.x1], [25, 787])
  assert.deepEqual([l.fixed.x0, l.fixed.x1], [25, 787], 'fronts line up')
  assert.equal(l.fixed.topHeightMm, 838)
  assert.equal(l.moving.zStart - l.northCabinet.lower.depthMm, 228, 'movement clearance to the north cabinet unchanged')
})

test('the frame feet sit 105 mm inside each end of the top and their slots stay inside the rear cabinet end panels', () => {
  const l = balconyDeskLayout(office)
  assert.deepEqual(l.frame.legZ, [460, 1750])
  assert.deepEqual([l.frame.northOverhangMm, l.frame.southOverhangMm], [105, 105])
  assert.ok(l.rear.pocket.start >= l.rear.start + 25 && l.rear.slot.end <= l.rear.end - 25)
  assert.deepEqual(l.rear.bays.map(b => [b.start, b.end]), [[355, 1075], [1075, 1855]])
  assert.ok(l.monitors.standZ > l.rear.chase.start && l.monitors.standZ < l.rear.chase.end, 'the monitor clamp hangs over the chase')
  assert.ok(l.pcTower.zStart >= l.rear.pocket.end && l.pcTower.zEnd < l.rear.bays[0].end, 'PC beside the pocket in the north bay')
  assert.equal(l.laptop.on, 'fixed')
  assert.ok(l.fixed.printer && l.fixed.printer.y1 < l.fixed.cabinet.y1)
})

test('the moving top, its beam and the clamp clear the fixed section, walls and cabinets by an inch over the whole height range', () => {
  const r = checkBalconyDesk(office)
  assert.deepEqual(r.issues, [])
  assert.equal(r.ok, true)
  const worst = Object.fromEntries(r.clearances.map(c => [`${c.moving} / ${c.obstacle}`, c.clearanceMm]))
  assert.equal(worst['sit-stand top / fixed section top'], 25)
  assert.equal(worst['sit-stand top / fixed section cabinet'], 25)
  assert.equal(worst['sit-stand top / west wall'], 25)
  assert.ok(worst['sit-stand top / rear cabinet top rail'] >= 25)
  assert.ok(worst['frame beam / rear cabinet divider 1'] >= 25, 'the divider stops under the beam at the lowest height')
  assert.ok(worst['frame beam / PC tower'] >= 25)
  assert.ok(r.clearances.every(c => c.clearanceMm >= c.requiredMm))
})

test('the check catches a gap under an inch, a top outside the frame range, a fixed section at the wrong height and a moving top into the wall', () => {
  const bad = patch => checkBalconyDesk(patched(patch)).issues.join(' | ')
  assert.match(bad(o => { o.worktop.movingGapMm = 10; o.worktop.westAdjustable.southClearanceMm = 10; o.worktop.westAdjustable.wallClearanceMm = 10 }), /one inch/)
  assert.match(bad(o => { o.worktop.westAdjustable.southClearanceMm = 5 }), /fixed section/)
  assert.match(bad(o => { o.worktop.westAdjustable.wallClearanceMm = 0 }), /west wall/)
  assert.match(bad(o => { o.worktop.westAdjustable.widthMm = 2268 }), /frame maker/)
  assert.match(bad(o => { o.worktop.southFixed.topHeightMm = 700 }), /outside the sit-stand range/)
  assert.match(bad(o => { o.worktop.southFixed.topHeightMm = 900 }), /seated preset/)
  assert.match(bad(o => { o.worktop.rearCabinet.topHeightMm = 760 }), /rear cabinet/)
  assert.match(bad(o => { o.worktop.westAdjustable.frameOffsetSouthMm = 80 }), /slot cuts the rear cabinet end panel/)
  assert.match(bad(o => { o.equipment.monitorStand.shiftLeftMm = 900 }), /monitor/)
})

test('without a fixed section the moving top runs to the south wall and the laptop goes back on it', () => {
  const l = balconyDeskLayout(patched(o => { o.worktop.southFixed.present = false; o.worktop.westAdjustable.southClearanceMm = 0 }))
  assert.equal(l.fixed, null)
  assert.equal(l.moving.zEnd, office.dimensions.lengthMm)
  assert.equal(l.laptop.on, 'moving')
})

test('box helpers: solid runs around openings, and clearance is the axis gap or negative on overlap', () => {
  assert.deepEqual(solidSegments(0, 100, [{start: 20, end: 30}, [50, 60]]), [[0, 20], [30, 50], [60, 100]])
  assert.deepEqual(solidSegments(0, 100, [[-10, 10], [90, 120]]), [[10, 90]])
  const a = {x0: 0, x1: 10, y0: 0, y1: 10, z0: 0, z1: 10}
  assert.equal(boxClearanceMm(a, {x0: 15, x1: 20, y0: 0, y1: 10, z0: 0, z1: 10}), 5)
  assert.equal(boxClearanceMm(a, {x0: 5, x1: 20, y0: 5, y1: 20, z0: 5, z1: 20}), -5)
  assert.ok(Math.abs(boxClearanceMm(a, {x0: 13, x1: 20, y0: 0, y1: 10, z0: 14, z1: 20}) - 5) < 1e-9)
  const l = balconyDeskLayout(office)
  assert.ok(movingParts(l, 838).some(p => p.name === 'sit-stand top' && p.y1 === 838))
  assert.ok(fixedObstacles(l).some(p => p.name === 'fixed section top'))
})

test('the phone scan of 2026-10-04 is recorded, not applied: room box and envelope unchanged, scanned plates listed', () => {
  assert.deepEqual([office.dimensions.widthMm, office.dimensions.lengthMm, office.dimensions.floorToCeilingMm], [1200, 2623, 2642])
  assert.deepEqual([office.envelope.lowerBrickParapetMm, office.envelope.windowBandMm, office.envelope.upperBrickBandMm], [991, 1346, 305])
  assert.equal(office.survey.lengthMm, 2460)
  assert.equal(office.survey.existingDesk.topHeightMm, 840)
  assert.equal(office.electrical.scannedWallPoints.length, 3)
  assert.ok(office.electrical.scannedWallPoints.every(p => p.wall === 'north' && p.fromWestMm[0] < p.fromWestMm[1] && p.heightMm[0] < p.heightMm[1]))
  assert.equal(office.access.side, 'east')
  assert.equal(office.electrical.totals.existingFixedOutlets, 2)
})
