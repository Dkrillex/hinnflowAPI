import type { Metadata, Viewport } from 'next'
import './globals.css'
import { brand } from '@/lib/site'

export const metadata: Metadata = {
  title: `${brand.name} - Enterprise AI Interface Service`,
  description: 'Enterprise AI Interface Service',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

/**
 * 首屏前写入 dark class，避免主题闪烁。
 * 注意 <html> 上不能预置 className="dark"：那样偏好浅色的访客会先闪一帧深色，
 * 直到 Navbar 的 useEffect 把它摘掉。类名一律交给这段脚本在绘制前决定。
 */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t?t==='dark':true){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
