const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const appRequire = createRequire(path.resolve(__dirname, '../react-configurator/package.json'));
const { chromium } = appRequire('playwright');

(async () => {
  const output = path.resolve(__dirname, '.runtime');
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto('http://127.0.0.1:5173/?kitchenView=top', { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.innerText.trim().length > 100 && root.querySelector('button');
    }, null, { timeout: 60000 });
    await page.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'home-mobile.png'), fullPage: true });
    assert.deepEqual(errors, [], 'Browser page exceptions');
    writeFileSync(path.join(output, 'smoke.json'), JSON.stringify({ status: 'passed', url: page.url(), title: await page.title(), errors, scope: 'homepage/browser startup; not Codespaces gateway, GPU, Blender, or full visual correctness' }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
