// Extracted verbatim from App.jsx's inline NorthSouthElevation component (see
// docs/REFACTOR_PLAN.md Phase 4). KITCHEN/PLINTH_HEIGHT/HEIGHT_GUIDES/
// COUNTER_THICKNESS are the same module-level singletons App.jsx itself
// imports, so they're imported here directly; everything derived from
// component state (materials, the derived renderStyle, the height-guide
// toggle, and planDimensions) is a prop.
import React from 'react'
import {KITCHEN, PLINTH_HEIGHT, COUNTER_THICKNESS} from '../config/kitchenConfig.js'
import {HEIGHT_GUIDES} from '../config/renderConfig.js'

export default function NorthSouthElevation({isNorth, planDimensions, showHeightGuides, materials, renderStyle}) {
  const frame={x:72,y:52,w:1060,h:560}
  // Was hardcoded 2324/2700 (KITCHEN.width/height); see docs/REFACTOR_PLAN.md Phase 4.
  const xOf=(x)=>frame.x+(x/KITCHEN.width)*frame.w
  const yOf=(z)=>frame.y+frame.h-(z/KITCHEN.height)*frame.h
  const wOf=(w)=>Math.max(24,(w/KITCHEN.width)*frame.w)
  const hOf=(h)=>Math.max(18,(h/KITCHEN.height)*frame.h)
  const eastX=KITCHEN.width-planDimensions.eastDepthMm, westX=0
  const heightGuideOverlay=()=>{
    if(!showHeightGuides) return null
    const guideX=xOf(isNorth?585:1740)
    const labelX=guideX+(isNorth?-34:34)
    const textAnchor=isNorth?'end':'start'
    return (
      <g pointerEvents="none">
        {[0,PLINTH_HEIGHT,900,1350,1850,KITCHEN.height].map(z=>(
          <line key={`ns-level-${z}`} x1={frame.x} y1={yOf(z)} x2={frame.x+frame.w} y2={yOf(z)} stroke="#4f46e5" strokeWidth="1.2" strokeDasharray="9 8" opacity="0.42"/>
        ))}
        <line x1={guideX} y1={yOf(0)} x2={guideX} y2={yOf(KITCHEN.height)} stroke="#c7d2fe" strokeWidth="10" opacity="0.34" filter="url(#nsHeightGlow)"/>
        {HEIGHT_GUIDES.map(g=>{
          const yTop=yOf(g.to)
          const yBottom=yOf(g.from)
          const mid=(yTop+yBottom)/2
          return (
            <g key={`ns-${g.id}`}>
              <line x1={guideX} y1={yTop+4} x2={guideX} y2={yBottom-4} stroke="#5b5bf7" strokeWidth="5" strokeLinecap="round" filter="url(#nsHeightGlow)"/>
              <circle cx={guideX} cy={yTop+4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
              <circle cx={guideX} cy={yBottom-4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
              <text x={labelX} y={mid-5} textAnchor={textAnchor} fontSize="18" fontWeight="900" fill="#ffffff" stroke="#312e81" strokeWidth="4" paintOrder="stroke">{Math.round((g.to-g.from)/10)} cm</text>
              <text x={labelX} y={mid+15} textAnchor={textAnchor} fontSize="10" fontWeight="900" fill="#312e81">{g.label}</text>
            </g>
          )
        })}
        <text x={labelX} y={yOf(900)-10} textAnchor={textAnchor} fontSize="10" fontWeight="900" fill="#312e81">counter 90 cm</text>
      </g>
    )
  }
  return (<svg width="1180" height="560" viewBox="0 0 1180 620" style={{background:'#fffefb',border:'1px solid #ddd4c8',width:'100%',height:'auto',display:'block'}}>
    <defs>
      <filter id="nsHeightGlow" x="-80%" y="-20%" width="260%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill="#faf6f1" stroke="#111" strokeWidth="2"/>
    <text x={frame.x} y="31" fontSize="22" fontWeight="900">{isNorth?'North Elevation (looking South)':'South Elevation (looking North)'}</text>
    <text x={frame.x+frame.w} y="31" textAnchor="end" fontSize="13" fontWeight="700" fill="#61584f">{isNorth?'East (E) right / West (W) left - Window 1100W':`East (E) left / West (W) right - Opening ${KITCHEN.door.w}W`}</text>
    {/* wall baseline */}
    <line x1={frame.x} y1={yOf(0)} x2={frame.x+frame.w} y2={yOf(0)} stroke="#111" strokeWidth="4"/>
    {/* floor */}
    <rect x={frame.x} y={yOf(0)} width={frame.w} height={hOf(30)} fill={materials.floor||'#ded6cc'} stroke="#111"/>
    {/* east cabinet silhouette */}
    <rect x={xOf(eastX)} y={yOf(900)} width={wOf(600)} height={hOf(900 - PLINTH_HEIGHT)} fill={renderStyle.baseCabinet} stroke="#111"/>
    <rect x={xOf(eastX)} y={yOf(900)} width={wOf(600)} height={hOf(COUNTER_THICKNESS)} fill={renderStyle.counter} stroke="#7d7165"/>
    <rect x={xOf(eastX)} y={yOf(1350)} width={wOf(320)} height={hOf(500)} fill={renderStyle.middleCabinet} stroke="#111"/>
    <rect x={xOf(eastX+80)} y={yOf(KITCHEN.height)} width={wOf(470)} height={hOf(800)} fill={renderStyle.topCabinet} stroke="#111"/>
    {/* west cabinet silhouette */}
    <rect x={xOf(westX)} y={yOf(900)} width={wOf(400)} height={hOf(900 - PLINTH_HEIGHT)} fill={renderStyle.baseCabinet} stroke="#111"/>
    <rect x={xOf(westX)} y={yOf(900)} width={wOf(400)} height={hOf(COUNTER_THICKNESS)} fill={renderStyle.counter} stroke="#7d7165"/>
    <rect x={xOf(westX)} y={yOf(1350)} width={wOf(320)} height={hOf(500)} fill={renderStyle.middleCabinet} stroke="#111"/>
    <rect x={xOf(westX)} y={yOf(1900)} width={wOf(400)} height={hOf(800)} fill={renderStyle.topCabinet} stroke="#111"/>
    {/* door / window */}
    {isNorth? (
      <g>
        <rect x={xOf(612)} y={yOf(KITCHEN.height)} width={wOf(1100)} height={hOf(1800)} fill="rgba(126,184,232,0.32)" stroke="#2f8ac6" strokeWidth="2"/>
        {/* transom at 610 from head (2'-0") */}
        <line x1={xOf(612)} y1={yOf(KITCHEN.height-610)} x2={xOf(1712)} y2={yOf(KITCHEN.height-610)} stroke="#1a1a18" strokeWidth="3"/>
        {/* centre vertical mullion - 2 partitions */}
        <line x1={xOf(612+550)} y1={yOf(KITCHEN.height)} x2={xOf(612+550)} y2={yOf(900)} stroke="#1a1a18" strokeWidth="2.2"/>
        {/* left-top exhaust fan 300mm - HIGH CONTRAST */}
        <rect x={xOf(612)+8} y={yOf(KITCHEN.height)-10} width={wOf(550)-16} height={hOf(610)-10} fill="#1a1a18" stroke="#111" strokeWidth="1.4"/>
        <rect x={xOf(612)+16} y={yOf(KITCHEN.height)-10+6} width={wOf(550)-32} height={hOf(610)-22} fill="#eaf0f4" stroke="#c8d2db" strokeWidth="1"/>
        {/* louvre lines */}
        <line x1={xOf(612)+20} y1={yOf(KITCHEN.height-120)} x2={xOf(612+550)-20} y2={yOf(KITCHEN.height-120)} stroke="#b8c7d4" strokeWidth="1"/>
        <line x1={xOf(612)+20} y1={yOf(KITCHEN.height-200)} x2={xOf(612+550)-20} y2={yOf(KITCHEN.height-200)} stroke="#b8c7d4" strokeWidth="1"/>
        <line x1={xOf(612)+20} y1={yOf(KITCHEN.height-280)} x2={xOf(612+550)-20} y2={yOf(KITCHEN.height-280)} stroke="#b8c7d4" strokeWidth="1"/>
        <line x1={xOf(612)+20} y1={yOf(KITCHEN.height-360)} x2={xOf(612+550)-20} y2={yOf(KITCHEN.height-360)} stroke="#b8c7d4" strokeWidth="1"/>
        <line x1={xOf(612)+20} y1={yOf(KITCHEN.height-440)} x2={xOf(612+550)-20} y2={yOf(KITCHEN.height-440)} stroke="#b8c7d4" strokeWidth="1"/>
        <circle cx={xOf(612+275)} cy={yOf(KITCHEN.height-305)} r={Math.min(wOf(300)/2, hOf(300)/2)} fill="#ffffff" stroke="#1a1a18" strokeWidth="2.6"/>
        <circle cx={xOf(612+275)} cy={yOf(KITCHEN.height-305)} r={Math.min(wOf(300)/2, hOf(300)/2)-6} fill="none" stroke="#c05a2b" strokeWidth="1.2"/>
        <circle cx={xOf(612+275)} cy={yOf(KITCHEN.height-305)} r={7} fill="#c05a2b" stroke="#fff" strokeWidth="1.2"/>
        <line x1={xOf(612+275)-34} y1={yOf(KITCHEN.height-305)} x2={xOf(612+275)+34} y2={yOf(KITCHEN.height-305)} stroke="#2b2b2b" strokeWidth="2.2"/>
        <line x1={xOf(612+275)} y1={yOf(KITCHEN.height-305)-34} x2={xOf(612+275)} y2={yOf(KITCHEN.height-305)+34} stroke="#2b2b2b" strokeWidth="2.2"/>
        <text x={xOf(1162)} y={yOf(2430)} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1a1a18">TOP 610 - LEFT: 12" METAL EXHAUST / RIGHT: FIXED x1</text>
        <text x={xOf(1162)} y={yOf(1500)} textAnchor="middle" fontSize="10" fontWeight="800" fill="#c05a2b">BOTTOM 1190 - SLIDING x2 (both sides)</text>
        <text x={xOf(1162)} y={yOf(1800)} textAnchor="middle" fontSize="11" fontWeight="900" fill="#1f5f88">Window 1100x1800 sill 900 - 2 BAYS (centre mullion)</text>
        <rect x={xOf(KITCHEN.windowBelow?.x||612)} y={yOf(300)} width={wOf(KITCHEN.windowBelow?.w||1100)} height={hOf(300)} fill="#eaf6fd" stroke="#2f8ac6" strokeDasharray="10 8" opacity="0.72"/>
        <text x={xOf(1162)} y={yOf(150)} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2e6f99">Below window area only - 300 deep</text>
      </g>
    ):(
      <g>
        <rect x={xOf(KITCHEN.door.x)} y={yOf(2100)} width={wOf(KITCHEN.door.w)} height={hOf(2100)} fill="#fffaf3" stroke="#7b3f21" strokeWidth="2"/>
        <text x={xOf(KITCHEN.door.x+KITCHEN.door.w/2)} y={yOf(1050)} textAnchor="middle" fontSize="13" fontWeight="900" fill="#7b3f21">South opening {KITCHEN.door.w}W</text>
        <rect x={xOf(0)} y={yOf(KITCHEN.westGap.to)} width={wOf(KITCHEN.westCounterDepth||600)} height={hOf(KITCHEN.westGap.to)} fill="#fffaf3" stroke="#7b3f21" strokeDasharray="10 8" opacity="0.7"/>
        <text x={xOf(260)} y={yOf(KITCHEN.westGap.to/2)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#7b3f21">West door clear y0-y{KITCHEN.westGap.to}</text>
      </g>
    )}
    {/* dimension markers vertical on right */}
    <g fontSize="11" fontWeight="700">
      <line x1={frame.x+frame.w+14} y1={yOf(0)} x2={frame.x+frame.w+14} y2={yOf(900)} stroke="#111" strokeWidth="2"/>
      <text x={frame.x+frame.w+22} y={yOf(450)} transform={`rotate(90 ${frame.x+frame.w+22} ${yOf(450)})`} textAnchor="middle">Counter 900</text>
      <line x1={frame.x+frame.w+30} y1={yOf(900)} x2={frame.x+frame.w+30} y2={yOf(1500)} stroke="#7d7165" strokeWidth="2" strokeDasharray="6 4"/>
      <text x={frame.x+frame.w+38} y={yOf(1200)} transform={`rotate(90 ${frame.x+frame.w+38} ${yOf(1200)})`} textAnchor="middle" fill="#7d7165">Backsplash 600</text>
      <line x1={frame.x+frame.w+46} y1={yOf(1350)} x2={frame.x+frame.w+46} y2={yOf(1850)} stroke="#b8ab9a" strokeWidth="2"/>
      <text x={frame.x+frame.w+54} y={yOf(1600)} transform={`rotate(90 ${frame.x+frame.w+54} ${yOf(1600)})`} textAnchor="middle" fill="#6d6257">Lower upper 1350-1850</text>
      <line x1={frame.x+frame.w+62} y1={yOf(1900)} x2={frame.x+frame.w+62} y2={yOf(KITCHEN.height)} stroke="#bfa891" strokeWidth="2"/>
      <text x={frame.x+frame.w+70} y={yOf(2300)} transform={`rotate(90 ${frame.x+frame.w+70} ${yOf(2300)})`} textAnchor="middle" fill="#6d6257">Top upper 1850-2700 no gap</text>
    </g>
    <text x={frame.x-10} y={yOf(KITCHEN.height)+4} textAnchor="end" fontSize="12" fontWeight="800">{KITCHEN.height}</text>
    <text x={frame.x-10} y={yOf(0)+4} textAnchor="end" fontSize="12" fontWeight="800">0</text>
    {heightGuideOverlay()}
  </svg>)
}
