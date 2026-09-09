'use client'

import { Reveal } from './motion'
import { Em, Eyebrow, SectionTitle } from './SectionHeading'
import { useI18n } from '@/lib/i18n/context'

function FeatureIcon({ kind }: { kind: string }) {
  const c = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (kind) {
    case 'gauge':
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...c}>
          <path d="M4 17a8 8 0 1 1 16 0" />
          <path d="m12 13 4-3.5" />
        </svg>
      )
    case 'globe':
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...c}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c3 3.4 3 13.1 0 17-3-3.9-3-13.6 0-17Z" />
        </svg>
      )
    case 'plug':
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...c}>
          <path d="M3 8.5c2.6-4.4 5.2 4.4 7.8 0s5.2 4.4 7.8 0M3 15.5c2.6-4.4 5.2 4.4 7.8 0s5.2 4.4 7.8 0" />
        </svg>
      )
    case 'ticket':
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...c}>
          <rect x="3" y="6.5" width="18" height="11" rx="2.5" />
          <path d="m9 15 6-6" />
          <circle cx="9.5" cy="10" r="1.2" />
          <circle cx="14.5" cy="14" r="1.2" />
        </svg>
      )
    case 'expand':
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...c}>
          <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...c}>
          <path d="M12 3 4.5 6v5.2c0 4.6 3.2 8 7.5 9.8 4.3-1.8 7.5-5.2 7.5-9.8V6L12 3Z" />
          <path d="m8.8 12 2.3 2.3 4.1-4.4" />
        </svg>
      )
  }
}

export function FeaturesSection() {
  const { dict } = useI18n()
  const features = dict.features

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <Eyebrow>{features.eyebrow}</Eyebrow>
          <SectionTitle className="mt-6 max-w-4xl">
            {features.headingParts.map((p, i) =>
              p.accent ? <Em key={i}>{p.text}</Em> : <span key={i}>{p.text}</span>
            )}
          </SectionTitle>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.cards.map((card, i) => (
            <Reveal key={card.title} delay={(i % 3) * 90}>
              <div className="card group h-full p-7 hover:border-flow/45">
                {/* 图标砖 + 编号小标，沿用 www 的 PILLAR 卡片结构 */}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-tile border border-flow/25 bg-flow/10 text-flow">
                    <FeatureIcon kind={card.icon} />
                  </div>
                  <span className="text-eyebrow font-medium uppercase text-flow">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-7 text-[1.25rem] font-medium tracking-[-0.01em] text-fg">{card.title}</h3>
                <p className="mt-3 text-[0.875rem] leading-[1.7] text-muted">{card.desc}</p>

                <ul className="mt-6 space-y-2.5 border-t border-line/10 pt-6">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[0.8125rem] text-muted">
                      <span className="mt-[0.3rem] text-flow">↳</span>
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex items-baseline justify-between border-t border-line/10 pt-5">
                  <span className="text-[0.75rem] text-muted">{card.metricLabel}</span>
                  <span className="text-[1.0625rem] font-medium text-flow">{card.metricValue}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
