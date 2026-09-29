import * as THREE from 'three'
import {cornerTvFrontX} from '../../domain/drawingRoomLayout.mjs'

// Layout B built-ins: the 65-inch TV wall-mounted on the solid stretch of the east wall, the
// Soundbar 300 on the wall under it, the Bass Module 500 on the floor beneath, and a small
// wall-hung cabinet above the north-wall sofa holding the router, landline and intercom.
// Room frame in millimetres inside, metres in the scene: x from the west wall, z from the north wall.
// `wallFaceMm` is the distance from the room's nominal wall line to its drawn inside face.
export function createDrawingRoomCornerTv(room, {wallFaceMm = 0} = {}) {
  const c = room.cornerLayout, tv = c.tv, sb = c.soundbar, bm = c.bassModule, rc = c.routerCabinet
  const eastFace = room.widthMm - wallFaceMm
  const group = new THREE.Group(); group.name = 'Drawing Room corner layout: east-wall TV and north cabinet'

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .62, ...extra})
  const carcass = mat('#6a4429'), bars = mat('#8a5b37', {roughness: .55}), inside = mat('#2e2118', {roughness: .85})
  const black = mat('#1f2124', {roughness: .45, metalness: .3})
  const screen = mat('#101a20', {roughness: .2, metalness: .2, emissive: '#142c34', emissiveIntensity: .2})
  const grille = mat('#3a3d40', {roughness: .9}), white = mat('#e9ecee', {roughness: .5}), glass = mat('#15181b', {roughness: .1, metalness: .4})
  const led = new THREE.MeshBasicMaterial({color: '#7bd88f'})
  const bias = mat('#fff7e7', {emissive: '#ffd9a1', emissiveIntensity: .48, roughness: .95}); bias.userData.taskLightGlow = true
  const box = (sx, sy, sz, cx, cy, cz, material, cast = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx / 1000, sy / 1000, sz / 1000), material)
    mesh.position.set(cx / 1000, cy / 1000, cz / 1000); mesh.castShadow = cast; mesh.receiveShadow = true
    group.add(mesh); return mesh
  }

  // TV: thickness along x, width along z; the screen faces west into the room.
  const tvBackX = eastFace - tv.mountMm
  box(tv.depthMm, tv.heightMm, tv.widthMm, tvBackX - tv.depthMm / 2, tv.bottomMm + tv.heightMm / 2, tv.centerFromNorthMm, black)
  box(3, tv.heightMm - 24, tv.widthMm - 24, tvBackX - tv.depthMm - 1.5, tv.bottomMm + tv.heightMm / 2, tv.centerFromNorthMm, screen, false)
  box(tv.mountMm, 180, 260, eastFace - tv.mountMm / 2, tv.bottomMm + tv.heightMm / 2, tv.centerFromNorthMm, black)
  // Soft rear glow just above the TV, on the wall.
  box(8, 14, tv.widthMm - 160, eastFace - 6, tv.bottomMm + tv.heightMm + 40, tv.centerFromNorthMm, bias, false)

  // Soundbar: on the wall, centred under the TV.
  const sbY = tv.bottomMm - sb.gapBelowTvMm - sb.heightMm / 2
  box(sb.depthMm, sb.heightMm, sb.widthMm, eastFace - sb.depthMm / 2, sbY, tv.centerFromNorthMm, black)
  box(2, sb.heightMm - 14, sb.widthMm - 12, eastFace - sb.depthMm - 1, sbY, tv.centerFromNorthMm, grille, false)

  // Bass Module 500: on the floor below the TV, south of centre, clear of the door end of the wall.
  const bmX = eastFace - bm.fromWallMm - bm.depthMm / 2
  box(bm.depthMm, bm.heightMm, bm.widthMm, bmX, bm.heightMm / 2, bm.centerFromNorthMm, black)
  box(2, bm.heightMm - 30, bm.widthMm - 30, bmX - bm.depthMm / 2 - 1, bm.heightMm / 2, bm.centerFromNorthMm, grille, false)

  // Small cabinet on the north wall above the north sofa: router | landline | intercom.
  const p = rc.panelMm, z0 = wallFaceMm, x0 = rc.fromWestMm, W = rc.widthMm, H = rc.heightMm, D = rc.depthMm, y0 = rc.bottomMm
  box(W, H, 12, x0 + W / 2, y0 + H / 2, z0 + 6, inside)
  for (const y of [y0 + p / 2, y0 + H - p / 2]) box(W, p, D, x0 + W / 2, y, z0 + D / 2, carcass)
  const inner = (W - 4 * p) / 3
  const dividers = [0, 1, 2, 3].map(i => x0 + p / 2 + i * (inner + p))
  for (const x of dividers) box(p, H - 2 * p, D, x, y0 + H / 2, z0 + D / 2, carcass)
  const cells = [0, 1, 2].map(i => x0 + p + inner / 2 + i * (inner + p))
  // Router behind an open lattice (Wi-Fi and heat pass freely).
  const shelfTop = y0 + p, rt = rc.router
  box(rt.widthMm, rt.heightMm, rt.depthMm, cells[0], shelfTop + rt.heightMm / 2, z0 + D - 60 - rt.depthMm / 2, white)
  for (const dx of [-rt.widthMm / 2 + 25, rt.widthMm / 2 - 25]) box(10, rt.antennaMm, 10, cells[0] + dx, shelfTop + rt.heightMm + rt.antennaMm / 2, z0 + D - 60 - rt.depthMm + 20, white)
  box(8, 4, 2, cells[0] - 60, shelfTop + rt.heightMm / 2, z0 + D - 60 + 1, led, false)
  const latticeH = H - 2 * p
  for (let i = 0; i <= 12; i++) box(6, latticeH - 8, 5, x0 + p + 8 + (inner - 16) * i / 12 - 0, y0 + H / 2, z0 + D - 2, bars, false)
  for (let j = 0; j <= 6; j++) box(inner - 16, 6, 5, cells[0], y0 + p + 6 + (latticeH - 12) * j / 6, z0 + D - 2.5, bars, false)
  // Landline base and handset on the middle shelf.
  const ll = rc.landline
  box(ll.widthMm, ll.heightMm, ll.depthMm, cells[1], shelfTop + ll.heightMm / 2, z0 + D - 50 - ll.depthMm / 2, white)
  box(ll.widthMm - 40, 25, ll.depthMm - 30, cells[1], shelfTop + ll.heightMm + 12, z0 + D - 50 - ll.depthMm / 2, white)
  // Intercom on the back panel of the right compartment.
  const ic = rc.intercom
  box(ic.widthMm, ic.heightMm, ic.depthMm, cells[2], y0 + H / 2, z0 + 12 + ic.depthMm / 2, white)
  box(ic.widthMm - 40, ic.heightMm * .45, 2, cells[2], y0 + H / 2 + ic.heightMm * .12, z0 + 12 + ic.depthMm + 1, glass, false)
  box(30, 6, 2, cells[2], y0 + H / 2 - ic.heightMm * .3, z0 + 12 + ic.depthMm + 1, led, false)

  // Labels for the plan (toggle with setLabels).
  const labels = new THREE.Group(); labels.name = 'corner layout labels'; group.add(labels)
  const label = (text, xMm, yMm, zMm) => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
    const g = canvas.getContext('2d')
    g.fillStyle = 'rgba(20,24,28,.86)'; g.beginPath(); g.roundRect(4, 4, 504, 88, 18); g.fill()
    g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 50)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
    sprite.scale.set(.62, .116, 1); sprite.position.set(xMm / 1000, yMm / 1000, zMm / 1000); sprite.renderOrder = 10
    labels.add(sprite)
  }
  const frontX = cornerTvFrontX(room)
  label('65" TV', frontX - 380, tv.bottomMm + tv.heightMm + 120, tv.centerFromNorthMm)
  label('Soundbar 300', frontX - 380, sbY - 80, tv.centerFromNorthMm - 60)
  label('Bass Module 500', bmX - 330, bm.heightMm + 130, bm.centerFromNorthMm)
  label('Router + landline + intercom', x0 + W / 2, y0 + H + 110, z0 + D + 260)
  labels.visible = false
  group.userData.setLabels = visible => { labels.visible = visible }
  return group
}
