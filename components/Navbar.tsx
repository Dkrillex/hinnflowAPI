'use client'

import { useEffect, useState } from 'react'
import { LogoLockup } from './Logo'
import { nav } from '@/lib/site'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
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
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
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
      className={`site-navbar fixed w-full z-50 transition-all duration-300 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/10 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[46px]">
          <div className="flex items-center gap-4 md:gap-12">
            <a href="/" className="text-ink dark:text-white cursor-pointer group">
              <LogoLockup markClass="w-[26px] h-[26px]" textClass="text-[1.05rem] tracking-[0.03em]" />
            </a>

            <div className="hidden md:flex items-center space-x-10 text-[1rem] font-normal text-ink dark:text-white">
              {nav.links.map((l, i) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={
                    i === 0
                      ? "h-[46px] flex items-center relative transition-colors after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-[0.0625rem] after:h-[2px] after:bg-primary-600 dark:after:bg-primary-500"
                      : 'hover:text-primary-600 dark:hover:text-primary-400 transition-colors'
                  }
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-2 transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              onClick={() => setLang(lang === 'EN' ? 'ZH' : 'EN')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium px-2 py-2 transition-colors"
            >
              <GlobeIcon />
              {lang}
            </button>

            <div className="flex items-center gap-4">
              <a
                href={nav.login.href}
                className="min-w-[4.875rem] h-[46px] px-6 flex items-center justify-center text-sm font-bold text-[#767677] dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {nav.login.label}
              </a>
              <a
                href={nav.signup.href}
                className="min-w-[4.875rem] h-[46px] px-6 flex items-center justify-center text-sm font-bold text-[#767677] dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {nav.signup.label}
              </a>
            </div>
          </div>

          <div className="md:hidden z-50 flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端抽屉 */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed top-[46px] left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xl z-40 transition-all duration-300 md:hidden ${
          open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="p-4 space-y-2">
          {nav.links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              className={`block font-bold px-4 py-3 rounded-lg transition-colors ${
                i === 0
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {l.label}
            </a>
          ))}
          <div className="h-px bg-gray-100 dark:bg-slate-800 w-full my-3" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <a
              href={nav.login.href}
              className="py-3 text-center font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              {nav.login.label}
            </a>
            <a
              href={nav.signup.href}
              className="py-3 text-center font-bold text-white bg-primary-600 rounded-lg shadow-md active:scale-95 transition-all"
            >
              {nav.signup.label}
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
