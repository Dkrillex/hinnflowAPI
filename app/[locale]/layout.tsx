import type { Metadata, Viewport } from 'next'
import { Instrument_Serif } from 'next/font/google'
import { notFound } from 'next/navigation'
import '../globals.css'
import { I18nProvider } from '@/lib/i18n/context'
import { LOCALES, getDict, isLocale } from '@/lib/i18n/dictionaries'

/** 唯一的 webfont：强调词的衬线斜体，与 www.hinnflow.com 一致 */
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

/** 两个语种都预渲染，避免运行时按需生成 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * canonical 与 hreflang 必须是绝对地址，Google 会直接忽略相对的 hreflang。
 * 没有 metadataBase 时 Next 会把 `/en` 原样输出，等于这两个标签白写。
 * 部署时用 NEXT_PUBLIC_SITE_URL 覆盖。
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hinnflow.com'

const HREFLANG: Record<string, string> = { en: 'en', zh: 'zh-CN' }

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDict(locale)
  return {
    metadataBase: new URL(SITE_URL),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], `/${l}`])),
        // 语种不匹配时的落点，与 middleware 的默认语种保持一致
        'x-default': '/en',
      },
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

/**
 * 首屏前写入 dark class，避免主题闪烁。
 * 注意 <html> 上不能预置 className="dark"：那样偏好浅色的访客会先闪一帧深色，
 * 直到 Navbar 的 useEffect 把它摘掉。类名一律交给这段脚本在绘制前决定。
 */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t?t==='dark':true){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = getDict(locale)

  return (
    <html
      lang={locale === 'zh' ? 'zh-CN' : 'en'}
      className={instrumentSerif.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider value={{ locale, dict }}>{children}</I18nProvider>
      </body>
    </html>
  )
}
