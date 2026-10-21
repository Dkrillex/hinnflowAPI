import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { SiteFooter } from '@/components/SiteFooter'
import { CodeTabs } from '@/components/docs/CodeTabs'
import { Rich } from '@/components/docs/Rich'
import { Toc } from '@/components/docs/Toc'
import { getDocs, type Block } from '@/lib/docs/content'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/dictionaries'
import { NEWAPI_PUBLIC_URL, fetchExampleModel } from '@/lib/newapi/client'

/** 示例模型名取自网关，每小时刷新一次就够了 */
export const revalidate = 3600

const HREFLANG: Record<string, string> = { en: 'en', zh: 'zh-CN' }

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const d = getDocs(locale, { baseUrl: NEWAPI_PUBLIC_URL, model: '' })
  return {
    title: d.metaTitle,
    description: d.metaDescription,
    alternates: {
      canonical: `/${locale}/docs`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], `/${l}/docs`])),
        'x-default': '/en/docs',
      },
    },
  }
}

function BlockView({ block, locale, copy, copied }: { block: Block; locale: Locale; copy: string; copied: string }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="text-[0.9375rem] leading-[1.8] text-muted">
          <Rich text={block.text} locale={locale} />
        </p>
      )
    case 'note':
      return (
        <div className="rounded-tile border border-flow/25 bg-flow/[0.06] px-4 py-3 text-[0.875rem] leading-relaxed text-muted">
          <Rich text={block.text} locale={locale} />
        </div>
      )
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag
          className={`space-y-2 pl-5 text-[0.9375rem] leading-[1.8] text-muted marker:text-muted/70 ${
            block.ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {block.items.map((it, i) => (
            <li key={i} className="pl-1">
              <Rich text={it} locale={locale} />
            </li>
          ))}
        </Tag>
      )
    }
    case 'endpoint':
      return (
        <div className="flex items-center gap-3 rounded-tile border border-line/12 bg-line/[0.03] px-4 py-3 font-mono text-[0.875rem]">
          <span
            className={`rounded-md px-2 py-0.5 text-[0.75rem] font-semibold ${
              block.method === 'GET'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-flow/15 text-flow-700 dark:text-flow-300'
            }`}
          >
            {block.method}
          </span>
          <span className="text-fg">{block.path}</span>
        </div>
      )
    case 'code':
      return <CodeTabs samples={block.samples} copy={copy} copied={copied} />
    case 'table':
      return (
        <div className="overflow-x-auto rounded-tile border border-line/12">
          <table className="w-full text-[0.875rem]">
            <thead>
              <tr className="border-b border-line/10 bg-line/[0.03]">
                {block.head.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-2.5 text-left text-[0.8125rem] font-medium text-fg">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-line/[0.06] last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-4 py-2.5 align-top leading-relaxed ${j === 0 ? 'text-fg' : 'text-muted'}`}>
                      <Rich text={cell} locale={locale} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export default async function DocsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'en'
  const model = await fetchExampleModel()
  const d = getDocs(locale, { baseUrl: NEWAPI_PUBLIC_URL, model })

  return (
    <div className="relative min-h-screen w-full">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-[110px] sm:px-6 lg:px-10">
        <header className="max-w-3xl lg:ml-[16rem]">
          <div className="eyebrow">{d.eyebrow}</div>
          <h1 className="mt-4 text-[2.25rem] font-medium leading-[1.1] tracking-[-0.02em] text-fg md:text-[3rem]">{d.title}</h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">{d.subtitle}</p>
        </header>

        <div className="mt-10 lg:grid lg:grid-cols-[13rem_minmax(0,48rem)] lg:gap-12">
          <aside className="mb-8 lg:sticky lg:top-[90px] lg:mb-0 lg:self-start">
            <Toc title={d.tocTitle} items={d.sections.map((s) => ({ id: s.id, title: s.title }))} />
          </aside>

          <main className="min-w-0 space-y-14">
            {d.sections.map((s) => (
              <section key={s.id} aria-labelledby={s.id} className="space-y-5">
                <h2 id={s.id} className="scroll-mt-24 text-[1.5rem] font-medium tracking-[-0.01em] text-fg">
                  <a href={`#${s.id}`} className="group inline-flex items-center gap-2">
                    {s.title}
                    <span aria-hidden className="text-muted/0 transition-colors group-hover:text-muted">
                      #
                    </span>
                  </a>
                </h2>
                {s.blocks.map((b, i) => (
                  <BlockView key={i} block={b} locale={locale} copy={d.copy} copied={d.copied} />
                ))}
              </section>
            ))}
          </main>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
