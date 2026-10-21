import { clearSession, json, publicUser, storeSession, upstreamError, type UpstreamResult } from './server'

/** 二次验证的流程令牌。只放在 HttpOnly Cookie 里，不交给页面脚本；new-api 侧 5 分钟过期 */
export const FLOW_COOKIE = 'hf_flow'

type LoginData = Parameters<typeof storeSession>[1]

/**
 * 登录与二次验证共用的收尾：
 *   - 拿到令牌：写 Cookie，回用户信息
 *   - 需要二次验证：流程令牌存 Cookie，回可用的验证方式
 *   - 其余：原样转出上游错误
 */
export function finishLogin(r: UpstreamResult<LoginData>) {
  const data = r.body.data
  if (r.body.success && data?.require_verification && data.flow_token) {
    const methods = (data.methods ?? []).filter((m) => m.available).map((m) => m.method)
    const res = json({ ok: false, verify: { methods } })
    const ttl = data.expires_at ? data.expires_at - Math.floor(Date.now() / 1000) : 300
    res.cookies.set(FLOW_COOKIE, data.flow_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: Math.max(ttl, 1),
    })
    return res
  }
  if (r.body.success && data?.access_token && data.user) {
    const res = json({ ok: true, user: publicUser(data.user) })
    // 新登录覆盖掉同一浏览器里残留的旧会话
    clearSession(res)
    storeSession(res, data, r.refresh)
    res.cookies.set(FLOW_COOKIE, '', { path: '/api/auth', maxAge: 0 })
    return res
  }
  return upstreamError(r)
}
