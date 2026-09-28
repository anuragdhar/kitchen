"""One-shot, hash-guarded source edit, used only on the preparation branch."""
from pathlib import Path
import hashlib
import json

p = Path('react-configurator/src/App.jsx')
b = p.read_bytes()
blob = hashlib.sha1(f'blob {len(b)}\0'.encode() + b).hexdigest()
assert blob == '938be207118a9839d50dd7cd6408178dadab6c51', f'Unexpected App.jsx baseline: {blob}'
s = b.decode('utf-8')

def replace(old, new, count=1):
    global s
    assert s.count(old) == count, f'Expected {count} occurrences of {old[:100]!r}, got {s.count(old)}'
    s = s.replace(old, new)

s = "import {buildKitchenValidationRows, summarizeValidation, getPlanDimensions} from './domain/kitchenValidation.mjs'\nimport {EAST_BASE_DEPTH} from './config/kitchenConfig.js'\n" + s
replace('  const walkwayFloor = KITCHEN.width - 600 - 600',
        '  const planDimensions = getPlanDimensions(KITCHEN,EAST_BASE_DEPTH,KITCHEN.westCounterDepth)\n  const walkwayFloor = planDimensions.walkwayMm')
start = s.index('  // detailed validation\n')
end = s.index('  useEffect(()=>{', start)
s = s[:start] + '''  // Shared executable rules; all required rows contribute to overall validity.
  const validationRows=useMemo(()=>buildKitchenValidationRows({
    east,west,kitchen:KITCHEN,eastDepthMm:EAST_BASE_DEPTH,northHobOptionY:NORTH_HOB_OPTION_Y_MM
  }),[east,west])
  const vSimple=useMemo(()=>summarizeValidation(validationRows),[validationRows])
''' + s[end:]
replace('eastBaseDepth:600', 'eastBaseDepth:planDimensions.eastDepthMm', 2)
replace('westCounterDepth:KITCHEN.westCounterDepth||600', 'westCounterDepth:planDimensions.westDepthMm', 2)
replace('  useEffect(()=>{window.kitchenAPI={', '  useEffect(()=>{const api={')
replace('    getBOM:()=>buildBOM(),', '''    getBOM:()=>buildBOM(),
    getPlanSvg:()=>buildPlanSvg(), getPlanDxf:()=>buildPlanDxf(),
    getProjectData:()=>buildProjectData(),''')
replace('  }},[east,west,grid,materials,eastModules,westModules,eastTopUpperDepth,westTopUpperDepth,validationRows,vSimple,hide3DObstructions])',
        '  }; window.kitchenAPI=api; return()=>{if(window.kitchenAPI===api)delete window.kitchenAPI}},[east,west,grid,materials,eastModules,westModules,eastTopUpperDepth,westTopUpperDepth,validationRows,vSimple,hide3DObstructions])')

# Limit replacements to the two plan exporters; do not touch authored 3D geometry.
start = s.index('  const buildPlanSvg=()=>{')
end = s.index('  const exportPlanSvg=', start)
svg = s[start:end]
assert svg.count('const walkway= KITCHEN.width-600-400') == 1
svg = svg.replace('const walkway= KITCHEN.width-600-400',
    'const {eastDepthMm:eastDepth,westDepthMm:westDepth,walkwayMm:walkway}=planDimensions')
for old, new in [
    ('KITCHEN.width-600', 'KITCHEN.width-eastDepth'),
    ('KITCHEN.width-300', 'KITCHEN.width-eastDepth/2'),
    ('600,usableLen,renderStyle.baseCabinet', 'eastDepth,usableLen,renderStyle.baseCabinet'),
    ("'EAST 600D RUN'", '`EAST ${eastDepth}D RUN`'),
    ('),600,usableLen-KITCHEN.westGap.to,renderStyle.baseCabinet', '),westDepth,usableLen-KITCHEN.westGap.to,renderStyle.baseCabinet'),
    ("'WEST 600D RUN'", '`WEST ${westDepth}D RUN`'),
    ("),600,KITCHEN.westGap.to,'#fffaf3'", "),westDepth,KITCHEN.westGap.to,'#fffaf3'"),
    ('x+600', 'x+eastDepth'), ('x+400', 'x+westDepth'),
    ('width="600" height="${m.width}"', 'width="${eastDepth}" height="${m.width}"'),
    ('width="400" height="${m.width}"', 'width="${westDepth}" height="${m.width}"'),
    ("'Room width 2324 mm'", '`Room width ${KITCHEN.width} mm`'),
    ("36,'East 600 mm'", '36,`East ${eastDepth} mm`'),
    ("dimLineH(0,600, 36,'West 600 mm')", 'dimLineH(0,westDepth, 36,`West ${westDepth} mm`)'),
    ('dimLineH(600, KITCHEN.width-eastDepth', 'dimLineH(westDepth, KITCHEN.width-eastDepth'),
    ('East 600D  West 600D', 'East ${eastDepth}D  West ${westDepth}D'),
]:
    assert old in svg, f'SVG anchor missing: {old}'
    svg = svg.replace(old, new)
s = s[:start] + svg + s[end:]
start = s.index('  const buildPlanDxf=()=>{')
end = s.index('  const exportPlanDxf=', start)
dxf = s[start:end]
for old, new in [
    ('const usableLen=KITCHEN.length', 'const usableLen=KITCHEN.length\n    const {eastDepthMm:eastDepth,westDepthMm:westDepth,walkwayMm:walkway}=planDimensions'),
    ('    const walkway= KITCHEN.width-600-400\n', ''),
    ('KITCHEN.width-600', 'KITCHEN.width-eastDepth'),
    ('KITCHEN.width-300', 'KITCHEN.width-eastDepth/2'),
    ("0,600,usableLen,'EAST_CABINETS'", "0,eastDepth,usableLen,'EAST_CABINETS'"),
    (',400,', ',westDepth,'), ('addLine(400,', 'addLine(westDepth,'),
    ("'Room width 2324 mm'", '`Room width ${KITCHEN.width} mm`'),
    ("'East base depth 600 mm'", '`East base depth ${eastDepth} mm`'),
    ("'West counter depth 400 mm'", '`West counter depth ${westDepth} mm`'),
    ('East 600D West 600D', 'East ${eastDepth}D West ${westDepth}D'),
]:
    assert old in dxf, f'DXF anchor missing: {old}'
    dxf = dxf.replace(old, new)
s = s[:start] + dxf + s[end:]
p.write_bytes(s.encode('utf-8'))

p = Path('react-configurator/package.json')
pkg = json.loads(p.read_text())
pkg['scripts']['test'] += ' tests/kitchen-validation.test.mjs tests/current-validation.test.mjs'
pkg['scripts']['test:browser'] = 'node scripts/correctness-browser.cjs'
p.write_text(json.dumps(pkg, indent=2) + '\n')

p = Path('docs/CURRENT_STATE.md')
s = p.read_text()
start = s.index('- App.jsx still owns its legacy validation')
end = s.index('\nA follow-up export/state unification', start)
s = s[:start] + '''- Runtime validation now lives in src/domain/kitchenValidation.mjs. UI, browser API
  and exported validation share the same required-row aggregation. Nominal floor
  aisle, fixed-object bounds/clearances, and all-pair 3D collisions are checked.
  Backing slider panels and electrical markers are excluded from collisions;
  the legacy hob collider is retained. No door-swing or installation checks exist.
- SVG and DXF plan depths and dimension labels now use the same nominal base-run
  measurements as the UI (600/600, aisle 1124 mm for the implemented baseline).
  These fixes do not unify all export metadata or change save/load migrations.
''' + s[end:]
p.write_text(s)
p = Path('docs/ARCHITECTURE.md')
s = p.read_text().replace('| Kitchen state, persistence, validation and views | src/App.jsx |',
    '| Kitchen state, persistence and views | src/App.jsx |\n| Runtime validation and nominal plan measurements | src/domain/kitchenValidation.mjs |')
start = s.index('The app has NOT yet been migrated')
end = s.index('\n## Refactoring sequence', start)
s = s[:start] + '''The runtime validator now composes these basic checks with the existing saved-
variant order rules and all-pair AABB collision checks. summarizeValidation requires
all eight rule IDs and every row to pass. App.jsx uses that same result for its
panel, browser API and exported validation. See kitchenValidation.mjs for the
explicit backing-panel/electrical exclusions and legacy hob collision envelope.
getPlanDimensions supplies the nominal run measurements to the UI and both plan
exporters. Broader export-state normalization and migrations are still separate.
''' + s[end:]
p.write_text(s)
p = Path('docs/TESTING.md')
s = p.read_text().replace('No dependency versions are changed by this foundation update.',
    'The lockfile includes the previously omitted dxf-viewer dependency tree; existing locked package versions are preserved.')
s = s.replace('A passing browser validator is only as complete as the legacy app validator. In\nparticular the existing unconditional walkway pass is documented in CURRENT_STATE.md.',
    'The runtime validator checks every required row. A pass is not a door-swing,\nappliance-service or construction-safety assessment. See CURRENT_STATE.md for scope.')
s += '''\n## Validation/export regression checks\n\n`npm test` also covers overall-rule aggregation, non-neighbor and cross-wall 3D\ncollisions, fixed-object bounds/clearance, nominal aisle failures, and baseline/airy\nvariants with baseline/refined east cabinets. `npm run test:browser` starts its own\nVite server on loopback port 4175 unless KITCHEN_APP_URL is supplied. Install Chromium\nfirst. It checks live API/panel/project agreement, SVG/DXF geometry and labels,\nmaterial-only geometry preservation, and API cleanup on room navigation. Browser\noutputs go to test-results/correctness; screenshots are evidence, not approved baselines.\n\nThe read-only getPlanSvg(), getPlanDxf(), and getProjectData() browser API methods\ncall the same builders as the existing exports. Saving/migration formats are unchanged.\n'''
p.write_text(s)
print('Applied guarded App.jsx, scripts and documentation changes.')
