import React,{useEffect,useRef,useState} from 'react';
import {MAX_PHOTOS} from './inspiration.mjs';
import {PHOTO_ACCEPT,readPhoto} from './inspirationMedia.mjs';
import './inspiration-photos.css';

function Photo({photo,onOpen}){
  const [state,setState]=useState({src:'',error:''});
  useEffect(()=>{
    let alive=true,objectUrl;
    setState({src:'',error:''});
    readPhoto(photo).then(blob=>{
      if(!alive)return;
      objectUrl=URL.createObjectURL(blob);setState({src:objectUrl,error:''});
    }).catch(error=>{if(alive)setState({src:'',error:error.message});});
    return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[photo.src]);
  if(state.error)return <p className="inspiration-photo-missing" role="status">{state.error}</p>;
  if(!state.src)return <p className="inspiration-photo-missing">Loading photo…</p>;
  const image=<img src={state.src} alt={photo.caption||'Inspiration reference photo'} loading="lazy" onError={()=>setState({src:'',error:'This photo could not be displayed. Upload it again or restore a backup.'})}/>;
  return onOpen?<button type="button" className="inspiration-photo-open" onClick={onOpen} aria-label={`Enlarge ${photo.caption||'reference photo'}`}>{image}<span>View full size ↗</span></button>:image;
}

export function PhotoPicker({label,disabled,onFiles}){
  return <label className="inspiration-upload">{label}<input type="file" accept={PHOTO_ACCEPT} multiple disabled={disabled} onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value='';if(files.length)onFiles(files);}}/></label>;
}

export default function InspirationPhotos({item,disabled,onUpload,onChange}){
  const photos=item.photos??[],dialog=useRef(null),[active,setActive]=useState(0),[viewerOpen,setViewerOpen]=useState(false);
  const show=index=>{setActive(index);setViewerOpen(true);dialog.current?.showModal();};
  const close=()=>dialog.current?.close();
  const selected=photos[active];
  const handleKey=event=>{
    if(event.key==='Escape')event.stopPropagation();
    if(!photos.length)return;
    if(event.key==='ArrowRight'){event.preventDefault();setActive(index=>(index+1)%photos.length);}
    if(event.key==='ArrowLeft'){event.preventDefault();setActive(index=>(index+photos.length-1)%photos.length);}
  };
  return <section className="inspiration-photos" aria-label={`Photos for ${item.title}`}>
    <div className="interior-row"><strong>Photos & video screenshots <small>({photos.length}/{MAX_PHOTOS})</small></strong><span className="interior-muted">First photo is the cover</span></div>
    {!photos.length&&<p className="inspiration-empty">No photos saved yet. Upload original photos or screenshots from the reference link. Missing Pinterest media is never replaced with a different idea.</p>}
    <div className="inspiration-photo-grid">{photos.map((photo,index)=><figure key={photo.id} className="inspiration-photo-tile">
      <Photo photo={photo} onOpen={()=>show(index)}/>
      <figcaption>
        <small>{index===0?'Cover · ':''}{photo.kind==='video-frame'?`Video frame${photo.timeSeconds!==undefined?` · ${photo.timeSeconds}s`:''}`:'Photo / screenshot'}</small>
        <label>Caption<textarea aria-label={`Caption for photo ${index+1}`} maxLength={500} defaultValue={photo.caption} key={`${photo.id}-${photo.caption}`} disabled={disabled} onBlur={event=>{if(event.target.value!==photo.caption)onChange(photos.map(p=>p.id===photo.id?{...p,caption:event.target.value}:p));}}/></label>
        <div className="inspiration-photo-actions">{index>0&&<button type="button" disabled={disabled} onClick={()=>onChange([photo,...photos.filter(p=>p.id!==photo.id)])}>Make cover</button>}<button type="button" disabled={disabled} aria-label={`Remove photo ${index+1}`} onClick={()=>{if(window.confirm('Remove this photo from the reference? The original source is not deleted.'))onChange(photos.filter(p=>p.id!==photo.id));}}>Remove photo</button></div>
        {photo.sourceUrl&&<a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original source ↗</a>}
      </figcaption>
    </figure>)}</div>
    <PhotoPicker label="Upload photos / screenshots" disabled={disabled||photos.length>=MAX_PHOTOS} onFiles={onUpload}/>
    <small className="interior-muted">Select several JPG, PNG or WebP files. Up to 20 MiB each; stored copies are resized to 1600 px. Uploads stay in this browser until exported.</small>
    <dialog className="inspiration-lightbox" ref={dialog} aria-label={`Full-size photos for ${item.title}`} onKeyDown={handleKey} onClose={()=>setViewerOpen(false)}>
      <header className="interior-row"><strong>{item.title} · {active+1} / {photos.length}</strong><button type="button" onClick={close} autoFocus>Close photo ✕</button></header>
      {viewerOpen&&selected&&<><Photo photo={selected}/><p>{selected.caption}</p>{selected.kind==='video-frame'&&<p>Original video frame{selected.timeSeconds!==undefined?` at ${selected.timeSeconds} seconds`:''}</p>}</>}
      {photos.length>1&&<div className="interior-row"><button type="button" onClick={()=>setActive(index=>(index+photos.length-1)%photos.length)}>← Previous photo</button><button type="button" onClick={()=>setActive(index=>(index+1)%photos.length)}>Next photo →</button></div>}
    </dialog>
  </section>;
}
