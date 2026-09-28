import {assertRoom} from './rooms.mjs';
const text=(value,field,max=2000)=>{if(typeof value!=='string'||value.length>max)throw new Error(`Invalid ${field}`);return value.trim();};
export function validateInspiration(input) {
  if(!input||input.schemaVersion!==1||!Array.isArray(input.items)||input.items.length>1000)throw new Error('Expected inspiration schemaVersion 1 and up to 1000 items.');
  const ids=new Set();
  return {schemaVersion:1,items:input.items.map(item=>{
    if(!item||typeof item!=='object')throw new Error('Invalid inspiration item.');
    const id=text(item.id,'id',100); if(!id||ids.has(id))throw new Error('Duplicate or empty inspiration ID.'); ids.add(id);
    const title=text(item.title,'title',200); if(!title)throw new Error('A title is required.');
    const url=new URL(text(item.url,'URL',2000));
    if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use a public HTTPS reference URL without credentials.');
    if(!Array.isArray(item.tags)||item.tags.length>20)throw new Error('Use at most 20 tags.');
    const status=item.status??'idea';if(!['idea','selected','rejected'].includes(status))throw new Error('Invalid decision status.');
    return {id,room:assertRoom(item.room),title,url:url.href,tags:item.tags.map(tag=>text(tag,'tag',60)).filter(Boolean),notes:text(item.notes??'','notes',4000),status};
  })};
}
export function parseInspiration(raw) {
  if(typeof raw!=='string'||raw.length>2_000_000)throw new Error('Inspiration JSON exceeds the 2 MB limit.');
  return validateInspiration(JSON.parse(raw));
}

// A pin may have a regional host or tracking query. Deduplicate within a room,
// while allowing the same reference to inspire more than one room.
function referenceKey(item) {
  const url=new URL(item.url);
  const pin=(url.hostname==='pinterest.com'||url.hostname.endsWith('.pinterest.com'))
    &&url.pathname.match(/^\/pin\/(\d+)\/?$/);
  return JSON.stringify([item.room,pin?`pinterest:${pin[1]}`:url.href]);
}

// Explicit, additive merge: browser notes/decisions win and neither input mutates.
// Do not call automatically on load: that would resurrect references users removed.
export function mergeInspiration(current,incoming) {
  const clean=validateInspiration(current);
  const additions=validateInspiration(incoming);
  const ids=new Set(clean.items.map(item=>item.id));
  const references=new Set(clean.items.map(referenceKey));
  for(const item of additions.items){
    const key=referenceKey(item);
    if(ids.has(item.id)||references.has(key))continue;
    clean.items.push(item);
    ids.add(item.id);
    references.add(key);
  }
  // Apply the existing combined-library limit before the caller saves anything.
  return validateInspiration(clean);
}
