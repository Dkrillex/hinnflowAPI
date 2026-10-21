import type { Metadata } from 'next'
import { FlowBackdrop } from '@/components/FlowBackdrop'
import { Navbar } from '@/components/Navbar'
import { SiteFooter } from '@/components/SiteFooter'
import { Marketplace } from '@/components/marketplace/Marketplace'
import { LOCALES, getDict, isLocale } from '@/lib/i18n/dictionaries'
import { fetchMarketplace, type MarketplaceData } from '@/lib/newapi/client'

/** 与 lib/newapi/client.ts 的 REVALIDATE_SECONDS 保持一致；这里必须是字面量，Next 静态分析读不了引用 */
export const revalidate = 60

const HREFLANG: Record<string, string> = { en: 'en', zh: 'zh-CN' }

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const m = getDict(locale).marketplace
  return {
    title: m.metaTitle,
    description: m.metaDescription,
    alternates: {
      canonical: `/${locale}/model`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], `/${l}/model`])),
        'x-default': '/en/model',
      },
    },
  }
}

export default async function MarketplacePage() {
  let data: MarketplaceData | null = null
  try {
    data = await fetchMarketplace()
  } catch (err) {
    // 网关不可达时照常出页面，由客户端展示错误态与重试；下个回源周期自动恢复
    console.error('[marketplace] 拉取模型价格失败:', err)
  }

  return (
    <>
      <FlowBackdrop />

      <div className="relative z-10 w-full min-h-screen">
        <div aria-hidden className="flow-scrim" />
        <Navbar />
        <main className="w-full">
          <Marketplace data={data} />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
