import type { NextRequest } from 'next/server'
import { callAsUser, json, publicUser, unreachable, upstreamError, type UpstreamUser } from '@/lib/auth/server'
import { fetchSiteStatus } from '@/lib/newapi/client'
import { currencyOf } from '@/lib/newapi/pricing'

export const dynamic = 'force-dynamic'

/** 额度换算：额度 ÷ quota_per_unit = 美元，币种跟随网关的展示设置 */
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
  return { user: publicUser(user), wallet: { balanceUsd: user.quota / quotaPerUnit, quotaPerUnit, currency } }
}

/** 当前登录用户与余额。访问令牌过期时由 callAsUser 自动刷新 */
export async function GET(req: NextRequest) {
  try {
    const { result, commit } = await callAsUser<UpstreamUser>(req, '/api/user/self')
    if (!result) return commit(json({ user: null }))
    if (result.body.success && result.body.data) return commit(json(await withWallet(result.body.data)))
    if (result.status === 401) return commit(json({ user: null }))
    return commit(upstreamError(result, 502))
  } catch (err) {
    return unreachable(err)
  }
}
