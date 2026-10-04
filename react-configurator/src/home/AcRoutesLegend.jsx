import React from 'react'
import {acRoutesSummary} from '../rooms/shared/AcPipeRoutes.js'

// Key to the "Show AC pipe routes" overlay of Whole home 3D: one chip per room with the lengths from the AC plan checks
// (config/acPlanConfig.js, domain/acPlan.mjs). Everything shown is a proposal from typical figures.
export default function AcRoutesLegend() {
  const rows = acRoutesSummary()
  return <div role="status" style={{display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '8px 16px', borderBottom: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 13, color: '#334155'}}>
    <b>AC plan:</b>
    {rows.map(row => <span key={row.id} style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
      <span aria-hidden="true" style={{width: 22, height: 6, borderRadius: 3, background: row.colour}}/>
      {row.name}: {row.type} {row.tons} ton ({row.status}){row.pipeM != null ? `, pipe ${row.pipeM.toFixed(1)} m` : ', no pipes'}, drain {row.drainM.toFixed(1)} m
    </span>)}
    <span style={{display: 'inline-flex', alignItems: 'center', gap: 6}}><span aria-hidden="true" style={{width: 22, height: 3, background: '#0891b2'}}/>drain to its discharge point (blue disc)</span>
    <span>Kitchen: no AC. Proposal from typical figures, nothing measured: docs/AC_PLAN.md</span>
  </div>
}
