import React from 'react'
import {STAND} from './standingCameraMath.mjs'

// The strip shown while "Stand here" is on (render/standingCamera.js): where the camera stands, typed or read, and Leave.
// `readout` is what the camera reports ({xMm, zMm, eyeMm, headingDeg, fovDeg}); `onSet` takes a partial change;
// `frame` says what x and z are measured from on this page and `facing` which way 0 and 90 degrees look there.
const field = {width: 78, padding: '4px 6px', borderRadius: 7, border: '1px solid #cbd5e1', fontSize: 13}

export default function StandingCameraControls({readout, onSet, onLeave, frame = 'x from the west wall, z from the north wall', facing = 'facing 0 = north, 90 = east'}) {
  if (!readout?.active) return null
  const number = (label, key, {min, max, step = 50, unit = 'mm'} = {}) => <label style={{display: 'inline-flex', alignItems: 'center', gap: 5}}>
    {label}
    <input type="number" value={readout[key]} min={min} max={max} step={step} style={field} aria-label={`Standing camera ${label}`}
      onChange={event => { const value = Number(event.target.value); if (event.target.value !== '' && Number.isFinite(value)) onSet({[key]: value}) }}/>
    <span style={{color: '#64748b'}}>{unit}</span>
  </label>
  return <div role="group" aria-label="Standing camera" style={{display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: '8px 16px', borderBottom: '1px solid #bae6fd', background: '#f0f9ff', fontSize: 13, color: '#0c4a6e'}}>
    <b>Standing in the room.</b>
    <span>Drag to look around. Click the floor to walk there, or use the arrow keys / W A S D. Mouse wheel: wider or narrower view.</span>
    {number('X', 'xMm')}{number('Z', 'zMm')}
    {number('Eye height', 'eyeMm', {min: STAND.eyeMinMm, max: STAND.eyeMaxMm})}
    {number('Facing', 'headingDeg', {min: 0, max: 359, step: 5, unit: 'degrees'})}
    <span style={{color: '#64748b'}}>({frame}; {facing})</span>
    <button type="button" onClick={onLeave} style={{padding: '5px 12px', borderRadius: 8, border: '1px solid #7dd3fc', background: '#fff', fontWeight: 800, cursor: 'pointer'}}>Leave</button>
  </div>
}
