'use client'

import { CharReveal, Reveal } from './motion'
import { Eyebrow } from './SectionHeading'
import { pricing } from '@/lib/site'

function PlanIcon({ kind }: { kind: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (kind === 'calc') {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" {...common}>
        <circle cx="24" cy="24" r="15" strokeDasharray="2 3" />
        {/* 左上加号、右下减号，中间一道斜线，对应“按量计费”的算子意象 */}
        <path d="M16.5 19.5h6M19.5 16.5v6" />
        <path d="M25.5 28.5h6" />
        <path d="M30.5 17.5 17.5 30.5" />
      </svg>
    )
  }
  if (kind === 'gift') {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" {...common}>
        <rect x="11" y="18" width="26" height="19" strokeDasharray="2 3" />
        <path d="M11 24h26M24 18v19" />
        <path d="M24 18c-3-6-9-6-9-2 0 1.6 1.6 2 4 2h5Zm0 0c3-6 9-6 9-2 0 1.6-1.6 2-4 2h-5Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" {...common}>
      <circle cx="24" cy="24" r="15" strokeDasharray="2 3" />
      <path d="M21 14h6l-1.4 4.2h-3.2L21 14Zm1.4 4.2h3.2L28 28l-4 6-4-6 2.4-9.8Z" />
    </svg>
  )
}

export function PricingSection() {
  return (
    <section className="w-full flex flex-col justify-center relative">
      <section className="py-20 md:py-32 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <Eyebrow className="mb-8">{pricing.eyebrow}</Eyebrow>
          </Reveal>

          <div className="mb-16 md:mb-24">
            <h2 className="text-3xl md:text-[3.5rem] tracking-tight leading-tight md:leading-relaxed dark:text-white text-ink font-dinBold">
              <span className="inline-block whitespace-normal md:whitespace-nowrap break-words">
                <CharReveal text={pricing.headingLead} />
                <CharReveal
                  text={pricing.headingAccent}
                  className="text-[#3B4CF0]"
                  startDelay={pricing.headingLead.length * 30}
                />
              </span>
            </h2>
          </div>

          <div className="w-full grid md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {pricing.plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 110} className="h-full">
                <div className="group relative h-full min-h-[35rem] flex flex-col border border-hairline-plan dark:border-white/10 rounded-none pl-6 md:pl-[4.25rem] pr-4 md:pr-6 pt-[52px] pb-[3rem] transition-shadow duration-300 hover:shadow-[0_0.5rem_1.875rem_rgba(19,84,238,0.18)]">
                  {p.recommended && (
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1">
                      Recommended
                    </span>
                  )}

                  <div className="w-12 h-12 text-primary-500/80 mb-5">
                    <PlanIcon kind={p.icon} />
                  </div>

                  <h3 className="text-[1.25rem] font-dinBold text-ink dark:text-white mb-8">{p.name}</h3>

                  <div className="flex items-end mb-9">
                    {p.currency && (
                      <span className="text-[1.5rem] font-din text-ink dark:text-white leading-none mb-2">
                        {p.currency}
                      </span>
                    )}
                    <span
                      className={`font-din text-ink dark:text-white leading-[0.95] tracking-tight ${
                        p.currency ? 'text-[4rem]' : 'text-[2.5rem]'
                      }`}
                    >
                      {p.price}
                    </span>
                  </div>

                  <ul className="space-y-5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm font-bold text-ink dark:text-white">
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={p.cta.href}
                    className={`absolute bottom-0 left-0 right-0 h-12 flex items-center justify-between px-6 text-white font-bold text-[0.9375rem] transition-colors ${p.ctaClass}`}
                  >
                    {p.cta.label}
                    <svg
                      viewBox="0 0 24 24"
                      className="w-[1.125rem] h-[1.125rem] transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}
