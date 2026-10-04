import React,{useState} from 'react'
import {DRAWING_DIMMER_CIRCUITS} from '../../config/drawingLightingConfig.js'

// Brightness sliders for a room's light circuits: one slider per circuit, the way the wall dimmers will be. A track run is
// one circuit (owner 2026-10-04: the heads on a run cannot be dimmed one by one), so each track slider scales every head on
// that run, real lights and lens glow, in the live 3D view from off to 150% of the planned level. "Dark room" switches off
// every other source (daylight, sky light, the generic preview lights) so only these light the room.
// Preview only: nothing is saved, and the brightness is not photometric.
// `circuits` is a list of [circuit id, label]; the default is the Drawing Room's (drawingLightingConfig.js). The other rooms
// pass their own (config/roomLightingCircuits.js).
export default function DrawingLightDimmer({onChange,onDarkRoom,circuits:CIRCUITS=DRAWING_DIMMER_CIRCUITS}){
  const [levels,setLevels]=useState(()=>Object.fromEntries(CIRCUITS.map(([id])=>[id,100]))),[dark,setDark]=useState(false)
  const set=(id,value)=>{setLevels(current=>({...current,[id]:value}));onChange(id,value/100)}
  return <div role="group" aria-label="Room light circuits" style={{display:'flex',gap:18,flexWrap:'wrap',alignItems:'center',padding:'8px 12px',margin:'8px 0',borderRadius:10,background:'#fff7ed',border:'1px solid #fed7aa',fontSize:13,color:'#7c2d12'}}>
    <b>Room lights (one dimmer per circuit)</b>
    <label style={{display:'flex',alignItems:'center',gap:6,fontWeight:700}} title="Switches off daylight, the sky light and the generic preview lights, so only the room's own light circuits light it"><input type="checkbox" checked={dark} onChange={event=>{setDark(event.target.checked);onDarkRoom(event.target.checked)}}/>Dark room: only these lights</label>
    {CIRCUITS.map(([id,label])=><label key={id} style={{display:'flex',alignItems:'center',gap:8}}>
      {label}
      <input type="range" min="0" max="150" step="5" value={levels[id]} onChange={event=>set(id,Number(event.target.value))} aria-label={`${label} brightness`}/>
      <span style={{width:44,fontVariantNumeric:'tabular-nums'}}>{levels[id]===0?'off':`${levels[id]}%`}</span>
    </label>)}
    <button type="button" onClick={()=>CIRCUITS.forEach(([id])=>set(id,0))} style={{padding:'4px 10px',borderRadius:8,border:'1px solid #fdba74',background:'#fff',cursor:'pointer'}}>All off</button>
    <button type="button" onClick={()=>CIRCUITS.forEach(([id])=>set(id,100))} style={{padding:'4px 10px',borderRadius:8,border:'1px solid #fdba74',background:'#fff',cursor:'pointer'}}>Planned level</button>
    <span style={{color:'#9a3412'}}>A preview of where light falls, not a measured brightness.</span>
  </div>
}
