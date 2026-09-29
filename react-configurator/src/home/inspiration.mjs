import {assertRoom} from './rooms.mjs';
export const MAX_PHOTOS = 12;
const text=(value,field,max=2000)=>{if(typeof value!=='string'||value.length>max)throw new Error(`Invalid ${field}`);return value.trim();};
const https=(value,field='URL')=>{const url=new URL(text(value,field,2000));if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use a public HTTPS reference URL without credentials.');return url.href;};
const safeId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);
export function validatePhotos(input){
  if(!Array.isArray(input)||input.length>MAX_PHOTOS)throw new Error(`Use at most ${MAX_PHOTOS} photos per reference.`);
  const ids=new Set();
  return input.map(photo=>{
    if(!photo||!safeId(photo.id)||ids.has(photo.id))throw new Error('Duplicate or invalid photo ID.');
    ids.add(photo.id);
    const src=text(photo.src,'photo source',300);
    if(!/^asset:[a-zA-Z0-9_-]{1,100}$/.test(src)&&!/^\/inspiration-media\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/.test(src))throw new Error('Photos must be uploaded or stored in the project inspiration-media folder.');
    const kind=photo.kind??'image';
    if(!['image','video-frame'].includes(kind))throw new Error('Invalid photo kind.');
    const clean={id:photo.id,src,caption:text(photo.caption??'','photo caption',500),kind};
    for(const field of ['sourceUrl','sourceMediaUrl'])if(photo[field]!==undefined)clean[field]=https(photo[field],field);
    if(photo.capturedAt!==undefined){clean.capturedAt=text(photo.capturedAt,'capture date',50);if(!Number.isFinite(Date.parse(clean.capturedAt)))throw new Error('Invalid capture date.');}
    if(photo.timeSeconds!==undefined){if(!Number.isFinite(photo.timeSeconds)||photo.timeSeconds<0||photo.timeSeconds>3600)throw new Error('Invalid frame timestamp.');clean.timeSeconds=photo.timeSeconds;}
    return clean;
  });
}
export function validateInspiration(input) {
  if(!input||input.schemaVersion!==1||!Array.isArray(input.items)||input.items.length>1000)throw new Error('Expected inspiration schemaVersion 1 and up to 1000 items.');
  const ids=new Set();
  return {schemaVersion:1,items:input.items.map(item=>{
    if(!item||typeof item!=='object')throw new Error('Invalid inspiration item.');
    const id=text(item.id,'id',100); if(!id||ids.has(id))throw new Error('Duplicate or empty inspiration ID.'); ids.add(id);
    const title=text(item.title,'title',200); if(!title)throw new Error('A title is required.');
    const url=https(item.url);
    if(!Array.isArray(item.tags)||item.tags.length>20)throw new Error('Use at most 20 tags.');
    const status=item.status??'idea';if(!['idea','selected','rejected'].includes(status))throw new Error('Invalid decision status.');
    const clean={id,room:assertRoom(item.room),title,url,tags:item.tags.map(tag=>text(tag,'tag',60)).filter(Boolean),notes:text(item.notes??'','notes',4000),status};
    // Optional additive field: legacy schema-1 libraries round-trip unchanged.
    if(item.photos!==undefined)clean.photos=validatePhotos(item.photos);
    return clean;
  })};
}
export function parseInspiration(raw) {
  if(typeof raw!=='string'||raw.length>2_000_000)throw new Error('Inspiration JSON exceeds the 2 MB limit.');
  return validateInspiration(JSON.parse(raw));
}

// Regional Pinterest hosts/tracking queries identify the same pin within a room.
function referenceKey(item) {
  const url=new URL(item.url);
  const pin=(url.hostname==='pinterest.com'||url.hostname.endsWith('.pinterest.com'))&&url.pathname.match(/^\/pin\/(\d+)\/?$/);
  return JSON.stringify([item.room,pin?`pinterest:${pin[1]}`:url.href]);
}

// Explicit additive merge only. Never resurrect removed references/photos on load.
// Local notes, decisions, photo captions and cover order always win.
export function mergeInspiration(current,incoming) {
  const clean=validateInspiration(current), additions=validateInspiration(incoming);
  const ids=new Map(clean.items.map(item=>[item.id,item]));
  const references=new Map(clean.items.map(item=>[referenceKey(item),item]));
  for(const item of additions.items){
    const key=referenceKey(item), existing=references.get(key);
    if(existing){
      if(item.photos?.length){
        const photos=existing.photos??[];
        const knownIds=new Set(photos.map(p=>p.id)), knownSources=new Set(photos.map(p=>p.src));
        const extra=item.photos.filter(p=>!knownIds.has(p.id)&&!knownSources.has(p.src));
        if(extra.length)existing.photos=[...photos,...extra.slice(0,MAX_PHOTOS-photos.length)];
      }
      continue;
    }
    if(ids.has(item.id))continue; // An unrelated ID collision must not overwrite data.
    clean.items.push(item);ids.set(item.id,item);references.set(key,item);
  }
  return validateInspiration(clean);
}
