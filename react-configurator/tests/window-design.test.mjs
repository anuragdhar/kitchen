import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {windowBays, windowGeometry, checkWindowDesign} from '../src/domain/windowDesign.mjs'
import {buildRoomReview} from '../src/domain/roomReview.mjs'

const drawing = EMPTY_ROOM_SHELLS.drawing, win = drawing.windows[0]
const b3 = EMPTY_ROOM_SHELLS.bedroom3, balcony = b3.southExtension.balcony

test('Drawing Room south window: scanned frame, three bays, transom and the decided additions', () => {
  assert.deepEqual([win.fromMm, win.widthMm, win.bottomMm, win.topMm], [233, 2700, 935, 2430])
  const g = windowGeometry(win)
  assert.equal(g.designed, true)
  assert.deepEqual(g.bays.map(b => b.widthMm), [934.2, 899.1, 866.7])
  assert.deepEqual(g.bays.map(b => [b.fromMm, b.toMm]), [[233, 1167.2], [1167.2, 2066.3], [2066.3, 2933]])
  assert.equal(g.transomMm, 2040)
  assert.equal(g.topLightHeightMm, 390)
  assert.equal(g.shutterHeightMm, 1105)
  assert.equal(g.leaves.length, 6, 'two outward shutters per bay, six in all')
  assert.ok(g.leaves.every(l => l.bottomMm === 935 && l.topMm === 2040))
  assert.equal(g.bays[1].wasFixed, true)
  assert.equal(win.shutters.opens, 'outward')
  assert.equal(g.rollerNets.length, 3, 'a roller net per section')
  assert.ok(g.rollerNets.every(n => n.cassette === 'top' && n.underMm === 2040))
  assert.deepEqual([g.outsideScreen.rollDiameterMm, g.outsideScreen.offsetMm, g.outsideScreen.widthMm, g.outsideScreen.dropMm], [100, 85, 2500, 1700])
  assert.equal(g.outsideScreen.parkedCenterHeightMm, 2370, 'the roll parks in front of the top band, under the head')
  assert.deepEqual([win.frameStyle, win.frameColor], ['wood', drawing.southLayout.wallPanel.color], 'wood shade proposed to match the TV panel wall')
  assert.deepEqual(checkWindowDesign(win).issues, [])
})

test('a window without design fields is a plain frame: no bays design, no leaves, no nets', () => {
  const plain = {wall: 'south', fromMm: 471, widthMm: 2298, bottomMm: 550, topMm: 2100, frameStyle: 'dark', mullionFractions: [.62]}
  const g = windowGeometry(plain)
  assert.equal(g.designed, false)
  assert.deepEqual(windowBays(plain).map(b => b.widthMm), [1424.8, 873.2])
  assert.deepEqual([g.leaves, g.rollerNets, g.outsideScreen, g.transomMm], [[], [], null, null])
  assert.deepEqual(checkWindowDesign(plain).issues, [])
  const single = windowBays({fromMm: 0, widthMm: 1000, bottomMm: 900, topMm: 2000})
  assert.deepEqual(single, [{index: 0, fromMm: 0, toMm: 1000, widthMm: 1000, shutters: 0, wasFixed: false}])
})

test('the checker rejects a transom outside the frame, a bay count mismatch and a screen roll that does not park', () => {
  const t = structuredClone(win); t.transomMm = 2500
  assert.ok(checkWindowDesign(t).issues.some(m => /transom 2500/.test(m)))
  const b = structuredClone(win); b.bays = [{shutters: 2}]
  assert.ok(checkWindowDesign(b).issues.some(m => /1 bay entries for 3 bays/.test(m)))
  const s = structuredClone(win); s.outsideScreen.rollDiameterMm = 400
  assert.ok(checkWindowDesign(s).issues.some(m => /parked screen roll/.test(m)))
  const narrow = structuredClone(win); narrow.bays[0].shutters = 5
  assert.ok(checkWindowDesign(narrow).issues.some(m => /narrower than 250/.test(m)))
})

test('Bedroom 3 south side as scanned: wardrobe bay, balcony door and window with top lights and a mid rail', () => {
  assert.deepEqual([b3.widthMm, b3.lengthMm, b3.heightMm], [3963, 3726, 2700], 'the room box is not changed by the scan')
  const cab = b3.southExtension.cabinet
  assert.deepEqual([cab.fromWestMm, cab.widthMm, cab.heightMm], [365, 1540, 2450])
  assert.equal(cab.fromWestMm + cab.widthMm, balcony.fromWestMm, 'the balcony floor starts where the wardrobe bay ends')
  assert.equal(balcony.fromWestMm + balcony.widthMm, b3.widthMm)
  assert.deepEqual([balcony.doorFromWestMm, balcony.doorWidthMm, balcony.doorHeightMm, balcony.doorTransomMm], [2005, 700, 2360, 2040])
  assert.deepEqual([balcony.windowFromWestMm, balcony.windowWidthMm, balcony.windowSillMm, balcony.windowTopMm, balcony.windowTransomMm, balcony.windowRailsMm], [2785, 920, 920, 2360, 1910, [1350]])
  assert.ok(balcony.doorFromWestMm + balcony.doorWidthMm < balcony.windowFromWestMm, 'a mullion separates the door and the window')
  assert.equal(b3.widthMm - (balcony.windowFromWestMm + balcony.windowWidthMm), 258, 'solid wall east of the window')
  const w = windowGeometry({fromMm: balcony.windowFromWestMm, widthMm: balcony.windowWidthMm, bottomMm: balcony.windowSillMm, topMm: balcony.windowTopMm, transomMm: balcony.windowTransomMm, railsMm: balcony.windowRailsMm})
  assert.equal(w.designed, true)
  assert.deepEqual([w.transomMm, w.topLightHeightMm, w.railsMm], [1910, 450, [1350]])
  assert.deepEqual(w.leaves, [], 'no shutters are recorded for the Bedroom 3 window')
  const d = windowGeometry({fromMm: balcony.doorFromWestMm, widthMm: balcony.doorWidthMm, bottomMm: 0, topMm: balcony.doorHeightMm, transomMm: balcony.doorTransomMm})
  assert.equal(d.topLightHeightMm, 320)
  assert.deepEqual(windowGeometry({fromMm: 0, widthMm: 1000, bottomMm: 900, topMm: 2000, railsMm: [500, 2500]}).railsMm, [], 'rails outside the frame are ignored')
})

test('Bedroom 3 design check against the scan: toilet door, corner cupboard, AC unit and the east cabinetry', () => {
  const c = b3.furniture.eastCabinet, toilet = b3.doors[1], e = b3.existing
  assert.deepEqual([toilet.fromMm, toilet.widthMm, toilet.heightMm], [2525, 780, 2000])
  // Owner 2026-10-05: the north unit is now the full-height storage cabinet (the dressing moved to the south end); its own
  // depthMm is the run's 18 in, so the clearance is unchanged.
  const northUnitWest = b3.widthMm - c.north.depthMm
  assert.equal(Math.round(northUnitWest - (toilet.fromMm + toilet.widthMm)), 201, 'the north full-height storage cabinet clears the scanned toilet door by 201 mm (it was 44 mm into the plan door)')
  assert.ok(e.northEastCupboard.fromWestMm <= northUnitWest && c.north.fromNorthMm + c.north.widthMm <= e.northEastCupboard.lengthMm, 'the new north unit lies inside the existing cupboard footprint: it replaces it')
  const bayWest = c.ac.centerFromNorthMm - c.ac.bayWidthMm / 2, bayEast = c.ac.centerFromNorthMm + c.ac.bayWidthMm / 2
  assert.ok(e.acUnit.fromNorthMm >= bayWest && e.acUnit.fromNorthMm + e.acUnit.widthMm <= bayEast, 'the existing AC unit sits inside the slatted bay')
  assert.ok(e.acUnit.bottomMm >= c.bridge.bottomMm && e.acUnit.topMm <= c.bridge.bottomMm + c.bridge.heightMm - c.panelMm, 'and between the bay bottom and the top panel')
  assert.ok(e.acUnit.depthMm + c.ac.wallGapMm < c.depthMm - c.panelMm)
  assert.ok(c.bridge.fromNorthMm + c.bridge.widthMm <= b3.lengthMm)
  const review = buildRoomReview({roomKey: 'bedroom3', room: b3})
  assert.match(review.text, /glass door x 2005-2705 \(2360 mm high, top light above 2040 mm\)/)
  assert.match(review.text, /corner cupboard x 3273-3963/)
  const drawingReview = buildRoomReview({roomKey: 'drawing', room: drawing})
  assert.match(drawingReview.text, /3 bays of 934.2 \/ 899.1 \/ 866.7 mm, fixed top lights above a transom at 2040 mm, 6 outward shutters/)
})
