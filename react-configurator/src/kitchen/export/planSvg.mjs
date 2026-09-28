// Extracted verbatim from App.jsx's buildPlanSvg()/svgY() (see docs/REFACTOR_PLAN.md
// Phase 4). Pure string builder: same inputs always produce the same SVG text.
// KITCHEN.length/width/etc, `grid`, and the module lists are read-only here.

export const svgY = (KITCHEN, southY, depth) => KITCHEN.length - southY - depth

// ctx: {KITCHEN, materials, grid, planDimensions, activeEast, activeWest,
//       eastModules, westModules, moduleSegmentsFromNorth, renderStyle}
export function buildPlanSvg(ctx) {
  const {KITCHEN, materials, grid, planDimensions, activeEast, activeWest, eastModules, westModules, moduleSegmentsFromNorth, renderStyle} = ctx
  const svgYLocal = (southY, depth) => svgY(KITCHEN, southY, depth)
  const esc=(s)=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))
  const rect=(x,y,w,h,fill,stroke='#111',dash='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="8"${dash?` stroke-dasharray="${dash}"`:''}/>`
  const label=(x,y,text,size=80,fill='#111')=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size}" font-weight="700" fill="${fill}">${esc(text)}</text>`
  const dimLineH=(x1,x2,y,lab)=>{const mx=(x1+x2)/2; return `<g stroke="#1a1a1a" stroke-width="6" fill="none"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y-28}" x2="${x1}" y2="${y+28}"/><line x1="${x2}" y1="${y-28}" x2="${x2}" y2="${y+28}"/></g><rect x="${mx-280}" y="${y-52}" width="560" height="36" fill="#fff" stroke="#111" stroke-width="2" rx="6"/><text x="${mx}" y="${y-26}" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#111">${esc(lab)}</text>`}
  const dimLineV=(y1,y2,x,lab)=>{const my=(y1+y2)/2; return `<g stroke="#1a1a1a" stroke-width="6" fill="none"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x-28}" y1="${y1}" x2="${x+28}" y2="${y1}"/><line x1="${x-28}" y1="${y2}" x2="${x+28}" y2="${y2}"/></g><g transform="rotate(-90 ${x} ${my})"><rect x="${my-280}" y="${x-20}" width="560" height="36" fill="#fff" stroke="#111" stroke-width="2" rx="6"/><text x="${my}" y="${x+6}" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#111">${esc(lab)}</text></g>`}
  const usableLen=KITCHEN.length
  const windowBelow=KITCHEN.windowBelow||{x:KITCHEN.window.x,w:KITCHEN.window.w,depth:300}
  const outerPad=220
  const vbX=-outerPad; const vbY=-outerPad; const vbW=KITCHEN.width+outerPad*2; const vbH=KITCHEN.length+outerPad*2
  const {eastDepthMm:eastDepth,westDepthMm:westDepth,walkwayMm:walkway}=planDimensions
  const parts=[
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${KITCHEN.width}mm" height="${KITCHEN.length}mm" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">`,
    `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#f6f2ec"/>`,
    `<rect width="${KITCHEN.width}" height="${KITCHEN.length}" fill="${materials.wall||'#fffefb'}"/>`,
    rect(0,0,KITCHEN.width,KITCHEN.length,'#f7f1e9','#111'),
    rect((KITCHEN.width-KITCHEN.window.w)/2,0,KITCHEN.window.w,100,'#7eb8e8','#111'),
    label(KITCHEN.width/2,78,'NORTH WINDOW',72,'#114f78'),
    rect(KITCHEN.door.x,KITCHEN.length-100,KITCHEN.door.w,100,'#fffefb','#111'),
    label(KITCHEN.door.x+KITCHEN.door.w/2,KITCHEN.length-32,'SOUTH OPENING',72,'#7b3f21'),
    rect(KITCHEN.width-eastDepth,svgYLocal(0,usableLen),eastDepth,usableLen,renderStyle.baseCabinet),
    label(KITCHEN.width-eastDepth/2,svgYLocal(0,usableLen)+180,`EAST ${eastDepth}D RUN`,70),
    rect(0,svgYLocal(KITCHEN.westGap.to,usableLen-KITCHEN.westGap.to),westDepth,usableLen-KITCHEN.westGap.to,renderStyle.baseCabinet),
    label(200,svgYLocal(KITCHEN.westGap.to,usableLen-KITCHEN.westGap.to)+180,`WEST ${westDepth}D RUN`,70),
    rect(0,svgYLocal(0,KITCHEN.westGap.to),westDepth,KITCHEN.westGap.to,'#fffaf3','#7b3f21','45 28'),
    label(210,svgYLocal(0,KITCHEN.westGap.to)+KITCHEN.westGap.to/2,'DOOR CLEAR ZONE',58,'#7b3f21'),
    rect(windowBelow.x,svgYLocal(KITCHEN.length-windowBelow.depth,windowBelow.depth),windowBelow.w,windowBelow.depth,'#eaf6fd','#2f8ac6','45 28'),
    label(windowBelow.x+windowBelow.w/2,svgYLocal(KITCHEN.length-windowBelow.depth,windowBelow.depth)+120,'BELOW WINDOW AREA',54,'#1f5f88')
  ]
  if(grid===50||grid===100){
    for(let x=0;x<=KITCHEN.width;x+=grid) parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${KITCHEN.length}" stroke="#e9dfce" stroke-width="3" stroke-dasharray="10 14"/>`)
    for(let y=0;y<=KITCHEN.length;y+=grid) parts.push(`<line x1="0" y1="${y}" x2="${KITCHEN.width}" y2="${y}" stroke="#e9dfce" stroke-width="3" stroke-dasharray="10 14"/>`)
  }
  // module splits in plan
  moduleSegmentsFromNorth(eastModules,0,usableLen).forEach((m,i)=>{
    const y0=m.y
    const x=KITCHEN.width-eastDepth
    const yy=svgYLocal(y0,m.width)
    // split line at module boundary
    if(i>0) parts.push(`<line x1="${x}" y1="${svgYLocal(y0,0)}" x2="${x+eastDepth}" y2="${svgYLocal(y0,0)}" stroke="#111" stroke-width="4" />`)
    if(m.type==='filler') parts.push(`<rect x="${x}" y="${yy}" width="${eastDepth}" height="${m.width}" fill="none" stroke="#7b3f21" stroke-width="5" stroke-dasharray="18 12"/>`)
  })
  moduleSegmentsFromNorth(westModules,KITCHEN.westGap.to,usableLen).forEach((m,i)=>{
    const y0=m.y
    const x=0
    if(i>0) parts.push(`<line x1="${x}" y1="${svgYLocal(y0,0)}" x2="${x+westDepth}" y2="${svgYLocal(y0,0)}" stroke="#111" stroke-width="4" />`)
    if(m.type==='filler') parts.push(`<rect x="${x}" y="${svgYLocal(y0,m.width)}" width="${westDepth}" height="${m.width}" fill="none" stroke="#7b3f21" stroke-width="5" stroke-dasharray="18 12"/>`)
  })
  activeEast.forEach(it=>{
    const x=KITCHEN.width-it.d, y=svgYLocal(it.y,it.w)
    parts.push(rect(x,y,it.d,it.w,it.color))
    parts.push(label(x+it.d/2,y+it.w/2,`${it.id.toUpperCase()} y${Math.round(it.y/10)}cm`,64,['gas'].includes(it.id)?'#fff':'#111'))
  })
  activeWest.forEach(it=>{
    const y=svgYLocal(it.y,it.w)
    parts.push(rect(0,y,it.d,it.w,it.color))
    parts.push(label(it.d/2,y+it.w/2,`${it.id.toUpperCase()} y${Math.round(it.y/10)}cm`,64,['sink','microwave'].includes(it.id)?'#fff':'#111'))
  })
  parts.push(label(KITCHEN.width/2,170,'NORTH (N)',88))
  parts.push(label(KITCHEN.width/2,KITCHEN.length-170,'SOUTH (S)',88))
  parts.push(label(170,KITCHEN.length/2,'WEST (W)',82))
  parts.push(label(KITCHEN.width-170,KITCHEN.length/2,'EAST (E)',82))
  const dimOuterY = -120
  const dimOuterXEast = KITCHEN.width + 120
  const dimOuterXWest = -120
  parts.push(dimLineH(0,KITCHEN.width,dimOuterY,`Room width ${KITCHEN.width} mm`))
  parts.push(dimLineV(0,KITCHEN.length,dimOuterXEast,`Room length ${KITCHEN.length} mm`))
  parts.push(dimLineH(KITCHEN.width-eastDepth,KITCHEN.width, 36,`East ${eastDepth} mm`))
  parts.push(dimLineH(0,westDepth, 36,`West ${westDepth} mm`))
  parts.push(dimLineH(westDepth, KITCHEN.width-eastDepth, KITCHEN.length/2,'Walkway '+walkway+' mm'))
  parts.push(dimLineV(svgYLocal(0,KITCHEN.westGap.to), KITCHEN.length, dimOuterXWest,`Door clear y0-y${KITCHEN.westGap.to} (${KITCHEN.westGap.to} mm)`))
  parts.push(`<rect x="${vbX+10}" y="${vbY+vbH-62}" width="980" height="48" fill="#111" rx="8"/>`)
  parts.push(`<text x="${vbX+22}" y="${vbY+vbH-30}" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#fff">Scale 1:1 mm  |  ${KITCHEN.width}W x ${KITCHEN.length}L x ${KITCHEN.height}H  |  Walkway ${walkway} mm  |  Grid ${grid?grid+' mm':'Off'}  |  East ${eastDepth}D  West ${westDepth}D</text>`)
  parts.push(`</svg>`)
  return parts.join('\n')
}
