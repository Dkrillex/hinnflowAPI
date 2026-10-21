'use client'

/**
 * 登录态的浏览器部分。令牌全在 HttpOnly Cookie 里，这里只持有展示用的用户信息。
 * 整页共享一份状态：导航栏、登录页等多个组件同时读取时只请求一次 /api/auth/me。
 */

import { useSyncExternalStore } from 'react'
import type { PublicUser } from './server'
import type { Currency } from '@/lib/newapi/pricing'

export type Wallet = { balanceUsd: number; quotaPerUnit: number; currency: Currency }

export type Session =
  /** 服务端渲染与首帧：还不知道 */
  | { status: 'unknown' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: PublicUser; wallet?: Wallet }

/** 与 lib/auth/server.ts 的 HINT_COOKIE 同名 */
const HINT_COOKIE = 'hf_session'

let state: Session = { status: 'unknown' }
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: Session) {
  state = next
  listeners.forEach((l) => l())
}

function hasHint() {
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${HINT_COOKIE}=`))
}

/** 向服务端确认登录态。没有提示 Cookie 时直接判为未登录，省掉一次请求 */
export function loadSession(force = false): Promise<void> {
  if (!force && loading) return loading
  if (!hasHint()) {
    set({ status: 'anonymous' })
    return Promise.resolve()
  }
  loading = fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
    .then(async (res) => {
      const body = (await res.json().catch(() => ({}))) as { user?: PublicUser | null; wallet?: Wallet }
      if (body.user) set({ status: 'authenticated', user: body.user, wallet: body.wallet })
      else if (res.ok) set({ status: 'anonymous' })
      // 网关临时故障：保持原状态，不把已登录的人显示成未登录
      else if (state.status === 'unknown') set({ status: 'anonymous' })
    })
    .catch(() => {
      if (state.status === 'unknown') set({ status: 'anonymous' })
    })
  return loading
}

export function setAuthenticated(user: PublicUser) {
  set({ status: 'authenticated', user })
  // 登录接口不带余额，补拉一次
  void loadSession(true)
}

/** 控制台接口发现会话已失效时调用：本地状态立即转为未登录 */
export function markSignedOut() {
  set({ status: 'anonymous' })
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
  } finally {
    set({ status: 'anonymous' })
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (state.status === 'unknown' && !loading) void loadSession()
  return () => listeners.delete(listener)
}

const serverSnapshot: Session = { status: 'unknown' }

export function useSession(): Session {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnapshot
  )
}

/** 登录后的回跳地址：只接受本站路径，挡住 //evil.com 这类开放重定向 */
export function safeNext(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  if (raw.startsWith('/api/')) return fallback
  return raw
}
