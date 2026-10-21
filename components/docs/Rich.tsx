import Link from 'next/link'
import { localeHref } from '@/lib/i18n/href'
import type { Locale } from '@/lib/i18n/dictionaries'

/** 行内标记：`代码`、**加粗**、[文字](链接)。不支持嵌套，文档里也用不到 */
const TOKEN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))/g

export function Rich({ text, locale }: { text: string; locale: Locale }) {
  const out: React.ReactNode[] = []
  let last = 0
  for (const m of Array.from(text.matchAll(TOKEN))) {
    const i = m.index ?? 0
    if (i > last) out.push(text.slice(last, i))
    const tok = m[0]
    if (m[1]) {
      out.push(
        <code key={i} className="rounded-md border border-line/10 bg-line/[0.05] px-1.5 py-0.5 font-mono text-[0.85em] text-fg">
          {tok.slice(1, -1)}
        </code>
      )
    } else if (m[2]) {
      out.push(
        <strong key={i} className="font-medium text-fg">
          {tok.slice(2, -2)}
        </strong>
      )
    } else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)!
      const cls = 'font-medium text-accent underline decoration-accent/30 underline-offset-[3px] hover:decoration-accent'
      out.push(
        href.startsWith('/') ? (
          <Link key={i} href={localeHref(locale, href)} className={cls}>
            {label}
          </Link>
        ) : (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
            {label}
          </a>
        )
      )
    }
    last = i + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}
