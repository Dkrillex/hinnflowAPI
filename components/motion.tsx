'use client'

import { useEffect, useRef, useState } from 'react'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

function useInView<T extends HTMLElement>(threshold = 0.15, once = true) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])

  return { ref, inView }
}

/** 整块入场：opacity + Y 位移，与参考站同一条缓动曲线 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'span'
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate3d(0,0,0)' : `translate3d(0,${y}px,0)`,
        transition: `opacity 0.7s ${EASE} ${delay}ms, transform 0.7s ${EASE} ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  )
}

/** 标题逐字入场：每字 30ms 间隔、700ms 时长，与参考站一致 */
export function CharReveal({
  text,
  className = '',
  startDelay = 0,
  step = 30,
}: {
  text: string
  className?: string
  startDelay?: number
  step?: number
}) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="inline-block transition-all ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translate3d(0,0,0)' : 'translate3d(0,14px,0)',
              transitionDelay: `${startDelay + i * step}ms`,
              transitionDuration: '700ms',
              whiteSpace: 'pre',
            }}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  )
}

/** hero 数字滚动：0 → 目标值 */
export function CountUp({
  value,
  decimals = 0,
  suffix = '',
  duration = 1800,
  className = '',
}: {
  value: number
  decimals?: number
  suffix?: string
  duration?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      // easeOutExpo，尾段减速与参考站观感一致
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref} className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
