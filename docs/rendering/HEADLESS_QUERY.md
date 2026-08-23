# Headless Kitchen Query

Use `react-configurator/scripts/headless-query.cjs` to inspect a running Kitchen Configurator instance without keeping a visible browser tab open.

The script uses Playwright Chromium in headless mode, waits for `window.kitchenAPI`, then prints a compact JSON summary with layout, materials, validation, dimensions, modules, and view options when available.

## Prerequisites

Install project dependencies first:

```powershell
cd C:\source\Github\kitchen\react-configurator
npm install
```

Start the app separately before running the query:

```powershell
cd C:\source\Github\kitchen\react-configurator
npm run dev
```

## Basic Usage

From `react-configurator`:

```powershell
node scripts/headless-query.cjs
```

By default it loads:

```text
http://127.0.0.1:5173
```

Use a different URL:

```powershell
node scripts/headless-query.cjs --url http://127.0.0.1:5174
```

Capture a screenshot:

```powershell
node scripts/headless-query.cjs --screenshot tmp-visual-qa/headless-query.png
```

Use both options:

```powershell
node scripts/headless-query.cjs --url http://127.0.0.1:5173 --screenshot tmp-visual-qa/headless-query.png
```

## Output Shape

The script prints JSON similar to:

```json
{
  "url": "http://127.0.0.1:5173",
  "validation": {
    "all": true,
    "passing": 7,
    "total": 7
  },
  "materials": {
    "cabinetBody": "#efe9df",
    "shutters": "#b99673",
    "counter": "#e7ded2"
  },
  "layout": {
    "eastItems": 5,
    "westItems": 4
  }
}
```

Exact fields depend on the current `window.kitchenAPI` methods exposed by the app.

## Notes

- This script does not start Vite.
- It does not modify app state.
- It exits non-zero if the page fails to load, `window.kitchenAPI` is unavailable, or screenshot capture fails.
