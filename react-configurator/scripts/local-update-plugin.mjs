import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { updateFromGitHub } from './local-update.mjs'

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const endpoint = '/__local_update'

export function isAllowedUpdateRequest(req, env = process.env) {
  const address = req.socket.remoteAddress
  const local = address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
  const host = req.headers.host
  const name = env.CODESPACE_NAME
  const domain = env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev'
  const validCodespace = name && /^[a-z0-9-]+$/i.test(name) && /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/i.test(domain)
  const codespaceHost = validCodespace ? `${name}-5173.${domain}` : null
  const forwarded = codespaceHost && host === codespaceHost
  if (!local && !forwarded) return false
  if (req.method !== 'POST') return true
  return req.headers.origin === `${forwarded ? 'https' : 'http'}://${host}`
}

export function localUpdatePlugin() {
  const instance = randomUUID()
  let busy = false

  return {
    name: 'local-github-update',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(endpoint, async (req, res, next) => {
        if (req.url !== '/' && req.url !== '/status') return next()
        if (!isAllowedUpdateRequest(req)) {
          res.writeHead(403).end('Local or private Codespaces requests only')
          return
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        if (req.method === 'GET' && req.url === '/status') {
          res.end(JSON.stringify({ instance }))
          return
        }
        if (req.method !== 'POST' || req.url !== '/') {
          res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        if (busy) {
          res.writeHead(409).end(JSON.stringify({ error: 'An update is already running.' }))
          return
        }

        busy = true
        try {
          const result = await updateFromGitHub(repoDir)
          res.end(JSON.stringify({ ...result, instance }))
          setTimeout(() => {
            server.restart(true).catch(error => server.config.logger.error(`Restart failed: ${error.message}`))
          }, 100)
        } catch (error) {
          const detail = error.stderr?.trim() || error.message
          res.writeHead(409).end(JSON.stringify({ error: detail }))
        } finally {
          busy = false
        }
      })
    },
  }
}
