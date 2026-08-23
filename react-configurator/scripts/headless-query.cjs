const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DEFAULT_URL = 'http://127.0.0.1:5173';

function parseArgs(argv) {
  const options = { url: process.env.KITCHEN_APP_URL || DEFAULT_URL, screenshot: null };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--url') {
      options.url = argv[++i];
    } else if (arg.startsWith('--url=')) {
      options.url = arg.slice('--url='.length);
    } else if (arg === '--screenshot') {
      options.screenshot = argv[++i];
    } else if (arg.startsWith('--screenshot=')) {
      options.screenshot = arg.slice('--screenshot='.length);
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.url) throw new Error('Missing value for --url');
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/headless-query.cjs [--url URL] [--screenshot PATH]

Options:
  --url URL            App URL to inspect. Defaults to ${DEFAULT_URL}
  --screenshot PATH    Optional screenshot output path
  -h, --help           Show this help`);
}

function resolveScreenshotPath(filePath) {
  if (!filePath) return null;
  return path.resolve(process.cwd(), filePath);
}

async function collectSummary(page) {
  return page.evaluate(() => {
    const api = window.kitchenAPI;
    const call = (name) => {
      if (!api || typeof api[name] !== 'function') return undefined;
      try {
        return api[name]();
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    };

    const layout = call('getLayout') || {};
    const validation = call('validate') || layout.validation || {};
    const validationRows = call('getValidationRows') || validation.rows || validation.detailed || [];
    const materials = call('getMaterials') || layout.materials || {};
    const modules = call('getModules') || layout.modules || {};
    const dimensions = call('getDimensions') || layout.dimensions || layout.kitchen || {};
    const grid = call('getGrid') ?? layout.grid;
    const walkway = call('getWalkway') || layout.walkway;

    const rows = Array.isArray(validationRows) ? validationRows : [];
    const passing = rows.filter((row) => row && row.status === 'pass').length;

    return {
      validation: {
        all: Boolean(validation.all),
        eastOk: validation.eastOk,
        westOk: validation.westOk,
        passing: rows.length ? passing : validation.passing,
        total: rows.length || validation.total,
        rows,
      },
      materials,
      layout: {
        eastItems: Array.isArray(layout.east) ? layout.east.length : undefined,
        westItems: Array.isArray(layout.west) ? layout.west.length : undefined,
        rule: layout.rule,
        viewOptions: layout.viewOptions,
      },
      dimensions,
      modules,
      grid,
      walkway,
    };
  });
}

(async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  try {
    await page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.kitchenAPI), null, { timeout: 15000 });

    const summary = await collectSummary(page);
    const screenshotPath = resolveScreenshotPath(options.screenshot);

    if (screenshotPath) {
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      summary.screenshot = screenshotPath;
    }

    console.log(JSON.stringify({ url: options.url, ...summary }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
