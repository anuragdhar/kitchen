import JSZip from 'jszip';
import {MAX_PHOTOS,parseInspiration,validateInspiration} from './inspiration.mjs';

const DB='home-interior.inspiration.photos.v1';
const MAX_IMAGE=2*1024*1024, MAX_ARCHIVE=50*1024*1024;
export const PHOTO_ACCEPT='image/jpeg,image/png,image/webp';
export const photoUrl=src=>`${import.meta.env?.BASE_URL??'/'}${src.slice(1)}`;

function database(){
  return new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(new Error('Photo storage is unavailable in this browser.'));return;}
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('photos');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error??new Error('Could not open photo storage.'));
    request.onblocked=()=>reject(new Error('Photo storage is blocked. Close other app tabs and retry.'));
  });
}
export async function storePhotos(assets){
  if(!assets.length)return;
  const db=await database();
  try{await new Promise((resolve,reject)=>{
    const tx=db.transaction('photos','readwrite');
    for(const {id,blob} of assets)tx.objectStore('photos').put(blob,id);
    tx.oncomplete=resolve;
    tx.onerror=tx.onabort=()=>reject(tx.error??new Error('Photo storage is full or unavailable. Export a backup before clearing browser data.'));
  });}finally{db.close();}
}
async function storedPhoto(id){
  const db=await database();
  try{return await new Promise((resolve,reject)=>{
    const request=db.transaction('photos').objectStore('photos').get(id);
    request.onsuccess=()=>request.result instanceof Blob?resolve(request.result):reject(new Error('Photo is missing from this browser. Import the library + photos ZIP backup.'));
    request.onerror=()=>reject(request.error);
  });}finally{db.close();}
}
export async function readPhoto(photo){
  if(photo.src.startsWith('asset:'))return storedPhoto(photo.src.slice(6));
  const response=await fetch(photoUrl(photo.src));
  if(!response.ok)throw new Error('Project photo is unavailable. Update the app or upload a screenshot.');
  const blob=await response.blob();
  if(blob.size>MAX_IMAGE||!['image/jpeg','image/png','image/webp'].includes(blob.type))throw new Error('Invalid project image response.');
  return blob;
}

export async function compressPhoto(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use JPG, PNG or WebP. Export HEIC photos as JPG; capture video screenshots as images.');
  if(!file.size||file.size>20*1024*1024)throw new Error('Each source photo must be between 1 byte and 20 MiB.');
  const objectUrl=URL.createObjectURL(file), image=new Image();
  try{
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('This file is not a readable image.'));image.src=objectUrl;});
    if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40_000_000)throw new Error('Image exceeds the 40 megapixel limit. Resize it before uploading.');
    const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');if(!context)throw new Error('Image processing is unavailable.');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.86));
    if(!blob||blob.size>MAX_IMAGE)throw new Error('Photo is too large after compression. Resize it before uploading.');
    return blob;
  }finally{URL.revokeObjectURL(objectUrl);image.src='';}
}
// Browsers give clipboard images a generic name ("image.png"); rename so captions read sensibly.
const pastedFile=(blob,index,total)=>new File([blob],`Pasted image${total>1?` ${index+1}`:''}.${blob.type.split('/')[1]}`,{type:blob.type});
export function clipboardImages(blobs){
  const images=blobs.filter(blob=>blob&&blob.type.startsWith('image/'));
  return images.map((blob,index)=>pastedFile(blob,index,images.length));
}
export const imagesFromPasteEvent=event=>clipboardImages(Array.from(event.clipboardData?.items??[]).filter(item=>item.kind==='file').map(item=>item.getAsFile()));
export async function imagesFromClipboardApi(){
  if(!navigator.clipboard?.read)throw new Error('This browser cannot read the clipboard from a button. Click the paste box and press Ctrl+V instead.');
  let entries;
  try{entries=await navigator.clipboard.read();}
  catch{throw new Error('Clipboard access was blocked. Click the paste box and press Ctrl+V instead.');}
  const blobs=[];
  for(const entry of entries){const type=entry.types.find(type=>type.startsWith('image/'));if(type)blobs.push(await entry.getType(type));}
  return clipboardImages(blobs);
}
export async function preparePhotos(files,sourceUrl){
  if(files.length>MAX_PHOTOS)throw new Error(`Choose at most ${MAX_PHOTOS} photos.`);
  const photos=[],assets=[];
  for(const file of files){
    const id=`upload-${crypto.randomUUID()}`, blob=await compressPhoto(file);
    assets.push({id,blob});
    photos.push({id,src:`asset:${id}`,caption:file.name.replace(/\.[^.]+$/,'').slice(0,500),kind:'image',...(sourceUrl?{sourceUrl}:{})});
  }
  return {photos,assets};
}

// A bounded stream avoids expanding an untrusted ZIP entry without a size limit.
function readEntry(entry,limit){
  if(!entry||entry.dir)throw new Error('The backup is missing a required file.');
  return new Promise((resolve,reject)=>{
    let size=0,done=false;const chunks=[];
    const stream=entry.internalStream('uint8array');
    stream.on('data',chunk=>{
      if(done)return;
      size+=chunk.length;
      if(size>limit){done=true;stream.pause();reject(new Error('Backup entry exceeds the size limit.'));return;}
      chunks.push(chunk);
    }).on('error',reject).on('end',()=>{
      if(done)return;const result=new Uint8Array(size);let offset=0;
      for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}resolve(result);
    }).resume();
  });
}
function imageMime(bytes){
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return 'image/png';
  const text=new TextDecoder().decode(bytes.slice(0,12));
  if(text.startsWith('RIFF')&&text.endsWith('WEBP'))return 'image/webp';
  throw new Error('Backup contains an unsupported image.');
}
export async function exportPhotoLibrary(input){
  const data=validateInspiration(input),zip=new JSZip(),sources=new Map();let total=0;
  for(const item of data.items)for(const photo of item.photos??[]){
    if(!sources.has(photo.src)){
      const blob=await readPhoto(photo);total+=blob.size;
      if(total>MAX_ARCHIVE)throw new Error('Photo backup exceeds the 50 MiB limit.');
      const id=`export-${sources.size+1}`;sources.set(photo.src,id);
      zip.file(`photos/${id}`,await blob.arrayBuffer());
    }
    photo.src=`asset:${sources.get(photo.src)}`;
  }
  const metadata=JSON.stringify(parseInspiration(JSON.stringify(data)));
  if(new TextEncoder().encode(metadata).length>2_000_000)throw new Error('Backup metadata exceeds 2 MB.');
  zip.file('library.json',metadata);
  const archive=await zip.generateAsync({type:'blob',compression:'STORE'});
  if(archive.size>MAX_ARCHIVE)throw new Error('Photo backup exceeds the 50 MiB limit.');
  return archive;
}
export async function prepareLibraryImport(file){
  if(file.size>MAX_ARCHIVE)throw new Error('Backup exceeds 50 MiB.');
  if(!file.name.toLowerCase().endsWith('.zip')){
    if(file.size>2_000_000)throw new Error('Library JSON exceeds 2 MB.');
    const library=parseInspiration(await file.text());
    // Metadata-only JSON cannot silently restore missing browser-local photos.
    for(const item of library.items)for(const photo of item.photos??[])if(photo.src.startsWith('asset:'))await storedPhoto(photo.src.slice(6));
    return {library,assets:[]};
  }
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  if(Object.keys(zip.files).length>12002)throw new Error('Too many files in the backup.');
  for(const entry of Object.values(zip.files))if(entry.unsafeOriginalName&&entry.unsafeOriginalName!==entry.name)throw new Error('Unsafe backup path.');
  const library=parseInspiration(new TextDecoder().decode(await readEntry(zip.file('library.json'),2_000_000)));
  const assets=[],sources=new Map();let total=0;
  for(const item of library.items)for(const photo of item.photos??[]){
    if(!photo.src.startsWith('asset:'))continue;
    if(!sources.has(photo.src)){
      const bytes=await readEntry(zip.file(`photos/${photo.src.slice(6)}`),MAX_IMAGE);
      total+=bytes.length;if(total>MAX_ARCHIVE)throw new Error('Expanded backup exceeds 50 MiB.');
      const blob=await compressPhoto(new Blob([bytes],{type:imageMime(bytes)}));
      const id=`upload-${crypto.randomUUID()}`;assets.push({id,blob});sources.set(photo.src,id);
    }
    photo.src=`asset:${sources.get(photo.src)}`;
  }
  return {library:parseInspiration(JSON.stringify(library)),assets};
}
