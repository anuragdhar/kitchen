import {useEffect, useRef, useState} from 'react'
import {readDesignerPreference, writeDesignerPreference} from './designerRender.js'

/**
 * The shared "Designer render" switch for a live 3D view. `sceneRef.current.setDesigner(on)` is called whenever it changes;
 * `ref.current` holds the value for the scene's first build. The choice is remembered for every view.
 */
export function useDesignerRender(sceneRef) {
  const [on, setOn] = useState(readDesignerPreference)
  const ref = useRef(on)
  useEffect(() => { ref.current = on; writeDesignerPreference(on); sceneRef.current?.setDesigner?.(on) }, [on, sceneRef])
  const button = style => ({
    onClick: () => setOn(value => !value), 'aria-pressed': on, style,
    title: 'Designer render: soft ambient occlusion in corners, along skirting and under furniture. Turn off on a slow computer.',
    children: on ? 'Designer render: on' : 'Designer render: off',
  })
  return {on, setOn, ref, button}
}
