import * as THREE from 'three'

// Floor marking for the entry door, which opens INTO the Drawing Room (owner, 2026-09-30): a translucent quarter circle
// of the leaf width, plus the leaf shown fully open. If the hinge side is not settled the other possible sweep is drawn fainter. Room frame in metres: x from the west wall, z from the north wall.
export function createDrawingRoomDoorSwing(room, {wallFaceMm = 0} = {}) {
  const door = room.doors.find(d => d.wall === 'north')
  const group = new THREE.Group(); group.name = 'entry door swing zone'
  const radius = door.leafMm / 1000, z0 = wallFaceMm / 1000
  const sides = {east: {hingeX: (door.fromMm + door.widthMm) / 1000, direction: -1}, west: {hingeX: door.fromMm / 1000, direction: 1}}
  for (const [side, {hingeX, direction}] of Object.entries(sides)) {
    const assumed = side === door.hinge
    if (!assumed && door.hingeKnown) continue
    // CircleGeometry lies in XY; after rotating -90 degrees about X its +Y becomes -Z, so the room side (z > 0) is gy < 0.
    const geometry = new THREE.CircleGeometry(radius, 48, direction < 0 ? Math.PI : -Math.PI / 2, Math.PI / 2)
    const sector = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: assumed ? '#e11d48' : '#f59e0b', transparent: true, opacity: assumed ? .26 : .13, side: THREE.DoubleSide, depthWrite: false}))
    sector.rotation.x = -Math.PI / 2; sector.position.set(hingeX, .018, z0); group.add(sector)
    if (assumed) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(.04, door.heightMm / 1000, radius), new THREE.MeshStandardMaterial({color: '#e11d48', transparent: true, opacity: .35}))
      leaf.position.set(hingeX + direction * .02, door.heightMm / 2000, z0 + radius / 2); group.add(leaf)
    }
  }
  return group
}
