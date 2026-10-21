'use client'

import { useEffect, useRef } from 'react'
import { activeTierIndex, type PriceVar } from '@/lib/newapi/billing-expr'
import { tierPrice, type MarketModel, type ResolvedPrice } from '@/lib/newapi/pricing'
import { useI18n } from '@/lib/i18n/context'
import {
  BillingBadge,
  Chip,
  CopyButton,
  PerfRow,
  PriceItem,
  TierHint,
  VendorMark,
  useVendorLabel,
  type PriceFmt,
} from './shared'

function PriceGrid({ price, fmt }: { price: ResolvedPrice; fmt: PriceFmt }) {
  const { dict } = useI18n()
  const m = dict.marketplace
  if (price.perRequest !== undefined) {
    return <PriceItem label={m.billing.request} value={fmt.request(price.perRequest)} unit={m.perRequest} size="lg" />
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
      {price.lines.map((l) => (
        <PriceItem key={l.key} label={m.price[l.key as PriceVar]} value={fmt.token(l.usd)} unit={fmt.unit} />
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line/10 pt-5">
      <h3 className="label mb-4">{title}</h3>
      {children}
    </section>
  )
}

/**
 * 模型详情。用原生 <dialog>.showModal()：焦点圈定、Esc 关闭、背景 inert 都由浏览器负责，
 * 不用自己实现键盘陷阱。
 */
export function ModelDialog({
  model,
  price,
  fmt,
  now,
  group,
  groupRatio,
  baseUrl,
  endpointPaths,
  onClose,
}: {
  model: MarketModel | null
  price: ResolvedPrice | null
  fmt: PriceFmt
  now: Date
  group: string | null
  groupRatio: Record<string, number>
  baseUrl: string
  endpointPaths: Record<string, { path: string; method: string }>
  onClose: () => void
}) {
  const { dict } = useI18n()
  const m = dict.marketplace
  const vendorLabel = useVendorLabel()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (model && !d.open) d.showModal()
    if (!model && d.open) d.close()
  }, [model])

  const chat = model?.endpoints.includes('openai')
  const snippet = model
    ? `curl ${baseUrl}${endpointPaths.openai?.path ?? '/v1/chat/completions'} \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${model.name}", "messages": [{"role": "user", "content": "Hello"}]}'`
    : ''

  const billing = model?.billing
  const active = billing?.kind === 'expr' ? activeTierIndex(billing.parsed, now) : -1

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="model-dialog-title"
      className="m-auto max-h-[min(88vh,52rem)] w-[min(100%-2rem,42rem)] overflow-hidden rounded-card border border-line/12 bg-surface p-0 text-fg backdrop:bg-black/55 backdrop:backdrop-blur-sm"
    >
      {model && (
        <div className="flex max-h-[min(88vh,52rem)] flex-col">
          <header className="flex items-start gap-3.5 border-b border-line/10 px-6 py-5">
            <VendorMark vendor={model.vendor} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h2 id="model-dialog-title" className="truncate font-mono text-[1.125rem] font-medium">
                  {model.name}
                </h2>
                <CopyButton text={model.name} />
              </div>
              <p className="text-[0.8125rem] text-muted">{vendorLabel(model.vendor)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={m.close}
              className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/5 hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="space-y-6 overflow-y-auto px-6 py-6">
            <p className="text-[0.9375rem] leading-relaxed text-muted">{model.description || m.noDescription}</p>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <BillingBadge model={model} />
                <TierHint model={model} price={price} />
              </div>
              {price && <PriceGrid price={price} fmt={fmt} />}
              {group && group in groupRatio && (
                <p className="text-[0.75rem] text-muted">{m.groupNote.replace('{g}', group)}</p>
              )}
            </div>

            {billing?.kind === 'expr' && billing.parsed.tiers.length > 1 && (
              <Section title={m.tiersTitle}>
                <ul className="space-y-3">
                  {billing.parsed.tiers.map((t, i) => (
                    <li
                      key={`${t.name}-${i}`}
                      className={`rounded-tile border p-4 ${i === active ? 'border-flow/40 bg-flow/[0.06]' : 'border-line/10'}`}
                    >
                      <div className="mb-3 flex items-center gap-2 text-[0.8125rem] font-medium">
                        {m.tierNames[t.name] ?? t.name}
                        {i === active && (
                          <span className="rounded-full bg-flow px-2 py-0.5 text-[0.6875rem] text-white">
                            {m.tierActive}
                          </span>
                        )}
                      </div>
                      <PriceGrid price={tierPrice(t)} fmt={fmt} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {billing?.kind === 'expr' && billing.parsed.requestRules && (
              <p className="text-[0.8125rem] text-muted">{m.requestRulesNote}</p>
            )}

            {(billing?.kind === 'expr' || billing?.kind === 'opaque') && (
              <details className="group text-[0.8125rem]">
                <summary className="cursor-pointer text-muted transition-colors hover:text-fg">{m.rawExpr}</summary>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-tile border border-line/10 bg-line/[0.04] p-4 font-mono text-[0.75rem] leading-relaxed text-fg">
                  {billing.expr}
                </pre>
              </details>
            )}

            <Section title={m.perf.window}>
              <PerfRow perf={model.perf} />
            </Section>

            <Section title={`${m.groups} · ${m.endpoints}`}>
              <div className="flex flex-wrap gap-1.5">
                {model.groups.map((g) => (
                  <Chip key={`g-${g}`}>
                    {g}
                    {groupRatio[g] !== undefined && <span className="ml-1.5 opacity-70">×{groupRatio[g]}</span>}
                  </Chip>
                ))}
                {model.endpoints.map((e) => (
                  <Chip key={`e-${e}`}>
                    {e}
                    {endpointPaths[e] && (
                      <span className="ml-1.5 font-mono opacity-70">
                        {endpointPaths[e].method} {endpointPaths[e].path}
                      </span>
                    )}
                  </Chip>
                ))}
              </div>
            </Section>

            {chat && (
              <Section title={m.exampleTitle}>
                <div className="relative">
                  <pre className="overflow-x-auto rounded-tile border border-line/10 bg-line/[0.04] p-4 pr-12 font-mono text-[0.75rem] leading-relaxed text-fg">
                    {snippet}
                  </pre>
                  <CopyButton text={snippet} label={m.copyCode} className="absolute right-2 top-2" />
                </div>
              </Section>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
