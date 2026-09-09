import type { Config } from 'tailwindcss'

/**
 * 希流 Hinnflow 设计令牌。
 * 取值实测自 www.hinnflow.com 与 canvas.hinnflow.com：
 *   强调色 #05AFFE / #7DD3FC / #0544E9，药丸 999px，卡片 20px，
 *   eyebrow 11px + 0.32em 字距，主标题 96px / 500 字重 / -0.02em。
 * 语义色走 CSS 变量（见 globals.css），深浅两套主题共用同一批类名。
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        // 科技蓝主色阶。500 为主色，300 用于压在暗底上的小字，700 用于浅色主题的小字
        flow: {
          50: '#EBF3FF',
          100: '#D6E6FF',
          200: '#ADCCFF',
          300: '#7FB2FF',
          400: '#4A8CFF',
          DEFAULT: '#1668FF',
          500: '#1668FF',
          600: '#0B4ED9',
          700: '#0838A6',
          800: '#062873',
          900: '#041A4D',
          soft: '#7FB2FF',
          deep: '#0B4ED9',
        },
        // 浮在洋流上的小字标签专用色（深浅两套各取一档，保证 4.5:1）
        accent: 'rgb(var(--accent-text) / <alpha-value>)',
      },
      fontFamily: {
        // 两站都不加载正文 webfont，统一用系统栈
        sans: [
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        // 唯一的 webfont：强调词的衬线斜体。汉字回落宋体，与 www.hinnflow.com 一致
        serif: ['var(--font-serif)', 'Songti SC', 'STSong', 'Noto Serif SC', 'Georgia', 'serif'],
      },
      // 发丝描边用的中间档透明度，默认 opacity 表里没有
      opacity: {
        12: '0.12',
        15: '0.15',
        35: '0.35',
        45: '0.45',
        55: '0.55',
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.32em' }],
        display: ['6rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        card: '1.25rem',
        tile: '0.75rem',
      },
      keyframes: {
        drift: {
          '0%': { strokeDashoffset: '1200' },
          '100%': { strokeDashoffset: '0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.85' },
        },
        rise: {
          from: { opacity: '0', transform: 'translate3d(0,1.5rem,0)' },
          to: { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
      },
      animation: {
        drift: 'drift 14s linear infinite',
        'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
        rise: 'rise 0.7s cubic-bezier(0.16,1,0.3,1) both',
      },
      transitionTimingFunction: {
        flow: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
