/**
 * 登录态的服务端部分：本站 /api/auth/* 路由与 new-api 用户接口之间的转接。
 *
 * 为什么不让浏览器直连 new-api：
 *   - new-api 的刷新令牌是 SameSite=Strict、Path=/api/user/auth 的 HttpOnly Cookie，
 *     种在网关自己的域名上；跨站请求根本带不上它
 *   - 网关是 http，站点是 https，直连还会被混合内容拦截
 * 所以由本站服务端代为调用，把令牌转存成本站域名下的 HttpOnly Cookie，
 * 浏览器脚本始终拿不到任何令牌。
 *
 * new-api 的会话模型（v1.0.0-rc.45）：
 *   - 登录成功返回 15 分钟有效的 access_token，同时下发 30 天的刷新 Cookie new_api_refresh
 *   - 刷新令牌每次使用都会轮换；短时间窗口内的并发刷新拿到同一个新令牌，超出窗口重放会吊销会话
 *   - 刷新、登出两个接口校验 Origin，必须与网关自身地址一致
 */

import { NextResponse, type NextRequest } from 'next/server'
import { NEWAPI_BASE_URL } from '@/lib/newapi/client'

/**
 * 本站 Cookie。只给 /api 下的路由用（/api/auth 登录态、/api/console 控制台转接），
 * 页面与静态资源请求不会带上。
 */
const ACCESS_COOKIE = 'hf_access'
const REFRESH_COOKIE = 'hf_refresh'
/** 早期版本用过的名字与路径（只覆盖 /api/auth，控制台拿不到）。写会话时顺手清掉 */
const LEGACY_COOKIES = ['hf_at', 'hf_rt']
const LEGACY_PATH = '/api/auth'
/** 脚本可读的"有会话"提示，只用来决定要不要去问 /api/auth/me，本身不代表任何权限 */
export const HINT_COOKIE = 'hf_session'

const UPSTREAM_REFRESH_COOKIE = 'new_api_refresh'
const COOKIE_PATH = '/api'
const secure = process.env.NODE_ENV === 'production'

/** 访问令牌提前 30 秒视为过期，避免压着过期时刻发请求 */
const ACCESS_SKEW_SECONDS = 30

const UPSTREAM_ORIGIN = new URL(NEWAPI_BASE_URL).origin

export type UpstreamUser = {
  id: number
  username: string
  display_name?: string
  email?: string
  role: number
  group?: string
  quota: number
  used_quota: number
  request_count: number
}

export type AuthData = {
  access_token?: string
  access_expires_at?: number
  user?: UpstreamUser
  /** 需要二次验证时 */
  require_verification?: boolean
  flow_token?: string
  expires_at?: number
  methods?: { method: string; available: boolean }[]
}

export type UpstreamResult<T> = {
  status: number
  body: { success?: boolean; message?: string; message_key?: string; code?: string; data?: T }
  /** 上游轮换后的刷新令牌与有效秒数 */
  refresh?: { token: string; maxAge: number }
  refreshCleared: boolean
}

/**
 * 访客的 IP。new-api 的登录限流按 IP 计，不透传的话所有访客会共用本站服务器的配额。
 * 取 X-Forwarded-For 最右一项：那是本站前面的反代追加的，左边的都可能是客户端自己伪造的。
 */
function clientIp(req: NextRequest): string | undefined {
  return req.ip ?? req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ?? undefined
}

export async function upstream<T = AuthData>(
  req: NextRequest,
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; accessToken?: string; refreshToken?: string } = {}
): Promise<UpstreamResult<T>> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    // 刷新与登出接口的 Origin 校验：服务端到服务端调用，声明为网关自身来源
    origin: UPSTREAM_ORIGIN,
  }
  const ua = req.headers.get('user-agent')
  if (ua) headers['user-agent'] = ua
  const lang = req.headers.get('accept-language')
  if (lang) headers['accept-language'] = lang
  const ip = clientIp(req)
  if (ip) headers['x-forwarded-for'] = ip
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  if (opts.accessToken) headers.authorization = `Bearer ${opts.accessToken}`
  if (opts.refreshToken) headers.cookie = `${UPSTREAM_REFRESH_COOKIE}=${opts.refreshToken}`

  const res = await fetch(`${NEWAPI_BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })

  let refresh: UpstreamResult<T>['refresh']
  let refreshCleared = false
  for (const raw of res.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(';')
    const eq = pair.indexOf('=')
    if (pair.slice(0, eq).trim() !== UPSTREAM_REFRESH_COOKIE) continue
    const value = pair.slice(eq + 1).trim()
    const maxAgeAttr = attrs.find((a) => a.trim().toLowerCase().startsWith('max-age='))
    const maxAge = maxAgeAttr ? Number(maxAgeAttr.split('=')[1]) : 30 * 24 * 3600
    if (!value || maxAge <= 0) refreshCleared = true
    else refresh = { token: value, maxAge }
  }

  let body: UpstreamResult<T>['body'] = {}
  try {
    body = await res.json()
  } catch {
    // 网关在反代后面出错时可能回 HTML
  }
  return { status: res.status, body, refresh, refreshCleared }
}

export function readTokens(req: NextRequest) {
  return {
    access: req.cookies.get(ACCESS_COOKIE)?.value,
    refresh: req.cookies.get(REFRESH_COOKIE)?.value,
  }
}

const base = { httpOnly: true, secure, sameSite: 'lax' as const, path: COOKIE_PATH }

/** 把上游下发的令牌写进本站 Cookie */
export function storeSession(res: NextResponse, data: AuthData | undefined, refresh: UpstreamResult<unknown>['refresh']) {
  if (data?.access_token && data.access_expires_at) {
    const ttl = data.access_expires_at - Math.floor(Date.now() / 1000) - ACCESS_SKEW_SECONDS
    if (ttl > 0) res.cookies.set(ACCESS_COOKIE, data.access_token, { ...base, maxAge: ttl })
  }
  clearLegacy(res)
  if (refresh) {
    res.cookies.set(REFRESH_COOKIE, refresh.token, { ...base, maxAge: refresh.maxAge })
    res.cookies.set(HINT_COOKIE, '1', { secure, sameSite: 'lax', path: '/', maxAge: refresh.maxAge })
  }
}

function clearLegacy(res: NextResponse) {
  for (const name of LEGACY_COOKIES) res.cookies.set(name, '', { ...base, path: LEGACY_PATH, maxAge: 0 })
}

export function clearSession(res: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) res.cookies.set(name, '', { ...base, maxAge: 0 })
  clearLegacy(res)
  res.cookies.set(HINT_COOKIE, '', { secure, sameSite: 'lax', path: '/', maxAge: 0 })
}

/** 只回给浏览器展示需要的字段，权限、绑定信息、设置等一律不出服务端 */
export function publicUser(u: UpstreamUser) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name || u.username,
    email: u.email || '',
    group: u.group || '',
    quota: u.quota,
    usedQuota: u.used_quota,
    requestCount: u.request_count,
  }
}

export type PublicUser = ReturnType<typeof publicUser>

/**
 * 写操作的跨站防护：Cookie 是 SameSite=Lax，再要求 Origin 与本站一致。
 * 浏览器对 fetch POST 总会带 Origin；缺失时按跨站处理。
 */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function json(body: unknown, init?: number | ResponseInit) {
  const res = NextResponse.json(body, typeof init === 'number' ? { status: init } : init)
  res.headers.set('cache-control', 'no-store')
  return res
}

/** 上游报错的统一出口：带上 message_key，客户端按它翻译 */
export function upstreamError(r: UpstreamResult<unknown>, fallbackStatus = 400) {
  const status = r.status >= 400 ? r.status : fallbackStatus
  return json(
    { ok: false, code: r.body.code ?? (r.status === 429 ? 'RATE_LIMITED' : undefined), messageKey: r.body.message_key, message: r.body.message },
    status
  )
}

/** 网关不可达 */
export function unreachable(err: unknown) {
  console.error('[auth] new-api 请求失败:', err)
  return json({ ok: false, code: 'UPSTREAM_UNREACHABLE' }, 502)
}

/**
 * 同一个刷新令牌的并发刷新合并成一次上游调用。控制台一个页面会并行发好几个请求，
 * 访问令牌恰好过期时它们会同时拿旧的刷新令牌去换；new-api 虽然有 30 秒重放窗口兜底，
 * 合并后既省请求，也不依赖那个窗口。结果保留几秒，覆盖稍晚到达的同批请求。
 */
const inflight = new Map<string, Promise<UpstreamResult<AuthData>>>()
const REFRESH_SHARE_MS = 5_000

function refreshOnce(req: NextRequest, refreshToken: string) {
  let p = inflight.get(refreshToken)
  if (!p) {
    p = upstream<AuthData>(req, '/api/user/auth/refresh', { method: 'POST', refreshToken })
    inflight.set(refreshToken, p)
    const forget = () => setTimeout(() => inflight.delete(refreshToken), REFRESH_SHARE_MS)
    p.then(forget, () => inflight.delete(refreshToken))
  }
  return p
}

export type AuthedCall<T> = {
  /** 上游结果；null 表示没有登录态或会话已失效 */
  result: UpstreamResult<T> | null
  /** 把这次调用里刷新得到的令牌（或会话失效后的清除）写进响应 */
  commit: (res: NextResponse) => NextResponse
}

const keep = (res: NextResponse) => res
const drop = (res: NextResponse) => {
  clearSession(res)
  return res
}

/**
 * 以当前登录用户身份调用 new-api。
 * 先用现有访问令牌；没有或被拒（401）时用刷新令牌换一对新的，再重试一次。
 * 刷新会轮换刷新令牌，所以调用方必须把 commit 应用到最终响应上。
 * 网关临时故障时不清 Cookie，免得把人误踢下线。
 */
export async function callAsUser<T>(
  req: NextRequest,
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {}
): Promise<AuthedCall<T>> {
  const { access, refresh } = readTokens(req)
  if (access) {
    const r = await upstream<T>(req, path, { ...opts, accessToken: access })
    if (r.status !== 401) return { result: r, commit: keep }
  }
  if (!refresh) return { result: null, commit: drop }

  const rr = await refreshOnce(req, refresh)
  const data = rr.body.data
  if (!rr.body.success || !data?.access_token) {
    if (rr.status === 401 || rr.refreshCleared) return { result: null, commit: drop }
    return { result: rr as unknown as UpstreamResult<T>, commit: keep }
  }
  const commit = (res: NextResponse) => {
    storeSession(res, data, rr.refresh)
    return res
  }
  const r = await upstream<T>(req, path, { ...opts, accessToken: data.access_token })
  return { result: r, commit }
}
