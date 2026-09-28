// Kept free of Playwright imports so capability/CLI behavior can be unit tested.
const DEFAULT_URL = 'http://127.0.0.1:5173';

function parseArgs(argv) {
  const options = {url: process.env.KITCHEN_APP_URL || DEFAULT_URL, screenshot: null, strict: false};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--strict') { options.strict = true; continue; }
    if (arg === '--help' || arg === '-h') { options.help = true; continue; }
    const key = ['url', 'screenshot'].find(name => arg === `--${name}` || arg.startsWith(`--${name}=`));
    if (!key) throw new Error(`Unknown argument: ${arg}`);
    const value = arg.includes('=') ? arg.slice(arg.indexOf('=') + 1) : argv[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    options[key] = value;
  }
  let url;
  try { url = new URL(options.url); } catch { throw new Error('Invalid --url'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('--url must use HTTP or HTTPS');
  return options;
}

async function openKitchen(page, url) {
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 30000});
  if (!(await page.evaluate(() => Boolean(window.kitchenAPI)))) {
    await page.getByRole('button', {name: 'Open Kitchen', exact: true}).first().click({timeout: 30000, noWaitAfter: true});
  }
  // Room switching is a React state change, not a document navigation.
  // Wait for its actual API; cold software-WebGL initialization can be expensive.
  await page.waitForFunction(() => Boolean(window.kitchenAPI), null, {timeout: 60000});
}

// This function is serialized into the page by Playwright; keep it self-contained.
function readKitchenState() {
  const api = window.kitchenAPI;
  const required = ['getLayout', 'validate', 'getDimensions'];
  const optional = ['getValidationRows', 'getMaterials', 'getModules', 'getGrid', 'getWalkway'];
  const capabilities = {required, unavailable: []};
  const values = {};
  for (const name of [...required, ...optional]) {
    if (!api || typeof api[name] !== 'function') {
      if (required.includes(name)) throw new Error(`Missing kitchenAPI.${name}`);
      capabilities.unavailable.push(name);
      continue;
    }
    try { values[name] = api[name](); }
    catch (error) { throw new Error(`kitchenAPI.${name} failed: ${String(error)}`); }
  }
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isObject(values.getLayout) || !Array.isArray(values.getLayout.east) || !Array.isArray(values.getLayout.west)) {
    throw new Error('Malformed getLayout result: east/west arrays required');
  }
  if (!isObject(values.getDimensions)) throw new Error('Malformed getDimensions result');
  if (!isObject(values.validate) || typeof values.validate.all !== 'boolean') {
    throw new Error('Malformed validate result: boolean all required');
  }
  const rows = values.getValidationRows ?? values.validate.rows ?? values.validate.detailed ?? [];
  if (!Array.isArray(rows) || rows.some(row => !isObject(row) || !['pass', 'fail'].includes(row.status))) {
    throw new Error('Malformed validation rows');
  }
  const layout = values.getLayout;
  return {
    capabilities,
    validation: {...values.validate, rows, passing: rows.filter(row => row.status === 'pass').length, total: rows.length},
    materials: values.getMaterials ?? layout.materials ?? null,
    layout: {eastItems: layout.east.length, westItems: layout.west.length, rule: layout.rule, viewOptions: layout.viewOptions},
    dimensions: values.getDimensions,
    modules: values.getModules ?? layout.modules ?? null,
    grid: values.getGrid ?? layout.grid ?? null,
    walkway: values.getWalkway ?? layout.walkway ?? null,
  };
}

function strictFailure(summary) {
  return !summary || summary.validation?.all !== true ||
    !Array.isArray(summary.validation.rows) || summary.validation.rows.some(row => row?.status !== 'pass');
}

async function hasNonBlankCanvas(page) {
  const canvas = page.locator('canvas').first();
  if (!(await canvas.count())) return false;
  // Capture the WebGL pixels through the browser, not canvas.getContext('2d').
  const png = await canvas.screenshot({timeout: 15000});
  return page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = 48; probe.height = 48;
    const ctx = probe.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(image, 0, 0, 48, 48);
    const pixels = ctx.getImageData(0, 0, 48, 48).data;
    for (let i = 4; i < pixels.length; i += 4) {
      if (Math.abs(pixels[i] - pixels[0]) + Math.abs(pixels[i + 1] - pixels[1]) +
          Math.abs(pixels[i + 2] - pixels[2]) > 12) return true;
    }
    return false;
  }, png.toString('base64'));
}

module.exports = {parseArgs, openKitchen, readKitchenState, strictFailure, hasNonBlankCanvas};
