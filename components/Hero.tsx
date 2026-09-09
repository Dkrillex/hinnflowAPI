'use client'

import { CountUp, Reveal } from './motion'
import { hero } from '@/lib/site'

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="7" r="2" />
      <path d="M8 7h8M12 9v8" strokeLinecap="round" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  )
}

/** 右侧的线框地球，对应原站 banner 底图里那颗淡蓝色星球 */
function GlobeArt() {
  const meridians = [0, 22, 44, 66, 88]
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="globeFill" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.30" />
          <stop offset="55%" stopColor="#1d4ed8" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="150" fill="url(#globeFill)" />
      <circle cx="200" cy="200" r="150" stroke="#60a5fa" strokeOpacity="0.22" strokeWidth="1" />

      {/* 经线 */}
      {meridians.map((rx) => (
        <ellipse
          key={`m${rx}`}
          cx="200"
          cy="200"
          rx={rx || 1}
          ry="150"
          stroke="#60a5fa"
          strokeOpacity="0.14"
          strokeWidth="1"
        />
      ))}

      {/* 纬线 */}
      {[-110, -70, -35, 0, 35, 70, 110].map((dy) => {
        const rx = Math.sqrt(Math.max(150 * 150 - dy * dy, 0))
        return (
          <ellipse
            key={`p${dy}`}
            cx="200"
            cy={200 + dy}
            rx={rx}
            ry={rx * 0.16}
            stroke="#60a5fa"
            strokeOpacity="0.13"
            strokeWidth="1"
          />
        )
      })}

      {/* 几个高亮节点 */}
      {[
        [140, 128],
        [252, 168],
        [176, 246],
        [268, 262],
        [116, 210],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="#93c5fd" fillOpacity="0.75" />
      ))}
    </svg>
  )
}

export function Hero() {
  return (
    <section className="w-full flex flex-col justify-center relative">
      <section className="hero-bg relative pt-24 md:pt-32 pb-12 md:pb-24 overflow-hidden transition-colors duration-300 min-h-[calc(100vh-4rem)] md:min-h-screen flex flex-col justify-center">
        {/* 右上角光晕 */}
        <div className="hidden sm:block absolute top-0 right-0 w-[50rem] h-[50rem] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-full blur-3xl pointer-events-none" />
        {/* 点阵纹理 */}
        <div className="hidden sm:block absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_0.0625rem,transparent_0.0625rem)] dark:bg-[radial-gradient(#334155_0.0625rem,transparent_0.0625rem)] [background-size:1.5rem_1.5rem] opacity-40 dark:opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* 左栏 */}
            <div className="relative z-20 max-w-2xl text-center lg:text-left mx-auto lg:mx-0 flex flex-col items-center lg:items-start">
              <Reveal>
                <span className="inline-flex items-center gap-2 h-[34px] px-4 rounded-full border border-primary-200 bg-gradient-to-r from-primary-50 to-blue-100 text-primary-600 dark:border-white/10 dark:from-[#1b2f63] dark:to-[#16386b] dark:text-primary-400 text-sm font-bold shadow-[0_0_1.5rem_rgba(37,99,235,0.25)]">
                  <SparkIcon />
                  {hero.badge}
                </span>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-9 text-4xl sm:text-5xl md:text-[3rem] lg:text-[3rem] tracking-[-1.2px] leading-[1.05] w-full max-w-full lg:w-[40rem] lg:max-w-none font-dinBold mb-6 text-ink dark:text-white">
                  <span className="block whitespace-normal break-words max-w-[26ch] sm:max-w-[34ch] lg:max-w-none">
                    {hero.title}
                  </span>
                  <span className="mt-2 block whitespace-normal text-primary-400 leading-[1.1]">
                    {hero.subtitle}
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={160} className="w-full">
                <div className="flex flex-wrap justify-center lg:justify-start gap-x-16 gap-y-6 mt-6">
                  {hero.stats.map((s) => (
                    <div key={s.label}>
                      <div className="text-2xl sm:text-[2.25rem] leading-[2rem] font-dinBold text-ink dark:text-white tracking-[-0.9px]">
                        <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />
                      </div>
                      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={240} className="w-full">
                <a
                  href={hero.cta.href}
                  className="group mt-[6.5rem] inline-flex items-center justify-between w-full sm:w-[17rem] h-12 px-6 text-base font-bold text-white bg-brand rounded-sm hover:bg-brand-dark transition-all shadow-lg shadow-blue-900/20"
                >
                  {hero.cta.label}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </Reveal>
            </div>

            {/* 右栏 */}
            <Reveal delay={200}>
              <div className="relative h-[20rem] sm:h-[25rem] md:h-[28.125rem] lg:h-[31.25rem] w-full flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
                <div className="relative w-full max-w-[18rem] sm:max-w-[20rem] md:max-w-[25rem] lg:max-w-[31.25rem] aspect-square">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[40px] md:blur-[80px] animate-pulse-slow" />
                  {/* 与原站底图一致：星球只作为极淡的背景元素，不喧宾夺主 */}
                  <div className="relative z-10 w-full h-full drop-shadow-2xl scale-100 md:scale-90 lg:scale-110 lg:translate-x-12 opacity-45">
                    <GlobeArt />
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
