import type { Metadata } from 'next'
import { ConsoleShell } from '@/components/console/ConsoleShell'
import { getDict, isLocale } from '@/lib/i18n/dictionaries'
import { NEWAPI_PUBLIC_URL } from '@/lib/newapi/client'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  return {
    title: getDict(locale).console.metaTitle,
    // 登录后才有内容的页面，不进索引
    robots: { index: false, follow: false },
  }
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell gatewayUrl={NEWAPI_PUBLIC_URL}>{children}</ConsoleShell>
}
