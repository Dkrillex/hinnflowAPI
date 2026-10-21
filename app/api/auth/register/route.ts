import type { NextRequest } from 'next/server'
import { json, sameOrigin, unreachable, upstream, upstreamError } from '@/lib/auth/server'
import { checkEmail, checkPassword, checkUsername, cleanAffCode } from '@/lib/auth/register'

/**
 * 用户名密码注册。只负责建号，不发令牌：new-api 的注册接口本身不登录，
 * 页面拿到成功后再走一遍 /api/auth/login。
 * 开了邮箱验证时需要 email + code（验证码由 /api/auth/register/code 发送）。
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ ok: false, code: 'FORBIDDEN' }, 403)

  let input: { username?: unknown; password?: unknown; email?: unknown; code?: unknown; affCode?: unknown }
  try {
    input = await req.json()
  } catch {
    return json({ ok: false, code: 'INVALID' }, 400)
  }
  const username = typeof input.username === 'string' ? input.username.trim() : ''
  // 密码不做任何规整，new-api 也是原样存
  const password = typeof input.password === 'string' ? input.password : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const code = typeof input.code === 'string' ? input.code.trim() : ''

  const bad = checkUsername(username) ?? checkPassword(password) ?? (email ? checkEmail(email) : null)
  if (bad) return json({ ok: false, code: bad }, 400)

  const body: Record<string, string> = { username, password }
  if (email) body.email = email
  if (code) body.verification_code = code
  const affCode = cleanAffCode(input.affCode)
  if (affCode) body.aff_code = affCode

  try {
    const r = await upstream(req, '/api/user/register', { method: 'POST', body })
    if (r.body.success) return json({ ok: true })
    return upstreamError(r)
  } catch (err) {
    return unreachable(err)
  }
}
