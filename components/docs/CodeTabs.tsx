'use client'

import { useEffect, useId, useState } from 'react'
import type { CodeSample } from '@/lib/docs/content'

/**
 * 多语言代码块：顶部语言标签 + 复制按钮。只有一个示例时不显示标签，只留语言名。
 * 标签选择记在 localStorage，换一个代码块也保持同一种语言（Python 用户不用每块都切）。
 */
const PREF_KEY = 'docs:lang'

export function CodeTabs({ samples, copy, copied }: { samples: CodeSample[]; copy: string; copied: string }) {
  const [active, setActive] = useState(0)
  const [done, setDone] = useState(false)
  const id = useId()

  useEffect(() => {
    try {
      const pref = localStorage.getItem(PREF_KEY)
      const i = samples.findIndex((s) => s.label === pref)
      if (i >= 0) setActive(i)
    } catch {
      // 读不到偏好就用第一个
    }
    const onPref = (e: Event) => {
      const i = samples.findIndex((s) => s.label === (e as CustomEvent<string>).detail)
      if (i >= 0) setActive(i)
    }
    window.addEventListener(PREF_KEY, onPref)
    return () => window.removeEventListener(PREF_KEY, onPref)
  }, [samples])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1500)
    return () => clearTimeout(t)
  }, [done])

  const choose = (i: number) => {
    setActive(i)
    try {
      localStorage.setItem(PREF_KEY, samples[i].label)
    } catch {
      // 忽略
    }
    window.dispatchEvent(new CustomEvent(PREF_KEY, { detail: samples[i].label }))
  }

  const sample = samples[active] ?? samples[0]

  return (
    <div className="overflow-hidden rounded-tile border border-line/12 bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pl-2 pr-1.5">
        {samples.length > 1 ? (
          <div role="tablist" className="flex">
            {samples.map((s, i) => (
              <button
                key={s.label}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={i === active}
                aria-controls={`${id}-panel`}
                onClick={() => choose(i)}
                className={`relative px-3 py-2.5 text-[0.75rem] font-medium transition-colors ${
                  i === active ? 'text-white' : 'text-white/55 hover:text-white/85'
                }`}
              >
                {s.label}
                {i === active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#4A8CFF]" />}
              </button>
            ))}
          </div>
        ) : (
          <span className="px-3 py-2.5 text-[0.75rem] font-medium text-white/55">{sample.label}</span>
        )}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(sample.code)
              setDone(true)
            } catch {
              // 非安全上下文没有剪贴板，静默
            }
          }}
          className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {done ? (
            <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5 text-[#7FB2FF]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
              <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
            </svg>
          )}
          <span aria-live="polite">{done ? copied : copy}</span>
        </button>
      </div>
      <pre
        id={`${id}-panel`}
        role={samples.length > 1 ? 'tabpanel' : undefined}
        aria-labelledby={samples.length > 1 ? `${id}-tab-${active}` : undefined}
        tabIndex={0}
        className="overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4A8CFF]/60"
      >
        <code>{sample.code}</code>
      </pre>
    </div>
  )
}
