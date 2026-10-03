import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAllowedUpdateRequest } from './local-update-plugin.mjs'
import { validateWorkPlan } from '../src/home/workPlan.mjs'

// Dev-server only. Reads and saves the renovation work plan in the repository so it can be reviewed and committed:
//   work-plan/plan.json
// Local (or private Codespaces) same-origin requests only; the whole plan is validated before it replaces the file, and the
// previous file is kept beside it as plan.backup.json.
const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const PLAN_FILE = path.join(repoDir, 'work-plan/plan.json')
const endpoint = '/__work_plan'
const MAX_JSON = 1_000_000

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

/** Validates `incoming` and replaces the plan file atomically, keeping the previous version as a backup. */
export async function savePlan(planFile, incoming) {
  const plan = validateWorkPlan(incoming)
  const previous = await fs.readFile(planFile, 'utf8').catch(() => null)
  if (previous != null) await fs.writeFile(planFile.replace(/\.json$/, '.backup.json'), previous)
  const temp = `${planFile}.${process.pid}.tmp`
  await fs.writeFile(temp, `${JSON.stringify(plan, null, 2)}\n`)
  await fs.rename(temp, planFile)
  return plan
}

export function workPlanPlugin({ planFile = PLAN_FILE } = {}) {
  return {
    name: 'local-work-plan',
    apply: 'serve',
    // Saving the plan must not reload the page the owner is typing in (the page already holds the new state).
    handleHotUpdate({ file }) { if (path.resolve(file) === path.resolve(planFile)) return [] },
    configureServer(server) {
      server.middlewares.use(endpoint, async (req, res) => {
        const send = (status, body) => {
          res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify(body))
        }
        if (!isAllowedUpdateRequest(req)) return send(403, { error: 'Local or private Codespaces requests only' })
        try {
          if (req.method === 'GET') return send(200, validateWorkPlan(JSON.parse(await fs.readFile(planFile, 'utf8'))))
          if (req.method !== 'POST') return send(405, { error: 'Method not allowed' })
          const plan = await savePlan(planFile, JSON.parse((await readBody(req, MAX_JSON)).toString('utf8')))
          return send(200, { tasks: plan.tasks.length })
        } catch (error) {
          send(error.status ?? 400, { error: error.message })
        }
      })
    },
  }
}
