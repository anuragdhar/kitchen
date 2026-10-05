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
    validateTaskExtras(task)
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

// ---------------------------------------------------------------------------------------------------------------------
// Budget, open items and ordering checks (added 2026-10-05). All optional: a plan without these fields still loads.
//   estimateLow / estimateHigh   planning range in INR (whole rupees, low <= high); both or neither
//   estimateBasis                one line: quantity x rate, or why the task is not estimated
//   estimateConfidence           'low' | 'medium' (never 'high': nothing here is a quote)
//   openItems                    ids from work-plan/OPEN_ITEMS.md (A3, C15, ...) this task is waiting for
// ---------------------------------------------------------------------------------------------------------------------

export const ESTIMATE_CONFIDENCES = ['low', 'medium']
export const OPEN_ITEM_ID = /^[A-E][1-9][0-9]{0,2}$/

/** Throws on a malformed estimate or open-item list. Called by validateWorkPlan for every task. */
export function validateTaskExtras(task) {
  const {estimateLow: low, estimateHigh: high, estimateBasis: basis, estimateConfidence: confidence, openItems} = task
  const money = value => Number.isSafeInteger(value) && value >= 0 && value <= 1e9
  if ((low == null) !== (high == null)) throw new Error(`Task ${task.id}: an estimate needs both a low and a high figure.`)
  if (low != null) {
    if (!money(low) || !money(high)) throw new Error(`Task ${task.id}: estimate figures must be whole rupees, zero or more.`)
    if (low > high) throw new Error(`Task ${task.id}: the low estimate is above the high estimate.`)
    if (!ESTIMATE_CONFIDENCES.includes(confidence)) throw new Error(`Task ${task.id}: estimateConfidence must be low or medium.`)
  } else if (confidence != null) throw new Error(`Task ${task.id}: estimateConfidence without an estimate.`)
  if (basis != null && !text(basis, 2000)) throw new Error(`Task ${task.id}: estimateBasis must be text under 2000 characters.`)
  if (openItems != null) {
    if (!Array.isArray(openItems)) throw new Error(`Task ${task.id}: openItems must be a list.`)
    for (const item of openItems) if (!OPEN_ITEM_ID.test(item)) throw new Error(`Task ${task.id}: ${item} is not an open-item id like A3 or C15.`)
    if (new Set(openItems).size !== openItems.length) throw new Error(`Task ${task.id}: an open item is listed twice.`)
  }
}

/**
 * The buildable-order check, without throwing: every dependency exists, nothing depends on itself or in a loop, and no task
 * depends on a task planned in a later phase. Works on a plan that has not passed validateWorkPlan.
 * Returns [{kind: 'missing' | 'cycle' | 'later-phase', task, dependsOn, message}].
 */
export function checkDependencies(plan) {
  const tasks = Array.isArray(plan?.tasks) ? plan.tasks : [], phases = Array.isArray(plan?.phases) ? plan.phases : []
  const byId = new Map(tasks.map(task => [task.id, task])), phaseIndex = new Map(phases.map((phase, index) => [phase.id, index]))
  const problems = []
  for (const task of tasks) for (const dep of task.dependsOn ?? []) {
    const other = byId.get(dep)
    if (!other) problems.push({kind: 'missing', task: task.id, dependsOn: dep, message: `${task.id} depends on ${dep}, which is not in the plan.`})
    else if (phaseIndex.get(other.phase) > phaseIndex.get(task.phase)) problems.push({kind: 'later-phase', task: task.id, dependsOn: dep, message: `${task.id} (${task.phase}) depends on ${dep}, which is planned later (${other.phase}).`})
  }
  // Loops: depth-first search; each loop is reported once, from the task where it closed.
  const state = new Map()
  const visit = (task, trail) => {
    state.set(task.id, 'open')
    for (const dep of task.dependsOn ?? []) {
      const other = byId.get(dep)
      if (!other) continue
      if (state.get(dep) === 'open') problems.push({kind: 'cycle', task: task.id, dependsOn: dep, message: `Tasks depend on each other in a loop: ${[...trail.slice(trail.indexOf(dep)), dep].join(' -> ')}`})
      else if (!state.has(dep)) visit(other, [...trail, dep])
    }
    state.set(task.id, 'done')
  }
  for (const task of tasks) if (!state.has(task.id)) visit(task, [task.id])
  return problems
}

/** Every task that cannot finish before the tasks in `ids` are done: their dependents, the dependents of those, and so on. */
export function downstreamTasks(plan, ids) {
  const dependents = new Map(plan.tasks.map(task => [task.id, []]))
  for (const task of plan.tasks) for (const dep of task.dependsOn ?? []) dependents.get(dep)?.push(task.id)
  const seen = new Set(), queue = [...ids]
  while (queue.length) for (const next of dependents.get(queue.pop()) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next) }
  for (const id of ids) seen.delete(id)
  return seen
}

/**
 * What to do first. For every open item named by a task that is not done: the tasks that name it (direct) and every task
 * behind those. `waiting` counts both. Sorted by waiting, then by direct count, then by id.
 */
export function openItemImpact(plan) {
  const direct = new Map()
  for (const task of plan.tasks) if (task.status !== 'done') for (const item of task.openItems ?? []) direct.set(item, [...(direct.get(item) ?? []), task.id])
  return [...direct].map(([item, tasks]) => ({item, direct: tasks, waiting: tasks.length + downstreamTasks(plan, tasks).size}))
    .sort((a, b) => b.waiting - a.waiting || b.direct.length - a.direct.length || a.item[0].localeCompare(b.item[0]) || Number(a.item.slice(1)) - Number(b.item.slice(1)))
}

/** Tasks that can start now, with how many tasks are behind each; the most-blocking first. */
export function readyTaskImpact(plan) {
  return readyTasks(plan).map(task => ({task: task.id, waiting: downstreamTasks(plan, [task.id]).size})).sort((a, b) => b.waiting - a.waiting)
}

// Rooms for the budget table. A task's `room` is free text ("Drawing Room / Lobby"); it is counted under the first of
// these names that its text starts with, otherwise under "Whole home or several rooms".
export const BUDGET_ROOMS = ['Main entry', 'Drawing Room', 'Lobby', 'Bedroom 1', 'Bedroom 3', 'Study', 'Home Office', 'Kitchen']
export const SHARED_ROOM = 'Whole home or several rooms'
export const roomGroup = room => {
  const name = BUDGET_ROOMS.find(candidate => (room ?? '').startsWith(candidate))
  return name === 'Lobby' ? 'Lobby / Dining' : name ?? SHARED_ROOM
}

/** Planning-range totals: the whole plan, and by phase, trade and room. Tasks without figures are counted, never guessed. */
export function budgetTotals(plan) {
  const sum = (id, name, list) => {
    const priced = list.filter(task => task.estimateLow != null)
    return {id, name, tasks: list.length, estimated: priced.length, notEstimated: list.length - priced.length,
      low: priced.reduce((total, task) => total + task.estimateLow, 0), high: priced.reduce((total, task) => total + task.estimateHigh, 0)}
  }
  const rooms = [...BUDGET_ROOMS.map(roomGroup), SHARED_ROOM]
  return {
    all: sum('all', 'Whole plan', plan.tasks),
    byPhase: plan.phases.map(phase => sum(phase.id, phase.name, plan.tasks.filter(task => task.phase === phase.id))),
    byTrade: plan.trades.map(trade => sum(trade.id, trade.name, plan.tasks.filter(task => task.trade === trade.id))).filter(row => row.tasks),
    byRoom: rooms.map(room => sum(room, room, plan.tasks.filter(task => roomGroup(task.room) === room))).filter(row => row.tasks),
    notEstimated: plan.tasks.filter(task => task.estimateLow == null).map(task => ({id: task.id, title: task.title, reason: task.estimateBasis ?? 'No estimate recorded.'})),
  }
}

/** Rs 1,23,456 (Indian digit grouping); with `short`, figures of a lakh or more read "Rs 12.3 lakh". */
export function formatInr(value, {short = false} = {}) {
  if (short && value >= 100000) return `Rs ${(value / 100000).toFixed(value >= 1000000 ? 1 : 2)} lakh`
  const digits = String(Math.round(value)), head = digits.slice(0, -3), tail = digits.slice(-3)
  return `Rs ${head ? `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}` : tail}`
}
