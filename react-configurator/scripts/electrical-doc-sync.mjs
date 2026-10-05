// Refreshes the figures in docs/ELECTRICAL_PLAN.md that come straight from the configs: the place of every point and the
// circuit rows (tests/room-electrical.test.mjs checks them). Prose and row order are left alone. Run from react-configurator/:
//   node scripts/electrical-doc-sync.mjs          rewrite the rows that are out of date
//   node scripts/electrical-doc-sync.mjs --check  only report; exit 1 if anything is out of date
import {readFileSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {roomElectricalKeys, roomElectricalReport} from '../src/domain/roomElectricalModels.mjs'

const path = fileURLToPath(new URL('../../docs/ELECTRICAL_PLAN.md', import.meta.url)), check = process.argv.includes('--check')
// Lines are matched without their line ending and written back with the ending each one had.
const endings = [], lines = readFileSync(path, 'utf8').split('\n').map(line => {
  const carriage = line.endsWith('\r'); endings.push(carriage ? '\r' : ''); return carriage ? line.slice(0, -1) : line
})
const stale = [], missing = []
const replaceRow = (prefix, cells, keepFrom) => {
  const index = lines.findIndex(line => line.startsWith(prefix))
  if (index < 0) { missing.push(prefix.trim()); return }
  const next = [...cells, ...lines[index].split(' | ').slice(keepFrom)].join(' | ')
  if (next !== lines[index]) { stale.push(prefix.trim()); lines[index] = next }
}
for (const key of roomElectricalKeys()) {
  const {points, check: result} = roomElectricalReport(key)
  for (const p of points) replaceRow(`| ${p.id} | `, [`| ${p.id}`, p.name, p.where], 3)
  for (const c of result.load.circuits) replaceRow(`| ${c.id} | ${c.name} | `, [`| ${c.id}`, c.name, `${c.mcbA} A`, c.points.join(', '), `${c.watts} W`], 5)
  if (!lines.join('\n').includes(`about ${result.load.totalW} W`)) missing.push(`${key}: total "about ${result.load.totalW} W" (edit that sentence by hand)`)
}
if (!check && stale.length) writeFileSync(path, lines.map((line, index) => line + endings[index]).join('\n'))
console.log(stale.length ? `${check ? 'Out of date' : 'Updated'}: ${stale.join(', ')}` : 'Rows are up to date.')
if (missing.length) console.log('Not found in the doc:', missing.join('; '))
process.exit((check && stale.length) || missing.length ? 1 : 0)
