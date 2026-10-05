import * as THREE from 'three'
import {DRAWING_LIGHTING, DRAWING_CEILING_MOULDINGS} from '../../config/drawingLightingConfig.js'
import {mouldingShapes} from '../../domain/drawingLighting.mjs'
import {lampColour} from '../../render/renderQuality.mjs'

// Existing plaster ceiling mouldings (config ceilingMouldings, from the phone scans): the raised border line, a ring in
// each corner and the round medallions, drawn low on the slab so the tracks can be judged against them. Room frame in
// metres (x from the west wall, z from the north wall); `room` gives widthMm, lengthMm and heightMm. The shapes are the
// ones the pure check uses (domain/drawingLighting.mjs mouldingShapes), so what is drawn is what is checked: a corner
// ring is drawn as the circle that fills its checked square. The painted border colour is not drawn.
export function createCeilingMouldings(mouldings, room) {
  const group = new THREE.Group(); group.name = 'Ceiling mouldings (existing, from the phone scan)'
  const plaster = new THREE.MeshStandardMaterial({color: '#f6f3ec', roughness: .92}), edge = new THREE.MeshStandardMaterial({color: '#d9d2c4', roughness: .92})
  const ceiling = room.heightMm / 1000, p = mouldings.projectionMm / 1000
  const add = (geometry, material, x, y, z, name) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.name = name; group.add(mesh); return mesh }
  // A flat ring lying on the ceiling: a torus squashed to the moulding's projection.
  const ring = (radius, x, z, name, tube = .014) => { const mesh = add(new THREE.TorusGeometry(radius - tube, tube, 8, 48), edge, x, ceiling, z, name); mesh.rotation.x = Math.PI / 2; mesh.scale.z = p / tube; return mesh }
  for (const shape of mouldingShapes(room, mouldings)) {
    if (shape.kind === 'border') add(new THREE.BoxGeometry((shape.x2 - shape.x1) / 1000, p, (shape.z2 - shape.z1) / 1000), plaster, (shape.x1 + shape.x2) / 2000, ceiling - p / 2, (shape.z1 + shape.z2) / 2000, shape.label)
    else if (shape.kind === 'ring') {
      const radius = Math.min(shape.x2 - shape.x1, shape.z2 - shape.z1) / 2000, x = (shape.x1 + shape.x2) / 2000, z = (shape.z1 + shape.z2) / 2000
      ring(radius, x, z, shape.label); ring(radius * .45, x, z, shape.label)
    } else {
      const r = shape.radius / 1000, x = shape.x / 1000, z = shape.z / 1000
      // The face of the medallion is a disc seen from below only, so the Top view (no ceiling) still shows the room through it.
      add(new THREE.CircleGeometry(r, 48), plaster, x, ceiling - p * .6, z, shape.label).rotation.x = Math.PI / 2
      ring(r, x, z, shape.label); ring(r * .62, x, z, shape.label)
    }
  }
  return group
}

// Ceiling fans (config.ceilingFans): canopy, down-rod, motor and three blades each. Room frame in metres: x from the west
// wall, z from the north wall; `ceiling` is the slab height. Positions are assumed in rooms that are not measured yet
// (config.ceilingFans.status says which); the fan is drawn so the assumption is visible.
export function createCeilingFans(config, ceiling) {
  const group = new THREE.Group(); group.name = 'Ceiling fans (existing)'
  const body = new THREE.MeshStandardMaterial({color: '#e9e6df', roughness: .5, metalness: .2}), blade = new THREE.MeshStandardMaterial({color: '#cfc8bb', roughness: .6})
  const radius = config.bladeDiameterMm / 2000, y = ceiling - config.dropMm / 1000
  for (const fan of config.fans) {
    const one = new THREE.Group(); one.name = fan.status ? `${fan.label} (${fan.status})` : fan.label; one.position.set(fan.xMm / 1000, 0, fan.zMm / 1000); group.add(one)
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

// Surface track lights (config.tracks): a slim white track on the slab per run, spot heads tilted toward their wall,
// diffused linear heads pointing down and reading heads pointing down or aimed at head.targetMm. Each head carries a
// small real light so the layers show in the live view.
// Built in metres in the room frame (x from the west wall, z from the north wall). `room` ({x, z} = width, length in metres)
// is needed only to aim spots at the east or south wall. `unitsPerMetre` scales the whole group, including the reach and
// strength of the real lights, for a scene that is not in metres (the kitchen planner uses centimetres).
// Dimming: one run = one circuit (the owner's rule), so setLevel takes a run id, never a kind of head.
export function createTrackLights(config, ceiling, {realLights = true, room = null, unitsPerMetre = 1} = {}) {
  const wallAhead = room ?? {x: 0, z: 0}
  const group = new THREE.Group(); group.name = 'Track lights'
  const white = new THREE.MeshStandardMaterial({color: '#f4f2ee', roughness: .5}), head = new THREE.MeshStandardMaterial({color: '#ecebe7', roughness: .4, metalness: .2})
  // Light colour from the config's colour temperature (render/renderQuality.mjs lampColour: 3000 K warm white, 4000 K neutral
  // white; all heads used one fixed warm tint before 2026-10-05, so the 4000 K kitchen looked as warm as the 3000 K rooms).
  const lamp = lampColour(config.kelvin ?? 3000)
  // One glowing-lens material and one list of real lights per run, so each circuit dims on its own (setLevel).
  const lensFor = () => { const m = new THREE.MeshStandardMaterial({color: '#fff3dc', emissive: lamp, emissiveIntensity: .9, roughness: .9}); m.userData.taskLightGlow = true; return m }
  const circuits = {}
  const s = config.sectionMm / 1000, AIM = {north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0]}
  for (const run of config.runs) {
    const part = new THREE.Group(); part.name = run.label; group.add(part)
    const circuit = circuits[run.id] = {lens: lensFor(), lights: []}
    const length = (run.toMm - run.fromMm) / 1000, mid = (run.fromMm + run.toMm) / 2000, at = run.atMm / 1000, alongX = run.axis === 'x'
    const bar = new THREE.Mesh(new THREE.BoxGeometry(alongX ? length : s, s, alongX ? s : length), white)
    bar.position.set(alongX ? mid : at, ceiling - s / 2, alongX ? at : mid); part.add(bar)
    for (const h of run.heads) {
      const x = alongX ? h.atMm / 1000 : at, z = alongX ? at : h.atMm / 1000, y = ceiling - s
      if (h.kind === 'diffuse') {
        const len = h.lengthMm / 1000
        const body = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len : .03, .03, alongX ? .03 : len), head); body.position.set(x, y - .015, z); part.add(body)
        const glow = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len - .02 : .024, .004, alongX ? .024 : len - .02), circuit.lens); glow.position.set(x, y - .032, z); part.add(glow)
        if (realLights) { const light = new THREE.PointLight(lamp, .9, 4.2, 1.6); light.position.set(x, y - .06, z); part.add(light); circuit.lights.push(light) }
      } else if (h.kind === 'reading') {
        // A stronger spot pointing down at the seat, bed or work spot below, or tilted a little toward targetMm.
        const tx = h.targetMm ? h.targetMm.xMm / 1000 : x, tz = h.targetMm ? h.targetMm.zMm / 1000 : z, th = (h.targetHeightMm ?? 600) / 1000
        const can = new THREE.Group(); can.position.set(x, y - .02, z); part.add(can)
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .04, 10), head); can.add(stem)
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.03, .034, .1, 20), head); cylinder.position.y = -.07; can.add(cylinder)
        const face = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, .004, 20), circuit.lens); face.position.y = -.122; can.add(face)
        // Tilt the can toward its target: rotate its down axis about (down x toward) = (-dz, 0, dx), by the tilt angle.
        const dx = tx - x, dz = tz - z, drop = y - .02 - th, tilt = Math.atan2(Math.hypot(dx, dz), drop)
        if (tilt > 1e-4) can.rotateOnAxis(new THREE.Vector3(-dz, 0, dx).normalize(), tilt)
        if (realLights) {
          const light = new THREE.SpotLight(lamp, 4.2, 3.6, .5, .6, 1.3); light.position.set(x, y - .14, z)
          light.target.position.set(tx, th, tz); part.add(light, light.target); circuit.lights.push(light)
        }
      } else {
        const [dx, dz] = AIM[h.aim]
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .05, 10), head); stem.position.set(x, y - .025, z); part.add(stem)
        const can = new THREE.Mesh(new THREE.CylinderGeometry(.026, .03, .09, 20), head); can.position.set(x + dx * .02, y - .075, z + dz * .02)
        can.rotation.z = -dx * .5; can.rotation.x = dz * .5; part.add(can)
        const face = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .004, 20), circuit.lens); face.position.set(x + dx * .042, y - .118, z + dz * .042); face.rotation.copy(can.rotation); part.add(face)
        if (realLights) {
          // Aimed at the wall beside the run: `reach` is the distance from the run to that wall.
          const reach = dx < 0 ? x : dx > 0 ? wallAhead.x - x : dz < 0 ? z : wallAhead.z - z
          const light = new THREE.SpotLight(lamp, 2.4, 3.4, .42, .7, 1.4); light.position.set(x, y - .1, z)
          light.target.position.set(x + dx * (reach - .02), 1.25, z + dz * (reach - .02)); part.add(light, light.target); circuit.lights.push(light)
        }
      }
    }
  }
  // A scene in other units: scale the geometry, and the lights' reach and strength with it (three.js does not scale a
  // light's distance or its inverse-power falloff with its parent). Done before `base` is recorded below.
  if (unitsPerMetre !== 1) {
    group.scale.setScalar(unitsPerMetre)
    for (const {lights} of Object.values(circuits)) for (const light of lights) { light.distance *= unitsPerMetre; light.intensity *= unitsPerMetre ** light.decay }
  }
  const dimmable = Object.fromEntries(Object.entries(circuits).map(([id, c]) => [id, {lens: c.lens, lights: c.lights.map(light => ({light, base: light.intensity}))}]))
  // level 0 = off, 1 = the planned brightness; scales the real lights and the lens glow of every head on one run (circuit).
  group.userData.setLevel = (runId, level) => {
    const circuit = dimmable[runId]; if (!circuit) return
    for (const {light, base} of circuit.lights) { light.userData.dimLevel = level; light.intensity = base * level }
    circuit.lens.emissiveIntensity = .9 * Math.min(level, 1.5)
  }
  group.userData.circuits = Object.keys(dimmable)
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
  if (config.ceilingFans) group.add(createCeilingFans(config.ceilingFans, ceiling))
  // The ceiling is the same whatever the seating layout, so every layout shows its mouldings.
  group.add(createCeilingMouldings(DRAWING_CEILING_MOULDINGS, room))
  const tracks = config.tracks ? createTrackLights(config.tracks, ceiling) : null
  if (tracks) group.add(tracks)
  // Dimmer, one circuit at a time: 'chandelier', or a run id ('T1', 'T2'); level 0 = off, 1 = planned. The level is also kept
  // on each light (userData.dimLevel) so a page that rescales lights for day and evening can keep it.
  group.userData.setTrackLight = (circuit, level) => {
    if (circuit === 'chandelier') for (const {light, base} of chandelierLights) { light.userData.dimLevel = level; light.intensity = base * level }
    else tracks?.userData.setLevel(circuit, level)
  }
  const glow = config.sofaGlow
  box((glow.lengthMm - 160) / 1000, .012, .025, glow.xMm / 1000, glow.heightMm / 1000, glow.fromNorthMm / 1000, diffuser)
  return group
}
