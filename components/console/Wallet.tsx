'use client'

import { useState } from 'react'
import { loadSession, useSession } from '@/lib/auth/client'
import { api, ConsoleError, useApi } from '@/lib/console/api'
import { useI18n } from '@/lib/i18n/context'
import { Button, PageHeader, Panel, Skeleton, StatTile, inputClass, useConsole, useMoney } from './ui'

/** /api/user/topup/info 里决定"在线充值"入口是否出现的字段 */
type TopUpInfo = {
  enable_online_topup?: boolean
  enable_stripe_topup?: boolean
  pay_methods?: unknown[]
}

export function WalletPage() {
  const { dict } = useI18n()
  const c = dict.console
  const w = c.wallet
  const session = useSession()
  const money = useMoney()
  const { gatewayUrl } = useConsole()

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const info = useApi('topup-info', () => api<TopUpInfo>('user/topup/info'))
  const online = !!(info.data && (info.data.enable_online_topup || info.data.enable_stripe_topup || info.data.pay_methods?.length))

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault()
    const key = code.trim()
    if (!key || busy) return
    setBusy(true)
    setResult(null)
    try {
      // 成功时返回本次到账的额度
      const quota = await api<number>('user/topup', { method: 'POST', body: { key } })
      setResult({ ok: true, text: w.redeemed.replace('{amount}', money(quota)) })
      setCode('')
      void loadSession(true)
    } catch (err) {
      // new-api 刻意不区分兑换失败原因；网络类错误另给提示
      setResult({ ok: false, text: err instanceof ConsoleError && err.status === 0 ? c.loadError : w.redeemFailed })
    } finally {
      setBusy(false)
    }
  }

  if (session.status !== 'authenticated') return null
  const { user } = session

  return (
    <div className="space-y-6">
      <PageHeader title={w.title} subtitle={w.subtitle} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label={w.balance} value={money(user.quota)} />
        <StatTile label={w.used} value={money(user.usedQuota)} />
        <StatTile label={w.requests} value={user.requestCount.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={w.redeemTitle}>
          <p className="text-[0.875rem] text-muted">{w.redeemBody}</p>
          <form onSubmit={redeem} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label={w.redeemPlaceholder}
              placeholder={w.redeemPlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} font-mono`}
            />
            <Button variant="solid" type="submit" disabled={busy || !code.trim()} className="shrink-0">
              {busy ? w.redeeming : w.redeem}
            </Button>
          </form>
          {result && (
            <p
              role={result.ok ? 'status' : 'alert'}
              className={`mt-3 text-[0.8125rem] ${result.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
            >
              {result.text}
            </p>
          )}
        </Panel>

        <Panel title={w.onlineTitle}>
          {info.loading && !info.data ? (
            <Skeleton className="h-16 w-full" />
          ) : online ? (
            <>
              <p className="text-[0.875rem] text-muted">{w.onlineBody}</p>
              <a
                href={`${gatewayUrl}/wallet`}
                target="_blank"
                rel="noopener noreferrer"
                className="pill-ghost mt-4 !px-5 !py-2.5 !text-[0.875rem]"
              >
                {w.onlineCta}
                <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </>
          ) : (
            <p className="text-[0.875rem] text-muted">{w.onlineOff}</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
