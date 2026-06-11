import type { Page, Post, Product, SiteSetting } from '@/payload-types'

type SeedPage = Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'heroImage'>
type SeedPost = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'cover'>
type SeedProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'cover' | 'gallery'>
type SeedSiteSetting = Omit<SiteSetting, 'id' | 'createdAt' | 'updatedAt' | 'logo'>
type RichTextValue = NonNullable<NonNullable<Page['blocks']>[number]['body']>

export const defaultSiteSettings: SeedSiteSetting = {
  siteName: 'GeekClaw',
  siteUrl: 'https://geekclaw.ai',
  primaryColor: '#0f766e',
  seoTitle: 'GeekClaw | 企业 AI、OPC 与 LiloAvatar 产品官网',
  seoDescription: 'GeekClaw 汇集企业智能体、OPC 平台、LiloAvatar 数字人和主机销售后台。',
  contactEmail: 'team@geekclaw.ai',
  navigation: [
    { label: '首页', href: '/' },
    { label: 'OPC', href: '/opc' },
    { label: 'LiloAvatar', href: '/liloavatar' },
    { label: '主机销售', href: '/shop' },
  ],
  payment: {
    provider: 'alipay' as const,
    notifyUrl: 'https://geekclaw.ai/api/pay/alipay/notify',
    returnUrl: 'https://geekclaw.ai/pay-success',
    appId: '',
    gateway: 'https://openapi.alipay.com/gateway.do',
    privateKey: '',
    publicKey: '',
  },
}

export const defaultPages: SeedPage[] = [
  {
    title: '首页',
    slug: 'home',
    status: 'published' as const,
    heroTitle: '企业 AI、开放能力平台与数字人内容系统',
    heroDescription:
      'GeekClaw 汇集企业智能体、OPC 平台、LiloAvatar 数字人和主机销售后台。',
  },
  {
    title: 'LiloAvatar',
    slug: 'bailongma',
    status: 'published' as const,
    heroTitle: 'LiloAvatar 数字人内容与陪伴体验系统',
    heroDescription: '面向品牌内容、客户服务、培训讲解和互动陪伴场景。',
    sections: [
      {
        blockType: 'hero',
        title: '让数字人拥有可持续运营的内容、记忆和交互能力',
        eyebrow: 'LiloAvatar',
        description: '围绕角色设定、知识库、内容脚本、互动记录和渠道发布搭建完整流程。',
        primaryLabel: '查看商城',
        primaryHref: '/shop',
        secondaryLabel: '联系团队',
        secondaryHref: 'mailto:team@geekclaw.ai',
      },
      {
        blockType: 'featureGrid',
        heading: '核心能力',
        description: '数字人不只是形象生成，还需要可维护的角色、资料和运营流程。',
        items: [
          { title: '角色与人格', body: '定义身份、语气、边界和知识范围。' },
          { title: '记忆与知识', body: '接入产品资料、品牌语料、FAQ 和服务流程。' },
          { title: '互动与发布', body: '承接咨询、讲解、培训、活动和内容分发。' },
        ],
      },
      {
        blockType: 'stats',
        heading: '运营目标',
        items: [
          { value: 'Brand', label: '品牌导览' },
          { value: 'Support', label: '客户服务' },
          { value: 'Training', label: '培训讲解' },
        ],
      },
      {
        blockType: 'cta',
        heading: '数字人运行环境和主机销售可在商城后台维护。',
        description: '主机、设备和部署服务可以作为商品维护，不在前台写死。',
        buttonLabel: '去商城',
        buttonHref: '/shop',
      },
    ],
    blocks: [
      { heading: '内容运营', body: richText('角色设定、知识资料和互动脚本可持续维护。') },
      { heading: '业务承接', body: richText('适合官网导览、客服咨询、培训讲解和活动互动。') },
      { heading: '商城连接', body: richText('主机、设备和部署服务可进入商城后台维护。') },
    ],
  },
]

export const defaultPosts: SeedPost[] = [
  {
    title: 'GeekClaw 内容站迁移到 Payload 的原因',
    slug: 'why-payload',
    category: '建站',
    excerpt: '默认示例文章，用于初始化博客结构。',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: '这是一篇默认示例文章。', version: 1 }],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    },
    status: 'published' as const,
  },
]

export const defaultProducts = [
  {
    name: 'GeekClaw 企业部署方案',
    slug: 'enterprise-deployment',
    sku: 'GC-ENT-001',
    summary: '适用于需要企业 AI 部署、OPC 接入和后台运营能力的团队。',
    price: 9999,
    currency: 'CNY',
    trackInventory: false,
    stockQuantity: 0,
    allowBackorder: true,
    limitPerOrder: 1,
    status: 'active' as const,
  },
] as Array<SeedProduct & { sku?: string; trackInventory?: boolean; stockQuantity?: number; allowBackorder?: boolean; limitPerOrder?: number }>

function richText(text: string): RichTextValue {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
