'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { loadSession, useSession } from '@/lib/auth/client'
import { api, useApi } from '@/lib/console/api'
import { localeHref, useI18n } from '@/lib/i18n/context'
import {
  CopyText,
  ErrorState,
  PageHeader,
  Panel,
  Segmented,
  Skeleton,
  StatTile,
  compactNumber,
  useConsole,
  useMoney,
  useQuotaUnit,
} from './ui'

/** /api/data/self 的一行：某小时、某模型的聚合用量 */
type QuotaRow = { model_name: string; created_at: number; count: number; quota: number; token_used: number }

type Day = { key: string; date: Date; quota: number; count: number; tokens: number }

const DAY_MS = 86_400_000

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** 按访客本地时区切日，补齐没有调用的日子 */
function bucketByDay(rows: QuotaRow[], days: number): Day[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const list: Day[] = []
  const index = new Map<string, Day>()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS)
    const d = { key: dayKey(date), date, quota: 0, count: 0, tokens: 0 }
    list.push(d)
    index.set(d.key, d)
  }
  for (const r of rows) {
    const d = index.get(dayKey(new Date(r.created_at * 1000)))
    if (!d) continue
    d.quota += r.quota
    d.count += r.count
    d.tokens += r.token_used
  }
  return list
}

/** 轴刻度取整：1、2、2.5、5 × 10ⁿ */
function niceStep(raw: number) {
  if (raw <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(raw))
  const f = raw / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow
}

const TICKS = 4

/**
 * 每日消耗柱状图：单一系列，所以没有图例，标题就是系列名。
 * 柱宽封顶 24px、顶端 4px 圆角、从同一基线长出；网格线是 1px 实线发丝。
 * 每根柱都能悬停和键盘聚焦，提示框给出日期、金额与调用次数。
 */
function SpendChart({ days, money }: { days: Day[]; money: (q: number) => string }) {
  const { locale, dict } = useI18n()
  const o = dict.console.overview
  const [active, setActive] = useState<number | null>(null)

  // 刻度按金额取整（而不是按额度），$0.05、$0.2 这样的刻度才好读
  const unit = useQuotaUnit()
  const max = Math.max(...days.map((d) => d.quota), 0)
  const step = niceStep(max / unit / TICKS) * unit
  const top = step * TICKS
  const dayFmt = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' })
  // 30 天时每 5 天标一次日期，避免挤在一起
  const labelEvery = days.length > 10 ? 5 : 1
  const activeRatio = active !== null && top > 0 ? days[active].quota / top : 0
  const tipBelow = activeRatio > 0.65

  return (
    <div className="relative">
      <div className="flex">
        {/* y 轴刻度：金额，从上往下 */}
        <div aria-hidden className="relative mr-3 w-14 shrink-0 text-right text-[0.6875rem] tabular-nums text-muted">
          {Array.from({ length: TICKS + 1 }).map((_, i) => (
            <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / TICKS) * 100}%` }}>
              {money(top - step * i)}
            </span>
          ))}
        </div>

        <div className="relative h-56 flex-1">
          {Array.from({ length: TICKS + 1 }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute inset-x-0 h-px bg-line/[0.08]"
              style={{ top: `${(i / TICKS) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {days.map((d, i) => {
              const h = top > 0 ? (d.quota / top) * 100 : 0
              const label = `${dayFmt.format(d.date)} · ${o.spend} ${money(d.quota)} · ${o.calls} ${d.count}`
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-label={label}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((a) => (a === i ? null : a))}
                  className="group relative flex h-full flex-1 cursor-default items-end justify-center focus:outline-none"
                >
                  <span
                    className={`w-full max-w-6 rounded-t-[4px] transition-opacity ${
                      d.quota > 0 ? 'bg-flow dark:bg-flow-400' : ''
                    } ${active !== null && active !== i ? 'opacity-45' : ''} group-focus-visible:ring-2 group-focus-visible:ring-flow/50`}
                    style={{ height: d.quota > 0 ? `max(${h}%, 2px)` : 0 }}
                  />
                </button>
              )
            })}
          </div>

          {active !== null && (
            <div
              role="tooltip"
              // 柱子太高时提示框改放到柱顶下方，免得顶出图表压住标题栏
              className={`pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-tile border border-line/12 bg-surface px-3 py-2 text-[0.75rem] shadow-lg ${
                tipBelow ? '' : '-translate-y-full'
              }`}
              style={{
                left: `clamp(4rem, ${((active + 0.5) / days.length) * 100}%, calc(100% - 4rem))`,
                top: `calc(${100 - activeRatio * 100}% ${tipBelow ? '+ 8px' : '- 8px'})`,
              }}
            >
              <div className="text-[0.9375rem] font-medium tabular-nums text-fg">{money(days[active].quota)}</div>
              <div className="mt-0.5 text-muted">
                {dayFmt.format(days[active].date)} · {o.calls} {days[active].count.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div aria-hidden className="ml-[4.25rem] mt-2 flex gap-[2px] text-[0.6875rem] text-muted">
        {days.map((d, i) => (
          <span key={d.key} className="flex-1 text-center">
            {i % labelEvery === 0 || i === days.length - 1 ? dayFmt.format(d.date) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function DayTable({ days, money }: { days: Day[]; money: (q: number) => string }) {
  const { locale, dict } = useI18n()
  const o = dict.console.overview
  const fmt = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', weekday: 'short' })
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full text-[0.8125rem]">
        <thead className="sticky top-0 bg-surface">
          <tr className="text-left text-muted">
            <th className="py-2 font-medium">{o.day}</th>
            <th className="py-2 text-right font-medium">{o.spend}</th>
            <th className="py-2 text-right font-medium">{o.calls}</th>
            <th className="py-2 text-right font-medium">{o.tokens}</th>
          </tr>
        </thead>
        <tbody>
          {[...days].reverse().map((d) => (
            <tr key={d.key} className="border-t border-line/[0.06]">
              <td className="py-2 text-fg">{fmt.format(d.date)}</td>
              <td className="py-2 text-right tabular-nums text-fg">{money(d.quota)}</td>
              <td className="py-2 text-right tabular-nums text-fg">{d.count.toLocaleString()}</td>
              <td className="py-2 text-right tabular-nums text-fg">{compactNumber(d.tokens, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 区间内消耗最多的模型，单一色相的占比条；第 6 名起并入"其他" */
function ModelBreakdown({ rows, money }: { rows: QuotaRow[]; money: (q: number) => string }) {
  const { locale } = useI18n()
  const totals = new Map<string, { quota: number; count: number }>()
  for (const r of rows) {
    const t = totals.get(r.model_name) ?? { quota: 0, count: 0 }
    t.quota += r.quota
    t.count += r.count
    totals.set(r.model_name, t)
  }
  const sorted = Array.from(totals, ([name, t]) => ({ name, ...t })).sort((a, b) => b.quota - a.quota)
  const sum = sorted.reduce((s, m) => s + m.quota, 0)
  const top = sorted.slice(0, 5)
  const rest = sorted.slice(5)
  if (rest.length) {
    top.push({
      name: locale === 'zh' ? '其他' : 'Other',
      quota: rest.reduce((s, m) => s + m.quota, 0),
      count: rest.reduce((s, m) => s + m.count, 0),
    })
  }
  return (
    <ul className="space-y-4">
      {top.map((m) => {
        const share = sum > 0 ? m.quota / sum : 0
        return (
          <li key={m.name}>
            <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
              <span className="truncate font-mono text-fg">{m.name}</span>
              <span className="shrink-0 tabular-nums text-fg">
                {money(m.quota)} <span className="text-muted">· {Math.round(share * 100)}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-flow/[0.12]">
              <div className="h-full rounded-full bg-flow dark:bg-flow-400" style={{ width: `${Math.max(share * 100, 1)}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function OverviewPage() {
  const { locale, dict } = useI18n()
  const o = dict.console.overview
  const session = useSession()
  const money = useMoney()
  const { gatewayUrl } = useConsole()
  const [range, setRange] = useState<'7' | '30'>('7')
  const [view, setView] = useState<'chart' | 'table'>('chart')

  // 进控制台时刷新一次余额，登录时拿到的可能已经过时
  useEffect(() => {
    void loadSession(true)
  }, [])

  const days = Number(range)
  const usage = useApi(range, () => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const startTs = Math.floor((start.getTime() - (days - 1) * DAY_MS) / 1000)
    return api<QuotaRow[]>('data/self', { query: { start_timestamp: startTs, end_timestamp: Math.floor(Date.now() / 1000) } })
  })
  const rows = useMemo(() => usage.data ?? [], [usage.data])
  const byDay = useMemo(() => bucketByDay(rows, days), [rows, days])
  const rangeQuota = byDay.reduce((s, d) => s + d.quota, 0)

  if (session.status !== 'authenticated') return null
  const { user } = session
  const baseUrl = `${gatewayUrl}/v1`

  return (
    <div className="space-y-6">
      <PageHeader title={o.greeting.replace('{name}', user.displayName)} subtitle={o.subtitle} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label={o.balance} value={money(user.quota)} />
        <StatTile label={o.used} value={money(user.usedQuota)} />
        <StatTile label={o.requests} value={user.requestCount.toLocaleString()} />
        <StatTile
          label={o.rangeSpend}
          value={usage.loading && !usage.data ? '—' : money(rangeQuota)}
          hint={range === '7' ? o.range7 : o.range30}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel
          title={o.chartTitle}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                label={o.rangeLabel}
                value={range}
                onChange={setRange}
                options={[
                  { value: '7', label: o.range7 },
                  { value: '30', label: o.range30 },
                ]}
              />
              <Segmented
                label={o.chartTitle}
                value={view}
                onChange={setView}
                options={[
                  { value: 'chart', label: o.showChart },
                  { value: 'table', label: o.showTable },
                ]}
              />
            </div>
          }
        >
          {usage.error ? (
            <ErrorState onRetry={usage.reload} />
          ) : usage.loading && !usage.data ? (
            <Skeleton className="h-64 w-full" />
          ) : rangeQuota === 0 ? (
            <p className="py-20 text-center text-[0.9375rem] text-muted">{o.chartEmpty}</p>
          ) : view === 'chart' ? (
            <SpendChart days={byDay} money={(q) => money(q, 'cost')} />
          ) : (
            <DayTable days={byDay} money={(q) => money(q, 'cost')} />
          )}
        </Panel>

        <Panel title={o.byModel}>
          {usage.loading && !usage.data ? (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-[0.875rem] text-muted">{o.chartEmpty}</p>
          ) : (
            <ModelBreakdown rows={rows} money={(q) => money(q, 'cost')} />
          )}
        </Panel>
      </div>

      <Panel title={o.quickStart}>
        <p className="text-[0.875rem] leading-relaxed text-muted">{o.quickStartBody}</p>
        <div className="mt-4 flex items-center gap-2 rounded-tile border border-line/12 bg-line/[0.03] py-1.5 pl-4 pr-1.5">
          <span className="shrink-0 text-[0.75rem] text-muted">{o.baseUrl}</span>
          <code className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-fg">{baseUrl}</code>
          <CopyText text={baseUrl} label={dict.console.copy} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`${localeHref(locale, '/console/keys')}?new=1`} className="pill-solid !px-5 !py-2.5 !text-[0.875rem]">
            {o.createKey}
          </Link>
          <Link href={localeHref(locale, '/model')} className="pill-ghost !px-5 !py-2.5 !text-[0.875rem]">
            {o.browseModels}
          </Link>
        </div>
      </Panel>
    </div>
  )
}
