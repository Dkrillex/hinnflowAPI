# hinnflowAI 主题与样式规范

产品的视觉基线来自希流现有的两个站点（`www.hinnflow.com` 深色、`canvas.hinnflow.com` 浅色），
主色替换为科技蓝。本文是唯一的样式事实来源，改动前后请对照这里。

落地位置：令牌定义在 [`app/globals.css`](app/globals.css)，暴露给 Tailwind 在
[`tailwind.config.ts`](tailwind.config.ts)。

---

## 1. 色彩

### 1.1 科技蓝主色阶

主色 `flow-500 #1668FF`。整条色阶在 `tailwind.config.ts` 的 `colors.flow`。

| 令牌 | 色值 | 用途 |
| --- | --- | --- |
| `flow-50` | `#EBF3FF` | 浅色主题的极淡底 |
| `flow-100` | `#D6E6FF` | 淡底、选中态 |
| `flow-200` | `#ADCCFF` | 深色主题的强调文字（备选） |
| `flow-300` | `#7FB2FF` | 图标、描边 |
| `flow-400` | `#4A8CFF` | 悬停态描边 |
| **`flow-500`** | **`#1668FF`** | **主色**：实心按钮、指标数字、图标砖 |
| `flow-600` | `#0B4ED9` | 主按钮悬停态 |
| `flow-700` | `#0838A6` | 浅色主题的强调文字 |
| `flow-800` | `#062873` | 渐变暗端 |
| `flow-900` | `#041A4D` | 备用 |

别名：`flow`（= 500）、`flow-soft`（= 300）、`flow-deep`（= 600）。

### 1.2 语义色（随主题切换）

以 RGB 三元组存 CSS 变量，让 Tailwind 的 `<alpha-value>` 能生效，因此
`bg-surface/70`、`border-line/12` 这类写法可用。

| 变量 | 浅色 | 深色 | Tailwind 类 |
| --- | --- | --- | --- |
| `--bg` | `242 245 250` | `11 15 24` | `bg-bg` |
| `--surface` | `255 255 255` | `15 19 30` | `bg-surface` |
| `--fg` | `12 13 16` | `255 255 255` | `text-fg` |
| `--muted` | `90 96 108` | `178 182 191` | `text-muted` |
| `--line` | `12 13 16` | `255 255 255` | `border-line/12` |
| `--accent-text` | `8 56 166` | `147 190 255` | `text-accent` |

深浅两套是互为反相的关系：深色对应 `www.hinnflow.com`，浅色对应 `canvas.hinnflow.com`。

### 1.3 为什么强调文字不用主色

`--accent-text` 是独立于 `flow-500` 的一档，专门给浮在洋流之上的小字（分区标签）用。
实测数据：

| 场景 | 色值 | 对比度 | 判定 |
| --- | --- | --- | --- |
| 主色压深色洋流最亮处 | `#1668FF` on `#3F4451` | 2.4:1 | 不可用 |
| `flow-300` 压同一背景 | `#7FB2FF` on `#3F4451` | 4.49:1 | 差一点 |
| **`--accent-text` 压同一背景** | **`#93BEFF` on `#3F4451`** | **5.12:1** | 可用 |
| 主色压浅色底 | `#1668FF` on `#F2F5FA` | 3.7:1 | 不可用 |
| **`--accent-text` 压浅色底** | **`#0838A6` on `#F2F5FA`** | **8.7:1** | 可用 |

**约定**：主色 `flow-500` 只用在不透明表面上（卡片内的指标、图标砖、实心按钮）；
任何直接浮在洋流背景上的小字一律用 `text-accent`。

---

## 2. 排版

正文不加载 webfont，用系统栈；唯一的 webfont 是强调词的衬线斜体。

```css
--font-sans:  "Helvetica Neue", Helvetica, Arial, "PingFang SC",
              "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-serif: "Instrument Serif", Georgia, serif;   /* next/font 自托管 */
```

| 用途 | 类 | 规格 |
| --- | --- | --- |
| 首屏主标题 | — | `2.75rem` → `4.5rem`，字重 500，字距 `-0.02em`，行高 1.06 |
| 区块标题 | `SectionTitle` | `2rem` → `3.25rem`，字重 500，字距 `-0.02em`，行高 1.12 |
| 分区小标签 | `.eyebrow` | `0.6875rem`，字距 `0.32em`，全大写，`text-accent` |
| 正文 | — | `0.875rem`，行高 1.7，`text-muted` |
| 强调词 | `<Em>` | 衬线斜体，字重 400 |

`text-display` 与 `text-eyebrow` 两个 `fontSize` 预设已带好行高与字距，直接用即可。

---

## 3. 形状与组件

两个参考站的卡片都**不用投影**，层次靠发丝描边和背景透明度拉开。

| 组件类 | 规格 |
| --- | --- |
| `.pill` | 999px 圆角，`0.9375rem` 字号，横向内边距 `2.125rem`，悬停上移 1px |
| `.pill-solid` | 反色实心（深色下白底黑字），主行动号召 |
| `.pill-ghost` | 描边透明底，次级行动号召 |
| `.pill-flow` | 主色实心，悬停 `flow-600` |
| `.card` | `1.25rem` 圆角，`border-line/12` 发丝描边，`bg-surface/70` + 背景模糊 |
| 图标砖 | `0.75rem` 圆角，`border-flow/25`，`bg-flow/10`，图标 `text-flow` |

按钮成对出现（主 + 次），这是两个参考站一致的模式。

---

## 4. 流动背景

组件：[`components/FlowBackdrop.tsx`](components/FlowBackdrop.tsx)，与 `canvas.hinnflow.com` 同实现。

`@paper-design/shaders-react` 的 `MeshGradient` 叠两层错速漂移：

| 层 | distortion | speed | 其他 |
| --- | --- | --- | --- |
| a | 1.6 | 0.3 | — |
| b | 1.8 | 0.2 | `opacity: .5` |

配色沿用希流的明暗构成，整体往科技蓝偏一档，**亮度刻意保持不变**——薄纱那套对比度
数值是按原亮度实测的，改亮度就要重算。

三层保护：WebGL 不可用 → 退回等构图的静态径向渐变；`prefers-reduced-motion` → speed 归零
（画面保留、不再动）；`maxPixelCount: 1440000` 封顶，避免高分屏按物理像素铺满。

### 薄纱 `.flow-scrim`

洋流最亮处约 `#AAB0BA`，白字直接压上去只有 2.2:1，所以必须有一层薄纱。它**不是固定层**，
而是随内容滚动的整页纵向渐变：

| 位置 | 深色不透明度 | 浅色不透明度 | 理由 |
| --- | --- | --- | --- |
| 0 – 70vh（首屏） | 0.58 | 0.70 | 那里只有大字标题，洋流看得最清 |
| 115vh 以下（正文区） | 0.66 | 0.82 | 正文灰要达到 4.5:1 |

实测最坏背景 `#3F4451` 下：正文灰 **4.79:1**、白色标题 **9.74:1**，均过 4.5:1。

由此派生两条约定：

- **首屏内**的小字用 `text-fg/80`、导航用 `text-fg/75`，不用 `text-muted`——薄纱在那里较薄
- 分区标签用 `text-accent`，不用 `text-flow`（见 1.3）

> 改动薄纱不透明度或洋流配色后，必须重跑对比度校验再合并。校验方法：隐藏
> `nav, main, footer`，只截背景层，扫全页找最亮像素，再算它与 `--muted` / `--fg` 的对比度。

---

## 5. 动效

| 名称 | 规格 | 用途 |
| --- | --- | --- |
| 缓动 `ease-flow` | `cubic-bezier(0.16, 1, 0.3, 1)` | 全局统一缓动 |
| 滚动入场 | 位移 24px + 淡入，700ms | `<Reveal>` |
| 数字滚动 | easeOutExpo，1800ms | `<CountUp>` |
| 按钮悬停 | 上移 1px，200ms | `.pill` |
| 卡片悬停 | 描边转 `flow/45`，300ms | `.card` |

全局 `prefers-reduced-motion` 媒体查询把动画与过渡压到 0.001ms。

---

## 6. 间距与栅格

- 容器：`max-w-7xl`（80rem）+ `px-6 lg:px-10`
- 区块纵向留白：`py-24 md:py-32`
- 卡片网格：`gap-5`，`md:grid-cols-2 lg:grid-cols-3`
- 导航高度：`66px`，固定吸顶，滚动超过 8px 后加发丝下边框与背景模糊

---

## 7. 改主题色的步骤

1. 改 `tailwind.config.ts` 里 `colors.flow` 整条色阶
2. 改 `app/globals.css` 里两套 `--accent-text`，并按 1.3 的方法实测对比度
3. 改 `.flow-banner` 渐变与 `::selection`
4. 如需调洋流色调，改 `FlowBackdrop.tsx` 的四组数组，**保持亮度不变**
5. 重跑对比度校验
