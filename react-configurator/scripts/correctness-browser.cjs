const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const {openKitchen} = require('./browser-helpers.cjs');

function dxfEntities(text) {
  const lines = text.trim().split(/\r?\n/);
  const entities = []; let entity;
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = lines[i], value = lines[i + 1];
    if (code === '0') { entity = {type: value}; entities.push(entity); }
    else if (entity) entity[code] = value;
  }
  return entities;
}

(async () => {
  const target = new URL(process.env.KITCHEN_APP_URL || 'http://127.0.0.1:4175');
  target.searchParams.set('kitchenView', 'top');
  const url = target.href;
  const out = path.resolve('test-results/correctness');
  fs.mkdirSync(out, {recursive: true});
  let server, browser, page, output = '';
  const errors = [], diagnostics = [];
  const step = message => { console.log(`[correctness] ${message}`); diagnostics.push(message); };
  try {
    if (!process.env.KITCHEN_APP_URL) {
      server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175', '--strictPort'],
        {stdio: ['ignore', 'pipe', 'pipe']});
      const collect = data => { output = (output + data.toString()).slice(-8000); };
      server.stdout.on('data', collect); server.stderr.on('data', collect);
      server.on('error', error => { output += String(error); });
      const deadline = Date.now() + 30000; let ready = false;
      while (Date.now() < deadline) {
        if (server.exitCode !== null) throw new Error(`Vite exited: ${output}`);
        try { if ((await fetch(url)).ok) { ready = true; break; } } catch {}
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      assert.equal(ready, true, `Vite did not start: ${output}`);
    }
    browser = await chromium.launch({headless: true});
    page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    page.setDefaultTimeout(60000);
    page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR:', error.message); });
    page.on('console', message => { if (message.type() === 'error') console.error('BROWSER:', message.text()); });
    step('Opening kitchen with explicit API readiness');
    await openKitchen(page, url);
    await page.waitForFunction(() => window.kitchenAPI?.validate().all === true);
    step('Kitchen ready; switching to plan for geometry and export checks');
    await page.getByRole('button', {name: 'Top View (Plan)', exact: true}).click({noWaitAfter: true});
    const initial = await page.evaluate(() => {
      const api = window.kitchenAPI;
      const layout = api.getLayout();
      return {east: layout.east, west: layout.west, dimensions: api.getDimensions(),
        validation: api.validate(), svg: api.getPlanSvg(), dxf: api.getPlanDxf()};
    });
    assert.equal(initial.dimensions.walkwayWidth, 1124);
    assert.equal(initial.validation.rows.length, 8);
    assert.equal(initial.validation.rows.every(row => row.status === 'pass'), true);
    const svg = await page.evaluate(text => {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      if (doc.querySelector('parsererror')) throw new Error('Malformed SVG');
      return {text: doc.documentElement.textContent, rects: [...doc.querySelectorAll('rect')].map(rect =>
        Object.fromEntries(['x','y','width','height'].map(key => [key, Number(rect.getAttribute(key))]))),
      lines: [...doc.querySelectorAll('line')].map(line => Object.fromEntries(['x1','x2','y1','y2'].map(key => [key, Number(line.getAttribute(key))])))};
    }, initial.svg);
    assert.match(svg.text, /Walkway 1124 mm/);
    assert.doesNotMatch(svg.text, /1324 mm|WEST 400D|West 400 mm/);
    assert.ok(svg.rects.some(rect => rect.x === 0 && rect.width === 600 && rect.height === 4136), 'SVG west run is 600 mm deep');
    assert.ok(svg.lines.some(line => line.x1 === 600 && line.x2 === 1724 && line.y1 === 2373 && line.y2 === 2373), 'SVG aisle dimension matches its label');
    const dxf = dxfEntities(initial.dxf);
    const westEdges = dxf.filter(entity => entity.type === 'LINE' && entity['8'] === 'WEST_CABINETS');
    assert.equal(westEdges.length, 4);
    assert.equal(Math.max(...westEdges.flatMap(entity => [+entity['10'], +entity['11']])), 600);
    assert.ok(dxf.some(entity => entity.type === 'TEXT' && entity['1'] === 'West counter depth 600 mm'));
    assert.ok(dxf.some(entity => entity.type === 'TEXT' && entity['1'] === 'Walkway width 1124 mm'));
    assert.doesNotMatch(initial.dxf, /West counter depth 400 mm|Walkway width 1324 mm/);
    fs.writeFileSync(path.join(out, 'plan.svg'), initial.svg);
    fs.writeFileSync(path.join(out, 'plan.dxf'), initial.dxf);

    step('SVG and DXF geometry checked; injecting non-order failure');
    await page.evaluate(() => window.kitchenAPI.moveItemMM('west', 'sinkUpperDishRack', 1211));
    await page.waitForFunction(() => window.kitchenAPI?.validate().all === false);
    const failed = await page.evaluate(() => ({api: window.kitchenAPI.validate(),
      project: window.kitchenAPI.getProjectData().validation, layout: window.kitchenAPI.getLayout().validation,
      panel: window.kitchenAPI.getValidationRows()}));
    assert.equal(failed.api.eastOk, true); assert.equal(failed.api.westOk, true);
    assert.equal(failed.api.rows.find(row => row.id === 'sink-storage').status, 'fail');
    await page.getByText('Invalid East:OK West:OK', {exact: true}).waitFor({state: 'visible'});
    const rackLabel = page.getByText('Over-sink storage aligns with sink', {exact: true});
    assert.match(await rackLabel.locator('..').innerText(), /FAIL/);
    assert.equal(failed.project.all, false); assert.equal(failed.layout.all, false);
    assert.deepEqual(failed.api.rows, failed.panel);
    assert.deepEqual(failed.project.rows, failed.panel);
    await page.evaluate(() => window.kitchenAPI.reset());
    await page.waitForFunction(() => window.kitchenAPI?.validate().all === true);
    step('Validation propagation checked; testing material-only changes');
    const beforeMaterial = await page.evaluate(() => ({east: window.kitchenAPI.getLayout().east,
      west: window.kitchenAPI.getLayout().west, dimensions: window.kitchenAPI.getDimensions()}));
    await page.evaluate(() => window.kitchenAPI.setMaterial('cabinetBody', '#654321'));
    await page.waitForFunction(() => window.kitchenAPI?.getMaterials().cabinetBody === '#654321');
    const afterMaterial = await page.evaluate(() => ({east: window.kitchenAPI.getLayout().east,
      west: window.kitchenAPI.getLayout().west, dimensions: window.kitchenAPI.getDimensions()}));
    assert.deepEqual(afterMaterial, beforeMaterial);
    step('Material invariance checked; leaving and reopening kitchen');
    await page.getByRole('button', {name: 'Return to whole home plan', exact: true}).click({noWaitAfter: true});
    await page.waitForFunction(() => window.kitchenAPI === undefined);
    await page.getByRole('button', {name: 'Open Kitchen', exact: true}).first().click({noWaitAfter: true});
    await page.waitForFunction(() => window.kitchenAPI?.validate().all === true);
    await page.evaluate(() => window.kitchenAPI.reset());
    await page.getByRole('button', {name: 'Top View (Plan)', exact: true}).click({noWaitAfter: true});
    await page.screenshot({path: path.join(out, 'kitchen.png'), fullPage: true});
    await page.setViewportSize({width: 390, height: 900});
    await page.screenshot({path: path.join(out, 'kitchen-mobile.png'), fullPage: true});
    step('Room lifecycle and plan screenshot complete');
    assert.deepEqual(errors, [], 'No browser page exceptions');
    const result = {passed: ['default runtime validation', 'SVG labels and geometry', 'DXF labels and geometry',
      'non-order failure propagates to API/panel/project', 'material changes preserve geometry', 'API lifecycle'],
      initialValidation: initial.validation, invalidValidation: failed.api, pageErrors: errors};
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({error: String(error), errors, diagnostics, serverOutput: output}, null, 2));
    if (page) await page.screenshot({path: path.join(out, 'failure.png'), fullPage: true, timeout: 5000}).catch(() => {});
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) { server.kill('SIGTERM'); await new Promise(resolve => {
      if (server.exitCode !== null) return resolve();
      server.once('exit', resolve); setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 3000).unref();
    }); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
