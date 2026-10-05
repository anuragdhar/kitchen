// Pure geometry and checks for the whole-home AC plan of config/acPlanConfig.js (no React, Three.js or DOM).
// `plan` is the AC_PLAN bundle. Frames: plan pixels (x growing WEST, y growing NORTH; plan.scale = metres per pixel) and
// room frames in millimetres (x from the room's west wall growing east, z from its north wall growing south).
// Everything is an estimate from typical figures: the checks say whether the plan hangs together, not that it was measured.

/** A room-frame point as plan pixels (the same mapping Whole home 3D uses to place a room). */
export function roomToPlan(frame, xMm, zMm) {
  const [x1, y1, x2, y2] = frame.bounds
  return {planX: x2 - xMm / frame.widthMm * (x2 - x1), planY: y2 - zMm / frame.lengthMm * (y2 - y1)}
}

/** Any waypoint form of the config as {planX, planY, heightMm}. */
export function resolveWaypoint(waypoint, plan) {
  if (waypoint.frame) return {...roomToPlan(plan.frames[waypoint.frame], waypoint.xMm, waypoint.zMm), heightMm: waypoint.heightMm}
  if (waypoint.outdoor) {
    const unit = plan.outdoorUnits.find(u => u.id === waypoint.outdoor)
    if (!unit) throw new Error(`no outdoor unit "${waypoint.outdoor}"`)
    return {planX: unit.centre.planX, planY: unit.centre.planY, heightMm: waypoint.heightMm ?? unit.bottomMm + plan.rules.pipe.valveAboveBottomMm}
  }
  if (waypoint.discharge) {
    const point = plan.discharge[waypoint.discharge]
    if (!point) throw new Error(`no discharge point "${waypoint.discharge}"`)
    const at = resolveWaypoint(point.at, plan)
    return {...at, heightMm: waypoint.heightMm ?? at.heightMm}
  }
  return {planX: waypoint.planX, planY: waypoint.planY, heightMm: waypoint.heightMm}
}

/** A route (list of waypoints) as plan points, with each segment's horizontal run and fall in mm. */
export function resolveRoute(waypoints, plan) {
  const points = waypoints.map(w => resolveWaypoint(w, plan)), mmX = plan.scale.xMetresPerPixel * 1000, mmY = plan.scale.zMetresPerPixel * 1000
  const segments = points.slice(1).map((b, i) => {
    const a = points[i], runMm = Math.hypot((b.planX - a.planX) * mmX, (b.planY - a.planY) * mmY), fallMm = a.heightMm - b.heightMm
    return {runMm, fallMm, lengthMm: Math.hypot(runMm, fallMm)}
  })
  return {points, segments, lengthMm: segments.reduce((sum, s) => sum + s.lengthMm, 0)}
}

/** Refrigerant route: drawn length, length to order (with the allowance for bends and tails), and the height difference. */
export function pipeRoute(waypoints, plan) {
  const route = resolveRoute(waypoints, plan), heights = route.points.map(p => p.heightMm)
  const lengthM = Math.round((route.lengthMm / 1000 + plan.rules.pipe.allowanceM) * 10) / 10
  return {...route, drawnM: Math.round(route.lengthMm / 100) / 10, lengthM, liftM: Math.round((Math.max(...heights) - Math.min(...heights)) / 100) / 10,
    extraGasG: Math.max(0, Math.round((lengthM - plan.rules.pipe.prechargedM) * plan.rules.pipe.extraGasGPerM))}
}

/** Simple heat-load estimate of one space (AC_PLAN_RULES.load explains the rule of thumb). */
export function estimateLoad(space, rules) {
  const r = rules.load, load = space.load
  const areaM2 = space.area.reduce((sum, part) => sum + part.widthMm * part.lengthMm / 1e6, 0)
  const glass = (load.glass ?? []).map(g => {
    const m2 = g.widthMm * g.heightMm / 1e6, factor = r.sunFacing.includes(g.facing) ? (g.shaded ? r.shadedGlassFactor : 1) : 0
    return {label: g.label, facing: g.facing, m2, watts: m2 * r.sunGlassWPerM2 * factor}
  })
  const parts = {
    room: areaM2 * r.baseWPerM2, roof: load.topFloor ? areaM2 * r.roofWPerM2 : 0,
    glass: glass.reduce((sum, g) => sum + g.watts, 0), people: load.people * r.personW, equipment: load.equipmentW ?? 0,
  }
  const watts = Object.values(parts).reduce((sum, w) => sum + w, 0), tons = watts / r.wattsPerTon
  const recommendedTons = r.marketTons.find(size => size >= tons) ?? null
  return {areaM2: Math.round(areaM2 * 10) / 10, sunGlassM2: Math.round(glass.filter(g => g.watts > 0).reduce((s, g) => s + g.m2, 0) * 10) / 10,
    parts, watts: Math.round(watts), tons: Math.round(tons * 100) / 100, recommendedTons}
}

const BLOW = {east: {x: 1, z: 0}, west: {x: -1, z: 0}, north: {x: 0, z: -1}, south: {x: 0, z: 1}} // room frame
const overlap = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.z2, b.z2) - Math.max(a.z1, b.z1))
const grow = (rect, direction, frontMm, sideMm) => {
  const d = BLOW[direction], out = {x1: rect.x1 - (d.x ? 0 : sideMm), x2: rect.x2 + (d.x ? 0 : sideMm), z1: rect.z1 - (d.z ? 0 : sideMm), z2: rect.z2 + (d.z ? 0 : sideMm)}
  if (d.x > 0) out.x2 += frontMm; if (d.x < 0) out.x1 -= frontMm; if (d.z > 0) out.z2 += frontMm; if (d.z < 0) out.z1 -= frontMm
  return out
}

/** The casing of a space's indoor unit on the floor plan of its room frame, with its heights and the side it blows to. */
export function indoorUnitBox(space, plan, indoor = space.indoor, tons = space.tons) {
  if (!indoor) return null
  if (indoor.rect) return {...indoor.rect, bottomMm: indoor.bottomMm, topMm: indoor.bottomMm + indoor.heightMm, blows: indoor.blows, level: !!indoor.level}
  const frame = plan.frames[space.frame], size = indoor.size ?? plan.indoorSizes[tons]
  const a1 = indoor.centreMm - size.widthMm / 2, a2 = indoor.centreMm + size.widthMm / 2, d = size.depthMm
  const rect = indoor.wall === 'west' ? {x1: 0, x2: d, z1: a1, z2: a2} : indoor.wall === 'east' ? {x1: frame.widthMm - d, x2: frame.widthMm, z1: a1, z2: a2}
    : indoor.wall === 'north' ? {x1: a1, x2: a2, z1: 0, z2: d} : {x1: a1, x2: a2, z1: frame.lengthMm - d, z2: frame.lengthMm}
  return {...rect, bottomMm: indoor.bottomMm, topMm: indoor.bottomMm + size.heightMm, blows: indoor.blows, level: false, wall: indoor.wall, alongMm: [a1, a2]}
}

/** Where the cold air lands: the strip in front of the casing from the near edge of the stream to the end of its throw. */
export function draftZone(box, rules) {
  const draft = rules.indoor.draft, d = BLOW[box.blows], near = box.level ? 0 : draft.nearMm
  const zone = grow(box, box.blows, draft.throwMm, draft.spreadMm)
  if (d.x > 0) zone.x1 = box.x2 + near; if (d.x < 0) zone.x2 = box.x1 - near; if (d.z > 0) zone.z1 = box.z2 + near; if (d.z < 0) zone.z2 = box.z1 - near
  return zone
}

const headStrip = (bed, headMm) => bed.headWall === 'east' ? {...bed, x1: bed.x2 - headMm} : bed.headWall === 'west' ? {...bed, x2: bed.x1 + headMm}
  : bed.headWall === 'north' ? {...bed, z2: bed.z1 + headMm} : {...bed, z1: bed.z2 - headMm}
const rectToPlan = (rect, frame) => { const a = roomToPlan(frame, rect.x1, rect.z1), b = roomToPlan(frame, rect.x2, rect.z2); return {x1: Math.min(a.planX, b.planX), x2: Math.max(a.planX, b.planX), z1: Math.min(a.planY, b.planY), z2: Math.max(a.planY, b.planY)} }
const mm = value => Math.round(value)

function checkPlacement(name, box, space, plan, say) {
  const r = plan.rules.indoor, frame = plan.frames[space.frame], {issue, warn} = say
  if (!box.level && frame.heightMm - box.topMm < r.ceilingClearMm) issue(`${name}: the indoor unit reaches ${box.topMm} mm, less than ${r.ceilingClearMm} mm under the ${frame.heightMm} mm ceiling`)
  const keepClear = grow(box, box.blows, r.trackClearMm, r.sideTrackClearMm)
  if (!box.level) for (const run of space.ceiling?.tracks ?? []) {
    const line = run.axis === 'x' ? {x1: run.fromMm, x2: run.toMm, z1: run.atMm, z2: run.atMm} : {x1: run.atMm, x2: run.atMm, z1: run.fromMm, z2: run.toMm}
    if (line.x1 <= keepClear.x2 && line.x2 >= keepClear.x1 && line.z1 <= keepClear.z2 && line.z2 >= keepClear.z1) issue(`${name}: ceiling track ${run.id} runs within ${r.trackClearMm} mm in front of the indoor unit`)
  }
  for (const fan of box.level ? [] : space.ceiling?.fans ?? []) {
    const dx = Math.max(box.x1 - fan.xMm, 0, fan.xMm - box.x2), dz = Math.max(box.z1 - fan.zMm, 0, fan.zMm - box.z2), gap = Math.hypot(dx, dz) - space.ceiling.bladeDiameterMm / 2
    if (gap < r.fanClearMm) issue(`${name}: the indoor unit is ${mm(gap)} mm from the blade tips of the ${fan.label.toLowerCase()} (needs ${r.fanClearMm})`)
  }
  const tallZone = grow(box, box.blows, r.tallFrontMm, r.tallSideMm)
  for (const item of space.tall ?? []) if (item.topMm > box.bottomMm - r.tallBelowMm && overlap(tallZone, item) > 0) issue(`${name}: the ${item.label} (${item.topMm} mm high) stands in the air path of the indoor unit`)
  const zone = draftZone(box, plan.rules)
  for (const bed of space.occupied?.beds ?? []) {
    if (overlap(grow(box, box.blows, 300, 0), headStrip(bed, r.bedHeadMm)) > 0) warn(`${name}: the indoor unit hangs above the head of the ${bed.label}`)
    const share = overlap(zone, bed) / ((bed.x2 - bed.x1) * (bed.z2 - bed.z1))
    if (share >= r.draft.minOverlap) warn(`${name}: the air blows straight onto the ${bed.label} (${Math.round(share * 100)}% of it lies in the stream)`)
  }
  for (const seat of space.occupied?.seats ?? []) {
    const share = overlap(zone, seat) / ((seat.x2 - seat.x1) * (seat.z2 - seat.z1))
    if (share >= r.draft.minOverlap) warn(`${name}: the air blows straight onto the ${seat.label}`)
  }
  return zone
}

/** Condensate route: never uphill, at least the minimum fall on every sloping stretch, ending at a listed discharge point. */
export function checkDrain(name, waypoints, plan, say) {
  const route = resolveRoute(waypoints, plan), last = waypoints[waypoints.length - 1], point = plan.discharge[last.discharge]
  route.segments.forEach((s, i) => {
    if (s.fallMm < 0) say.issue(`${name}: the drain rises ${mm(-s.fallMm)} mm on stretch ${i + 1}; water will not run uphill`)
    else if (s.runMm > 1 && s.fallMm / s.runMm < plan.rules.drain.minFall - 1e-9) say.issue(`${name}: drain stretch ${i + 1} falls only ${mm(s.fallMm)} mm in ${mm(s.runMm)} mm (needs 1 in ${Math.round(1 / plan.rules.drain.minFall)})`)
  })
  if (!point) say.issue(`${name}: the drain does not end at a discharge point`)
  else if (!point.confirmed) say.note(`${name}: drain ends at the ${point.label}: not confirmed on site`)
  return {...route, lengthM: Math.round(route.lengthMm / 100) / 10, discharge: point?.label ?? null}
}

/**
 * The whole plan. `issues` are things that make the plan wrong as drawn; `warnings` are compromises the owner should know
 * about; `notes` are assumptions. `rows` is one summary per space (the table of docs/AC_PLAN.md and the 3D labels).
 */
export function checkAcPlan(plan) {
  const issues = [], warnings = [], notes = []
  const say = {issue: m => issues.push(m), warn: m => warnings.push(m), note: m => notes.push(m)}
  const rules = plan.rules, boxes = [], usedOutdoor = new Map()
  const rows = plan.spaces.map(space => {
    const load = estimateLoad(space, rules), name = space.name
    const row = {id: space.id, name, type: space.type, status: space.status, tons: space.tons, load, pipe: null, drain: null, box: null, zone: null, alternatives: []}
    if (space.type === 'none') { if (!space.decision) say.issue(`${name}: no machine and no reason given`); return row }
    // Size against the estimate.
    if (load.tons > space.tons) say.warn(`${name}: the estimate is ${load.tons} ton against a ${space.tons} ton unit; it will struggle on the hottest afternoons`)
    else if (load.tons > space.tons * rules.load.marginalAbove) say.warn(`${name}: the estimate (${load.tons} ton) is at the limit of a ${space.tons} ton unit; ask the dealer about the next size`)
    if (!space.tonsKnown) say.note(`${name}: the size of the existing unit was not given; taken as ${space.tons} ton`)
    // Indoor unit.
    const machines = [[space.indoor, space.tons, space.tall, '']]
    if (space.splitAlternative?.active) machines.push([space.splitAlternative.indoor, space.splitAlternative.tons, space.splitAlternative.tall, ' (second machine)'])
    if (machines.length > 1) say.issue(`${name}: two machines cool the same room; they fight each other's thermostat`)
    machines.forEach(([indoor, tons, tall, tag]) => {
      const box = indoorUnitBox(space, plan, indoor, tons), zone = checkPlacement(name + tag, box, {...space, tall}, plan, say)
      boxes.push({space, box, zone}); if (!tag) { row.box = box; row.zone = zone }
    })
    if (space.indoor.positionKnown === false) say.note(`${name}: where the existing indoor unit hangs was not recorded; the plan shows where it should be`)
    const bay = space.indoor.enclosure
    if (bay) {
      say.warn(`${name}: the indoor unit sits inside ${bay.label}; the slats cut its airflow and a front panel must come off for service`)
      const [a1, a2] = row.box.alongMm
      if (a1 - bay.fromMm < 50 || bay.toMm - a2 < 50) say.issue(`${name}: the unit (${mm(a1)}-${mm(a2)}) does not fit the bay (${mm(bay.fromMm)}-${mm(bay.toMm)}) with 50 mm each side`)
    }
    // Refrigerant pipes and the outdoor unit.
    if (space.type === 'split') {
      const unit = plan.outdoorUnits.find(u => u.id === space.outdoorUnitId)
      if (!unit) say.issue(`${name}: no outdoor unit "${space.outdoorUnitId}" in acOutdoorUnitsConfig.js`)
      else {
        if (usedOutdoor.has(unit.id)) say.issue(`${name} and ${usedOutdoor.get(unit.id)}: both use the outdoor unit "${unit.id}"`)
        usedOutdoor.set(unit.id, name)
        if (unit.tons !== space.tons) say.note(`${name}: the outdoor unit is drawn as ${unit.tons} ton; the plan asks for ${space.tons}`)
        const service = plan.service[unit.id]
        if (!service?.from) say.warn(`${name}: the outdoor unit cannot be reached from a balcony or window: ${service?.note ?? 'no access recorded'}`)
        else if (service.reachMm > rules.outdoor.serviceReachMm) say.warn(`${name}: the outdoor unit is a ${service.reachMm} mm reach from ${service.from}`)
        row.outdoor = {id: unit.id, status: unit.status, mount: unit.mount, bottomMm: unit.bottomMm, service: service?.from ?? null}
        const pipe = pipeRoute(space.pipe, plan), p = rules.pipe; row.pipe = pipe
        if (pipe.lengthM > p.maxM) say.issue(`${name}: the pipe run is ${pipe.lengthM} m, past the usual ${p.maxM} m maximum`)
        else if (pipe.lengthM > p.prechargedM) say.warn(`${name}: the pipe run is ${pipe.lengthM} m, past the usual ${p.prechargedM} m factory charge: about ${pipe.extraGasG} g of extra gas`)
        if (pipe.lengthM < p.minM) say.note(`${name}: the pipe run is only ${pipe.lengthM} m; some makers ask for at least ${p.minM} m (a loop is left in the pipe)`)
        if (pipe.liftM > p.maxLiftM) say.issue(`${name}: the pipes rise ${pipe.liftM} m, past the usual ${p.maxLiftM} m`)
      }
      row.alternatives = (space.alternatives ?? []).map(alt => ({id: alt.id, label: alt.label, pipe: pipeRoute(alt.pipe, plan)}))
    }
    // Drain and power.
    if (!space.drain) say.issue(`${name}: no drain route`); else row.drain = checkDrain(name, space.drain, plan, say)
    const power = space.power
    if (!power) say.issue(`${name}: no power point`)
    else if (power.configPoint && row.box.alongMm) {
      const gap = Math.min(...row.box.alongMm.map(edge => Math.abs(edge - power.configPoint.alongMm)))
      if (power.configPoint.wall !== row.box.wall || gap > rules.indoor.powerPointWithinMm) say.issue(`${name}: power point ${power.configPoint.id} is not within ${rules.indoor.powerPointWithinMm} mm of the indoor unit`)
      if (power.configPoint.alongMm > row.box.alongMm[0] && power.configPoint.alongMm < row.box.alongMm[1]) say.issue(`${name}: power point ${power.configPoint.id} is hidden behind the indoor unit`)
    } else if (power.newPoint) say.note(`${name}: needs a new AC power point (${power.newPoint.note})`)
    return row
  })
  // Units in rooms that share air: one must not blow into the other.
  const linked = (a, b) => a.id === b.id || plan.connected.some(pair => pair.includes(a.id) && pair.includes(b.id))
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j]
    if (!linked(a.space, b.space)) continue
    const fa = plan.frames[a.space.frame], fb = plan.frames[b.space.frame]
    const za = rectToPlan(a.zone, fa), zb = rectToPlan(b.zone, fb), ba = rectToPlan(a.box, fa), bb = rectToPlan(b.box, fb)
    const opposed = BLOW[a.box.blows].x === -BLOW[b.box.blows].x && BLOW[a.box.blows].z === -BLOW[b.box.blows].z
    if (overlap(za, bb) > 0 || overlap(zb, ba) > 0) say.issue(`${a.space.name} and ${b.space.name}: one indoor unit blows straight at the other`)
    else if (opposed && overlap(za, zb) > 0) say.issue(`${a.space.name} and ${b.space.name}: the two indoor units blow against each other`)
  }
  return {ok: issues.length === 0, issues, warnings, notes, rows}
}
