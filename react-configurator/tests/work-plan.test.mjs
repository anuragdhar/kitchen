import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {validateWorkPlan, orderedTasks, planWarnings, readyTasks, planSummary, newTaskId} from '../src/home/workPlan.mjs'
import {savePlan} from '../scripts/work-plan-plugin.mjs'

const file = new URL('../../work-plan/plan.json', import.meta.url)
const load = () => JSON.parse(fs.readFileSync(file, 'utf8'))

test('the project work plan is valid and has no ordering warnings', () => {
  const plan = validateWorkPlan(load())
  assert.deepEqual(planWarnings(plan), [])
  for (const trade of ['civil', 'electrical', 'plumbing', 'carpentry']) assert.ok(plan.tasks.some(task => task.trade === trade), `no ${trade} task`)
})

test('tasks come out in phase order with every dependency first', () => {
  const plan = load(), order = orderedTasks(plan).map(task => task.id), at = id => order.indexOf(id)
  assert.equal(order.length, plan.tasks.length)
  for (const task of plan.tasks) for (const dep of task.dependsOn) assert.ok(at(dep) < at(task.id), `${dep} must come before ${task.id}`)
  assert.ok(at('engineer-check') < at('north-wall-door') && at('north-wall-door') < at('elec-chase-drawing') && at('elec-chase-drawing') < at('plaster') && at('plaster') < at('carp-tv-console') && at('paint') < at('elec-second-fix'))
})

test('the owner\'s civil items are in the plan and wait for structural approval', () => {
  const plan = load(), byId = Object.fromEntries(plan.tasks.map(task => [task.id, task]))
  assert.match(byId['shoe-rack-wall'].title, /shoe rack/)
  assert.ok(byId['shoe-rack-wall'].dependsOn.includes('engineer-check'))
  assert.match(byId['main-gate'].title, /stainless steel/)
  assert.ok(!readyTasks(plan).some(task => task.id === 'shoe-rack-wall'), 'cannot start before approval')
  assert.ok(readyTasks(plan).some(task => task.id === 'site-measure'))
})

test('ready tasks follow status changes; started work with unfinished prerequisites is flagged', () => {
  const plan = load(), set = (id, status) => { plan.tasks.find(task => task.id === id).status = status }
  set('site-measure', 'done')
  assert.ok(readyTasks(plan).some(task => task.id === 'engineer-check'))
  set('north-wall-door', 'in-progress')
  assert.match(planWarnings(plan).map(w => w.message).join(' '), /Cut the cabinet door opening.*is in progress but/)
  assert.equal(planSummary(plan).all.done, 1)
})

test('validation refuses unknown references, duplicates and loops', () => {
  const bad = mutate => { const plan = load(); mutate(plan); return () => validateWorkPlan(plan) }
  assert.throws(bad(p => { p.tasks[0].trade = 'magic' }), /unknown trade/)
  assert.throws(bad(p => { p.tasks[0].status = 'maybe' }), /unknown status/)
  assert.throws(bad(p => { p.tasks[1].dependsOn = ['nope'] }), /unknown task/)
  assert.throws(bad(p => { p.tasks.push({...p.tasks[0]}) }), /Duplicate task/)
  assert.throws(bad(p => { p.tasks.find(t => t.id === 'site-measure').dependsOn = ['snag'] }), /loop/)
  assert.throws(bad(p => { p.schemaVersion = 2 }), /version/)
})

test('new task ids are unique and safe', () => {
  const plan = load()
  assert.equal(newTaskId(plan, 'Replace the kitchen sink tap!'), 'replace-the-kitchen-sink-tap')
  assert.equal(newTaskId(plan, 'Plaster'), 'plaster-2')
  assert.match(newTaskId(plan, '???'), /^[a-z0-9][a-z0-9-]+$/)
})

test('saving validates first, replaces the file and keeps a backup', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'work-plan-')), target = path.join(dir, 'plan.json')
  try {
    const plan = load(); fs.writeFileSync(target, JSON.stringify(plan))
    plan.tasks[0].status = 'done'
    await savePlan(target, plan)
    assert.equal(JSON.parse(fs.readFileSync(target, 'utf8')).tasks[0].status, 'done')
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'plan.backup.json'), 'utf8')).tasks[0].status, 'todo')
    plan.tasks[0].status = 'nonsense'
    await assert.rejects(savePlan(target, plan), /unknown status/)
    assert.equal(JSON.parse(fs.readFileSync(target, 'utf8')).tasks[0].status, 'done', 'a refused save leaves the file alone')
  } finally { fs.rmSync(dir, {recursive: true, force: true}) }
})
