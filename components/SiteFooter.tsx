'use client'

import Link from 'next/link'
import { LogoMark } from './Logo'
import { Em } from './SectionHeading'
import { Reveal } from './motion'
import { useI18n, localeHref } from '@/lib/i18n/context'
import { brand } from '@/lib/site'

export function SiteFooter() {
  const { locale, dict } = useI18n()
  const footer = dict.footer

  return (
    <footer className="relative pt-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        {/* 蓝色渐变条：对应 www 价值链路末端那张高亮卡 */}
        <Reveal>
          <div className="flow-banner grid gap-8 rounded-card p-10 text-white md:grid-cols-3 md:p-14">
            {footer.banner.map((b) => (
              <div key={b.title}>
                <h3 className="text-[1.125rem] font-medium tracking-[-0.01em]">{b.title}</h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-white/80">{b.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 链接区 */}
        <div className="mt-24 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-fg">
              <LogoMark className="h-6 w-7" />
              <span className="text-[1.0625rem] font-medium tracking-tight">
                {brand.nameMain}
                <span className="font-serif italic">{brand.nameAccent}</span>
              </span>
            </div>
            <p className="mt-4 max-w-[18rem] text-[0.875rem] leading-relaxed text-muted">{footer.tagline}</p>
            <a
              href={`mailto:${brand.email}`}
              className="mt-4 inline-block text-[0.875rem] text-flow transition-opacity hover:opacity-75"
            >
              {brand.email}
            </a>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-eyebrow font-medium uppercase text-muted">{col.title}</h4>
              <ul className="mt-6 space-y-3.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={localeHref(locale, l.href)}
                      className="text-[0.875rem] text-muted transition-colors hover:text-fg"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 大字标语 */}
        <div className="mt-24 border-t border-line/10 pt-16 text-center">
          <Reveal>
            <p className="text-[2rem] font-medium leading-[1.14] tracking-[-0.03em] text-fg md:text-[4.5rem] lg:text-[5.5rem]">
              {footer.bigLead}
              <Em>{footer.bigAccent}</Em>
            </p>
          </Reveal>
          <p className="mt-10 pb-12 text-[0.8125rem] text-muted">
            {brand.year} © {brand.name}. {footer.rights} · {brand.email}
          </p>
        </div>
      </div>
    </footer>
  )
}
