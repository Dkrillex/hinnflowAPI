'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { MarketplaceData } from '@/lib/newapi/client'
import { currencyOf, formatMoney, normalizeModels, resolvePrice, sortPrice } from '@/lib/newapi/pricing'
import { useI18n } from '@/lib/i18n/context'
import { Eyebrow, Em } from '@/components/SectionHeading'
import { Reveal } from '@/components/motion'
import { ModelCard } from './ModelCard'
import { ModelTable } from './ModelTable'
import { ModelDialog } from './ModelDialog'
import { useVendorLabel, type PriceFmt } from './shared'

type Unit = '1M' | '1K'
type SortKey = 'name' | 'input' | 'output'
type View = 'cards' | 'table'

const VIEW_KEY = 'marketplace:view'

/** 分段切换（单位、视图）。用 radio 语义，方向键可在选项间移动 */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: React.ReactNode; title?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-10 items-center rounded-full border border-line/12 p-1">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            aria-label={o.title}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
              e.preventDefault()
              const i = options.findIndex((x) => x.value === value)
              const next = options[(i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length]
              onChange(next.value)
              ;(e.currentTarget.parentElement?.querySelector(`[data-v="${next.value}"]`) as HTMLElement | null)?.focus()
            }}
            data-v={o.value}
            className={`flex h-8 min-w-[2.75rem] items-center justify-center rounded-full px-3 text-[0.8125rem] font-medium transition-colors ${
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

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="relative flex h-10 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer appearance-none rounded-full border border-line/12 bg-transparent pl-4 pr-9 text-[0.8125rem] font-medium text-fg transition-colors hover:border-line/25 focus:outline-none focus-visible:border-flow [&>option]:bg-surface"
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3.5 h-3.5 w-3.5 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  )
}

function ErrorState() {
  const { dict } = useI18n()
  const m = dict.marketplace
  const router = useRouter()
  return (
    <div className="card mx-auto max-w-xl p-10 text-center">
      <h2 className="text-[1.25rem] font-medium text-fg">{m.errorTitle}</h2>
      <p className="mt-3 text-[0.9375rem] text-muted">{m.errorBody}</p>
      <button type="button" onClick={() => router.refresh()} className="pill-ghost mt-8 !py-3">
        {m.retry}
      </button>
    </div>
  )
}

export function Marketplace({ data }: { data: MarketplaceData | null }) {
  const { dict } = useI18n()
  const m = dict.marketplace
  const vendorLabel = useVendorLabel()

  const [query, setQuery] = useState('')
  const [vendor, setVendor] = useState<string | null>(null)
  const [group, setGroup] = useState<string | null>(null)
  const [unit, setUnit] = useState<Unit>('1M')
  const [sort, setSort] = useState<SortKey>('name')
  const [view, setView] = useState<View>('cards')
  const [selected, setSelected] = useState<string | null>(null)

  // 首帧用服务端取数时刻，保证水合一致；挂载后换成真实时间并每分钟走一次，时段价格随之切换
  const [now, setNow] = useState(() => new Date(data?.fetchedAt ?? 0))
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY)
      if (v === 'cards' || v === 'table') setView(v)
    } catch {
      // 无痕模式等场景读不到，用默认值
    }
  }, [])
  const changeView = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // 同上
    }
  }

  const models = useMemo(
    () => (data ? normalizeModels(data.pricing, data.status, data.perf) : []),
    [data]
  )

  const vendors = useMemo(() => {
    const counts = new Map<string, number>()
    for (const md of models) counts.set(md.vendor, (counts.get(md.vendor) ?? 0) + 1)
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [models])

  const groupRatio = useMemo(() => data?.pricing.group_ratio ?? {}, [data])
  const groups = Object.keys(data?.pricing.usable_group ?? groupRatio).filter(Boolean)

  const fmt: PriceFmt = useMemo(() => {
    const c = currencyOf(data?.status ?? {})
    const r = group ? (groupRatio[group] ?? 1) : 1
    const div = unit === '1K' ? 1000 : 1
    return {
      token: (usd) => formatMoney((usd * r) / div, c),
      request: (usd) => formatMoney(usd * r, c),
      unit,
    }
  }, [data, group, groupRatio, unit])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = models.filter((md) => {
      if (vendor && md.vendor !== vendor) return false
      if (group && !md.groups.includes(group)) return false
      if (!q) return true
      return [md.name, vendorLabel(md.vendor), md.description, ...md.tags, ...md.endpoints].some((s) =>
        s.toLowerCase().includes(q)
      )
    })
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      const f = sort === 'input' ? 'p' : 'c'
      return sortPrice(a.billing, now, f) - sortPrice(b.billing, now, f) || a.name.localeCompare(b.name)
    })
    return list.map((model) => ({ model, price: resolvePrice(model.billing, now) }))
  }, [models, query, vendor, group, sort, now, vendorLabel])

  const selectedRow = rows.find((r) => r.model.name === selected) ?? null
  const filtered = query !== '' || vendor !== null || group !== null

  const chip = (on: boolean) =>
    `inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[0.8125rem] font-medium transition-colors ${
      on ? 'border-fg bg-fg text-bg' : 'border-line/12 text-muted hover:border-line/30 hover:text-fg'
    }`

  return (
    <section className="relative pb-24 pt-36 md:pb-32 md:pt-44">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>{m.eyebrow}</Eyebrow>
            {data && (
              <span className="inline-flex items-center gap-2 rounded-full border border-line/12 px-3 py-1 text-[0.75rem] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {m.liveCount.replace('{n}', String(models.length))}
              </span>
            )}
          </div>
          <h1 className="mt-6 max-w-4xl text-[2.25rem] font-medium leading-[1.1] tracking-[-0.02em] text-fg md:text-[3.75rem]">
            {m.titleLead}
            <Em>{m.titleAccent}</Em>
          </h1>
          <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">{m.subtitle}</p>
        </Reveal>

        {!data ? (
          <div className="mt-14">
            <ErrorState />
          </div>
        ) : (
          <>
            <Reveal delay={100} className="mt-12">
              <div className="card space-y-4 p-4 md:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <label className="relative flex-1">
                    <span className="sr-only">{m.searchLabel}</span>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="11" cy="11" r="6.5" />
                      <path d="m16 16 4 4" strokeLinecap="round" />
                    </svg>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={m.searchPlaceholder}
                      className="h-11 w-full rounded-full border border-line/12 bg-transparent pl-11 pr-4 text-[0.9375rem] text-fg placeholder:text-muted/80 transition-colors hover:border-line/25 focus:border-flow focus:outline-none"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    {groups.length > 1 && (
                      <Select label={m.groupLabel} value={group ?? ''} onChange={(v) => setGroup(v || null)}>
                        <option value="">{m.allGroups}</option>
                        {groups.map((g) => (
                          <option key={g} value={g}>
                            {g} {m.groupRatio.replace('{r}', String(groupRatio[g] ?? 1))}
                          </option>
                        ))}
                      </Select>
                    )}
                    <Select label={m.sortLabel} value={sort} onChange={(v) => setSort(v as SortKey)}>
                      <option value="name">{m.sort.name}</option>
                      <option value="input">{m.sort.input}</option>
                      <option value="output">{m.sort.output}</option>
                    </Select>
                    <Segmented<Unit>
                      label={m.unitLabel}
                      value={unit}
                      onChange={setUnit}
                      options={[
                        { value: '1M', label: '/1M' },
                        { value: '1K', label: '/1K' },
                      ]}
                    />
                    <Segmented<View>
                      label={m.viewLabel}
                      value={view}
                      onChange={changeView}
                      options={[
                        {
                          value: 'cards',
                          title: m.viewCards,
                          label: (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                              <rect x="4" y="4" width="7" height="7" rx="1.5" />
                              <rect x="13" y="4" width="7" height="7" rx="1.5" />
                              <rect x="4" y="13" width="7" height="7" rx="1.5" />
                              <rect x="13" y="13" width="7" height="7" rx="1.5" />
                            </svg>
                          ),
                        },
                        {
                          value: 'table',
                          title: m.viewTable,
                          label: (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                            </svg>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" aria-pressed={vendor === null} onClick={() => setVendor(null)} className={chip(vendor === null)}>
                    {m.allVendors}
                    <span className="tabular-nums opacity-60">{models.length}</span>
                  </button>
                  {vendors.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      aria-pressed={vendor === v.name}
                      onClick={() => setVendor(vendor === v.name ? null : v.name)}
                      className={chip(vendor === v.name)}
                    >
                      {vendorLabel(v.name)}
                      <span className="tabular-nums opacity-60">{v.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            <div className="mt-6 flex items-center justify-between text-[0.8125rem] text-muted">
              <span aria-live="polite">{m.resultCount.replace('{n}', String(rows.length))}</span>
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setVendor(null)
                    setGroup(null)
                  }}
                  className="transition-colors hover:text-fg"
                >
                  {m.resetFilters}
                </button>
              )}
            </div>

            <div className="mt-4">
              {rows.length === 0 ? (
                <div className="card p-12 text-center text-[0.9375rem] text-muted">{m.empty}</div>
              ) : view === 'table' ? (
                <ModelTable rows={rows} fmt={fmt} onOpen={setSelected} />
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map(({ model, price }) => (
                    <ModelCard key={model.name} model={model} price={price} fmt={fmt} onOpen={() => setSelected(model.name)} />
                  ))}
                </div>
              )}
            </div>

            <ModelDialog
              model={selectedRow?.model ?? null}
              price={selectedRow?.price ?? null}
              fmt={fmt}
              now={now}
              group={group}
              groupRatio={groupRatio}
              baseUrl={data.baseUrl}
              endpointPaths={data.pricing.supported_endpoint ?? {}}
              onClose={() => setSelected(null)}
            />
          </>
        )}
      </div>
    </section>
  )
}
