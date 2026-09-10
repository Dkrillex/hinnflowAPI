'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogoLockup } from './Logo'
import { useI18n, localeHref } from '@/lib/i18n/context'
import { LOCALE_LABEL, type Locale } from '@/lib/i18n/dictionaries'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
    </svg>
  )
}

export function Navbar() {
  const { locale, dict } = useI18n()
  const pathname = usePathname()
  const [dark, setDark] = useState(true)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const otherLocale: Locale = locale === 'en' ? 'zh' : 'en'
  // 切语种是换路由而不是改客户端状态，两个语种都是预渲染页，不会有文案闪烁
  const switchHref = pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${otherLocale}`) || `/${otherLocale}`

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored ? stored === 'dark' : true
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ease-flow ${
        scrolled ? 'border-b border-line/10 bg-bg/70 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex h-[66px] items-center justify-between">
          <Link href={localeHref(locale, '/')} className="text-fg">
            <LogoLockup markClass="h-[22px] w-[26px]" />
          </Link>

          {/* 导航浮在首屏薄纱最薄处，用 fg/75 而非 muted 才够对比度 */}
          <div className="hidden md:flex items-center gap-9 text-[0.9375rem] text-fg/75">
            {dict.nav.links.map((l, i) => (
              <Link
                key={l.href}
                href={localeHref(locale, l.href)}
                className={`transition-colors duration-200 hover:text-fg ${i === 0 ? 'text-fg' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={dict.a11y.toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/5 hover:text-fg"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            <Link
              href={switchHref}
              hrefLang={otherLocale}
              aria-label={dict.a11y.toggleLang}
              className="flex h-9 items-center rounded-full border border-line/15 px-3.5 text-[0.8125rem] font-medium text-muted transition-colors hover:border-line/35 hover:text-fg"
            >
              {LOCALE_LABEL[otherLocale]}
            </Link>

            <Link
              href={localeHref(locale, dict.nav.login.href)}
              className="ml-1 px-3 text-[0.9375rem] text-muted transition-colors hover:text-fg"
            >
              {dict.nav.login.label}
            </Link>

            <Link
              href={localeHref(locale, dict.nav.signup.href)}
              className="pill-solid !py-[0.6875rem] !px-6 !text-[0.875rem]"
            >
              {dict.nav.signup.label}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <Link
              href={switchHref}
              hrefLang={otherLocale}
              aria-label={dict.a11y.toggleLang}
              className="flex h-9 items-center rounded-full border border-line/15 px-3 text-[0.8125rem] font-medium text-muted"
            >
              {LOCALE_LABEL[otherLocale]}
            </Link>
            <button
              onClick={toggleTheme}
              aria-label={dict.a11y.toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-fg"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setOpen(!open)}
              aria-label={dict.a11y.menu}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                {open ? (
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                ) : (
                  <path d="M4 8h16M4 16h16" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/*
        移动端抽屉。关闭态必须带 invisible：max-h-0 + opacity-0 都不会把元素移出
        tab 顺序，否则键盘用户会连续聚焦到 6 个看不见的链接。
        visibility 的过渡是离散的——展开时立刻可见，收起时等动画结束才隐藏，正好合用。
      */}
      <div
        id="mobile-nav"
        className={`md:hidden overflow-hidden border-t border-line/10 bg-bg/90 backdrop-blur-xl transition-all duration-300 ease-flow ${
          open ? 'visible max-h-96 opacity-100' : 'invisible max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 px-6 py-4">
          {dict.nav.links.map((l) => (
            <Link
              key={l.href}
              href={localeHref(locale, l.href)}
              onClick={() => setOpen(false)}
              className="block rounded-full px-4 py-2.5 text-[0.9375rem] text-muted transition-colors hover:bg-line/5 hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-3">
            <Link
              href={localeHref(locale, dict.nav.login.href)}
              onClick={() => setOpen(false)}
              className="pill-ghost flex-1"
            >
              {dict.nav.login.label}
            </Link>
            <Link
              href={localeHref(locale, dict.nav.signup.href)}
              onClick={() => setOpen(false)}
              className="pill-solid flex-1"
            >
              {dict.nav.signup.label}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
