'use client'

import { CharReveal, Reveal } from './motion'
import { Eyebrow } from './SectionHeading'
import { features } from '@/lib/site'

function FeatureIcon({ kind }: { kind: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (kind) {
    case 'gauge':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full" {...common}>
          <circle cx="20" cy="20" r="14" strokeDasharray="2 3" />
          <circle cx="20" cy="20" r="9" />
          <path d="M20 20l6-5" />
          <circle cx="20" cy="20" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'globe':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full" {...common}>
          <circle cx="20" cy="20" r="14" strokeDasharray="2 3" />
          <circle cx="20" cy="20" r="10" />
          <path d="M10 20h20M20 10c4 5 4 15 0 20-4-5-4-15 0-20" />
        </svg>
      )
    case 'plug':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full" {...common}>
          <rect x="5" y="5" width="30" height="30" strokeDasharray="2 3" />
          <rect x="11" y="11" width="13" height="13" transform="rotate(45 17.5 17.5)" />
          <rect x="17" y="17" width="13" height="13" transform="rotate(45 23.5 23.5)" />
        </svg>
      )
    case 'ticket':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full" {...common}>
          <rect x="5" y="10" width="30" height="20" rx="3" strokeDasharray="2 3" />
          <path d="M14 25l12-10" />
          <circle cx="15.5" cy="16.5" r="2.2" />
          <circle cx="24.5" cy="23.5" r="2.2" />
        </svg>
      )
    case 'expand':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full" {...common}>
          <rect x="5" y="5" width="30" height="30" strokeDasharray="2 3" />
          <path d="M13 18v-5h5M27 18v-5h-5M13 22v5h5M27 22v5h-5" />
          <path d="M13 13l5.5 5.5M27 13l-5.5 5.5M13 27l5.5-5.5M27 27l-5.5-5.5" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full" {...common}>
          <circle cx="20" cy="20" r="14" strokeDasharray="2 3" />
          <path d="M20 8l10 4v8c0 6-4 9.5-10 12-6-2.5-10-6-10-12v-8l10-4Z" />
          <path d="M15.5 20.5l3.2 3.2 6-6.4" />
        </svg>
      )
  }
}

export function FeaturesSection() {
  return (
    <section className="w-full flex flex-col justify-center relative">
      <section className="py-16 bg-slate-50/50 dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 md:mb-20">
              <Eyebrow className="mb-6">{features.eyebrow}</Eyebrow>
              <h2 className="text-[2rem] md:text-[3.5rem] tracking-tight leading-relaxed text-ink font-dinBold dark:text-white">
                {features.headingParts.map((p, i) => (
                  <CharReveal
                    key={i}
                    text={p.text}
                    className={p.accent ? 'text-primary-500' : ''}
                    startDelay={
                      features.headingParts.slice(0, i).reduce((a, b) => a + b.text.length, 0) * 30
                    }
                  />
                ))}
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.cards.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 90}>
                <div className="group h-full bg-white dark:bg-white/[0.01] dark:backdrop-blur-md border border-hairline-card dark:border-white/10 hover:bg-brand hover:border-brand dark:hover:bg-primary-600 dark:hover:border-primary-600 transition-colors duration-300 flex flex-col">
                  <div className="px-8 pt-9 pb-6 border-b border-hairline-card dark:border-white/10 group-hover:border-white/25 transition-colors">
                    {/* 悬停整卡变蓝，浅色主题下标题必须跟着转白，否则深墨蓝压蓝底只有 2.7:1 */}
                    <h3 className="text-[1.25rem] font-dinBold text-ink dark:text-white group-hover:text-white transition-colors">
                      {c.title}
                    </h3>
                  </div>

                  <div className="px-8 pt-6 pb-9 flex-1 flex flex-col justify-between">
                    <div className="relative min-h-[4.5rem]">
                      <p className="text-sm leading-[1.6] text-slate-500 dark:text-slate-400 group-hover:opacity-0 transition-opacity duration-200">
                        {c.desc}
                      </p>
                      <ul className="absolute inset-0 space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        {c.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-2 text-sm text-white/90">
                            <span className="w-1 h-1 rounded-full bg-white/80" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-end justify-between mt-8">
                      <div className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors">
                        {c.metricLabel}{' '}
                        <span className="text-[1.125rem] font-dinBold text-primary-500 group-hover:text-white transition-colors">
                          {c.metricValue}
                        </span>
                      </div>
                      <div className="w-[3.25rem] h-[3.25rem] text-primary-500/70 group-hover:text-white/85 transition-colors">
                        <FeatureIcon kind={c.icon} />
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}
