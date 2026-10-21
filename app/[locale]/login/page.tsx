import type { Metadata } from 'next'
import { FlowBackdrop } from '@/components/FlowBackdrop'
import { Navbar } from '@/components/Navbar'
import { LoginForm } from '@/components/auth/LoginForm'
import { getDict, isLocale } from '@/lib/i18n/dictionaries'
import { NEWAPI_PUBLIC_URL } from '@/lib/newapi/client'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  return {
    title: getDict(locale).auth.metaTitle,
    // 登录页不进索引，也不需要 hreflang
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/login` },
  }
}

export default function LoginPage() {
  return (
    <>
      <FlowBackdrop />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <div aria-hidden className="flow-scrim" />
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28 sm:px-6">
          <LoginForm gatewayUrl={NEWAPI_PUBLIC_URL} />
        </main>
      </div>
    </>
  )
}
