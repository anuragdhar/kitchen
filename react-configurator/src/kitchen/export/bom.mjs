// Extracted verbatim from App.jsx's buildBOM()/buildBOMCsv()/buildBOMMarkdown()
// (see docs/REFACTOR_PLAN.md Phase 4). Pure builders: same inputs always
// produce the same bill-of-materials data/CSV/Markdown.
import {mirrorSplashbackRectangles} from '../../domain/mirrorSplashback.mjs'

// ctx: {KITCHEN, eastRunLength, westRunLength, BACKSPLASH_HEIGHT, eastModules,
//       westModules, activeEast, activeWest, isCabinetLikeItem, planLabel}
export function buildBOM(ctx) {
  const {KITCHEN, eastRunLength, westRunLength, BACKSPLASH_HEIGHT, eastModules, westModules, activeEast, activeWest, isCabinetLikeItem, planLabel} = ctx
  const eastLen=eastRunLength
  const westLen=westRunLength
  const counterLenMm=eastLen+westLen
  const counterLenM=(counterLenMm/1000).toFixed(2)
  const backsplashAreaM2=((counterLenMm* BACKSPLASH_HEIGHT)/1e6).toFixed(2)
  const mirrorPanels=mirrorSplashbackRectangles({east:activeEast,west:activeWest},undefined,KITCHEN)
  const mirrorAreaM2=(mirrorPanels.reduce((area,p)=>area+p.w*p.h,0)/1e6).toFixed(2)
  const baseCount=eastModules.length + westModules.length
  const wallLowerCount=Math.ceil(eastLen/900)+Math.ceil(westLen/900) // approx
  const wallTopCount=wallLowerCount
  const shutterCount=baseCount + wallLowerCount + wallTopCount
  const drawerCount=eastModules.reduce((a,m)=>a+(m.drawers||0),0)+westModules.reduce((a,m)=>a+(m.drawers||0),0)
  const handleCount=0
  const appliances=[
    ...activeEast.map(it=>({...it,wall:'east'})),
    ...activeWest.map(it=>({...it,wall:'west'})),
  ].filter(isCabinetLikeItem).map(it=>({id:it.id,label:planLabel(it.id), wall:it.wall, y:it.y, w:it.w, d:it.d}))
  return { baseCount, wallLowerCount, wallTopCount, shutterCount, drawerCount, handleCount, counterLenMm, counterLenM, backsplashAreaM2, mirrorPanels, mirrorAreaM2, appliances, eastModules, westModules, notes: [`Door clear zone y0-y${KITCHEN.westGap.to}`, 'Window-only 300 mm below-sill reference', `Shaft y${KITCHEN.shaft.y} NW`, 'East 4in backsplash slider storage', 'West 6in slider storage', 'Window north 1100W', 'Proposed bronze mirror is a finish within the gross backsplash area; do not add it to the tile area. Slider hardware, glass specification and cut-outs need fabricator review.'] }
}

// ctx: {bom, eastTopUpperDepth, westTopUpperDepth, COUNTER_THICKNESS, BACKSPLASH_HEIGHT, planLabel}
export function buildBOMCsv(ctx) {
  const {bom: b, eastTopUpperDepth, westTopUpperDepth, COUNTER_THICKNESS, BACKSPLASH_HEIGHT, planLabel} = ctx
  const rows=[]
  rows.push(['Item','Quantity','Dimensions','Notes'])
  rows.push(['Base cabinets', b.baseCount, `${b.eastModules.map(m=>m.width).join('+')} / ${b.westModules.map(m=>m.width).join('+')}`, 'East 600D + West 600D'])
  rows.push(['Wall lower upper (320D)', b.wallLowerCount, '320D', 'Above counter'])
  rows.push([`Wall top upper (${eastTopUpperDepth}D/${westTopUpperDepth}D)`, b.wallTopCount, `${eastTopUpperDepth}D East / ${westTopUpperDepth}D West`, 'Top'])
  rows.push(['Shutters', b.shutterCount, '', ''])
  rows.push(['Drawers', b.drawerCount, '', ''])
  rows.push(['Handles', b.handleCount, 'Handleless fronts', 'No exposed pull handles'])
  rows.push(['Countertop length', '1', `${b.counterLenMm} mm (${b.counterLenM} m)`, `${COUNTER_THICKNESS}mm thick`])
  rows.push(['Backsplash area', '1', `${b.backsplashAreaM2} m2`, `${BACKSPLASH_HEIGHT}mm high`])
  ;(b.mirrorPanels||[]).forEach(p=>rows.push([`Proposed bronze mirror ${p.wall} ${p.applianceId}`,1,`${p.w}x${p.h} mm y${p.y} z${p.z}`,p.mounting]))
  b.appliances.forEach(a=> rows.push([`Appliance ${a.id}`,1,`${a.w}x${a.d} y${a.y} ${a.wall}`, planLabel(a.id)]))
  b.notes.forEach(n=> rows.push(['Note','','',n]))
  return rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
}

// ctx: {bom, KITCHEN, COUNTER_THICKNESS, BACKSPLASH_HEIGHT, eastRunLength, westRunLength, eastTopUpperDepth, westTopUpperDepth, renderMaterials}
export function buildBOMMarkdown(ctx) {
  const {bom: b, KITCHEN, COUNTER_THICKNESS, BACKSPLASH_HEIGHT, eastRunLength, westRunLength, eastTopUpperDepth, westTopUpperDepth, renderMaterials} = ctx
  let md=`# Kitchen BOM - Galley ${KITCHEN.width}x${KITCHEN.length} Current Configuration\n\n`
  md+=`* Countertop length: ${b.counterLenMm} mm (${b.counterLenM} m) x 600D/600D, thickness ${COUNTER_THICKNESS}mm\n`
  md+=`* Backsplash area: ${b.backsplashAreaM2} m2 (height ${BACKSPLASH_HEIGHT}mm)\n`
  ;(b.mirrorPanels||[]).forEach(p=>md+=`* Proposed bronze mirror ${p.wall} / ${p.applianceId}: ${p.w} x ${p.h} mm, y${p.y}, z${p.z}, ${p.mounting}\n`)
  md+=`* Base cabinets: ${b.baseCount} (East ${b.eastModules.length} + West ${b.westModules.length})\n`
  md+=`* Wall lower (320D): ${b.wallLowerCount}\n* Wall top (${eastTopUpperDepth}D/${westTopUpperDepth}D): ${b.wallTopCount}\n* Shutters: ${b.shutterCount}\n* Drawers: ${b.drawerCount}\n* Handles: ${b.handleCount} (handleless fronts)\n\n`
  md+=`## Cabinet Modules East (600D run ${eastRunLength}mm)\n| # | Width mm | Type |\n|---|---|---|\n`
  b.eastModules.forEach((m,i)=> md+=`| ${i+1} | ${m.width} | ${m.type} |\n`)
  md+=`\n## Cabinet Modules West (${KITCHEN.westCounterDepth||600}D run ${westRunLength}mm)\n| # | Width mm | Type |\n|---|---|---|\n`
  b.westModules.forEach((m,i)=> md+=`| ${i+1} | ${m.width} | ${m.type} |\n`)
  md+=`\n## Appliances\n| Wall | ID | Y mm | Size |\n|---|---|---|---|\n`
  b.appliances.forEach(a=> md+=`| ${a.wall} | ${a.id} | ${a.y} | ${a.w}x${a.d} |\n`)
  md+=`\n## Notes\n`
  b.notes.forEach(n=> md+=`- ${n}\n`)
  md+=`\n## Materials\n- Cabinet body ${renderMaterials.cabinetBody}\n- Shutters ${renderMaterials.shutters}\n- Counter ${renderMaterials.counter}\n- Backsplash ${renderMaterials.backsplash}\n- Floor ${renderMaterials.floor}\n- Wall ${renderMaterials.wall}\n- Handle style: handleless\n`
  return md
}
