import React,{useState} from 'react';
import seed from '../../../inspiration/library.json';
import {HOME_ROOMS} from './rooms.mjs';
import {mergeInspiration,parseInspiration,validateInspiration} from './inspiration.mjs';
const KEY='home-interior.inspiration.v1';
export default function InspirationLibrary(){
  const [loaded]=useState(()=>{try{const raw=localStorage.getItem(KEY);return {data:raw?parseInspiration(raw):validateInspiration(seed)};}catch(e){return {data:validateInspiration(seed),error:String(e.message)};}});
  const [data,setData]=useState(loaded.data),[error,setError]=useState(loaded.error||''),[blocked,setBlocked]=useState(!!loaded.error);
  const [notice,setNotice]=useState('');
  const [room,setRoom]=useState('entry'),[title,setTitle]=useState(''),[url,setUrl]=useState(''),[tags,setTags]=useState(''),[notes,setNotes]=useState('');
  const [filter,setFilter]=useState('all');
  const save=next=>{if(blocked)throw new Error('Stored references could not be read. Export a backup and import a valid library before editing.');const clean=validateInspiration(next);localStorage.setItem(KEY,JSON.stringify(clean));setData(clean);setError('');setNotice('');};
  const addProjectReferences=()=>{try{const next=mergeInspiration(data,seed);const added=next.items.length-data.items.length;if(added)save(next);setNotice(added?`Added ${added} project reference${added===1?'':'s'}. Your existing notes and decisions were kept.`:'All project references are already in this browser library.');}catch(e){setError(e.message);}};
  const exportData=()=>{const raw=blocked?localStorage.getItem(KEY):JSON.stringify(data,null,2);const link=document.createElement('a');const objectUrl=URL.createObjectURL(new Blob([raw||''],{type:'application/json'}));link.href=objectUrl;link.download=blocked?'inspiration-recovery.json':'inspiration-library.json';link.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);};
  const importFile=async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;try{if(file.size>2_000_000)throw new Error('File too large.');const clean=parseInspiration(await file.text());if(!window.confirm('Replace this browser’s inspiration library with the selected file? A backup will be retained.'))return;const old=localStorage.getItem(KEY);if(old!==null)localStorage.setItem(`${KEY}.previous`,old);localStorage.setItem(KEY,JSON.stringify(clean));setData(clean);setBlocked(false);setError('');setNotice('');}catch(e){setError(e.message);}};
  return <section aria-label="Inspiration library">
    <h3>Inspiration, from entry to balcony</h3><p>Save Pinterest pins or other reference links, what you like, and the room they belong to. Images are not scraped. Browser edits are local; export the JSON to commit it to <code>inspiration/library.json</code>.</p>
    <p>After updating from GitHub, use Add project references to merge new links without replacing your saved notes or decisions. Removed references stay removed until you explicitly add project references again.</p>
    {error&&<p role="alert">{error}</p>}
    {notice&&<p role="status">{notice}</p>}
    <div className="interior-row"><button disabled={blocked} onClick={addProjectReferences}>Add project references</button><button onClick={exportData}>Export reference library</button><label>Import library <input aria-label="Import inspiration library" type="file" accept=".json" onChange={importFile}/></label></div>
    <form onSubmit={event=>{event.preventDefault();try{save({...data,items:[...data.items,{id:crypto.randomUUID(),room,title,url,tags:tags.split(',').map(x=>x.trim()).filter(Boolean),notes,status:'idea'}]});setTitle('');setUrl('');setNotes('');setTags('');}catch(e){setError(e.message);}}}>
      <div className="interior-grid"><label>Room<select value={room} onChange={e=>setRoom(e.target.value)}>{HOME_ROOMS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label><label>Title<input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label></div>
      <label>Reference URL<input required type="url" placeholder="https://www.pinterest.com/pin/..." value={url} onChange={e=>setUrl(e.target.value)}/></label>
      <label>Tags, comma separated<input value={tags} onChange={e=>setTags(e.target.value)}/></label><label>What should we borrow from this idea?<textarea maxLength={4000} value={notes} onChange={e=>setNotes(e.target.value)}/></label><button disabled={blocked} type="submit">Save inspiration</button>
    </form>
    <label>Filter references<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All rooms, in tour order</option>{HOME_ROOMS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
    {HOME_ROOMS.filter(r=>filter==='all'||filter===r.id).map(r=>{const items=data.items.filter(i=>i.room===r.id);return <section key={r.id}><h4>{r.label} <small>({items.length})</small></h4>{!items.length&&<p className="interior-muted">No references saved yet.</p>}{items.map(item=><article className="interior-card" key={item.id}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title} ↗</a><p>{item.notes}</p><small>{item.tags.join(' · ')}</small><label>Decision<select value={item.status} onChange={e=>{try{save({...data,items:data.items.map(i=>i.id===item.id?{...i,status:e.target.value}:i)});}catch(err){setError(err.message);}}}>{['idea','selected','rejected'].map(s=><option key={s}>{s}</option>)}</select></label><button onClick={()=>{if(window.confirm('Remove this reference?'))try{save({...data,items:data.items.filter(i=>i.id!==item.id)});}catch(err){setError(err.message);}}}>Remove reference</button></article>)}</section>})}
  </section>;
}
