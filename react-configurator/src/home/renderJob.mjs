import {HOME_ROOMS} from './rooms.mjs';
export const RENDER_QUALITIES=Object.freeze({smoke:{width:480,samples:16},draft:{width:960,samples:32},balanced:{width:1600,samples:128},final:{width:2560,samples:512}});
export const RENDER_CAMERA='HomeInteriorCamera';
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(x=>finite(x,-10000,10000));
export function validateRenderJob(job){
 if(!job||job.schemaVersion!==1||job.format!=='home-interior-render'||job.unit!=='m'||job.coordinateSystem!=='Y_UP'||job.sceneFile!=='scene.glb'||job.cameraName!==RENDER_CAMERA)throw Error('Unsupported render job or scene path.');
 if(!HOME_ROOMS.some(r=>r.id===job.room)&&job.room!=='whole-home')throw Error('Unknown exported room.');
 if(!Object.hasOwn(RENDER_QUALITIES,job.quality)||!finite(job.aspect,.2,5)||!Number.isInteger(job.meshCount)||job.meshCount<1||job.meshCount>100000)throw Error('Invalid render dimensions or mesh count.');
 if(typeof job.sceneSha256!=='string'||!/^[a-f0-9]{64}$/.test(job.sceneSha256))throw Error('Missing GLB integrity hash.');
 if(!Array.isArray(job.fixtures)||job.fixtures.length>500||!Array.isArray(job.punctualLights)||job.punctualLights.length>200)throw Error('Invalid light list.');
 for(const f of job.fixtures)if(!vector(f.position)||!vector(f.target)||!finite(f.width,.001,100)||!finite(f.height,.001,100)||!finite(f.previewIntensity,0,10000)||!finite(f.level,0,3)||!finite(f.kelvin,1000,12000)||typeof f.alongZ!=='boolean')throw Error('Invalid fixture.');
 for(const light of job.punctualLights)if(!['sun','point','spot'].includes(light.type)||!vector(light.position)||!vector(light.target)||!vector(light.color)||light.color.some(v=>v<0||v>1)||!finite(light.intensity,0,100000))throw Error('Invalid punctual light.');
 if(!finite(job.worldStrength,0,10))throw Error('Invalid environment strength.');
 return job;
}
