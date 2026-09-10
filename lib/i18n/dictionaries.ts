/**
 * 中英文词条。两份字典结构必须完全一致——en 是类型基准，
 * zh 用 `Dict` 约束，漏翻或多写字段编译期就会报错。
 */

export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  zh: '中文',
}

const en = {
  meta: {
    title: 'hinnflowAI - Enterprise AI Interface Service',
    description: 'Enterprise AI Interface Service',
  },
  nav: {
    links: [
      { label: 'Home', href: '/' },
      { label: 'Console', href: '/console' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Docs', href: '/docs' },
    ],
    login: { label: 'Login', href: '/login' },
    signup: { label: 'Sign Up', href: '/register' },
  },
  hero: {
    badge: 'GPT-5 Integrated!',
    title: 'One-stop AI Model Interface Service',
    subtitle: 'Official API, Stable & Reliable, Ready to Use',
    stats: [
      { value: 200, suffix: '+', label: 'Models Supported', decimals: 0 },
      { value: 10, suffix: 'ms', label: 'Latency', decimals: 0 },
      { value: 98.5, suffix: '%', label: 'Service Uptime', decimals: 1 },
    ],
    primary: { label: 'Get Started', href: '/register' },
    secondary: { label: 'Docs', href: '/docs' },
  },
  models: {
    eyebrow: 'Supported Models',
    headingLead: 'Covering ',
    headingAccent: 'Global Mainstream AI Models',
    headingTail: 'Meeting Diverse Needs',
    items: [
      {
        title: 'Global Models',
        desc: 'Leading AI models including GPT-4, Claude 3.5, Gemini 1.5 Pro, and more.',
      },
      {
        title: 'Local Models',
        desc: 'Optimized local models like Tongyi Qianwen, Ernie Bot, ChatGLM.',
      },
      {
        title: 'Multimodal',
        desc: 'Supports image generation, speech synthesis, video analysis, and more.',
      },
    ],
    columns: [
      { vendor: 'OpenAI', label: 'ChatGPT', tags: ['GPT-5', 'GPT-4.1', 'GPT-4o'] },
      { vendor: 'Claude', label: 'Claude', tags: ['Claude 4.1', 'Claude 4'] },
      { vendor: 'Gemini', label: 'Gemini', tags: ['Gemini Pro'] },
    ],
  },
  features: {
    // 品牌名单独拆出：eyebrow 整体走全大写，直接拼进去会变成 HINNFLOWAI
    eyebrowLead: 'Why Choose ',
    headingParts: [
      { text: 'Professional', accent: true },
      { text: '、', accent: false },
      { text: 'Stable', accent: true },
      { text: '、', accent: false },
      { text: 'Efficient', accent: true },
      { text: ' AI Service', accent: false },
    ],
    cards: [
      {
        title: 'High Performance',
        bullets: ['End-to-end optimization', 'Faster tokens/sec', 'Reduced TTFT'],
        desc: 'End-to-end optimization on hardware and software. Faster tokens per second and reduced TTFT.',
        metricLabel: 'Response',
        metricValue: '< 200ms',
        icon: 'gauge',
      },
      {
        title: 'Global Coverage',
        bullets: ['CDN Acceleration', 'Smart Routing', 'Automatic Failover'],
        desc: 'CDN acceleration, smart routing, and automatic failover ensure global access speed and stability.',
        metricLabel: 'Accelerated Countries',
        metricValue: '>100',
        icon: 'globe',
      },
      {
        title: 'User Friendly',
        bullets: ['Unified API', 'Easy Integration', 'Zero Maintenance'],
        desc: 'Easy to use unified API to run leading models and scale without infrastructure burden.',
        metricLabel: 'Migration',
        metricValue: '< 5 min',
        icon: 'plug',
      },
      {
        title: 'Transparent Pricing',
        bullets: ['Pay as you go', 'No hidden fees', 'Volume discounts'],
        desc: 'Optimized efficiency allows us to pass savings to you. Cost effective at scale.',
        metricLabel: 'Save',
        metricValue: '30%+',
        icon: 'ticket',
      },
      {
        title: 'Auto Scaling',
        bullets: ['Massive concurrency', 'Rapid expansion', 'High throughput'],
        desc: 'Infrastructure built for rapid expansion, designed to support massive concurrent requests.',
        metricLabel: 'Concurrency 100K+',
        metricValue: '100K+',
        icon: 'expand',
      },
      {
        title: 'High Availability',
        bullets: ['99.9% Uptime', 'Health monitoring', 'Auto-healing'],
        desc: 'Stable system providing 99.9% uptime with comprehensive health monitoring and auto-healing.',
        metricLabel: 'Uptime',
        metricValue: '99.9%',
        icon: 'shield',
      },
    ],
  },
  pricing: {
    eyebrow: 'Pricing Plans',
    headingLead: 'Transparent, Pay-as-you-go,',
    headingAccent: 'Best Value',
    recommended: 'Recommended',
    plans: [
      {
        name: 'Pay As You Go',
        currency: '¥',
        price: '0.12',
        recommended: true,
        features: [
          '100+ AI Models',
          'Official Discount',
          'No Minimum Spend',
          'Usage Analytics',
          '24/7 Support',
        ],
        cta: { label: 'Get Started', href: '/register' },
      },
      {
        name: 'New User Trial',
        currency: '¥',
        price: '3',
        recommended: false,
        features: ['10¥ Credit on Signup', 'All Models Supported', 'Full Features', 'No Time Limit'],
        cta: { label: 'Try Free', href: '/register' },
      },
      {
        name: 'Enterprise',
        currency: '',
        price: 'Contact Us',
        recommended: false,
        features: ['Exclusive API Key', 'SLA Guarantee', 'Private Deployment', 'Account Manager'],
        cta: { label: 'Contact Sales', href: 'mailto:business@hinnflow.com' },
      },
    ],
  },
  footer: {
    tagline: 'Next Gen AI Interface Platform',
    banner: [
      { title: 'Secure & Reliable', desc: 'Encrypted transmission, enterprise standards' },
      { title: 'Transparent Billing', desc: 'Real-time usage stats, clear records' },
      { title: 'No Hidden Fees', desc: 'Clear pricing, no extra charges' },
    ],
    columns: [
      {
        title: 'Services',
        links: [
          { label: 'Register', href: '/register' },
          { label: 'Buy Credits', href: '/topup' },
          { label: 'Pricing', href: '/pricing' },
        ],
      },
      {
        title: 'Documentation',
        links: [
          { label: 'Tutorials', href: '/docs' },
          { label: 'Status', href: '/status' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ],
      },
    ],
    bigLead: 'One API For All AI ',
    bigAccent: 'Models',
    rights: 'All rights reserved',
  },
  a11y: {
    toggleTheme: 'Toggle theme',
    toggleLang: 'Switch language',
    menu: 'Menu',
  },
}

export type Dict = typeof en

const zh: Dict = {
  meta: {
    title: 'hinnflowAI - 企业级 AI 接口服务',
    description: '企业级 AI 接口服务',
  },
  nav: {
    links: [
      { label: '首页', href: '/' },
      { label: '控制台', href: '/console' },
      { label: '模型广场', href: '/marketplace' },
      { label: '文档', href: '/docs' },
    ],
    login: { label: '登录', href: '/login' },
    signup: { label: '注册', href: '/register' },
  },
  hero: {
    badge: '已接入 GPT-5！',
    title: '一站式 AI 大模型接口服务',
    subtitle: '官方直连，稳定可靠，开箱即用',
    stats: [
      { value: 200, suffix: '+', label: '接入模型', decimals: 0 },
      { value: 10, suffix: 'ms', label: '网关延迟', decimals: 0 },
      { value: 98.5, suffix: '%', label: '服务可用性', decimals: 1 },
    ],
    primary: { label: '立即开始', href: '/register' },
    secondary: { label: '查看文档', href: '/docs' },
  },
  models: {
    eyebrow: '支持模型',
    headingLead: '覆盖 ',
    headingAccent: '全球主流大模型',
    headingTail: '满足多样化需求',
    items: [
      {
        title: '海外模型',
        desc: 'GPT-4、Claude 3.5、Gemini 1.5 Pro 等一线模型官方直连，版本跟随上游同步。',
      },
      {
        title: '国内模型',
        desc: '通义千问、文心一言、智谱 GLM 等国内模型就近接入，低延迟、可合规。',
      },
      {
        title: '多模态',
        desc: '图像生成、语音合成、视频理解与向量化，同一把密钥全部覆盖。',
      },
    ],
    columns: [
      { vendor: 'OpenAI', label: 'ChatGPT', tags: ['GPT-5', 'GPT-4.1', 'GPT-4o'] },
      { vendor: 'Claude', label: 'Claude', tags: ['Claude 4.1', 'Claude 4'] },
      { vendor: 'Gemini', label: 'Gemini', tags: ['Gemini Pro'] },
    ],
  },
  features: {
    eyebrowLead: '为什么选择 ',
    headingParts: [
      { text: '专业', accent: true },
      { text: '、', accent: false },
      { text: '稳定', accent: true },
      { text: '、', accent: false },
      { text: '高效', accent: true },
      { text: '的 AI 服务', accent: false },
    ],
    cards: [
      {
        title: '高性能',
        bullets: ['端到端链路优化', '更快的 tokens/sec', '更低的 TTFT'],
        desc: '软硬件端到端优化，更高的每秒 Token 吞吐与更低的首字延迟。',
        metricLabel: '响应',
        metricValue: '< 200ms',
        icon: 'gauge',
      },
      {
        title: '全球覆盖',
        bullets: ['CDN 加速', '智能路由', '自动故障转移'],
        desc: 'CDN 加速、智能路由与自动故障转移，保障全球访问速度与稳定性。',
        metricLabel: '加速国家',
        metricValue: '>100',
        icon: 'globe',
      },
      {
        title: '易于集成',
        bullets: ['统一 API', '零改造迁移', '免运维'],
        desc: '完全兼容 OpenAI 协议，改一行 base_url 即可迁移，无需运维负担。',
        metricLabel: '迁移',
        metricValue: '< 5 分钟',
        icon: 'plug',
      },
      {
        title: '透明计费',
        bullets: ['按量计费', '无隐藏费用', '阶梯折扣'],
        desc: '按量计费、无隐藏费用，用量与成本实时可查，规模越大越划算。',
        metricLabel: '节省',
        metricValue: '30%+',
        icon: 'ticket',
      },
      {
        title: '弹性扩容',
        bullets: ['海量并发', '秒级扩容', '高吞吐'],
        desc: '为高并发场景而建的基础设施，流量突增时自动扩容不排队。',
        metricLabel: '并发',
        metricValue: '100K+',
        icon: 'expand',
      },
      {
        title: '高可用',
        bullets: ['99.9% 可用性', '健康监测', '自动自愈'],
        desc: '99.9% 可用性，全链路健康监测与自动摘除，异常节点自愈。',
        metricLabel: '可用性',
        metricValue: '99.9%',
        icon: 'shield',
      },
    ],
  },
  pricing: {
    eyebrow: '价格方案',
    headingLead: '透明、按量计费，',
    headingAccent: '高性价比',
    recommended: '推荐',
    plans: [
      {
        name: '按量付费',
        currency: '¥',
        price: '0.12',
        recommended: true,
        features: ['100+ 模型全量开放', '官方渠道折扣价', '无最低消费门槛', '用量分析看板', '7×24 技术支持'],
        cta: { label: '立即开始', href: '/register' },
      },
      {
        name: '新用户试用',
        currency: '¥',
        price: '3',
        recommended: false,
        features: ['注册赠 10 元额度', '全部模型可用', '功能不设限', '额度不过期'],
        cta: { label: '免费试用', href: '/register' },
      },
      {
        name: '企业方案',
        currency: '',
        price: '联系我们',
        recommended: false,
        features: ['专属 API 密钥', 'SLA 可用性保障', '支持私有化部署', '专属客户经理'],
        cta: { label: '联系商务', href: 'mailto:business@hinnflow.com' },
      },
    ],
  },
  footer: {
    tagline: '新一代 AI 接口平台',
    banner: [
      { title: '加密传输', desc: '全链路 TLS，企业级安全标准' },
      { title: '账单透明', desc: '实时用量统计，调用明细可查' },
      { title: '没有暗账', desc: '价格公开，不设隐藏费用' },
    ],
    columns: [
      {
        title: '产品',
        links: [
          { label: '注册账号', href: '/register' },
          { label: '充值额度', href: '/topup' },
          { label: '价格说明', href: '/pricing' },
        ],
      },
      {
        title: '开发者',
        links: [
          { label: '接入文档', href: '/docs' },
          { label: '服务状态', href: '/status' },
        ],
      },
      {
        title: '法律',
        links: [
          { label: '隐私政策', href: '/privacy' },
          { label: '服务条款', href: '/terms' },
        ],
      },
    ],
    bigLead: '一个 API 接入全部 ',
    bigAccent: '大模型',
    rights: '保留所有权利',
  },
  a11y: {
    toggleTheme: '切换主题',
    toggleLang: '切换语言',
    menu: '菜单',
  },
}

export const dictionaries: Record<Locale, Dict> = { en, zh }

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v)
}

export function getDict(locale: Locale): Dict {
  return dictionaries[locale]
}
