/** Small ZIP32 writer for self-contained render bundles. No recompression or timer-per-chunk work. */
const encoder = new TextEncoder();
const table = Uint32Array.from({length: 256}, (_, n) => {
  for (let i = 0; i < 8; i++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
export function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = table[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function header(length) {
  const bytes = new Uint8Array(length), view = new DataView(bytes.buffer);
  return {bytes, word: (offset, value) => view.setUint16(offset, value, true),
    long: (offset, value) => view.setUint32(offset, value, true)};
}
/** Files are flat ASCII names, UTF-8 strings or binary bytes. Input buffers are never changed. */
export function createStoredZip(files) {
  if (!Array.isArray(files) || !files.length || files.length > 100) throw Error('Expected 1–100 render files.');
  const seen = new Set(), locals = [], central = [];
  let offset = 0, centralLength = 0;
  for (const file of files) {
    if (!file || typeof file.name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,199}$/.test(file.name) || file.name.includes('..') || seen.has(file.name)) throw Error('Unsafe or duplicate ZIP filename.');
    seen.add(file.name);
    const name = encoder.encode(file.name);
    const data = typeof file.data === 'string' ? encoder.encode(file.data) :
      file.data instanceof ArrayBuffer ? new Uint8Array(file.data) : file.data;
    if (!(data instanceof Uint8Array)) throw Error('Expected UTF-8 text or byte data.');
    if (offset + data.byteLength > 310_000_000) throw Error('Render bundle exceeds its size limit.');
    const checksum = crc32(data), local = header(30), record = header(46);
    local.long(0, 0x04034b50); local.word(4, 20); local.word(6, 0x0800);
    local.word(12, 0x0021); // 1980-01-01; fixed metadata makes equivalent input reproducible.
    local.long(14, checksum); local.long(18, data.length); local.long(22, data.length); local.word(26, name.length);
    record.long(0, 0x02014b50); record.word(4, 20); record.word(6, 20); record.word(8, 0x0800);
    record.word(14, 0x0021); record.long(16, checksum); record.long(20, data.length); record.long(24, data.length);
    record.word(28, name.length); record.long(42, offset);
    locals.push(local.bytes, name, data); central.push(record.bytes, name);
    offset += local.bytes.length + name.length + data.length; centralLength += record.bytes.length + name.length;
  }
  const end = header(22); end.long(0, 0x06054b50); end.word(8, files.length); end.word(10, files.length);
  end.long(12, centralLength); end.long(16, offset);
  return new Blob([...locals, ...central, end.bytes], {type: 'application/zip'});
}
