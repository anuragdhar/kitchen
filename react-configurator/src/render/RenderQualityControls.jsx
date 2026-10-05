import React, {useEffect, useState} from 'react'
import {QUALITY, QUALITY_CHOICES, readQualityChoice, setQualityChoice, subscribeQuality} from './renderQuality.mjs'
import {downloadBlob} from './liveView.js'

const LABELS = {auto: 'Auto', draft: QUALITY.draft.label, standard: QUALITY.standard.label, high: QUALITY.high.label}

/**
 * The render-quality switch (one setting for every live view, render/renderQuality.mjs) and "Save picture", which renders
 * the current view at a higher resolution and downloads it as a PNG. `sceneRef.current.liveView` is the page's live view
 * (render/liveView.js); `name` goes into the file name.
 */
export default function RenderQualityControls({sceneRef, name = 'view', buttonStyle}) {
  const [choice, setChoice] = useState(readQualityChoice)
  const [busy, setBusy] = useState(false)
  useEffect(() => subscribeQuality(setChoice), [])
  const view = () => sceneRef.current?.liveView
  const level = view()?.quality
  const save = async () => {
    const live = view(); if (!live) return
    setBusy(true)
    try { downloadBlob(await live.savePicture(), `${name}-${new Date().toISOString().slice(0, 10)}.png`) } catch (error) { console.error(error) } finally { setBusy(false) }
  }
  const style = buttonStyle ? buttonStyle(false) : undefined
  return <>
    <label title="Render quality for every 3D view. Auto picks High on a graphics card and Standard or Draft on integrated graphics. Draft is the fastest: lower resolution, no furniture shadows." style={{display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13}}>
      Quality
      <select aria-label="Render quality" value={choice} onChange={event => setQualityChoice(event.target.value)} style={{padding: '7px 8px', borderRadius: 9, border: '1px solid #cbd5e1'}}>
        {QUALITY_CHOICES.map(key => <option key={key} value={key}>{key === 'auto' && choice === 'auto' && level ? `Auto (${QUALITY[level].label})` : LABELS[key]}</option>)}
      </select>
    </label>
    <button onClick={save} disabled={busy} style={style} title="Download this view as a high-resolution PNG (about 3000 pixels wide at High quality)">{busy ? 'Saving picture…' : 'Save picture'}</button>
  </>
}
