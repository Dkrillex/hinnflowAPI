# XiFlow API — 首页

参照 `apipro.ai` 首页版式 1:1 复刻的落地页。技术栈与参考站一致：**Next.js 14 App Router + React 18 + Tailwind CSS**（参考站的控制台 `api.apipro.ai` 则是 React + Rsbuild，首页用 iframe 内嵌官网）。

## 开发

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 全静态预渲染
```

## 目录

| 路径 | 说明 |
| --- | --- |
| `lib/site.ts` | 品牌名、邮箱、全部文案。改站点信息只需要动这一个文件 |
| `components/motion.tsx` | 滚动入场、标题逐字动画、数字滚动三个动效原语 |
| `components/Hero.tsx` | 首屏：徽标胶囊、双行标题、三项指标、CTA、右侧线框星球 |
| `components/ModelsSection.tsx` | 支持模型：左侧三条说明（悬停切换高亮）+ 右侧模型矩阵面板 |
| `components/FeaturesSection.tsx` | 六宫格优势卡，悬停整卡变 `#1354EE` 并展开要点 |
| `components/PricingSection.tsx` | 三档价格卡，底部通栏 CTA 条 |
| `components/SiteFooter.tsx` | 渐变通栏 + 链接区 + 96px 大字标语 |

## 设计参数

从参考站实测提取，集中在 `tailwind.config.ts` 与 `app/globals.css`：

- 底色 `#0F172A`(slate-900)，卡片 `#121A2D`，描边 `rgba(255,255,255,.1)` / 浅色 `#E6ECF6`
- 主色 `#1354EE`（CTA）、`#2563EB`（徽章）、`#60A5FA`（副标题）
- 容器 `max-w-7xl` + `px-4 sm:px-6 lg:px-8`，导航栏高 `46px` 固定吸顶
- 标题字族：macOS 自带 `DIN Alternate`，回退 `Barlow` / system-ui
- 入场缓动 `cubic-bezier(.16,1,.3,1)` / 700ms，标题逐字间隔 30ms

## 与参考站的取舍

版式、间距、配色、动效按实测 1:1 对齐；以下几处是自绘替代，没有引用对方素材：

- Logo 用内联 SVG 重绘（汇聚节点 + 向上箭头）
- 首屏 `banner-bg.webp`、页脚 `footer_bg.webp` 用等效多层渐变还原
- 模型面板里的厂商标识改为中性几何字形

品牌名、邮箱默认是 `XIFLOW` / `support@xiflow.ai`，在 `lib/site.ts` 顶部的 `brand` 里改。
