'use client'

/**
 * 控制台的数据请求。全部经由本站 /api/console/*（服务端转接 new-api，见
 * app/api/console/[...path]/route.ts），浏览器从不持有令牌。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { markSignedOut } from '@/lib/auth/client'

export class ConsoleError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message)
  }
}

type Query = Record<string, string | number | undefined>

export async function api<T>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; query?: Query; body?: unknown } = {}
): Promise<T> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== '') qs.set(k, String(v))
  const q = qs.toString()
  const url = `/api/console/${path}${q ? `?${q}` : ''}`

  let res: Response
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: opts.body === undefined ? undefined : { 'content-type': 'application/json' },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch {
    throw new ConsoleError('network', 0, 'NETWORK')
  }
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; code?: string; data?: T }
  if (res.status === 401) {
    markSignedOut()
    throw new ConsoleError(data.message || 'unauthenticated', 401, data.code)
  }
  if (!res.ok || data.success === false) throw new ConsoleError(data.message || data.code || 'error', res.status, data.code)
  return data.data as T
}

/** new-api 的分页结构 */
export type Page<T> = { page: number; page_size: number; total: number; items: T[] | null }

/**
 * 简单的数据加载钩子：key 变化时重新请求，丢弃过期的响应。
 * reload() 用于写操作之后刷新。
 */
export function useApi<T>(key: string | null, load: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<ConsoleError | null>(null)
  const [loading, setLoading] = useState(key !== null)
  const seq = useRef(0)
  const loader = useRef(load)
  loader.current = load

  const run = useCallback(() => {
    const id = ++seq.current
    setLoading(true)
    setError(null)
    loader
      .current()
      .then((d) => id === seq.current && setData(d))
      .catch((e) => id === seq.current && setError(e instanceof ConsoleError ? e : new ConsoleError(String(e), 0)))
      .finally(() => id === seq.current && setLoading(false))
  }, [])

  useEffect(() => {
    if (key !== null) run()
  }, [key, run])

  return { data, error, loading, reload: run }
}
