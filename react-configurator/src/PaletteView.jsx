import React,{useMemo,useState,useSyncExternalStore} from 'react'
import {HOME_ROOMS} from './home/rooms.mjs'
import {HOME_PALETTES,TODAY_PALETTE,RECOMMENDED_PALETTE_ID,STATUS_LABELS,LIVE_PREVIEW_NOTE,KEPT_IN_EVERY_PALETTE} from './config/homePaletteConfig.js'
import {ROLE_LABELS,checkPalette,paletteChanges,paletteOk,roomSwatches} from './home/palette.mjs'
import {paletteStore} from './home/paletteStore.mjs'

// The whole-home palette page: what each palette is, where each colour goes, and what it would change from today.
// It only reads src/config/homePaletteConfig.js. The one thing it can change is which palette the live 3D views
// preview (a browser setting; "Today" is the default and leaves every view exactly as it was).
const ink='#241f1a',muted='#6f665e',line='#e1d9d0'
const card={background:'#fff',border:`1px solid ${line}`,borderRadius:18,padding:'clamp(14px,1.6vw,22px)',boxShadow:'0 10px 30px rgba(52,41,30,.06)'}
const pill=active=>({padding:'9px 15px',borderRadius:999,border:`1px solid ${active?ink:'#cfc5b9'}`,background:active?ink:'#fff',color:active?'#fff':ink,fontWeight:800,cursor:'pointer',fontSize:14})
const th={textAlign:'left',padding:'8px 10px',fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:muted,borderBottom:`1px solid ${line}`,whiteSpace:'nowrap'}
const td={padding:'8px 10px',fontSize:13,borderBottom:'1px solid #f0ebe4',verticalAlign:'top',color:ink}
const STATUS_COLOURS={owner:['#dcfce7','#166534'],existing:['#e0f2fe','#075985'],proposal:['#fef3c7','#92400e'],placeholder:['#f1f5f9','#475569']}

function Chip({hex,size=18}){return <span aria-hidden="true" style={{display:'inline-block',width:size,height:size,borderRadius:5,background:hex,border:'1px solid rgba(0,0,0,.18)',verticalAlign:'middle',flex:'none'}}/>}
function Status({status}){if(!status)return null;const [bg,fg]=STATUS_COLOURS[status]||STATUS_COLOURS.placeholder;return <span style={{display:'inline-block',padding:'1px 7px',borderRadius:99,background:bg,color:fg,fontSize:11,fontWeight:800,whiteSpace:'nowrap'}}>{STATUS_LABELS[status]||status}</span>}
function Value({swatch}){
  if(!swatch)return <span style={{color:muted}}>not set</span>
  if(swatch.role==='light')return <span>{swatch.kelvin} K</span>
  return <span style={{display:'inline-flex',gap:7,alignItems:'center'}}><Chip hex={swatch.hex}/><span>{swatch.name} <code style={{fontSize:11,color:muted}}>{swatch.hex}</code></span></span>
}

function Swatches({palette}){
  return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:12}}>
    {Object.entries(palette.colours).map(([key,entry])=><div key={key} style={{border:`1px solid ${line}`,borderRadius:14,overflow:'hidden',background:'#fff'}}>
      <div style={{height:74,background:entry.hex,borderBottom:`1px solid ${line}`}}/>
      <div style={{padding:'10px 12px 12px'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'baseline'}}><b style={{fontSize:14,color:ink}}>{entry.name}</b><code style={{fontSize:12,color:muted}}>{entry.hex}</code></div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:muted,margin:'3px 0 6px'}}>{entry.kind}{entry.status&&<> · <Status status={entry.status}/></>}</div>
        {entry.where&&<div style={{fontSize:12.5,lineHeight:1.45,color:ink,marginBottom:6}}><b>Where:</b> {entry.where}</div>}
        <div style={{fontSize:12.5,lineHeight:1.45,color:'#554a40'}}><b>Buy:</b> {entry.spec}</div>
      </div>
    </div>)}
  </div>
}

function Lights({palette}){
  return <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{Object.entries(palette.lights).map(([key,kelvin])=><span key={key} style={{padding:'6px 12px',borderRadius:99,border:`1px solid ${line}`,background:'#fffaf0',fontSize:13}}><b>{palette.lightLabels?.[key]||key}:</b> {kelvin} K</span>)}</div>
}

export default function PaletteView(){
  const [id,setId]=useState(RECOMMENDED_PALETTE_ID)
  const choice=useSyncExternalStore(paletteStore.subscribe,paletteStore.getSnapshot)
  const [error,setError]=useState('')
  const palette=HOME_PALETTES.find(value=>value.id===id)||TODAY_PALETTE
  const checks=useMemo(()=>checkPalette(palette,HOME_ROOMS),[palette])
  const changes=useMemo(()=>palette.builtIn?[]:paletteChanges(TODAY_PALETTE,palette,HOME_ROOMS),[palette])
  const failed=checks.filter(row=>!row.pass)
  const roles=useMemo(()=>Object.keys(ROLE_LABELS).filter(role=>HOME_ROOMS.some(room=>roomSwatches(palette,room.id).some(s=>s.role===role))),[palette])
  const roomName=roomId=>HOME_ROOMS.find(room=>room.id===roomId)?.label||roomId
  const preview=value=>{try{paletteStore.set(value);setError('')}catch(e){setError(e.message)}}
  const previewing=HOME_PALETTES.find(value=>value.id===choice.palette)

  return <main style={{maxWidth:1500,margin:'0 auto',padding:'clamp(16px,2.4vw,36px) clamp(16px,3vw,48px) 80px',color:ink}}>
    <div style={{fontSize:12,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:'#9a5b2b'}}>One scheme for the whole home</div>
    <h1 style={{fontSize:'clamp(26px,3vw,40px)',margin:'6px 0 8px'}}>Material and colour palette</h1>
    <p style={{maxWidth:900,fontSize:15,lineHeight:1.55,color:'#554a40',margin:'0 0 16px'}}>One recommended palette and two alternatives, next to the finishes the rooms have today. Each colour has the hex the app draws and what to ask a dealer for. Nothing here changes a room: rows marked as changing an owner decision are proposals to accept or refuse. Details and reasons: <code>docs/PALETTE.md</code>.</p>

    <div role="tablist" aria-label="Palettes" style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
      {HOME_PALETTES.map(value=><button key={value.id} role="tab" aria-selected={value.id===id} onClick={()=>setId(value.id)} style={pill(value.id===id)}>{value.name}{value.id===RECOMMENDED_PALETTE_ID?' (recommended)':''}</button>)}
    </div>

    <section style={{...card,marginBottom:16}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:14,justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{flex:'1 1 420px',minWidth:0}}>
          <h2 style={{margin:'0 0 6px',fontSize:22}}>{palette.name}</h2>
          <p style={{margin:0,fontSize:14,lineHeight:1.55,color:'#554a40',maxWidth:820}}>{palette.summary}</p>
          <div style={{display:'flex',gap:0,marginTop:12,borderRadius:10,overflow:'hidden',border:`1px solid ${line}`,width:'min(100%,520px)',height:34}} aria-hidden="true">{Object.values(palette.colours).map((entry,index)=><span key={index} title={entry.name} style={{flex:1,background:entry.hex}}/>)}</div>
        </div>
        <div style={{flex:'0 1 380px',border:`1px solid ${line}`,borderRadius:14,padding:12,background:'#fbf8f3'}}>
          <b style={{fontSize:13}}>Live 3D preview</b>
          <div style={{fontSize:12.5,lineHeight:1.45,color:'#554a40',margin:'4px 0 8px'}}>Now showing: <b>{previewing?.name||choice.palette}</b>{choice.palette===TODAY_PALETTE.id?' (the default look)':''}. {LIVE_PREVIEW_NOTE}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {choice.palette!==palette.id&&<button onClick={()=>preview(palette.id)} style={{...pill(true),fontSize:13,padding:'7px 12px'}}>Show {palette.builtIn?'today’s look':'this palette'} in the 3D views</button>}
            {choice.palette!==TODAY_PALETTE.id&&<button onClick={()=>preview(TODAY_PALETTE.id)} style={{...pill(false),fontSize:13,padding:'7px 12px'}}>Back to today&rsquo;s look</button>}
          </div>
          {(error||paletteStore.getError())&&<p role="alert" style={{color:'#b91c1c',fontSize:12,margin:'8px 0 0'}}>{error||paletteStore.getError()}</p>}
        </div>
      </div>
    </section>

    <section style={{...card,marginBottom:16}}>
      <h3 style={{margin:'0 0 12px',fontSize:18}}>{palette.builtIn?'Finishes in the app today':'Colours and what to buy'}</h3>
      <Swatches palette={palette}/>
      <h4 style={{margin:'18px 0 8px',fontSize:15}}>Light colour</h4>
      <Lights palette={palette}/>
      <h4 style={{margin:'18px 0 6px',fontSize:15}}>Kept in every palette</h4>
      <ul style={{margin:0,paddingLeft:18,fontSize:13,lineHeight:1.6,color:'#554a40'}}>{KEPT_IN_EVERY_PALETTE.map(line=><li key={line}>{line}</li>)}</ul>
    </section>

    <section style={{...card,marginBottom:16}}>
      <h3 style={{margin:'0 0 4px',fontSize:18}}>Room by room</h3>
      <p style={{margin:'0 0 10px',fontSize:13,color:muted}}>Which colour each kind of surface takes in each room. Empty cells: the room has no such surface.</p>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',minWidth:900}}>
          <thead><tr><th style={th}>Room</th>{roles.map(role=><th key={role} style={th}>{ROLE_LABELS[role]}</th>)}</tr></thead>
          <tbody>{HOME_ROOMS.map(room=>{const byRole=Object.fromEntries(roomSwatches(palette,room.id).map(s=>[s.role,s]));return <tr key={room.id}>
            <td style={{...td,fontWeight:800,whiteSpace:'nowrap'}}>{room.label}</td>
            {roles.map(role=>{const s=byRole[role];return <td key={role} style={td}>{!s?'':role==='light'?`${s.kelvin} K`:<span style={{display:'inline-flex',gap:6,alignItems:'center'}}><Chip hex={s.hex} size={15}/><span style={{fontSize:12.5}}>{s.name}</span></span>}</td>})}
          </tr>})}</tbody>
        </table>
      </div>
    </section>

    {!palette.builtIn&&<section style={{...card,marginBottom:16}}>
      <h3 style={{margin:'0 0 4px',fontSize:18}}>What would change from today</h3>
      <p style={{margin:'0 0 10px',fontSize:13,color:muted}}>{changes.length} surface{changes.length===1?'':'s'} differ from today; {changes.filter(row=>row.ownerDecision).length} of them touch an owner decision or an existing thing and stay as proposals. {palette.changeNote}</p>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',minWidth:760}}>
          <thead><tr><th style={th}>Room</th><th style={th}>Surface</th><th style={th}>Today</th><th style={th}>With this palette</th><th style={th}>Note</th></tr></thead>
          <tbody>{changes.map((row,index)=><tr key={index} style={row.ownerDecision?{background:'#fffbeb'}:undefined}>
            <td style={{...td,fontWeight:800,whiteSpace:'nowrap'}}>{roomName(row.room)}</td>
            <td style={{...td,whiteSpace:'nowrap'}}>{ROLE_LABELS[row.role]}</td>
            <td style={td}><Value swatch={row.from}/> {row.from&&<Status status={row.from.status}/>}</td>
            <td style={td}><Value swatch={row.to}/></td>
            <td style={{...td,fontSize:12.5}}>{row.ownerDecision?<b style={{color:'#92400e'}}>Changes an owner decision or an existing thing: proposal only, not applied.</b>:row.role==='light'?(row.from?'Today’s light colour is a proposal in the lighting config, not yet agreed.':'No light colour is configured today.'):row.from?.status==='proposal'?'Today’s value is itself an open proposal.':row.from?'Today’s value is a developer placeholder.':'Not set today.'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>}

    <section style={card}>
      <h3 style={{margin:'0 0 4px',fontSize:18}}>Checks</h3>
      <p style={{margin:'0 0 10px',fontSize:13,color:failed.length?'#b91c1c':'#166534',fontWeight:800}}>{paletteOk(checks)?`All ${checks.length} checks pass.`:`${failed.length} of ${checks.length} checks fail${palette.builtIn?': this is why today’s finishes do not read as one scheme.':'.'}`}</p>
      <ul style={{margin:0,paddingLeft:18,fontSize:13,lineHeight:1.6}}>
        {(failed.length?failed:checks.filter(row=>!row.room)).map((row,index)=><li key={index} style={{color:row.pass?'#554a40':'#b91c1c'}}><b>{row.id}{row.room?` · ${roomName(row.room)}`:''}:</b> {row.detail}</li>)}
      </ul>
      <p style={{margin:'10px 0 0',fontSize:12,color:muted}}>The checks compare the hex values in the app: wall against wood contrast, the number of wood tones, every room mapped, and light colour against the palette&rsquo;s intent. They do not replace looking at real samples in the room.</p>
    </section>
  </main>
}
