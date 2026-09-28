import React from 'react'

const views = [
  ['Drawing Room', 'drawing-room', 'Existing chandelier, wall wash and reading light'],
  ['Lobby / Dining', 'lobby-dining', 'Dining task light with warm background light'],
  ['Bedroom 1', 'bedroom-one', 'Soft ambient and bedside task light'],
  ['Bedroom 3', 'bedroom-three', 'Soft ambient and dressing mirror light'],
  ['Study / Bedroom 2', 'study-bedroom-two', 'Desk task light with ambient light'],
  ['Kitchen', 'kitchen', 'Counter task lights and ambient light'],
  ['Main entry', 'main-entry', 'Entry and shoe storage accent'],
  ['Balcony office', 'balcony-office', 'Compact desk task light'],
  ['Terrace', 'terrace', 'Warm outdoor accent concept'],
  ['Pooja Ghar', 'pooja-ghar', 'Warm alcove light above the raised platform'],
  ['Storage', 'storage', 'Warm light for the rolling racks'],
  ['Bedroom 1 balcony', 'bedroom-one-balcony', 'Soft light for the enclosed balcony and desk'],
]

export default function HomeLightingGallery() {
  return <section style={{padding:'22px 20px',borderTop:'1px solid #e2e8f0',background:'#faf7f2'}}>
    <h2 style={{fontSize:22,margin:'0 0 6px',color:'#30281f'}}>Lighting and finish previews</h2>
    <p style={{margin:'0 0 16px',color:'#625a51',maxWidth:780}}>Warm beige plaster, sand ceilings and layered lighting across the current home layout. These Blender images show finish and fixture placement concepts; the furnishings and kitchen details remain simplified.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
      {views.map(([title,file,note])=><figure key={file} style={{margin:0,background:'#fff',border:'1px solid #e8ddd1',borderRadius:12,overflow:'hidden'}}>
        <img loading="lazy" src={`/renders/home-lighting/${file}.png`} alt={`${title} warm lighting and wall finish preview`} style={{display:'block',width:'100%',height:'auto'}}/>
        <figcaption style={{padding:'9px 12px 12px',color:'#4b4035'}}><strong>{title}</strong><div style={{fontSize:13,marginTop:3}}>{note}</div></figcaption>
      </figure>)}
    </div>
    <h3 style={{fontSize:18,margin:'24px 0 8px',color:'#30281f'}}>Guided whole-home tour</h3>
    <p style={{fontSize:13,color:'#625a51',margin:'0 0 10px'}}>The camera follows the rooms from above the walls so each area stays visible.</p>
    <video controls preload="metadata" style={{width:'100%',maxWidth:900,borderRadius:12,background:'#191919'}} src="/renders/home-lighting/A501-overhead-tour.mp4">Your browser cannot play the tour video.</video>
  </section>
}
