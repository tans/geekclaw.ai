import { getPayload, type TypedLocale } from 'payload'
import config from '@/payload.config'
import type { Media } from '@/payload-types'
import { ensureProductsSchema } from '@/lib/product-schema'
import { getSiteData } from '@/lib/site'
import { ensureTaxonomySchema } from '@/lib/taxonomy-schema'

export type FrontendPageBlock = {
  heading: string
  body: string
}

export type FrontendPage = {
  id?: number
  title: string
  slug: string
  heroTitle?: string
  heroDescription?: string
  seoTitle?: string
  seoDescription?: string
  blocks?: FrontendPageBlock[]
  sections?: FrontendPageSection[]
}

export type FrontendPageSection =
  | {
      type: 'hero'
      eyebrow?: string
      title: string
      description?: string
      primaryLabel?: string
      primaryHref?: string
      secondaryLabel?: string
      secondaryHref?: string
    }
  | {
      type: 'featureGrid'
      heading?: string
      description?: string
      items: Array<{ title: string; body?: string }>
    }
  | {
      type: 'stats'
      heading?: string
      items: Array<{ value: string; label: string }>
    }
  | {
      type: 'cta'
      heading: string
      description?: string
      buttonLabel?: string
      buttonHref?: string
    }

export type FrontendPost = {
  id?: number
  title: string
  slug: string
  category?: string
  categorySlug?: string
  categories?: Array<{ name: string; slug: string }>
  tags?: Array<{ name: string; slug: string }>
  excerpt?: string
  cover?: FrontendMedia | null
  content?: string
  publishedAt?: string
}

export type FrontendProduct = {
  id?: number
  name: string
  slug: string
  category?: string
  categorySlug?: string
  categories?: Array<{ name: string; slug: string }>
  tags?: Array<{ name: string; slug: string }>
  price: number
  currency: string
  sku?: string
  summary?: string
  cover?: FrontendMedia | null
  gallery?: FrontendMedia[]
  content?: string
  trackInventory?: boolean
  stockQuantity?: number
  allowBackorder?: boolean
  limitPerOrder?: number
  reservedQuantity?: number
  availableQuantity?: number | null
  isSoldOut?: boolean
  purchaseMessage?: string
}

export type FrontendMedia = {
  url: string
  alt: string
  width?: number
  height?: number
}

export type FrontendHomeSectionCard = {
  title: string
  body: string
  label?: string
  href?: string
}

export type FrontendHomeSection = {
  id?: string
  eyebrow: string
  title: string
  body: string
  cards: FrontendHomeSectionCard[]
}

export type FrontendHomeContent = {
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  lead: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  panel: {
    eyebrow: string
    title: string
    body: string
    metrics: Array<{ value: string; label: string }>
  }
  sections: FrontendHomeSection[]
  cta: {
    eyebrow: string
    title: string
    body: string
    label: string
    href: string
  }
}

type FrontendDataSource = {
  pages: Record<string, FrontendPage>
  posts: FrontendPost[]
  products: FrontendProduct[]
}

type LexicalNode = {
  children?: LexicalNode[]
  text?: string
  type?: string
}

const fallbackData: FrontendDataSource = {
  pages: {
    home: {
      title: 'GeekClaw',
      slug: 'home',
      heroTitle: '让 AI Agent 进入企业真实工作流',
      heroDescription:
        'GeekClaw 面向企业团队提供可落地的 AI Agent、自动化流程、知识库与私有化部署能力。',
      seoTitle: 'GeekClaw | 企业级 AI Agent 与自动化工作台',
      seoDescription: 'GeekClaw 面向企业团队提供可落地的 AI Agent、自动化流程、知识库与私有化部署能力。',
    },
    bailongma: {
      title: 'LiloAvatar',
      slug: 'bailongma',
      heroTitle: 'LiloAvatar 数字人内容与陪伴体验系统',
      heroDescription:
        '面向品牌内容、客户服务、培训讲解和互动陪伴场景，构建可持续运营的数字人体验。',
      seoTitle: 'LiloAvatar | 数字人内容与陪伴体验系统',
      seoDescription: 'LiloAvatar 面向品牌、客服、培训和互动内容场景。',
      sections: [
        {
          type: 'hero',
          eyebrow: 'LiloAvatar',
          title: '让数字人拥有可持续运营的内容、记忆和交互能力',
          description: '围绕角色设定、知识库、内容脚本、互动记录和渠道发布搭建完整流程。',
          primaryLabel: '查看商城',
          primaryHref: '/shop',
          secondaryLabel: '联系团队',
          secondaryHref: 'mailto:team@geekclaw.ai',
        },
        {
          type: 'featureGrid',
          heading: '核心能力',
          description: '数字人不只是形象生成，还需要可维护的角色、资料和运营流程。',
          items: [
            { title: '角色与人格', body: '定义身份、语气、边界和知识范围。' },
            { title: '记忆与知识', body: '接入产品资料、品牌语料、FAQ 和服务流程。' },
            { title: '互动与发布', body: '承接咨询、讲解、培训、活动和内容分发。' },
          ],
        },
        {
          type: 'stats',
          heading: '适合的使用场景',
          items: [
            { value: 'Brand', label: '品牌导览' },
            { value: 'Support', label: '客户服务' },
            { value: 'Training', label: '培训讲解' },
          ],
        },
      ],
      blocks: [
        {
          heading: '内容运营',
          body: '角色设定、知识资料和互动脚本可持续维护。',
        },
        {
          heading: '业务承接',
          body: '适合官网导览、客服咨询、培训讲解和活动互动。',
        },
        {
          heading: '商城连接',
          body: '主机、设备和部署服务可进入商城后台维护。',
        },
      ],
    },
  },
  posts: [
    {
      title: 'GeekClaw 内容站迁移到 Payload 的原因',
      slug: 'why-payload',
      category: '建站',
      excerpt: '这篇文章会说明为什么不再继续堆临时页，而是统一切到内容后台。',
      content:
        '这是一篇默认示例文章。后续将由 Payload 后台文章集合驱动，支持封面、分类、SEO 和草稿发布。',
      publishedAt: '2026-06-01T08:00:00.000Z',
    },
    {
      title: '如何规划企业 AI 专题页与官网主页的关系',
      slug: 'landing-and-home',
      category: '内容策略',
      excerpt: '专题页应该承担什么角色，如何与官网、博客、商品页形成结构化链路。',
      content: '这是第二篇示例文章，用于验证博客列表和详情结构。',
      publishedAt: '2026-06-03T08:00:00.000Z',
    },
  ],
  products: [
    {
      name: 'GeekClaw 企业部署方案',
      slug: 'enterprise-deployment',
      price: 9999,
      currency: 'CNY',
      sku: 'GC-ENT-001',
      summary: '适用于需要企业 AI 部署、OPC 接入和后台运营能力的团队。',
      content: '企业部署方案可由后台继续维护详情、价格、库存和履约说明。',
      trackInventory: false,
      stockQuantity: 0,
      allowBackorder: true,
      availableQuantity: null,
      isSoldOut: false,
      purchaseMessage: '按方案型服务接单，可直接提交需求并进入支付流程。',
    },
    {
      name: 'LiloAvatar 数字人运行主机',
      slug: 'liloavatar-host',
      price: 2999,
      currency: 'CNY',
      sku: 'GC-LILO-HOST-001',
      summary: '面向数字人内容运行、演示和本地部署的主机商品示例。',
      content: '主机销售由商城后台维护，前台仅展示已上架商品。',
      trackInventory: false,
      stockQuantity: 0,
      allowBackorder: true,
      availableQuantity: null,
      isSoldOut: false,
      purchaseMessage: '默认按服务方案接单，可直接创建订单。',
    },
  ],
}

async function getFrontendDataSource(): Promise<FrontendDataSource> {
  try {
    ensureProductsSchema()
    ensureTaxonomySchema()
    const payload = await getPayload({ config })

    const [pagesResult, postsResult, productsResult] = await Promise.all([
      payload.find({
        collection: 'pages',
        depth: 1,
        limit: 50,
        pagination: false,
        where: {
          status: {
            equals: 'published',
          },
        },
      }),
      payload.find({
        collection: 'posts',
        depth: 1,
        limit: 50,
        pagination: false,
        sort: '-publishedAt',
        where: {
          status: {
            equals: 'published',
          },
        },
      }),
      payload.find({
        collection: 'products',
        depth: 1,
        limit: 50,
        pagination: false,
        where: {
          status: {
            equals: 'active',
          },
        },
      }),
    ])

    const pages = Object.fromEntries(
      pagesResult.docs.map((page) => [
        page.slug,
        {
          id: page.id,
          title: page.title,
          slug: page.slug,
          heroTitle: page.heroTitle ?? undefined,
          heroDescription: page.heroDescription ?? undefined,
          seoTitle: page.seoTitle ?? page.title,
          seoDescription: page.seoDescription ?? page.heroDescription ?? undefined,
          blocks:
            page.blocks?.map((block) => ({
              heading: block.heading ?? '',
              body: lexicalToPlainText(block.body),
            })) ?? [],
          sections:
            page.sections?.map((section) => {
              if (section.blockType === 'hero') {
                return {
                  type: 'hero' as const,
                  eyebrow: section.eyebrow ?? undefined,
                  title: section.title,
                  description: section.description ?? undefined,
                  primaryLabel: section.primaryLabel ?? undefined,
                  primaryHref: section.primaryHref ?? undefined,
                  secondaryLabel: section.secondaryLabel ?? undefined,
                  secondaryHref: section.secondaryHref ?? undefined,
                }
              }

              if (section.blockType === 'featureGrid') {
                return {
                  type: 'featureGrid' as const,
                  heading: section.heading ?? undefined,
                  description: section.description ?? undefined,
                  items:
                    section.items?.map((item) => ({
                      title: item.title,
                      body: item.body ?? undefined,
                    })) ?? [],
                }
              }

              if (section.blockType === 'stats') {
                return {
                  type: 'stats' as const,
                  heading: section.heading ?? undefined,
                  items:
                    section.items?.map((item) => ({
                      value: item.value,
                      label: item.label,
                    })) ?? [],
                }
              }

              return {
                type: 'cta' as const,
                heading: section.heading,
                description: section.description ?? undefined,
                buttonLabel: section.buttonLabel ?? undefined,
                buttonHref: section.buttonHref ?? undefined,
              }
            }) ?? [],
        } satisfies FrontendPage,
      ]),
    )

    const posts = postsResult.docs.map((post) => {
      const categoryDocs = normalizeNamedRelationships(post.categories)
      const primaryCategory = normalizeNamedRelationship(post.primaryCategory) || categoryDocs[0] || null

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: primaryCategory?.name,
        categorySlug: primaryCategory?.slug,
        categories: categoryDocs,
        tags: normalizeNamedRelationships(post.tags),
        excerpt: post.excerpt ?? lexicalToPlainText(post.content).slice(0, 140),
        cover: resolveMedia(post.cover),
        content: lexicalToPlainText(post.content),
        publishedAt: post.publishedAt ?? undefined,
      }
    })

    const products = await Promise.all(
      productsResult.docs.map(async (product) => {
        const stock = getProductStockFields({
          sku: 'sku' in product ? (product as { sku?: string | null }).sku : undefined,
          trackInventory:
            'trackInventory' in product ? (product as { trackInventory?: boolean | null }).trackInventory : undefined,
          stockQuantity:
            'stockQuantity' in product ? (product as { stockQuantity?: number | null }).stockQuantity : undefined,
          allowBackorder:
            'allowBackorder' in product ? (product as { allowBackorder?: boolean | null }).allowBackorder : undefined,
          limitPerOrder:
            'limitPerOrder' in product ? (product as { limitPerOrder?: number | null }).limitPerOrder : undefined,
        })
        const availability = await getProductAvailability({
          productId: product.id,
          trackInventory: stock.trackInventory,
          stockQuantity: stock.stockQuantity,
          allowBackorder: stock.allowBackorder,
        })

        return {
          name: product.name,
          id: product.id,
          slug: product.slug,
          category: (normalizeNamedRelationship(product.primaryCategory) || normalizeNamedRelationships(product.categories)[0] || null)?.name,
          categorySlug: (normalizeNamedRelationship(product.primaryCategory) || normalizeNamedRelationships(product.categories)[0] || null)?.slug,
          categories: normalizeNamedRelationships(product.categories),
          tags: normalizeNamedRelationships(product.tags),
          price: product.price,
          currency: product.currency,
          sku: stock.sku,
          summary: product.summary ?? undefined,
          cover: resolveMedia(product.cover),
          gallery:
            product.gallery
              ?.map((item) => resolveMedia(item.image))
              .filter((item): item is FrontendMedia => Boolean(item)) ?? [],
          content: lexicalToPlainText(product.content),
          trackInventory: stock.trackInventory,
          stockQuantity: stock.stockQuantity,
          allowBackorder: stock.allowBackorder,
          limitPerOrder: stock.limitPerOrder,
          reservedQuantity: availability.reservedQuantity,
          availableQuantity: availability.availableQuantity,
          isSoldOut: availability.isSoldOut,
          purchaseMessage: buildProductPurchaseMessage({
            allowBackorder: stock.allowBackorder,
            availableQuantity: availability.availableQuantity,
            isSoldOut: availability.isSoldOut,
            limitPerOrder: stock.limitPerOrder,
            trackInventory: stock.trackInventory,
          }),
        } satisfies FrontendProduct
      }),
    )

    if (Object.keys(pages).length || posts.length || products.length) {
      return {
        pages,
        posts,
        products,
      }
    }
  } catch (error) {
    console.error('[frontend-data] falling back to default content', error)
  }

  return fallbackData
}

async function getProductAvailability(args: {
  productId: number
  trackInventory: boolean
  stockQuantity: number
  allowBackorder: boolean
}) {
  if (!args.trackInventory) {
    return {
      reservedQuantity: 0,
      availableQuantity: null,
      isSoldOut: false,
    }
  }

  const payload = await getPayload({ config })
  const orders = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 200,
    pagination: false,
    where: {
      status: {
        not_equals: 'cancelled',
      },
    },
  })

  const reservedQuantity = orders.docs.reduce((sum, order) => {
    if (order.status === 'failed' || order.status === 'refunded') {
      return sum
    }

    const items = Array.isArray(order.items) ? order.items : []

    return (
      sum +
      items.reduce((itemSum, item) => {
        const productId = typeof item.product === 'number' ? item.product : item.product?.id
        return productId === args.productId ? itemSum + (Number(item.quantity) || 0) : itemSum
      }, 0)
    )
  }, 0)

  const availableQuantity = Math.max(0, args.stockQuantity - reservedQuantity)

  return {
    reservedQuantity,
    availableQuantity,
    isSoldOut: !args.allowBackorder && availableQuantity <= 0,
  }
}

function getProductStockFields(product: {
  sku?: string | null
  trackInventory?: boolean | null
  stockQuantity?: number | null
  allowBackorder?: boolean | null
  limitPerOrder?: number | null
}) {
  return {
    sku: typeof product.sku === 'string' ? product.sku : undefined,
    trackInventory: Boolean(product.trackInventory),
    stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : 0,
    allowBackorder: Boolean(product.allowBackorder),
    limitPerOrder: typeof product.limitPerOrder === 'number' ? product.limitPerOrder : undefined,
  }
}

function buildProductPurchaseMessage(args: {
  trackInventory: boolean
  allowBackorder: boolean
  availableQuantity: number | null
  isSoldOut: boolean
  limitPerOrder?: number
}) {
  if (!args.trackInventory) {
    return args.limitPerOrder ? `单笔限购 ${args.limitPerOrder} 件。` : '当前可直接下单。'
  }

  if (args.isSoldOut) {
    return '当前库存已售罄，暂不可下单。'
  }

  if (args.allowBackorder && (args.availableQuantity || 0) <= 0) {
    return '当前库存已用尽，但允许缺货接单。'
  }

  if (typeof args.availableQuantity === 'number' && args.availableQuantity <= 5) {
    return `当前余量 ${args.availableQuantity} 件，请尽快下单。`
  }

  if (args.limitPerOrder) {
    return `当前可售，单笔限购 ${args.limitPerOrder} 件。`
  }

  return typeof args.availableQuantity === 'number' ? `当前可售库存 ${args.availableQuantity} 件。` : '当前可直接下单。'
}

export async function getPageBySlug(slug: string): Promise<FrontendPage | null> {
  const data = await getFrontendDataSource()
  return data.pages[slug] ?? null
}

export async function listPosts(): Promise<FrontendPost[]> {
  const data = await getFrontendDataSource()
  return data.posts
}

export async function listPostCategories() {
  const posts = await listPosts()
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>()

  for (const post of posts) {
    for (const category of post.categories || []) {
      const existing = categoryMap.get(category.slug)
      categoryMap.set(category.slug, {
        name: category.name,
        slug: category.slug,
        count: (existing?.count || 0) + 1,
      })
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export async function getPostBySlug(slug: string): Promise<FrontendPost | null> {
  const data = await getFrontendDataSource()
  return data.posts.find((item) => item.slug === slug) ?? null
}

export async function listPostTags() {
  const posts = await listPosts()
  const tagMap = new Map<string, { name: string; slug: string; count: number }>()

  for (const post of posts) {
    for (const tag of post.tags || []) {
      const existing = tagMap.get(tag.slug)
      tagMap.set(tag.slug, {
        name: tag.name,
        slug: tag.slug,
        count: (existing?.count || 0) + 1,
      })
    }
  }

  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export async function listProducts(): Promise<FrontendProduct[]> {
  const data = await getFrontendDataSource()
  return data.products
}

export async function listProductCategories() {
  const products = await listProducts()
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>()

  for (const product of products) {
    for (const category of product.categories || []) {
      const existing = categoryMap.get(category.slug)
      categoryMap.set(category.slug, {
        name: category.name,
        slug: category.slug,
        count: (existing?.count || 0) + 1,
      })
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export async function listActiveProductsForAdmin(): Promise<FrontendProduct[]> {
  const data = await getFrontendDataSource()
  return data.products
}

export async function getProductBySlug(slug: string): Promise<FrontendProduct | null> {
  const data = await getFrontendDataSource()
  return data.products.find((item) => item.slug === slug) ?? null
}

export async function listProductTags() {
  const products = await listProducts()
  const tagMap = new Map<string, { name: string; slug: string; count: number }>()

  for (const product of products) {
    for (const tag of product.tags || []) {
      const existing = tagMap.get(tag.slug)
      tagMap.set(tag.slug, {
        name: tag.name,
        slug: tag.slug,
        count: (existing?.count || 0) + 1,
      })
    }
  }

  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export async function getFrontendHomeContent(): Promise<FrontendHomeContent> {
  const [site, data] = await Promise.all([getSiteData(), getFrontendDataSource()])

  const featuredPages = resolveFeaturedItems({
    ids: site.home.featuredPages,
    items: Object.values(data.pages),
  }).slice(0, 6)
  const featuredPosts = resolveFeaturedItems({
    ids: site.home.featuredPosts,
    items: data.posts,
  }).slice(0, 6)
  const featuredProducts = resolveFeaturedItems({
    ids: site.home.featuredProducts,
    items: data.products,
  }).slice(0, 6)

  const pageCards = featuredPages.length
    ? featuredPages.map((page) => ({
        label: '专题 / 页面',
        title: page.title,
        body: page.heroDescription || page.seoDescription || '进入该专题页查看完整介绍与内容结构。',
        href: page.slug === 'home' ? '/' : `/${page.slug}`,
      }))
    : [
        {
          label: 'Knowledge',
          title: '企业知识库',
          body: '接入制度、产品资料、项目文档和 FAQ，让 Agent 在受控范围内检索、引用和生成回答。',
          href: '/#capabilities',
        },
        {
          label: 'Tools',
          title: '工具调用与系统接入',
          body: '连接 CRM、工单、表格、数据库和内部接口，让 Agent 能执行查询、写入、同步和通知。',
          href: '/#capabilities',
        },
        {
          label: 'Governance',
          title: '权限、审批与审计',
          body: '为不同角色设置可用能力和确认节点，保留执行记录，满足企业运营和合规要求。',
          href: '/#capabilities',
        },
      ]

  const postCards = featuredPosts.length
    ? featuredPosts.map((post) => ({
        label: post.category || '文章',
        title: post.title,
        body: post.excerpt || '从内容站入口继续阅读文章详情。',
        href: `/blog/${post.slug}`,
      }))
    : [
        {
          label: 'Sales',
          title: '销售线索与客户跟进',
          body: '自动整理客户信息、生成跟进建议、同步 CRM，并把下一步任务推送给销售团队。',
          href: '/#scenarios',
        },
        {
          label: 'Support',
          title: '客服与内部支持',
          body: '基于知识库回答问题，识别复杂工单并转人工，减少重复咨询和跨部门等待。',
          href: '/#scenarios',
        },
        {
          label: 'Operations',
          title: '运营报表与交付协同',
          body: '汇总多系统数据，生成日报、周报和项目进展，协助团队发现异常并推动处理。',
          href: '/#scenarios',
        },
      ]

  const productCards = featuredProducts.length
    ? featuredProducts.map((product) => ({
        label: `¥${product.price.toLocaleString('zh-CN')}`,
        title: product.name,
        body: product.summary || product.purchaseMessage || '进入商品详情页查看价格、库存和下单入口。',
        href: `/shop/${product.slug}`,
      }))
    : [
        {
          label: 'Pilot',
          title: '业务场景试点',
          body: '选择一个高频流程，完成知识库、工具权限、验收指标和人工确认节点配置。',
          href: 'mailto:team@geekclaw.ai?subject=GeekClaw%20试点咨询',
        },
        {
          label: 'Private',
          title: '私有化与本地部署',
          body: '支持企业自有网络、私有数据和本地运行环境，降低敏感数据外流风险。',
          href: '/#deployment',
        },
        {
          label: 'Hardware',
          title: '预装主机与服务包',
          body: '可通过商城承接主机、模板和部署服务，缩短从采购到上线的周期。',
          href: '/shop',
        },
      ]

  return {
    seoTitle: site.seoTitle,
    seoDescription: site.seoDescription,
    eyebrow: site.home.eyebrow,
    title: site.home.heroTitle,
    lead: site.home.heroDescription,
    primaryAction: {
      label: site.home.primaryActionLabel,
      href: site.home.primaryActionHref,
    },
    secondaryAction:
      site.home.secondaryActionLabel && site.home.secondaryActionHref
        ? {
            label: site.home.secondaryActionLabel,
            href: site.home.secondaryActionHref,
          }
        : undefined,
    panel: {
      eyebrow: site.home.panelEyebrow,
      title: site.home.panelTitle,
      body: site.home.panelBody,
      metrics: site.home.panelMetrics,
    },
    sections: [
      {
        eyebrow: 'Capabilities',
        id: 'capabilities',
        title: site.home.featuredPagesHeading,
        body: site.home.featuredPagesDescription,
        cards: pageCards,
      },
      {
        eyebrow: 'Scenarios',
        id: 'scenarios',
        title: site.home.featuredPostsHeading,
        body: site.home.featuredPostsDescription,
        cards: postCards,
      },
      {
        eyebrow: 'Deployment',
        id: 'deployment',
        title: site.home.featuredProductsHeading,
        body: site.home.featuredProductsDescription,
        cards: productCards,
      },
    ],
    cta: {
      eyebrow: site.home.ctaEyebrow,
      title: site.home.ctaTitle,
      body: site.home.ctaDescription,
      label: site.home.ctaLabel,
      href: site.home.ctaHref,
    },
  }
}

function resolveFeaturedItems<T extends { id?: number }>(args: { ids: number[]; items: T[] }) {
  const itemMap = new Map(args.items.map((item) => [item.id, item]))
  return args.ids.map((id) => itemMap.get(id)).filter((item): item is T => Boolean(item))
}

function getDefaultFeaturedPages(data: FrontendDataSource) {
  const pages = Object.values(data.pages)
  const preferred = ['bailongma', 'home']
  const selected = preferred
    .map((slug) => pages.find((page) => page.slug === slug))
    .filter((page): page is FrontendPage => Boolean(page))

  if (selected.length) {
    return selected
  }

  return pages.slice(0, 3)
}

function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const root = value as { root?: LexicalNode }
  const text = flattenLexicalText(root.root).trim()

  return text.replace(/\n{3,}/g, '\n\n')
}

function flattenLexicalText(node?: LexicalNode): string {
  if (!node) {
    return ''
  }

  if (typeof node.text === 'string') {
    return node.text
  }

  const childText = (node.children ?? []).map((child) => flattenLexicalText(child)).join('')

  if (node.type === 'paragraph' || node.type === 'heading') {
    return `${childText}\n\n`
  }

  if (node.type === 'listitem') {
    return `${childText}\n`
  }

  return childText
}

function resolveMedia(value: number | Media | null | undefined): FrontendMedia | null {
  if (!value || typeof value !== 'object' || !value.url) {
    return null
  }

  return {
    url: value.sizes?.card?.url || value.url,
    alt: value.alt,
    width: value.sizes?.card?.width ?? value.width ?? undefined,
    height: value.sizes?.card?.height ?? value.height ?? undefined,
  }
}

function normalizeNamedRelationship(value: unknown): { name: string; slug: string } | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const name = 'name' in value ? value.name : null
  const slug = 'slug' in value ? value.slug : null

  return typeof name === 'string' && typeof slug === 'string' && name.trim() && slug.trim() ? { name, slug } : null
}

function normalizeNamedRelationships(value: unknown): Array<{ name: string; slug: string }> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => normalizeNamedRelationship(item)).filter((item): item is { name: string; slug: string } => Boolean(item))
}
