// Pure checks for the Drawing Room track lights and ceiling fans (millimetres, no React or Three.js).
// Room frame: x from the west wall, z from the north wall. Config: DRAWING_LIGHTING[layout] in drawingLightingConfig.js.

export const TRACK_TO_BLADE_MM = 50      // a track run must stay this far outside every fan's blade circle
export const DIFFUSE_TO_BLADE_MM = 300   // a diffused head shines straight down, so it stays further out
export const DRIVER_LOAD_FRACTION = 0.8  // do not load the 48 V driver beyond this

/** Plan position of a head on its run. */
export function headPosition(run, head) {
  return run.axis === 'x' ? {x: head.atMm, z: run.atMm} : {x: run.atMm, z: head.atMm}
}

const distanceToRun = (run, point) => {
  const along = run.axis === 'x' ? point.x : point.z, across = run.axis === 'x' ? point.z : point.x
  const clamped = Math.min(Math.max(along, run.fromMm), run.toMm)
  return Math.hypot(along - clamped, across - run.atMm)
}

/** Floor footprints of the layout C sofas (the west sofa faces east, the south sofa faces north). */
function seatRectangles(room) {
  const f = room.southLayout.furniture, w = f.westSofa, s = f.southSofa
  return [
    {x1: w.centerXmm - w.widthMm / 2, x2: w.centerXmm + w.widthMm / 2, z1: w.centerZmm - w.lengthMm / 2, z2: w.centerZmm + w.lengthMm / 2},
    {x1: s.centerXmm - s.lengthMm / 2, x2: s.centerXmm + s.lengthMm / 2, z1: s.centerZmm - s.widthMm / 2, z2: s.centerZmm + s.widthMm / 2},
  ]
}

export function checkDrawingLighting(room, config) {
  const issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const fans = config.ceilingFans, tracks = config.tracks, radius = fans.bladeDiameterMm / 2
  const chandelier = config.ambient[0], fanPoints = fans.fans.map(f => ({x: f.xMm, z: f.zMm, label: f.label}))
  const clearances = {}

  for (const fan of fanPoints) {
    const toChandelier = Math.hypot(fan.x - chandelier.xMm, fan.z - chandelier.zMm) - radius - fans.chandelierRadiusMm
    clearances[`${fan.label} to chandelier`] = Math.round(toChandelier)
    need(toChandelier >= 100, `${fan.label}: the blades come within ${Math.round(toChandelier)} mm of the chandelier (needs 100)`)
    need(fan.x - radius >= 150 && fan.x + radius <= room.widthMm - 150 && fan.z - radius >= 150 && fan.z + radius <= room.lengthMm - 150, `${fan.label}: the blades are within 150 mm of a wall`)
  }

  let watts = 0, lumens = 0, spots = 0, diffused = 0, reading = 0
  const sofas = seatRectangles(room)
  for (const run of tracks.runs) {
    const limit = run.axis === 'x' ? room.widthMm : room.lengthMm, across = run.axis === 'x' ? room.lengthMm : room.widthMm
    need(run.fromMm >= 100 && run.toMm <= limit - 100 && run.toMm > run.fromMm, `${run.id}: the run leaves the room`)
    need(run.atMm >= 300 && run.atMm <= across - 300, `${run.id}: the run is closer than 300 mm to a wall, too close for its heads`)
    for (const fan of fanPoints) {
      const gap = distanceToRun(run, fan) - radius
      clearances[`${run.id} to ${fan.label}`] = Math.round(gap)
      need(gap >= TRACK_TO_BLADE_MM, `${run.id} passes ${Math.round(gap)} mm from the blades of the ${fan.label} (needs ${TRACK_TO_BLADE_MM})`)
    }
    for (const head of run.heads) {
      const at = headPosition(run, head), half = (head.lengthMm ?? 60) / 2
      need(head.atMm - half >= run.fromMm && head.atMm + half <= run.toMm, `${run.id}: a ${head.kind} head at ${head.atMm} is off the end of the run`)
      watts += head.watts; lumens += head.lumens
      if (head.kind === 'diffuse' || head.kind === 'reading') {
        const name = head.kind === 'diffuse' ? 'diffused' : 'reading'
        if (head.kind === 'diffuse') diffused++; else reading++
        for (const fan of fanPoints) {
          const gap = Math.hypot(at.x - fan.x, at.z - fan.z) - radius
          need(gap >= DIFFUSE_TO_BLADE_MM, `${run.id}: a ${name} head is ${Math.round(gap)} mm from the blades of the ${fan.label}; it would flicker (needs ${DIFFUSE_TO_BLADE_MM})`)
        }
        // A reading head points straight down, so it must be over a sofa seat.
        if (head.kind === 'reading') need(sofas.some(r => at.x >= r.x1 && at.x <= r.x2 && at.z >= r.z1 && at.z <= r.z2), `${run.id}: the reading head at ${head.atMm} is not over a sofa`)
      } else {
        spots++
        // A spot must point at the wall nearest its run, away from the middle of the room where the fans are.
        const nearest = run.axis === 'x' ? (run.atMm < room.lengthMm / 2 ? 'north' : 'south') : (run.atMm < room.widthMm / 2 ? 'west' : 'east')
        need(head.aim === nearest, `${run.id}: a spot aims ${head.aim}, across the room, not at the ${nearest} wall beside its run`)
      }
    }
  }
  need(watts <= tracks.driverWatts * DRIVER_LOAD_FRACTION, `the heads draw ${watts} W, over ${DRIVER_LOAD_FRACTION * 100}% of the ${tracks.driverWatts} W driver`)
  need(spots > 0 && diffused > 0, 'the tracks need both spot and diffused heads for layered light')
  need(config.reading || reading > 0, 'no reading light: neither a wall reading light nor a reading head over a seat')
  const areaM2 = room.widthMm * room.lengthMm / 1e6
  return {ok: issues.length === 0, issues, clearances, totals: {watts, lumens, spots, diffused, reading, heads: spots + diffused + reading, lumensPerM2: Math.round(lumens / areaM2), trackMetres: tracks.runs.reduce((sum, run) => sum + (run.toMm - run.fromMm), 0) / 1000}}
}
