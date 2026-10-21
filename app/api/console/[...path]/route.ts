import type { NextRequest } from 'next/server'
import { callAsUser, json, sameOrigin, unreachable } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

/**
 * 控制台能代为调用的 new-api 接口白名单。只放普通用户自己的数据：
 * 账户、令牌、日志、用量统计、兑换码充值。管理员接口一个都不转，
 * 即使登录的是管理员账号，本站也不承担后台管理。
 * upstream 省略时与本站路径相同；new-api 的列表/新建接口带尾斜杠，需要显式写出。
 */
const ROUTES: { method: Method; pattern: RegExp; upstream?: string }[] = [
  { method: 'GET', pattern: /^user\/self\/groups$/ },
  { method: 'GET', pattern: /^user\/models$/ },
  { method: 'GET', pattern: /^user\/topup\/info$/ },
  { method: 'POST', pattern: /^user\/topup$/ },
  { method: 'GET', pattern: /^token$/, upstream: 'token/' },
  { method: 'POST', pattern: /^token$/, upstream: 'token/' },
  { method: 'PUT', pattern: /^token$/, upstream: 'token/' },
  { method: 'GET', pattern: /^token\/search$/ },
  { method: 'GET', pattern: /^token\/\d+$/ },
  { method: 'DELETE', pattern: /^token\/\d+$/ },
  { method: 'POST', pattern: /^token\/\d+\/key$/ },
  { method: 'GET', pattern: /^log\/self$/ },
  { method: 'GET', pattern: /^log\/self\/stat$/ },
  { method: 'GET', pattern: /^data\/self$/ },
]

/** 请求体上限：令牌表单之类的小 JSON，用不到更大 */
const MAX_BODY = 64 * 1024

async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
  const method = req.method as Method
  if (method !== 'GET' && !sameOrigin(req)) return json({ success: false, code: 'FORBIDDEN' }, 403)

  const path = params.path.join('/')
  const route = ROUTES.find((r) => r.method === method && r.pattern.test(path))
  if (!route) return json({ success: false, code: 'NOT_ALLOWED' }, 404)

  let body: unknown
  if (method === 'POST' || method === 'PUT') {
    const text = await req.text()
    if (text.length > MAX_BODY) return json({ success: false, code: 'BODY_TOO_LARGE' }, 413)
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        return json({ success: false, code: 'INVALID' }, 400)
      }
    }
  }

  try {
    const { result, commit } = await callAsUser(req, `/api/${route.upstream ?? path}${req.nextUrl.search}`, {
      method,
      body,
    })
    if (!result) return commit(json({ success: false, code: 'UNAUTHENTICATED' }, 401))
    return commit(json(result.body, result.status))
  } catch (err) {
    return unreachable(err)
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE }
