import * as THREE from 'three'

// Deep storage cut through the north wall into the empty cavity behind it (room.wallStorage; docs/ENTRY_WALL_CAVITY.md), and
// the plug that closes the same opening when a layout does not use it. Room frame: millimetres in the config, metres in the
// scene; x from the west wall, z from the north wall (negative z is inside the wall and the cavity). `wallFaceMm` is the
// distance from the nominal wall line to its drawn inside face; the depth is measured from that face.
export function createDrawingRoomWallStorage(room, {wallFaceMm = 0, wallMaterial, wallThicknessMm = 2 * wallFaceMm} = {}) {
  const s = room.wallStorage, rc = room.cornerLayout.routerCabinet, p = s.panelMm
  const x1 = s.fromWestMm, x2 = x1 + s.widthMm, y0 = s.bottomMm, y1 = y0 + s.heightMm
  const zf = wallFaceMm, zb = zf - s.depthMm
  const rx1 = rc.fromWestMm, rx2 = rc.fromWestMm + rc.widthMm

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .62, ...extra})
  // The shell is translucent so the part behind the wall (outside the room, in the cavity) reads as a volume, not a block.
  const carcass = mat('#6a4429', {transparent: true, opacity: .42, depthWrite: false}), inside = mat('#2e2118', {roughness: .85, transparent: true, opacity: .55, depthWrite: false}), doorPanel = mat('#4d3220', {roughness: .7})
  const shelfMat = mat('#8a5b37', {roughness: .55}), pull = mat('#b89a5c', {roughness: .3, metalness: .7})

  const storage = new THREE.Group(); storage.name = 'Drawing Room wall storage (cut into the cavity behind the north wall)'
  const box = (sx, sy, sz, cx, cy, cz, material, parent = storage) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx / 1000, sy / 1000, sz / 1000), material)
    mesh.position.set(cx / 1000, cy / 1000, cz / 1000); mesh.castShadow = true; mesh.receiveShadow = true
    parent.add(mesh); return mesh
  }
  const midZ = (zb + zf) / 2

  // Carcass: top, bottom, two sides and a back, all inside the wall and the cavity.
  box(s.widthMm, p, s.depthMm, (x1 + x2) / 2, y1 - p / 2, midZ, carcass)
  box(s.widthMm, p, s.depthMm, (x1 + x2) / 2, y0 + p / 2, midZ, carcass)
  for (const x of [x1 + p / 2, x2 - p / 2]) box(p, s.heightMm - 2 * p, s.depthMm, x, (y0 + y1) / 2, midZ, carcass)
  box(s.widthMm - 2 * p, s.heightMm - 2 * p, 12, (x1 + x2) / 2, (y0 + y1) / 2, zb + 6, inside)

  // Shelves. Where the router bay stands (x rx1-rx2, its height, front 250 mm) they stop short of it.
  for (const y of s.shelves) {
    const clashes = y > rc.bottomMm - p && y < rc.bottomMm + rc.heightMm + p
    if (!clashes) { box(s.widthMm - 2 * p, p, s.depthMm - 12, (x1 + x2) / 2, y, midZ + 6, shelfMat); continue }
    box(rx1 - x1 - p, p, s.depthMm - 12, (x1 + p + rx1) / 2, y, midZ + 6, shelfMat)
    box(x2 - p - rx2, p, s.depthMm - 12, (rx2 + x2 - p) / 2, y, midZ + 6, shelfMat)
    const behind = s.depthMm - rc.depthMm - 12
    box(rx2 - rx1, p, behind, (rx1 + rx2) / 2, y, zb + 12 + behind / 2, shelfMat)
  }

  // Fronts flush with the wall face: two tall doors either side of the router bay, and a panel above and below it.
  const fronts = new THREE.Group(); fronts.name = 'wall storage doors'; storage.add(fronts)
  const door = (xa, xb, ya, yb) => {
    const w = xb - xa - 4, h = yb - ya - 4
    box(w, h, p, (xa + xb) / 2, (ya + yb) / 2, zf - p / 2, doorPanel, fronts)
    box(12, Math.min(260, h * .4), 14, xa + (xb - xa < 350 ? (xb - xa) * .8 : (xb - xa) * .9), (ya + yb) / 2, zf + 5, pull, fronts)
  }
  door(x1 + p, rx1, y0 + p, y1 - p)
  door(rx2, x2 - p, y0 + p, y1 - p)
  door(rx1, rx2, y0 + p, rc.bottomMm)
  door(rx1, rx2, rc.bottomMm + rc.heightMm, y1 - p)

  const labels = new THREE.Group(); labels.name = 'wall storage labels'; storage.add(labels); labels.visible = false
  {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 96
    const g = canvas.getContext('2d')
    g.fillStyle = 'rgba(20,24,28,.86)'; g.beginPath(); g.roundRect(4, 4, 632, 88, 18); g.fill()
    g.fillStyle = '#fff'; g.font = 'bold 36px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(`Deep storage ${(s.depthMm / 1000).toFixed(1)} m into the cavity`, 320, 50)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
    sprite.scale.set(.78, .117, 1); sprite.position.set((x1 + x2) / 2000, (y1 + 180) / 1000, (zf + 380) / 1000); sprite.renderOrder = 10
    labels.add(sprite)
  }
  storage.userData.setLabels = visible => { labels.visible = visible }
  storage.userData.setOpen = open => { fronts.visible = !open } // open: the doors are hidden to show the shelves

  // Closes the opening in the wall for layouts that do not use it.
  const plug = new THREE.Mesh(new THREE.BoxGeometry(s.widthMm / 1000, s.heightMm / 1000, wallThicknessMm / 1000), wallMaterial)
  plug.position.set((x1 + x2) / 2000, (y0 + y1) / 2000, 0); plug.name = 'Drawing Room wall storage plug'
  plug.castShadow = true; plug.receiveShadow = true
  return {storage, plug}
}
