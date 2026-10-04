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

test('Bedroom 3 balcony as scanned: enclosed, merged with the room under a beam, window on the outer wall', () => {
  assert.deepEqual([b3.widthMm, b3.lengthMm, b3.heightMm], [3963, 3726, 2700], 'the room box is not changed by the scan')
  assert.equal(balcony.enclosed, true)
  assert.deepEqual([balcony.fromWestMm, balcony.widthMm, balcony.depthMm, balcony.ceilingMm], [1538, 2425, 1065, 2690])
  assert.equal(balcony.fromWestMm + balcony.widthMm, b3.widthMm, 'the balcony ends at the east wall line')
  assert.equal(b3.southExtension.cabinet.fromWestMm + b3.southExtension.cabinet.widthMm, balcony.fromWestMm, 'the cabinet bay ends at the balcony west wall')
  assert.deepEqual(balcony.opening, {fromWestMm: 1538, toMm: 3385, headMm: 2440})
  assert.equal(balcony.opening.toMm - balcony.opening.fromWestMm, 1847)
  assert.equal(balcony.beam.undersideMm, balcony.opening.headMm)
  assert.equal(balcony.eastColumn.fromWestMm + 238, b3.widthMm)
  const w = balcony.outerWindow
  assert.deepEqual([w.fromWestMm, w.widthMm, w.sillMm, w.topMm], [2725, 1238, 1060, 2060])
  assert.equal(w.fromWestMm + w.widthMm, b3.widthMm, 'the window frame reaches the east wall')
  assert.deepEqual(windowBays({...w, fromMm: w.fromWestMm, bottomMm: w.sillMm}).map(b => b.widthMm), [619, 619])
  for (const key of ['doorFromWestMm', 'windowFromWestMm']) assert.equal(balcony[key], undefined, 'the old door and window on the room line are gone')
})

test('Bedroom 3 east cabinetry stays clear of the balcony opening, and the review describes the enclosed balcony', () => {
  const c = b3.furniture.eastCabinet
  const stub = b3.widthMm - balcony.opening.toMm
  assert.equal(stub, 578, '340 mm of wall plus the 238 mm column remain on the room line at the east end')
  assert.ok(c.depthMm < stub, 'the 457.2 mm deep cabinets stand against the wall stub, not in the opening')
  assert.ok(c.bridge.fromNorthMm + c.bridge.widthMm <= b3.lengthMm)
  const review = buildRoomReview({roomKey: 'bedroom3', room: b3})
  assert.match(review.text, /ENCLOSED balcony merged with the room/)
  assert.match(review.text, /x 1538-3385/)
  const drawingReview = buildRoomReview({roomKey: 'drawing', room: drawing})
  assert.match(drawingReview.text, /3 bays of 934.2 \/ 899.1 \/ 866.7 mm, fixed top lights above a transom at 2040 mm, 6 outward shutters/)
})
