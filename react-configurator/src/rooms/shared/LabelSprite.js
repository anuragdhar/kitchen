import * as THREE from 'three'

// The dark rounded label of the Drawing Room layouts and the whole-home overlays: bold white text on a near-black rounded
// card, drawn on a canvas `widthPx` wide and 96 px high. Always drawn on top (no depth test, render order 10). The caller
// sets the sprite's scale and position, in metres of its own frame.
export function createDarkLabelSprite(text, {widthPx = 512, fontPx = 38, background = 'rgba(20,24,28,.86)'} = {}) {
  const canvas = document.createElement('canvas'); canvas.width = widthPx; canvas.height = 96
  const g = canvas.getContext('2d')
  g.fillStyle = background; g.beginPath(); g.roundRect(4, 4, widthPx - 8, 88, 18); g.fill()
  g.fillStyle = '#fff'; g.font = `bold ${fontPx}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, widthPx / 2, 50)
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
  sprite.renderOrder = 10
  return sprite
}
