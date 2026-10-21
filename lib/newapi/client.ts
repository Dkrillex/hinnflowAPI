/**
 * new-api 网关的只读公开接口。只在服务端调用：
 *   - 网关是 http，部署后的站点是 https，浏览器直连会被混合内容拦截
 *   - 走 Next 的数据缓存（ISR），访客多也只是每分钟回源一次
 * 部署时用 NEWAPI_BASE_URL 覆盖网关地址。
 */

export const NEWAPI_BASE_URL = (process.env.NEWAPI_BASE_URL ?? 'http://8.134.206.56:3000').replace(/\/+$/, '')

/** 展示给用户的调用地址（示例代码里用）。网关挂了域名后用 NEWAPI_PUBLIC_URL 指过去 */
export const NEWAPI_PUBLIC_URL = (process.env.NEWAPI_PUBLIC_URL ?? NEWAPI_BASE_URL).replace(/\/+$/, '')

/** 回源间隔（秒），价格与可用性数据都按这个节奏刷新 */
export const REVALIDATE_SECONDS = 60

export type PricingModel = {
  model_name: string
  vendor_id?: number
  description?: string
  tags?: string
  /** 0 = 按量（倍率），1 = 按次 */
  quota_type: number
  model_ratio: number
  model_price: number
  completion_ratio: number
  cache_ratio?: number
  create_cache_ratio?: number
  enable_groups?: string[]
  supported_endpoint_types?: string[]
  /** 缺省或 ratio 走倍率；tiered_expr 走 billing_expr */
  billing_mode?: string
  billing_expr?: string
}

export type Vendor = { id: number; name: string; icon?: string }

export type PricingPayload = {
  data: PricingModel[]
  vendors?: Vendor[]
  group_ratio?: Record<string, number>
  usable_group?: Record<string, string>
  supported_endpoint?: Record<string, { path: string; method: string }>
}

/** /api/status 里与价格换算有关的字段 */
export type SiteStatus = {
  quota_per_unit?: number
  quota_display_type?: string
  usd_exchange_rate?: number
  custom_currency_symbol?: string
  custom_currency_exchange_rate?: number
}

export type ModelPerf = {
  model_name: string
  avg_latency_ms: number
  success_rate: number
  avg_tps: number
  recent_success_series?: { ts: number; success_rate: number }[]
}

export type MarketplaceData = {
  pricing: PricingPayload
  status: SiteStatus
  perf: Record<string, ModelPerf>
  /** 拿数据的时刻，客户端首帧用它算时段价格，避免与服务端渲染结果不一致 */
  fetchedAt: number
  baseUrl: string
}

async function getJSON<T>(path: string, revalidate = REVALIDATE_SECONDS): Promise<T> {
  const res = await fetch(`${NEWAPI_BASE_URL}${path}`, {
    next: { revalidate },
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  const body = (await res.json()) as { success?: boolean; message?: string; data?: unknown }
  if (body.success === false) throw new Error(`${path} → ${body.message || 'success=false'}`)
  return body as T
}

/**
 * 文档示例里用的模型名：取网关上一个支持 OpenAI 格式的真实模型，优先 GPT 系。
 * 拿不到就用兜底值，文档照样能渲染。
 */
export async function fetchExampleModel(fallback = 'gpt-6-astra'): Promise<string> {
  try {
    const r = await getJSON<PricingPayload>('/api/pricing', 3600)
    const names = r.data
      .filter((m) => !m.supported_endpoint_types || m.supported_endpoint_types.includes('openai'))
      .map((m) => m.model_name)
      .sort()
    return names.find((n) => n.startsWith('gpt-')) ?? names[0] ?? fallback
  } catch {
    return fallback
  }
}

/** 站点设置（额度换算、展示币种），5 分钟回源一次 */
export async function fetchSiteStatus(): Promise<SiteStatus> {
  const r = await getJSON<{ data: SiteStatus }>('/api/status', 300)
  return r.data ?? {}
}

/**
 * 模型列表与站点设置是硬依赖，失败就整体抛错；
 * 可用性统计只是锦上添花，拿不到时空着即可。
 */
export async function fetchMarketplace(): Promise<MarketplaceData> {
  const [pricing, status] = await Promise.all([
    getJSON<PricingPayload & { success: boolean }>('/api/pricing'),
    getJSON<{ data: SiteStatus }>('/api/status').then((r) => r.data ?? {}),
  ])

  const perf: Record<string, ModelPerf> = {}
  const names = pricing.data.map((m) => m.model_name)
  if (names.length > 0) {
    const qs = new URLSearchParams({ hours: '24' })
    names.forEach((n) => qs.append('recent_model', n))
    try {
      const r = await getJSON<{ data?: { models?: ModelPerf[] } }>(`/api/perf-metrics/summary?${qs}`)
      for (const m of r.data?.models ?? []) perf[m.model_name] = m
    } catch {
      // 统计接口未开启或超时，不影响价格展示
    }
  }

  return {
    pricing: {
      data: pricing.data,
      vendors: pricing.vendors,
      group_ratio: pricing.group_ratio,
      usable_group: pricing.usable_group,
      supported_endpoint: pricing.supported_endpoint,
    },
    status,
    perf,
    fetchedAt: Date.now(),
    baseUrl: NEWAPI_PUBLIC_URL,
  }
}
