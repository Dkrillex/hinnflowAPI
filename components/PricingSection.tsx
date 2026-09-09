'use client'

import { Reveal } from './motion'
import Link from 'next/link'
import { Em, Eyebrow, SectionTitle } from './SectionHeading'
import { useI18n, localeHref } from '@/lib/i18n/context'

export function PricingSection() {
  const { locale, dict } = useI18n()
  const pricing = dict.pricing

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <Eyebrow>{pricing.eyebrow}</Eyebrow>
          <SectionTitle className="mt-6 max-w-4xl">
            {pricing.headingLead} <Em>{pricing.headingAccent}</Em>
          </SectionTitle>
        </Reveal>

        <div className="mt-16 grid items-stretch gap-5 md:grid-cols-3">
          {pricing.plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 110} className="h-full">
              <div
                className={`card relative flex h-full flex-col p-8 ${
                  plan.recommended ? 'border-flow/45' : ''
                }`}
              >
                {plan.recommended && (
                  <span className="absolute right-6 top-6 rounded-full border border-flow/30 bg-flow/10 px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-flow">
                    {pricing.recommended}
                  </span>
                )}

                <span className="text-eyebrow font-medium uppercase text-muted">{plan.name}</span>

                <div className="mt-7 flex items-end gap-1">
                  {plan.currency && (
                    <span className="mb-2 text-[1.25rem] text-muted">{plan.currency}</span>
                  )}
                  <span
                    className={`font-medium leading-[0.95] tracking-[-0.03em] text-fg ${
                      plan.currency ? 'text-[3.5rem]' : 'text-[2.25rem]'
                    }`}
                  >
                    {plan.price}
                  </span>
                </div>

                <ul className="mt-9 flex-1 space-y-3.5 border-t border-line/10 pt-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.875rem] text-muted">
                      <svg
                        viewBox="0 0 20 20"
                        className="mt-[0.2rem] h-3.5 w-3.5 shrink-0 text-flow"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={localeHref(locale, plan.cta.href)}
                  className={`mt-9 w-full ${plan.recommended ? 'pill-flow' : 'pill-ghost'}`}
                >
                  {plan.cta.label}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
