/**
 * 把 /api/pricing 的原始条目整理成展示用的统一结构。纯函数，服务端客户端都能用。
 *
 * 三种计费方式：
 *   - 倍率（quota_type 0）：输入 $/1M = model_ratio × 1e6 / quota_per_unit，
 *     输出 = 输入 × completion_ratio，缓存读写同理乘 cache_ratio / create_cache_ratio
 *   - 按次（quota_type 1）：model_price 就是每次请求的美元价
 *   - 动态表达式（billing_mode = tiered_expr）：见 billing-expr.ts
 * 分组倍率在最后统一乘上。
 */

import type { ModelPerf, PricingModel, PricingPayload, SiteStatus } from './client'
import { PRICE_VARS, activeTierIndex, parseBillingExpr, type ParsedExpr, type PriceVar } from './billing-expr'

/** new-api 默认的 quota_per_unit：$1 = 500000 额度 */
const DEFAULT_QUOTA_PER_UNIT = 500000

export type PriceLine = { key: PriceVar; usd: number }

export type Billing =
  | { kind: 'token'; lines: PriceLine[] }
  | { kind: 'request'; usd: number }
  | { kind: 'expr'; parsed: ParsedExpr; expr: string }
  /** 表达式解析不了：只标"动态计费"，详情里给原文 */
  | { kind: 'opaque'; expr: string }

export type MarketModel = {
  name: string
  vendor: string
  description: string
  tags: string[]
  groups: string[]
  endpoints: string[]
  billing: Billing
  perf?: ModelPerf
}

export const OTHER_VENDOR = '__other__'

function splitTags(tags?: string): string[] {
  return (tags ?? '')
    .split(/[,，;；]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function toBilling(m: PricingModel, quotaPerUnit: number): Billing {
  if (m.billing_mode === 'tiered_expr' && m.billing_expr) {
    const parsed = parseBillingExpr(m.billing_expr)
    return parsed ? { kind: 'expr', parsed, expr: m.billing_expr } : { kind: 'opaque', expr: m.billing_expr }
  }
  if (m.quota_type === 1) return { kind: 'request', usd: m.model_price }

  const input = (m.model_ratio * 1e6) / quotaPerUnit
  const lines: PriceLine[] = [
    { key: 'p', usd: input },
    { key: 'c', usd: input * (m.completion_ratio || 1) },
  ]
  if (typeof m.cache_ratio === 'number') lines.push({ key: 'cr', usd: input * m.cache_ratio })
  if (typeof m.create_cache_ratio === 'number') lines.push({ key: 'cc', usd: input * m.create_cache_ratio })
  return { kind: 'token', lines }
}

export function normalizeModels(
  pricing: PricingPayload,
  status: SiteStatus,
  perf: Record<string, ModelPerf>
): MarketModel[] {
  const quotaPerUnit = status.quota_per_unit || DEFAULT_QUOTA_PER_UNIT
  const vendorName = new Map((pricing.vendors ?? []).map((v) => [v.id, v.name]))

  return pricing.data.map((m) => ({
    name: m.model_name,
    vendor: (m.vendor_id !== undefined && vendorName.get(m.vendor_id)) || OTHER_VENDOR,
    description: m.description?.trim() ?? '',
    tags: splitTags(m.tags),
    groups: m.enable_groups ?? [],
    endpoints: m.supported_endpoint_types ?? [],
    billing: toBilling(m, quotaPerUnit),
    perf: perf[m.model_name],
  }))
}

/** 某一时刻生效的价格：token 计价给逐项单价，按次计价给单次价 */
export type ResolvedPrice = {
  lines: PriceLine[]
  perRequest?: number
  /** 动态计费时当前命中的档位名 */
  tier?: string
}

export function resolvePrice(b: Billing, now: Date): ResolvedPrice | null {
  switch (b.kind) {
    case 'token':
      return { lines: b.lines }
    case 'request':
      return { lines: [], perRequest: b.usd }
    case 'opaque':
      return null
    case 'expr': {
      const t = b.parsed.tiers[activeTierIndex(b.parsed, now)]
      return tierPrice(t)
    }
  }
}

export function tierPrice(t: ParsedExpr['tiers'][number]): ResolvedPrice {
  if (t.fixed !== undefined) return { lines: [], perRequest: t.fixed, tier: t.name }
  const lines = PRICE_VARS.filter((v) => t.prices[v] !== undefined).map((v) => ({ key: v, usd: t.prices[v]! }))
  return { lines, tier: t.name }
}

/** 排序用的代表价：输入单价，按次计价的排在 token 计价之后 */
export function sortPrice(b: Billing, now: Date, field: 'p' | 'c'): number {
  const r = resolvePrice(b, now)
  if (!r) return Number.POSITIVE_INFINITY
  if (r.perRequest !== undefined) return 1e12 + r.perRequest
  return r.lines.find((l) => l.key === field)?.usd ?? Number.POSITIVE_INFINITY
}

export type Currency = { symbol: string; rate: number }

/** 跟随网关的额度展示设置：USD 原样、CNY 按汇率换算、自定义货币用自定义符号 */
export function currencyOf(status: SiteStatus): Currency {
  switch (status.quota_display_type) {
    case 'CNY':
      return { symbol: '¥', rate: status.usd_exchange_rate || 7.3 }
    case 'CUSTOM':
      return {
        symbol: status.custom_currency_symbol || '¤',
        rate: status.custom_currency_exchange_rate || 1,
      }
    default:
      return { symbol: '$', rate: 1 }
  }
}

/** 四位有效数字、不用科学计数法：0.0003、1.32、75 */
export function formatMoney(usd: number, c: Currency): string {
  const v = usd * c.rate
  if (v === 0) return `${c.symbol}0`
  return `${c.symbol}${v.toLocaleString('en-US', { maximumSignificantDigits: 4 })}`
}
