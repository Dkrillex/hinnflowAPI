import type { NextRequest } from 'next/server'
import { clearSession, json, readTokens, sameOrigin, upstream } from '@/lib/auth/server'

/** 退出登录：先让 new-api 吊销会话，无论成败都清掉本站 Cookie */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ ok: false, code: 'FORBIDDEN' }, 403)

  const { access, refresh } = readTokens(req)
  if (access || refresh) {
    try {
      await upstream(req, '/api/user/auth/logout', { method: 'POST', accessToken: access, refreshToken: refresh })
    } catch (err) {
      console.error('[auth] 吊销会话失败:', err)
    }
  }
  const res = json({ ok: true })
  clearSession(res)
  return res
}
