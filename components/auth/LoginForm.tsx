'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/Logo'
import { safeNext, setAuthenticated, useSession } from '@/lib/auth/client'
import type { PublicUser } from '@/lib/auth/server'
import { localeHref, useI18n } from '@/lib/i18n/context'
import type { Dict } from '@/lib/i18n/dictionaries'

type ApiResult = {
  ok?: boolean
  user?: PublicUser
  verify?: { methods: string[] }
  code?: string
  messageKey?: string
  message?: string
}

/** new-api 的 message_key 是英文原句，常见的几条映射成本站文案，其余原样展示 */
const MESSAGE_KEYS: Record<string, keyof Dict['auth']['errors']> = {
  'Username or password is incorrect, or user has been banned': 'invalidCredentials',
  'User has been banned': 'banned',
  'Password login has been disabled by administrator': 'disabled',
  'Invalid parameters': 'invalid',
}

/** 二次验证流程失效（本站 Cookie 过期，或 new-api 侧流程已作废），需要回到密码步骤 */
const FLOW_GONE = new Set(['FLOW_EXPIRED', 'SECURITY_VERIFICATION_FLOW_REQUIRED', 'SECURITY_CONTEXT_INVALID'])

function errorText(r: ApiResult, status: number, errors: Dict['auth']['errors']): string {
  if (r.code === 'UPSTREAM_UNREACHABLE') return errors.unreachable
  if (r.code && FLOW_GONE.has(r.code)) return errors.flowExpired
  if (r.code === 'TWOFA_CODE_INVALID' || r.code === 'SECURITY_VERIFICATION_FAILED') return errors.codeInvalid
  if (r.code === 'SECURITY_VERIFICATION_LOCKED') return errors.locked
  if (r.code === 'INVALID') return errors.invalid
  if (status === 429 || r.code === 'RATE_LIMITED') return errors.rateLimited
  const key = r.messageKey && MESSAGE_KEYS[r.messageKey]
  if (key) return errors[key]
  return r.message || errors.generic
}

async function post(url: string, body: unknown): Promise<{ status: number; data: ApiResult }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    return { status: res.status, data: (await res.json().catch(() => ({}))) as ApiResult }
  } catch {
    return { status: 0, data: { code: 'UPSTREAM_UNREACHABLE' } }
  }
}

const field =
  'h-12 w-full rounded-full border border-line/15 bg-transparent px-5 text-[0.9375rem] text-fg placeholder:text-muted/70 transition-colors hover:border-line/30 focus:border-flow focus:outline-none'

export function LoginForm({ gatewayUrl }: { gatewayUrl: string }) {
  const { locale, dict } = useI18n()
  const a = dict.auth
  const router = useRouter()
  const session = useSession()

  const [step, setStep] = useState<'password' | 'verify'>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [passkeyOnly, setPasskeyOnly] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  const target = () => safeNext(new URLSearchParams(window.location.search).get('next'), localeHref(locale, '/'))

  // 已登录还打开登录页：直接送回去
  useEffect(() => {
    if (session.status === 'authenticated') router.replace(target())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status])

  useEffect(() => {
    if (step === 'verify') codeRef.current?.focus()
  }, [step])

  const done = (r: ApiResult) => {
    if (r.ok && r.user) {
      setAuthenticated(r.user)
      router.replace(target())
      return true
    }
    return false
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    const { status, data } = await post('/api/auth/login', { username, password })
    setBusy(false)
    if (done(data)) return
    if (data.verify) {
      setPasskeyOnly(!data.verify.methods.includes('2fa'))
      setCode('')
      setStep('verify')
      return
    }
    setError(errorText(data, status, a.errors))
  }

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    const { status, data } = await post('/api/auth/verify', { code })
    setBusy(false)
    if (done(data)) return
    if (data.code && FLOW_GONE.has(data.code)) {
      setStep('password')
      setPassword('')
    }
    setError(errorText(data, status, a.errors))
  }

  const back = () => {
    setStep('password')
    setError('')
    setPassword('')
  }

  return (
    <div className="card w-full max-w-[26rem] p-8 md:p-10">
      <LogoMark className="h-7 w-8 text-fg" />

      {step === 'password' ? (
        <>
          <h1 className="mt-8 text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-fg">{a.title}</h1>
          <p className="mt-2 text-[0.9375rem] text-muted">{a.subtitle}</p>

          <form onSubmit={submitPassword} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="login-username" className="mb-2 block text-[0.8125rem] font-medium text-fg">
                {a.usernameLabel}
              </label>
              <input
                id="login-username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={field}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="text-[0.8125rem] font-medium text-fg">
                  {a.passwordLabel}
                </label>
                <a
                  href={`${gatewayUrl}/forgot-password`}
                  className="text-[0.8125rem] text-muted transition-colors hover:text-fg"
                >
                  {a.forgot}
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${field} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? a.hidePassword : a.showPassword}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                    {showPassword && <path d="M4 4l16 16" strokeLinecap="round" />}
                  </svg>
                </button>
              </div>
            </div>

            <ErrorLine text={error} />

            <button type="submit" disabled={busy} className="pill-solid w-full disabled:cursor-wait disabled:opacity-70">
              {busy ? a.submitting : a.submit}
            </button>
          </form>

          <p className="mt-8 text-center text-[0.875rem] text-muted">
            {a.noAccount}{' '}
            <Link href={localeHref(locale, dict.nav.signup.href)} className="font-medium text-fg hover:underline">
              {a.signup}
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-fg">{a.verifyTitle}</h1>
          {passkeyOnly ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{a.passkeyOnly}</p>
          ) : (
            <>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{a.verifySubtitle}</p>
              <form onSubmit={submitCode} className="mt-8 space-y-5" noValidate>
                <div>
                  <label htmlFor="login-code" className="mb-2 block text-[0.8125rem] font-medium text-fg">
                    {a.codeLabel}
                  </label>
                  <input
                    ref={codeRef}
                    id="login-code"
                    name="code"
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`${field} font-mono tracking-[0.2em]`}
                  />
                </div>
                <ErrorLine text={error} />
                <button type="submit" disabled={busy || !code.trim()} className="pill-solid w-full disabled:opacity-60">
                  {busy ? a.verifying : a.verifySubmit}
                </button>
              </form>
            </>
          )}
          <button
            type="button"
            onClick={back}
            className="mt-6 w-full text-center text-[0.875rem] text-muted transition-colors hover:text-fg"
          >
            {a.back}
          </button>
        </>
      )}
    </div>
  )
}

/** 插入带内容的 role=alert 元素，读屏器会立即播报 */
function ErrorLine({ text }: { text: string }) {
  if (!text) return null
  return (
    <p role="alert" className="text-[0.8125rem] leading-relaxed text-rose-600 dark:text-rose-400">
      {text}
    </p>
  )
}
