import type { Metadata } from 'next'
import { FlowBackdrop } from '@/components/FlowBackdrop'
import { Navbar } from '@/components/Navbar'
import { RegisterForm, type RegisterMode } from '@/components/auth/RegisterForm'
import { getDict, isLocale } from '@/lib/i18n/dictionaries'
import { NEWAPI_BASE_URL, NEWAPI_PUBLIC_URL } from '@/lib/newapi/client'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  return {
    title: getDict(locale).register.metaTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/register` },
  }
}

type RegisterStatus = {
  register_enabled?: boolean
  password_register_enabled?: boolean
  email_verification?: boolean
  turnstile_check?: boolean
}

/**
 * 按网关的注册开关决定页面形态，5 分钟回源一次（与价格页共用同一个 /api/status 缓存）。
 * 网关暂时不可达时照常给表单，真正的开关仍由 new-api 在提交时把关。
 */
async function registerMode(): Promise<{ mode: RegisterMode; emailVerification: boolean }> {
  let s: RegisterStatus = {}
  try {
    const res = await fetch(`${NEWAPI_BASE_URL}/api/status`, {
      next: { revalidate: 300 },
      headers: { accept: 'application/json' },
    })
    if (res.ok) s = ((await res.json()) as { data?: RegisterStatus }).data ?? {}
  } catch {
    // 走默认
  }
  const mode: RegisterMode =
    s.register_enabled === false
      ? 'closed'
      : s.password_register_enabled === false
        ? 'passwordOff'
        : // 人机验证只有 new-api 自己的前端能完成
          s.turnstile_check
          ? 'turnstile'
          : 'form'
  return { mode, emailVerification: !!s.email_verification }
}

export default async function RegisterPage() {
  const { mode, emailVerification } = await registerMode()
  return (
    <>
      <FlowBackdrop />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <div aria-hidden className="flow-scrim" />
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28 sm:px-6">
          <RegisterForm mode={mode} emailVerification={emailVerification} gatewayUrl={NEWAPI_PUBLIC_URL} />
        </main>
      </div>
    </>
  )
}
