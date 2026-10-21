'use client'

import type { MarketModel, ResolvedPrice } from '@/lib/newapi/pricing'
import { useI18n } from '@/lib/i18n/context'
import { BillingBadge, CopyButton, VendorMark, formatLatency, useVendorLabel, type PriceFmt } from './shared'

type Row = { model: MarketModel; price: ResolvedPrice | null }

/** 某一项单价；按次计价的模型只在"输入"列给单次价 */
function cell(price: ResolvedPrice | null, key: 'p' | 'c' | 'cr', fmt: PriceFmt, perRequest: string) {
  if (!price) return '—'
  if (price.perRequest !== undefined) return key === 'p' ? `${fmt.request(price.perRequest)} / ${perRequest}` : '—'
  const line = price.lines.find((l) => l.key === key)
  return line ? fmt.token(line.usd) : '—'
}

export function ModelTable({ rows, fmt, onOpen }: { rows: Row[]; fmt: PriceFmt; onOpen: (name: string) => void }) {
  const { dict } = useI18n()
  const m = dict.marketplace
  const vendorLabel = useVendorLabel()
  const th = 'px-4 py-3 text-left text-[0.75rem] font-medium text-muted whitespace-nowrap'

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[56rem] border-collapse text-[0.875rem]">
        <thead>
          <tr className="border-b border-line/10">
            <th scope="col" className={`${th} pl-6`}>
              {m.tableModel}
            </th>
            <th scope="col" className={th}>
              {m.tableBilling}
            </th>
            <th scope="col" className={`${th} text-right`}>
              {m.price.p} <span className="font-normal">/ {fmt.unit}</span>
            </th>
            <th scope="col" className={`${th} text-right`}>
              {m.price.c} <span className="font-normal">/ {fmt.unit}</span>
            </th>
            <th scope="col" className={`${th} text-right`}>
              {m.price.cr} <span className="font-normal">/ {fmt.unit}</span>
            </th>
            <th scope="col" className={`${th} text-right`}>
              {m.perf.status}
            </th>
            <th scope="col" className={`${th} text-right`}>
              {m.perf.latency}
            </th>
            <th scope="col" className={`${th} pr-6`}>
              <span className="sr-only">{m.details}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ model, price }) => (
            <tr key={model.name} className="border-b border-line/[0.06] last:border-0 hover:bg-line/[0.03]">
              <td className="py-3 pl-6 pr-4">
                <div className="flex items-center gap-3">
                  <VendorMark vendor={model.vendor} className="h-8 w-8 text-[0.75rem]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium text-fg">{model.name}</span>
                      <CopyButton text={model.name} className="h-7 w-7" />
                    </div>
                    <div className="text-[0.75rem] text-muted">{vendorLabel(model.vendor)}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <BillingBadge model={model} />
              </td>
              {(['p', 'c', 'cr'] as const).map((k) => (
                <td key={k} className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-fg">
                  {cell(price, k, fmt, m.perRequest)}
                </td>
              ))}
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-fg">
                {model.perf ? `${model.perf.success_rate.toFixed(model.perf.success_rate === 100 ? 0 : 1)}%` : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-fg">
                {model.perf ? formatLatency(model.perf.avg_latency_ms) : '—'}
              </td>
              <td className="py-3 pl-4 pr-6 text-right">
                <button
                  type="button"
                  onClick={() => onOpen(model.name)}
                  className="rounded-full px-3 py-1 text-[0.8125rem] font-medium text-fg transition-colors hover:bg-line/5"
                >
                  {m.details}
                  <span className="sr-only"> {model.name}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
