import * as THREE from 'three'
import {southTvGeometry} from '../../domain/drawingRoomLayout.mjs'
import {createRouterCabinet} from './DrawingRoomCornerTv.js'

// Layout C built-ins (room.southLayout): the TV flat on the north wall between the west cabinet door and the entry door, the
// Soundbar 300 under it, the Bass Module 500 on the floor at its east end, and the router | landline | intercom cabinet turned
// onto the solid stretch of the east wall. Room frame: millimetres in the config, metres in the scene; x from the west wall,
// z from the north wall. `wallFaceMm` is the distance from the nominal wall line to its drawn inside face.
export function createDrawingRoomSouthTv(room, {wallFaceMm = 0} = {}) {
  const s = room.southLayout, sb = s.soundbar, bm = s.bassModule
  const group = new THREE.Group(); group.name = 'Drawing Room layout C: north-wall TV and east-wall router cabinet'
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .62, ...extra})
  const black = mat('#1f2124', {roughness: .45, metalness: .3}), grille = mat('#3a3d40', {roughness: .9})
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
    box(sb.widthMm, sb.heightMm, sb.depthMm, cx, g.soundbarY, wallFaceMm + sb.depthMm / 2, black, true, tvGroup)
    box(sb.widthMm - 12, sb.heightMm - 14, 2, cx, g.soundbarY, wallFaceMm + sb.depthMm + 1, grille, false, tvGroup)
    label(`${tv.diagonalInches}" TV on the north wall`, cx, g.topMm + 160, back + 400)
    label('Soundbar 300', cx, g.soundbarY - 110, wallFaceMm + 400)
    group.add(tvGroup); tvGroups[key] = tvGroup
  }
  let shown = s.tv.installedTv
  const showTv = () => { for (const [key, g] of Object.entries(tvGroups)) g.visible = key === shown }
  showTv()

  // Bass Module 500 on the floor under the east end of the TV.
  const bz = wallFaceMm + bm.fromWallMm + bm.depthMm / 2
  box(bm.widthMm, bm.heightMm, bm.depthMm, bm.centerFromWestMm, bm.heightMm / 2, bz, black)
  box(bm.widthMm - 30, bm.heightMm - 30, 2, bm.centerFromWestMm, bm.heightMm / 2, bz + bm.depthMm / 2 + 1, grille, false)
  labelsIn(group)('Bass Module 500', bm.centerFromWestMm, bm.heightMm + 140, bz + 250)

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
