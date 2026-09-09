# hinnflowAI — 首页

AI 网关落地页。**Next.js 14 App Router + React 18 + Tailwind CSS**，全静态预渲染。

版式骨架源自 `apipro.ai`，视觉主题统一到希流 Hinnflow（`www.hinnflow.com` 与 `canvas.hinnflow.com`）。

## 开发

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

> 注意：不要在 `next dev` 运行时执行 `npm run build`，两者共用 `.next/`，会把开发服务器的 chunk 清单覆盖掉。

## 目录

| 路径 | 说明 |
| --- | --- |
| `lib/site.ts` | 品牌名、邮箱、全部文案。改站点信息只需要动这一个文件 |
| `components/FlowBackdrop.tsx` | 流动背景：双层 WebGL MeshGradient + 静态兜底 |
| `components/motion.tsx` | 滚动入场与数字滚动动效原语 |
| `components/SectionHeading.tsx` | `Eyebrow` 小标签、`SectionTitle` 主标题、`Em` 衬线斜体强调 |
| `components/Hero.tsx` | 首屏 |
| `components/ModelsSection.tsx` | 支持模型：左侧说明悬停切换 + 右侧模型矩阵 |
| `components/FeaturesSection.tsx` | 六宫格优势卡（图标砖 + 编号 + 要点 + 指标） |
| `components/PricingSection.tsx` | 三档价格卡 |
| `components/SiteFooter.tsx` | 渐变通栏 + 链接区 + 大字标语 |

## 主题：希流设计语言

两个参考站的共同点（实测提取），也是本项目的主题基线：

- **强调色** `#05AFFE`，辅以 `#7DD3FC` 与 `#0544E9`
- **药丸按钮** 999px 圆角，主实心反色 + 次描边透明底成对出现
- **卡片** 20px 圆角、1px 发丝描边、不用投影
- **小标签** 11px + `0.32em` 字距 + 全大写
- **主标题** 500 字重、`-0.02em` 字距、1.08 行高
- **系统字栈**（Helvetica Neue / PingFang SC），唯一 webfont 是强调词用的 `Instrument Serif` 斜体
- **无彩色骨架 + 单一强调色**：深色对应 `www`，浅色对应 `canvas`，互为反相

### 流动背景

`components/FlowBackdrop.tsx` 与 `canvas.hinnflow.com` 同实现：`@paper-design/shaders-react`
的 `MeshGradient` 叠两层（a 层 distortion 1.6 / speed 0.3，b 层 distortion 1.8 / speed 0.2 且
半透明），两层错速产生洋流般的缓慢推移。配色数组沿用希流现有的深浅两套。

三层保护：WebGL 不可用时退回等构图的静态径向渐变；`prefers-reduced-motion` 时把 speed 归零
（画面保留、不再动）；`maxPixelCount` 封顶避免高分屏按物理像素铺满。

### 薄纱与对比度

洋流最亮处约 `#AAB0BA`，白字压上去只有 2.2:1，所以 `.flow-scrim` 是一层随内容滚动的纵向渐变：
首屏 0.58（那里只有大字标题，洋流看得最清），往下加厚到 0.66（正文区）。实测最坏背景 `#44464C` 下
正文灰 4.64:1、白色标题 9.43:1，均过 4.5:1。

由此派生两条约定：

- 首屏内的小字用 `text-fg/80`、导航用 `text-fg/75`，不用 `text-muted`——薄纱在那里较薄
- 分区小标签用 `--accent-text`（深色 `#7DD3FC` / 浅色 `#0369A1`）而非品牌青，
  品牌青 `#05AFFE` 只用在卡片等不透明表面上

改动薄纱或洋流配色后，重跑对比度校验再合并。

## 与参考站的取舍

Logo 取自希流现有站点（`public/logo.svg`，内联为组件以跟随主题反色）。模型面板里的厂商标识
是中性几何字形，没有复制各家商标。
