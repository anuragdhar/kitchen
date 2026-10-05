import React from 'react'
import {roomElectricalReport, hasRoomElectrical} from '../domain/roomElectricalModels.mjs'
import {ELECTRICAL_COLOURS, ELECTRICAL_OPTIONAL_COLOUR} from '../rooms/shared/ElectricalPointMarkers.js'

const LEGEND = [['power', 'sockets'], ['charging', 'charging (USB)'], ['lighting', 'lights and switches'], ['data', 'data / bell'], ['dedicated', 'own circuit']]

// The short list under a room's 3D view while "Show electrical points" is on (rooms with a plan in
// config/roomElectricalConfig.js): the colour key, the result of every rule of the generic check
// (domain/roomElectrical.mjs), the proposed circuits with their estimated load, and what the electrician must verify.
export default function RoomElectricalPanel({roomKey}) {
  if (!hasRoomElectrical(roomKey)) return null
  const {plan, check, points} = roomElectricalReport(roomKey)
  const moves = points.filter(p => p.dependsOn)
  return <div aria-label="Proposed electrical points" style={{padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#fffbeb', color: '#1e293b', fontSize: 13, lineHeight: 1.5}}>
    <div style={{display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap'}}>
      <b style={{color: '#92400e'}}>Proposed electrical points: {points.length}</b>
      <span style={{color: '#475569'}}>A planning layout for a licensed electrician, not a wiring design (docs/ELECTRICAL_PLAN.md). {plan.status}.</span>
    </div>
    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6}}>
      {LEGEND.map(([kind, text]) => <span key={kind}><span style={{display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: ELECTRICAL_COLOURS[kind], marginRight: 5}}/>{text}</span>)}
      <span><span style={{display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: ELECTRICAL_OPTIONAL_COLOUR, marginRight: 5}}/>optional</span>
    </div>
    <div style={{marginTop: 8}}><b style={{color: check.ok ? '#166534' : '#b91c1c'}}>{check.ok ? `All ${check.results.length} checks pass` : `${check.issues.length} ${check.issues.length === 1 ? 'problem' : 'problems'} found`}</b></div>
    <ul aria-label="Electrical check results" style={{margin: '4px 0 0', paddingLeft: 20, columns: '2 340px', columnGap: 24}}>
      {check.results.map(r => <li key={r.id} style={{breakInside: 'avoid', color: r.ok ? '#166534' : '#7f1d1d'}}>
        {r.ok ? 'OK' : 'PROBLEM'}: {r.label} <span style={{color: '#64748b'}}>({r.note})</span>
        {r.issues.length ? <ul style={{margin: '2px 0', paddingLeft: 18}}>{r.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : null}
      </li>)}
    </ul>
    <div style={{marginTop: 8}}><b>Circuits (proposed) and connected load, about {check.load.totalW.toLocaleString()} W in all:</b> {check.load.circuits.map(c => `${c.name}: ${c.mcbA} A, ${c.watts.toLocaleString()} W (${c.points.join(', ')})`).join(' · ')}</div>
    {moves.length ? <div style={{marginTop: 6, color: '#475569'}}>Follow the furniture and must be re-checked if it moves: {moves.map(p => `${p.id} (${p.dependsOn})`).join(', ')}.</div> : null}
    <div style={{marginTop: 6, color: '#475569'}}><b>To verify on site:</b> {plan.verify.join(' ')}</div>
  </div>
}
