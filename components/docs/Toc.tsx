'use client'

import { useEffect, useState } from 'react'

/**
 * 本页目录。滚动时高亮当前所在章节：取视口上部 30% 以内最后一个越过的标题。
 * 窄屏折叠成页首的 <details>。
 */
export function Toc({ title, items }: { title: string; items: { id: string; title: string }[] }) {
  const [current, setCurrent] = useState(items[0]?.id)

  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight * 0.3
      let id = items[0]?.id
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (el && el.getBoundingClientRect().top <= line) id = it.id
      }
      setCurrent(id)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  const links = (
    <ul className="space-y-0.5">
      {items.map((it) => {
        const on = it.id === current
        return (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={on ? 'location' : undefined}
              className={`block rounded-full px-4 py-1.5 text-[0.875rem] transition-colors ${
                on ? 'bg-line/[0.07] font-medium text-fg' : 'text-muted hover:text-fg'
              }`}
            >
              {it.title}
            </a>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <nav aria-label={title} className="hidden lg:block">
        <div className="mb-3 px-4 text-[0.75rem] font-medium text-muted">{title}</div>
        {links}
      </nav>
      <details className="card px-2 py-1 lg:hidden">
        <summary className="cursor-pointer px-2 py-2.5 text-[0.875rem] font-medium text-fg">{title}</summary>
        <nav aria-label={title} className="pb-2">
          {links}
        </nav>
      </details>
    </>
  )
}
