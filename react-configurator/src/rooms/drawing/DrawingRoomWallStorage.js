import * as THREE from 'three'

// The west cabinet of the entry-side pocket behind the north wall (room.wallStorage; docs/ENTRY_WALL_CAVITY.md): a two-leaf
// door through the wall at its west end, the closet behind it (outer wall to the partition) and shelves against its back.
// Room frame: millimetres in the config, metres in the scene; x from the west wall, z from the north wall (negative z is
// inside the wall and the pocket). `wallFaceMm` is the distance from the nominal wall line to its drawn inside face; the
// depth is measured from that face. The closet walls are drawn translucent so it reads from the Drawing Room as well; in
// Whole home 3D the real pocket walls (ENTRY_WALL_SEGMENTS) stand on the same lines.
export function createDrawingRoomWallStorage(room, {wallFaceMm = 0} = {}) {
  const s = room.wallStorage, cab = s.cabinet, p = s.panelMm
  const x1 = s.fromWestMm, x2 = x1 + s.widthMm, y0 = s.bottomMm, y1 = y0 + s.heightMm
  const cx1 = cab.fromWestMm, cx2 = cx1 + cab.widthMm, ceiling = room.heightMm
  const zf = wallFaceMm, zb = zf - s.depthMm

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .62, ...extra})
  const shell = mat('#6a4429', {transparent: true, opacity: .3, depthWrite: false}), doorPanel = mat('#4d3220', {roughness: .7})
  const frame = mat('#3b2717', {roughness: .6}), shelfMat = mat('#8a5b37', {roughness: .55}), pull = mat('#b89a5c', {roughness: .3, metalness: .7})

  const storage = new THREE.Group(); storage.name = 'West cabinet (closet behind the north wall)'
  const box = (sx, sy, sz, cx, cy, cz, material, parent = storage) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx / 1000, sy / 1000, sz / 1000), material)
    mesh.position.set(cx / 1000, cy / 1000, cz / 1000); mesh.castShadow = true; mesh.receiveShadow = true
    parent.add(mesh); return mesh
  }

  // Closet shell behind the wall: two sides, the back and the ceiling, floor to ceiling like the pocket.
  const behind = zf - 2 * wallFaceMm // the far face of the drawn wall
  const shellDepth = behind - zb, shellMidZ = (behind + zb) / 2
  for (const x of [cx1 + p / 2, cx2 - p / 2]) box(p, ceiling, shellDepth, x, ceiling / 2, shellMidZ, shell)
  box(cab.widthMm, ceiling, p, (cx1 + cx2) / 2, ceiling / 2, zb + p / 2, shell)
  box(cab.widthMm, p, shellDepth, (cx1 + cx2) / 2, ceiling - p / 2, shellMidZ, shell)

  // Shelves against the back, the full width of the closet.
  for (const y of s.shelves.heightsMm) box(cab.widthMm - 2 * p, p, s.shelves.depthMm, (cx1 + cx2) / 2, y, zb + p + s.shelves.depthMm / 2, shelfMat)

  // Door frame lining the cut through the wall, then the leaves flush with the room face.
  // A concealed door (s.concealed) has no visible frame or pulls and its leaf is finished like the wall.
  const reveal = 2 * wallFaceMm, wallFinish = mat('#dfd2c4', {roughness: .87})
  if (!s.concealed) {
    for (const x of [x1 - p / 2, x2 + p / 2]) box(p, s.heightMm, reveal + 10, x, (y0 + y1) / 2, zf - wallFaceMm, frame)
    box(s.widthMm + 2 * p, p, reveal + 10, (x1 + x2) / 2, y1 + p / 2, zf - wallFaceMm, frame)
  }
  // Two leaves hinged at the jambs. They open INWARD (s.opens === 'inward'): each swings back into the closet, so the room in
  // front stays clear; an outward pair would swing into the room instead.
  const fronts = new THREE.Group(); fronts.name = 'west cabinet doors'; storage.add(fronts)
  const leaf = s.widthMm / s.doorCount, inward = s.opens === 'inward', leaves = []
  for (let i = 0; i < s.doorCount; i++) {
    const westHinge = i === 0, hingeX = westHinge ? x1 : x2
    const pivot = new THREE.Group(); pivot.position.set(hingeX / 1000, 0, (zf - 30) / 1000); fronts.add(pivot)
    const out = westHinge ? 1 : -1 // direction from the hinge across the leaf
    box(leaf - 4, s.heightMm - 4, 30, out * leaf / 2, (y0 + y1) / 2, 15, s.concealed ? wallFinish : doorPanel, pivot)
    // Pulls on the meeting stiles, at hand height (as in the Blender model), on the room side.
    if (!s.concealed) box(14, 320, 18, out * (leaf - 45), 1080, 39, pull, pivot)
    leaves.push({pivot, out})
  }
  const swingDeg = 95
  const setLeaves = open => {
    for (const {pivot, out} of leaves) pivot.rotation.y = open ? out * (inward ? 1 : -1) * swingDeg * Math.PI / 180 : 0
  }

  const labels = new THREE.Group(); labels.name = 'west cabinet labels'; storage.add(labels); labels.visible = false
  {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 96
    const g = canvas.getContext('2d')
    g.fillStyle = 'rgba(20,24,28,.86)'; g.beginPath(); g.roundRect(4, 4, 632, 88, 18); g.fill()
    g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(`Pocket west cabinet, ${(s.depthMm / 1000).toFixed(1)} m deep`, 320, 50)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
    sprite.scale.set(.78, .117, 1); sprite.position.set((x1 + x2) / 2000, (y1 + 250) / 1000, (zf + 380) / 1000); sprite.renderOrder = 10
    labels.add(sprite)
  }
  storage.userData.setLabels = visible => { labels.visible = visible }
  storage.userData.setOpen = setLeaves // open: both leaves swing (inward) to show the shelves
  return {storage}
}
