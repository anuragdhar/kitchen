import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BLENDER_ROOM_VIEWS } from '../src/config/homeRoomViews.js'

test('every individual room has a Blender model region and a rendered preview', () => {
  for (const key of ['kitchen','study','balcony','bedroom1','bedroom3','lobby','drawing','pooja','entry','storage']) {
    const room=BLENDER_ROOM_VIEWS[key]
    assert.ok(room, `${key} has a Blender room view`)
    const [x1,y1,x2,y2]=room.bounds
    assert.ok(x2>x1&&y2>y1, `${key} has a positive plan region`)
    const image=fileURLToPath(new URL(`../public/renders/home-lighting/${room.render}.png`,import.meta.url))
    assert.ok(existsSync(image),`${key} has a Blender render`)
    for(const [file] of room.extraRenders||[])assert.ok(existsSync(fileURLToPath(new URL(`../public/renders/${file}`,import.meta.url))),`${key} has ${file}`)
  }
  assert.ok(existsSync(fileURLToPath(new URL('../public/models/A501-blender-lighting.glb',import.meta.url))))
})
