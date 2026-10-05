// Whole-home palette rules (pure: no React, Three.js or DOM). The data lives in src/config/homePaletteConfig.js.
// A palette is a small set of named colours plus, per room, which colour each surface role uses. Nothing here holds a
// dimension or a position: a palette can only change what a surface looks like.

export const SURFACE_ROLES = Object.freeze(['wall', 'accentWall', 'ceiling', 'floor', 'wood', 'wood2', 'furniture', 'door', 'metal', 'fabric', 'accent', 'accent2', 'tile', 'counter', 'light'])
export const ROLE_LABELS = Object.freeze({wall: 'Walls', accentWall: 'Accent wall', ceiling: 'Ceiling', floor: 'Floor', wood: 'Main wood', wood2: 'Second wood', furniture: 'Loose furniture', door: 'Doors', metal: 'Metal and handles', fabric: 'Main fabric', accent: 'Accent', accent2: 'Second accent', tile: 'Tiles', counter: 'Worktop', light: 'Light colour'})
/** What a room of each type must have an answer for. Other roles are optional per room. */
export const REQUIRED_ROLES = Object.freeze({
  living: ['wall', 'ceiling', 'floor', 'wood', 'door', 'metal', 'fabric', 'light'],
  bedroom: ['wall', 'ceiling', 'floor', 'wood', 'door', 'metal', 'fabric', 'light'],
  work: ['wall', 'ceiling', 'floor', 'wood', 'metal', 'light'],
  entry: ['wall', 'ceiling', 'floor', 'wood', 'door', 'metal', 'light'],
  alcove: ['wall', 'floor', 'wood', 'metal'],
  store: ['wall', 'floor', 'wood', 'metal'],
  office: ['wall', 'floor', 'wood', 'metal'],
  outdoor: ['wall', 'floor', 'metal'],
})
export const WOOD_ROLES = Object.freeze(['wood', 'wood2', 'furniture', 'door'])
export const PALETTE_LIMITS = Object.freeze({
  maxWoodTonesPerRoom: 2,       // the main wood plus at most one more (a second built-in tone, or dark loose furniture)
  maxWoodTonesWholeHome: 3,     // main wood, the kitchen's own wood, one dark tone for loose furniture
  maxMetalFinishesWholeHome: 2, // one handle finish, plus the stainless entry door
  minWallWoodContrast: 1.3,     // WCAG contrast ratio: below this, cabinetry disappears into the wall
  maxAccentColours: 3,          // besides the main fabric
  // Light colour (Kelvin) by intent and room type. The kitchen may be cooler than the rest in either scheme.
  warm: {living: [2700, 3000], bedroom: [2700, 3000], entry: [2700, 4000], work: [3000, 4000], alcove: [2700, 3000], office: [2700, 4000], store: [2700, 4000], outdoor: [2700, 4000]},
  neutral: {living: [3500, 4000], bedroom: [3000, 4000], entry: [3500, 4000], work: [4000, 4000], alcove: [2700, 3000], office: [3500, 4000], store: [3500, 4000], outdoor: [3000, 4000]},
})

const HEX = /^#[0-9a-f]{6}$/
export const isHex = value => typeof value === 'string' && HEX.test(value)
export function hexToRgb(hex) {
  if (!isHex(hex)) throw new Error(`Not a six-digit lower-case hex colour: ${hex}`)
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
}
const toLinear = c => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const toSrgb = v => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055))
/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex) { const [r, g, b] = hexToRgb(hex).map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
/** WCAG contrast ratio, 1 (same) to 21 (black on white). */
export function contrastRatio(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
/** Positive = warm (more red than blue), negative = cool. Plain sRGB difference, enough to tell a cream from a grey-white. */
export function warmth(hex) { const [r, , b] = hexToRgb(hex); return r - b }

/**
 * The multiplier that turns a veneer texture of average colour `textureAverageHex` into roughly `targetHex`.
 * The renderer multiplies texture and colour in linear light, so the division is done there too. Channels are capped at 1
 * (a texture cannot be made lighter than itself), so `reached` says what the result will actually average.
 */
export function veneerTint(targetHex, textureAverageHex) {
  const target = hexToRgb(targetHex).map(toLinear), base = hexToRgb(textureAverageHex).map(toLinear)
  const factor = target.map((value, i) => Math.min(1, value / Math.max(base[i], 1e-4)))
  const hex = list => '#' + list.map(v => toSrgb(v).toString(16).padStart(2, '0')).join('')
  return {tint: hex(factor), reached: hex(factor.map((f, i) => f * base[i])), exact: target.every((value, i) => value <= base[i] + 1e-9)}
}

/** Role -> colour key for one room: the palette's defaults for the room's type, then the room's own overrides. */
export function roomMapping(palette, roomId) {
  const room = palette.rooms?.[roomId]
  if (!room) return null
  return {...(palette.roomDefaults?.[room.type] || {}), ...(room.roles || {})}
}

/** Role -> {key, name, hex | kelvin, ...entry} for one room, skipping unmapped roles. */
export function roomSwatches(palette, roomId) {
  const mapping = roomMapping(palette, roomId)
  if (!mapping) return []
  return SURFACE_ROLES.filter(role => mapping[role]).map(role => role === 'light'
    ? {role, key: mapping[role], kelvin: palette.lights[mapping[role]], name: `${palette.lights[mapping[role]]} K`}
    : {role, key: mapping[role], ...palette.colours[mapping[role]]})
}

const isWood = entry => entry?.kind === 'wood'

/**
 * Checks one palette against the room list. Returns rows {id, room, pass, detail}; never throws for a design problem.
 * `rooms` is the stable room list ({id}) from src/home/rooms.mjs.
 */
export function checkPalette(palette, rooms, limits = PALETTE_LIMITS) {
  const rows = [], add = (id, room, pass, detail) => rows.push({id, room, pass: !!pass, detail})
  const colours = palette.colours || {}, lights = palette.lights || {}
  const badHex = Object.entries(colours).filter(([, entry]) => !isHex(entry?.hex) || !entry?.name || !entry?.kind || !entry?.spec).map(([key]) => key)
  add('colours-specified', null, !badHex.length && Object.keys(colours).length > 0, badHex.length ? `Missing hex, name, kind or buying specification: ${badHex.join(', ')}` : `${Object.keys(colours).length} named colours, each with a hex and a buying specification`)
  if (badHex.length) return rows // the colour comparisons below need valid hex values
  const intentOk = ['warm', 'neutral'].includes(palette.intent)
  add('intent-declared', null, intentOk, intentOk ? `Intent: ${palette.intent}` : `Unknown intent: ${palette.intent}`)

  const usedKeys = new Set(), woodKeysHome = new Set()
  for (const {id} of rooms) {
    const room = palette.rooms?.[id], mapping = roomMapping(palette, id)
    if (!mapping || !REQUIRED_ROLES[room.type]) { add('room-mapped', id, false, mapping ? `Unknown room type: ${room.type}` : 'Room has no mapping'); continue }
    const missing = REQUIRED_ROLES[room.type].filter(role => !mapping[role])
    const unknown = Object.entries(mapping).filter(([role, key]) => !SURFACE_ROLES.includes(role) || (role === 'light' ? !Number.isFinite(lights[key]) : !colours[key])).map(([role, key]) => `${role}=${key}`)
    add('room-mapped', id, !missing.length && !unknown.length, missing.length || unknown.length ? [missing.length && `missing ${missing.join(', ')}`, unknown.length && `unknown ${unknown.join(', ')}`].filter(Boolean).join('; ') : `${Object.keys(mapping).length} roles mapped`)
    if (unknown.length) continue
    Object.entries(mapping).forEach(([role, key]) => { if (role !== 'light') usedKeys.add(key) })

    const woodKeys = [...new Set(WOOD_ROLES.map(role => mapping[role]).filter(key => isWood(colours[key])))]
    const woodHexes = [...new Set(woodKeys.map(key => colours[key].hex))]
    woodKeys.forEach(key => woodKeysHome.add(colours[key].hex))
    add('wood-tones-per-room', id, woodHexes.length <= limits.maxWoodTonesPerRoom, `${woodHexes.length} wood tone${woodHexes.length === 1 ? '' : 's'} (limit ${limits.maxWoodTonesPerRoom})${woodKeys.length ? ': ' + woodKeys.map(key => colours[key].name).join(', ') : ''}`)

    if (mapping.wall && woodKeys.length) {
      const ratios = woodKeys.map(key => [colours[key].name, contrastRatio(colours[mapping.wall].hex, colours[key].hex)])
      const low = ratios.filter(([, ratio]) => ratio < limits.minWallWoodContrast)
      add('wall-wood-contrast', id, !low.length, ratios.map(([name, ratio]) => `${name} ${ratio.toFixed(2)}:1`).join(', ') + ` against ${colours[mapping.wall].name} (minimum ${limits.minWallWoodContrast}:1)`)
    }

    if (mapping.light && intentOk) {
      const range = limits[palette.intent][room.type], kelvin = lights[mapping.light]
      add('light-matches-intent', id, range && kelvin >= range[0] && kelvin <= range[1], `${kelvin} K; a ${palette.intent} scheme wants ${range?.[0]}-${range?.[1]} K in a ${room.type} room`)
    }
  }
  const unmappedRooms = Object.keys(palette.rooms || {}).filter(id => !rooms.some(room => room.id === id))
  add('rooms-known', null, !unmappedRooms.length, unmappedRooms.length ? `Mapping for unknown rooms: ${unmappedRooms.join(', ')}` : 'Every mapped room is a known room')
  add('wood-tones-whole-home', null, woodKeysHome.size <= limits.maxWoodTonesWholeHome, `${woodKeysHome.size} distinct wood tones in the home (limit ${limits.maxWoodTonesWholeHome})`)
  const metals = [...usedKeys].filter(key => colours[key].kind === 'metal')
  add('metal-finishes-whole-home', null, metals.length <= limits.maxMetalFinishesWholeHome, `${metals.length} metal finishes (limit ${limits.maxMetalFinishesWholeHome}): ${metals.map(key => colours[key].name).join(', ')}`)
  const unused = Object.keys(colours).filter(key => !usedKeys.has(key))
  add('no-unused-colours', null, !unused.length, unused.length ? `Named but used in no room: ${unused.join(', ')}` : 'Every named colour is used somewhere')
  const accents = Object.values(colours).filter(entry => entry.kind === 'fabric' || entry.kind === 'accent')
  add('accent-count', null, accents.length >= 2 && accents.length <= limits.maxAccentColours + 1, `${accents.length} fabric and accent colours (one main fabric plus up to ${limits.maxAccentColours} accents)`)
  const wallKeys = [...usedKeys].filter(key => colours[key].kind === 'paint' && key !== 'ceiling')
  if (intentOk && wallKeys.length) {
    // A warm scheme needs walls that lean yellow-red; a neutral one must not be strongly tinted.
    const main = colours[palette.roomDefaults?.living?.wall] || colours[wallKeys[0]], w = warmth(main.hex)
    add('wall-matches-intent', null, palette.intent === 'warm' ? w >= 10 : w >= 0 && w <= 16, `${main.name} ${main.hex}: red minus blue = ${w}; ${palette.intent === 'warm' ? 'a warm scheme wants 10 or more' : 'a neutral scheme wants 0 to 16'}`)
  }
  return rows
}
export const paletteOk = rows => rows.every(row => row.pass)

/**
 * What a palette would change, room by room, against today's finishes.
 * Returns rows {room, role, from:{name,hex|kelvin,status}, to:{...}, ownerDecision}. `ownerDecision` is true when today's
 * finish for that surface is recorded as an owner decision or as an existing thing that stays: those rows are proposals
 * for the owner to accept or refuse, and nothing applies them.
 */
export function paletteChanges(today, palette, rooms) {
  const rows = []
  for (const {id} of rooms) {
    const before = Object.fromEntries(roomSwatches(today, id).map(s => [s.role, s])), after = roomSwatches(palette, id)
    for (const next of after) {
      const prev = before[next.role]
      const same = prev && (next.role === 'light' ? prev.kelvin === next.kelvin : prev.hex === next.hex)
      if (same) continue
      rows.push({room: id, role: next.role, from: prev || null, to: next, ownerDecision: !!prev && ['owner', 'existing'].includes(prev.status)})
    }
  }
  return rows
}

/**
 * What the live 3D views can show of a palette: the two roles the material system themes (tagged wood and tagged plaster).
 * Returns null for the built-in look, or per room {wood:{species, hex}, plaster:{hex}}.
 */
export function paletteSceneMapping(palette, rooms) {
  if (!palette || palette.builtIn) return null
  const out = {}
  for (const {id} of rooms) {
    const mapping = roomMapping(palette, id)
    if (!mapping) continue
    const wood = palette.colours[mapping.wood], wall = palette.colours[mapping.wall]
    out[id] = {...(isWood(wood) && wood.species ? {wood: {species: wood.species, hex: wood.hex}} : {}), ...(wall?.kind === 'paint' ? {plaster: {hex: wall.hex}} : {})}
  }
  return out
}
