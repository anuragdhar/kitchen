from pathlib import Path
import json
p=Path('react-configurator/src/App.jsx')
s=p.read_text()
a="const [view,setView]=useState('three')"
assert s.count(a)==1
s="import {getInitialKitchenView} from './app/kitchenNavigation.mjs'\n"+s
s=s.replace(a,"const [view,setView]=useState(()=>getInitialKitchenView(typeof window==='undefined'?'':window.location.search))")
p.write_text(s)
p=Path('react-configurator/package.json');pkg=json.loads(p.read_text())
pkg['scripts']['test'] += ' tests/kitchen-navigation.test.mjs'
p.write_text(json.dumps(pkg,indent=2)+'\n')
p=Path('react-configurator/scripts/correctness-browser.cjs');s=p.read_text()
s=s.replace("  const url = process.env.KITCHEN_APP_URL || 'http://127.0.0.1:4175';", "  const target = new URL(process.env.KITCHEN_APP_URL || 'http://127.0.0.1:4175');\n  target.searchParams.set('kitchenView', 'top');\n  const url = target.href;")
s=s.replace("    assert.equal(failed.api.rows.find(row => row.id === 'sink-storage').status, 'fail');", "    assert.equal(failed.api.rows.find(row => row.id === 'sink-storage').status, 'fail');\n    await page.getByText('Invalid East:OK West:OK', {exact: true}).waitFor({state: 'visible'});\n    const rackLabel = page.getByText('Over-sink storage aligns with sink', {exact: true});\n    assert.match(await rackLabel.locator('..').innerText(), /FAIL/);")
s=s.replace("    await page.screenshot({path: path.join(out, 'kitchen.png'), fullPage: true});", "    await page.screenshot({path: path.join(out, 'kitchen.png'), fullPage: true});\n    await page.setViewportSize({width: 390, height: 900});\n    await page.screenshot({path: path.join(out, 'kitchen-mobile.png'), fullPage: true});")
p.write_text(s)
p=Path('docs/TESTING.md');s=p.read_text();s+='''\nThe correctness browser suite uses the actual application with `?kitchenView=top`.\nThis optional view preference leaves normal startup in 3D and never changes layout\nor saved data. The suite verifies plan/API/export behavior, not WebGL performance.\nDefault headless 3D startup exceeded a 60-second API wait on the initial runner;\n3D startup/performance and visual comparison remain separate follow-up work.\n''';p.write_text(s)
