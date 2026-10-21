'use client'

import { createContext, useContext } from 'react'
import type { Dict, Locale } from './dictionaries'

type Value = { locale: Locale; dict: Dict }

const I18nContext = createContext<Value | null>(null)

export function I18nProvider({ value, children }: { value: Value; children: React.ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** 词条与当前语种。字典由服务端按路由段选好后注入，客户端只读。 */
export function useI18n(): Value {
  const v = useContext(I18nContext)
  if (!v) throw new Error('useI18n 必须在 I18nProvider 内使用')
  return v
}

export { localeHref } from './href'
