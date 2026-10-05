import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {createDrawingLobbyPartition} from '../src/rooms/drawing/DrawingLobbyPartition.js'

const topOf = group => new THREE.Box3().setFromObject(group).max.y

test('the folding partition stands under the hanging beam over the Drawing Room / Lobby opening', () => {
  for (const [key, wall] of [['drawing', 'east'], ['lobby', 'west']]) {
    const room = EMPTY_ROOM_SHELLS[key], beam = room.hangingBeams.find(b => b.wall === wall)
    assert.ok(Math.abs(topOf(createDrawingLobbyPartition(room, key)) - (room.heightMm - beam.dropMm) / 1000) < 1e-6, key)
  }
})

test('the partition height follows the beam in the shell config, not a copied number', () => {
  const room = EMPTY_ROOM_SHELLS.drawing, deeper = {...room, hangingBeams: room.hangingBeams.map(b => ({...b, dropMm: 400}))}
  assert.ok(Math.abs(topOf(createDrawingLobbyPartition(deeper, 'drawing')) - (room.heightMm - 400) / 1000) < 1e-6)
})
