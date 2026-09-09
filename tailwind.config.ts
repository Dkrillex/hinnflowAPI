import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  // lib/site.ts 里带有按钮底色等类名，必须一并扫描，否则 JIT 不会生成对应样式
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 取自原站：CTA / 强调蓝
        brand: '#1354EE',
        'brand-dark': '#0F42C0',
        ink: '#101828',
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        hairline: {
          light: '#EBF0F7',
          card: '#E6ECF6',
          plan: '#E1E3E6',
        },
      },
      fontFamily: {
        // macOS 自带 DIN Alternate，与原站 DIN Custom 观感一致；其余为跨平台回退
        din: ['"DIN Alternate"', '"DIN Condensed"', 'Barlow', 'system-ui', 'sans-serif'],
        dinBold: ['"DIN Alternate"', '"DIN Condensed"', 'Barlow', 'system-ui', 'sans-serif'],
        sans: ['"Söhne Buch"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
