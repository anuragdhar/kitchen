import React,{useState} from 'react'

export default function WallSelectionPanel({selection,note,onNoteChange,onClear}){
  const [copied,setCopied]=useState(false)
  if(!selection) return <div style={{padding:'12px 16px',borderTop:'1px solid #e2e8f0',fontSize:13,color:'#64748b'}}>Click a wall in the 3D view to mark its location and add a note.</div>
  const message=`Wall selection: ${selection.label}. ${note.trim()||'No note added.'}`
  const copy=async()=>{
    try{await navigator.clipboard.writeText(message);setCopied(true);setTimeout(()=>setCopied(false),2400)}
    catch{setCopied(false)}
  }
  return <div style={{padding:'14px 16px',borderTop:'1px solid #e2e8f0',background:'#fff9eb'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
      <div><b style={{color:'#7c4700'}}>Marked wall</b><div style={{fontSize:13,color:'#334155',marginTop:3}}>{selection.label}</div></div>
      <button onClick={onClear} style={buttonStyle}>Clear mark</button>
    </div>
    <label style={{display:'block',marginTop:10,fontSize:13,fontWeight:700,color:'#334155'}} htmlFor="wall-selection-note">What should go here?</label>
    <textarea id="wall-selection-note" value={note} onChange={event=>onNoteChange(event.target.value)} placeholder="Example: Place a 20-inch-deep, ceiling-height wardrobe here, opening into Bedroom 1." rows={2} style={{boxSizing:'border-box',width:'100%',marginTop:5,padding:10,border:'1px solid #cbd5e1',borderRadius:9,font:'inherit',resize:'vertical'}}/>
    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginTop:8}}>
      <button onClick={copy} style={{...buttonStyle,background:'#172033',color:'#fff'}}>{copied?'Copied':'Copy wall location and note'}</button>
      <span style={{fontSize:12,color:'#64748b'}}>Paste the copied text into this chat so I can use the exact location.</span>
    </div>
  </div>
}

const buttonStyle={padding:'8px 12px',borderRadius:9,border:'1px solid #cbd5e1',background:'#fff',color:'#172033',fontWeight:800,cursor:'pointer'}
