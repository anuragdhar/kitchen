// The renovation work plan: tasks by trade, in the order work has to happen (pure: no React, DOM or Node).
// Source of truth: work-plan/plan.json at the repository root. Rules and ordering live here so the page, the dev-server save
// endpoint and the tests all use the same ones.

export const STATUSES = ['todo', 'in-progress', 'blocked', 'done']
export const STATUS_LABELS = {todo: 'To do', 'in-progress': 'In progress', blocked: 'Blocked', done: 'Done'}
const ID = /^[a-z0-9][a-z0-9-]{1,60}$/
const text = (value, max) => typeof value === 'string' && value.length <= max

/** Returns the plan (same object) or throws with the first problem found. */
export function validateWorkPlan(plan) {
  if (!plan || plan.schemaVersion !== 1) throw new Error('Unsupported work plan version.')
  for (const key of ['phases', 'trades', 'tasks']) if (!Array.isArray(plan[key])) throw new Error(`Work plan is missing ${key}.`)
  const unique = (list, what) => {
    const seen = new Set()
    for (const item of list) {
      if (!ID.test(item?.id ?? '')) throw new Error(`Invalid ${what} id: ${item?.id}`)
      if (seen.has(item.id)) throw new Error(`Duplicate ${what} id: ${item.id}`)
      if (!text(item.name ?? item.title, 200) || !(item.name ?? item.title)) throw new Error(`${what} ${item.id} needs a name.`)
      seen.add(item.id)
    }
    return seen
  }
  if (plan.tasks.length > 1000) throw new Error('Too many tasks.')
  const phases = unique(plan.phases, 'phase'), trades = unique(plan.trades, 'trade'), tasks = unique(plan.tasks, 'task')
  for (const task of plan.tasks) {
    if (!phases.has(task.phase)) throw new Error(`Task ${task.id} has an unknown phase: ${task.phase}`)
    if (!trades.has(task.trade)) throw new Error(`Task ${task.id} has an unknown trade: ${task.trade}`)
    if (!STATUSES.includes(task.status)) throw new Error(`Task ${task.id} has an unknown status: ${task.status}`)
    for (const key of ['room', 'detail', 'needs', 'source', 'notes']) if (task[key] != null && !text(task[key], 2000)) throw new Error(`Task ${task.id}: ${key} must be text under 2000 characters.`)
    if (!Array.isArray(task.dependsOn ?? [])) throw new Error(`Task ${task.id}: dependsOn must be a list.`)
    for (const dep of task.dependsOn ?? []) {
      if (!tasks.has(dep)) throw new Error(`Task ${task.id} depends on an unknown task: ${dep}`)
      if (dep === task.id) throw new Error(`Task ${task.id} depends on itself.`)
    }
  }
  orderedTasks(plan) // throws on a dependency cycle
  return plan
}

/**
 * Tasks in working order: by phase, and inside a phase so that everything a task depends on comes first. A dependency in a
 * LATER phase pulls nothing forward: it is reported by planWarnings instead, because the phases are the agreed sequence.
 */
export function orderedTasks(plan) {
  const phaseIndex = new Map(plan.phases.map((phase, index) => [phase.id, index]))
  const byId = new Map(plan.tasks.map(task => [task.id, task]))
  const position = new Map(plan.tasks.map((task, index) => [task.id, index]))
  const state = new Map(), out = []
  const visit = (task, trail) => {
    if (state.get(task.id) === 'done') return
    if (state.get(task.id) === 'open') throw new Error(`Tasks depend on each other in a loop: ${[...trail, task.id].join(' -> ')}`)
    state.set(task.id, 'open')
    for (const dep of [...(task.dependsOn ?? [])].sort((a, b) => position.get(a) - position.get(b))) {
      const other = byId.get(dep)
      if (other && phaseIndex.get(other.phase) === phaseIndex.get(task.phase)) visit(other, [...trail, task.id])
      else if (other) checkLoop(other, [...trail, task.id])
    }
    state.set(task.id, 'done'); out.push(task)
  }
  // Cross-phase dependencies do not reorder, but a loop through them is still an error.
  const checkLoop = (task, trail) => {
    if (trail.includes(task.id)) throw new Error(`Tasks depend on each other in a loop: ${[...trail, task.id].join(' -> ')}`)
    for (const dep of task.dependsOn ?? []) if (byId.get(dep)) checkLoop(byId.get(dep), [...trail, task.id])
  }
  const sorted = [...plan.tasks].sort((a, b) => phaseIndex.get(a.phase) - phaseIndex.get(b.phase) || position.get(a.id) - position.get(b.id))
  for (const task of sorted) visit(task, [])
  return out.sort((a, b) => phaseIndex.get(a.phase) - phaseIndex.get(b.phase) || out.indexOf(a) - out.indexOf(b))
}

/** Things the owner should look at: a task waiting on a later phase, or started/done while something it needs is not done. */
export function planWarnings(plan) {
  const phaseIndex = new Map(plan.phases.map((phase, index) => [phase.id, index])), byId = new Map(plan.tasks.map(task => [task.id, task]))
  const warnings = []
  for (const task of plan.tasks) for (const dep of task.dependsOn ?? []) {
    const other = byId.get(dep)
    if (phaseIndex.get(other.phase) > phaseIndex.get(task.phase)) warnings.push({task: task.id, message: `"${task.title}" depends on "${other.title}", which is planned in a later phase.`})
    if ((task.status === 'in-progress' || task.status === 'done') && other.status !== 'done') warnings.push({task: task.id, message: `"${task.title}" is ${STATUS_LABELS[task.status].toLowerCase()} but "${other.title}" is not done.`})
  }
  return warnings
}

/** A task can start when it is not done and everything it depends on is done. */
export const readyTasks = plan => {
  const byId = new Map(plan.tasks.map(task => [task.id, task]))
  return orderedTasks(plan).filter(task => task.status === 'todo' && (task.dependsOn ?? []).every(dep => byId.get(dep).status === 'done'))
}

export function planSummary(plan) {
  const count = list => ({total: list.length, done: list.filter(task => task.status === 'done').length, blocked: list.filter(task => task.status === 'blocked').length, inProgress: list.filter(task => task.status === 'in-progress').length})
  return {
    all: count(plan.tasks),
    byTrade: plan.trades.map(trade => ({...trade, ...count(plan.tasks.filter(task => task.trade === trade.id))})),
    byPhase: plan.phases.map(phase => ({...phase, ...count(plan.tasks.filter(task => task.phase === phase.id))})),
  }
}

/** A new task id from its title, unique within the plan. */
export function newTaskId(plan, title) {
  const base = (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'task').replace(/^[^a-z0-9]/, 't')
  const ids = new Set(plan.tasks.map(task => task.id))
  let id = base.length < 2 ? `${base}-task` : base, n = 2
  while (ids.has(id)) id = `${base}-${n++}`
  return id
}
