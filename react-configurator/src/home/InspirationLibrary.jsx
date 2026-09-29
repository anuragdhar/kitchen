import React,{useEffect,useRef,useState} from 'react';
import seed from '../../../inspiration/library.json';
import {HOME_ROOMS} from './rooms.mjs';
import {MAX_PHOTOS,mergeInspiration,parseInspiration,validateInspiration} from './inspiration.mjs';
import {exportPhotoLibrary,prepareLibraryImport,preparePhotos,projectSyncAvailable,storePhotos,syncPhotosToProject} from './inspirationMedia.mjs';
import InspirationPhotos,{PhotoPicker} from './InspirationPhotos.jsx';
const KEY='home-interior.inspiration.v1';
const photoCount=data=>data.items.reduce((sum,item)=>sum+(item.photos?.length??0),0);
function download(blob,name){const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export default function InspirationLibrary(){
  const [loaded]=useState(()=>{try{const raw=localStorage.getItem(KEY);return {raw,data:raw?parseInspiration(raw):validateInspiration(seed)};}catch(error){return {raw:null,data:validateInspiration(seed),error:error.message};}});
  const [data,setData]=useState(loaded.data),[error,setError]=useState(loaded.error||''),[blocked,setBlocked]=useState(!!loaded.error);
  const [notice,setNotice]=useState(''),[busy,setBusy]=useState('');
  const [room,setRoom]=useState('entry'),[title,setTitle]=useState(''),[url,setUrl]=useState(''),[tags,setTags]=useState(''),[notes,setNotes]=useState(''),[pending,setPending]=useState([]);
  const [filter,setFilter]=useState('all'),[canSync,setCanSync]=useState(false);
  const current=useRef(data),rawRef=useRef(loaded.raw),working=useRef(false),alive=useRef(true);
  useEffect(()=>{alive.current=true;projectSyncAvailable().then(ok=>{if(alive.current)setCanSync(ok);});return()=>{alive.current=false;};},[]);
  const assertCurrent=()=>{
    if(!alive.current)throw new Error('The inspiration view was closed; the edit was cancelled.');
    if(localStorage.getItem(KEY)!==rawRef.current)throw new Error('This library changed in another tab. Export your current library, then reopen this view before editing.');
  };
  const save=next=>{
    if(blocked)throw new Error('Stored references could not be read. Export a recovery backup and import a valid library before editing.');
    assertCurrent();
    const clean=parseInspiration(JSON.stringify(next)),raw=JSON.stringify(clean);
    localStorage.setItem(KEY,raw);rawRef.current=raw;current.current=clean;setData(clean);setError('');setNotice('');
  };
  const run=async(label,operation)=>{
    if(working.current)return;working.current=true;setBusy(label);setError('');setNotice('');
    try{await operation();}catch(error){if(alive.current)setError(error.message||String(error));}
    finally{working.current=false;if(alive.current)setBusy('');}
  };
  const changeItem=(id,patch)=>{try{save({...current.current,items:current.current.items.map(item=>item.id===id?{...item,...patch}:item)});}catch(error){setError(error.message);}};
  const addProjectReferences=()=>{
    try{
      const before=current.current,next=mergeInspiration(before,seed),added=next.items.length-before.items.length,photos=photoCount(next)-photoCount(before);
      if(added||photos)save(next);
      setNotice(added||photos?`Added ${added} references and ${photos} photos. Your notes, decisions and existing cover order were kept.`:'All available project references and photos are already in this library.');
    }catch(error){setError(error.message);}
  };
  const exportData=()=>run('Preparing library backup…',async()=>{
    if(blocked){download(new Blob([localStorage.getItem(KEY)||''],{type:'application/json'}),'inspiration-recovery.json');return;}
    const blob=await exportPhotoLibrary(current.current);
    if(alive.current){download(blob,'inspiration-library-with-photos.zip');setNotice('Backup includes the reference library and every photo. Keep it before clearing browser data.');}
  });
  const saveToProject=()=>run('Saving photos to the project folder…',async()=>{
    const result=await syncPhotosToProject(current.current);
    if(alive.current)setNotice(result.photos?`Saved ${result.photos} photos for ${result.references} references to react-configurator/public/inspiration-media and inspiration/library.json. Commit them to keep them in the repository.`:'No browser-only photos to save: every photo is already in the project folder.');
  });
  const exportMetadata=()=>{try{download(new Blob([JSON.stringify(current.current,null,2)],{type:'application/json'}),'inspiration-library.json');setNotice('Metadata JSON only: uploaded photo bytes are NOT included. Use the ZIP backup to move or preserve uploads.');}catch(error){setError(error.message);}};
  const importFile=event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    run('Validating library and photos…',async()=>{
      const expected=localStorage.getItem(KEY),prepared=await prepareLibraryImport(file);
      if(!alive.current)return;
      if(localStorage.getItem(KEY)!==expected)throw new Error('The library changed while the file was being read. Import cancelled; retry after reopening the view.');
      if(!window.confirm('Replace this browser’s inspiration library? Previous metadata and stored photos are retained for recovery. Export a ZIP first to keep an independent backup.'))return;
      await storePhotos(prepared.assets);
      if(!alive.current)return;
      if(localStorage.getItem(KEY)!==expected)throw new Error('The library changed while photos were being stored. Import cancelled.');
      if(expected!==null)localStorage.setItem(`${KEY}.previous`,expected);
      const raw=JSON.stringify(prepared.library);localStorage.setItem(KEY,raw);
      current.current=prepared.library;rawRef.current=raw;setData(prepared.library);setBlocked(false);setError('');setPending([]);setNotice('Library imported with its photos.');
    });
  };
  const upload=(id,files)=>run('Preparing and saving photos…',async()=>{
    const item=current.current.items.find(item=>item.id===id);if(!item)return;
    if((item.photos?.length??0)+files.length>MAX_PHOTOS)throw new Error(`A reference can contain at most ${MAX_PHOTOS} photos.`);
    const prepared=await preparePhotos(files,item.url);assertCurrent();
    const latest=current.current.items.find(item=>item.id===id);if(!latest)throw new Error('The reference was removed.');
    const next={...current.current,items:current.current.items.map(item=>item.id===id?{...item,photos:[...(item.photos??[]),...prepared.photos]}:item)};
    parseInspiration(JSON.stringify(next));await storePhotos(prepared.assets);save(next);
    setNotice(`Saved ${prepared.photos.length} photos in this browser. Export library + photos to back them up.`);
  });
  const add=event=>{
    event.preventDefault();run('Saving inspiration…',async()=>{
      const item={id:crypto.randomUUID(),room,title,url,tags:tags.split(',').map(x=>x.trim()).filter(Boolean),notes,status:'idea'};
      validateInspiration({schemaVersion:1,items:[item]});
      const prepared=await preparePhotos(pending,url);assertCurrent();
      if(prepared.photos.length)item.photos=prepared.photos;
      const next={...current.current,items:[...current.current.items,item]};parseInspiration(JSON.stringify(next));
      await storePhotos(prepared.assets);save(next);setTitle('');setUrl('');setNotes('');setTags('');setPending([]);setNotice('Inspiration saved.');
    });
  };
  const disabled=blocked||!!busy;
  return <section aria-label="Inspiration library" aria-busy={!!busy}>
    <h3>Inspiration, from entry to balcony</h3>
    <p>Keep the original reference link, photos, video screenshots and what you like together in each room. Upload several images to explain a mechanism or compare details.</p>
    <p className="interior-muted">Uploads are local to this browser, not automatically pushed to GitHub. Export library + photos for a portable backup. After a GitHub update, Add project references merges newly captured photos without replacing your notes or decisions.</p>
    {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{busy&&<p className="inspiration-busy" role="status">{busy}</p>}
    <div className="interior-row"><button disabled={disabled} onClick={addProjectReferences}>Add project references</button><button disabled={!!busy} onClick={exportData}>{blocked?'Export recovery backup':'Export library + photos'}</button><button disabled={disabled} onClick={exportMetadata}>Export metadata JSON</button>{canSync&&<button disabled={disabled} onClick={saveToProject} title="Local dev server only: copies your browser photos into the repository folders so they can be reviewed and committed.">Save photos to project folder</button>}<label>Import library<input aria-label="Import inspiration library" type="file" accept=".json,.zip" disabled={!!busy} onChange={importFile}/></label></div>
    <form onSubmit={add}><fieldset disabled={disabled} style={{border:0,padding:0,margin:0}}>
      <legend><strong>Add an inspiration</strong></legend>
      <div className="interior-grid"><label>Room<select value={room} onChange={event=>setRoom(event.target.value)}>{HOME_ROOMS.map(room=><option key={room.id} value={room.id}>{room.label}</option>)}</select></label><label>Title<input required maxLength={200} value={title} onChange={event=>setTitle(event.target.value)}/></label></div>
      <label>Reference URL<input required type="url" placeholder="https://www.pinterest.com/pin/..." value={url} onChange={event=>setUrl(event.target.value)}/></label>
      <label>Tags, comma separated<input value={tags} onChange={event=>setTags(event.target.value)}/></label><label>What should we borrow from this idea?<textarea maxLength={4000} value={notes} onChange={event=>setNotes(event.target.value)}/></label>
      <PhotoPicker label="Photos / screenshots for the new idea (optional)" disabled={disabled} onFiles={files=>{if(pending.length+files.length>MAX_PHOTOS){setError(`Choose at most ${MAX_PHOTOS} photos.`);return;}setPending(previous=>[...previous,...files]);}}/>
      {pending.length>0&&<div className="inspiration-pending"><p>{pending.length} selected: {pending.map(file=>file.name).join(', ')}</p><button type="button" onClick={()=>setPending([])}>Clear selected photos</button></div>}
      <button type="submit">Save inspiration</button>
    </fieldset></form>
    <label>Filter references<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">All rooms, in tour order</option>{HOME_ROOMS.map(room=><option key={room.id} value={room.id}>{room.label}</option>)}</select></label>
    {HOME_ROOMS.filter(room=>filter==='all'||filter===room.id).map(room=>{
      const items=data.items.filter(item=>item.room===room.id);
      return <section key={room.id}><h4>{room.label} <small>({items.length})</small></h4>{!items.length&&<p className="interior-muted">No references saved yet.</p>}{items.map(item=><article className="interior-card" key={item.id} data-inspiration-id={item.id}>
        <a href={item.url} target="_blank" rel="noopener noreferrer"><strong>{item.title} ↗</strong></a><p>{item.notes}</p><small>{item.tags.join(' · ')}</small>
        <InspirationPhotos item={item} disabled={disabled} onUpload={files=>upload(item.id,files)} onChange={photos=>changeItem(item.id,{photos})}/>
        <label>Decision<select disabled={disabled} value={item.status} onChange={event=>changeItem(item.id,{status:event.target.value})}>{['idea','selected','rejected'].map(status=><option key={status}>{status}</option>)}</select></label>
        <button disabled={disabled} onClick={()=>{if(window.confirm('Remove this reference?'))try{save({...current.current,items:current.current.items.filter(reference=>reference.id!==item.id)});}catch(error){setError(error.message);}}}>Remove reference</button>
      </article>)}</section>;
    })}
  </section>;
}
