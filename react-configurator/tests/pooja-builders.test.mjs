import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {createPoojaDoorAndInterior} from '../src/rooms/pooja/PoojaDoorAndInterior.js'
import {createPoojaPlatform} from '../src/rooms/pooja/PoojaPlatform.js'
import {createLobbyEastIroningStorage} from '../src/rooms/lobby/LobbyEastIroningStorage.js'
import {poojaDoorLeaves, poojaLeafBox} from '../src/domain/poojaDoor.mjs'

const room = EMPTY_ROOM_SHELLS.lobby, p = room.poojaAlcove
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-4, `${a} != ${b}`)

test('shared Pooja builder selects all 20 style/state/floor combinations above the step', () => {
  for (const floor of [0, 77.5]) {
    const doors = createPoojaDoorAndInterior(p, room.heightMm, floor)
    const assemblies = doors.children.filter(c => c.name.startsWith('Pooja doors: '))
    assert.equal(assemblies.length, 5)
    for (const style of Object.keys(p.door.options)) for (const open of [false, true]) {
      doors.userData.setDoorStyle(style); doors.userData.setDoorsOpen(open)
      const shown = assemblies.filter(a => a.visible)
      assert.equal(shown.length, 1); assert.equal(shown[0].name, `Pooja doors: ${style}`)
      for (const spec of poojaDoorLeaves(p, style, open)) {
        const leaf = shown[0].children.find(c => c.name === spec.id), bounds = new THREE.Box3().setFromObject(leaf)
        close(bounds.min.y * 1000, floor + p.platformHeightMm + p.door.bottomGapMm)
        if (style === 'bifoldInWest') {
          const expected = poojaLeafBox(p, spec, floor)
          assert.ok(bounds.min.x * 1000 >= expected.x1 - 1e-4)
          assert.ok(bounds.max.x * 1000 <= expected.x2 + 1e-4)
          assert.ok(bounds.min.z * 1000 >= expected.z1 - 1e-4)
          assert.ok(bounds.max.z * 1000 <= expected.z2 + 1e-4)
          if (open) assert.ok(bounds.max.z < 0)
        }
      }
    }
    // Fixed posts used to stand at floor level; their bottoms now stand on the step.
    const posts = doors.children.filter(c => c.isMesh && c.geometry.parameters.width === .08 && c.geometry.parameters.height > 1)
    assert.equal(posts.length, 2)
    for (const post of posts) close(new THREE.Box3().setFromObject(post).min.y * 1000, floor + p.platformHeightMm)
    const platform = createPoojaPlatform(p, floor), nose = platform.getObjectByName('Rounded platform nosing')
    platform.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(nose)
    close(bounds.max.z * 1000, 150); close(bounds.max.y * 1000, floor + 190)
  }
})

test('cabinet shared builder preserves deployed ironing board centre and top after north extension', () => {
  const unit = createLobbyEastIroningStorage(room), board = unit.getObjectByName('Pull-out ironing board deployed')
  unit.userData.setBoardOpen(true); assert.equal(board.visible, true)
  const bounds = new THREE.Box3().setFromObject(board)
  close((bounds.min.z + bounds.max.z) * 500, 1375)
  close((bounds.max.z - bounds.min.z) * 1000, 300)
  const surface = new THREE.Box3().setFromObject(board.children[0])
  close((surface.max.x - surface.min.x) * 1000, 950) // rails continue 80 mm into the cabinet, unchanged
  close(new THREE.Box3().setFromObject(unit).max.y * 1000, 2670)
  unit.userData.setBoardOpen(false); assert.equal(board.visible, false)
})
