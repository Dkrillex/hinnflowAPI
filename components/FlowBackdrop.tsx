'use client'

import { Suspense, lazy, useEffect, useState } from 'react'

/**
 * 流动背景。与 canvas.hinnflow.com 同一实现：
 * @paper-design/shaders-react 的 MeshGradient 叠两层——
 *   a 层 distortion 1.6 / speed 0.3，b 层 distortion 1.8 / speed 0.2 且 opacity 0.5，
 * 两层错速产生洋流般的缓慢推移。配色数组也沿用希流现有的深浅两套。
 *
 * 三个保护：WebGL 不可用时退回静态径向渐变；prefers-reduced-motion 时把 speed 归零
 * （画面保留、不再动）；maxPixelCount 封顶避免高分屏上按物理像素铺满。
 */
const MeshGradient = lazy(() =>
  import('@paper-design/shaders-react').then((m) => ({ default: m.MeshGradient }))
)

const LIGHT_A = ['#F3F4F6', '#9DA6B5', '#5C6880', '#F3F4F6', '#DCE0E6', '#FFFFFF']
const LIGHT_B = ['#FFFFFF', '#7A8698', '#EEF1F4', '#FFFFFF']
const DARK_A = ['#0E1014', '#2A303A', '#8A93A2', '#0E1014', '#4A5160', '#D8DCE3']
const DARK_B = ['#0E1014', '#C5CBD4', '#9AA3B0', '#0E1014']

const MAX_PIXELS = 1_440_000

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function FlowBackdrop() {
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [reduced, setReduced] = useState(false)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    setWebgl(hasWebGL())

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)

    // 主题由 Navbar 切换 html 上的 class，这里跟随即可，不必把状态提到上层
    const root = document.documentElement
    const sync = () => setDark(root.classList.contains('dark'))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => {
      mq.removeEventListener('change', onChange)
      mo.disconnect()
    }
  }, [])

  // 首帧与不支持 WebGL 时都用静态兜底，避免闪烁
  if (!webgl) return <div aria-hidden className="flow-fallback" />

  return (
    <div aria-hidden className="flow-backdrop">
      <Suspense fallback={<div className="flow-fallback" />}>
        <MeshGradient
          className="flow-layer-a"
          colors={dark ? DARK_A : LIGHT_A}
          distortion={1.6}
          speed={reduced ? 0 : 0.3}
          maxPixelCount={MAX_PIXELS}
        />
        <MeshGradient
          className="flow-layer-b"
          colors={dark ? DARK_B : LIGHT_B}
          distortion={1.8}
          speed={reduced ? 0 : 0.2}
          maxPixelCount={MAX_PIXELS}
        />
      </Suspense>
    </div>
  )
}
