import type { Page, PaymentSetting, Post, PostCategory, PostTag, Product, ProductCategory, ProductTag, SiteSetting } from '@/payload-types'

type SeedPage = Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'heroImage'>
type SeedPost = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'cover'>
type SeedProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'cover' | 'gallery'>
type SeedPostCategory = Omit<PostCategory, 'id' | 'createdAt' | 'updatedAt'>
type SeedPostTag = Omit<PostTag, 'id' | 'createdAt' | 'updatedAt'>
type SeedProductCategory = Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>
type SeedProductTag = Omit<ProductTag, 'id' | 'createdAt' | 'updatedAt'>
type SeedSiteSetting = Omit<SiteSetting, 'id' | 'createdAt' | 'updatedAt' | 'logo'>
type SeedPaymentSetting = Omit<PaymentSetting, 'id' | 'createdAt' | 'updatedAt' | 'envOverrideNotice'>
type RichTextValue = NonNullable<NonNullable<Page['blocks']>[number]['body']>

export const defaultSiteSettings: SeedSiteSetting = {
  siteName: 'GeekClaw',
  siteUrl: 'https://geekclaw.ai',
  primaryColor: '#1457d9',
  seoTitle: 'GeekClaw | 企业级 AI Agent 与自动化工作台',
  seoDescription: 'GeekClaw 面向企业团队提供可落地的 AI Agent、自动化流程、知识库与私有化部署能力。',
  contactEmail: 'team@geekclaw.ai',
  navigation: [
    { label: '首页', href: '/' },
    { label: '能力', href: '/#capabilities' },
    { label: '场景', href: '/#scenarios' },
    { label: '部署', href: '/#deployment' },
    { label: '商城', href: '/shop' },
  ],
  home: {
    eyebrow: 'GeekClaw AI Agent',
    heroTitle: '让 AI Agent 进入企业真实工作流',
    heroDescription:
      'GeekClaw 围绕企业知识、工具调用、流程自动化和本地化部署，帮助团队把 AI 从问答带入可交付的业务执行。',
    primaryActionLabel: '预约演示',
    primaryActionHref: 'mailto:team@geekclaw.ai?subject=GeekClaw%20演示预约',
    secondaryActionLabel: '查看部署方案',
    secondaryActionHref: '/#deployment',
    panelEyebrow: 'Product System',
    panelTitle: '从知识理解到任务执行，一套企业可控的 Agent 工作台。',
    panelBody:
      '把知识库、业务系统、自动化工具和审批节点连接起来，让 Agent 能查资料、调工具、跑流程，并留下可审计的执行记录。',
    panelMetrics: [
      { value: 'Agent', label: '任务执行' },
      { value: 'Flow', label: '流程自动化' },
      { value: 'Local', label: '本地部署' },
    ],
    featuredPagesHeading: '企业 Agent 能力',
    featuredPagesDescription: '围绕企业日常工作，把知识检索、工具调用、流程编排和权限审计放在同一个工作台里。',
    featuredPostsHeading: '适用业务场景',
    featuredPostsDescription: '从销售、客服、运营、交付到内部支持，优先覆盖高频、规则明确、需要跨系统协作的流程。',
    featuredProductsHeading: '部署与交付方式',
    featuredProductsDescription: '支持试点、私有化部署、预装主机和行业模板，按企业现有系统逐步接入。',
    ctaEyebrow: 'Start Building',
    ctaTitle: '从一个可验收的 Agent 场景开始',
    ctaDescription: '选一个高频业务流程，接入知识库、工具和权限边界，用 GeekClaw 快速验证 AI Agent 的实际产出。',
    ctaLabel: '预约部署评估',
    ctaHref: 'mailto:team@geekclaw.ai?subject=GeekClaw%20部署评估',
  },
}

export const defaultPaymentSettings: SeedPaymentSetting = {
  provider: 'alipay',
  notifyUrl: 'https://geekclaw.ai/api/pay/alipay/notify',
  returnUrl: 'https://geekclaw.ai/pay-success',
  appId: '',
  sellerId: '',
  gateway: 'https://openapi.alipay.com/gateway.do',
  privateKey: '',
  publicKey: '',
}

export const defaultPages: SeedPage[] = [
  {
    title: '首页',
    slug: 'home',
    status: 'published' as const,
    heroTitle: '让 AI Agent 进入企业真实工作流',
    heroDescription:
      'GeekClaw 面向企业团队提供可落地的 AI Agent、自动化流程、知识库与私有化部署能力。',
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
    primaryCategory: 0,
    categories: [],
    tags: [],
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
    primaryCategory: 0,
    categories: [],
    tags: [],
    sku: 'GC-ENT-001',
    summary: '适用于需要企业 AI 部署、OPC 接入和后台运营能力的团队。',
    price: 9999,
    currency: 'CNY',
    trackInventory: false,
    stockQuantity: 0,
    allowBackorder: true,
    limitPerOrder: 1,
    status: 'active' as const,
    content: richText('适用于企业 AI 部署、OPC 接入和后台运营的标准交付方案，可在后台继续维护方案说明与交付边界。'),
  },
] as Array<SeedProduct & { sku?: string; trackInventory?: boolean; stockQuantity?: number; allowBackorder?: boolean; limitPerOrder?: number }>

export const defaultPostCategories: SeedPostCategory[] = [
  {
    name: '建站',
    slug: 'site-building',
    description: '官网、内容站和后台交付相关的文章分类。',
  },
  {
    name: '内容策略',
    slug: 'content-strategy',
    description: '适合承载博客、专题页和首页内容编排方法。',
  },
]

export const defaultProductCategories: SeedProductCategory[] = [
  {
    name: '企业方案',
    slug: 'enterprise-solutions',
    description: '企业 AI、集成部署和定制化交付服务。',
  },
  {
    name: '运行主机',
    slug: 'compute-hosts',
    description: '面向部署、推理和数字人场景的主机产品。',
  },
]

export const defaultPostTags: SeedPostTag[] = [
  {
    name: 'Payload',
    slug: 'payload',
    description: '和 Payload CMS 实施、后台配置、数据模型相关的内容标签。',
  },
  {
    name: '迁移',
    slug: 'migration',
    description: '站点迁移、结构调整和内容重构相关标签。',
  },
]

export const defaultProductTags: SeedProductTag[] = [
  {
    name: '交付方案',
    slug: 'delivery-plan',
    description: '适合按项目交付、实施和服务包方式销售的商品标签。',
  },
  {
    name: '企业级',
    slug: 'enterprise-grade',
    description: '适合企业客户的主机、部署和方案标签。',
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
