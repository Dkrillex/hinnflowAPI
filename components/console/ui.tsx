'use client'

/**
 * 控制台的小组件集合。视觉沿用站点令牌：发丝描边卡片、药丸按钮、muted 正文灰。
 * 控制台是工具页，比营销页更紧凑：字号整体小一档，卡片内边距收到 20–24px。
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { useI18n } from '@/lib/i18n/context'
import { formatMoney } from '@/lib/newapi/pricing'

/* ── 控制台上下文 ───────────────────────────────────────────────── */

type ConsoleValue = {
  /** 网关对外地址：示例代码里的 Base URL、外链到网关自带页面 */
  gatewayUrl: string
  toast: (message: string) => void
}

export const ConsoleContext = createContext<ConsoleValue | null>(null)

export function useConsole(): ConsoleValue {
  const v = useContext(ConsoleContext)
  if (!v) throw new Error('useConsole 必须在 ConsoleShell 内使用')
  return v
}

/**
 * 额度 → 金额。new-api 内部以"额度"记账，quota_per_unit 额度 = $1。
 * balance：余额类数字，固定两位小数；cost：单次消耗这种小额，四位有效数字。
 */
export function useMoney() {
  const session = useSession()
  const wallet = session.status === 'authenticated' ? session.wallet : undefined
  return useCallback(
    (quota: number, style: 'balance' | 'cost' = 'balance') => {
      if (!wallet) return '—'
      const usd = quota / wallet.quotaPerUnit
      if (style === 'cost') return formatMoney(usd, wallet.currency)
      const v = usd * wallet.currency.rate
      return `${wallet.currency.symbol}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    [wallet]
  )
}

/** 美元金额 ↔ 额度 */
export function useQuotaUnit() {
  const session = useSession()
  return session.status === 'authenticated' && session.wallet ? session.wallet.quotaPerUnit : 500000
}

export function formatDateTime(ts: number, locale: string) {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ts * 1000))
}

export function compactNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

/* ── 版式 ───────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.625rem] font-medium leading-tight tracking-[-0.02em] text-fg md:text-[2rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[0.9375rem] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  actions,
  children,
  className = '',
  bodyClassName = 'p-5 md:p-6',
}: {
  title?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/10 px-5 py-4 md:px-6">
          {title && <h2 className="text-[0.9375rem] font-medium text-fg">{title}</h2>}
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-[0.8125rem] text-muted">{label}</div>
      <div className="mt-2 text-[1.375rem] font-medium tracking-[-0.02em] text-fg sm:text-[1.625rem]">{value}</div>
      {hint && <div className="mt-1 text-[0.75rem] text-muted">{hint}</div>}
    </div>
  )
}

/* ── 控件 ───────────────────────────────────────────────────────── */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'ghost' | 'danger' | 'quiet'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'ghost', size = 'md', className = '', ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-medium leading-none transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55'
  const sizes = size === 'sm' ? 'h-8 px-3.5 text-[0.8125rem]' : 'h-10 px-5 text-[0.875rem]'
  const variants = {
    solid: 'bg-fg text-bg hover:opacity-90',
    ghost: 'border border-line/15 text-fg hover:border-line/35 hover:bg-line/5',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    quiet: 'text-muted hover:bg-line/5 hover:text-fg',
  }
  return <button type="button" className={`${base} ${sizes} ${variants[variant]} ${className}`} {...rest} />
}

export const inputClass =
  'h-10 w-full rounded-tile border border-line/15 bg-transparent px-3.5 text-[0.875rem] text-fg placeholder:text-muted/70 transition-colors hover:border-line/30 focus:border-flow focus:outline-none disabled:opacity-55'

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[0.75rem] text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[0.75rem] text-muted">{hint}</p>
      )}
    </div>
  )
}

export function SelectBox({
  value,
  onChange,
  children,
  id,
  label,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  id?: string
  label?: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} cursor-pointer appearance-none pr-9 [&>option]:bg-surface`}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-flow' : 'bg-line/20'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-9 items-center rounded-full border border-line/12 p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors ${
              on ? 'bg-fg text-bg' : 'text-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── 反馈 ───────────────────────────────────────────────────────── */

export function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const { dict } = useI18n()
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="text-[0.9375rem] text-muted">{message || dict.console.loadError}</p>
      <Button size="sm" onClick={onRetry}>
        {dict.console.retry}
      </Button>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-md bg-line/[0.08] ${className}`} />
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  const { dict } = useI18n()
  return (
    <div role="status" aria-label={dict.console.loading} className="space-y-3 p-5 md:p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'ok' | 'warn' | 'bad' | 'neutral'; children: React.ReactNode }) {
  const dot = { ok: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-rose-500', neutral: 'bg-muted/50' }[tone]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line/12 px-2.5 py-1 text-[0.75rem] leading-none text-fg">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (p: number) => void
}) {
  const { dict } = useI18n()
  const c = dict.console
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-[0.8125rem] text-muted md:px-6">
      <span>{c.total.replace('{n}', String(total))}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="quiet" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          {c.prev}
        </Button>
        <span className="tabular-nums">{c.pageOf.replace('{p}', String(page)).replace('{n}', String(pages))}</span>
        <Button size="sm" variant="quiet" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          {c.next}
        </Button>
      </div>
    </nav>
  )
}

/* ── 对话框 ─────────────────────────────────────────────────────── */

/**
 * 原生 <dialog>.showModal()：焦点圈定、Esc 关闭、背景 inert 由浏览器负责。
 * open 由父组件控制；关闭（含 Esc、点遮罩）一律回调 onClose。
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const { dict } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      // showModal 会把焦点放到第一个可聚焦元素（关闭按钮）；有 data-autofocus 的输入框优先
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && d.open) d.close()
  }, [open])
  const width = { sm: 'w-[min(100%-2rem,26rem)]', md: 'w-[min(100%-2rem,34rem)]', lg: 'w-[min(100%-2rem,44rem)]' }[size]
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label={title}
      className={`m-auto max-h-[min(90vh,52rem)] overflow-hidden rounded-card border border-line/12 bg-surface p-0 text-fg backdrop:bg-black/55 backdrop:backdrop-blur-sm ${width}`}
    >
      {open && (
        <div className="flex max-h-[min(90vh,52rem)] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line/10 px-6 py-4">
            <h2 className="text-[1.0625rem] font-medium">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.console.close}
              className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/5 hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <footer className="flex justify-end gap-2 border-t border-line/10 px-6 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const { dict } = useI18n()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>{dict.console.cancel}</Button>
          <Button variant="danger" disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[0.9375rem] leading-relaxed text-muted">{message}</p>
    </Dialog>
  )
}

/* ── 复制 ───────────────────────────────────────────────────────── */

/** 复制按钮；text 可以是异步获取的（完整密钥要先向服务端要） */
export function CopyText({
  text,
  label,
  className = '',
}: {
  text: string | (() => Promise<string>)
  label: string
  className?: string
}) {
  const { dict } = useI18n()
  const { toast } = useConsole()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1500)
    return () => clearTimeout(t)
  }, [done])
  const copy = async () => {
    try {
      const value = typeof text === 'string' ? text : await text()
      await navigator.clipboard.writeText(value)
      setDone(true)
      toast(dict.console.copied)
    } catch {
      toast(dict.console.loadError)
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? dict.console.copied : label}
      title={done ? dict.console.copied : label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/5 hover:text-fg ${className}`}
    >
      {done ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-flow" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
          <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
        </svg>
      )}
    </button>
  )
}
