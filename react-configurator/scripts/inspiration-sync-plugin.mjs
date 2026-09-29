import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAllowedUpdateRequest } from './local-update-plugin.mjs'
import { validateInspiration } from '../src/home/inspiration.mjs'

// Dev-server only. Copies photos that live in the owner's browser (IndexedDB)
// into the repository so they can be reviewed and committed:
//   react-configurator/public/inspiration-media/<photo-id>.<ext>
//   inspiration/library.json  (upsert by reference id; nothing is ever removed)
// Local (or private Codespaces) same-origin POSTs only, image bytes are
// sniffed, sizes are capped, and file names come from validated photo ids.
const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const MEDIA_DIR = path.join(repoDir, 'react-configurator/public/inspiration-media')
export const LIBRARY_FILE = path.join(repoDir, 'inspiration/library.json')
const endpoint = '/__inspiration_sync'
const MAX_IMAGE = 2 * 1024 * 1024
const MAX_JSON = 2_000_000

export function sniffImage(bytes) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg'
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return 'png'
  const head = Buffer.from(bytes.subarray(0, 12)).toString('latin1')
  if (head.startsWith('RIFF') && head.endsWith('WEBP')) return 'webp'
  return null
}

export const safePhotoId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)

/** Upsert incoming references by id; existing references are never removed. */
export function upsertLibrary(existing, incoming) {
  const current = validateInspiration(existing)
  const next = validateInspiration(incoming)
  const byId = new Map(current.items.map((item, index) => [item.id, index]))
  for (const item of next.items) {
    if (byId.has(item.id)) current.items[byId.get(item.id)] = item
    else { byId.set(item.id, current.items.length); current.items.push(item) }
  }
  return validateInspiration(current)
}

async function readBody(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw Object.assign(new Error('Request is too large.'), { status: 413 })
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function writeAtomic(file, data) {
  const temp = `${file}.${process.pid}.tmp`
  await fs.writeFile(temp, data)
  await fs.rename(temp, file)
}

export function inspirationSyncPlugin({ mediaDir = MEDIA_DIR, libraryFile = LIBRARY_FILE } = {}) {
  return {
    name: 'local-inspiration-sync',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(endpoint, async (req, res) => {
        const send = (status, body) => {
          res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify(body))
        }
        if (!isAllowedUpdateRequest(req)) return send(403, { error: 'Local or private Codespaces requests only' })
        const url = new URL(req.url, 'http://local')
        try {
          if (req.method === 'GET' && url.pathname === '/status') return send(200, { ok: true })
          if (req.method !== 'POST') return send(405, { error: 'Method not allowed' })
          if (url.pathname === '/photo') {
            const id = url.searchParams.get('id')
            if (!safePhotoId(id)) return send(400, { error: 'Invalid photo id.' })
            const bytes = await readBody(req, MAX_IMAGE)
            const ext = sniffImage(bytes)
            if (!ext) return send(400, { error: 'Only JPG, PNG or WebP images can be saved.' })
            await fs.mkdir(mediaDir, { recursive: true })
            await writeAtomic(path.join(mediaDir, `${id}.${ext}`), bytes)
            return send(200, { src: `/inspiration-media/${id}.${ext}` })
          }
          if (url.pathname === '/library') {
            const incoming = JSON.parse((await readBody(req, MAX_JSON)).toString('utf8'))
            const validated = validateInspiration(incoming)
            for (const item of validated.items) for (const photo of item.photos ?? []) {
              if (!photo.src.startsWith('/inspiration-media/')) {
                throw Object.assign(new Error('Save the photo files first: browser-only photos cannot go into the project library.'), { status: 400 })
              }
              await fs.access(path.join(mediaDir, path.basename(photo.src))).catch(() => {
                throw Object.assign(new Error(`Photo file is missing: ${photo.src}`), { status: 400 })
              })
            }
            const existing = JSON.parse(await fs.readFile(libraryFile, 'utf8'))
            const merged = upsertLibrary(existing, validated)
            await writeAtomic(libraryFile, `${JSON.stringify(merged, null, 2)}\n`)
            return send(200, { items: merged.items.length })
          }
          return send(404, { error: 'Not found' })
        } catch (error) {
          send(error.status ?? 400, { error: error.message })
        }
      })
    },
  }
}
