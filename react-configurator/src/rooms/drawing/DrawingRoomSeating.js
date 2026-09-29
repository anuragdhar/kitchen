import * as THREE from 'three'

// Two identical 3-seaters facing the north-wall TV, plus the coffee table, rug and
// styling from the owner's references (cream sofas, terracotta cushions, dark carved
// wood). Positions come from room.furniture (millimetres, room frame: x from the west
// wall, z from the north wall). Decor sub-groups carry archvizExclude so the Blender
// renders skip them, as with the other decor factories.
const mm = v => v / 1000

function sofa(widthMm, lengthMm) {
  // Built facing +x with its back at -x; origin at the footprint centre on the floor.
  const group = new THREE.Group(); group.name = 'three-seater sofa'
  const D = mm(widthMm), Ln = mm(lengthMm)
  const cream = new THREE.MeshStandardMaterial({color: '#e6dac6', roughness: .95})
  const seat = new THREE.MeshStandardMaterial({color: '#efe5d3', roughness: .97})
  const wood = new THREE.MeshStandardMaterial({color: '#4a2f1e', roughness: .6})
  const box = (sx, sy, sz, x, y, z, material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material)
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m)
  }
  box(D, .24, Ln, 0, .35, 0, cream)
  box(.22, .57, Ln, -D / 2 + .11, .64, 0, cream)
  for (const z of [-Ln / 2 + .08, Ln / 2 - .08]) box(D, .22, .16, 0, .58, z, cream)
  const seatLength = (Ln - .32) / 3
  for (let i = 0; i < 3; i++) box(D - .27, .12, seatLength - .01, .07, .5, -Ln / 2 + .16 + seatLength * (i + .5), seat)
  for (const x of [-D / 2 + .09, D / 2 - .09]) for (const z of [-Ln / 2 + .12, Ln / 2 - .12]) box(.055, .13, .055, x, .065, z, wood)
  const decor = new THREE.Group(); decor.name = 'sofa cushions'; decor.userData.archvizExclude = true; group.add(decor)
  const colours = ['#b5573a', '#c9803f', '#e2c7a0', '#b5573a', '#c9803f', '#e2c7a0']
  const reach = Ln / 2 - .35
  colours.forEach((color, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .36, i % 3 === 2 ? .4 : .34), new THREE.MeshStandardMaterial({color, roughness: .97}))
    m.position.set(-D / 2 + .3, .78, (i - 2.5) / 2.5 * reach)
    m.rotation.z = -.22; m.rotation.y = (i % 2 ? 1 : -1) * .08; m.castShadow = true; decor.add(m)
  })
  return group
}

function framedPanel(widthMm, heightMm) {
  // Carved-wood wall panel like the reference: dark frame, lighter lattice field. Faces +x.
  const group = new THREE.Group(); group.name = 'carved wall panel'
  const frame = new THREE.MeshStandardMaterial({color: '#3d2717', roughness: .55})
  const field = new THREE.MeshStandardMaterial({color: '#6b4529', roughness: .5})
  const carve = new THREE.MeshStandardMaterial({color: '#94643a', roughness: .45})
  const w = mm(widthMm), h = mm(heightMm)
  const add = (sx, sy, sz, x, y, z, material) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material); m.position.set(x, y, z); m.castShadow = true; group.add(m) }
  add(.04, h, w, 0, 0, 0, frame)
  add(.05, h - .08, w - .08, .005, 0, 0, field)
  for (let i = -3; i <= 3; i++) add(.056, h - .16, .012, .006, 0, i * (w - .2) / 6, carve)
  for (let j = -5; j <= 5; j++) add(.056, .012, w - .2, .006, j * (h - .2) / 10, 0, carve)
  return group
}

export function createDrawingRoomSeating(room, {wallFaceMm = 0} = {}) {
  const f = room.furniture
  const group = new THREE.Group(); group.name = 'Drawing Room seating'

  const rug = new THREE.Group(); rug.name = 'rug'; rug.userData.archvizExclude = true
  const border = new THREE.Mesh(new THREE.BoxGeometry(mm(f.rug.widthMm), .012, mm(f.rug.lengthMm)), new THREE.MeshStandardMaterial({color: '#8f4f34', roughness: 1}))
  const inner = new THREE.Mesh(new THREE.BoxGeometry(mm(f.rug.widthMm) - .16, .014, mm(f.rug.lengthMm) - .16), new THREE.MeshStandardMaterial({color: '#b98058', roughness: 1}))
  border.position.set(mm(f.rug.centerXmm), .006, mm(f.rug.centerZmm)); inner.position.set(mm(f.rug.centerXmm), .008, mm(f.rug.centerZmm))
  border.receiveShadow = inner.receiveShadow = true; rug.add(border, inner); group.add(rug)

  const west = sofa(f.sofa.widthMm, f.sofa.lengthMm)
  west.position.set(mm(f.sofa.centerXmm), 0, mm(f.sofa.centerZmm)); group.add(west)
  const south = sofa(f.southSofa.widthMm, f.southSofa.lengthMm)
  south.position.set(mm(f.southSofa.centerXmm), 0, mm(f.southSofa.centerZmm)); south.rotation.y = Math.PI / 2; group.add(south)

  const wood = new THREE.MeshStandardMaterial({color: '#4a2f1e', roughness: .58})
  const table = f.coffeeTable
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .055, 48), wood)
  top.scale.set(mm(table.widthMm) / 2, 1, mm(table.lengthMm) / 2); top.position.set(mm(table.centerXmm), .43, mm(table.centerZmm)); top.castShadow = top.receiveShadow = true; group.add(top)
  for (const dx of [-.2, .2]) for (const dz of [-.3, .3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.04, .4, .04), wood)
    leg.position.set(mm(table.centerXmm) + dx, .2, mm(table.centerZmm) + dz); leg.castShadow = true; group.add(leg)
  }

  // Side table and lamp in the gap between the two sofas, against the west wall.
  const decor = new THREE.Group(); decor.name = 'seating decor'; decor.userData.archvizExclude = true; group.add(decor)
  const sideX = wallFaceMm + 260, sideZ = (f.sofa.centerZmm + f.sofa.lengthMm / 2 + f.southSofa.centerZmm - f.southSofa.widthMm / 2) / 2
  const sideTop = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .04, 32), wood); sideTop.position.set(mm(sideX), .55, mm(sideZ)); decor.add(sideTop)
  const sideLeg = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, .53, 16), wood); sideLeg.position.set(mm(sideX), .265, mm(sideZ)); decor.add(sideLeg)
  const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .26, 24), new THREE.MeshStandardMaterial({color: '#3b2a1e', roughness: .5}))
  lampBody.position.set(mm(sideX), .7, mm(sideZ)); decor.add(lampBody)
  const shadeMaterial = new THREE.MeshStandardMaterial({color: '#f3dfbf', emissive: '#ffcf8b', emissiveIntensity: .55, roughness: .9, side: THREE.DoubleSide})
  shadeMaterial.userData.taskLightGlow = true
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.13, .19, .22, 32, 1, true), shadeMaterial); shade.position.set(mm(sideX), .95, mm(sideZ)); decor.add(shade)

  // Two carved panels above the west sofa, below the air-conditioner.
  for (const z of [f.sofa.centerZmm - 350, f.sofa.centerZmm + 350]) {
    const panel = framedPanel(600, 900); panel.position.set(mm(wallFaceMm) + .02, 1.5, mm(z)); decor.add(panel)
  }
  return group
}
