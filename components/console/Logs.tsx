'use client'

import { Fragment, useMemo, useState } from 'react'
import { api, useApi, type Page } from '@/lib/console/api'
import { useI18n } from '@/lib/i18n/context'
import {
  Badge,
  Button,
  ErrorState,
  Field,
  LoadingRows,
  PageHeader,
  Pagination,
  Panel,
  SelectBox,
  StatTile,
  formatDateTime,
  inputClass,
  useMoney,
} from './ui'

/** new-api 的日志（v1.0.0-rc.45 model.Log），只取展示要用的字段 */
type Log = {
  id: number
  created_at: number
  type: number
  content: string
  token_name: string
  model_name: string
  quota: number
  prompt_tokens: number
  completion_tokens: number
  use_time: number
  is_stream: boolean
  group: string
  request_id?: string
}

type Range = 'd1' | 'd7' | 'd30'
const RANGE_SECONDS: Record<Range, number> = { d1: 86400, d7: 7 * 86400, d30: 30 * 86400 }
const TYPE_ORDER = [0, 2, 1, 6, 5, 3, 4]
const TYPE_TONE: Record<number, 'ok' | 'warn' | 'bad' | 'neutral'> = { 1: 'ok', 2: 'neutral', 5: 'bad', 6: 'warn' }
const PAGE_SIZE = 20

type Filters = { range: Range; type: number; model: string; token: string }
const EMPTY: Filters = { range: 'd7', type: 0, model: '', token: '' }

export function LogsPage() {
  const { locale, dict } = useI18n()
  const c = dict.console
  const l = c.logs
  const money = useMoney()

  // draft 是表单里正在编辑的条件，applied 是已提交、驱动请求的条件
  const [draft, setDraft] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<number | null>(null)
  // 时间窗口在提交那一刻定死，翻页时不漂移
  const [win, setWin] = useState(() => ({ end: Math.floor(Date.now() / 1000) }))

  const query = useMemo(
    () => ({
      type: applied.type || undefined,
      model_name: applied.model || undefined,
      token_name: applied.token || undefined,
      start_timestamp: win.end - RANGE_SECONDS[applied.range],
      end_timestamp: win.end,
    }),
    [applied, win]
  )
  const key = JSON.stringify(query)

  const list = useApi(`${key}|${page}`, () => api<Page<Log>>('log/self', { query: { ...query, p: page, page_size: PAGE_SIZE } }))
  const stat = useApi(key, () => api<{ quota: number }>('log/self/stat', { query }))
  const items = list.data?.items ?? []

  const apply = (next: Filters) => {
    setApplied(next)
    setWin({ end: Math.floor(Date.now() / 1000) })
    setPage(1)
    setOpen(null)
  }

  const th = 'whitespace-nowrap px-4 py-3 text-left text-[0.75rem] font-medium text-muted'

  return (
    <div className="space-y-6">
      <PageHeader title={l.title} subtitle={l.subtitle} />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          apply({ ...draft, model: draft.model.trim(), token: draft.token.trim() })
        }}
        className="card grid gap-4 p-5 sm:grid-cols-2 md:p-6 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
      >
        <Field label={l.range} htmlFor="log-range">
          <SelectBox id="log-range" value={draft.range} onChange={(v) => setDraft({ ...draft, range: v as Range })}>
            {(Object.keys(l.ranges) as Range[]).map((r) => (
              <option key={r} value={r}>
                {l.ranges[r]}
              </option>
            ))}
          </SelectBox>
        </Field>
        <Field label={l.type} htmlFor="log-type">
          <SelectBox id="log-type" value={String(draft.type)} onChange={(v) => setDraft({ ...draft, type: Number(v) })}>
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {l.types[t]}
              </option>
            ))}
          </SelectBox>
        </Field>
        <Field label={l.model} htmlFor="log-model">
          <input
            id="log-model"
            value={draft.model}
            onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <Field label={l.token} htmlFor="log-token">
          <input
            id="log-token"
            value={draft.token}
            onChange={(e) => setDraft({ ...draft, token: e.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
          <Button variant="solid" type="submit">
            {l.apply}
          </Button>
          <Button
            onClick={() => {
              setDraft(EMPTY)
              apply(EMPTY)
            }}
          >
            {l.reset}
          </Button>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          label={l.spent}
          value={stat.data ? money(stat.data.quota, 'cost') : '—'}
          hint={l.ranges[applied.range]}
        />
      </div>

      <Panel bodyClassName="">
        {list.error ? (
          <ErrorState onRetry={list.reload} message={list.error.message} />
        ) : list.loading && !list.data ? (
          <LoadingRows rows={8} />
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-[0.9375rem] text-muted">{l.empty}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[60rem] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-line/10">
                    <th scope="col" className={`${th} pl-5 md:pl-6`}>
                      {l.colTime}
                    </th>
                    <th scope="col" className={th}>
                      {l.colType}
                    </th>
                    <th scope="col" className={th}>
                      {l.colToken}
                    </th>
                    <th scope="col" className={th}>
                      {l.colModel}
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      {l.colPrompt}
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      {l.colCompletion}
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      {l.colDuration}
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      {l.colCost}
                    </th>
                    <th scope="col" className={`${th} pr-5 md:pr-6`}>
                      <span className="sr-only">{l.details}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const expanded = open === row.id
                    return (
                      <Fragment key={row.id}>
                        <tr className="border-b border-line/[0.06] hover:bg-line/[0.03]">
                          <td className="whitespace-nowrap py-3 pl-5 pr-4 tabular-nums text-muted md:pl-6">
                            {formatDateTime(row.created_at, locale)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={TYPE_TONE[row.type] ?? 'neutral'}>{l.types[row.type] ?? row.type}</Badge>
                          </td>
                          <td className="max-w-[10rem] truncate px-4 py-3 text-fg" title={row.token_name}>
                            {row.token_name || '—'}
                          </td>
                          <td className="max-w-[14rem] truncate px-4 py-3 font-mono text-fg" title={row.model_name}>
                            {row.model_name || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-fg">
                            {row.prompt_tokens ? row.prompt_tokens.toLocaleString() : '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-fg">
                            {row.completion_tokens ? row.completion_tokens.toLocaleString() : '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-fg">
                            {row.use_time ? `${row.use_time}s` : '—'}
                            {row.is_stream && <span className="ml-1.5 text-[0.6875rem] text-muted">{l.stream}</span>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-fg">
                            {row.quota ? money(row.quota, 'cost') : '—'}
                          </td>
                          <td className="py-3 pl-4 pr-5 text-right md:pr-6">
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-controls={`log-${row.id}`}
                              onClick={() => setOpen(expanded ? null : row.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/5 hover:text-fg"
                            >
                              <span className="sr-only">{l.details}</span>
                              <svg
                                aria-hidden
                                viewBox="0 0 24 24"
                                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr id={`log-${row.id}`} className="border-b border-line/[0.06] bg-line/[0.025]">
                            <td colSpan={9} className="px-5 py-4 md:px-6">
                              <dl className="grid gap-x-8 gap-y-2 text-[0.8125rem] sm:grid-cols-[auto_1fr]">
                                {row.content && (
                                  <>
                                    <dt className="text-muted">{l.details}</dt>
                                    <dd className="whitespace-pre-wrap break-words text-fg">{row.content}</dd>
                                  </>
                                )}
                                {row.group && (
                                  <>
                                    <dt className="text-muted">{c.keys.colGroup}</dt>
                                    <dd className="text-fg">{row.group}</dd>
                                  </>
                                )}
                                {row.request_id && (
                                  <>
                                    <dt className="text-muted">Request ID</dt>
                                    <dd className="break-all font-mono text-fg">{row.request_id}</dd>
                                  </>
                                )}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line/10">
              <Pagination page={page} pageSize={PAGE_SIZE} total={list.data?.total ?? 0} onChange={setPage} />
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
