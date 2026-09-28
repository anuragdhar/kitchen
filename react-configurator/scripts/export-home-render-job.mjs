import {writeFile,mkdir} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import {BLENDER_ROOM_VIEWS} from '../src/config/homeRoomViews.js'
import {ENTRY} from '../src/config/entryConfig.js'
import {buildHomeRenderJob} from '../src/domain/wholeHomeRender.mjs'

const root=fileURLToPath(new URL('../../',import.meta.url))
const output=path.resolve(process.argv[2]||path.join(root,'blender/whole_home/realistic/job.json'))
const job=buildHomeRenderJob(BLENDER_ROOM_VIEWS,ENTRY.planScale)
await mkdir(path.dirname(output),{recursive:true})
await writeFile(output,JSON.stringify(job,null,2)+'\n','utf8')
console.log(`Render-only job exported for ${job.rooms.length} rooms: ${output}`)
