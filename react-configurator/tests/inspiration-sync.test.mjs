import test from 'node:test'
import assert from 'node:assert/strict'
import {sniffImage, safePhotoId, upsertLibrary} from '../scripts/inspiration-sync-plugin.mjs'

const item = (id, extra = {}) => ({id, room: 'drawing', title: id, url: `https://example.com/${id}`, tags: [], notes: '', status: 'idea', ...extra})

test('sniffImage accepts only real JPG, PNG and WebP bytes', () => {
  assert.equal(sniffImage(Buffer.from([255, 216, 255, 224])), 'jpg')
  assert.equal(sniffImage(Buffer.from([137, 80, 78, 71, 13, 10])), 'png')
  assert.equal(sniffImage(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])), 'webp')
  assert.equal(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')), null)
  assert.equal(sniffImage(Buffer.from('GIF89a......')), null)
})

test('photo ids cannot escape the media folder', () => {
  assert.ok(safePhotoId('upload-2f1c9a0e-1234'))
  for (const bad of ['../x', 'a/b', 'a\b', '', 'x'.repeat(101), 'a.png', null]) assert.equal(safePhotoId(bad), false)
})

test('upsert replaces by id, appends new references and never removes any', () => {
  const photo = {id: 'upload-1', src: '/inspiration-media/upload-1.webp', caption: 'TV wall', kind: 'image'}
  const existing = {schemaVersion: 1, items: [item('a'), item('b')]}
  const merged = upsertLibrary(existing, {schemaVersion: 1, items: [item('b', {photos: [photo]}), item('c')]})
  assert.deepEqual(merged.items.map(i => i.id), ['a', 'b', 'c'])
  assert.equal(merged.items[1].photos[0].src, '/inspiration-media/upload-1.webp')
  assert.equal(existing.items.length, 2, 'input is not mutated')
})

test('upsert keeps sources as given; the server route and client enforce project-relative paths', () => {
  const photo = {id: 'upload-1', src: 'asset:upload-1', caption: '', kind: 'image'}
  const merged = upsertLibrary({schemaVersion: 1, items: []}, {schemaVersion: 1, items: [item('a', {photos: [photo]})]})
  assert.equal(merged.items[0].photos[0].src, 'asset:upload-1') // schema allows it; the sync client rewrites before sending
})
