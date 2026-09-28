import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BLENDER_ROOM_VIEWS } from '../src/config/homeRoomViews.js'

test('every individual room has a Blender model region and a rendered preview', () => {
  for (const key of ['kitchen','study','balcony','bedroom1','bedroom3','lobby','drawing','pooja','entry','storage']) {
    const room=BLENDER_ROOM_VIEWS[key]
    assert.ok(room, `${key} has a Blender room view`)
    const [x1,y1,x2,y2]=room.bounds
    assert.ok(x2>x1&&y2>y1, `${key} has a positive plan region`)
    const image=fileURLToPath(new URL(`../public/renders/home-lighting/${room.render}.png`,import.meta.url))
    assert.ok(existsSync(image),`${key} has a Blender render`)
    for(const [file] of room.extraRenders||[])assert.ok(existsSync(fileURLToPath(new URL(`../public/renders/${file}`,import.meta.url))),`${key} has ${file}`)
  }
  assert.ok(existsSync(fileURLToPath(new URL('../public/models/A501-blender-lighting.glb',import.meta.url))))
})

test('interactive lighting exports contain embedded atlases with usable UVs and linear range metadata',()=>{
  for(const file of ['A501-home-baked.glb','A501-bedroom3-baked.glb','A501-drawing-baked.glb']){
    const bytes=readFileSync(new URL(`../public/models/${file}`,import.meta.url))
    assert.equal(bytes.toString('ascii',0,4),'glTF')
    assert.equal(bytes.readUInt32LE(4),2)
    const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)))
    const baked=gltf.nodes.filter(node=>node.extras?.bakedLightingScale)
    if(file==='A501-drawing-baked.glb'){
      for(const name of ['Element 12','Element 15','Element 16','Element 46']){
        assert.equal(gltf.nodes.find(node=>node.name===name)?.extras?.bakedSurfaceOffset,-1,`${name} retains its coplanar finish depth bias`)
      }
    }
    assert.ok(baked.length>50,`${file} contains a baked room, not an empty export`)
    for(const node of baked){
      assert.equal(node.extras.bakedLightingScale,16)
      for(const primitive of gltf.meshes[node.mesh].primitives){
        const material=gltf.materials[primitive.material]
        assert.equal(material.extensions?.KHR_materials_emissive_strength?.emissiveStrength,16,'lighting brightness is portable glTF data')
        const texture=material.emissiveTexture
        assert.ok(texture,`${node.name} has baked illumination`)
        assert.ok(primitive.attributes[`TEXCOORD_${texture.texCoord||0}`]!==undefined,`${node.name} has atlas coordinates`)
        const image=gltf.images[gltf.textures[texture.index].source]
        assert.ok(Number.isInteger(image.bufferView),'atlas is embedded for offline loading')
      }
    }
    assert.equal(new Set(gltf.nodes.map(node=>node.name)).size,gltf.nodes.length,'object IDs stay unique')
  }
  for(const key of ['bedroom3','drawing']){
    const room=BLENDER_ROOM_VIEWS[key]
    assert.equal(room.bakedModel,`/models/A501-${key}-baked.glb`)
    assert.ok(room.bakedView.interiorPosition.every(Number.isFinite))
  }
})
