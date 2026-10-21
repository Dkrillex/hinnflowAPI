import type { NextRequest } from 'next/server'
import { json, sameOrigin, unreachable, upstream } from '@/lib/auth/server'
import { finishLogin } from '@/lib/auth/login-flow'

/** 账号密码登录。账号可以是用户名或邮箱，new-api 两者都认 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ ok: false, code: 'FORBIDDEN' }, 403)

  let input: { username?: unknown; password?: unknown }
  try {
    input = await req.json()
  } catch {
    return json({ ok: false, code: 'INVALID' }, 400)
  }
  const username = typeof input.username === 'string' ? input.username.trim() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  if (!username || !password) return json({ ok: false, code: 'INVALID' }, 400)

  try {
    const r = await upstream(req, '/api/user/login', { method: 'POST', body: { username, password } })
    return finishLogin(r)
  } catch (err) {
    return unreachable(err)
  }
}
