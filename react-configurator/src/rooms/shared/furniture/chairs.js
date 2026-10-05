import * as THREE from 'three'
import {markItem} from '../../../render/dimensionPick.js'
import {easedBox, legBetween, rodThrough, bentPanel, merged, fitGeometries, grainUV, grainScaleOf, metalMaterial, upholsteryMaterial, solid} from './hardForms.js'

// Chairs and stools for the live 3D views, built procedurally (hardForms.js). Each is built in its own frame: the centre of
// its floor footprint at the origin, facing +x (the seat front), its width along z. The caller places and turns it.
// The outer box of every piece is exactly the size asked for (tests/furniture-bounds.test.mjs).
// Furniture-tables-and-chairs round, 2026-10-06.

/**
 * Side-chair parts, each a merged geometry in the chair frame: `frame` (steel: tapered legs, back posts, seat rail,
 * H-stretcher), `seat` (upholstered pad) and `back` (bent oak panel, or an upholstered back pad when backStyle is 'pad').
 * depth (x) x width (z), seat top seatH, back top backTop, metres. All parts are fitted together to that exact box.
 */
function sideChairForms({depth, width, seatH, backTop, backStyle = 'panel'}) {
  const hx = depth / 2, hz = width / 2
  const padT = .05, padFront = hx, padBack = -hx + .02
  const seat = easedBox(padFront - padBack, padT, width, .018, .05, {curveSegments: 3, bevelSegments: 2})
  seat.translate((padFront + padBack) / 2, seatH - padT, 0)
  const railY = seatH - padT - .006
  // Legs: tapered round steel, splayed a little; feet inside the footprint.
  const fx = hx - .025, fz = hz - .025, tx = hx - .05, tz = hz - .045, bx = -hx + .025, btx = -hx + .055
  const frame = []
  for (const s of [-1, 1]) {
    frame.push(legBetween([fx, 0, s * fz], [tx, railY, s * tz], .0085, .0125, 10))
    frame.push(legBetween([bx, 0, s * fz], [btx, railY, s * tz], .0085, .0125, 10))
  }
  // Seat rail under the pad.
  frame.push(rodThrough([[tx, railY, -tz], [tx, railY, tz]], .009), rodThrough([[btx, railY, -tz], [btx, railY, tz]], .009))
  for (const s of [-1, 1]) frame.push(rodThrough([[btx, railY, s * tz], [tx, railY, s * tz]], .009))
  // H-stretcher low between the legs.
  const sy = .15, at = (a, b, y) => a + (b - a) * (y / railY)
  for (const s of [-1, 1]) frame.push(rodThrough([[at(fx, tx, sy), sy, s * at(fz, tz, sy)], [at(bx, btx, sy), sy, s * at(fz, tz, sy)]], .0065))
  frame.push(rodThrough([[0, sy + .012, -at(fz, tz, sy)], [0, sy + .012, at(fz, tz, sy)]], .0065))
  // Back: posts rising from the back legs' tops, curving back, carrying a bent panel (or a pad).
  const rake = .17, backH = backStyle === 'pad' ? Math.min(.3, backTop - seatH - .1) : .165
  const panelCentreY = backTop - backH / 2 - .004
  let back
  if (backStyle === 'pad') {
    back = easedBox(.05, backH, width - .04, .02, .03, {curveSegments: 3, bevelSegments: 2})
    back.translate(0, -backH / 2, 0); back.rotateZ(rake); back.translate(-hx + .058, panelCentreY, 0)
  } else {
    back = bentPanel(width - .04, backH, .014, .5, rake, 12) // radius .5 m: keep equal to R below
    back.rotateY(Math.PI / 2) // width along z, concave front towards +x
    back.translate(-hx + .02, panelCentreY, 0)
  }
  // Posts end behind the back (on the panel's rear face, which the bend brings forward towards the panel's ends), at its
  // mid-height, so they never show through its front.
  const postZ = hz - .05, postR = .0095, R = .5, dy = backH * .3, lean = dy * Math.sin(rake)
  const rearX = backStyle === 'pad' ? -hx + .058 - .025 * Math.cos(rake) - lean : -hx + .02 - .007 + R * (1 - Math.cos(postZ / R)) - lean
  const postTopX = rearX - postR - .001, postTopY = panelCentreY + dy
  for (const s of [-1, 1]) frame.push(rodThrough([[btx, railY, s * tz], [(btx + postTopX) / 2 - .006, (railY + postTopY) / 2, s * (tz + postZ) / 2], [postTopX, postTopY, s * postZ]], postR, {tubular: 6, radial: 8}))
  const metal = merged(frame)
  fitGeometries([metal, seat, back], {x: [-hx, hx], y: [0, backTop], z: [-hz, hz]})
  return {frame: metal, seat, back}
}

/**
 * The Lobby dining chair: tapered charcoal steel legs with an H-stretcher, an upholstered pad in the owner's oatmeal, and a
 * bent, raked oak back panel (grain across the back). 440 x 440 footprint (acPlanConfig DINING_CHAIR_MM), seat 455, back
 * top 860. One geometry set shared by every instance.
 */
export function createDiningChair({oak, steel = metalMaterial('#393b38', {roughness: .42, metalness: .55}), upholstery = upholsteryMaterial('#ded2bd')} = {}) {
  const forms = sideChairForms({depth: .44, width: .44, seatH: .455, backTop: .86})
  grainUV(forms.back, grainScaleOf(oak))
  return {
    forms,
    instance() {
      const chair = new THREE.Group(); chair.name = 'Dining chair'
      markItem(chair, 'Dining chair · 440 x 440, seat 455 high')
      chair.add(solid(forms.frame, steel, 'dining chair frame'), solid(forms.seat, upholstery, 'dining chair seat'), solid(forms.back, oak, 'dining chair back'))
      return chair
    },
  }
}

/**
 * An upholstered side chair on a slim steel frame (Bedroom 1 balcony chair, Study desk chair). Box depth (x) x width (z) x
 * backTop; faces +x. materials: {fabric, frame}.
 */
export function createSideChair({depth, width, seatH, backTop, materials, name = 'Chair'}) {
  const forms = sideChairForms({depth, width, seatH, backTop, backStyle: 'pad'})
  const chair = new THREE.Group(); chair.name = name
  markItem(chair, `${name} · ${Math.round(width * 1000)} x ${Math.round(depth * 1000)}, seat ${Math.round(seatH * 1000)} high`)
  chair.add(solid(forms.frame, materials.frame, `${name.toLowerCase()} frame`), solid(merged([forms.seat, forms.back]), materials.fabric, `${name.toLowerCase()} upholstery`))
  return chair
}

/**
 * Upholstered stool: a deep eased cushion on a slim steel frame with tapered legs and a low stretcher. Box width (x) x depth
 * (z) x height, centred; materials {fabric, frame}.
 */
export function createStool({width, depth, height, materials, name = 'Stool'}) {
  const padT = .085, hx = width / 2, hz = depth / 2
  const pad = easedBox(width, padT, depth, .028, .05, {curveSegments: 4, bevelSegments: 3}); pad.translate(0, height - padT, 0)
  const railY = height - padT, legs = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) legs.push(legBetween([sx * (hx - .03), 0, sz * (hz - .03)], [sx * (hx - .05), railY, sz * (hz - .05)], .008, .012, 12))
  for (const sz of [-1, 1]) legs.push(rodThrough([[-(hx - .045), .12, sz * (hz - .042)], [hx - .045, .12, sz * (hz - .042)]], .006))
  const frame = merged(legs)
  fitGeometries([frame, pad], {x: [-hx, hx], y: [0, height], z: [-hz, hz]})
  const stool = new THREE.Group(); stool.name = name
  markItem(stool, `${name} · ${Math.round(width * 1000)} x ${Math.round(depth * 1000)}, ${Math.round(height * 1000)} high`)
  stool.add(solid(frame, materials.frame, `${name.toLowerCase()} frame`), solid(pad, materials.fabric, `${name.toLowerCase()} cushion`))
  return stool
}
