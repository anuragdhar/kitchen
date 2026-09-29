import * as THREE from 'three'
import {cornerTvFrontX, armPose, consoleGeometry, projectorPlacement} from '../../domain/drawingRoomLayout.mjs'

// Layout B built-ins on the east wall and the small router cabinet on the north wall. Three variants:
//   'wallTv'     the 65-inch TV wall-mounted flat, Soundbar 300 on the wall, Bass Module 500 on the floor (option B)
//   'console'    an 18-inch deep low console with the Bass Module inside, the Soundbar 300 on top and a 55- or
//                65-inch TV on a full-motion wall arm (option B2)
//   'projector'  the same console with a ceiling projector and a drop-down screen instead of the TV (option B3)
// Room frame: millimetres in the config, metres in the scene; x from the west wall, z from the north wall.
// `wallFaceMm` is the distance from the room's nominal wall line to its drawn inside face.
export function createDrawingRoomCornerTv(room, {wallFaceMm = 0, variant = 'wallTv'} = {}) {
  const c = room.cornerLayout, rc = c.routerCabinet
  const eastFace = room.widthMm - wallFaceMm
  const group = new THREE.Group(); group.name = `Drawing Room corner layout (${variant}): east wall and north cabinet`

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .62, ...extra})
  const carcass = mat('#6a4429'), bars = mat('#8a5b37', {roughness: .55}), inside = mat('#2e2118', {roughness: .85})
  const doorPanel = mat('#4d3220', {roughness: .7})
  const black = mat('#1f2124', {roughness: .45, metalness: .3})
  const screenMat = mat('#101a20', {roughness: .2, metalness: .2, emissive: '#142c34', emissiveIntensity: .2})
  const grille = mat('#3a3d40', {roughness: .9}), white = mat('#e9ecee', {roughness: .5}), glass = mat('#15181b', {roughness: .1, metalness: .4})
  const led = new THREE.MeshBasicMaterial({color: '#7bd88f'})
  const bias = mat('#fff7e7', {emissive: '#ffd9a1', emissiveIntensity: .48, roughness: .95}); bias.userData.taskLightGlow = true
  const box = (sx, sy, sz, cx, cy, cz, material, cast = true, parent = group) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx / 1000, sy / 1000, sz / 1000), material)
    mesh.position.set(cx / 1000, cy / 1000, cz / 1000); mesh.castShadow = cast; mesh.receiveShadow = true
    parent.add(mesh); return mesh
  }

  const labels = new THREE.Group(); labels.name = 'corner layout labels'; group.add(labels)
  const label = (text, xMm, yMm, zMm) => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
    const g = canvas.getContext('2d')
    g.fillStyle = 'rgba(20,24,28,.86)'; g.beginPath(); g.roundRect(4, 4, 504, 88, 18); g.fill()
    g.fillStyle = '#fff'; g.font = 'bold 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 50)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
    sprite.scale.set(.62, .116, 1); sprite.position.set(xMm / 1000, yMm / 1000, zMm / 1000); sprite.renderOrder = 10
    labels.add(sprite)
  }

  // ---- Small cabinet on the north wall above the north sofa: router | landline | intercom ----
  {
    const p = rc.panelMm, z0 = wallFaceMm, x0 = rc.fromWestMm, W = rc.widthMm, H = rc.heightMm, D = rc.depthMm, y0 = rc.bottomMm
    box(W, H, 12, x0 + W / 2, y0 + H / 2, z0 + 6, inside)
    for (const y of [y0 + p / 2, y0 + H - p / 2]) box(W, p, D, x0 + W / 2, y, z0 + D / 2, carcass)
    const inner = (W - 4 * p) / 3
    for (const i of [0, 1, 2, 3]) box(p, H - 2 * p, D, x0 + p / 2 + i * (inner + p), y0 + H / 2, z0 + D / 2, carcass)
    const cells = [0, 1, 2].map(i => x0 + p + inner / 2 + i * (inner + p))
    const shelfTop = y0 + p, rt = rc.router
    box(rt.widthMm, rt.heightMm, rt.depthMm, cells[0], shelfTop + rt.heightMm / 2, z0 + D - 60 - rt.depthMm / 2, white)
    for (const dx of [-rt.widthMm / 2 + 25, rt.widthMm / 2 - 25]) box(10, rt.antennaMm, 10, cells[0] + dx, shelfTop + rt.heightMm + rt.antennaMm / 2, z0 + D - 60 - rt.depthMm + 20, white)
    box(8, 4, 2, cells[0] - 60, shelfTop + rt.heightMm / 2, z0 + D - 60 + 1, led, false)
    const latticeH = H - 2 * p
    for (let i = 0; i <= 12; i++) box(6, latticeH - 8, 5, x0 + p + 8 + (inner - 16) * i / 12, y0 + H / 2, z0 + D - 2, bars, false)
    for (let j = 0; j <= 6; j++) box(inner - 16, 6, 5, cells[0], y0 + p + 6 + (latticeH - 12) * j / 6, z0 + D - 2.5, bars, false)
    const ll = rc.landline
    box(ll.widthMm, ll.heightMm, ll.depthMm, cells[1], shelfTop + ll.heightMm / 2, z0 + D - 50 - ll.depthMm / 2, white)
    box(ll.widthMm - 40, 25, ll.depthMm - 30, cells[1], shelfTop + ll.heightMm + 12, z0 + D - 50 - ll.depthMm / 2, white)
    const ic = rc.intercom
    box(ic.widthMm, ic.heightMm, ic.depthMm, cells[2], y0 + H / 2, z0 + 12 + ic.depthMm / 2, white)
    box(ic.widthMm - 40, ic.heightMm * .45, 2, cells[2], y0 + H / 2 + ic.heightMm * .12, z0 + 12 + ic.depthMm + 1, glass, false)
    box(30, 6, 2, cells[2], y0 + H / 2 - ic.heightMm * .3, z0 + 12 + ic.depthMm + 1, led, false)
    label('Router + landline + intercom', x0 + W / 2, y0 + H + 110, z0 + D + 260)
  }

  group.userData.setLabels = visible => { labels.visible = visible }
  labels.visible = false
  const frontX = cornerTvFrontX(room)
  const sb = c.soundbar, bm = c.bassModule

  if (variant === 'wallTv') {
    const tv = c.tv
    const tvBackX = eastFace - tv.mountMm
    box(tv.depthMm, tv.heightMm, tv.widthMm, tvBackX - tv.depthMm / 2, tv.bottomMm + tv.heightMm / 2, tv.centerFromNorthMm, black)
    box(3, tv.heightMm - 24, tv.widthMm - 24, tvBackX - tv.depthMm - 1.5, tv.bottomMm + tv.heightMm / 2, tv.centerFromNorthMm, screenMat, false)
    box(tv.mountMm, 180, 260, eastFace - tv.mountMm / 2, tv.bottomMm + tv.heightMm / 2, tv.centerFromNorthMm, black)
    box(8, 14, tv.widthMm - 160, eastFace - 6, tv.bottomMm + tv.heightMm + 40, tv.centerFromNorthMm, bias, false)
    const sbY = tv.bottomMm - sb.gapBelowTvMm - sb.heightMm / 2
    box(sb.depthMm, sb.heightMm, sb.widthMm, eastFace - sb.depthMm / 2, sbY, tv.centerFromNorthMm, black)
    box(2, sb.heightMm - 14, sb.widthMm - 12, eastFace - sb.depthMm - 1, sbY, tv.centerFromNorthMm, grille, false)
    const bmX = eastFace - bm.fromWallMm - bm.depthMm / 2
    box(bm.depthMm, bm.heightMm, bm.widthMm, bmX, bm.heightMm / 2, bm.centerFromNorthMm, black)
    box(2, bm.heightMm - 30, bm.widthMm - 30, bmX - bm.depthMm / 2 - 1, bm.heightMm / 2, bm.centerFromNorthMm, grille, false)
    label('65" TV', frontX - 380, tv.bottomMm + tv.heightMm + 120, tv.centerFromNorthMm)
    label('Soundbar 300', frontX - 380, sbY - 80, tv.centerFromNorthMm - 60)
    label('Bass Module 500', bmX - 330, bm.heightMm + 130, bm.centerFromNorthMm)
    return group
  }

  // ---- Low console (options B2 and B3) ----
  const k = c.console, g = consoleGeometry(room), p = k.panelMm, H = k.heightMm, D = k.depthMm
  const midX = eastFace - D / 2, cz = (g.z1 + g.z2) / 2, bayEnd = g.z1 + k.moduleBayMm
  box(D, p, k.lengthMm, midX, H - p / 2, cz, carcass)                                   // top
  box(D - 60, 60, k.lengthMm - 2 * p, midX - 30, 30, cz, inside)                         // recessed plinth
  box(D, p, k.lengthMm, midX, 60 + p / 2, cz, carcass)                                   // deck
  box(k.backMm, H, k.lengthMm, eastFace - k.backMm / 2, H / 2, cz, inside)               // back
  for (const z of [g.z1 + p / 2, g.z2 - p / 2, bayEnd]) box(D, H - 60 - 2 * p, p, midX, (60 + p + H - p) / 2, z, carcass) // ends and bay divider
  const frontPlane = g.frontX
  // Bass Module bay: open lattice so the sub can be heard; the module stands behind it.
  const bayH = H - 60 - 2 * p, bayY = 60 + p + bayH / 2
  for (let i = 0; i <= 9; i++) box(6, bayH - 8, 5, frontPlane + 2, bayY, g.z1 + p + 8 + (k.moduleBayMm - 2 * p - 16) * i / 9, bars, false)
  for (let j = 0; j <= 4; j++) box(6, 6, k.moduleBayMm - 2 * p - 16, frontPlane + 2.5, 60 + p + 6 + (bayH - 12) * j / 4, (g.z1 + bayEnd) / 2, bars, false)
  const bmZ = (g.z1 + bayEnd) / 2, bmXc = frontPlane + 30 + bm.depthMm / 2
  box(bm.depthMm, bm.heightMm, bm.widthMm, bmXc, 60 + p + bm.heightMm / 2, bmZ, black)
  box(2, bm.heightMm - 30, bm.widthMm - 30, bmXc - bm.depthMm / 2 - 1, 60 + p + bm.heightMm / 2, bmZ, grille, false)
  // Storage door with lattice over the rest of the front.
  {
    const z0 = bayEnd + p / 2, z1 = g.z2 - p / 2, w = z1 - z0 - 6, h = bayH - 6, y = bayY
    box(p, h, w, frontPlane + p / 2, y, (z0 + z1) / 2, doorPanel)
    for (let i = 0; i <= Math.round(w / 70); i++) box(6, h - 16, 7, frontPlane - 3, y, z0 + 3 + 8 + (w - 16) * i / Math.round(w / 70), bars, false)
    for (let j = 0; j <= Math.round(h / 70); j++) box(6, 7, w - 16, frontPlane - 3.5, 60 + p + 3 + 8 + (h - 16) * j / Math.round(h / 70), (z0 + z1) / 2, bars, false)
  }
  // Soundbar on the console top, under the screen or TV.
  const sbX = frontPlane + 80 + sb.depthMm / 2, sbY = H + sb.heightMm / 2
  box(sb.depthMm, sb.heightMm, sb.widthMm, sbX, sbY, k.soundbarCenterFromNorthMm, black)
  box(2, sb.heightMm - 14, sb.widthMm - 12, sbX - sb.depthMm / 2 - 1, sbY, k.soundbarCenterFromNorthMm, grille, false)
  label('Low console 457 deep', frontPlane - 330, H + 120, cz + 300)
  label('Bass Module 500 (inside)', frontPlane - 330, 120, bmZ - 100)
  label('Soundbar 300', frontPlane - 330, H + 250, k.soundbarCenterFromNorthMm + 100)

  if (variant === 'console') {
    // Both TV sizes are built on the same arm; one is shown at a time.
    const tvGroups = {}, arm = new THREE.Group(); arm.name = 'wall arm'; group.add(arm)
    box(k.arm.plateMm, 220, 160, eastFace - k.arm.plateMm / 2, k.tvBottomMm + 355, k.tvCenterFromNorthMm, black, true, arm)   // wall plate: first child of the arm group
    const link = box(1, 46, 60, 0, 0, 0, black, true, arm)   // schematic arm: one link from the wall plate to the TV back
    const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .09, 16), black); arm.add(knuckle)
    for (const [key, tv] of Object.entries(k.tvs)) {
      const tvGroup = new THREE.Group(); tvGroup.name = `${tv.diagonalInches}-inch TV`
      box(tv.depthMm, tv.heightMm, tv.widthMm, 0, 0, 0, black, true, tvGroup)
      box(3, tv.heightMm - 24, tv.widthMm - 24, -tv.depthMm / 2 - 1.5, 0, 0, screenMat, false, tvGroup)
      group.add(tvGroup); tvGroups[key] = tvGroup
    }
    let shown = k.installedTv, extend = 0, swivel = 0
    const wallPivot = () => ({x: eastFace - k.arm.plateMm, y: k.tvBottomMm + k.tvs[shown].heightMm / 2, z: k.tvCenterFromNorthMm})
    const place = () => {
      const tv = k.tvs[shown], pose = armPose(room, shown, extend, swivel), y = k.tvBottomMm + tv.heightMm / 2
      for (const [key, g2] of Object.entries(tvGroups)) g2.visible = key === shown
      tvGroups[shown].position.set(pose.x / 1000, y / 1000, pose.z / 1000)
      tvGroups[shown].rotation.y = -swivel * Math.PI / 180                       // turning toward the north sofa
      const from = wallPivot(), to = {x: pose.x + tv.depthMm / 2 * Math.cos(swivel * Math.PI / 180), z: pose.z}
      const dx = to.x - from.x, dz = to.z - from.z, len = Math.hypot(dx, dz)
      link.visible = knuckle.visible = len > 30
      if (len > 30) {
        link.scale.set(len, 1, 1); link.position.set((from.x + dx / 2) / 1000, y / 1000, (from.z + dz / 2) / 1000)
        link.rotation.y = Math.atan2(-dz, dx); knuckle.position.set(to.x / 1000, y / 1000, to.z / 1000)
      }
      arm.children[0].position.y = y / 1000
    }
    place()
    group.userData.setTvSize = key => { if (k.tvs[key]) { shown = key; place() } }
    group.userData.setArm = pulled => { extend = pulled ? k.arm.watchExtendMm : 0; swivel = pulled ? k.arm.watchSwivelDeg : 0; place() }
    label('55" or 65" TV on wall arm', eastFace - 700, k.tvBottomMm + 900, k.tvCenterFromNorthMm)
    return group
  }

  // ---- Projector (option B3) ----
  const pr = c.projector, place = projectorPlacement(room), screenX = eastFace - 140
  const sy = pr.bottomMm + pr.heightMm / 2
  box(6, pr.heightMm, pr.widthMm, screenX, sy, pr.centerFromNorthMm, white)                               // fabric
  for (const s of [-1, 1]) box(8, pr.heightMm + 40, 20, screenX - 2, sy, pr.centerFromNorthMm + s * (pr.widthMm / 2 + 10), black, false)
  box(8, 20, pr.widthMm + 40, screenX - 2, pr.bottomMm - 10, pr.centerFromNorthMm, black, false)
  box(110, 110, pr.widthMm + 120, eastFace - 90, room.heightMm - 55, pr.centerFromNorthMm, black)         // ceiling case
  const bodyY = place.y - pr.body.heightMm / 2
  box(pr.body.depthMm, pr.body.heightMm, pr.body.widthMm, place.x, bodyY, place.z, white)
  box(30, pr.ceilingDropMm - pr.body.heightMm / 2, 30, place.x, room.heightMm - (pr.ceilingDropMm - pr.body.heightMm / 2) / 2, place.z, black)
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, .05, 24), black)
  lens.rotation.z = Math.PI / 2; lens.position.set((place.x + pr.body.depthMm / 2 + 20) / 1000, bodyY / 1000, place.z / 1000); group.add(lens)
  // Faint light cone from the lens to the screen corners.
  {
    const apex = [(place.x + pr.body.depthMm / 2 + 45) / 1000, bodyY / 1000, place.z / 1000]
    const x = (screenX - 4) / 1000, corners = [[pr.bottomMm, pr.centerFromNorthMm - pr.widthMm / 2], [pr.bottomMm, pr.centerFromNorthMm + pr.widthMm / 2], [pr.bottomMm + pr.heightMm, pr.centerFromNorthMm + pr.widthMm / 2], [pr.bottomMm + pr.heightMm, pr.centerFromNorthMm - pr.widthMm / 2]].map(([yy, zz]) => [x, yy / 1000, zz / 1000])
    const positions = []
    for (let i = 0; i < 4; i++) positions.push(...apex, ...corners[i], ...corners[(i + 1) % 4])
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    const cone = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: '#fff2c4', transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false}))
    cone.userData.noMeasure = true; group.add(cone)
  }
  label(`${pr.screenDiagonalInches}" drop-down screen`, eastFace - 700, pr.bottomMm + pr.heightMm + 160, pr.centerFromNorthMm)
  label('Ceiling projector', place.x, room.heightMm - pr.ceilingDropMm - 260, place.z)
  return group
}
