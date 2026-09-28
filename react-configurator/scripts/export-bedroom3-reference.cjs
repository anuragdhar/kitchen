const { chromium } = require('playwright');
const path = require('path');
const openVanity = process.argv.includes('--open');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    await page.locator('button').filter({ hasText: 'Whole home 3D' }).first().click();
    await page.getByRole('button', { name: 'Export for Coohom' }).waitFor();
    if (openVanity) await page.getByRole('button', { name: 'Open vanity mirror' }).click();
    const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
    await page.getByRole('button', { name: 'Export for Coohom' }).click();
    const download = await downloadPromise;
    await download.saveAs(path.resolve(__dirname, `../../blender/whole_home/A501-bedroom3-${openVanity ? 'open' : 'closed'}-export.zip`));
    if (errors.length) throw new Error(errors.join('; '));
    console.log('BEDROOM3_EXPORT_READY', download.suggestedFilename());
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
