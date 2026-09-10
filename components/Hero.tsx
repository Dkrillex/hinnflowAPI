'use client'

import Link from 'next/link'
import { CountUp, Reveal } from './motion'
import { useI18n, localeHref } from '@/lib/i18n/context'

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.6 10.4 12.2 5 10.6 10.4 9 12 3.5Z" strokeLinejoin="round" />
    </svg>
  )
}

export function Hero() {
  const { locale, dict } = useI18n()
  const hero = dict.hero

  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-32 pb-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-4xl">
          <Reveal>
            {/* 首屏薄纱较薄，胶囊自带一层不透明底才压得住洋流最亮处 */}
            <span className="inline-flex items-center gap-2 rounded-full border border-flow/30 bg-bg/70 px-3.5 py-1.5 text-[0.8125rem] font-medium text-flow backdrop-blur-md">
              <SparkIcon />
              {hero.badge}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-8 text-[2.75rem] md:text-[4rem] lg:text-[4.5rem] font-medium leading-[1.06] tracking-[-0.02em] text-fg">
              {hero.title}
              {/* 副标题用衬线斜体，对应 www.hinnflow.com 首屏里那个斜体强调 */}
              <span className="serif-em mt-3 block text-[0.92em] leading-[1.14] text-muted">
                {hero.subtitle}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-14 flex flex-wrap items-stretch gap-x-14 gap-y-8">
              {hero.stats.map((s, i) => (
                <div
                  key={s.label}
                  className={i > 0 ? 'border-l border-line/12 pl-14 -ml-14 md:ml-0 md:pl-14' : ''}
                >
                  <div className="text-[2.25rem] font-medium leading-none tracking-[-0.02em] text-fg">
                    <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />
                  </div>
                  {/* 首屏用 fg/80 而非 muted：薄纱薄，muted 在洋流亮处只有 3.4:1 */}
                  <div className="mt-2.5 text-[0.8125rem] text-fg/80">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-14 flex flex-wrap items-center gap-3.5">
              <Link href={localeHref(locale, hero.primary.href)} className="pill-solid">
                {hero.primary.label}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href={localeHref(locale, hero.secondary.href)} className="pill-ghost">
                {hero.secondary.label}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
