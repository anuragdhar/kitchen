// Composes one shareable "review sheet" image: top plan with dimensions, perspective overview, the four
// walls seen from inside, and the key facts as text. Canvas 2D only; the 3D captures come from the scene.
export const SHEET = {width: 2400, height: 1600}
const INK = '#16202a', MUTED = '#4a5866', PANEL = '#f6f2ea', LINE = '#c9c1b2'
const KIND = {fixed: '#0f766e', seat: '#c2410c', table: '#7c3aed'}
const FONT = 'Segoe UI, Helvetica, Arial, sans-serif'

function wrap(ctx, text, maxWidth) {
  const lines = []
  for (const paragraph of String(text).split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word } else line = next
    }
    lines.push(line)
  }
  return lines
}

function fit(ctx, image, x, y, w, h, caption) {
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h)
  const scale = Math.min(w / image.width, h / image.height)
  const dw = image.width * scale, dh = image.height * scale, ox = x + (w - dw) / 2, oy = y + (h - dh) / 2
  ctx.drawImage(image, ox, oy, dw, dh)
  ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h)
  if (caption) {
    ctx.font = `bold 24px ${FONT}`; const width = ctx.measureText(caption).width + 20
    ctx.fillStyle = 'rgba(22,32,42,.88)'; ctx.fillRect(x, y, width, 34)
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(caption, x + 10, y + 18)
  }
  return {scale, ox, oy}
}

function tag(ctx, text, x, y, color = INK, size = 22) {
  ctx.font = `bold ${size}px ${FONT}`
  const w = ctx.measureText(text).width + 14, h = size + 10
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(x - w / 2, y - h / 2, w, h)
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2, y - h / 2, w, h)
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.textAlign = 'left'
}

/** Draws overall dimensions, wall names, openings and labelled items over the top-plan tile. */
function drawPlanOverlay(ctx, room, items, project, place) {
  const P = (xMm, zMm) => { const [px, py] = project(xMm, zMm); return [place.ox + px * place.scale, place.oy + py * place.scale] }
  const W = room.widthMm, L = room.lengthMm
  const corners = [P(0, 0), P(W, 0), P(W, L), P(0, L)]
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.setLineDash([]); ctx.beginPath()
  corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke()
  const centre = [(corners[0][0] + corners[2][0]) / 2, (corners[0][1] + corners[2][1]) / 2]
  const outward = (a, b, d) => { // point offset from the midpoint of a-b, away from the room centre
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = mx - centre[0], dy = my - centre[1], n = Math.hypot(dx, dy) || 1
    return [mx + dx / n * d, my + dy / n * d]
  }
  // Room frame: x grows west->east and z north->south, so corners are [0]=NW, [1]=NE, [2]=SE, [3]=SW.
  // Labels come from the projected corners, so they stay right whichever way the top camera is turned.
  const label = {north: ['NORTH wall', corners[0], corners[1]], east: ['EAST wall', corners[1], corners[2]], south: ['SOUTH wall', corners[3], corners[2]], west: ['WEST wall', corners[0], corners[3]]}
  for (const [text, a, b] of Object.values(label)) { const [x, y] = outward(a, b, 44); tag(ctx, text, x, y, MUTED, 20) }

  // Overall dimensions.
  const dimension = (a, b, text, offset, t = .5) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = mx - centre[0], dy = my - centre[1], n = Math.hypot(dx, dy) || 1
    const ox = dx / n * offset, oy = dy / n * offset
    ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + ox, a[1] + oy); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] + ox, b[1] + oy)
    ctx.moveTo(a[0] + ox, a[1] + oy); ctx.lineTo(b[0] + ox, b[1] + oy); ctx.stroke()
    tag(ctx, text, a[0] + (b[0] - a[0]) * t + ox, a[1] + (b[1] - a[1]) * t + oy, '#b91c1c', 22)
  }
  dimension(corners[0], corners[1], `${W} mm`, 78)
  dimension(corners[1], corners[2], `${L} mm`, 78, .2)

  // Openings drawn on the walls.
  const along = (wall, from, to) => {
    if (wall === 'north') return [P(from, 0), P(to, 0)]
    if (wall === 'south') return [P(from, L), P(to, L)]
    if (wall === 'west') return [P(0, from), P(0, to)]
    return [P(W, from), P(W, to)]
  }
  // x=0 is the WEST wall and x=W the EAST wall, so 'west' runs along x=0 with z varying.
  const openings = [
    ...(room.doors ?? []).map(d => ({wall: d.wall, from: d.fromMm, to: d.fromMm + d.widthMm, color: '#ea580c', text: `door ${d.widthMm}`})),
    ...(room.windows ?? []).map(w => ({wall: w.wall, from: w.fromMm, to: w.fromMm + w.widthMm, color: '#0284c7', text: `window ${w.widthMm}`})),
    ...Object.entries(room.wallOpenings ?? {}).map(([wall, o]) => ({wall, from: o.fromMm, to: o.toMm, color: '#16a34a', text: `open ${o.toMm - o.fromMm}`, dashed: true})),
  ]
  for (const o of openings) {
    const [a, b] = along(o.wall, o.from, o.to)
    ctx.strokeStyle = o.color; ctx.lineWidth = 10; ctx.setLineDash(o.dashed ? [16, 10] : []); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([])
    const inward = [(a[0] + b[0]) / 2 + (centre[0] - (a[0] + b[0]) / 2) * .08, (a[1] + b[1]) / 2 + (centre[1] - (a[1] + b[1]) / 2) * .08]
    tag(ctx, o.text, inward[0], inward[1], o.color, 19)
  }

  // Furniture and fixtures with their sizes.
  for (const item of items) {
    const p = [P(item.x1, item.z1), P(item.x2, item.z1), P(item.x2, item.z2), P(item.x1, item.z2)]
    ctx.strokeStyle = KIND[item.kind] ?? INK; ctx.lineWidth = 4; ctx.setLineDash([]); ctx.beginPath()
    p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke()
    const cx = p.reduce((s, q) => s + q[0], 0) / 4, cy = p.reduce((s, q) => s + q[1], 0) / 4
    tag(ctx, item.label, cx, cy, KIND[item.kind] ?? INK, 17)
  }
}

function panel(ctx, x, y, w, h, sections, budget = 1e9) {
  ctx.fillStyle = PANEL; ctx.fillRect(x, y, w, h); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h)
  let cy = y + 14, dropped = 0
  const lineHeight = 26, pad = 16
  ctx.textBaseline = 'top'
  for (const section of sections) {
    if (cy + 40 > y + h - 30) { dropped += section.lines.length; continue }
    ctx.font = `bold 25px ${FONT}`; ctx.fillStyle = INK; ctx.fillText(section.heading, x + pad, cy); cy += 34
    ctx.font = `20px ${FONT}`
    for (const item of section.lines) {
      const lines = wrap(ctx, `• ${item}`, w - 2 * pad - 14)
      for (let i = 0; i < lines.length; i++) {
        if (cy + lineHeight > y + h - 30 || budget-- <= 0) { dropped++; break }
        ctx.fillStyle = MUTED; ctx.fillText((i ? '   ' : '') + lines[i].replace(/^• ?/, i ? '' : '• '), x + pad, cy); cy += lineHeight
      }
    }
    cy += 10
  }
  if (dropped) { ctx.font = `bold 20px ${FONT}`; ctx.fillStyle = '#b91c1c'; ctx.fillText(`(+${dropped} more lines: see the copied text brief)`, x + pad, y + h - 28) }
}

/**
 * views: {top, overview, north, east, south, west} canvases; project(xMm, zMm) maps room millimetres to top-canvas pixels.
 */
export function composeReviewSheet({review, room, views, project}) {
  const canvas = document.createElement('canvas'); canvas.width = SHEET.width; canvas.height = SHEET.height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fbf9f4'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = INK; ctx.fillRect(0, 0, canvas.width, 100)
  ctx.textBaseline = 'middle'; ctx.font = `bold 44px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText(review.title, 24, 38)
  ctx.font = `24px ${FONT}`; ctx.fillStyle = '#cfd8e0'
  ctx.fillText(`Interior ${review.dims}  |  all sizes in millimetres  |  generated ${review.iso}  |  concept model, not a survey`, 24, 76)

  const top = fit(ctx, views.top, 20, 120, 740, 740, 'TOP PLAN (south is at the top of this picture)')
  if (project) { ctx.save(); ctx.beginPath(); ctx.rect(20, 120, 740, 740); ctx.clip(); drawPlanOverlay(ctx, room, review.planItems, project, top); ctx.restore() }
  fit(ctx, views.overview, 780, 120, 900, 740, 'PERSPECTIVE OVERVIEW')

  const walls = [['north', 'NORTH wall, from the room centre'], ['east', 'EAST wall, from the room centre'], ['south', 'SOUTH wall, from the room centre'], ['west', 'WEST wall, from the room centre']]
  walls.forEach(([key, caption], i) => fit(ctx, views[key], 20 + i * 415, 880, 400, 300, caption))

  // Bottom-left: measurements, problems, reference titles and limits. Right: the room facts and the asks.
  const shortRefs = review.sections.filter(x => x.heading.startsWith('Style references')).map(x => ({heading: 'Style references (links are in the text brief)', lines: x.lines.map(l => l.split(': http')[0])}))
  const limits = review.sections.filter(x => x.heading === 'Honest limits').map(x => ({heading: x.heading, lines: [x.lines[0]]}))
  const lower = review.sections.filter(x => ['Measured from the model', 'Known problems'].includes(x.heading))
  panel(ctx, 20, 1200, 1660, 380, [...lower, ...shortRefs, ...limits])
  const right = review.sections.filter(x => ['Room', 'Openings and structure', 'This layout', 'Furniture and fixtures'].includes(x.heading))
  panel(ctx, 1700, 120, 680, 1460, [...right, {heading: 'What I would like from you', lines: review.tasks}])
  return canvas
}

export const canvasToBlob = canvas => new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))), 'image/png'))
