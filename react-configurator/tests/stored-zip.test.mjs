import test from 'node:test';
import assert from 'node:assert/strict';
import {createStoredZip, crc32} from '../src/home/storedZip.mjs';
const text = new TextEncoder();
test('CRC32 matches the ZIP reference vector and empty data', () => {
  assert.equal(crc32(text.encode('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array()), 0);
});
test('native render ZIP has matching local/central records, lengths, CRCs and exact UTF-8 bytes', async () => {
  const files = [{name: 'scene.glb', data: Uint8Array.from([0, 255, 1, 127])}, {name: 'README.txt', data: 'Grain – oak 🌳'}];
  const blob = createStoredZip(files), bytes = new Uint8Array(await blob.arrayBuffer()), v = new DataView(bytes.buffer);
  assert.equal(blob.type, 'application/zip');
  const offsets = []; let cursor = 0;
  for (const file of files) {
    offsets.push(cursor);
    const data = typeof file.data === 'string' ? text.encode(file.data) : file.data, name = text.encode(file.name);
    assert.equal(v.getUint32(cursor, true), 0x04034b50); assert.equal(v.getUint16(cursor + 8, true), 0);
    assert.equal(v.getUint32(cursor + 14, true), crc32(data)); assert.equal(v.getUint32(cursor + 18, true), data.length);
    assert.equal(v.getUint16(cursor + 26, true), name.length);
    assert.deepEqual(bytes.slice(cursor + 30, cursor + 30 + name.length), name);
    assert.deepEqual(bytes.slice(cursor + 30 + name.length, cursor + 30 + name.length + data.length), data);
    cursor += 30 + name.length + data.length;
  }
  const start = cursor;
  for (let i = 0; i < files.length; i++) {
    assert.equal(v.getUint32(cursor, true), 0x02014b50); assert.equal(v.getUint32(cursor + 42, true), offsets[i]);
    cursor += 46 + text.encode(files[i].name).length;
  }
  assert.equal(v.getUint32(cursor, true), 0x06054b50); assert.equal(v.getUint16(cursor + 10, true), 2);
  assert.equal(v.getUint32(cursor + 12, true), cursor - start); assert.equal(v.getUint32(cursor + 16, true), start);
  assert.equal(cursor + 22, bytes.length);
  assert.deepEqual(files[0].data, Uint8Array.from([0, 255, 1, 127]));
  assert.deepEqual(new Uint8Array(await createStoredZip(files).arrayBuffer()), bytes);
});
test('writer rejects unsafe names, duplicates and unsupported inputs', () => {
  for (const name of ['../x', '/x', 'x/y', 'C:\\x', '', '.', 'a..b', 'x'.repeat(201)]) assert.throws(() => createStoredZip([{name, data: ''}]));
  assert.throws(() => createStoredZip([{name: 'a', data: ''}, {name: 'a', data: ''}]));
  assert.throws(() => createStoredZip([{name: 'a', data: {}}]));
  assert.throws(() => createStoredZip([]));
});
