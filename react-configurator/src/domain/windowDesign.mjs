// Window design geometry, independent of React, Three.js and the DOM.
// A window entry (roomShellConfig.js `windows[]`, or a balcony `outerWindow`) is in millimetres along its wall:
//   fromMm / widthMm      frame edges from the west end of the wall
//   bottomMm / topMm      sill and head above the floor (a balcony outerWindow uses sillMm / topMm)
//   mullionFractions      vertical mullions as fractions of widthMm, from the west edge; none = one bay
// Optional design fields (a window without them is a plain frame with mullions, drawn exactly as before):
//   transomMm             a horizontal rail at this height; fixed top lights fill the band from it to the head
//   bays                  one entry per bay, west to east: {shutters: n} (0 = fixed glass), {wasFixed: true} is a note
//   shutters              {opens: 'outward'|'inward'} for every bay that has shutters
//   rollerNet             {perBay: true, cassette: 'top'|'side', cassetteMm} roller mosquito net on the room side
//   outsideScreen         {rollDiameterMm, offsetMm, widthMm, dropMm} roll-up sun screen outside, parked under the head
//   frameStyle / frameColor   'dark', 'light' or 'wood' (+ a colour)

const sillOf = win => win.bottomMm ?? win.sillMm
const round = value => Math.round(value * 10) / 10

export function windowBays(win) {
  const fractions = [...(win.mullionFractions ?? [])].sort((a, b) => a - b)
  const edges = [0, ...fractions.map(f => f * win.widthMm), win.widthMm]
  return edges.slice(0, -1).map((start, i) => {
    const design = win.bays?.[i] ?? {}
    return {index: i, fromMm: round(win.fromMm + start), toMm: round(win.fromMm + edges[i + 1]), widthMm: round(edges[i + 1] - start), shutters: design.shutters ?? 0, wasFixed: Boolean(design.wasFixed)}
  })
}

export function windowGeometry(win) {
  const bays = windowBays(win), sill = sillOf(win)
  const transom = win.transomMm ?? null
  const shutterTop = transom ?? win.topMm
  const leaves = bays.flatMap(bay => Array.from({length: bay.shutters}, (_, i) => ({bay: bay.index, fromMm: round(bay.fromMm + bay.widthMm * i / bay.shutters), toMm: round(bay.fromMm + bay.widthMm * (i + 1) / bay.shutters), bottomMm: sill, topMm: shutterTop})))
  const net = win.rollerNet
  const rollerNets = net ? bays.filter(bay => bay.shutters > 0 || !net.perBay).map(bay => ({bay: bay.index, fromMm: bay.fromMm, toMm: bay.toMm, cassetteMm: net.cassetteMm ?? 45, cassette: net.cassette ?? 'top', underMm: shutterTop})) : []
  const screen = win.outsideScreen
  const outsideScreen = screen ? {
    rollDiameterMm: screen.rollDiameterMm ?? 100, offsetMm: screen.offsetMm ?? 85,
    widthMm: screen.widthMm ?? win.widthMm, dropMm: screen.dropMm ?? (win.topMm - sill),
    centerMm: win.fromMm + win.widthMm / 2, parkedCenterHeightMm: win.topMm - (screen.rollDiameterMm ?? 100) / 2 - 10,
  } : null
  return {
    bays, leaves, rollerNets, outsideScreen,
    sillMm: sill, headMm: win.topMm, transomMm: transom,
    topLightHeightMm: transom ? win.topMm - transom : 0,
    shutterHeightMm: shutterTop - sill,
    designed: Boolean(transom || win.bays || net || screen),
  }
}

export function checkWindowDesign(win) {
  const issues = [], g = windowGeometry(win), sill = sillOf(win)
  if (!(win.widthMm > 0) || !(win.topMm > sill)) issues.push('window frame has no size')
  if (win.transomMm != null && !(win.transomMm > sill && win.transomMm < win.topMm)) issues.push(`transom ${win.transomMm} is not between the sill ${sill} and the head ${win.topMm}`)
  if (win.bays && win.bays.length !== g.bays.length) issues.push(`${win.bays.length} bay entries for ${g.bays.length} bays (${(win.mullionFractions ?? []).length} mullions)`)
  for (const bay of g.bays) {
    if (bay.widthMm < 300) issues.push(`bay ${bay.index + 1} is only ${bay.widthMm} mm wide`)
    if (bay.shutters > 0 && bay.widthMm / bay.shutters < 250) issues.push(`bay ${bay.index + 1}: ${bay.shutters} shutters in ${bay.widthMm} mm are narrower than 250 mm each`)
  }
  if (g.outsideScreen) {
    if (g.outsideScreen.rollDiameterMm + 20 > g.topLightHeightMm && g.transomMm) issues.push(`the parked screen roll (${g.outsideScreen.rollDiameterMm}) does not fit in front of the ${g.topLightHeightMm} mm top band above the shutters`)
    if (g.outsideScreen.dropMm > win.topMm) issues.push('the screen drop is longer than the window head height')
  }
  if (g.rollerNets.length && !g.transomMm && win.rollerNet?.cassette === 'top') issues.push('a top cassette needs a transom or head to sit under; none is recorded')
  return {issues, geometry: g}
}
