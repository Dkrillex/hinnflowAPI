'use client'

import type { MarketModel, ResolvedPrice } from '@/lib/newapi/pricing'
import { useI18n } from '@/lib/i18n/context'
import {
  BillingBadge,
  Chip,
  CopyButton,
  PerfRow,
  PrimaryPrices,
  TierHint,
  VendorMark,
  useVendorLabel,
  type PriceFmt,
} from './shared'

export function ModelCard({
  model,
  price,
  fmt,
  onOpen,
}: {
  model: MarketModel
  price: ResolvedPrice | null
  fmt: PriceFmt
  onOpen: () => void
}) {
  const { dict } = useI18n()
  const m = dict.marketplace
  const vendorLabel = useVendorLabel()

  return (
    <article className="card flex h-full flex-col p-6 hover:border-line/25">
      <header className="flex items-start gap-3.5">
        <VendorMark vendor={model.vendor} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-mono text-[1rem] font-medium text-fg" title={model.name}>
            {model.name}
          </h3>
          <p className="mt-0.5 text-[0.8125rem] text-muted">{vendorLabel(model.vendor)}</p>
        </div>
        <CopyButton text={model.name} className="-mr-1.5 -mt-1" />
      </header>

      <p className="mt-4 line-clamp-2 text-[0.875rem] leading-relaxed text-muted">
        {model.description || m.noDescription}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <BillingBadge model={model} />
        <TierHint model={model} price={price} />
      </div>

      <div className="mt-4">
        <PrimaryPrices price={price} fmt={fmt} />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {model.groups.map((g) => (
          <Chip key={`g-${g}`}>{g}</Chip>
        ))}
        {model.endpoints.map((e) => (
          <Chip key={`e-${e}`}>{e}</Chip>
        ))}
        {model.tags.map((t) => (
          <Chip key={`t-${t}`}>#{t}</Chip>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-end gap-4 border-t border-line/10 pt-4">
          <div className="min-w-0 flex-1">
            <PerfRow perf={model.perf} />
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="flex shrink-0 items-center gap-1 rounded-full py-1 pl-3 pr-2 text-[0.8125rem] font-medium text-fg transition-colors hover:bg-line/5"
          >
            {m.details}
            <span className="sr-only"> {model.name}</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}
