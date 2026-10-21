'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, ConsoleError, useApi, type Page } from '@/lib/console/api'
import { useI18n } from '@/lib/i18n/context'
import {
  Badge,
  Button,
  ConfirmDialog,
  CopyText,
  Dialog,
  ErrorState,
  Field,
  LoadingRows,
  PageHeader,
  Pagination,
  Panel,
  SelectBox,
  Switch,
  formatDateTime,
  inputClass,
  useConsole,
  useMoney,
  useQuotaUnit,
} from './ui'

/** new-api 的令牌（v1.0.0-rc.45 model.Token）。列表里的 key 已打码 */
type Token = {
  id: number
  name: string
  key: string
  status: number
  created_time: number
  expired_time: number
  remain_quota: number
  unlimited_quota: boolean
  used_quota: number
  model_limits_enabled: boolean
  model_limits: string
  allow_ips: string | null
  group: string
}

const PAGE_SIZE = 10
/** new-api 存的是不带前缀的 48 位随机串，对外统一加 sk- */
const withPrefix = (key: string) => `sk-${key}`

const STATUS_TONE: Record<number, 'ok' | 'warn' | 'bad' | 'neutral'> = { 1: 'ok', 2: 'neutral', 3: 'warn', 4: 'bad' }

async function fetchFullKey(id: number) {
  const r = await api<{ key: string }>(`token/${id}/key`, { method: 'POST' })
  return withPrefix(r.key)
}

/* ── 表单 ───────────────────────────────────────────────────────── */

type ExpiryChoice = 'never' | 'd1' | 'd7' | 'd30' | 'd90' | 'custom'
const EXPIRY_DAYS: Partial<Record<ExpiryChoice, number>> = { d1: 1, d7: 7, d30: 30, d90: 90 }

type FormState = {
  name: string
  group: string
  expiry: ExpiryChoice
  customExpiry: string
  unlimited: boolean
  amount: string
  modelLimitsEnabled: boolean
  models: string[]
  allowIps: string
}

function toLocalInput(ts: number) {
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function initialForm(t: Token | null, unit: number): FormState {
  if (!t) {
    return {
      name: '',
      group: '',
      expiry: 'never',
      customExpiry: '',
      unlimited: true,
      amount: '',
      modelLimitsEnabled: false,
      models: [],
      allowIps: '',
    }
  }
  return {
    name: t.name,
    group: t.group,
    expiry: t.expired_time === -1 ? 'never' : 'custom',
    customExpiry: t.expired_time === -1 ? '' : toLocalInput(t.expired_time),
    unlimited: t.unlimited_quota,
    amount: t.unlimited_quota ? '' : String(+(t.remain_quota / unit).toFixed(6)),
    modelLimitsEnabled: t.model_limits_enabled,
    models: t.model_limits ? t.model_limits.split(',').filter(Boolean) : [],
    allowIps: t.allow_ips ?? '',
  }
}

type GroupInfo = Record<string, { ratio: number | string; desc: string }>

function KeyForm({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: Token | null
  onClose: () => void
  onSaved: (created: { name: string } | null) => void
}) {
  const { dict } = useI18n()
  const c = dict.console
  const k = c.keys
  const unit = useQuotaUnit()
  const [form, setForm] = useState<FormState>(() => initialForm(editing, unit))
  const [errors, setErrors] = useState<Partial<Record<'name' | 'amount' | 'expiry' | 'form', string>>>({})
  const [busy, setBusy] = useState(false)
  const [modelFilter, setModelFilter] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initialForm(editing, unit))
      setErrors({})
      setModelFilter('')
    }
  }, [open, editing, unit])

  // 分组与可用模型只在打开表单时拉一次
  const groups = useApi(open ? 'groups' : null, () => api<GroupInfo>('user/self/groups'))
  const models = useApi(open ? 'models' : null, () => api<string[]>('user/models'))

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    const name = form.name.trim()
    if (!name) errs.name = k.errors.nameRequired
    else if (name.length > 50) errs.name = k.errors.nameTooLong

    let expired = -1
    if (form.expiry === 'custom') {
      const t = Math.floor(new Date(form.customExpiry).getTime() / 1000)
      if (!form.customExpiry || Number.isNaN(t) || t <= Date.now() / 1000) errs.expiry = k.errors.expiryPast
      else expired = t
    } else if (form.expiry !== 'never') {
      expired = Math.floor(Date.now() / 1000) + (EXPIRY_DAYS[form.expiry] ?? 0) * 86400
    }

    let remain = 0
    if (!form.unlimited) {
      const usd = Number(form.amount)
      if (!Number.isFinite(usd) || usd <= 0) errs.amount = k.errors.quotaInvalid
      else remain = Math.round(usd * unit)
    }
    setErrors(errs)
    if (Object.keys(errs).length) return

    const body = {
      ...(editing ? { id: editing.id } : {}),
      name,
      group: form.group,
      expired_time: expired,
      unlimited_quota: form.unlimited,
      remain_quota: remain,
      model_limits_enabled: form.modelLimitsEnabled && form.models.length > 0,
      model_limits: form.modelLimitsEnabled ? form.models.join(',') : '',
      allow_ips: form.allowIps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .join('\n'),
    }
    setBusy(true)
    try {
      await api('token', { method: editing ? 'PUT' : 'POST', body })
      onSaved(editing ? null : { name })
    } catch (err) {
      setErrors({ form: err instanceof ConsoleError ? err.message : c.loadError })
    } finally {
      setBusy(false)
    }
  }

  const visibleModels = (models.data ?? []).filter((m) => m.toLowerCase().includes(modelFilter.trim().toLowerCase()))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? k.formEdit : k.formCreate}
      footer={
        <>
          <Button onClick={onClose}>{c.cancel}</Button>
          <Button variant="solid" type="submit" form="key-form" disabled={busy}>
            {c.save}
          </Button>
        </>
      }
    >
      <form id="key-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label={k.name} htmlFor="key-name" error={errors.name}>
          <input
            id="key-name"
            value={form.name}
            maxLength={50}
            placeholder={k.namePlaceholder}
            onChange={(e) => set('name', e.target.value)}
            className={inputClass}
            data-autofocus
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={k.group} htmlFor="key-group">
            <SelectBox id="key-group" value={form.group} onChange={(v) => set('group', v)}>
              <option value="">{k.groupDefault}</option>
              {Object.entries(groups.data ?? {}).map(([g, info]) => (
                <option key={g} value={g}>
                  {g}
                  {typeof info.ratio === 'number' ? ` ×${info.ratio}` : ''}
                  {info.desc ? ` · ${info.desc}` : ''}
                </option>
              ))}
              {/* 编辑时原分组可能已不在可选列表里，保留显示 */}
              {form.group && groups.data && !(form.group in groups.data) && <option value={form.group}>{form.group}</option>}
            </SelectBox>
          </Field>

          <Field label={k.expiry} htmlFor="key-expiry" error={errors.expiry}>
            <SelectBox id="key-expiry" value={form.expiry} onChange={(v) => set('expiry', v as ExpiryChoice)}>
              {(Object.keys(k.expiryOptions) as ExpiryChoice[]).map((o) => (
                <option key={o} value={o}>
                  {k.expiryOptions[o]}
                </option>
              ))}
            </SelectBox>
            {form.expiry === 'custom' && (
              <input
                type="datetime-local"
                aria-label={k.expiryOptions.custom}
                value={form.customExpiry}
                onChange={(e) => set('customExpiry', e.target.value)}
                className={`${inputClass} mt-2`}
              />
            )}
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[0.8125rem] font-medium text-fg">{k.quota}</span>
            <label className="flex items-center gap-2 text-[0.8125rem] text-muted">
              {k.quotaUnlimited}
              <Switch checked={form.unlimited} onChange={(v) => set('unlimited', v)} label={k.quotaUnlimited} />
            </label>
          </div>
          {!form.unlimited && (
            <div className="mt-3">
              <Field label={k.quotaAmount} htmlFor="key-amount" error={errors.amount}>
                <input
                  id="key-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </div>

        <details className="group rounded-tile border border-line/10 px-4 py-3" open={form.modelLimitsEnabled || !!form.allowIps}>
          <summary className="cursor-pointer text-[0.8125rem] font-medium text-fg">{k.advanced}</summary>
          <div className="mt-4 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.8125rem] font-medium text-fg">{k.modelLimits}</span>
                <Switch
                  checked={form.modelLimitsEnabled}
                  onChange={(v) => set('modelLimitsEnabled', v)}
                  label={k.modelLimits}
                />
              </div>
              <p className="mt-1 text-[0.75rem] text-muted">{k.modelLimitsHint}</p>
              {form.modelLimitsEnabled && (
                <div className="mt-3 rounded-tile border border-line/10">
                  <input
                    aria-label={k.modelSearch}
                    placeholder={k.modelSearch}
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="h-9 w-full border-b border-line/10 bg-transparent px-3 text-[0.8125rem] text-fg placeholder:text-muted/70 focus:outline-none"
                  />
                  <div className="max-h-44 space-y-0.5 overflow-y-auto p-2">
                    {visibleModels.map((m) => (
                      <label
                        key={m}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.8125rem] hover:bg-line/5"
                      >
                        <input
                          type="checkbox"
                          checked={form.models.includes(m)}
                          onChange={(e) =>
                            set('models', e.target.checked ? [...form.models, m] : form.models.filter((x) => x !== m))
                          }
                          className="h-4 w-4 accent-[#1668FF]"
                        />
                        <span className="font-mono text-fg">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Field label={k.allowIps} htmlFor="key-ips" hint={k.allowIpsHint}>
              <textarea
                id="key-ips"
                rows={3}
                value={form.allowIps}
                onChange={(e) => set('allowIps', e.target.value)}
                className={`${inputClass} h-auto py-2 font-mono`}
              />
            </Field>
          </div>
        </details>

        {errors.form && (
          <p role="alert" className="text-[0.8125rem] text-rose-600 dark:text-rose-400">
            {errors.form}
          </p>
        )}
      </form>
    </Dialog>
  )
}

/** 行内图标操作：图标本身无文字，名称交给 aria-label 与 title */
function IconButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/5 ${
        danger ? 'hover:text-rose-600 dark:hover:text-rose-400' : 'hover:text-fg'
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  )
}

/* ── 页面 ───────────────────────────────────────────────────────── */

export function KeysPage() {
  const { locale, dict } = useI18n()
  const c = dict.console
  const k = c.keys
  const money = useMoney()
  const { toast } = useConsole()

  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Token | null>(null)
  const [deleting, setDeleting] = useState<Token | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  // 从概览页"创建 API 密钥"跳过来时直接打开表单
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') {
      setFormOpen(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // 搜索输入防抖 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(keyword.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [keyword])

  const list = useApi(`${query}|${page}`, () =>
    query
      ? api<Page<Token>>('token/search', { query: { keyword: query, p: page, page_size: PAGE_SIZE } })
      : api<Page<Token>>('token', { query: { p: page, page_size: PAGE_SIZE } })
  )
  const items = useMemo(() => list.data?.items ?? [], [list.data])

  const toggle = async (t: Token) => {
    setBusyId(t.id)
    try {
      await api('token', { method: 'PUT', query: { status_only: 'true' }, body: { id: t.id, status: t.status === 1 ? 2 : 1 } })
      toast(c.saved)
      list.reload()
    } catch (err) {
      toast(err instanceof ConsoleError ? err.message : c.loadError)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusyId(deleting.id)
    try {
      await api(`token/${deleting.id}`, { method: 'DELETE' })
      setDeleting(null)
      list.reload()
    } catch (err) {
      toast(err instanceof ConsoleError ? err.message : c.loadError)
    } finally {
      setBusyId(null)
    }
  }

  /**
   * 新建接口不回传密钥。按 id 倒序取第一页里同名的最新一条，再单独要完整密钥，
   * 这样新建后能立刻展示给用户复制。
   */
  const onSaved = async (newKey: { name: string } | null) => {
    setFormOpen(false)
    setEditing(null)
    setPage(1)
    list.reload()
    if (!newKey) {
      toast(c.saved)
      return
    }
    try {
      const first = await api<Page<Token>>('token', { query: { p: 1, page_size: PAGE_SIZE } })
      const match = (first.items ?? []).filter((t) => t.name === newKey.name).sort((a, b) => b.id - a.id)[0]
      if (match) setCreated(await fetchFullKey(match.id))
      else toast(c.saved)
    } catch {
      toast(c.saved)
    }
  }

  const th = 'whitespace-nowrap px-3 py-3 text-left text-[0.75rem] font-medium text-muted'

  return (
    <div className="space-y-6">
      <PageHeader
        title={k.title}
        subtitle={k.subtitle}
        actions={
          <Button
            variant="solid"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            {k.create}
          </Button>
        }
      />

      <Panel
        bodyClassName=""
        actions={
          <input
            type="search"
            aria-label={k.search}
            placeholder={k.search}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={`${inputClass} w-64 max-w-full font-normal`}
          />
        }
      >
        {list.error ? (
          <ErrorState onRetry={list.reload} message={list.error.message} />
        ) : list.loading && !list.data ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[0.9375rem] text-fg">{k.empty}</p>
            {!query && <p className="mt-1 text-[0.8125rem] text-muted">{k.emptyHint}</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-line/10">
                    <th scope="col" className={`${th} pl-5 md:pl-6`}>
                      {k.colName}
                    </th>
                    <th scope="col" className={th}>
                      {k.colKey}
                    </th>
                    <th scope="col" className={th}>
                      {k.colStatus}
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      {k.colUsed}
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      {k.colRemain}
                    </th>
                    <th scope="col" className={th}>
                      {k.colGroup}
                    </th>
                    <th scope="col" className={th}>
                      {k.colExpires}
                    </th>
                    <th scope="col" className={`${th} pr-5 text-right md:pr-6`}>
                      {k.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b border-line/[0.06] last:border-0 hover:bg-line/[0.03]">
                      <td className="max-w-[12rem] truncate py-3 pl-5 pr-3 font-medium text-fg md:pl-6" title={t.name}>
                        {t.name}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <code className="whitespace-nowrap font-mono text-[0.75rem] text-muted">{withPrefix(t.key)}</code>
                          <CopyText text={() => fetchFullKey(t.id)} label={k.copyKey} className="h-7 w-7" />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          {(t.status === 1 || t.status === 2) && (
                            <Switch
                              checked={t.status === 1}
                              disabled={busyId === t.id}
                              onChange={() => toggle(t)}
                              label={`${t.status === 1 ? k.disable : k.enable} ${t.name}`}
                            />
                          )}
                          <Badge tone={STATUS_TONE[t.status] ?? 'neutral'}>{k.status[t.status] ?? t.status}</Badge>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-fg">{money(t.used_quota)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-fg">
                        {t.unlimited_quota ? c.unlimited : money(t.remain_quota)}
                      </td>
                      <td className="px-3 py-3 text-muted">{t.group || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">
                        {t.expired_time === -1 ? c.never : formatDateTime(t.expired_time, locale)}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right md:pr-6">
                        <div className="flex justify-end gap-0.5">
                          <IconButton
                            label={`${c.edit} ${t.name}`}
                            onClick={() => {
                              setEditing(t)
                              setFormOpen(true)
                            }}
                          >
                            <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
                          </IconButton>
                          <IconButton label={`${c.delete} ${t.name}`} danger onClick={() => setDeleting(t)}>
                            <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(list.data?.total ?? 0) > PAGE_SIZE && (
              <div className="border-t border-line/10">
                <Pagination page={page} pageSize={PAGE_SIZE} total={list.data?.total ?? 0} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </Panel>

      <KeyForm
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={c.delete}
        message={k.confirmDelete.replace('{name}', deleting?.name ?? '')}
        confirmLabel={c.delete}
        busy={busyId !== null}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />

      <Dialog open={created !== null} onClose={() => setCreated(null)} title={k.createdTitle} size="sm">
        <p className="text-[0.875rem] leading-relaxed text-muted">{k.createdBody}</p>
        <div className="mt-4 flex items-center gap-2 rounded-tile border border-line/12 bg-line/[0.03] py-1.5 pl-3 pr-1.5">
          <code className="min-w-0 flex-1 break-all font-mono text-[0.8125rem] text-fg">{created}</code>
          {created && <CopyText text={created} label={c.copy} />}
        </div>
      </Dialog>
    </div>
  )
}
