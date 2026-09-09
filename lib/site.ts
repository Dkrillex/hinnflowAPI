/**
 * 站点文案与品牌集中在这里。
 * 版式、间距、动效 1:1 对齐参考站；品牌名/邮箱/文案改这一个文件即可。
 */

export const brand = {
  name: 'hinnflowAI',
  // 标识里 "AI" 走衬线斜体，所以名字拆成两段
  nameMain: 'hinnflow',
  nameAccent: 'AI',
  tagline: 'Next Gen AI Interface Platform',
  email: 'business@hinnflow.com',
  year: 2026,
}

export const nav = {
  links: [
    { label: 'Home', href: '/' },
    { label: 'Console', href: '/console' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Docs', href: '/docs' },
  ],
  login: { label: 'Login', href: '/login' },
  signup: { label: 'Sign Up', href: '/register' },
}

export const hero = {
  badge: 'GPT-5 Integrated!',
  title: 'One-stop AI Model Interface Service',
  subtitle: 'Official API, Stable & Reliable, Ready to Use',
  stats: [
    { value: 200, suffix: '+', label: 'Models Supported', decimals: 0 },
    { value: 10, suffix: 'ms', label: 'Latency', decimals: 0 },
    { value: 98.5, suffix: '%', label: 'Service Uptime', decimals: 1 },
  ],
  cta: { label: 'Get Started', href: '/register' },
}

export const models = {
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
}

export const features = {
  eyebrow: `Why Choose ${brand.name}`,
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
}

export const pricing = {
  eyebrow: 'Pricing Plans',
  headingLead: 'Transparent, Pay-as-you-go,',
  headingAccent: 'Best Value',
  plans: [
    {
      name: 'Pay As You Go',
      currency: '¥',
      price: '0.12',
      recommended: true,
      icon: 'calc',
      features: [
        '100+ AI Models',
        'Official Discount',
        'No Minimum Spend',
        'Usage Analytics',
        '24/7 Support',
      ],
      cta: { label: 'Get Started', href: '/register' },
      ctaClass: 'bg-[#1354EE] hover:bg-[#0F42C0]',
    },
    {
      name: 'New User Trial',
      currency: '¥',
      price: '3',
      recommended: false,
      icon: 'gift',
      features: ['10¥ Credit on Signup', 'All Models Supported', 'Full Features', 'No Time Limit'],
      cta: { label: 'Try Free', href: '/register' },
      ctaClass: 'bg-[#5A41E9] hover:bg-[#4a34cf]',
    },
    {
      name: 'Enterprise',
      currency: '',
      price: 'Contact Us',
      recommended: false,
      icon: 'tie',
      features: ['Exclusive API Key', 'SLA Guarantee', 'Private Deployment', 'Account Manager'],
      cta: { label: 'Contact Sales', href: `mailto:${brand.email}` },
      ctaClass: 'bg-[#05D1EF] hover:bg-[#04b6d0]',
    },
  ],
}

export const footer = {
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
}
