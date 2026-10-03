import * as THREE from 'three'
import {southTvGeometry} from '../../domain/drawingRoomLayout.mjs'
import {createRouterCabinet} from './DrawingRoomCornerTv.js'

// Layout C built-ins (room.southLayout): the TV flat on the north wall between the west cabinet door and the entry door, a
// wall-hung TV console below it (Bass Module 500 behind a lattice in its east bay, a lattice-door storage bay, the Soundbar 300
// on top), and the router | landline | intercom cabinet turned onto the solid stretch of the east wall. Room frame: millimetres in the config, metres in the scene; x from the west wall,
// z from the north wall. `wallFaceMm` is the distance from the nominal wall line to its drawn inside face.
export function createDrawingRoomSouthTv(room, {wallFaceMm = 0} = {}) {
  const s = room.southLayout, sb = s.soundbar, bm = s.bassModule, k = s.console
  const group = new THREE.Group(); group.name = 'Drawing Room layout C: north-wall TV and east-wall router cabinet'
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .62, ...extra})
  const black = mat('#1f2124', {roughness: .45, metalness: .3}), grille = mat('#3a3d40', {roughness: .9})
  const carcass = mat('#6a4429'), bars = mat('#8a5b37', {roughness: .55}), inside = mat('#2e2118', {roughness: .85}), doorPanel = mat('#4d3220', {roughness: .7})
  const screenMat = mat('#101a20', {roughness: .2, metalness: .2, emissive: '#142c34', emissiveIntensity: .2})
  const bias = mat('#fff7e7', {emissive: '#ffd9a1', emissiveIntensity: .48, roughness: .95}); bias.userData.taskLightGlow = true
  const box = (sx, sy, sz, cx, cy, cz, material, cast = true, parent = group) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx / 1000, sy / 1000, sz / 1000), material)
    mesh.position.set(cx / 1000, cy / 1000, cz / 1000); mesh.castShadow = cast; mesh.receiveShadow = true
    parent.add(mesh); return mesh
  }
  // Labels go into groups that setLabels toggles; each group lives in the frame its positions are given in.
  const labelGroups = []
  const labelsIn = parent => {
    const labels = new THREE.Group(); labels.name = 'layout C labels'; labels.visible = false; parent.add(labels); labelGroups.push(labels)
    return (text, xMm, yMm, zMm) => {
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
      const g = canvas.getContext('2d')
      g.fillStyle = 'rgba(20,24,28,.86)'; g.beginPath(); g.roundRect(4, 4, 504, 88, 18); g.fill()
      g.fillStyle = '#fff'; g.font = 'bold 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 50)
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
      sprite.scale.set(.62, .116, 1); sprite.position.set(xMm / 1000, yMm / 1000, zMm / 1000); sprite.renderOrder = 10
      labels.add(sprite)
    }
  }

  // TV: both sizes are built on the same bracket; one is shown at a time (setTvSize).
  const cx = s.tv.centerFromWestMm, tvGroups = {}
  for (const key of Object.keys(s.tv.tvs)) {
    const g = southTvGeometry(room, key), tv = g.tv, tvGroup = new THREE.Group(); tvGroup.name = `${tv.diagonalInches}-inch TV`
    const back = wallFaceMm + s.tv.mountMm, y = g.bottomMm + tv.heightMm / 2, label = labelsIn(tvGroup)
    box(260, 180, s.tv.mountMm, cx, y, wallFaceMm + s.tv.mountMm / 2, black, true, tvGroup)          // flat bracket
    box(tv.widthMm, tv.heightMm, tv.depthMm, cx, y, back + tv.depthMm / 2, black, true, tvGroup)
    box(tv.widthMm - 24, tv.heightMm - 24, 3, cx, y, back + tv.depthMm + 1.5, screenMat, false, tvGroup)
    box(tv.widthMm - 160, 14, 8, cx, g.topMm + 40, wallFaceMm + 6, bias, false, tvGroup)            // bias light strip
    label(`${tv.diagonalInches}" TV on the north wall`, cx, g.topMm + 160, back + 400)
    group.add(tvGroup); tvGroups[key] = tvGroup
  }
  let shown = s.tv.installedTv
  const showTv = () => { for (const [key, g] of Object.entries(tvGroups)) g.visible = key === shown }
  showTv()

  // TV console: wall-hung, its back on the wall face. Frame in mm: x along the wall, y up, z out from the wall face.
  {
    const g = southTvGeometry(room), p = k.panelMm, x1 = g.console.x1, x2 = g.console.x2, y0 = k.bottomMm, y1 = y0 + k.heightMm
    const z0 = wallFaceMm, z1 = wallFaceMm + k.depthMm, midX = (x1 + x2) / 2, midZ = (z0 + z1) / 2, label = labelsIn(group)
    box(k.lengthMm, p, k.depthMm, midX, y1 - p / 2, midZ, carcass)                                // top
    box(k.lengthMm, p, k.depthMm, midX, y0 + p / 2, midZ, carcass)                                // bottom
    box(k.lengthMm, k.heightMm, k.backMm, midX, (y0 + y1) / 2, z0 + k.backMm / 2, inside)         // back
    for (const x of [x1 + p / 2, x2 - p / 2, g.bay.x1 - p / 2]) box(p, k.heightMm - 2 * p, k.depthMm, x, (y0 + y1) / 2, midZ, carcass) // ends and bay divider
    const innerH = k.heightMm - 2 * p, innerY = (y0 + y1) / 2
    // Bass Module bay: open lattice so it can be heard; the module stands behind it.
    const bay = g.bay, bayW = bay.x2 - bay.x1
    for (let i = 0; i <= 9; i++) box(6, innerH - 8, 5, bay.x1 + 8 + (bayW - 16) * i / 9, innerY, z1 - 2, bars, false)
    for (let j = 0; j <= 4; j++) box(bayW - 16, 6, 6, (bay.x1 + bay.x2) / 2, y0 + p + 6 + (innerH - 12) * j / 4, z1 - 2.5, bars, false)
    const bassY = y0 + p + bm.heightMm / 2, bassZ = (g.bass.z1 + g.bass.z2) / 2
    box(bm.widthMm, bm.heightMm, bm.depthMm, (g.bass.x1 + g.bass.x2) / 2, bassY, bassZ, black)
    box(bm.widthMm - 30, bm.heightMm - 30, 2, (g.bass.x1 + g.bass.x2) / 2, bassY, g.bass.z2 + 1, grille, false)
    // Storage bay: one door with the same lattice, for the set-top box, remotes and media.
    const dx1 = x1 + p, dx2 = bay.x1 - p, dw = dx2 - dx1 - 6, dh = innerH - 6
    box(dw, dh, p, (dx1 + dx2) / 2, innerY, z1 - p / 2, doorPanel)
    const cols = Math.round(dw / 70), rows = Math.round(dh / 70)
    for (let i = 0; i <= cols; i++) box(6, dh - 16, 7, dx1 + 3 + 8 + (dw - 16) * i / cols, innerY, z1 + 3, bars, false)
    for (let j = 0; j <= rows; j++) box(dw - 16, 6, 7, (dx1 + dx2) / 2, y0 + p + 3 + 8 + (dh - 16) * j / rows, z1 + 3.5, bars, false)
    // Soundbar 300 on the console top, centred under the TV.
    const sbZ = z1 - sb.frontSetbackMm - sb.depthMm / 2
    box(sb.widthMm, sb.heightMm, sb.depthMm, cx, g.soundbarY, sbZ, black)
    box(sb.widthMm - 12, sb.heightMm - 14, 2, cx, g.soundbarY, sbZ + sb.depthMm / 2 + 1, grille, false)
    label(`TV console ${k.lengthMm} x ${k.depthMm}`, midX - 250, y0 - 120, z1 + 300)
    label('Soundbar 300', cx, y1 + 180, z1 + 300)
    label('Bass Module 500 (inside)', (bay.x1 + bay.x2) / 2 + 150, y0 - 260, z1 + 300)
  }

  // Router | landline | intercom cabinet on the east wall: built in a wall frame (x along the wall), then turned so that frame's
  // x runs south along the east wall and its z points west into the room.
  const east = new THREE.Group(); east.name = 'router cabinet on the east wall'
  east.position.set((room.widthMm - wallFaceMm) / 1000, 0, 0); east.rotation.y = -Math.PI / 2
  east.add(createRouterCabinet({...room.cornerLayout.routerCabinet, fromWestMm: s.routerCabinet.fromNorthMm}, {label: labelsIn(east)}))
  group.add(east)

  group.userData.setLabels = visible => { for (const labels of labelGroups) labels.visible = visible }
  group.userData.setTvSize = key => { if (tvGroups[key]) { shown = key; showTv() } }
  return group
}
