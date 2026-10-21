'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/Logo'
import { safeNext, setAuthenticated, useSession } from '@/lib/auth/client'
import { checkEmail, checkPassword, checkUsername } from '@/lib/auth/register'
import type { PublicUser } from '@/lib/auth/server'
import { localeHref, useI18n } from '@/lib/i18n/context'
import type { Dict } from '@/lib/i18n/dictionaries'

/** form = 本站表单；其余三种由网关开关决定，只给说明和出口 */
export type RegisterMode = 'form' | 'closed' | 'passwordOff' | 'turnstile'

type ApiResult = {
  ok?: boolean
  user?: PublicUser
  verify?: { methods: string[] }
  code?: string
  messageKey?: string
  message?: string
}

type Errors = Dict['register']['errors']

/** new-api 的 message_key 是英文原句，已知的映射成本站文案，其余原样展示 */
const MESSAGE_KEYS: Record<string, keyof Errors> = {
  'New user registration has been disabled by administrator': 'closed',
  'Password registration has been disabled by administrator, please use third-party account verification':
    'passwordDisabled',
  'Invalid parameters': 'invalid',
  'Email verification is enabled, please enter email address and verification code': 'emailRequired',
  'Verification code is incorrect or has expired': 'codeInvalid',
  'Email address is already in use': 'emailTaken',
  'Username already exists or has been deleted': 'usernameTaken',
}

/** 本站与 new-api 安全接口的错误码 */
const CODES: Record<string, keyof Errors> = {
  UPSTREAM_UNREACHABLE: 'unreachable',
  RATE_LIMITED: 'rateLimited',
  INVALID: 'invalid',
  USERNAME_LENGTH: 'usernameLength',
  PASSWORD_LENGTH: 'passwordLength',
  PASSWORD_MISMATCH: 'passwordMismatch',
  EMAIL_INVALID: 'emailInvalid',
  EMAIL_ALREADY_TAKEN: 'emailTaken',
  PASSWORD_POLICY_REJECTED: 'passwordLength',
}

function errorText(r: ApiResult, status: number, errors: Errors, fallback = errors.generic): string {
  if (r.code === 'EMAIL_ADDRESS_REJECTED') {
    // 同一个码既表示格式不对，也表示被管理员的邮箱策略拒绝
    return r.message === 'Please enter a valid email address' ? errors.emailInvalid : errors.emailRejected
  }
  const byCode = r.code && CODES[r.code]
  if (byCode) return errors[byCode]
  if (status === 429) return errors.rateLimited
  // 结构体校验失败：消息里带着字段名
  if (r.messageKey === 'Invalid input {{error}}') {
    if (r.message?.includes('Password')) return errors.passwordLength
    if (r.message?.includes('Email')) return errors.emailInvalid
    if (r.message?.includes('Username') || r.message?.includes('DisplayName')) return errors.usernameLength
    return errors.invalid
  }
  const key = r.messageKey && MESSAGE_KEYS[r.messageKey]
  if (key) return errors[key]
  return r.message || fallback
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
const label = 'mb-2 block text-[0.8125rem] font-medium text-fg'
const hint = 'mt-1.5 px-5 text-[0.75rem] text-muted'

/** 验证码重发间隔（秒），与 new-api 邮件限流的量级一致 */
const RESEND_SECONDS = 60

export function RegisterForm({
  mode,
  emailVerification,
  gatewayUrl,
}: {
  mode: RegisterMode
  emailVerification: boolean
  gatewayUrl: string
}) {
  const { locale, dict } = useI18n()
  const r = dict.register
  const router = useRouter()
  const session = useSession()

  const [step, setStep] = useState<'form' | 'created'>('form')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [consoleHref, setConsoleHref] = useState(`${gatewayUrl}/register`)

  const params = () => new URLSearchParams(window.location.search)
  const target = () => safeNext(params().get('next'), localeHref(locale, '/'))
  const loginHref = () => {
    const next = params().get('next')
    const base = localeHref(locale, dict.nav.login.href)
    return next ? `${base}?${new URLSearchParams({ next })}` : base
  }

  // 已登录还打开注册页：直接送回去
  useEffect(() => {
    if (session.status === 'authenticated' && step === 'form') router.replace(target())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status])

  // 去控制台注册时带上邀请码，new-api 前端认 ?aff=
  useEffect(() => {
    const aff = params().get('aff')
    if (aff) setConsoleHref(`${gatewayUrl}/register?${new URLSearchParams({ aff })}`)
  }, [gatewayUrl])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendCode = async () => {
    if (sending || cooldown > 0) return
    setError('')
    setNotice('')
    const bad = checkEmail(email.trim())
    if (bad) {
      setError(r.errors[bad === 'INVALID' ? 'emailRequired' : 'emailInvalid'])
      return
    }
    setSending(true)
    const { status, data } = await post('/api/auth/register/code', { email: email.trim() })
    setSending(false)
    if (data.ok) {
      setNotice(r.codeSent)
      setCooldown(RESEND_SECONDS)
      return
    }
    setError(errorText(data, status, r.errors, r.errors.sendFailed))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setNotice('')

    const name = username.trim()
    const bad =
      checkUsername(name) ??
      (emailVerification ? (checkEmail(email.trim()) ?? (code.trim() ? null : 'INVALID')) : null) ??
      checkPassword(password)
    if (bad) {
      setError(errorText({ code: bad }, 400, r.errors))
      return
    }
    if (password !== confirm) {
      setError(r.errors.passwordMismatch)
      return
    }

    setBusy(true)
    const reg = await post('/api/auth/register', {
      username: name,
      password,
      ...(emailVerification ? { email: email.trim(), code: code.trim() } : {}),
      affCode: params().get('aff') ?? undefined,
    })
    if (!reg.data.ok) {
      setBusy(false)
      setError(errorText(reg.data, reg.status, r.errors))
      return
    }

    // 建号成功，沿用登录接口拿会话
    const login = await post('/api/auth/login', { username: name, password })
    setBusy(false)
    if (login.data.ok && login.data.user) {
      setAuthenticated(login.data.user)
      router.replace(target())
      return
    }
    setStep('created')
  }

  const loginLine = (
    <p className="mt-8 text-center text-[0.875rem] text-muted">
      {r.haveAccount}{' '}
      <Link href={localeHref(locale, dict.nav.login.href)} className="font-medium text-fg hover:underline">
        {r.login}
      </Link>
    </p>
  )

  if (mode !== 'form' || step === 'created') {
    const [title, body] =
      step === 'created'
        ? [r.createdTitle, r.createdBody]
        : mode === 'closed'
          ? [r.closedTitle, r.closedBody]
          : mode === 'passwordOff'
            ? [r.passwordOffTitle, r.passwordOffBody]
            : [r.turnstileTitle, r.turnstileBody]
    return (
      <div className="card w-full max-w-[26rem] p-8 md:p-10">
        <LogoMark className="h-7 w-8 text-fg" />
        <h1 className="mt-8 text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-fg">{title}</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{body}</p>
        {step === 'created' ? (
          <Link href={loginHref()} className="pill-solid mt-8 w-full">
            {r.login}
          </Link>
        ) : (
          <>
            {mode !== 'closed' && (
              <a href={consoleHref} className="pill-solid mt-8 w-full">
                {r.openConsole}
              </a>
            )}
            {loginLine}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="card w-full max-w-[26rem] p-8 md:p-10">
      <LogoMark className="h-7 w-8 text-fg" />
      <h1 className="mt-8 text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-fg">{r.title}</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{r.subtitle}</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="register-username" className={label}>
            {r.usernameLabel}
          </label>
          <input
            id="register-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-describedby="register-username-hint"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={field}
          />
          <p id="register-username-hint" className={hint}>
            {r.usernameHint}
          </p>
        </div>

        {emailVerification && (
          <>
            <div>
              <label htmlFor="register-email" className={label}>
                {r.emailLabel}
              </label>
              <div className="relative">
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${field} pr-32`}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending || cooldown > 0}
                  className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full px-4 text-[0.8125rem] font-medium text-fg transition-colors hover:bg-line/10 disabled:cursor-default disabled:text-muted disabled:hover:bg-transparent"
                >
                  {sending ? r.sendingCode : cooldown > 0 ? r.resendIn.replace('{s}', String(cooldown)) : r.sendCode}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="register-code" className={label}>
                {r.codeLabel}
              </label>
              <input
                id="register-code"
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${field} font-mono tracking-[0.2em]`}
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="register-password" className={label}>
            {r.passwordLabel}
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-describedby="register-password-hint"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? r.hidePassword : r.showPassword}
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
          <p id="register-password-hint" className={hint}>
            {r.passwordHint}
          </p>
        </div>

        <div>
          <label htmlFor="register-confirm" className={label}>
            {r.confirmLabel}
          </label>
          <input
            id="register-confirm"
            name="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={field}
          />
        </div>

        {error ? (
          <p role="alert" className="text-[0.8125rem] leading-relaxed text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : (
          notice && (
            <p role="status" className="text-[0.8125rem] leading-relaxed text-muted">
              {notice}
            </p>
          )
        )}

        <button type="submit" disabled={busy} className="pill-solid w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? r.submitting : r.submit}
        </button>
      </form>

      {loginLine}
    </div>
  )
}
