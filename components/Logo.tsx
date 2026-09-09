import { brand } from '@/lib/site'

/**
 * 汇聚型标识：三个节点收敛到中心并向上出箭头（多模型 → 一个 API）。
 * 纯 SVG，随 currentColor 走深浅色主题。
 */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      {/* 三条汇聚支线 */}
      <path
        d="M8.6 19.2 16 15.4l7.4 3.8M16 15.4v9.2"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 中轴与箭头 */}
      <path d="M16 15.2V6.4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M16 2.4 21.4 9.4H10.6L16 2.4Z" fill="currentColor" />
      {/* 三个节点 */}
      <circle cx="5.4" cy="20.6" r="3.1" stroke="currentColor" strokeWidth="2.1" />
      <circle cx="26.6" cy="20.6" r="3.1" stroke="currentColor" strokeWidth="2.1" />
      <circle cx="16" cy="27.4" r="3.1" stroke="currentColor" strokeWidth="2.1" />
    </svg>
  )
}

export function LogoLockup({
  className = '',
  markClass = 'w-8 h-8',
  textClass = 'text-[1.05rem] tracking-[0.02em]',
}: {
  className?: string
  markClass?: string
  textClass?: string
}) {
  return (
    <span className={`flex items-center gap-2 md:gap-3 select-none ${className}`}>
      <LogoMark className={markClass} />
      <span className={`font-dinBold font-bold ${textClass}`}>{brand.name}</span>
    </span>
  )
}
