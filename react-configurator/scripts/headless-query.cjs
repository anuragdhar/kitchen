const fs = require('node:fs');
const path = require('node:path');
const {parseArgs, openKitchen, readKitchenState, strictFailure} = require('./browser-helpers.cjs');

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run inspect -- [--url URL] [--screenshot PATH] [--strict]');
    console.log('--strict exits with status 1 if the app reports validation failures.');
    return;
  }
  const {chromium} = require('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await openKitchen(page, options.url);
    const summary = await page.evaluate(readKitchenState);
    if (options.screenshot) {
      const screenshotPath = path.resolve(process.cwd(), options.screenshot);
      fs.mkdirSync(path.dirname(screenshotPath), {recursive: true});
      await page.screenshot({path: screenshotPath, fullPage: true});
      summary.screenshot = screenshotPath;
    }
    console.log(JSON.stringify({url: options.url, ...summary, runtimeErrors}, null, 2));
    if (runtimeErrors.length || (options.strict && strictFailure(summary))) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
