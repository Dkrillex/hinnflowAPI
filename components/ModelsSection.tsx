'use client'

import { useState } from 'react'
import { CharReveal, Reveal } from './motion'
import { Eyebrow } from './SectionHeading'
import { models } from '@/lib/site'

/** 中性几何字形，替代各家厂商商标 */
function VendorGlyph({ kind }: { kind: number }) {
  if (kind === 0) {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="#8fb6ff" strokeWidth="1.6">
        <path d="M16 4.6c3 0 5.2 1.9 5.9 4.2 2.4.5 4.2 2.6 4.2 5.2 0 1.5-.6 2.9-1.6 3.9.5 2.4-.6 5-2.9 6.2-1.2 2.1-3.6 3.2-6 2.6-1.7 1.2-4 1.3-5.8.2-2.4-.5-4.2-2.6-4.2-5.2 0-1.5.6-2.9 1.6-3.9-.5-2.4.6-5 2.9-6.2C11.3 5.4 13.6 4.3 16 4.6Z" />
      </svg>
    )
  }
  if (kind === 1) {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="#a78bfa" strokeWidth="1.7" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6
          return (
            <line
              key={i}
              x1={16 + Math.cos(a) * 3.5}
              y1={16 + Math.sin(a) * 3.5}
              x2={16 + Math.cos(a) * 11}
              y2={16 + Math.sin(a) * 11}
            />
          )
        })}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="#60a5fa">
      <path d="M16 3c.8 6.6 5.4 11.2 12 12-6.6.8-11.2 5.4-12 12-.8-6.6-5.4-11.2-12-12 6.6-.8 11.2-5.4 12-12Z" />
    </svg>
  )
}

export function ModelsSection() {
  const [active, setActive] = useState(0)

  return (
    <section className="w-full flex flex-col justify-center relative">
      <section className="pb-16 bg-white dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-6 md:mb-10">
              <Eyebrow className="mb-6 md:mb-12">{models.eyebrow}</Eyebrow>
              <h2 className="w-full text-[2rem] md:text-[3.5rem] mb-6 tracking-tight leading-tight md:leading-relaxed text-ink font-dinBold dark:text-white">
                <span className="inline-block whitespace-normal break-words">
                  <CharReveal text={models.headingLead} />
                  <CharReveal text={models.headingAccent} className="text-primary-500" startDelay={270} />
                  <span>,</span>
                  <br />
                  <CharReveal text={models.headingTail} startDelay={1150} />
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            {/* 左：三条说明，鼠标经过切换高亮 */}
            <div className="lg:col-span-5 space-y-5">
              {models.items.map((item, i) => {
                const on = active === i
                return (
                  <Reveal key={item.title} delay={i * 90}>
                    <div
                      onMouseEnter={() => setActive(i)}
                      className={`cursor-default transition-colors duration-300 ${
                        on ? 'border-l-2 border-primary-500 pl-5' : 'pl-[1.4375rem]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`w-[0.5rem] h-[0.5rem] rounded-full transition-colors ${
                            on ? 'bg-brand' : 'bg-primary-500/60'
                          }`}
                        />
                        <span className="text-[0.875rem] font-bold text-ink dark:text-white">{item.title}</span>
                      </div>
                      <p
                        className={`text-[1.875rem] leading-[2.5rem] tracking-tight font-din transition-colors duration-300 ${
                          on ? 'text-ink dark:text-white' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </Reveal>
                )
              })}
            </div>

            {/* 右：模型矩阵面板 */}
            <Reveal delay={140} className="hidden lg:block lg:col-span-7 h-full min-h-[25rem]">
              <div className="h-full p-8 md:p-12 relative overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#f4f5ff_0%,#c9d4ff_38%,#5b8cf5_78%,#2f7bf0_100%)]">
                <div className="w-full rounded-[1.75rem] border border-white/20 bg-slate-500/30 backdrop-blur-xl p-8 md:p-10 shadow-[0_1.5rem_3rem_rgba(15,23,42,0.18)]">
                  <div className="grid grid-cols-3 gap-5">
                    {models.columns.map((col, i) => (
                      <div key={col.vendor} className="flex flex-col items-center gap-4">
                        <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-slate-900/85 flex flex-col items-center justify-center gap-0.5 shadow-lg">
                          <VendorGlyph kind={i} />
                          <span className="text-[0.625rem] font-bold text-white/90">{col.label}</span>
                        </div>
                        <div className="w-full space-y-3">
                          {col.tags.map((t) => (
                            <div
                              key={t}
                              className="h-[2.5rem] rounded-full bg-slate-900/85 text-primary-300 text-[0.8125rem] font-bold flex items-center justify-center shadow-md"
                            >
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </section>
  )
}
