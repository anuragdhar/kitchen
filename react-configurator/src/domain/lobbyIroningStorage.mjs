import {mouldingShapes, headPosition} from './drawingLighting.mjs'

// All bounds in room mm: x east, z south, y above floor. heightMm still describes ONLY the original lower unit.
export const ironingStorageTopMm = room => {
  const s = room.furniture.eastIroningStorage
  return s.upper?.toCeiling ? room.heightMm - s.upper.scribeGapMm : s.heightMm
}
export const planGapMm = (a, b) => Math.hypot(Math.max(a.x1 - b.x2, b.x1 - a.x2, 0), Math.max(a.z1 - b.z2, b.z1 - a.z2, 0))
export const boxesMeet = (a, b) => planGapMm(a, b) === 0 && a.bottom <= b.top && b.bottom <= a.top
export function ironingStorageBox(room) {
  const s = room.furniture.eastIroningStorage
  return {x1: room.widthMm - s.depthMm, x2: room.widthMm, z1: s.fromNorthMm, z2: s.fromNorthMm + s.lengthMm, bottom: 0, top: ironingStorageTopMm(room)}
}
export function checkLobbyIroningStorage(room, lighting) {
  const box = ironingStorageBox(room), s = room.furniture.eastIroningStorage, m = lighting.ceilingMouldings
  const mouldings = mouldingShapes(room, m).filter(p => p.kind !== 'medallion').map(p => ({name: p.label, planGapMm: planGapMm(box, p), verticalGapMm: room.heightMm - m.projectionMm - box.top, meets: boxesMeet(box, {...p, bottom: room.heightMm - m.projectionMm, top: room.heightMm})}))
  const track = lighting.tracks.runs.find(r => r.id === 'L2'), half = lighting.tracks.sectionMm / 2
  const trackBox = track.axis === 'z' ? {x1: track.atMm - half, x2: track.atMm + half, z1: track.fromMm, z2: track.toMm} : {x1: track.fromMm, x2: track.toMm, z1: track.atMm - half, z2: track.atMm + half}
  const heads = track.heads.map(h => { const p = headPosition(track, h), reach = s.trackHeadReachMm; return {kind: h.kind, clearanceMm: planGapMm(box, {x1: p.x - reach, x2: p.x + reach, z1: p.z - reach, z2: p.z + reach})} })
  const fans = lighting.ceilingFans.fans.map(f => ({name: f.label, clearanceMm: planGapMm(box, {x1: f.xMm, x2: f.xMm, z1: f.zMm, z2: f.zMm}) - lighting.ceilingFans.bladeDiameterMm / 2, status: lighting.ceilingFans.status}))
  return {box, upperHeightMm: box.top - s.heightMm, mouldings, trackClearanceMm: planGapMm(box, trackBox), heads, fans,
    eastOpeningClearanceMm: room.wallOpenings.east.fromMm - box.z2,
    note: 'Corner ring checked conservatively as its outer rectangle. The scribe gap is OPEN; filling it to the slab needs a moulding cut-out. Head reach and fan size are assumptions.'}
}
