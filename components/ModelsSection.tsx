'use client'

import { useState } from 'react'
import { Reveal } from './motion'
import { Em, Eyebrow, SectionTitle } from './SectionHeading'
import { models } from '@/lib/site'

/** 中性几何字形，替代各家厂商商标 */
function VendorGlyph({ kind }: { kind: number }) {
  if (kind === 0) {
    return (
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 5c2.8 0 4.9 1.8 5.5 4 2.3.5 4 2.5 4 4.9 0 1.4-.6 2.7-1.5 3.6.5 2.3-.6 4.7-2.7 5.8-1.1 2-3.4 3-5.6 2.4-1.6 1.1-3.7 1.2-5.4.2-2.3-.5-4-2.5-4-4.9 0-1.4.6-2.7 1.5-3.6-.5-2.3.6-4.7 2.7-5.8C11.6 5.8 13.8 4.8 16 5Z" />
      </svg>
    )
  }
  if (kind === 1) {
    return (
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6
          return (
            <line
              key={i}
              x1={16 + Math.cos(a) * 3.5}
              y1={16 + Math.sin(a) * 3.5}
              x2={16 + Math.cos(a) * 10.5}
              y2={16 + Math.sin(a) * 10.5}
            />
          )
        })}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor">
      <path d="M16 4c.8 6.2 5.8 11.2 12 12-6.2.8-11.2 5.8-12 12-.8-6.2-5.8-11.2-12-12 6.2-.8 11.2-5.8 12-12Z" />
    </svg>
  )
}

export function ModelsSection() {
  const [active, setActive] = useState(0)

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <Eyebrow>{models.eyebrow}</Eyebrow>
          <SectionTitle className="mt-6 max-w-4xl">
            {models.headingLead}
            <Em>{models.headingAccent}</Em>,<br />
            {models.headingTail}
          </SectionTitle>
        </Reveal>

        <div className="mt-16 grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          {/* 左：三条说明，鼠标经过切换高亮 */}
          <div className="lg:col-span-5">
            {models.items.map((item, i) => {
              const on = active === i
              return (
                <Reveal key={item.title} delay={i * 90}>
                  <div
                    onMouseEnter={() => setActive(i)}
                    className={`cursor-default border-l py-6 pl-6 transition-colors duration-300 ease-flow ${
                      on ? 'border-flow' : 'border-line/12'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          on ? 'bg-flow' : 'bg-muted/40'
                        }`}
                      />
                      <span className="text-eyebrow font-medium uppercase text-muted">{item.title}</span>
                    </div>
                    <p
                      className={`mt-3 text-[1.375rem] leading-[1.5] tracking-[-0.01em] transition-colors duration-300 ${
                        on ? 'text-fg' : 'text-muted/55'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>

          {/* 右：模型矩阵 */}
          <Reveal delay={140} className="lg:col-span-7">
            <div className="card overflow-hidden p-8 md:p-10">
              <div className="grid grid-cols-3 gap-5">
                {models.columns.map((col, i) => (
                  <div key={col.vendor} className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl border border-line/12 bg-line/[0.04] text-flow">
                      <VendorGlyph kind={i} />
                    </div>
                    <span className="text-[0.8125rem] font-medium text-fg">{col.label}</span>
                    <div className="w-full space-y-2.5">
                      {col.tags.map((t) => (
                        <div
                          key={t}
                          className="flex h-10 items-center justify-center rounded-full border border-line/12 bg-line/[0.03] text-[0.8125rem] text-muted transition-colors duration-200 hover:border-flow/40 hover:text-fg"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
