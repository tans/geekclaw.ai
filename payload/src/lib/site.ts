import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Media, PaymentSetting, SiteSetting } from '@/payload-types'
import { ensureSiteSettingsSchema } from '@/lib/site-schema'

export type NavItem = {
  label: string
  href: string
}

export type SiteData = {
  siteName: string
  siteUrl: string
  logo?: {
    url: string
    alt: string
  } | null
  contactEmail: string
  primaryColor: string
  seoTitle: string
  seoDescription: string
  footerDescription: string
  navigation: NavItem[]
  home: {
    eyebrow: string
    heroTitle: string
    heroDescription: string
    primaryActionLabel: string
    primaryActionHref: string
    secondaryActionLabel: string
    secondaryActionHref: string
    panelEyebrow: string
    panelTitle: string
    panelBody: string
    panelMetrics: Array<{
      value: string
      label: string
    }>
    featuredPagesHeading: string
    featuredPagesDescription: string
    featuredPages: number[]
    featuredPostsHeading: string
    featuredPostsDescription: string
    featuredPosts: number[]
    featuredProductsHeading: string
    featuredProductsDescription: string
    featuredProducts: number[]
    ctaEyebrow: string
    ctaTitle: string
    ctaDescription: string
    ctaLabel: string
    ctaHref: string
  }
  payment: {
    provider: 'alipay'
    notifyUrl: string
    returnUrl: string
    appId: string
    sellerId: string
    gateway: string
    privateKey: string
    publicKey: string
  }
}

export type PaymentConfigSnapshot = {
  provider: 'alipay'
  notifyUrl: string
  returnUrl: string
  appId: string
  sellerId: string
  gateway: string
  privateKey: string
  publicKey: string
}

export const defaultNavItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '能力', href: '/#capabilities' },
  { label: '场景', href: '/#scenarios' },
  { label: '部署', href: '/#deployment' },
  { label: '商城', href: '/shop' },
]

export const siteFallback: SiteData = {
  siteName: 'GeekClaw',
  siteUrl: 'https://geekclaw.ai',
  logo: {
    url: '/geekclaw-logo.png',
    alt: 'GeekClaw logo',
  },
  contactEmail: 'team@geekclaw.ai',
  primaryColor: '#1457d9',
  seoTitle: 'GeekClaw | 企业级 AI Agent 与自动化工作台',
  seoDescription: 'GeekClaw 是一个 7 x 24 小时协助企业团队处理知识、工具和流程任务的 AI Agent 工作台。',
  footerDescription: 'GeekClaw 帮助企业把 AI Agent 接入真实流程，完成任务执行、团队协作与持续治理。',
  navigation: defaultNavItems,
  home: {
    eyebrow: 'GeekClaw AI Agent',
    heroTitle: '一个 7 x 24 小时帮团队干活的 AI Agent',
    heroDescription:
      'GeekClaw 连接企业知识、业务系统和自动化工具，让 Agent 能理解目标、拆解任务、调用工具、推动流程，并把结果交付给团队。',
    primaryActionLabel: '预约演示',
    primaryActionHref: 'mailto:team@geekclaw.ai?subject=GeekClaw%20演示预约',
    secondaryActionLabel: '查看部署方案',
    secondaryActionHref: '/#deployment',
    panelEyebrow: 'Product System',
    panelTitle: '像助理一样理解任务，像系统一样稳定执行。',
    panelBody:
      '把知识库、业务系统、自动化工具和审批节点连接起来，形成从对话到执行的闭环，并留下可审计的过程记录。',
    panelMetrics: [
      { value: 'Agent', label: '任务执行' },
      { value: 'Flow', label: '流程自动化' },
      { value: 'Local', label: '本地部署' },
    ],
    featuredPagesHeading: '从聊天到行动的 Agent 能力',
    featuredPagesDescription: '围绕企业日常工作，把知识检索、工具调用、流程编排和权限审计放在同一个工作台里。',
    featuredPages: [],
    featuredPostsHeading: '覆盖团队每天都会遇到的任务',
    featuredPostsDescription: '从销售、客服、运营、交付到内部支持，优先覆盖高频、规则明确、需要跨系统协作的流程。',
    featuredPosts: [],
    featuredProductsHeading: '部署与交付方式',
    featuredProductsDescription: '支持试点、私有化部署、预装主机和行业模板，按企业现有系统逐步接入。',
    featuredProducts: [],
    ctaEyebrow: 'Start Building',
    ctaTitle: '从一个可验收的 Agent 场景开始',
    ctaDescription: '选一个高频业务流程，接入知识库、工具和权限边界，用 GeekClaw 快速验证 AI Agent 的实际产出。',
    ctaLabel: '预约部署评估',
    ctaHref: 'mailto:team@geekclaw.ai?subject=GeekClaw%20部署评估',
  },
  payment: {
    provider: 'alipay',
    notifyUrl: 'https://geekclaw.ai/api/pay/alipay/notify',
    returnUrl: 'https://geekclaw.ai/pay-success',
    appId: '',
    sellerId: '',
    gateway: 'https://openapi.alipay.com/gateway.do',
    privateKey: '',
    publicKey: '',
  },
}

type LegacyPaymentConfig = {
  provider?: 'alipay' | null
  notifyUrl?: string | null
  returnUrl?: string | null
  appId?: string | null
  sellerId?: string | null
  gateway?: string | null
  privateKey?: string | null
  publicKey?: string | null
}

function normalizePaymentConfig(value: Partial<LegacyPaymentConfig> | null | undefined): PaymentConfigSnapshot {
  return {
    provider: 'alipay',
    notifyUrl: typeof value?.notifyUrl === 'string' ? value.notifyUrl : '',
    returnUrl: typeof value?.returnUrl === 'string' ? value.returnUrl : '',
    appId: typeof value?.appId === 'string' ? value.appId : '',
    sellerId: typeof value?.sellerId === 'string' ? value.sellerId : '',
    gateway: typeof value?.gateway === 'string' ? value.gateway : '',
    privateKey: typeof value?.privateKey === 'string' ? value.privateKey : '',
    publicKey: typeof value?.publicKey === 'string' ? value.publicKey : '',
  }
}

function hasMeaningfulPaymentConfig(value: PaymentConfigSnapshot) {
  return Boolean(
    value.notifyUrl.trim() ||
      value.returnUrl.trim() ||
      value.appId.trim() ||
      value.sellerId.trim() ||
      value.gateway.trim() ||
      value.privateKey.trim() ||
      value.publicKey.trim(),
  )
}

const legacySiteDescription = 'GeekClaw 内容站、专题页、博客与商城后台'
const legacyAiDescription = 'GeekClaw 帮助企业完成 AI 能力的部署、接入、权限治理与长期运行。'
const legacyFooterDescription = '企业 AI 内容站、专题页、博客和商品后台将统一由 Payload 管理。'
const legacyPrimaryColor = '#b42318'
const legacyAiNavSignature = '首页|/|部署方案|/#deployment|博客|/blog|商城|/shop'
const legacyPortfolioValues = new Set([
  'GeekClaw Product Group',
  '企业 AI、开放能力平台与数字人内容系统',
  'GeekClaw 统一承接三个方向：面向企业流程的智能体落地、面向开发者与自动化团队的 OPC 能力平台，以及面向内容和服务场景的 LiloAvatar 数字人。',
  '联系团队',
  'mailto:team@geekclaw.ai',
  '查看主机销售',
  '/shop',
  'Portfolio',
  '一个官网承接三条产品线，交易模块由后台维护。',
  '官网负责讲清楚产品定位和应用路径；商品、库存、订单、支付与履约由 Payload 后台维护，方便后续销售主机和方案包。',
  '重点专题与产品入口',
  '把首页的重点入口交给后台维护，可以根据阶段调整专题页、产品线和商城导流顺序。',
  '最新内容',
  '博客和内容更新可以直接在首页承接，不需要前台再写死文章卡片。',
  '精选商品与方案',
  '把当前最重要的主机、服务包或方案商品直接挂到首页，方便导向下单。',
  'Next Step',
  '先把产品线讲清楚，再让商城承接交易',
  '当前官网先完成品牌与产品结构，主机商品、价格、库存和订单履约由后台持续维护。',
  '进入商城后台',
  '/admin',
  '让 AI Agent 进入企业真实工作流',
  'GeekClaw 面向企业团队提供可落地的 AI Agent、自动化流程、知识库与私有化部署能力。',
  'GeekClaw 围绕企业知识、工具调用、流程自动化和本地化部署，帮助团队把 AI 从问答带入可交付的业务执行。',
  '从知识理解到任务执行，一套企业可控的 Agent 工作台。',
  '把知识库、业务系统、自动化工具和审批节点连接起来，让 Agent 能查资料、调工具、跑流程，并留下可审计的执行记录。',
  '企业 Agent 能力',
  '适用业务场景',
])

export async function getSiteData(): Promise<SiteData> {
  ensureSiteSettingsSchema()

  const envPayment = {
    provider: 'alipay' as const,
    notifyUrl:
      process.env.ALIPAY_NOTIFY_URL || `${process.env.NEXT_PUBLIC_SITE_URL || siteFallback.siteUrl}/api/pay/alipay/notify`,
    returnUrl:
      process.env.ALIPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_SITE_URL || siteFallback.siteUrl}/pay-success`,
    appId: process.env.ALIPAY_APP_ID || '',
    sellerId: process.env.ALIPAY_SELLER_ID || '',
    gateway: process.env.ALIPAY_GATEWAY || siteFallback.payment.gateway,
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  }

  try {
    const payload = await getPayload({ config })
    const [global, paymentGlobal] = await Promise.all([
      payload.findGlobal({
        slug: 'site-settings',
      }),
      payload
        .findGlobal({
          slug: 'payment-settings',
        })
        .catch(() => null),
    ])
    const payment = ((paymentGlobal || {}) as PaymentSetting | null) || null
    const legacyPayment = (((global as SiteSetting & { payment?: LegacyPaymentConfig | null }).payment || {}) as LegacyPaymentConfig) || null
    const home = global.home || {}
    const logo = resolveMedia(global.logo)

    const navigation =
      global.navigation?.map((item) => ({
        label: item.label,
        href: item.href,
      })) || siteFallback.navigation

    return {
      siteName: global.siteName || siteFallback.siteName,
      siteUrl: global.siteUrl || siteFallback.siteUrl,
      logo,
      contactEmail: global.contactEmail || siteFallback.contactEmail,
      primaryColor:
        global.primaryColor && global.primaryColor !== legacyPrimaryColor
          ? global.primaryColor
          : siteFallback.primaryColor,
      seoTitle:
        global.seoTitle &&
        global.seoTitle !== 'GeekClaw' &&
        global.seoTitle !== 'GeekClaw | 企业 AI 智能体落地方案'
          ? global.seoTitle
          : siteFallback.seoTitle,
      seoDescription:
        global.seoDescription &&
        global.seoDescription !== legacySiteDescription &&
        global.seoDescription !== legacyAiDescription
          ? global.seoDescription
          : siteFallback.seoDescription,
      footerDescription:
        global.seoDescription &&
        global.seoDescription !== legacySiteDescription &&
        global.seoDescription !== legacyAiDescription &&
        global.seoDescription !== legacyFooterDescription
          ? global.seoDescription
          : siteFallback.footerDescription,
      navigation: isLegacyNavigation(navigation) ? siteFallback.navigation : navigation,
      home: {
        eyebrow: resolveHomeText(home.eyebrow, siteFallback.home.eyebrow),
        heroTitle:
          resolveHomeText(home.heroTitle, siteFallback.home.heroTitle),
        heroDescription:
          resolveHomeText(home.heroDescription, siteFallback.home.heroDescription),
        primaryActionLabel:
          resolveHomeText(home.primaryActionLabel, siteFallback.home.primaryActionLabel),
        primaryActionHref:
          resolveHomeText(home.primaryActionHref, siteFallback.home.primaryActionHref),
        secondaryActionLabel:
          resolveHomeText(home.secondaryActionLabel, siteFallback.home.secondaryActionLabel),
        secondaryActionHref:
          resolveHomeText(home.secondaryActionHref, siteFallback.home.secondaryActionHref),
        panelEyebrow:
          resolveHomeText(home.panelEyebrow, siteFallback.home.panelEyebrow),
        panelTitle:
          resolveHomeText(home.panelTitle, siteFallback.home.panelTitle),
        panelBody:
          resolveHomeText(home.panelBody, siteFallback.home.panelBody),
        panelMetrics:
          Array.isArray(home.panelMetrics) && home.panelMetrics.length
            ? home.panelMetrics
                .map((item) => ({
                  value: typeof item?.value === 'string' ? item.value : '',
                  label: typeof item?.label === 'string' ? item.label : '',
                }))
                .filter((item) => item.value && item.label)
            : siteFallback.home.panelMetrics,
        featuredPagesHeading:
          resolveHomeText(home.featuredPagesHeading, siteFallback.home.featuredPagesHeading),
        featuredPagesDescription:
          resolveHomeText(home.featuredPagesDescription, siteFallback.home.featuredPagesDescription),
        featuredPages:
          Array.isArray(home.featuredPages)
            ? home.featuredPages
                .map((item) => (typeof item === 'number' ? item : typeof item === 'object' && item ? Number(item.id) : 0))
                .filter((item) => item > 0)
            : siteFallback.home.featuredPages,
        featuredPostsHeading:
          resolveHomeText(home.featuredPostsHeading, siteFallback.home.featuredPostsHeading),
        featuredPostsDescription:
          resolveHomeText(home.featuredPostsDescription, siteFallback.home.featuredPostsDescription),
        featuredPosts:
          Array.isArray(home.featuredPosts)
            ? home.featuredPosts
                .map((item) => (typeof item === 'number' ? item : typeof item === 'object' && item ? Number(item.id) : 0))
                .filter((item) => item > 0)
            : siteFallback.home.featuredPosts,
        featuredProductsHeading:
          resolveHomeText(home.featuredProductsHeading, siteFallback.home.featuredProductsHeading),
        featuredProductsDescription:
          resolveHomeText(home.featuredProductsDescription, siteFallback.home.featuredProductsDescription),
        featuredProducts:
          Array.isArray(home.featuredProducts)
            ? home.featuredProducts
                .map((item) => (typeof item === 'number' ? item : typeof item === 'object' && item ? Number(item.id) : 0))
                .filter((item) => item > 0)
            : siteFallback.home.featuredProducts,
        ctaEyebrow:
          resolveHomeText(home.ctaEyebrow, siteFallback.home.ctaEyebrow),
        ctaTitle: resolveHomeText(home.ctaTitle, siteFallback.home.ctaTitle),
        ctaDescription:
          resolveHomeText(home.ctaDescription, siteFallback.home.ctaDescription),
        ctaLabel: resolveHomeText(home.ctaLabel, siteFallback.home.ctaLabel),
        ctaHref: resolveHomeText(home.ctaHref, siteFallback.home.ctaHref),
      },
      payment: {
        provider: 'alipay',
        notifyUrl: envPayment.notifyUrl || payment?.notifyUrl || legacyPayment?.notifyUrl || siteFallback.payment.notifyUrl,
        returnUrl: envPayment.returnUrl || payment?.returnUrl || legacyPayment?.returnUrl || siteFallback.payment.returnUrl,
        appId: envPayment.appId || payment?.appId || legacyPayment?.appId || '',
        sellerId: envPayment.sellerId || payment?.sellerId || legacyPayment?.sellerId || '',
        gateway: envPayment.gateway || payment?.gateway || legacyPayment?.gateway || siteFallback.payment.gateway,
        privateKey: envPayment.privateKey || payment?.privateKey || legacyPayment?.privateKey || '',
        publicKey: envPayment.publicKey || payment?.publicKey || legacyPayment?.publicKey || '',
      },
    }
  } catch (error) {
    console.error('[site] falling back to defaults', error)
    return {
      ...siteFallback,
      payment: envPayment,
    }
  }
}

function isLegacyNavigation(navigation: NavItem[]) {
  const signature = navigation.map((item) => `${item.label}|${item.href}`).join('|')
  const hasLegacyCompatibilityRoute = navigation.some((item) => item.href === '/bailongma')

  return hasLegacyCompatibilityRoute || signature === legacyAiNavSignature
}

function resolveHomeText(value: unknown, fallback: string) {
  if (typeof value !== 'string') {
    return fallback
  }

  const text = value.trim()
  if (!text || legacyPortfolioValues.has(text)) {
    return fallback
  }

  return text
}

function resolveMedia(value: number | Media | null | undefined) {
  if (!value || typeof value !== 'object' || !value.url) {
    return null
  }

  return {
    url: value.url,
    alt: value.alt || siteFallback.siteName,
  }
}

export async function getRawSitePaymentConfig() {
  ensureSiteSettingsSchema()

  try {
    const payload = await getPayload({ config })
    const [paymentGlobal, siteGlobal] = await Promise.all([
      payload
        .findGlobal({
          slug: 'payment-settings',
        })
        .catch(() => null),
      payload.findGlobal({
        slug: 'site-settings',
      }),
    ])
    const payment = ((paymentGlobal || {}) as PaymentSetting | null) || null
    const legacyPayment = (((siteGlobal as SiteSetting & { payment?: LegacyPaymentConfig | null }).payment || {}) as LegacyPaymentConfig) || null

    return normalizePaymentConfig({
      provider: payment?.provider || legacyPayment?.provider || 'alipay',
      notifyUrl: payment?.notifyUrl || legacyPayment?.notifyUrl || '',
      returnUrl: payment?.returnUrl || legacyPayment?.returnUrl || '',
      appId: payment?.appId || legacyPayment?.appId || '',
      sellerId: payment?.sellerId || legacyPayment?.sellerId || '',
      gateway: payment?.gateway || legacyPayment?.gateway || '',
      privateKey: payment?.privateKey || legacyPayment?.privateKey || '',
      publicKey: payment?.publicKey || legacyPayment?.publicKey || '',
    })
  } catch {
    return normalizePaymentConfig(null)
  }
}

export async function getPaymentSettingsConfig() {
  ensureSiteSettingsSchema()

  try {
    const payload = await getPayload({ config })
    const paymentGlobal = await payload.findGlobal({
      slug: 'payment-settings',
    })

    return normalizePaymentConfig(paymentGlobal as Partial<PaymentSetting>)
  } catch {
    return normalizePaymentConfig(null)
  }
}

export async function getLegacySitePaymentConfig() {
  ensureSiteSettingsSchema()

  try {
    const payload = await getPayload({ config })
    const global = await payload.findGlobal({
      slug: 'site-settings',
    })
    const legacyPayment = (((global as SiteSetting & { payment?: LegacyPaymentConfig | null }).payment || {}) as LegacyPaymentConfig) || null
    return normalizePaymentConfig(legacyPayment)
  } catch {
    return normalizePaymentConfig(null)
  }
}

export async function getPaymentConfigMigrationStatus() {
  const [current, legacy] = await Promise.all([getRawSitePaymentConfig(), getLegacySitePaymentConfig()])

  return {
    current,
    legacy,
    hasLegacyData: hasMeaningfulPaymentConfig(legacy),
    needsMigration:
      hasMeaningfulPaymentConfig(legacy) &&
      JSON.stringify({
        ...legacy,
        provider: 'alipay',
      }) !==
        JSON.stringify({
          ...current,
          provider: 'alipay',
        }),
  }
}

export async function migrateLegacyPaymentConfig() {
  ensureSiteSettingsSchema()

  const payload = await getPayload({ config })
  const legacy = await getLegacySitePaymentConfig()

  if (!hasMeaningfulPaymentConfig(legacy)) {
    throw new Error('LEGACY_PAYMENT_EMPTY')
  }

  await payload.updateGlobal({
    slug: 'payment-settings',
    data: legacy,
  })

  return {
    migrated: true,
    migratedFields: [
      'notifyUrl',
      'returnUrl',
      'appId',
      'sellerId',
      'gateway',
      'privateKey',
      'publicKey',
    ],
  }
}

export async function toggleHomeFeaturedEntity(args: {
  entityType: 'page' | 'post' | 'product'
  id: number
  action: 'add' | 'remove' | 'move-up' | 'move-down'
}) {
  ensureSiteSettingsSchema()

  const payload = await getPayload({ config })

  if (args.entityType === 'page') {
    const page = await payload.findByID({
      collection: 'pages',
      id: args.id,
      depth: 0,
    }).catch(() => null)

    if (!page) {
      throw new Error('ENTITY_NOT_FOUND')
    }

    if (args.action === 'add' && page.status !== 'published') {
      throw new Error('ENTITY_NOT_PUBLISHABLE')
    }
  }

  if (args.entityType === 'post') {
    const post = await payload.findByID({
      collection: 'posts',
      id: args.id,
      depth: 0,
    }).catch(() => null)

    if (!post) {
      throw new Error('ENTITY_NOT_FOUND')
    }

    if (args.action === 'add' && post.status !== 'published') {
      throw new Error('ENTITY_NOT_PUBLISHABLE')
    }
  }

  if (args.entityType === 'product') {
    const product = await payload.findByID({
      collection: 'products',
      id: args.id,
      depth: 0,
    }).catch(() => null)

    if (!product) {
      throw new Error('ENTITY_NOT_FOUND')
    }

    if (args.action === 'add' && product.status !== 'active') {
      throw new Error('ENTITY_NOT_PUBLISHABLE')
    }
  }

  const global = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
  })

  const home = global.home || {}
  const key =
    args.entityType === 'page'
      ? 'featuredPages'
      : args.entityType === 'post'
        ? 'featuredPosts'
        : 'featuredProducts'

  const current = Array.isArray(home[key])
    ? home[key].map((item) => (typeof item === 'number' ? item : Number(item))).filter((item) => item > 0)
    : []

  let next = [...current]

  if (args.action === 'add') {
    next = Array.from(new Set([...current, args.id]))
  } else if (args.action === 'remove') {
    next = current.filter((item) => item !== args.id)
  } else {
    const index = current.findIndex((item) => item === args.id)

    if (index !== -1) {
      const targetIndex = args.action === 'move-up' ? index - 1 : index + 1

      if (targetIndex >= 0 && targetIndex < current.length) {
        const reordered = [...current]
        const [moved] = reordered.splice(index, 1)
        reordered.splice(targetIndex, 0, moved)
        next = reordered
      }
    }
  }

  const updated = await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      home: {
        ...home,
        [key]: next,
      },
    },
  })

  return {
    entityType: args.entityType,
    id: args.id,
    action: args.action,
    items: next,
    count: Array.isArray(updated.home?.[key]) ? updated.home[key]?.length || 0 : next.length,
  }
}
