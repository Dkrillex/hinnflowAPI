/** 全大写小标签：11px + 0.32em 字距 + 强调色，希流两站通用的分区标记 */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`eyebrow ${className}`}>{children}</div>
}

/**
 * 区块主标题。强调词走衬线斜体（对应 www 首屏那个斜体 Token），
 * 其余保持系统无衬线，字重 500、字距 -0.02em。
 */
export function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2
      className={`text-[2rem] md:text-[3.25rem] font-medium leading-[1.12] tracking-[-0.02em] text-fg ${className}`}
    >
      {children}
    </h2>
  )
}

/** 衬线强调片段。英文走斜体，中文由 :lang(zh) 改为不倾斜的宋体 */
export function Em({ children }: { children: React.ReactNode }) {
  return <span className="serif-em">{children}</span>
}
