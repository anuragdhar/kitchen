// Extracted verbatim from App.jsx's inline ReferencesView component and its
// module-level REFERENCE_LINKS constant (see docs/REFACTOR_PLAN.md Phase 4).
// REFERENCE_LINKS had no other reader in App.jsx, so it moved here whole
// rather than being threaded through as a prop. The displayed source path
// is also corrected here: Phase 0 moved docs/references.md to
// docs/archive/references.md, but this label still said the old path.
import React from 'react'

const REFERENCE_LINKS=[
  {
    title:'Galley Kitchen Ideas - SoloTravely',
    url:'https://solotravely.com/galley-kitchen-ideas/?utm_source=Pinterest&utm_medium=organic',
    source:'solotravely.com',
    note:'Primary reference link from docs/references.md.'
  }
]

export default function ReferencesView() {
  return (
    <div style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <h3 style={{margin:'0 0 10px 0'}}>Reference Links</h3>
        <div style={{fontSize:12,color:'#61584f',fontWeight:700}}>Source file: docs/archive/references.md</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
        {REFERENCE_LINKS.map(link=>(
          <div key={link.url} style={{border:'1px solid #ddd4c8',borderRadius:8,padding:12,background:'#fffefb'}}>
            <div style={{fontWeight:900,fontSize:15,marginBottom:6}}>{link.title}</div>
            <div style={{fontSize:12,color:'#61584f',marginBottom:8}}>{link.source}</div>
            <a href={link.url} target="_blank" rel="noreferrer" style={{display:'block',fontSize:13,fontWeight:800,color:'#0c4a6e',overflowWrap:'anywhere',marginBottom:8}}>
              {link.url}
            </a>
            <div style={{fontSize:12,color:'#4b4037',lineHeight:1.45}}>{link.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
