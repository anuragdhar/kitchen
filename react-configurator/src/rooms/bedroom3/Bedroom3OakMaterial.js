import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'

// A small, deterministic wood map keeps the room and whole-home views in sync.
export function createBedroom3OakMaterial({base='#b27d4c',roughness=.42}={}){
  const canvas=document.createElement('canvas')
  canvas.width=256;canvas.height=1024
  const ctx=canvas.getContext('2d')
  ctx.fillStyle=base;ctx.fillRect(0,0,canvas.width,canvas.height)
  let seed=73421
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  for(let i=0;i<310;i++){
    const x=random()*canvas.width
    const width=.25+random()*1.6
    const dark=random()>.38
    ctx.strokeStyle=dark?`rgba(69,37,16,${.025+random()*.09})`:`rgba(255,222,165,${.03+random()*.08})`
    ctx.lineWidth=width
    ctx.beginPath()
    ctx.moveTo(x,-8)
    for(let y=0;y<=canvas.height+8;y+=64)ctx.lineTo(x+Math.sin(y*.013+x*.09)*(.4+random()*1.4),y)
    ctx.stroke()
  }
  const map=new THREE.CanvasTexture(canvas)
  map.colorSpace=THREE.SRGBColorSpace
  map.anisotropy=8
  return tagSurfaceMaterial(new THREE.MeshStandardMaterial({map,roughness}),'wood','bedroom3')
}
