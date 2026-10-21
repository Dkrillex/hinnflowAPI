'use client'

import { useEffect, useRef, useState } from 'react'
import { logout, type Session } from '@/lib/auth/client'
import { useI18n } from '@/lib/i18n/context'

type Authed = Extract<Session, { status: 'authenticated' }>

export function Avatar({ name, className = 'h-8 w-8 text-[0.8125rem]' }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-flow font-medium uppercase text-white ${className}`}
    >
      {Array.from(name)[0] ?? '?'}
    </span>
  )
}

/** 余额按记账习惯固定两位小数（价格那套四位有效数字会显示成 $2.469） */
export function balanceText(session: Authed) {
  if (!session.wallet) return '—'
  const { balanceUsd, currency } = session.wallet
  const v = balanceUsd * currency.rate
  return `${currency.symbol}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** 桌面端导航右侧的账户菜单：头像按钮 + 下拉面板（账户、余额、退出） */
export function UserMenu({ session }: { session: Authed }) {
  const { dict } = useI18n()
  const m = dict.auth.menu
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const { user } = session

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative ml-1">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="user-menu"
        aria-label={m.account}
        className="flex h-10 items-center gap-2 rounded-full border border-line/15 py-1 pl-1 pr-3.5 transition-colors hover:border-line/35"
      >
        <Avatar name={user.displayName} />
        <span className="max-w-[9rem] truncate text-[0.875rem] font-medium text-fg">{user.displayName}</span>
      </button>

      <div
        id="user-menu"
        className={`absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-card border border-line/12 bg-surface/95 p-2 backdrop-blur-xl transition-all duration-200 ease-flow ${
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        }`}
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar name={user.displayName} className="h-10 w-10 text-[0.9375rem]" />
          <div className="min-w-0">
            <div className="truncate text-[0.9375rem] font-medium text-fg">{user.displayName}</div>
            <div className="truncate text-[0.8125rem] text-muted">{user.email || user.username}</div>
          </div>
        </div>
        <div className="mx-3 flex items-center justify-between border-t border-line/10 py-3 text-[0.875rem]">
          <span className="text-muted">{m.balance}</span>
          <span className="font-medium tabular-nums text-fg">{balanceText(session)}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            void logout()
          }}
          className="w-full rounded-tile px-3 py-2.5 text-left text-[0.875rem] text-muted transition-colors hover:bg-line/5 hover:text-fg"
        >
          {m.logout}
        </button>
      </div>
    </div>
  )
}
