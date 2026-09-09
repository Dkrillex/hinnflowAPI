export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`py-[1.25rem] border-b border-t border-solid border-hairline-light dark:border-slate-800 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-brand" />
        <span className="text-ink dark:text-white text-[20px] font-dinBold">{children}</span>
      </div>
    </div>
  )
}
