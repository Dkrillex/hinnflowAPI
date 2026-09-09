'use client'

import { LogoMark } from './Logo'
import { Reveal } from './motion'
import { brand, footer } from '@/lib/site'

export function SiteFooter() {
  return (
    <section className="w-full flex flex-col justify-end relative">
      <footer className="bg-white dark:bg-slate-900 pt-16 md:pt-24 pb-8 md:pb-12 transition-colors duration-300">
        {/* 通栏渐变条 + 内嵌玻璃卡 */}
        <div className="footer-banner w-full relative flex items-center min-h-[21.8125rem] h-auto py-12 md:py-0 overflow-hidden">
          <div className="w-full mx-auto px-2 sm:px-6 lg:px-8">
            <Reveal>
              <div className="glass rounded-[1.5rem] p-8 md:p-[3.75rem] text-white grid md:grid-cols-3 gap-8 md:gap-10 items-stretch relative overflow-hidden mx-auto w-full border border-white/20">
                {footer.banner.map((b) => (
                  <div key={b.title} className="relative z-10 text-left flex flex-col justify-center">
                    <h3 className="text-[1.25rem] font-semibold mb-2 tracking-tight">{b.title}</h3>
                    <p className="text-left text-[0.875rem] font-normal text-white/90">{b.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* 链接区 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-[7rem]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-y-12 gap-x-8 md:gap-10">
            <div className="col-span-2 md:col-span-1 md:pr-8">
              <div className="flex items-center gap-3 mb-3 text-ink dark:text-white">
                <LogoMark className="w-[2.25rem] h-[2.25rem]" />
                <span className="font-extrabold text-2xl tracking-tight font-dinBold">{brand.name}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-normal mb-3">
                {brand.tagline}
              </p>
              <a
                href={`mailto:${brand.email}`}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors inline-block"
              >
                {brand.email}
              </a>
            </div>

            {footer.columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-ink dark:text-white mb-6">{col.title}</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400 font-normal">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 大字标语 */}
          <div className="pt-12 md:pt-16 text-center">
            <Reveal>
              <p className="text-ink dark:text-white tracking-normal leading-[120%] text-4xl md:text-[6rem] lg:text-[96px] font-bold whitespace-normal md:whitespace-nowrap font-dinBold">
                {footer.bigLead}
                <span className="text-[#3B4CF0]">{footer.bigAccent}</span>
              </p>
            </Reveal>
            <p className="text-center text-slate-400 text-sm md:text-[1rem] font-normal mt-8">
              {brand.year} © {brand.name}. All rights reserved {brand.email}.
            </p>
          </div>
        </div>
      </footer>
    </section>
  )
}
