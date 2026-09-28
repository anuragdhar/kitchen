import test from 'node:test'
import assert from 'node:assert/strict'
import {deriveKitchenServices, SERVICES_DISCLAIMER} from '../src/kitchen/services.mjs'

const kitchen = {width: 2324, length: 4746}
const fixture = () => ({
  kitchen,
  east: [
    {id: 'gas', y: 2400, w: 700},
    {id: 'microwave', y: 0, w: 600},
    {id: 'powerPointEast1', y: 1650, w: 20, z: 1100, hidden: true, label: 'Power point east y1650'},
  ],
  west: [
    {id: 'shaft', y: 3908, w: 838},
    {id: 'sink', y: 1210, w: 762},
    {id: 'washing', y: 610, w: 600},
    {id: 'dishwasher', y: 1972, w: 600},
  ],
})

test('derives water, drain, gas and power points that follow appliance centres', () => {
  const {points, disclaimer} = deriveKitchenServices(fixture())
  const byId = Object.fromEntries(points.map(p => [p.id, p]))
  assert.equal(byId['sink-water'].y, 1210 + 381 - 160)
  assert.equal(byId['gas-supply'].y, 2400 + 350)
  assert.equal(byId['gas-supply'].wall, 'east')
  assert.equal(byId['washing-power'].type, 'power')
  assert.equal(byId['powerPointEast1-service'].z, 1100) // hidden placeholder still shown
  assert.equal(disclaimer, SERVICES_DISCLAIMER)
})

test('hidden appliances contribute no points and moving an appliance moves its points', () => {
  const data = fixture()
  data.west = data.west.map(item => item.id === 'sink' ? {...item, hidden: true} : item)
  const {points} = deriveKitchenServices(data)
  assert.ok(!points.some(p => p.id.startsWith('sink-')))
  const moved = fixture()
  moved.east = moved.east.map(item => item.id === 'gas' ? {...item, y: 1200} : item)
  const gasPoint = deriveKitchenServices(moved).points.find(p => p.id === 'gas-supply')
  assert.equal(gasPoint.y, 1200 + 350)
})

test('routes hug the walls: every vertex lies on a wall line', () => {
  const {routes} = deriveKitchenServices(fixture())
  assert.ok(routes.length >= 2)
  for (const route of routes) for (const [x, y] of route.path) {
    assert.ok(x === 0 || x === kitchen.width || y === 0 || y === kitchen.length,
      `${route.id} vertex ${x},${y} not on a wall`)
  }
  const gasRoute = routes.find(r => r.id === 'gas-line')
  assert.deepEqual(gasRoute.path.at(-1), [kitchen.width, 2750])
})

test('does not mutate its input', () => {
  const data = fixture()
  const before = structuredClone(data)
  deriveKitchenServices(data)
  assert.deepEqual(data, before)
})
