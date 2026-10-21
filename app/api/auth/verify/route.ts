import type { NextRequest } from 'next/server'
import { json, sameOrigin, unreachable, upstream } from '@/lib/auth/server'
import { FLOW_COOKIE, finishLogin } from '@/lib/auth/login-flow'

/** 两步验证：身份验证器的 6 位码或备用码，都走 new-api 的 2fa 方式 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ ok: false, code: 'FORBIDDEN' }, 403)

  const flowToken = req.cookies.get(FLOW_COOKIE)?.value
  if (!flowToken) return json({ ok: false, code: 'FLOW_EXPIRED' }, 400)

  let input: { code?: unknown }
  try {
    input = await req.json()
  } catch {
    return json({ ok: false, code: 'INVALID' }, 400)
  }
  const code = typeof input.code === 'string' ? input.code.replace(/\s+/g, '') : ''
  if (!code) return json({ ok: false, code: 'INVALID' }, 400)

  try {
    const r = await upstream(req, '/api/user/login/verify', {
      method: 'POST',
      body: { flow_token: flowToken, method: '2fa', code },
    })
    return finishLogin(r)
  } catch (err) {
    return unreachable(err)
  }
}
