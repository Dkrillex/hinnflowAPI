import type { NextRequest } from 'next/server'
import {
  clearSession,
  json,
  publicUser,
  readTokens,
  storeSession,
  unreachable,
  upstream,
  upstreamError,
  type UpstreamUser,
} from '@/lib/auth/server'
import { fetchSiteStatus } from '@/lib/newapi/client'
import { currencyOf } from '@/lib/newapi/pricing'

export const dynamic = 'force-dynamic'

/** 余额换算：额度 ÷ quota_per_unit = 美元，币种跟随网关的展示设置 */
async function withWallet(user: UpstreamUser) {
  let quotaPerUnit = 500000
  let currency = { symbol: '$', rate: 1 }
  try {
    const s = await fetchSiteStatus()
    quotaPerUnit = s.quota_per_unit || quotaPerUnit
    currency = currencyOf(s)
  } catch {
    // 站点设置拿不到就按 new-api 默认值换算
  }
  return { user: publicUser(user), wallet: { balanceUsd: user.quota / quotaPerUnit, currency } }
}

/**
 * 当前登录用户。访问令牌有效就直接查；过期了用刷新令牌换新的一对（上游会轮换刷新令牌，
 * 所以每次刷新都要把新值写回 Cookie）。网关临时出错时不清 Cookie，免得把人误踢下线。
 */
export async function GET(req: NextRequest) {
  const { access, refresh } = readTokens(req)

  try {
    if (access) {
      const r = await upstream<UpstreamUser>(req, '/api/user/self', { accessToken: access })
      if (r.body.success && r.body.data) return json(await withWallet(r.body.data))
      if (r.status !== 401) return upstreamError(r, 502)
    }

    if (!refresh) {
      const res = json({ user: null })
      clearSession(res)
      return res
    }

    const r = await upstream(req, '/api/user/auth/refresh', { method: 'POST', refreshToken: refresh })
    const data = r.body.data
    if (r.body.success && data?.user) {
      const res = json(await withWallet(data.user))
      storeSession(res, data, r.refresh)
      return res
    }
    if (r.status === 401 || r.refreshCleared) {
      const res = json({ user: null })
      clearSession(res)
      return res
    }
    return upstreamError(r, 502)
  } catch (err) {
    return unreachable(err)
  }
}
