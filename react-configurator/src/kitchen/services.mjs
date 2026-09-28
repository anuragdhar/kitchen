// Derives an indicative kitchen services layout (water, drain, gas, power)
// from the live appliance positions, so the overlay follows appliances when
// they are dragged. Pure and dependency-free.
//
// This is a coordination aid for discussing plumbing/gas/electrical intent.
// It is NOT a construction, plumbing, gas-safety or electrical drawing:
// routes hug walls schematically, and every height/size is a nominal design
// value, not a surveyed installation point.

export const SERVICES_DISCLAIMER =
  'Indicative service positions for design coordination only - not a plumbing, gas or electrical installation drawing.'

const findActive = (items, id) => items.find(item => item.id === id && !item.hidden)
const centerY = item => item.y + (item.w || 0) / 2

export function deriveKitchenServices({east, west, kitchen}) {
  const points = []
  const routes = []

  const sink = findActive(west, 'sink')
  if (sink) {
    points.push({id: 'sink-water', type: 'water', wall: 'west', y: centerY(sink) - 160, z: 550, label: 'Sink cold-water stop, ~550 high'})
    points.push({id: 'sink-drain', type: 'drain', wall: 'west', y: centerY(sink) + 160, z: 400, label: 'Sink 40 mm waste, ~400 high'})
  }
  const washing = findActive(west, 'washing')
  if (washing) {
    points.push({id: 'washing-water', type: 'water', wall: 'west', y: centerY(washing) - 120, z: 1050, label: 'Washing machine tap, ~1050 high'})
    points.push({id: 'washing-drain', type: 'drain', wall: 'west', y: centerY(washing) + 120, z: 450, label: 'Washing machine standpipe, ~450 high'})
    points.push({id: 'washing-power', type: 'power', wall: 'west', y: centerY(washing), z: 1100, label: 'Washing machine 16 A point, ~1100 high'})
  }
  const dishwasher = findActive(west, 'dishwasher')
  if (dishwasher) {
    points.push({id: 'dishwasher-water', type: 'water', wall: 'west', y: centerY(dishwasher) - 120, z: 550, label: 'Dishwasher inlet, ~550 high'})
    points.push({id: 'dishwasher-drain', type: 'drain', wall: 'west', y: centerY(dishwasher) + 120, z: 450, label: 'Dishwasher waste, ~450 high'})
    points.push({id: 'dishwasher-power', type: 'power', wall: 'west', y: centerY(dishwasher), z: 400, label: 'Dishwasher 16 A point in adjacent base unit'})
  }
  const gas = findActive(east, 'gas')
  if (gas) {
    points.push({id: 'gas-supply', type: 'gas', wall: 'east', y: centerY(gas), z: 800, label: 'Gas supply with isolation valve, ~800 high behind hob'})
    points.push({id: 'chimney-power', type: 'power', wall: 'east', y: centerY(gas), z: 2100, label: 'Chimney 6 A point inside upper cabinet, ~2100 high'})
  }
  const microwave = findActive(east, 'microwave')
  if (microwave) {
    points.push({id: 'microwave-power', type: 'power', wall: 'east', y: centerY(microwave), z: 1400, label: 'Microwave 16 A point above backsplash'})
  }
  // Planned wall sockets exist as hidden placeholders in the layout; keep
  // showing them here because they are service positions, not cabinets.
  for (const [wall, items] of [['east', east], ['west', west]]) {
    for (const item of items) {
      if (!String(item.id).startsWith('powerPoint')) continue
      points.push({id: `${item.id}-service`, type: 'power', wall, y: centerY(item), z: item.z ?? 1100, label: `${item.label || item.id}, ~${item.z ?? 1100} high`})
    }
  }

  // Wall-hugging schematic routes. The west shaft is the plumbing riser; gas
  // is shown arriving along the north then east wall to stay out of the aisle.
  const shaft = west.find(item => item.id === 'shaft')
  const westWaterYs = points.filter(p => p.wall === 'west' && (p.type === 'water' || p.type === 'drain')).map(p => p.y)
  if (shaft && westWaterYs.length) {
    const yMin = Math.min(...westWaterYs)
    routes.push({id: 'west-water', type: 'water', label: 'Water and waste runs from the shaft along the west wall',
      path: [[0, centerY(shaft)], [0, yMin]]})
  }
  if (gas) {
    routes.push({id: 'gas-line', type: 'gas', label: 'Gas line along north and east walls to the hob',
      path: [[0, kitchen.length], [kitchen.width, kitchen.length], [kitchen.width, centerY(gas)]]})
  }
  return {points, routes, disclaimer: SERVICES_DISCLAIMER}
}
