// Extracted verbatim from App.jsx's inline WallElevation component (see
// docs/REFACTOR_PLAN.md Phase 4). KITCHEN/HEIGHT_GUIDES/PLINTH_HEIGHT are the
// same module-level singletons App.jsx itself imports, so they're imported
// here directly rather than threaded through as props; everything that comes
// from component state (materials-derived renderStyle, the module lists,
// the height-guide toggle, and the cabinet-select callback) is a prop.
import React from 'react'
import {KITCHEN, PLINTH_HEIGHT} from '../config/kitchenConfig.js'
import {HEIGHT_GUIDES} from '../config/renderConfig.js'

export default function WallElevation({items, isEast, modules, showHeightGuides, renderStyle, moduleSegmentsFromNorth, onSelectItem}) {
  const frame={x:72,y:52,w:1060,h:560}
  const xOf=(y)=>isEast?frame.x+((KITCHEN.length-y)/KITCHEN.length)*frame.w:frame.x+(y/KITCHEN.length)*frame.w
  const yOf=(z)=>frame.y+frame.h-(z/KITCHEN.height)*frame.h
  const wOf=(w)=>Math.max(34,(w/KITCHEN.length)*frame.w)
  const spanOf=(from,to)=>{const a=xOf(from), b=xOf(to); return {x:Math.min(a,b),w:Math.abs(b-a)}}
  const usableEnd=KITCHEN.length
  const cabinetRun=isEast?spanOf(0,usableEnd):spanOf(KITCHEN.westGap.to,usableEnd)
  const clearDoor=spanOf(0,KITCHEN.westGap.to)
  const windowSpan=spanOf(KITCHEN.length-600, KITCHEN.length)
  const key=isEast?'east':'west'
  const itemName={applianceGarage:'Appliance garage',gas:'Gas cooktop',dishwasher:'Dishwasher',washing:'Washing',microwave:'Microwave',foodprocessor:'Processor',waterpurifier:'Purifier cabinet',sink:'Sink',shaft:'Shaft',westGarage:'Food processor garage',garage_NE:'Tall cabinet',eastBacksplashSlider:'4in slider',westSixInchSlider:'6in slider'}
  const runStart=isEast?0:KITCHEN.westGap.to
  const topUpperY=yOf(2700)
  const topUpperH=yOf(1850)-topUpperY
  const lowerUpperY=yOf(1850)
  const lowerUpperH=yOf(1350)-lowerUpperY
  const backsplashY=yOf(1350)
  const backsplashH=yOf(900)-backsplashY
  const baseY=yOf(880)
  const baseH=yOf(PLINTH_HEIGHT)-baseY
  const plinthY=yOf(PLINTH_HEIGHT)
  const counterY=yOf(900)
  const guideText=(g)=>`${Math.round((g.to-g.from)/10)} cm`
  const heightGuideOverlay=()=>{
    if(!showHeightGuides) return null
    const guideX=cabinetRun.x+Math.min(Math.max(cabinetRun.w*.18,72),170)
    const labelX=guideX+34
    return (
      <g pointerEvents="none">
        {[0,PLINTH_HEIGHT,900,1350,1850,KITCHEN.height].map(z=>(
          <line key={`level-${z}`} x1={cabinetRun.x} y1={yOf(z)} x2={cabinetRun.x+cabinetRun.w} y2={yOf(z)} stroke="#4f46e5" strokeWidth="1.4" strokeDasharray="9 8" opacity="0.45"/>
        ))}
        <line x1={guideX} y1={yOf(0)} x2={guideX} y2={yOf(KITCHEN.height)} stroke="#c7d2fe" strokeWidth="10" opacity="0.34" filter={`url(#${key}HeightGlow)`}/>
        {HEIGHT_GUIDES.map(g=>{
          const yTop=yOf(g.to)
          const yBottom=yOf(g.from)
          const mid=(yTop+yBottom)/2
          return (
            <g key={g.id}>
              <line x1={guideX} y1={yTop+4} x2={guideX} y2={yBottom-4} stroke="#5b5bf7" strokeWidth="5" strokeLinecap="round" filter={`url(#${key}HeightGlow)`}/>
              <circle cx={guideX} cy={yTop+4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
              <circle cx={guideX} cy={yBottom-4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
              <text x={labelX} y={mid-5} fontSize="18" fontWeight="900" fill="#ffffff" stroke="#312e81" strokeWidth="4" paintOrder="stroke">{guideText(g)}</text>
              <text x={labelX} y={mid+15} fontSize="10" fontWeight="900" fill="#312e81">{g.label}</text>
            </g>
          )
        })}
        <text x={guideX} y={yOf(900)-10} textAnchor="middle" fontSize="10" fontWeight="900" fill="#312e81">counter 90 cm</text>
      </g>
    )
  }
  const panelsForModules=(zTop,zBottom,fill,stroke='#211b17')=>{
    return moduleSegmentsFromNorth(modules,runStart,KITCHEN.length).map((m,i)=>{
      const span=spanOf(m.y,m.y+m.width)
      if(span.w<10) return null
      return (
        <g key={`${zTop}-${m.id}-${i}`}>
          <rect x={span.x+1.5} y={yOf(zTop)} width={Math.max(4,span.w-3)} height={yOf(zBottom)-yOf(zTop)} fill={fill} stroke={stroke} strokeWidth="1.25"/>
          <line x1={span.x+span.w-1} y1={yOf(zTop)+8} x2={span.x+span.w-1} y2={yOf(zBottom)-8} stroke="#16120f" strokeWidth="1" opacity="0.55"/>
        </g>
      )
    })
  }
  const basePanels=()=>{
    return moduleSegmentsFromNorth(modules,runStart,KITCHEN.length).map((m,i)=>{
      const span=spanOf(m.y,m.y+m.width)
      if(span.w<12) return null
      return (
        <g key={`base-${m.id}-${i}`}>
          <rect x={span.x+1.5} y={baseY} width={Math.max(4,span.w-3)} height={baseH} fill={renderStyle.baseCabinet} stroke="#211b17" strokeWidth="1.2"/>
          <line x1={span.x+span.w-2} y1={baseY+8} x2={span.x+span.w-2} y2={plinthY-8} stroke="#17110d" opacity="0.62"/>
        </g>
      )
    })
  }
  return (<svg width="1180" height="680" viewBox="0 0 1180 680" style={{background:'#fffefb',border:'1px solid #ddd4c8',width:'100%',height:'auto',display:'block'}}>
    <defs>
      <linearGradient id={`${key}WallWash`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#d8c4ae"/>
        <stop offset="0.55" stopColor="#c9b199"/>
        <stop offset="1" stopColor="#b79d84"/>
      </linearGradient>
      <linearGradient id={`${key}LedWash`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffd893" stopOpacity="0.9"/>
        <stop offset="1" stopColor="#ffd893" stopOpacity="0"/>
      </linearGradient>
      <pattern id={`${key}Wood`} width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill={renderStyle.middleCabinet}/>
        <path d="M10 0 C30 16 18 39 40 80 M45 0 C62 22 58 46 72 80 M0 45 C18 35 28 42 48 31" fill="none" stroke="#6f4a2f" strokeWidth="1.1" opacity="0.35"/>
        <path d="M22 0 C18 28 38 42 32 80 M64 0 C44 28 70 52 55 80" fill="none" stroke="#dfb983" strokeWidth="0.8" opacity="0.28"/>
      </pattern>
      <pattern id={`${key}Backsplash`} width="120" height="80" patternUnits="userSpaceOnUse">
        <rect width="120" height="80" fill="#d9c6af"/>
        <path d="M0 42 C30 24 62 66 120 35 M18 0 C34 25 30 55 58 80" fill="none" stroke="#9f8976" strokeWidth="1" opacity="0.22"/>
      </pattern>
      <filter id={`${key}SoftShadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#21150d" floodOpacity="0.24"/>
      </filter>
      <filter id={`${key}Glow`} x="-10%" y="-70%" width="120%" height="260%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id={`${key}HeightGlow`} x="-80%" y="-20%" width="260%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <text x={frame.x} y="31" fontSize="24" fontWeight="900" fill="#171717">{isEast?'East Wall Elevation':'West Wall Elevation'}</text>
    <text x={frame.x+frame.w} y="31" textAnchor="end" fontSize="15" fontWeight="800" fill="#61584f">{isEast?'North (N) left to South (S) right':'South (S) left to North (N) right'}, length {KITCHEN.length} mm, height {KITCHEN.height} mm</text>
    <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={`url(#${key}WallWash)`} stroke="#171717" strokeWidth="2"/>
    <rect x={cabinetRun.x} y={backsplashY} width={cabinetRun.w} height={backsplashH} fill={`url(#${key}Backsplash)`}/>
    <rect x={cabinetRun.x} y={counterY-4} width={cabinetRun.w} height="18" fill={renderStyle.counter} stroke="#3a2d24" strokeWidth="1.4"/>
    <g filter={`url(#${key}SoftShadow)`}>{basePanels()}</g>
    <rect x={cabinetRun.x} y={plinthY} width={cabinetRun.w} height={yOf(0)-plinthY} fill="#43372f"/>
    <rect x={cabinetRun.x} y={lowerUpperY} width={cabinetRun.w} height={lowerUpperH} fill={`url(#${key}Wood)`} stroke="#211b17" strokeWidth="1.5" filter={`url(#${key}SoftShadow)`}/>
    {panelsForModules(1850,1350,`url(#${key}Wood)`)}
    <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH-8} width={cabinetRun.w} height="7" fill="#201711" opacity="0.55"/>
    <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH+4} width={cabinetRun.w} height="12" fill="#ffd08a" opacity="0.96" filter={`url(#${key}Glow)`}/>
    <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH+12} width={cabinetRun.w} height={Math.max(1,yOf(900)-(lowerUpperY+lowerUpperH+12))} fill={`url(#${key}LedWash)`} opacity="0.55"/>
    <rect x={cabinetRun.x} y={topUpperY} width={cabinetRun.w} height={topUpperH} fill={renderStyle.topCabinet} stroke="#211b17" strokeWidth="1.5" filter={`url(#${key}SoftShadow)`}/>
    {panelsForModules(2700,1850,renderStyle.topCabinet)}
    {!isEast&&<g>
      <rect x={clearDoor.x} y={frame.y} width={clearDoor.w} height={frame.h} fill="#f9f4ec" stroke="#7b3f21" strokeDasharray="9 7" opacity="0.92"/>
      <text x={clearDoor.x+clearDoor.w/2} y={frame.y+frame.h/2} textAnchor="middle" fontSize="16" fontWeight="900" fill="#7b3f21">door clear zone</text>
      <text x={clearDoor.x+clearDoor.w/2} y={frame.y+frame.h/2+24} textAnchor="middle" fontSize="13" fontWeight="800" fill="#7b3f21">no counter or cabinets</text>
    </g>}
    <rect x={windowSpan.x} y={yOf(2700)} width={windowSpan.w} height={yOf(900)-yOf(2700)} fill="none" stroke="#2f8ac6" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.62"/>
    {items.map((it,index)=>{
      if(it.hidden || it.id==='westGarage' || it.w<=0 || it.d<=0) return null
      const width=wOf(it.w)
      const x=isEast?xOf(it.y)-width:xOf(it.y)
      const dark=['gas','sink','microwave'].includes(it.id)
      if(it.backsplashSlider){
        const top=yOf((it.z??900)+(it.h||450))
        const bottom=yOf(it.z??900)
        return (<g key={it.id}>
          <rect x={x+2} y={top} width={Math.max(12,width-4)} height={bottom-top} fill="#d9c6af" stroke="#111" strokeWidth="1.2" rx="4" opacity="0.94"/>
          <line x1={x+12} y1={top+22} x2={x+width-12} y2={top+22} stroke="#5a4632" strokeWidth="2" strokeDasharray="10 7"/>
          <line x1={x+12} y1={bottom-22} x2={x+width-12} y2={bottom-22} stroke="#5a4632" strokeWidth="2" strokeDasharray="10 7"/>
          <rect x={x+Math.max(18,width*.18)} y={top+36} width={Math.max(36,width*.24)} height={Math.max(24,bottom-top-72)} fill="#f7efe4" stroke="#6f5842" strokeWidth="1.1" opacity="0.86"/>
          <text x={x+width/2} y={top-10} textAnchor="middle" fontSize="11" fontWeight="900" fill="#111">{isEast?'4in backsplash slider':'6in slider storage'}</text>
        </g>)
      }
      if(it.id==='gas'){
        const cooktopY=yOf(960)
        const ventY=lowerUpperY+lowerUpperH-10
        return (<g key={it.id}>
          <rect x={x} y={cooktopY} width={width} height="20" fill="#111" stroke="#171717" rx="5"/>
          {[.28,.5,.72].map((p,i)=><circle key={p} cx={x+width*p} cy={cooktopY+10} r={i===1?9:7} fill="none" stroke="#fff" strokeWidth="2"/>)}
          <rect x={x+width*.16} y={ventY} width={width*.68} height="7" fill="#161412" rx="3"/>
          <rect x={x+width*.2} y={ventY+8} width={width*.6} height="4" fill="#f7c471" opacity="0.9"/>
          <text x={x+width/2} y={cooktopY-10} textAnchor="middle" fontSize="13" fontWeight="900" fill="#111">gas cooktop</text>
        </g>)
      }
      if(isEast&&it.id==='applianceGarage'){
        const garageTop=yOf((it.z??900)+(it.h||550))
        const garageBottom=yOf(it.z??900)
        return (<g key={it.id}>
          <rect x={x+3} y={garageTop} width={Math.max(14,width-6)} height={garageBottom-garageTop} fill="#8c7a65" stroke="#111" strokeWidth="1.5" rx="5"/>
          <rect x={x+10} y={garageTop+16} width={Math.max(10,width-20)} height={garageBottom-garageTop-32} fill="#f3eadf" stroke="#6f5842" strokeWidth="1.2" strokeDasharray="6 5" rx="4"/>
          <rect x={x+width*.2} y={garageTop+50} width={width*.6} height="42" fill="#1f1f1f" stroke="#111" rx="4"/>
          <rect x={x+width*.28} y={garageBottom-92} width={width*.44} height="44" fill="#b9b9b9" stroke="#111" rx="4"/>
          <text x={x+width/2} y={garageTop-10} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">appliance garage</text>
          <text x={x+width/2} y={garageBottom+18} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a4632">open food processor garage</text>
        </g>)
      }
      if(it.id==='westGarage') return null
      if(it.id==='garage_NE'){
        // East Tall NE - washing below + MICROWAVE above (contiguous uppers no gap)
        const tallTop=yOf(2700)
        const tallBottom=yOf(0)
        return (<g key={it.id} onClick={()=>onSelectItem(it.id)} style={{cursor:'pointer'}}>
          <rect x={x+2} y={tallTop} width={Math.max(14,width-4)} height={tallBottom-tallTop} fill={renderStyle.tallCabinet} stroke="#111" strokeWidth="1.6" rx="5"/>
          <rect x={x+6} y={baseY+10} width={Math.max(10,width-12)} height={baseH-10} fill="#e7e2dc" stroke="#211b17" strokeWidth="1.2" rx="4"/>
          <rect x={x+width*.18} y={yOf(1480)} width={width*.64} height="48" fill="#1f1f1f" stroke="#111" rx="4"/>
          <rect x={x+width*.22} y={yOf(1480)+18} width={width*.40} height="18" fill="#050505" stroke="#444"/>
          <text x={x+width/2} y={yOf(1480)+38} textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff">MICROWAVE</text>
          <circle cx={x+width/2} cy={baseY+baseH*.56} r={Math.min(30,width*.22)} fill="#1f2327" stroke="#d2d2d2" strokeWidth="6"/>
          <text x={x+width/2} y={baseY-14} textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">Tall NE - Microwave above</text>
          <text x={x+width/2} y={baseY-2} textAnchor="middle" fontSize="8" fontWeight="800" fill="#5a4632">Washing below</text>
        </g>)
      }
      if(it.id==='trashCan'){
        // Trash pull-out Saints frame below sink - cabinet opens then frame pulls out
        return (<g key={it.id} onClick={()=>onSelectItem(it.id)} style={{cursor:'pointer'}}>
          <rect x={x+3} y={baseY+10} width={Math.max(12,width-6)} height={baseH-10} fill="#2b2b2b" stroke="#111" strokeWidth="1.4" rx="4"/>
          <rect x={x+8} y={baseY+22} width={Math.max(10,width-16)} height={baseH-34} fill="#3a3a3a" stroke="#111" rx="3"/>
          <rect x={x+width*.18} y={baseY+34} width={width*.64} height="18" fill="#1a1a1a" rx="2"/>
          <line x1={x+12} y1={baseY+74} x2={x+12} y2={baseY+baseH-32} stroke="#111" strokeWidth="2.2"/>
          <path d={`M ${x+12} ${baseY+baseH-36} Q ${x-width*.24} ${baseY+baseH*.66} ${x+12} ${baseY+baseH*.35}`} fill="none" stroke="#2f6f6d" strokeWidth="2" strokeDasharray="5 4"/>
          <text x={x+width/2} y={baseY+baseH-18} textAnchor="middle" fontSize="8" fontWeight="900" fill="#c8b39d">Saints frame pull-out</text>
          <text x={x+width/2} y={baseY-14} textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">Trash pull-out</text>
          <text x={x+width/2} y={baseY-2} textAnchor="middle" fontSize="8" fontWeight="800" fill="#5a4632">under sink 350x400</text>
        </g>)
      }
      if(it.id==='washing' && items.some(x=>x.id==='garage_NE')){
        // washing is inside tall NE - skip duplicate, garage_NE already shows washing + microwave
        return null
      }
      if(it.id==='dishwasher'||it.id==='washing'){
        const label=it.id==='washing'?'1  Open Washing':'3  Open Dishwasher'
        const panelFill=it.id==='washing'?'#e7e2dc':'#b9b6b1'
        return (<g key={it.id}>
          <rect x={x+3} y={baseY+10} width={Math.max(12,width-6)} height={baseH-10} fill={panelFill} stroke="#211b17" strokeWidth="1.4" rx="4"/>
          {it.id==='washing'&&<g>
            <circle cx={x+width/2} cy={baseY+baseH*.56} r={Math.min(44,width*.26)} fill="#1f2327" stroke="#d2d2d2" strokeWidth="8"/>
            <circle cx={x+width/2} cy={baseY+baseH*.56} r={Math.min(30,width*.18)} fill="#7f939d" opacity="0.72"/>
            <line x1={x+12} y1={baseY+74} x2={x+12} y2={baseY+baseH-32} stroke="#111" strokeWidth="2.2"/>
            <path d={`M ${x+12} ${baseY+baseH-36} Q ${x-width*.24} ${baseY+baseH*.66} ${x+12} ${baseY+baseH*.35}`} fill="none" stroke="#2f6f6d" strokeWidth="2" strokeDasharray="5 4"/>
            <text x={x+width/2} y={baseY+baseH-18} textAnchor="middle" fontSize="9" fontWeight="900" fill="#2f6f6d">door opens left</text>
          </g>}
          {it.id==='dishwasher'&&<g>
            <rect x={x+width*.18} y={baseY+baseH*.42} width={width*.64} height="9" fill="#4b453f" rx="3" opacity="0.78"/>
            <rect x={x+width*.22} y={baseY+baseH*.72} width={width*.56} height="6" fill="#4b453f" rx="3" opacity="0.55"/>
            <path d={`M ${x+width*.18} ${baseY+baseH*.7} L ${x+width*.82} ${baseY+baseH*.7} L ${x+width*.72} ${baseY+baseH+34} L ${x+width*.28} ${baseY+baseH+34} Z`} fill="#d1cec8" stroke="#111" strokeWidth="1.1" opacity="0.9"/>
            <text x={x+width/2} y={baseY+baseH+52} textAnchor="middle" fontSize="9" fontWeight="900" fill="#2f6f6d">door opens down</text>
          </g>}
          <rect x={x+8} y={baseY+22} width={Math.max(10,width-16)} height="18" fill="#6d645d" opacity="0.72"/>
          <text x={x+width/2} y={baseY-12} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">{label}</text>
          <text x={x+width/2} y={baseY+64} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">open {itemName[it.id]}</text>
        </g>)
      }
      if(it.id==='microwave'){
        const top=yOf(1470)
        return (<g key={it.id}>
          <rect x={x+3} y={top} width={Math.max(14,width-6)} height={yOf(1120)-top} fill="#1f1f1f" stroke="#111" strokeWidth="1.5" rx="5"/>
          <rect x={x+14} y={top+24} width={Math.max(8,width-60)} height="70" fill="#050505" stroke="#444"/>
          <text x={x+width/2} y={top+119} textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">microwave</text>
        </g>)
      }
      if(it.id==='waterpurifier'){
        const purifierTop=yOf((it.z??900)+(it.h||550))
        const purifierBottom=yOf(it.z??900)
        return (<g key={it.id}>
          <rect x={x+4} y={purifierTop} width={Math.max(12,width-8)} height={purifierBottom-purifierTop} fill="#80b5de" stroke="#111" strokeWidth="1.3" rx="5"/>
          <rect x={x+width*.18} y={purifierTop+38} width={width*.64} height={Math.max(20,purifierBottom-purifierTop-76)} fill="#d6eaf8" stroke="#2f6fb0" strokeWidth="1" rx="4"/>
          <text x={x+width/2-8} y={purifierTop-10} textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">purifier cabinet</text>
          <text x={x+width/2-8} y={purifierBottom+18} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1a3a5a">400W x 350D x 550H</text>
        </g>)
      }
      if(it.id==='sink'){
        return (<g key={it.id}>
          <rect x={x+width*.3} y={lowerUpperY+18} width={width*.58} height={lowerUpperH-42} fill="#c8d7df" stroke="#111" strokeWidth="1.2" rx="5" opacity="0.72"/>
          <line x1={x+width*.36} y1={lowerUpperY+lowerUpperH*.45} x2={x+width*.82} y2={lowerUpperY+lowerUpperH*.45} stroke="#6d6257" strokeWidth="2"/>
          {[.43,.55,.67,.79].map(p=><circle key={p} cx={x+width*p} cy={lowerUpperY+lowerUpperH*.28} r="8" fill="#f7f2ea" stroke="#887d70"/>)}
          <text x={x+width*.59} y={lowerUpperY+lowerUpperH-14} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">clean dishes</text>
          <rect x={x+4} y={counterY-8} width={Math.max(12,width-8)} height="22" fill="#202020" stroke="#111" rx="5"/>
          <rect x={x+width*.18} y={counterY-5} width={width*.64} height="14" fill="#c9c9c9" stroke="#555" rx="4"/>
          <text x={x+width/2} y={baseY+64} textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">sink</text>
        </g>)
      }
      if(it.id==='shaft'){
        return (<g key={it.id}>
          <rect x={x} y={frame.y} width={width} height={frame.h} fill="#a6a6a6" stroke="#111" strokeWidth="2.4" rx="5"/>
          <text x={x+width/2} y={frame.y+36} textAnchor="middle" fontSize="14" fontWeight="900" fill="#111">shaft</text>
        </g>)
      }
      if(it.id==='foodprocessor'){
        return (<g key={it.id}>
          <rect x={x+4} y={yOf(1190)} width={Math.max(12,width-8)} height={yOf(900)-yOf(1190)} fill="#b9b9b9" stroke="#111" strokeWidth="1.3" rx="5"/>
          <text x={x+width/2} y={yOf(1048)} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">processor</text>
        </g>)
      }
      return (<g key={it.id}>
        <rect x={x} y={baseY} width={width} height={baseH} fill={it.color} stroke="#171717" strokeWidth="1.3" rx="5"/>
        <text x={x+width/2} y={baseY+Math.min(baseH/2+5,58)} textAnchor="middle" fontSize="12" fontWeight="900" fill={dark?'#fff':'#111'}>{itemName[it.id]}</text>
      </g>)
    })}
    <text x={frame.x} y={frame.y+frame.h+32} fontSize="16" fontWeight="900">{isEast?`NORTH (N) ${KITCHEN.length}`:'SOUTH (S) 0'}</text>
    <text x={frame.x+frame.w} y={frame.y+frame.h+32} textAnchor="end" fontSize="16" fontWeight="900">{isEast?'SOUTH (S) 0':`NORTH (N) ${KITCHEN.length}`}</text>
    <text x={frame.x-18} y={yOf(2700)+6} textAnchor="end" fontSize="13" fontWeight="800">2700</text>
    <text x={frame.x-18} y={yOf(1900)+6} textAnchor="end" fontSize="13" fontWeight="800">1900</text>
    <text x={frame.x-18} y={yOf(1350)+6} textAnchor="end" fontSize="13" fontWeight="800">1350</text>
    <text x={frame.x-18} y={yOf(900)+6} textAnchor="end" fontSize="13" fontWeight="800">900</text>
    {heightGuideOverlay()}
  </svg>)
}
