// Quick visual check of one room page (or Whole home 3D): opens it, clicks each named view button and saves the 3D canvas.
// Screenshots are smoke evidence to look at, not approved baselines (docs/TESTING.md).
//
//   node scripts/room-shots.cjs --room "Drawing Room" --views "Overview,Top,North wall view" --out test-results/shots
//   node scripts/room-shots.cjs --whole --out test-results/shots
//
// --url     server to use (default http://127.0.0.1:5173; start it with `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`)
// --press   extra buttons to click once, before the views (comma separated, exact names), e.g. "Show electrical points"
// --size    viewport, default 1400x1000
// --timeout whole-run limit in seconds, default 180; the run exits with status 1 if it is reached
// --software  use software WebGL (slow). The default asks Chrome for the GPU, which is many times faster.
const {chromium} = require('playwright')
const path = require('node:path'), fs = require('node:fs')

const args = process.argv.slice(2), option = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1] }
const flag = name => args.includes('--' + name), list = text => (text || '').split(',').map(s => s.trim()).filter(Boolean)
const room = option('room'), whole = flag('whole'), out = path.resolve(option('out', 'test-results/shots'))
const url = option('url', 'http://127.0.0.1:5173'), [width, height] = option('size', '1400x1000').split('x').map(Number)
const limit = Number(option('timeout', '180')) * 1000
if (!room && !whole) { console.error('Give --room "<name>" or --whole'); process.exit(2) }

const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const timer = setTimeout(() => { console.error(`FAILED: not finished after ${limit / 1000} s`); process.exit(1) }, limit)

;(async () => {
  fs.mkdirSync(out, {recursive: true})
  const started = Date.now(), errors = [], missing = []
  const gpu = flag('software') ? [] : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--use-gl=angle']
  const browser = await chromium.launch({channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true, args: gpu})
  const page = await browser.newPage({viewport: {width, height}})
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url)
  const target = whole ? page.getByRole('button', {name: /Whole home 3D/}).first() : page.getByRole('button', {name: 'Open ' + room, exact: true}).first()
  await target.click({noWaitAfter: true})
  // Only some pages mark their canvas ready; the others get a canvas, quiet network and a short settle time.
  await page.locator('canvas').first().waitFor({timeout: 60000})
  const ready = await page.locator('canvas[data-scene-ready="true"]').first().waitFor({timeout: 4000}).then(() => true, () => false)
  if (!ready) { await page.waitForLoadState('networkidle', {timeout: 20000}).catch(() => {}); await page.waitForTimeout(2500) }
  const name = whole ? 'whole-home' : slug(room), canvas = page.locator('canvas').first()
  const save = async label => { await page.waitForTimeout(900); const file = path.join(out, `${name}-${slug(label)}.png`); await canvas.screenshot({path: file, timeout: 30000}); console.log('saved', file) }
  const press = async label => {
    const button = page.getByRole('button', {name: label, exact: true}).first()
    if (!(await button.count())) { missing.push(label); return false }
    await button.click({noWaitAfter: true, timeout: 10000}); return true
  }
  for (const label of list(option('press'))) await press(label)
  const views = list(option('views'))
  if (!views.length) await save('default')
  for (const view of views) if (await press(view)) await save(view)
  const renderer = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl'); const info = gl && gl.getExtension('WEBGL_debug_renderer_info'); return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown' })
  await browser.close(); clearTimeout(timer)
  console.log(`scene-ready event: ${ready ? 'yes' : 'not offered by this page (waited for quiet network instead)'}; renderer: ${renderer}; ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (missing.length) console.log('buttons not found:', missing.join(' | '))
  console.log('page errors:', errors.length ? errors.join(' | ') : 'none')
  process.exit(errors.length || missing.length ? 1 : 0)
})().catch(error => { console.error('FAILED:', error.message); process.exit(1) })
