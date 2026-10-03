import * as THREE from 'three'

// Click-to-measure for furniture and cabinets in the live 3D views (owner request 2026-10-03: "know the dimensions of a cabinet or
// other furniture by clicking"). Picks the whole item that was clicked, not just the board or cushion under the cursor, and
// reports its size in the room's own millimetres.
//
// Which object counts as "the item", in order:
//  1. the nearest ancestor tagged userData.dimensionItem (a name) by its builder (markItem below);
//  2. else the nearest named ancestor group that is furniture-sized (at most MAX_ITEM_M across and tall) and is not a room
//     frame (userData.roomScale);
//  3. else the clicked mesh itself (most single-box cabinets in the whole-home view are one mesh).
// Whole home 3D stretches each room's group to its plan bounds (roomGroup sets userData.roomScale); sizes are divided by that
// scale so they read in the room's configured millimetres, not the stretched drawing. Sizes are axis-aligned bounding boxes:
// width runs west-east, depth north-south, height up; a rotated or round item reports the box around it.

const MAX_ITEM_M = 2.9
const MAX_LONE_M = 4.6 // the longest single cabinet run is the kitchen's, under this

/** Tag an object so a click anywhere on it reports it as one item called `name`. */
export function markItem(object, name) { object.userData.dimensionItem = name; return object }

const visibleChain = object => { for (let node = object; node; node = node.parent) if (!node.visible) return false; return true }
const roomScaleOf = object => { for (let node = object; node; node = node.parent) if (node.userData?.roomScale) return node.userData.roomScale; return {x: 1, y: 1, z: 1} }

// The box around an item's solid, visible meshes only: labels (sprites), lines and see-through helpers do not count.
function solidBox(object) {
  const box = new THREE.Box3()
  object.updateWorldMatrix(true, true)
  object.traverse(node => {
    if (!node.isMesh || !visibleChain(node) || node.userData.noMeasure) return
    const m = Array.isArray(node.material) ? node.material[0] : node.material
    if (!m || m.visible === false || m.colorWrite === false || m.depthTest === false) return
    box.expandByObject(node)
  })
  return box.isEmpty() ? new THREE.Box3().setFromObject(object) : box
}

function resolveItem(mesh) {
  for (let node = mesh; node; node = node.parent) {
    if (node.userData?.roomScale) break
    if (node.userData?.dimensionItem) return {object: node, name: node.userData.dimensionItem}
  }
  for (let node = mesh.parent; node; node = node.parent) {
    if (node.userData?.roomScale || node.isScene) break
    if (!node.name) continue
    const size = solidBox(node).getSize(new THREE.Vector3())
    if (Math.max(size.x, size.z) <= MAX_ITEM_M && size.y <= MAX_ITEM_M) return {object: node, name: node.name}
  }
  return {object: mesh, name: mesh.name || 'Selected piece'}
}

/** Size in millimetres in the room frame: {widthMm (west-east), depthMm (north-south), heightMm, bottomMm (off the floor)}. */
export function itemDimensions(object) {
  const box = solidBox(object), size = box.getSize(new THREE.Vector3()), s = roomScaleOf(object)
  const mm = (value, scale) => Math.round(value / Math.abs(scale) * 1000 / 5) * 5
  return {widthMm: mm(size.x, s.x), depthMm: mm(size.z, s.z), heightMm: mm(size.y, s.y), bottomMm: Math.max(0, mm(box.min.y, s.y)), box}
}

/**
 * The item under a raycast, skipping hidden objects, overlays (labels, ghosts, lines) and anything in `exclude`.
 * Returns null when the first solid thing hit is in `stopAt` (for example a wall, handled by the caller).
 */
export function pickItem(raycaster, roots, {exclude = new Set(), stopAt = new Set()} = {}) {
  const hits = raycaster.intersectObjects(roots, true)
  for (const hit of hits) {
    const o = hit.object
    if (!o.isMesh || !visibleChain(o) || o.userData.noMeasure || exclude.has(o)) continue
    const m = Array.isArray(o.material) ? o.material[0] : o.material
    if (!m || m.visible === false || m.colorWrite === false || m.depthTest === false || (m.transparent && m.opacity < .5)) continue
    if (stopAt.has(o)) return null
    const item = resolveItem(o)
    // A lone mesh that is room-sized or flat is a floor, slab, ceiling or rug, not furniture.
    const raw = solidBox(item.object).getSize(new THREE.Vector3())
    if (item.object === o && (Math.max(raw.x, raw.z) > MAX_LONE_M || raw.y < .03)) return null
    return {...item, ...itemDimensions(item.object)}
  }
  return null
}

/** An orange outline box around the picked item, drawn on top (depthTest off). Dispose with .userData.dispose(). */
export function selectionOutline(box) {
  const helper = new THREE.Box3Helper(box.clone().expandByScalar(.01), 0xf97316)
  helper.material.depthTest = false; helper.material.transparent = true; helper.renderOrder = 1500; helper.userData.noMeasure = true
  helper.userData.dispose = () => { helper.geometry.dispose(); helper.material.dispose() }
  return helper
}

export const formatDimensions = d => `${d.widthMm.toLocaleString()} W (east-west) x ${d.depthMm.toLocaleString()} D (north-south) x ${d.heightMm.toLocaleString()} H mm${d.bottomMm > 20 ? `, ${d.bottomMm.toLocaleString()} mm off the floor` : ''}`
