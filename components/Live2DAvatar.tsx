import { useEffect, useRef } from 'react'
// @ts-expect-error no types
import { Application } from 'pixi.js'

interface Props {
  mouth: number
}

export default function Live2DAvatar({ mouth }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const app = new Application({
      view: canvasRef.current,
      autoStart: true,
      resizeTo: window,
      backgroundAlpha: 0,
    })

    ;(async () => {
      // @ts-expect-error no types
      const { Live2DModel } = await import('pixi-live2d-display')
      const model = await Live2DModel.from('/live2d/haru/haru.model3.json')
      model.scale.set(0.35)
      model.x = window.innerWidth / 2
      model.y = window.innerHeight * 0.9
      app.stage.addChild(model)

      app.ticker.add(() => {
        model.internalModel.coreModel.setParameterValueById('PARAM_MOUTH_OPEN_Y', mouth)
      })
    })()

    return () => app.destroy(true, { children: true })
  }, [mouth])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />
  )
} 