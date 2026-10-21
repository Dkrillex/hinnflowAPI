'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelPerf } from '@/lib/newapi/client'
import { OTHER_VENDOR, type MarketModel, type ResolvedPrice } from '@/lib/newapi/pricing'
import type { PriceVar } from '@/lib/newapi/billing-expr'
import { useI18n } from '@/lib/i18n/context'

/** 价格格式化器：已乘好分组倍率、换算好单位与币种 */
export type PriceFmt = {
  token: (usd: number) => string
  request: (usd: number) => string
  /** "1M" / "1K" */
  unit: string
}

export function useVendorLabel() {
  const other = useI18n().dict.marketplace.otherVendor
  return useCallback((v: string) => (v === OTHER_VENDOR ? other : v), [other])
}

/**
 * 供应商字母砖。与首页模型矩阵一样不用厂商商标，只取名称首字母，
 * 主题色描边砖 + 强调色字，深浅主题共用。
 */
export function VendorMark({ vendor, className = 'h-11 w-11 text-[0.9375rem]' }: { vendor: string; className?: string }) {
  const label = useVendorLabel()(vendor)
  const initials = label
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-tile border border-line/12 bg-line/[0.04] font-medium text-accent ${className}`}
    >
      {initials}
    </span>
  )
}

/** 复制到剪贴板，1.5 秒内返回已复制状态；剪贴板不可用（非安全上下文）时静默失败 */
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(null), 1500)
    } catch {
      // 忽略
    }
  }, [])
  return { copied, copy }
}

export function CopyButton({ text, label, className = '' }: { text: string; label?: string; className?: string }) {
  const { dict } = useI18n()
  const { copied, copy } = useCopy()
  const done = copied === text
  const idle = label ?? dict.marketplace.copy
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={done ? dict.marketplace.copied : idle}
      title={done ? dict.marketplace.copied : idle}
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

export function BillingBadge({ model }: { model: MarketModel }) {
  const { dict } = useI18n()
  const kind = model.billing.kind
  const label =
    kind === 'token' ? dict.marketplace.billing.token : kind === 'request' ? dict.marketplace.billing.request : dict.marketplace.billing.expr
  const dynamic = kind === 'expr' || kind === 'opaque'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.75rem] leading-none ${
        dynamic ? 'border-flow/30 bg-flow/10 text-accent' : 'border-line/12 text-muted'
      }`}
    >
      {label}
    </span>
  )
}

/** 动态计费的档位说明：当前档位名 + 它为什么是当前档位 */
export function TierHint({ model, price }: { model: MarketModel; price: ResolvedPrice | null }) {
  const { dict } = useI18n()
  const m = dict.marketplace
  if (model.billing.kind !== 'expr' || !price?.tier || model.billing.parsed.tiers.length < 2) return null
  const note = model.billing.parsed.timeBased ? m.timeTierNote : model.billing.parsed.lengthBased ? m.lengthTierNote : null
  return (
    <span className="text-[0.75rem] text-muted">
      {m.tierNames[price.tier] ?? price.tier}
      {note && ` · ${note}`}
    </span>
  )
}

/** 一项单价：标签 + 金额 + 单位 */
export function PriceItem({
  label,
  value,
  unit,
  size = 'md',
}: {
  label: string
  value: string
  unit: string
  size?: 'md' | 'lg'
}) {
  return (
    <div className="min-w-0">
      <div className="text-[0.75rem] text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1 whitespace-nowrap">
        <span
          className={`font-medium tabular-nums tracking-[-0.01em] text-fg ${
            size === 'lg' ? 'text-[1.375rem]' : 'text-[1.0625rem]'
          }`}
        >
          {value}
        </span>
        <span className="text-[0.75rem] text-muted">/ {unit}</span>
      </div>
    </div>
  )
}

/** 卡片上的主价格：按次只给一项；按 token 最多三项（输入、输出 + 第一个附加项） */
export function PrimaryPrices({ price, fmt, max = 3 }: { price: ResolvedPrice | null; fmt: PriceFmt; max?: number }) {
  const { dict } = useI18n()
  const m = dict.marketplace
  if (!price) return <p className="text-[0.875rem] text-muted">{m.billing.expr}</p>
  if (price.perRequest !== undefined) {
    return <PriceItem label={m.billing.request} value={fmt.request(price.perRequest)} unit={m.perRequest} size="lg" />
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      {price.lines.slice(0, max).map((l) => (
        <PriceItem key={l.key} label={m.price[l.key as PriceVar]} value={fmt.token(l.usd)} unit={fmt.unit} />
      ))}
    </div>
  )
}

function rateColor(rate: number) {
  if (rate >= 99) return 'bg-emerald-500'
  if (rate >= 95) return 'bg-amber-500'
  return 'bg-rose-500'
}

/** 近 24 小时的逐小时成功率，最多 24 根柱 */
export function SuccessBars({ perf }: { perf: ModelPerf }) {
  const series = (perf.recent_success_series ?? []).slice(-24)
  if (series.length === 0) return null
  return (
    <span aria-hidden className="flex h-4 items-end gap-[2px]">
      {series.map((s) => (
        <span
          key={s.ts}
          className={`w-[3px] rounded-full ${rateColor(s.success_rate)}`}
          style={{ height: `${Math.max(30, s.success_rate)}%` }}
        />
      ))}
    </span>
  )
}

export function formatLatency(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`
}

export function PerfRow({ perf }: { perf?: ModelPerf }) {
  const { dict } = useI18n()
  const p = dict.marketplace.perf
  if (!perf) {
    return <p className="text-[0.75rem] text-muted">{p.noData}</p>
  }
  return (
    <dl className="grid grid-cols-3 gap-3 text-[0.75rem]">
      <div>
        <dt className="text-muted">{p.status}</dt>
        <dd className="mt-1 flex items-center gap-2 font-medium tabular-nums text-fg">
          {perf.success_rate.toFixed(perf.success_rate === 100 ? 0 : 1)}%
          <SuccessBars perf={perf} />
        </dd>
      </div>
      <div>
        <dt className="text-muted">{p.latency}</dt>
        <dd className="mt-1 font-medium tabular-nums text-fg">{formatLatency(perf.avg_latency_ms)}</dd>
      </div>
      <div>
        <dt className="text-muted">{p.throughput}</dt>
        <dd className="mt-1 font-medium tabular-nums text-fg">{perf.avg_tps.toFixed(1)} t/s</dd>
      </div>
    </dl>
  )
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line/12 px-2.5 py-1 text-[0.75rem] leading-none text-muted">
      {children}
    </span>
  )
}
