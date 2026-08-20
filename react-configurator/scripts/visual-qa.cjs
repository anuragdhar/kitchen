const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const APP_URL = process.env.KITCHEN_APP_URL || 'http://127.0.0.1:5173/';
const OUT_DIR = path.resolve(__dirname, '..', 'tmp-visual-qa');

const views = [
  'Top View (Plan)',
  'Front View (Looking North)',
  'East Wall View + Cabinets',
  'West Wall View + Cabinets',
  'North Elevation',
  'South Elevation',
  'Create 3D Render',
];

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 900 },
];

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function clickButtonByText(page, label) {
  await page.evaluate((buttonLabel) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.innerText.trim() === buttonLabel,
    );
    if (!button) throw new Error(`Missing button: ${buttonLabel}`);
    button.click();
  }, label);
}

async function hasNonBlankCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return false;
    const context = canvas.getContext('2d');
    if (!context) return true;
    const { width, height } = canvas;
    const sample = context.getImageData(
      Math.floor(width * 0.25),
      Math.floor(height * 0.25),
      Math.max(1, Math.floor(width * 0.5)),
      Math.max(1, Math.floor(height * 0.5)),
    ).data;
    for (let i = 3; i < sample.length; i += 4) {
      if (sample[i] !== 0) return true;
    }
    return false;
  });
}

(async () => {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const failures = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });

    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) {
        if (message.text().includes('GPU stall due to ReadPixels')) return;
        failures.push(`${viewport.name} console ${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => {
      failures.push(`${viewport.name} page error: ${error.message}`);
    });

    await page.goto(APP_URL, { waitUntil: 'networkidle' });

    for (const view of views) {
      await clickButtonByText(page, view);
      await page.waitForTimeout(view.includes('3D') ? 1500 : 400);
      await page.evaluate(() => window.scrollTo(0, 0));

      if (view.includes('3D') && !(await hasNonBlankCanvas(page))) {
        failures.push(`${viewport.name} 3D canvas appears blank`);
      }

      const filePath = path.join(OUT_DIR, `${viewport.name}-${slug(view)}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(path.relative(path.resolve(__dirname, '..'), filePath));
    }

    await page.close();
  }

  await browser.close();

  if (failures.length) {
    console.error('\nVisual QA failures:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
