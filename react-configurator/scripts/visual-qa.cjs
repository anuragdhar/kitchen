const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {openKitchen, hasNonBlankCanvas} = require('./browser-helpers.cjs');

const APP_URL = process.env.KITCHEN_APP_URL || 'http://127.0.0.1:5173/';
const OUT_DIR = path.resolve(__dirname, '..', 'tmp-visual-qa');
const views = ['Top View (Plan)', 'Front View (Looking North)', 'East Wall View + Cabinets',
  'West Wall View + Cabinets', 'North Elevation', 'South Elevation', 'Create 3D Render'];
const viewports = [{name: 'desktop', width: 1440, height: 1000}, {name: 'mobile', width: 390, height: 900}];
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(async () => {
  fs.rmSync(OUT_DIR, {recursive: true, force: true});
  fs.mkdirSync(OUT_DIR, {recursive: true});
  const browser = await chromium.launch();
  const failures = [];
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({viewport: {width: viewport.width, height: viewport.height}, deviceScaleFactor: 1});
      try {
        const page = await context.newPage();
        page.on('console', message => {
          if (!['error', 'warning'].includes(message.type())) return;
          const known = ['GPU stall due to ReadPixels', 'PCFSoftShadowMap has been deprecated',
            'Texture marked for update but no image data found'];
          if (known.some(text => message.text().includes(text))) return;
          failures.push(`${viewport.name} console ${message.type()}: ${message.text()}`);
        });
        page.on('pageerror', error => failures.push(`${viewport.name} page error: ${error.message}`));
        await openKitchen(page, APP_URL);
        for (const view of views) {
          await page.getByRole('button', {name: view, exact: true}).click();
          // Smoke settling only: replace with an explicit app scene-ready event later.
          await page.waitForTimeout(view.includes('3D') ? 1500 : 400);
          await page.evaluate(() => window.scrollTo(0, 0));
          if (view.includes('3D') && !(await hasNonBlankCanvas(page))) failures.push(`${viewport.name} 3D canvas missing or solid`);
          const filePath = path.join(OUT_DIR, `${viewport.name}-${slug(view)}.png`);
          await page.screenshot({path: filePath, fullPage: true, timeout: 90000});
          console.log(path.relative(path.resolve(__dirname, '..'), filePath));
        }
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
  if (failures.length) {
    console.error('Visual smoke failures:\n' + failures.map(value => `- ${value}`).join('\n'));
    process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
