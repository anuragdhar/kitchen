import * as THREE from 'three'

export function createPbrMaterial(color,opacity=1,opts={}){
  const params={
    color:new THREE.Color(color),
    roughness:opts.roughness??.66,
    metalness:opts.metalness??.04,
    emissive:opts.emissive?new THREE.Color(opts.emissive):new THREE.Color('#000000'),
    emissiveIntensity:opts.emissiveIntensity??0,
    transparent:opacity<1,
    opacity,
  }
  if(opts.map) params.map=opts.map
  if(opts.roughnessMap) params.roughnessMap=opts.roughnessMap
  if(opts.metalnessMap) params.metalnessMap=opts.metalnessMap
  if(opts.normalMap) params.normalMap=opts.normalMap
  if(opts.normalScale) params.normalScale=opts.normalScale
  if(opts.bumpMap) params.bumpMap=opts.bumpMap
  if(opts.bumpScale!=null) params.bumpScale=opts.bumpScale
  if(opts.aoMap) params.aoMap=opts.aoMap
  if(opts.displacementMap) params.displacementMap=opts.displacementMap
  if(opts.displacementScale!=null) params.displacementScale=opts.displacementScale
  if(opts.clearcoat!=null) params.clearcoat=opts.clearcoat
  if(opts.clearcoatRoughness!=null) params.clearcoatRoughness=opts.clearcoatRoughness
  if(opts.sheen!=null){
    params.sheen=opts.sheen
    params.sheenRoughness=opts.sheenRoughness??opts.roughness??.66
    params.sheenColor=new THREE.Color(opts.sheenColor||color)
  }
  if(opts.transmission!=null) params.transmission=opts.transmission
  if(opts.thickness!=null) params.thickness=opts.thickness
  if(opts.ior!=null) params.ior=opts.ior
  const needsPhysical=params.clearcoat!=null || params.sheen!=null || params.transmission!=null || params.thickness!=null || params.ior!=null
  return needsPhysical ? new THREE.MeshPhysicalMaterial(params) : new THREE.MeshStandardMaterial(params)
}
