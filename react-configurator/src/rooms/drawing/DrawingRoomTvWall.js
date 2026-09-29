import * as THREE from 'three'
import {tvWallGeometry} from '../../domain/drawingRoomLayout.mjs'

// North-wall TV cabinet for the Drawing Room (owner brief 2026-09-29, plan in
// docs/DRAWING_ROOM_TV_WALL.md). Every dimension comes from room.tvWall.
// Room frame in metres: x from the west wall, z from the north wall, y up; the
// cabinet back sits `insetMm` off the wall centre line (half the drawn wall).
export function createDrawingRoomTvWall(room, {insetMm = 0} = {}) {
  const w = room.tvWall, g = tvWallGeometry(room), p = w.panelMm, D = w.depthMm, H = w.heightMm
  const X0 = w.fromWestMm, W = w.widthMm, colW = w.columnWidthMm
  const group = new THREE.Group(); group.name = 'Drawing Room TV wall cabinet'
  group.position.set(insetMm / 1000, 0, insetMm / 1000)

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .62, ...extra})
  // Deliberately not tagged as a Materials-panel 'wood' surface: the owner's references are dark walnut.
  const carcass = mat('#6a4429')
  const doorPanel = mat('#4d3220', {roughness: .7})
  const bars = mat('#8a5b37', {roughness: .55})
  const inside = mat('#2e2118', {roughness: .85})
  const black = mat('#1f2124', {roughness: .45, metalness: .3})
  const screen = mat('#101a20', {roughness: .2, metalness: .2, emissive: '#142c34', emissiveIntensity: .2})
  const grille = mat('#3a3d40', {roughness: .9})
  const white = mat('#e9ecee', {roughness: .5})
  const led = new THREE.MeshBasicMaterial({color: '#7bd88f'})
  const glass = mat('#15181b', {roughness: .1, metalness: .4})

  const box = (parent, sx, sy, sz, cx, cy, cz, material, cast = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx / 1000, sy / 1000, sz / 1000), material)
    mesh.position.set(cx / 1000, cy / 1000, cz / 1000); mesh.castShadow = cast; mesh.receiveShadow = true
    parent.add(mesh); return mesh
  }
  const shell = new THREE.Group(); shell.name = 'cabinet carcass'; group.add(shell)
  const devices = new THREE.Group(); devices.name = 'devices'; group.add(devices)

  // Carcass: back, sides, top, recessed plinth, deck and two dividers.
  box(shell, W, H, w.backMm, X0 + W / 2, H / 2, w.backMm / 2, inside)
  for (const x of [X0 + p / 2, X0 + W - p / 2]) box(shell, p, H, D, x, H / 2, D / 2, carcass)
  box(shell, W, p, D, X0 + W / 2, H - p / 2, D / 2, carcass)
  box(shell, W - 2 * p, w.plinthMm, D - 60, X0 + W / 2, w.plinthMm / 2, (D - 60) / 2, inside)
  box(shell, W - 2 * p, p, D, X0 + W / 2, w.plinthMm + p / 2, D / 2, carcass)
  const westDividerX = X0 + colW - p / 2, eastDividerX = X0 + W - colW + p / 2
  for (const x of [westDividerX, eastDividerX]) box(shell, p, H - w.plinthMm - 2 * p, D, x, (w.plinthMm + p + H - p) / 2, D / 2, carcass)

  // Shelves: TV bay floor, header above the bay, and each niche floor and ceiling.
  const bayX0 = X0 + colW, bayX1 = X0 + W - colW
  box(shell, g.bayWidth, p, D, (bayX0 + bayX1) / 2, w.bay.floorMm - p / 2, D / 2, carcass)
  box(shell, g.bayWidth, w.router.shelfMm - w.bay.topMm, D, (bayX0 + bayX1) / 2, (w.bay.topMm + w.router.shelfMm) / 2, D / 2, carcass)
  const west = {x0: X0 + p, x1: westDividerX - p / 2}, east = {x0: eastDividerX + p / 2, x1: X0 + W - p}
  const nicheX = c => (c.x0 + c.x1) / 2
  box(shell, east.x1 - east.x0, p, D, nicheX(east), w.phones.shelfMm - p / 2, D / 2, carcass)
  box(shell, east.x1 - east.x0, p, D, nicheX(east), w.phones.nicheTopMm + p / 2, D / 2, carcass)

  // Fronts: dark panels with a light lattice over them, flush with the cabinet face.
  const front = D - 4
  const door = (x0, x1, y0, y1, pitch = 70) => {
    const wd = x1 - x0 - 6, ht = y1 - y0 - 6, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    if (wd < 40 || ht < 40) return
    box(group, wd, ht, p, cx, cy, front - p / 2, doorPanel)
    const cols = Math.max(1, Math.round(wd / pitch)), rows = Math.max(1, Math.round(ht / pitch))
    for (let i = 0; i <= cols; i++) box(group, 7, ht - 16, 6, x0 + 3 + 8 + (wd - 16) * i / cols, cy, front + 3, bars, false)
    for (let j = 0; j <= rows; j++) box(group, wd - 16, 7, 6, cx, y0 + 3 + 8 + (ht - 16) * j / rows, front + 2.5, bars, false)
  }
  const deck = w.plinthMm + p
  door(west.x0, west.x1, deck, H - p)
  door(east.x0, east.x1, deck, w.phones.shelfMm - p)
  door(east.x0, east.x1, w.phones.nicheTopMm + p, H - p)
  const mid = (bayX0 + bayX1) / 2
  door(mid, bayX1, deck, w.bay.floorMm - p)
  door(bayX0, mid, w.router.topMm, H - p)
  door(mid, bayX1, w.router.topMm, H - p)
  // West half of the base is an open lattice so the Bass Module can breathe and be heard.
  const baseH = w.bay.floorMm - p - deck, baseY = (deck + w.bay.floorMm - p) / 2
  for (let i = 0; i <= 11; i++) box(group, 7, baseH - 6, 6, bayX0 + 8 + (mid - bayX0 - 16) * i / 11, baseY, front + 3, bars, false)
  for (let j = 0; j <= 7; j++) box(group, mid - bayX0 - 16, 7, 6, (bayX0 + mid) / 2, deck + 6 + (baseH - 12) * j / 7, front + 2.5, bars, false)
  // Router bay: open lattice only, so Wi-Fi and heat pass freely.
  const routerH = w.router.topMm - w.router.shelfMm, routerY = (w.router.topMm + w.router.shelfMm) / 2
  for (let i = 0; i <= 25; i++) box(group, 7, routerH - 4, 6, bayX0 + 8 + (g.bayWidth - 16) * i / 25, routerY, front + 3, bars, false)
  for (const y of [w.router.shelfMm + 4, routerY, w.router.topMm - 4]) box(group, g.bayWidth - 16, 7, 6, mid, y, front + 2.5, bars, false)

  // TV: 65-inch panel set back from the face so the frame hides the bezel.
  const tvZ = D - w.tv.setbackMm - w.tv.depthMm / 2
  box(devices, w.tv.widthMm, w.tv.heightMm, w.tv.depthMm, g.bayCenterX, g.tvCenterY, tvZ, black)
  box(devices, w.tv.widthMm - 24, w.tv.heightMm - 24, 3, g.bayCenterX, g.tvCenterY, D - w.tv.setbackMm + 1.5, screen, false)
  box(devices, 220, 160, D - w.backMm - w.tv.setbackMm - w.tv.depthMm, g.bayCenterX, g.tvCenterY, (w.backMm + D - w.tv.setbackMm - w.tv.depthMm) / 2, black)

  // Soundbar on the bay floor, in front of the TV's lower edge (its top stays under the TV).
  const sbZ = D - w.soundbar.frontSetbackMm - w.soundbar.depthMm / 2
  box(devices, w.soundbar.widthMm, w.soundbar.heightMm, w.soundbar.depthMm, g.bayCenterX, w.bay.floorMm + w.soundbar.heightMm / 2, sbZ, black)
  box(devices, w.soundbar.widthMm - 12, w.soundbar.heightMm - 14, 2, g.bayCenterX, w.bay.floorMm + w.soundbar.heightMm / 2, D - w.soundbar.frontSetbackMm + 1, grille, false)

  // Bose Bass Module 500: on the base deck, west half of the centre base, behind the open lattice.
  const bm = w.bassModule, bmX = g.bayWest + g.bayWidth * bm.centerFromBayWestFraction, bmZ = D - bm.frontGapMm - bm.depthMm / 2
  box(devices, bm.widthMm, bm.heightMm, bm.depthMm, bmX, deck + bm.heightMm / 2, bmZ, black)
  box(devices, bm.widthMm - 30, bm.heightMm - 30, 2, bmX, deck + bm.heightMm / 2, bmZ + bm.depthMm / 2 + 1, grille, false)

  // Landline base and handset on the east niche shelf; intercom on the niche back wall.
  const ph = w.phones, ll = ph.landline, phX = nicheX(east)
  box(devices, ll.widthMm, ll.heightMm, ll.depthMm, phX, ph.shelfMm + ll.heightMm / 2, D - 60 - ll.depthMm / 2, white)
  box(devices, ll.widthMm - 40, 25, ll.depthMm - 30, phX, ph.shelfMm + ll.heightMm + 12, D - 60 - ll.depthMm / 2, white)
  box(devices, ll.widthMm - 60, 4, 50, phX, ph.shelfMm + ll.heightMm - 20, D - 60 - ll.depthMm + 14, glass, false)
  const ic = ph.intercom
  box(devices, ic.widthMm, ic.heightMm, ic.depthMm, phX, ic.bottomMm + ic.heightMm / 2, w.backMm + ic.depthMm / 2, white)
  box(devices, ic.widthMm - 40, ic.heightMm * .45, 2, phX, ic.bottomMm + ic.heightMm * .62, w.backMm + ic.depthMm + 1, glass, false)
  box(devices, 30, 6, 2, phX, ic.bottomMm + ic.heightMm * .2, w.backMm + ic.depthMm + 1, led, false)

  // Router on the shelf above the bay, antennas up, behind the lattice.
  const rt = w.router, rtZ = D - 90 - rt.depthMm / 2
  box(devices, rt.widthMm, rt.heightMm, rt.depthMm, mid, rt.shelfMm + rt.heightMm / 2, rtZ, white)
  for (const dx of [-rt.widthMm / 2 + 25, rt.widthMm / 2 - 25]) box(devices, 10, rt.antennaMm, 10, mid + dx, rt.shelfMm + rt.heightMm + rt.antennaMm / 2, rtZ - rt.depthMm / 2 + 20, white)
  box(devices, 8, 4, 2, mid - 60, rt.shelfMm + rt.heightMm / 2, rtZ + rt.depthMm / 2 + 1, led, false)

  // Labels for the plan (toggle with setLabels).
  const labels = new THREE.Group(); labels.name = 'TV wall labels'; group.add(labels)
  const label = (text, xMm, yMm) => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
    const c = canvas.getContext('2d')
    c.fillStyle = 'rgba(20,24,28,.86)'; c.beginPath(); c.roundRect(4, 4, 504, 88, 18); c.fill()
    c.fillStyle = '#fff'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 50)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
    sprite.scale.set(.62, .116, 1); sprite.position.set(xMm / 1000, yMm / 1000, (D + 260) / 1000); sprite.renderOrder = 10
    labels.add(sprite)
  }
  label('65" TV', g.bayCenterX, g.tvTopMm + 120)
  label('Soundbar 300', g.bayCenterX, w.bay.floorMm - 90)
  label('Bass Module 500', bmX - 60, 260)
  label('Landline + intercom', nicheX(east) - 120, ph.nicheTopMm + 110)
  label('Wi-Fi router', mid, w.router.topMm + 110)
  labels.visible = false
  group.userData.setLabels = visible => { labels.visible = visible }
  group.userData.archvizExclude = false
  return group
}
