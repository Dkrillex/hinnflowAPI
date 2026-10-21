import type { Locale } from './dictionaries'

/**
 * 给站内链接加上语种前缀；外链与 mailto 原样返回。
 * 放在没有 'use client' 的模块里，服务端组件与客户端组件都能直接调用。
 */
export function localeHref(locale: Locale, href: string): string {
  if (!href.startsWith('/')) return href
  return href === '/' ? `/${locale}` : `/${locale}${href}`
}
