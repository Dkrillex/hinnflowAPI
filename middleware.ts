import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES, type Locale } from '@/lib/i18n/dictionaries'

const DEFAULT_LOCALE: Locale = 'en'

/** 从 Accept-Language 里挑一个支持的语种，挑不到就回落英文 */
function pickLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    if (tag.startsWith('zh')) return 'zh'
    if (tag.startsWith('en')) return 'en'
  }
  return DEFAULT_LOCALE
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 已经带语种前缀就放行
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next()
  }

  const locale = pickLocale(request.headers.get('accept-language'))
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`

  const res = NextResponse.redirect(url)
  // 这条重定向的结果取决于 Accept-Language。不声明 Vary，CDN 会把某一个访客的
  // 语种重定向缓存下来发给所有人。
  res.headers.set('Vary', 'Accept-Language')
  return res
}

export const config = {
  // 静态资源、图片与接口不参与语种重定向
  matcher: ['/((?!_next|api|favicon.ico|logo.svg|.*\\.[a-zA-Z0-9]+$).*)'],
}
