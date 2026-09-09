'use client'

import { useEffect, useState } from 'react'
import { LogoLockup } from './Logo'
import { nav } from '@/lib/site'

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
  const [dark, setDark] = useState(true)
  const [lang, setLang] = useState<'EN' | 'ZH'>('EN')
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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
          <a href="/" className="text-fg">
            <LogoLockup markClass="h-[22px] w-[26px]" />
          </a>

          {/* 导航浮在首屏薄纱最薄处，用 fg/75 而非 muted 才够对比度 */}
          <div className="hidden md:flex items-center gap-9 text-[0.9375rem] text-fg/75">
            {nav.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={`transition-colors duration-200 hover:text-fg ${i === 0 ? 'text-fg' : ''}`}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/5 hover:text-fg"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              onClick={() => setLang(lang === 'EN' ? 'ZH' : 'EN')}
              className="h-9 rounded-full border border-line/15 px-3.5 text-[0.8125rem] font-medium text-muted transition-colors hover:border-line/35 hover:text-fg"
            >
              {lang}
            </button>

            <a
              href={nav.login.href}
              className="ml-1 px-3 text-[0.9375rem] text-muted transition-colors hover:text-fg"
            >
              {nav.login.label}
            </a>

            <a href={nav.signup.href} className="pill-solid !py-[0.6875rem] !px-6 !text-[0.875rem]">
              {nav.signup.label}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-fg"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Menu"
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

      {/* 移动端抽屉 */}
      <div
        className={`md:hidden overflow-hidden border-t border-line/10 bg-bg/90 backdrop-blur-xl transition-all duration-300 ease-flow ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 px-6 py-4">
          {nav.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="block rounded-full px-4 py-2.5 text-[0.9375rem] text-muted transition-colors hover:bg-line/5 hover:text-fg"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <a href={nav.login.href} className="pill-ghost flex-1">
              {nav.login.label}
            </a>
            <a href={nav.signup.href} className="pill-solid flex-1">
              {nav.signup.label}
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
