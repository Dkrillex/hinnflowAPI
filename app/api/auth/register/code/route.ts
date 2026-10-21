import type { NextRequest } from 'next/server'
import { json, sameOrigin, unreachable, upstream, upstreamError } from '@/lib/auth/server'
import { checkEmail } from '@/lib/auth/register'

/** 注册用的邮箱验证码。new-api 侧按 IP 限流，并拒绝已被占用的邮箱 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ ok: false, code: 'FORBIDDEN' }, 403)

  let input: { email?: unknown }
  try {
    input = await req.json()
  } catch {
    return json({ ok: false, code: 'INVALID' }, 400)
  }
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const bad = checkEmail(email)
  if (bad) return json({ ok: false, code: bad }, 400)

  try {
    const r = await upstream(req, `/api/verification?${new URLSearchParams({ email })}`)
    if (r.body.success) return json({ ok: true })
    return upstreamError(r)
  } catch (err) {
    return unreachable(err)
  }
}
