import * as THREE from 'three'
import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import {windowGeometry} from '../../domain/windowDesign.mjs'

// Shared window / glass-door builder for the room shells (EmptyRoomGallery, Bedroom 3 balcony, Whole home 3D).
// Works in room-frame METRES: x along a north or south wall from the west end, y up, z the wall plane.
// `opening` has from/to/bottom/top in metres (as the gallery's openingsFor builds them), kind 'window' or 'glassDoor',
// frameStyle, mullionFractions and, optionally, `design`: the millimetre config entry with the design fields read by
// src/domain/windowDesign.mjs (transom and top lights, shutters per bay, roller nets, outside screen).
// Without `design` the output is exactly the plain frame the gallery drew before (glass, jambs, mullions, sill, head).
// `outward` is +1 for a south wall (outside is +z) and -1 for a north wall.
const woodMaterials = new Map()
function woodMaterial(color) {
  if (!woodMaterials.has(color)) {
    const material = new THREE.MeshStandardMaterial({color, roughness: .58})
    tagSurfaceMaterial(material, 'wood')
    woodMaterials.set(color, material)
  }
  return woodMaterials.get(color)
}

export function createWindowDetail(opening, {z, outward = 1, materials}) {
  const group = new THREE.Group(); group.name = `${opening.kind || 'window'} detail`
  const {frame, darkFrame, glass, handle} = materials
  const design = opening.design
  const windowFrame = opening.frameStyle === 'dark' ? darkFrame : opening.frameStyle === 'wood' || design?.frameColor ? woodMaterial(design?.frameColor || '#a47a52') : frame
  const width = opening.to - opening.from, center = (opening.from + opening.to) / 2
  const h = opening.top - opening.bottom, midY = (opening.top + opening.bottom) / 2
  const box = (w, hh, d, x, y, zz, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), material)
    mesh.position.set(x, y, zz); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh
  }
  box(width - .06, h - .06, .025, center, midY, z, glass)
  for (const x of [opening.from + .025, ...(opening.mullionFractions || [.5]).map(fraction => opening.from + width * fraction), opening.to - .025]) box(.05, h, .065, x, midY, z, windowFrame)
  for (const y of [opening.bottom + .025, opening.top - .025]) box(width, .05, .065, center, y, z, windowFrame)
  if (opening.kind === 'glassDoor') box(.025, .18, .05, opening.from + width * .8, 1.05, z - .055 * outward, handle)
  if (!design) return group

  // Design layer (all from the millimetre config through windowGeometry): transom, shutter leaves, nets, screen.
  const mm = v => v / 1000, g = windowGeometry(design), wallFrom = opening.from - mm(design.fromMm)
  const X = v => wallFrom + mm(v)
  if (g.transomMm) box(width, .05, .065, center, mm(g.transomMm), z, windowFrame)
  const leafFace = z + .018 * outward, stile = .045
  for (const leaf of g.leaves) {
    const lw = mm(leaf.toMm - leaf.fromMm), lx = X((leaf.fromMm + leaf.toMm) / 2), lb = mm(leaf.bottomMm) + .05, lt = mm(leaf.topMm) - .05, lh = lt - lb
    for (const x of [X(leaf.fromMm) + stile / 2 + .004, X(leaf.toMm) - stile / 2 - .004]) box(stile, lh, .035, x, (lb + lt) / 2, leafFace, windowFrame)
    for (const y of [lb + stile / 2, lt - stile / 2]) box(lw - .008, stile, .035, lx, y, leafFace, windowFrame)
    box(lw - .008, .09, .035, lx, lb + lh * .42, leafFace, windowFrame) // lock rail
    // The handle sits on the meeting stile: the stile away from the bay's own edge.
    const atBayWest = Math.abs(leaf.fromMm - g.bays[leaf.bay].fromMm) < 1
    const meetingStile = atBayWest ? X(leaf.toMm) - stile - .01 : X(leaf.fromMm) + stile + .01
    box(.018, .1, .02, meetingStile, lb + lh * .42 + .09, leafFace - .02 * outward, handle)
  }
  for (const net of g.rollerNets) {
    const nw = mm(net.toMm - net.fromMm) - .02, nx = X((net.fromMm + net.toMm) / 2), c = mm(net.cassetteMm)
    if (net.cassette === 'top') box(nw, c, c, nx, mm(net.underMm) - .05 - c / 2, z - (.05 + c / 2) * outward, darkFrame)
    else box(c, mm(net.underMm - g.sillMm) - .1, c, X(net.fromMm) + .025 + c / 2, mm((net.underMm + g.sillMm) / 2), z - (.05 + c / 2) * outward, darkFrame)
  }
  if (g.outsideScreen) {
    const s = g.outsideScreen, r = mm(s.rollDiameterMm) / 2
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(r, r, mm(s.widthMm), 18), woodMaterial('#c9a46a'))
    roll.rotation.z = Math.PI / 2; roll.position.set(X(s.centerMm), mm(s.parkedCenterHeightMm), z + (.05 + mm(s.offsetMm) + r) * outward)
    roll.castShadow = true; group.add(roll)
    for (const x of [X(s.centerMm) - mm(s.widthMm) / 2 + .06, X(s.centerMm) + mm(s.widthMm) / 2 - .06]) box(.03, .03, mm(s.offsetMm) + r, x, mm(s.parkedCenterHeightMm) + r, z + (.05 + (mm(s.offsetMm) + r) / 2) * outward, handle)
  }
  return group
}
