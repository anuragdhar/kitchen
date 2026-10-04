import React from 'react'
import {EMPTY_ROOM_SHELLS} from '../../config/roomShellConfig.js'
import {BEDROOM1_DESIGN} from '../../config/bedroom1LayoutConfig.js'
import {checkBedroom1Layout} from '../../domain/bedroom1Layout.mjs'

export const BEDROOM1_DEFAULT_LAYOUT = BEDROOM1_DESIGN.defaultLayout
export const BEDROOM1_ALTERNATIVE_LAYOUT = 'headSouth'
export const BEDROOM1_ALTERNATIVE_BUTTON = 'Layout B: bed head on the south wall'

/** Toolbar button on the Bedroom 1 page: pressed = the alternative layout, released = the present one. */
export function Bedroom1LayoutToggle({layout, onChange, style}) {
  const alternative = layout === BEDROOM1_ALTERNATIVE_LAYOUT
  return <button onClick={() => onChange(alternative ? BEDROOM1_DEFAULT_LAYOUT : BEDROOM1_ALTERNATIVE_LAYOUT)} aria-pressed={alternative} style={style(alternative)}
    title="Switches between the present layout (A: bed along the south wall) and the checked alternative (B: bed head on the south wall, a walkway on both sides, dressing table on the north wall). See docs/changes/2026-10-05-bedroom1-design.md">{BEDROOM1_ALTERNATIVE_BUTTON}</button>
}

/** What the layout checks (src/domain/bedroom1Layout.mjs) say about the layout on screen. */
export function Bedroom1LayoutPanel({layout}) {
  const room = EMPTY_ROOM_SHELLS.bedroom1, check = checkBedroom1Layout(room, layout), c = check.clearances
  const sides = Object.entries(c.bedSides).map(([side, gap]) => `${side} ${gap} mm`).join(', ')
  const list = {margin: '4px 0 0', paddingLeft: 20}
  return <div style={{padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 13, lineHeight: 1.45, color: '#172033'}}>
    <div style={{fontWeight: 800}}>Layout {check.plan.label}: {check.issues.length ? `${check.issues.length} problem${check.issues.length > 1 ? 's' : ''} found by the layout check` : 'the layout check finds no problem'}</div>
    <div style={{color: '#475569'}}>Clear floor beside the bed: {sides}; beyond its foot {c.bedFoot} mm. Balcony opening clear: {c.balconyOpeningClear} mm. Medicine cabinet doors open {c.medicineCabinetLeaves.west} and {c.medicineCabinetLeaves.east} degrees. Nothing in this room is measured on site, and the door swings are assumed.</div>
    {check.issues.length > 0 && <ul style={{...list, color: '#b91c1c'}}>{check.issues.map(text => <li key={text}>{text}</li>)}</ul>}
    {check.notes.length > 0 && <ul style={{...list, color: '#475569'}}>{check.notes.map(text => <li key={text}>Note: {text}</li>)}</ul>}
  </div>
}
