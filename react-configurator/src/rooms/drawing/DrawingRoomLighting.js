import * as THREE from 'three'
import {DRAWING_LIGHTING} from '../../config/drawingLightingConfig.js'

// Existing ceiling fans (config.ceilingFans): canopy, down-rod, motor and three blades each. Positions are assumed until measured.
function ceilingFans(config, ceiling) {
  const group = new THREE.Group(); group.name = 'Ceiling fans (existing)'
  const body = new THREE.MeshStandardMaterial({color: '#e9e6df', roughness: .5, metalness: .2}), blade = new THREE.MeshStandardMaterial({color: '#cfc8bb', roughness: .6})
  const radius = config.bladeDiameterMm / 2000, y = ceiling - config.dropMm / 1000
  for (const fan of config.fans) {
    const one = new THREE.Group(); one.name = fan.label; one.position.set(fan.xMm / 1000, 0, fan.zMm / 1000); group.add(one)
    const add = (geometry, material, py) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.y = py; one.add(mesh); return mesh } // no shadow: nothing shines from above a fan
    add(new THREE.CylinderGeometry(.06, .06, .05, 24), body, ceiling - .025)
    add(new THREE.CylinderGeometry(.012, .012, config.dropMm / 1000 - .08, 12), body, ceiling - config.dropMm / 2000)
    add(new THREE.CylinderGeometry(.11, .09, .08, 28), body, y)
    for (let i = 0; i < 3; i++) {
      const arm = add(new THREE.BoxGeometry(radius - .1, .008, .12), blade, y - .01)
      const a = i * Math.PI * 2 / 3 + .3
      arm.position.x = Math.cos(a) * (radius + .1) / 2; arm.position.z = Math.sin(a) * (radius + .1) / 2; arm.rotation.y = -a
    }
  }
  return group
}

// Surface track lights (config.tracks): a slim white track on the slab per run, spot heads tilted toward their wall and
// diffused linear heads pointing down. Each head carries a small real light so the layers show in the live view.
// `room` (metres: {x, z} = width, length) is needed only to aim spots at the east or south wall.
export function createTrackLights(config, ceiling, {realLights = true, room = null} = {}) {
  const wallAhead = room ?? {x: 0, z: 0}
  const group = new THREE.Group(); group.name = 'Track lights'
  const white = new THREE.MeshStandardMaterial({color: '#f4f2ee', roughness: .5}), head = new THREE.MeshStandardMaterial({color: '#ecebe7', roughness: .4, metalness: .2})
  // One glowing-lens material per kind of head, so each kind can be dimmed on its own (setLevel).
  const lensFor = () => { const m = new THREE.MeshStandardMaterial({color: '#fff3dc', emissive: '#ffd9a1', emissiveIntensity: .9, roughness: .9}); m.userData.taskLightGlow = true; return m }
  const lenses = {spot: lensFor(), diffuse: lensFor(), reading: lensFor()}, dimmable = {spot: [], diffuse: [], reading: []}
  const s = config.sectionMm / 1000, AIM = {north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0]}
  for (const run of config.runs) {
    const part = new THREE.Group(); part.name = run.label; group.add(part)
    const length = (run.toMm - run.fromMm) / 1000, mid = (run.fromMm + run.toMm) / 2000, at = run.atMm / 1000, alongX = run.axis === 'x'
    const bar = new THREE.Mesh(new THREE.BoxGeometry(alongX ? length : s, s, alongX ? s : length), white)
    bar.position.set(alongX ? mid : at, ceiling - s / 2, alongX ? at : mid); part.add(bar)
    for (const h of run.heads) {
      const x = alongX ? h.atMm / 1000 : at, z = alongX ? at : h.atMm / 1000, y = ceiling - s
      if (h.kind === 'diffuse') {
        const len = h.lengthMm / 1000
        const body = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len : .03, .03, alongX ? .03 : len), head); body.position.set(x, y - .015, z); part.add(body)
        const glow = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len - .02 : .024, .004, alongX ? .024 : len - .02), lenses.diffuse); glow.position.set(x, y - .032, z); part.add(glow)
        if (realLights) { const light = new THREE.PointLight('#ffd9a8', .9, 4.2, 1.6); light.position.set(x, y - .06, z); part.add(light); dimmable.diffuse.push({light, base: light.intensity}) }
      } else if (h.kind === 'reading') {
        // A stronger spot pointing straight down at the seat below.
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .04, 10), head); stem.position.set(x, y - .02, z); part.add(stem)
        const can = new THREE.Mesh(new THREE.CylinderGeometry(.03, .034, .1, 20), head); can.position.set(x, y - .09, z); part.add(can)
        const face = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, .004, 20), lenses.reading); face.position.set(x, y - .142, z); part.add(face)
        if (realLights) {
          const light = new THREE.SpotLight('#ffe2bd', 4.2, 3.6, .5, .6, 1.3); light.position.set(x, y - .14, z)
          light.target.position.set(x, .6, z); part.add(light, light.target); dimmable.reading.push({light, base: light.intensity})
        }
      } else {
        const [dx, dz] = AIM[h.aim]
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .05, 10), head); stem.position.set(x, y - .025, z); part.add(stem)
        const can = new THREE.Mesh(new THREE.CylinderGeometry(.026, .03, .09, 20), head); can.position.set(x + dx * .02, y - .075, z + dz * .02)
        can.rotation.z = -dx * .5; can.rotation.x = dz * .5; part.add(can)
        const face = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .004, 20), lenses.spot); face.position.set(x + dx * .042, y - .118, z + dz * .042); face.rotation.copy(can.rotation); part.add(face)
        if (realLights) {
          // Aimed at the wall beside the run: `reach` is the distance from the run to that wall.
          const reach = dx < 0 ? x : dx > 0 ? wallAhead.x - x : dz < 0 ? z : wallAhead.z - z
          const light = new THREE.SpotLight('#ffd6a0', 2.4, 3.4, .42, .7, 1.4); light.position.set(x, y - .1, z)
          light.target.position.set(x + dx * (reach - .02), 1.25, z + dz * (reach - .02)); part.add(light, light.target); dimmable.spot.push({light, base: light.intensity})
        }
      }
    }
  }
  // level 0 = off, 1 = the planned brightness; scales the real lights and the lens glow of one kind of head.
  group.userData.setLevel = (kind, level) => {
    if (!dimmable[kind]) return
    for (const {light, base} of dimmable[kind]) { light.userData.dimLevel = level; light.intensity = base * level }
    lenses[kind].emissiveIntensity = .9 * Math.min(level, 1.5)
  }
  return group
}

// Drawing Room ceiling and wall fixtures for one seating layout ("northTv" or "cornerSofas").
// Room frame in metres: x from the west wall, z from the north wall.
export function createDrawingLayoutLights(room, layoutKey) {
  const config = DRAWING_LIGHTING[layoutKey]
  const group = new THREE.Group(); group.name = `Drawing Room lights (${layoutKey})`
  const ceiling = room.heightMm / 1000
  const metal = new THREE.MeshStandardMaterial({color: '#514941', roughness: .55, metalness: .4})
  const warm = new THREE.MeshStandardMaterial({color: '#fff1d4', emissive: '#ffcf8b', emissiveIntensity: .7, roughness: .8})
  warm.userData.taskLightGlow = true
  const bronze = new THREE.MeshStandardMaterial({color: '#8d714f', metalness: .58, roughness: .38})
  const diffuser = new THREE.MeshStandardMaterial({color: '#fff7e7', emissive: '#ffd9a1', emissiveIntensity: .48, roughness: .95})
  diffuser.userData.taskLightGlow = true
  const box = (w, h, d, x, y, z, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z); group.add(mesh)
  }
  const chandelierLights = []
  for (const fixture of config.ambient) {
    const x = fixture.xMm / 1000, z = fixture.zMm / 1000
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .025, 32), bronze)
    canopy.position.set(x, ceiling - .015, z); canopy.name = fixture.label; group.add(canopy)
    box(.012, .38, .012, x, ceiling - .22, z, bronze)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.33, .024, 12, 48), bronze)
    ring.rotation.x = Math.PI / 2; ring.position.set(x, ceiling - .43, z); group.add(ring)
    const lens = new THREE.Mesh(new THREE.TorusGeometry(.305, .014, 8, 48), diffuser)
    lens.rotation.x = Math.PI / 2; lens.position.set(x, ceiling - .455, z); group.add(lens)
    if (config.tracks) {
      const light = new THREE.PointLight('#ffd9a8', 1.5, 6.5, 1.5); light.position.set(x, ceiling - .5, z); group.add(light)
      chandelierLights.push({light, base: light.intensity})
    }
  }
  const up = config.wallUplight
  if (up) {
    box(.045, .20, .14, .035, up.heightMm / 1000, up.fromNorthMm / 1000, metal)
    box(.055, .02, .105, .042, up.heightMm / 1000 + .11, up.fromNorthMm / 1000, diffuser)
  }
  if (config.reading) {
    const z = config.reading.fromNorthMm / 1000
    box(.04, .22, .10, .06, 1.52, z, metal)
    box(.22, .025, .025, .17, 1.60, z, metal)
    box(.12, .10, .12, .27, 1.56, z, metal)
    box(.10, .008, .10, .27, 1.507, z, warm)
  }
  if (config.ceilingFans) group.add(ceilingFans(config.ceilingFans, ceiling))
  const tracks = config.tracks ? createTrackLights(config.tracks, ceiling) : null
  if (tracks) group.add(tracks)
  // Dimmer: kind is 'chandelier', 'spot' or 'diffuse'; level 0 = off, 1 = planned. The level is also kept on each light
  // (userData.dimLevel) so a page that rescales lights for day and evening can keep it.
  group.userData.setTrackLight = (kind, level) => {
    if (kind === 'chandelier') for (const {light, base} of chandelierLights) { light.userData.dimLevel = level; light.intensity = base * level }
    else tracks?.userData.setLevel(kind, level)
  }
  const glow = config.sofaGlow
  box((glow.lengthMm - 160) / 1000, .012, .025, glow.xMm / 1000, glow.heightMm / 1000, glow.fromNorthMm / 1000, diffuser)
  return group
}
