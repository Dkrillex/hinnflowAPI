import { FlowBackdrop } from '@/components/FlowBackdrop'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { ModelsSection } from '@/components/ModelsSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { PricingSection } from '@/components/PricingSection'
import { SiteFooter } from '@/components/SiteFooter'

export default function HomePage() {
  return (
    <>
      {/* 洋流固定铺满视口；薄纱随内容滚动，首屏薄、正文区厚 */}
      <FlowBackdrop />

      <div className="relative z-10 w-full min-h-screen">
        <div aria-hidden className="flow-scrim" />
        <Navbar />
        <main className="w-full">
          <Hero />
          <ModelsSection />
          <FeaturesSection />
          <PricingSection />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
