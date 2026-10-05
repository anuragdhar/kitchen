import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {validateWorkPlan, orderedTasks, planWarnings, readyTasks, planSummary, newTaskId, checkDependencies, downstreamTasks, openItemImpact, readyTaskImpact, budgetTotals, roomGroup, formatInr, SHARED_ROOM} from '../src/home/workPlan.mjs'
import {RATES, ESTIMATORS, QUANTITIES, estimateTask, applyEstimates, rateContributions} from '../src/home/workPlanEstimate.mjs'
import {savePlan} from '../scripts/work-plan-plugin.mjs'
import {readOpenItems, budgetDocument, nextStepsDocument} from '../scripts/work-plan-estimate.mjs'

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
  assert.ok(!readyTasks(plan).some(task => task.id === 'engineer-check'), 'the engineer needs the shaft inspection too')
  set('pocket-check', 'done')
  assert.ok(readyTasks(plan).some(task => task.id === 'engineer-check'))
  set('north-wall-door', 'in-progress')
  assert.match(planWarnings(plan).map(w => w.message).join(' '), /Cut the cabinet door opening.*is in progress but/)
  assert.equal(planSummary(plan).all.done, 2)
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

// ---- 2026-10-05: buildable order, budget, open items ----

const PHASES = ['measure', 'civil', 'plumbing-rough', 'electrical-rough', 'surfaces', 'carpentry', 'paint', 'second-fix', 'finish']
const openItems = () => readOpenItems(fs.readFileSync(new URL('../../work-plan/OPEN_ITEMS.md', import.meta.url), 'utf8'))

test('the dependency check passes on the project plan and finds missing tasks, loops and later-phase dependencies', () => {
  const plan = load()
  assert.deepEqual(checkDependencies(plan), [])
  assert.deepEqual(plan.phases.map(phase => phase.id), PHASES)
  const broken = mutate => { const copy = load(); mutate(Object.fromEntries(copy.tasks.map(task => [task.id, task]))); return checkDependencies(copy) }
  assert.deepEqual(broken(t => { t.plaster.dependsOn.push('nope') }).map(p => [p.kind, p.task, p.dependsOn]), [['missing', 'plaster', 'nope']])
  // The first task waiting for the last one closes many loops (one per task that needs the measurements) and is out of phase.
  assert.deepEqual([...new Set(broken(t => { t['site-measure'].dependsOn = ['snag'] }).map(p => p.kind))].sort(), ['cycle', 'later-phase'])
  assert.deepEqual(broken(t => { t['north-wall-door'].dependsOn.push('paint') }).filter(p => p.kind === 'later-phase').map(p => [p.task, p.dependsOn]), [['north-wall-door', 'paint']])
  const loop = broken(t => { t['pocket-check'].dependsOn = ['engineer-check'] }) // same phase, so only a loop
  assert.deepEqual(loop.map(p => p.kind), ['cycle'])
  assert.match(loop[0].message, /engineer-check -> pocket-check -> engineer-check|pocket-check -> engineer-check -> pocket-check/)
  assert.deepEqual(checkDependencies({}), [])
})

test('the order of work is buildable: approvals, civil, first fix and AC pipes before plaster, carpentry, paint, fit-out, snag', () => {
  const plan = load(), byId = Object.fromEntries(plan.tasks.map(task => [task.id, task])), phase = id => PHASES.indexOf(byId[id].phase)
  const order = orderedTasks(plan).map(task => task.id), before = (a, b) => assert.ok(order.indexOf(a) < order.indexOf(b), `${a} must come before ${b}`)
  // No wall is cut before the structural approval and the society's permission.
  for (const id of ['shoe-rack-wall', 'north-wall-door', 'lobby-bedroom3-opening']) for (const need of ['engineer-check', 'society-permission']) assert.ok(byId[id].dependsOn.includes(need), `${id} needs ${need}`)
  // The Lobby switchboard moves before the Bedroom 1 doorway is cut; the old doorway closes only after the new one is open.
  before('lobby-switchboard-move', 'lobby-bedroom3-opening'); before('lobby-bedroom3-opening', 'bedroom1-old-door-close')
  // Everything that goes into a wall is in before plaster: every first-fix task except the floor box, which goes before flooring.
  for (const task of plan.tasks.filter(task => task.phase === 'electrical-rough' && task.id !== 'elec-floor-box')) assert.ok(byId.plaster.dependsOn.includes(task.id), `plaster must wait for ${task.id}`)
  assert.ok(byId.flooring.dependsOn.includes('elec-floor-box'))
  for (const id of ['ac-piping', 'ac-piping-other', 'plumbing-rough', 'debris']) assert.ok(byId.plaster.dependsOn.includes(id), `plaster must wait for ${id}`)
  // Carpentry and steel fabrication before paint; fittings after it.
  for (const task of plan.tasks.filter(task => task.phase === 'carpentry')) assert.ok(byId.paint.dependsOn.includes(task.id), `paint must wait for ${task.id}`)
  for (const id of ['lights-track-drawing', 'lights-track-kitchen', 'ac-install', 'ac-window-install', 'elec-second-fix', 'lobby-shutter']) { assert.ok(byId[id].dependsOn.includes('paint'), `${id} follows paint`); assert.equal(phase(id), 7) }
  // The trial blind comes before the outside screen is chosen, and can start today.
  before('window-screen-trial', 'window-outside-chick'); assert.ok(readyTasks(plan).some(task => task.id === 'window-screen-trial'))
  // Everything leads to the snag list.
  assert.equal(downstreamTasks(plan, ['snag']).size, 0)
  for (const task of plan.tasks) if (task.id !== 'snag') assert.ok(downstreamTasks(plan, [task.id]).has('snag'), `${task.id} does not lead to the snag list`)
})

test('the catch-up of 2026-10-05 is in the plan, and proposals stay proposals', () => {
  const plan = load(), byId = Object.fromEntries(plan.tasks.map(task => [task.id, task]))
  assert.equal(plan.tasks.length, 112)
  assert.ok(plan.tasks.every(task => task.status === 'todo'))
  assert.match(byId['main-gate'].detail, /VENTILATED/); assert.match(byId['elec-entry-lights'].title, /four round lights/)
  for (const room of ['bedroom1', 'bedroom3', 'study', 'kitchen', 'lobby']) assert.ok(byId[`elec-track-feed-${room}`] && byId[`lights-track-${room}`], `track tasks for ${room}`)
  assert.ok(!byId['elec-track-feed-rooms'] && !byId['carp-other'], 'the two catch-all tasks are split per room')
  assert.match(byId['drawing-switchboard-decide'].detail, /behind the TV/); assert.match(byId['elec-drawing-west-sockets'].title, /behind the west sofa/)
  assert.match(byId['lobby-bedroom3-opening'].title, /Bedroom 1 door/); assert.doesNotMatch(byId['lobby-bedroom3-opening'].title, /Bedroom 3/)
  assert.match(byId['carp-office-desk'].detail, /1,500 x 762/); assert.match(byId['carp-office-desk'].detail, /743/)
  assert.match(byId['ac-window-frame'].title, /iron frame for the window AC/); assert.equal(byId['ac-window-frame'].trade, 'fabrication')
  assert.match(byId['ac-choose'].detail, /two places, NOT decided/); assert.match(byId['shoe-rack-support'].detail, /not decided/)
  assert.match(byId['window-screen-trial'].detail, /ONE ready-made outdoor HDPE roll-up blind/)
  // All five notes of 2026-10-05 are folded in: no placeholder is left.
  assert.deepEqual(plan.tasks.filter(task => /PENDING/.test(task.detail)).map(task => task.id), [])
  // Electrical plans: a first-fix task per room, priced from the point counts; the entry task covers its 11 points.
  for (const room of ['lobby', 'bedroom1', 'bedroom3', 'study', 'office', 'kitchen']) {
    assert.ok(byId.plaster.dependsOn.includes(`elec-first-fix-${room}`) && byId['elec-second-fix-other'].dependsOn.includes(`elec-first-fix-${room}`), `first fix for ${room}`)
    assert.ok(byId[`elec-first-fix-${room}`].dependsOn.includes('electrician-survey'), `${room} waits for the survey`)
  }
  assert.ok(!byId['elec-chase-other-rooms']); assert.match(byId['elec-entry-ceiling'].title, /11 points/)
  assert.ok(byId['elec-first-fix-bedroom1'].estimateLow > 0); assert.equal(byId['elec-first-fix-kitchen'].estimateLow, undefined)
  // Proposals stay decisions: no Bedroom 1 split AC, a Lobby AC, the west wall for the Drawing Room unit, the palette.
  assert.match(byId['elec-first-fix-bedroom1'].detail, /B1-W1 is NOT built unless/); assert.ok(byId['elec-first-fix-bedroom1'].openItems.includes('C31'))
  for (const id of ['ac-piping-other', 'ac-install-other']) { assert.match(byId[id].detail, /^ONLY IF/); assert.equal(byId[id].estimateLow, 0); assert.ok(byId[id].openItems.includes('C40')) }
  assert.match(byId['ac-plan-home'].title, /not decided/); assert.ok(byId['ac-choose'].openItems.includes('C15'))
  assert.match(byId['palette-choose'].detail, /^OWNER DECISION, not taken/); assert.equal(byId['doors-repolish'].estimateLow, 0)
  for (const task of plan.tasks.filter(task => task.phase === 'carpentry' && task.trade === 'carpentry')) assert.ok(task.dependsOn.includes('palette-choose'), `${task.id} waits for the palette`)
  // The Lobby AC pipes go in before the Pooja woodwork and the balcony wardrobe.
  assert.ok(byId['carp-pooja'].dependsOn.includes('ac-piping-other') && byId['carp-bedroom1'].dependsOn.includes('ac-piping-other'))
  assert.match(byId['lights-pooja'].detail, /8 W round surface LED panel/); assert.ok(byId['lights-pooja'].dependsOn.includes('elec-first-fix-lobby'))
  assert.match(byId['carp-bedroom3-east'].detail, /dressing cabinet moves to the SOUTH side/); assert.match(byId['carp-bedroom3-east'].estimateBasis, /full-height storage cabinet 750 x 2700.*dressing cabinet 750 x 2200/)
  // Folded in earlier: tracks moved off the ceiling mouldings, and the Bedroom 1 design.
  assert.match(byId['lighting-plan-drawing'].detail, /Totals: 3\.95 m of track/); assert.match(byId['lighting-plan-lobby'].detail, /Totals: 3\.5 m of track/); assert.match(byId['lighting-plan-bedroom3'].detail, /Totals: 5\.5 m of track/)
  for (const room of ['', '-lobby', '-bedroom1', '-bedroom3', '-study', '-kitchen']) assert.ok(byId[`elec-track-feed${room}`].dependsOn.includes('elec-track-setout'), `the ${room || 'drawing'} feed waits for the set-out`)
  assert.match(byId['lobby-pendant-decide'].detail, /NO ceiling point/); assert.ok(byId['elec-lobby-pendant-feed'].dependsOn.includes('lobby-pendant-decide'))
  // Layout B is recommended, not chosen: a decision task and a conditional task whose estimate starts at nothing.
  assert.match(byId['bedroom1-design-freeze'].detail, /^OWNER DECISION, not taken/); assert.ok(byId['bedroom1-design-freeze'].openItems.includes('C35'))
  assert.match(byId['carp-bedroom1-layout-b'].title, /only if layout B is chosen/); assert.equal(byId['carp-bedroom1-layout-b'].estimateLow, 0); assert.ok(byId['carp-bedroom1-layout-b'].estimateHigh > 0)
  assert.match(byId['lighting-plan-bedroom1'].detail, /IF LAYOUT B is chosen \(not decided\)/)
  assert.match(byId['carp-bedroom1'].detail, /SLIDING panels/)
})

test('every open item a task names exists in OPEN_ITEMS.md and is still open', () => {
  const plan = load(), items = openItems()
  for (const task of plan.tasks) for (const id of task.openItems ?? []) {
    assert.ok(items.has(id), `${task.id} names ${id}, which is not in OPEN_ITEMS.md`)
    assert.ok(!items.get(id).closed, `${task.id} names ${id}, which is answered`)
  }
  assert.ok(items.get('B5').closed && items.get('C21').closed && items.get('E2').closed)
  for (const id of ['A21', 'A22', 'A23', 'A24', 'C20', 'C28', 'C29', 'C30', 'C31']) assert.ok(plan.tasks.some(task => task.openItems?.includes(id)), `no task waits for ${id}`)
})

test('"what to do first" is computed from the tasks that name each open item and everything behind them', () => {
  const plan = load(), impact = openItemImpact(plan), byItem = Object.fromEntries(impact.map(row => [row.item, row]))
  for (let i = 1; i < impact.length; i++) assert.ok(impact[i - 1].waiting >= impact[i].waiting)
  for (const row of impact) assert.equal(row.waiting, row.direct.length + downstreamTasks(plan, row.direct).size)
  assert.deepEqual(byItem.A11.direct, ['lobby-shutter']); assert.equal(byItem.A11.waiting, 2) // the doors and the snag list
  assert.ok(byItem.D2.waiting > byItem.A3.waiting && byItem.A3.waiting > byItem.A11.waiting)
  // A tiny plan by hand: A1 is named by aa and cc, and bb is behind aa; C2 is named only by cc.
  const tiny = {phases: [{id: 'p', name: 'P'}], trades: [{id: 't', name: 'T'}], tasks: [
    {id: 'aa', phase: 'p', trade: 't', title: 'A', dependsOn: [], status: 'todo', openItems: ['A1']},
    {id: 'bb', phase: 'p', trade: 't', title: 'B', dependsOn: ['aa'], status: 'todo'},
    {id: 'cc', phase: 'p', trade: 't', title: 'C', dependsOn: ['aa'], status: 'todo', openItems: ['C2', 'A1']},
  ]}
  assert.deepEqual(openItemImpact(tiny), [{item: 'A1', direct: ['aa', 'cc'], waiting: 3}, {item: 'C2', direct: ['cc'], waiting: 1}])
  assert.deepEqual(readyTaskImpact(tiny), [{task: 'aa', waiting: 2}])
  tiny.tasks[0].status = 'done' // a finished task no longer waits for its item
  assert.deepEqual(openItemImpact(tiny).map(row => [row.item, row.direct]), [['A1', ['cc']], ['C2', ['cc']]])
  const page = nextStepsDocument(plan, openItems())
  assert.match(page, /\| 1 \| [A-E]\d+ \|/); assert.doesNotMatch(page, /not in OPEN_ITEMS/)
})

test('estimates: optional fields, validated; a plan without them still loads', () => {
  const old = load(); for (const task of old.tasks) for (const key of ['estimateLow', 'estimateHigh', 'estimateBasis', 'estimateConfidence', 'openItems']) delete task[key]
  assert.equal(old.schemaVersion, 1); validateWorkPlan(old)
  assert.deepEqual(budgetTotals(old).all, {id: 'all', name: 'Whole plan', tasks: 112, estimated: 0, notEstimated: 112, low: 0, high: 0})
  const bad = values => { const plan = load(); Object.assign(plan.tasks[0], values); return () => validateWorkPlan(plan) }
  assert.throws(bad({estimateLow: 100, estimateHigh: undefined}), /both a low and a high/)
  assert.throws(bad({estimateLow: 200, estimateHigh: 100}), /above the high/)
  assert.throws(bad({estimateLow: -1, estimateHigh: 100}), /whole rupees/)
  assert.throws(bad({estimateLow: 10.5, estimateHigh: 100}), /whole rupees/)
  assert.throws(bad({estimateLow: 1, estimateHigh: 2, estimateConfidence: 'high'}), /low or medium/)
  assert.throws(bad({estimateLow: undefined, estimateHigh: undefined, estimateConfidence: 'low'}), /without an estimate/)
  assert.throws(bad({estimateBasis: 'x'.repeat(2001)}), /estimateBasis/)
  assert.throws(bad({openItems: ['Z9']}), /not an open-item id/)
  assert.throws(bad({openItems: ['A1', 'A1']}), /listed twice/)
})

test('budget totals add up by phase, trade and room; unestimated tasks are counted, not guessed', () => {
  const plan = load(), totals = budgetTotals(plan), sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0)
  for (const rows of [totals.byPhase, totals.byTrade, totals.byRoom]) for (const key of ['low', 'high', 'tasks', 'estimated', 'notEstimated']) assert.equal(sum(rows, key), totals.all[key], key)
  assert.equal(totals.all.estimated + totals.all.notEstimated, 112)
  assert.equal(totals.notEstimated.length, totals.all.notEstimated)
  for (const row of totals.notEstimated) assert.match(row.reason, /^Not estimated: /, row.id)
  assert.ok(totals.all.low > 500000 && totals.all.high < 6000000 && totals.all.low < totals.all.high, 'a few lakh to a few tens of lakh')
  for (const task of plan.tasks) assert.ok(task.estimateBasis, `${task.id} has no basis`)
  assert.equal(roomGroup('Drawing Room / Lobby'), 'Drawing Room'); assert.equal(roomGroup('Lobby / Dining'), 'Lobby / Dining')
  assert.equal(roomGroup('Whole home'), SHARED_ROOM); assert.equal(roomGroup(undefined), SHARED_ROOM)
  assert.equal(formatInr(0), 'Rs 0'); assert.equal(formatInr(950), 'Rs 950'); assert.equal(formatInr(12500), 'Rs 12,500')
  assert.equal(formatInr(1234567), 'Rs 12,34,567'); assert.equal(formatInr(1234567, {short: true}), 'Rs 12.3 lakh'); assert.equal(formatInr(250000, {short: true}), 'Rs 2.50 lakh')
})

test('estimates are quantity x rate from the configs, and the stored figures match the estimator', () => {
  for (const [id, rate] of Object.entries(RATES)) assert.ok(rate.label && rate.unit && rate.low > 0 && rate.low <= rate.high, id)
  // Quantities come from the configs, not from the plan text.
  assert.deepEqual(QUANTITIES.tracks.drawing, {runs: 2, metres: 3.95, spot: 3, diffuse: 2, reading: 3, driver60: 1, driver100: 1})
  assert.equal(Object.values(QUANTITIES.tracks).reduce((total, track) => total + track.runs, 0), 11)
  assert.deepEqual([QUANTITIES.outerDoor.widthMm, QUANTITIES.outerDoor.heightMm], [905, 2200])
  assert.deepEqual(QUANTITIES.kitchen, {eastRunMm: 4746, westRunMm: 3298, openAppliancesMm: 1200})
  assert.deepEqual(QUANTITIES.windowBays.map(Math.round), [934, 899, 867])
  assert.deepEqual(Object.fromEntries(Object.entries(QUANTITIES.roomPoints).map(([room, points]) => [room, points.all])), {lobby: 12, bedroom1: 11, bedroom3: 12, study: 9, office: 9, entry: 11})
  assert.deepEqual(QUANTITIES.roomPoints.lobby.counted, 6) // less two track feeds, the switchboard, its junction box, the pendant point and the AC point
  assert.deepEqual([QUANTITIES.acRuns.drawing.pipeM, QUANTITIES.acRuns.lobby.pipeM], [4.3, 4.4])
  assert.ok(QUANTITIES.acRuns.drawingShoeRack.pipeM > 9 && QUANTITIES.acRuns.drawing.drainM > 8)
  // One worked example: four cable runs at the data-point rate, rounded down and up to Rs 500.
  assert.deepEqual(estimateTask('elec-data'), {estimateLow: 4500, estimateHigh: 9000, estimateBasis: 'cable runs: 4 run x Rs 1,200-2,200. CAT6, coax, phone, intercom.', estimateConfidence: 'medium'})
  assert.deepEqual(estimateTask('plumbing-rough'), {estimateBasis: 'Not estimated: No plumbing change is listed yet (plumbing-scope).'})
  assert.equal(estimateTask('no-such-task'), null)
  const plan = load(), fresh = structuredClone(plan)
  assert.deepEqual(applyEstimates(fresh), [], 'every task has an estimator')
  assert.deepEqual(Object.keys(ESTIMATORS).filter(id => !plan.tasks.some(task => task.id === id)), [], 'no estimator for a task that is gone')
  validateWorkPlan(fresh)
  // The stored figures are the estimator's. A config change by itself (a longer track, a wider wardrobe) may drift a
  // little before the plan is regenerated (node scripts/work-plan-estimate.mjs); a large drift fails here.
  const stored = budgetTotals(plan).all, now = budgetTotals(fresh).all
  assert.equal(now.estimated, stored.estimated)
  for (const key of ['low', 'high']) assert.ok(Math.abs(now[key] - stored[key]) <= 0.15 * stored[key], `the ${key} total drifted from ${stored[key]} to ${now[key]}: run node scripts/work-plan-estimate.mjs`)
  // What moves the total: the rate rows cover the whole high total (each task is rounded to Rs 500 or Rs 1,000).
  const rows = rateContributions(plan.tasks.map(task => task.id))
  assert.ok(Math.abs(rows.reduce((total, row) => total + row.high, 0) - now.high) < 1000 * now.estimated)
  assert.equal(rows[0].rate, 'carpTall')
  assert.match(budgetDocument(plan), /## The five numbers the total is most sensitive to/)
})

test('the plan file is written the way the Work plan page writes it', () => {
  const raw = fs.readFileSync(file, 'utf8')
  assert.equal(raw.replace(/\r\n/g, '\n'), `${JSON.stringify(JSON.parse(raw), null, 2)}\n`)
})
