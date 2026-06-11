import type { Page, Post, Product, SiteSetting } from '@/payload-types'

type SeedPage = Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'heroImage'>
type SeedPost = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'cover'>
type SeedProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'cover' | 'gallery'>
type SeedSiteSetting = Omit<SiteSetting, 'id' | 'createdAt' | 'updatedAt' | 'logo'>
type RichTextValue = NonNullable<NonNullable<Page['blocks']>[number]['body']>

export const defaultSiteSettings: SeedSiteSetting = {
  siteName: 'GeekClaw',
  siteUrl: 'https://geekclaw.ai',
  primaryColor: '#b42318',
  seoTitle: 'GeekClaw',
  seoDescription: 'GeekClaw 内容站、专题页、博客与商城后台',
  contactEmail: 'team@geekclaw.ai',
  navigation: [
    { label: '首页', href: '/' },
    { label: '白龙马', href: '/bailongma' },
    { label: '博客', href: '/blog' },
    { label: '商城', href: '/shop' },
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
    heroTitle: 'GeekClaw 专业内容站与商城后台',
    heroDescription:
      '统一管理官网、博客、专题页和商品的现代化后台骨架。',
  },
  {
    title: '白龙马专题页',
    slug: 'bailongma',
    status: 'published' as const,
    heroTitle: '白龙马专题页',
    heroDescription: '专题页内容将由 Payload 后台管理。',
    sections: [
      {
        blockType: 'hero',
        title: '白龙马专题页',
        eyebrow: 'AI Partner',
        description: '适合品牌、活动、招商和解决方案表达的可运营二级页面。',
        primaryLabel: '查看商城方案',
        primaryHref: '/shop',
        secondaryLabel: '阅读博客',
        secondaryHref: '/blog',
      },
      {
        blockType: 'featureGrid',
        heading: '内容结构',
        description: '把专题页拆成明确模块，方便内容团队在后台持续维护。',
        items: [
          { title: '首屏表达', body: '价值主张、按钮、品牌感知统一管理。 ' },
          { title: '卖点卡片', body: '把核心优势拆分成更适合阅读和转化的区块。' },
          { title: '转化链路', body: '最终串到博客、咨询或商品订单。' },
        ],
      },
      {
        blockType: 'stats',
        heading: '运营目标',
        items: [
          { value: '2F', label: '专题二级页' },
          { value: 'CMS', label: '后台可更新' },
          { value: 'SHOP', label: '可接商品转化' },
        ],
      },
      {
        blockType: 'cta',
        heading: '需要搭配商品或咨询链路时，可以直接接到商城与订单体系。',
        description: '这一版已经能把专题页、博客、商品、订单串起来。',
        buttonLabel: '去商城',
        buttonHref: '/shop',
      },
    ],
    blocks: [
      { heading: 'Hero 区块', body: richText('主标题、副标题、主按钮、首屏主视觉') },
      { heading: '内容区块', body: richText('图文交错、卡片模块、优势描述、FAQ') },
      { heading: '可运营化', body: richText('支持后台改文案、换图、发布博客与专题联动') },
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

export const defaultProducts: SeedProduct[] = [
  {
    name: 'GeekClaw 企业部署方案',
    slug: 'enterprise-deployment',
    summary: '默认商品数据，用于初始化商城结构。',
    price: 9999,
    currency: 'CNY',
    status: 'active' as const,
  },
]

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
