import * as THREE from 'three'
import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import {closedDoorCavityMm} from '../../config/bedroom1ClosedDoor.js'

// Closed Lobby <-> Bedroom 1 door: fibre-cement sheet on the lobby face and a
// shallow medicine cabinet in the cavity behind it, opening into Bedroom 1.
// Built in the Lobby room frame (metres, +z into the lobby, -z into the
// bedroom); the caller cuts the matching hole in the wall. See
// config/bedroom1ClosedDoor.js for the source of every dimension.
export function createBedroom1DoorInfill(door, span, wallThicknessMm) {
  const group = new THREE.Group()
  group.name = 'Closed Bedroom 1 door: cement sheet and medicine cabinet'
  const {cavity} = closedDoorCavityMm(door, wallThicknessMm)
  const {sheet, cabinet: c} = door
  const mm = v => v / 1000
  const t = mm(wallThicknessMm), H = mm(door.heightMm)
  const a = mm(span.start), b = mm(span.end), w = b - a, cx = (a + b) / 2
  const bedroomFace = -t / 2, lobbyFace = t / 2
  const sheetBack = lobbyFace - mm(sheet.thicknessMm)

  const cement = new THREE.MeshStandardMaterial({color: '#b9b7af', roughness: .93})
  const carcassMat = new THREE.MeshStandardMaterial({color: '#c9b9a3', roughness: .72})
  tagSurfaceMaterial(carcassMat, 'wood')
  const frontMat = new THREE.MeshStandardMaterial({color: '#eee8df', roughness: .58})
  tagSurfaceMaterial(frontMat, 'wood')
  const pullMat = new THREE.MeshStandardMaterial({color: '#464b4b', metalness: .58, roughness: .34})

  const box = (parent, width, height, depth, x, y, z, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true
    parent.add(mesh); return mesh
  }

  // Sheet: flush with the lobby wall face, with a small shadow gap all round.
  const gap = mm(sheet.gapMm)
  box(group, w - 2 * gap, H - gap, mm(sheet.thicknessMm), cx, (H - gap) / 2 + gap, lobbyFace - mm(sheet.thicknessMm) / 2, cement)

  // Carcass sits in the cavity between the sheet back and the door plane.
  const doorT = mm(c.doorMm), sideT = mm(c.carcassMm), backT = mm(c.backMm)
  const frontPlane = bedroomFace + doorT
  const backPlane = sheetBack - backT
  const carcassDepth = backPlane - frontPlane
  const carcassZ = (frontPlane + backPlane) / 2
  const innerW = w - 2 * sideT
  box(group, w, H, backT, cx, H / 2, sheetBack - backT / 2, carcassMat)
  for (const x of [a + sideT / 2, b - sideT / 2]) box(group, sideT, H, carcassDepth, x, H / 2, carcassZ, carcassMat)
  for (const y of [sideT / 2, H - sideT / 2]) box(group, innerW, sideT, carcassDepth, cx, y, carcassZ, carcassMat)
  const span1 = H - 2 * sideT
  for (let i = 1; i <= c.shelfCount; i++) {
    box(group, innerW, sideT, carcassDepth, cx, sideT + span1 * i / (c.shelfCount + 1), carcassZ, carcassMat)
  }

  // Flush hinged fronts: hinge on the outer jamb, swing into Bedroom 1 (-z).
  const leaves = []
  const doorGap = mm(c.doorGapMm)
  const leafW = (w - (c.doorCount + 1) * doorGap) / c.doorCount
  for (let i = 0; i < c.doorCount; i++) {
    const hingeLeft = i < c.doorCount / 2
    const left = a + doorGap + i * (leafW + doorGap)
    const pivot = new THREE.Group()
    pivot.position.set(hingeLeft ? left : left + leafW, 0, bedroomFace + doorT / 2)
    box(pivot, leafW, H - 2 * doorGap, doorT, hingeLeft ? leafW / 2 : -leafW / 2, H / 2, 0, frontMat)
    box(pivot, .014, .16, .014, hingeLeft ? leafW - .04 : -leafW + .04, mm(c.handleHeightMm), -doorT / 2 - .007, pullMat)
    group.add(pivot); leaves.push({pivot, sign: hingeLeft ? 1 : -1})
  }
  group.userData.setOpen = open => {
    for (const {pivot, sign} of leaves) pivot.rotation.y = open ? sign * Math.PI * .55 : 0
  }
  group.userData.summary = {cavityMm: cavity, openingMm: Math.round(w * 1000)}
  return group
}
