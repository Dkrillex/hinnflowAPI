'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { useSession } from '@/lib/auth/client'
import { localeHref, useI18n } from '@/lib/i18n/context'
import { ConsoleContext, Skeleton } from './ui'

const ICONS = {
  overview: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" />,
  keys: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.7-8.7M17 6l2.5 2.5M14.5 8.5 17 11" />
    </>
  ),
  logs: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  wallet: <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v4M4 7.5v10A1.5 1.5 0 0 0 5.5 19H20V9H6.5A2.5 2.5 0 0 1 4 7.5ZM16 14h.01" />,
}

type Section = keyof typeof ICONS
const SECTIONS: { key: Section; href: string }[] = [
  { key: 'overview', href: '/console' },
  { key: 'keys', href: '/console/keys' },
  { key: 'logs', href: '/console/logs' },
  { key: 'wallet', href: '/console/wallet' },
]

function Icon({ name }: { name: Section }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  )
}

/**
 * 控制台外壳：顶部沿用站点导航，左侧分区导航（窄屏变成横向标签条），
 * 未登录时跳登录页并带上回跳地址。登录态确认前只出骨架，不渲染任何数据页面。
 */
export function ConsoleShell({ gatewayUrl, children }: { gatewayUrl: string; children: React.ReactNode }) {
  const { locale, dict } = useI18n()
  const c = dict.console
  const session = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (session.status === 'anonymous') {
      router.replace(`${localeHref(locale, '/login')}?next=${encodeURIComponent(pathname)}`)
    }
  }, [session.status, locale, pathname, router])

  // 轻提示：屏幕右下角，aria-live 播报，2.4 秒后消失
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string } | null>(null)
  const seq = useRef(0)
  const toast = useCallback((text: string) => setToastMsg({ id: ++seq.current, text }), [])
  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2400)
    return () => clearTimeout(t)
  }, [toastMsg])

  const current = (href: string) => {
    const full = localeHref(locale, href)
    return href === '/console' ? pathname === full : pathname.startsWith(full)
  }

  return (
    <ConsoleContext.Provider value={{ gatewayUrl, toast }}>
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-[90px] sm:px-6 lg:px-10">
        <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
          <aside className="lg:sticky lg:top-[90px] lg:self-start">
            <nav aria-label={c.navLabel}>
              <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 [&::-webkit-scrollbar]:hidden sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                {SECTIONS.map((s) => {
                  const on = current(s.href)
                  return (
                    <li key={s.key} className="shrink-0">
                      <Link
                        href={localeHref(locale, s.href)}
                        aria-current={on ? 'page' : undefined}
                        className={`flex h-10 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-[0.875rem] transition-colors ${
                          on ? 'bg-line/[0.07] font-medium text-fg' : 'text-muted hover:bg-line/5 hover:text-fg'
                        }`}
                      >
                        <Icon name={s.key} />
                        {c.nav[s.key]}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>

          <main className="mt-6 min-w-0 lg:mt-0">
            {session.status === 'authenticated' ? (
              children
            ) : (
              <div role="status" aria-label={c.loading} className="space-y-6">
                <Skeleton className="h-9 w-56" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-card" />
                  ))}
                </div>
                <Skeleton className="h-72 rounded-card" />
              </div>
            )}
          </main>
        </div>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-[60]">
        {toastMsg && (
          <div
            key={toastMsg.id}
            className="rounded-full bg-fg px-4 py-2.5 text-[0.8125rem] font-medium text-bg shadow-lg"
          >
            {toastMsg.text}
          </div>
        )}
      </div>
    </ConsoleContext.Provider>
  )
}
