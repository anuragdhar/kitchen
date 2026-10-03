import React from 'react'
import {formatDimensions} from './render/dimensionPick.js'

// Shows the size of the furniture or cabinet clicked in a live 3D view (render/dimensionPick.js).
export default function ItemDimensionsPanel({item, onClear}){
  if(!item) return <div style={{padding:'10px 16px',borderTop:'1px solid #e2e8f0',fontSize:13,color:'#64748b'}}>Click any furniture or cabinet in the 3D view to see its size.</div>
  return <div role="status" aria-label="Selected item size" style={{padding:'12px 16px',borderTop:'1px solid #e2e8f0',background:'#fff7ed',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
    <div><b style={{color:'#9a3412'}}>{item.name}</b><div style={{fontSize:14,color:'#1f2937',marginTop:3,fontWeight:700}}>{formatDimensions(item)}</div>
      <div style={{fontSize:11,color:'#64748b',marginTop:2}}>Outer box of the item as modelled (a round or angled item reports the box around it). Concept sizes, not site measurements.</div></div>
    <button onClick={onClear} style={{padding:'7px 11px',borderRadius:9,border:'1px solid #cbd5e1',background:'#fff',fontWeight:800,cursor:'pointer'}}>Clear</button>
  </div>
}
