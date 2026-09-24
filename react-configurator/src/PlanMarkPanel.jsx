import React,{useRef,useState} from 'react'

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))

export default function PlanMarkPanel({image,width,height,rooms,mark,onChange,onClose}){
  const startRef=useRef(null)
  const [draft,setDraft]=useState(null)
  const [copyStatus,setCopyStatus]=useState('')
  const hasMark=Number.isFinite(mark?.x1)&&Number.isFinite(mark?.y1)&&Number.isFinite(mark?.x2)&&Number.isFinite(mark?.y2)
  const shown=draft||mark
  const hasShown=Number.isFinite(shown?.x1)&&Number.isFinite(shown?.y1)&&Number.isFinite(shown?.x2)&&Number.isFinite(shown?.y2)
  const point=event=>{
    const rect=event.currentTarget.getBoundingClientRect()
    return {x:clamp(Math.round((event.clientX-rect.left)/rect.width*width),0,width),y:clamp(Math.round((event.clientY-rect.top)/rect.height*height),0,height)}
  }
  const onPointerDown=event=>{
    if(event.button!==0)return
    event.preventDefault()
    const start=point(event)
    startRef.current=start
    setDraft({...start,x1:start.x,y1:start.y,x2:start.x,y2:start.y})
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove=event=>{
    if(!startRef.current)return
    const end=point(event),start=startRef.current
    setDraft({x1:Math.min(start.x,end.x),y1:Math.min(start.y,end.y),x2:Math.max(start.x,end.x),y2:Math.max(start.y,end.y)})
  }
  const onPointerUp=event=>{
    const start=startRef.current
    if(!start)return
    const end=point(event)
    startRef.current=null
    setDraft(null)
    const x1=Math.min(start.x,end.x),y1=Math.min(start.y,end.y)
    const x2=Math.max(start.x,end.x),y2=Math.max(start.y,end.y)
    const next=x2-x1<8&&y2-y1<8
      ?{x1:clamp(start.x-8,0,width),y1:clamp(start.y-8,0,height),x2:clamp(start.x+8,0,width),y2:clamp(start.y+8,0,height)}
      :{x1,y1,x2,y2}
    onChange({...mark,...next})
  }
  const center=hasMark?{x:(mark.x1+mark.x2)/2,y:(mark.y1+mark.y2)/2}:null
  const nearest=center&&rooms.reduce((best,room)=>{
    const [left,top,right,bottom]=room.bounds
    const dx=Math.max(left-center.x,0,center.x-right),dy=Math.max(top-center.y,0,center.y-bottom)
    const distance=dx*dx+dy*dy
    return !best||distance<best.distance?{name:room.name,distance}:best
  },null)
  const label=hasMark?`Marked area near ${nearest.name}: plan x ${mark.x1} to ${mark.x2}, y ${mark.y1} to ${mark.y2}.`:'No area marked yet.'
  const copy=async()=>{
    try{await navigator.clipboard.writeText(`${label}${mark?.note?` Note: ${mark.note}`:''}`);setCopyStatus('Copied')}
    catch{setCopyStatus('Copy unavailable; the mark remains saved here.')}
  }
  return <div style={{padding:'16px clamp(12px,3vw,28px)',background:'#f7fafc'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:12}}>
      <div><b style={{fontSize:18,color:'#172033'}}>Mark an area on the floor plan</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>Drag to draw a rectangle. South is at the top; east is at the left. The mark and note are saved in this browser.</div></div>
      <button onClick={onClose} style={buttonStyle}>Back to 3D</button>
    </div>
    <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={()=>{startRef.current=null;setDraft(null)}}
      aria-label="Floor plan marking surface" style={{position:'relative',maxWidth:760,width:'100%',margin:'0 auto',cursor:'crosshair',touchAction:'none',userSelect:'none',border:'1px solid #aab9c6',borderRadius:10,overflow:'hidden',background:'#fff'}}>
      <img src={image} alt="Whole-home floor plan for marking an area" draggable={false} style={{display:'block',width:'100%',height:'auto',pointerEvents:'none'}}/>
      {hasShown&&<div aria-hidden="true" style={{position:'absolute',left:`${shown.x1/width*100}%`,top:`${shown.y1/height*100}%`,width:`${(shown.x2-shown.x1)/width*100}%`,height:`${(shown.y2-shown.y1)/height*100}%`,boxSizing:'border-box',border:'3px solid #e11d48',background:'rgba(225,29,72,.16)',pointerEvents:'none'}}/>}
    </div>
    <div style={{maxWidth:760,margin:'12px auto 0',display:'grid',gap:9}}>
      <div role="status" aria-label="Saved floor plan mark" style={{fontSize:13,fontWeight:700,color:'#172033'}}>{label}</div>
      <label style={{fontSize:13,fontWeight:700,color:'#172033'}}>Note for this area
        <textarea aria-label="Note for marked area" value={mark?.note||''} onChange={event=>onChange({...mark,note:event.target.value})} placeholder="For example: place the wardrobe here" rows={2} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:5,padding:9,border:'1px solid #aab9c6',borderRadius:8,font:'inherit',resize:'vertical'}}/>
      </label>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <button onClick={copy} disabled={!hasMark} style={buttonStyle}>Copy mark and note</button>
        <button onClick={()=>{onChange({note:''});setCopyStatus('')}} style={buttonStyle}>Clear mark</button>
        {copyStatus&&<span style={{fontSize:12,color:'#475569'}}>{copyStatus}</span>}
      </div>
      <div style={{fontSize:12,color:'#64748b'}}>Ask me to check your mark after drawing. I can read its room, coordinates, and note directly from this view.</div>
    </div>
  </div>
}

const buttonStyle={padding:'8px 12px',borderRadius:9,border:'1px solid #cbd5e1',background:'#fff',color:'#172033',fontWeight:800,cursor:'pointer'}
