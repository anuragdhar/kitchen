import React from 'react'
import {checkExistingElectrical, describeExistingPoint, describeDisposition} from '../domain/existingElectrical.mjs'
import {EXISTING_ELECTRICAL} from '../config/existingElectricalConfig.js'

// The small list under a room's toolbar while "Show existing electrical points" is on: what the phone scan found, what the
// proposed plan does with each point (its disposition: keep, relocate, blank off) and every planned door, panel or piece of
// furniture that lands on one of those points (existingElectrical.mjs): green with its resolution when the disposition
// deals with it, red while it is still open.
export default function ExistingElectricalPanel({roomKey, room, layoutKey = null}) {
  const entry = EXISTING_ELECTRICAL[roomKey]
  if (!entry) return null
  const {points, conflicts, open} = checkExistingElectrical(roomKey, room, {layoutKey})
  const source = points[0]?.source ?? 'site scan', resolved = conflicts.length - open.length
  return <div aria-label="Existing electrical points" style={{padding:'12px 16px',borderTop:'1px solid #e2e8f0',background:'#f1f5f9',color:'#1e293b',fontSize:13,lineHeight:1.5}}>
    <div style={{display:'flex',gap:10,alignItems:'baseline',flexWrap:'wrap'}}>
      <b style={{color:'#1e3a8a'}}>Existing electrical points</b>
      <span style={{color:'#475569'}}>grey plates with a blue outline, at true size, from the {source} (about +/- 20 mm). Records of what is there today, not the proposal{entry.measured?.xOffsetMm?`; x was measured ${entry.measured.x} and ${entry.measured.xOffsetMm} mm has been subtracted`:''}.</span>
    </div>
    <ul style={{margin:'6px 0 0',paddingLeft:20,columns:'2 320px',columnGap:24}}>
      {points.map(p=><li key={p.id} style={{breakInside:'avoid'}}>{describeExistingPoint(p)}{p.assumed?<span style={{color:'#64748b'}}> (assumed: {p.assumed})</span>:null}{p.disposition?<span style={{color:'#334155'}}> <b>Plan:</b> {describeDisposition(p)}</span>:null}</li>)}
    </ul>
    {conflicts.length?<div style={{marginTop:8}}>
      <b style={{color:open.length?'#b91c1c':'#166534'}}>{conflicts.length} {conflicts.length===1?'clash':'clashes'} with the planned design{layoutKey?` (layout ${layoutKey})`:''}: {resolved} resolved in the proposed plan, {open.length} open</b>
      <ul style={{margin:'4px 0 0',paddingLeft:20}}>{conflicts.map((c,i)=>c.resolved
        ?<li key={c.id+i} style={{color:'#14532d'}}><b>Resolved.</b> {c.finding}. <span style={{color:'#166534'}}>{c.resolution}</span></li>
        :<li key={c.id+i} style={{color:'#7f1d1d'}}><b>Open.</b> {c.message}</li>)}</ul>
    </div>:<div style={{marginTop:6,color:'#166534'}}>No planned door, window, panel or piece of furniture lands on an existing point in this layout.</div>}
  </div>
}
