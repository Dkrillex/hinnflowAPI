import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { ModelsSection } from '@/components/ModelsSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { PricingSection } from '@/components/PricingSection'
import { SiteFooter } from '@/components/SiteFooter'

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-white selection:bg-primary-500 selection:text-white transition-colors duration-300">
      <Navbar />
      <main className="w-full">
        <Hero />
        <ModelsSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  )
}
