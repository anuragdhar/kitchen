import React,{useState} from 'react'

// Brightness sliders for the Drawing Room track lights (layout C). Each slider scales the real lights and the glow of one
// kind of fitting in the live 3D view, from off to 150% of the planned level, the way a wall dimmer would. "Dark room"
// switches off every other source (daylight, sky light, the generic preview lights) so only these light the room.
// Preview only: nothing is saved, and the brightness is not photometric.
const DRAWING_KINDS=[['chandelier','Chandelier'],['spot','Track spots (on the TV wall)'],['diffuse','Track diffused (general light)'],['reading','Reading spots (over the seats)']]

// `kinds` is a list of [kind, label]; the default is the Drawing Room's. The Lobby passes its own (lobbyLightingConfig.js).
export default function DrawingLightDimmer({onChange,onDarkRoom,kinds:KINDS=DRAWING_KINDS}){
  const [levels,setLevels]=useState(()=>Object.fromEntries(KINDS.map(([kind])=>[kind,100]))),[dark,setDark]=useState(false)
  const set=(kind,value)=>{setLevels(current=>({...current,[kind]:value}));onChange(kind,value/100)}
  return <div role="group" aria-label="Track light brightness" style={{display:'flex',gap:18,flexWrap:'wrap',alignItems:'center',padding:'8px 12px',margin:'8px 0',borderRadius:10,background:'#fff7ed',border:'1px solid #fed7aa',fontSize:13,color:'#7c2d12'}}>
    <b>Room lights</b>
    <label style={{display:'flex',alignItems:'center',gap:6,fontWeight:700}} title="Switches off daylight, the sky light and the generic preview lights, so only the chandelier and the track lights light the room"><input type="checkbox" checked={dark} onChange={event=>{setDark(event.target.checked);onDarkRoom(event.target.checked)}}/>Dark room: only these lights</label>
    {KINDS.map(([kind,label])=><label key={kind} style={{display:'flex',alignItems:'center',gap:8}}>
      {label}
      <input type="range" min="0" max="150" step="5" value={levels[kind]} onChange={event=>set(kind,Number(event.target.value))} aria-label={`${label} brightness`}/>
      <span style={{width:44,fontVariantNumeric:'tabular-nums'}}>{levels[kind]===0?'off':`${levels[kind]}%`}</span>
    </label>)}
    <button type="button" onClick={()=>KINDS.forEach(([kind])=>set(kind,0))} style={{padding:'4px 10px',borderRadius:8,border:'1px solid #fdba74',background:'#fff',cursor:'pointer'}}>All off</button>
    <button type="button" onClick={()=>KINDS.forEach(([kind])=>set(kind,100))} style={{padding:'4px 10px',borderRadius:8,border:'1px solid #fdba74',background:'#fff',cursor:'pointer'}}>Planned level</button>
    <span style={{color:'#9a3412'}}>A preview of where light falls, not a measured brightness.</span>
  </div>
}
