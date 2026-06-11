import { getPayload, type TypedLocale } from 'payload'
import config from '@/payload.config'
import type { Media } from '@/payload-types'

export type FrontendPageBlock = {
  heading: string
  body: string
}

export type FrontendPage = {
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
  title: string
  slug: string
  category?: string
  excerpt?: string
  cover?: FrontendMedia | null
  content?: string
  publishedAt?: string
}

export type FrontendProduct = {
  id?: number
  name: string
  slug: string
  price: number
  currency: string
  summary?: string
  cover?: FrontendMedia | null
  gallery?: FrontendMedia[]
  content?: string
}

export type FrontendMedia = {
  url: string
  alt: string
  width?: number
  height?: number
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
      heroTitle: 'GeekClaw 专业内容站与商城后台',
      heroDescription:
        '这一版开始不再做临时页，而是直接按 Payload 体系建设完整后台，统一管理官网、博客、专题页和商品。',
      seoTitle: 'GeekClaw',
      seoDescription: 'GeekClaw 内容站、专题页、博客与商城后台',
    },
    bailongma: {
      title: '白龙马专题页',
      slug: 'bailongma',
      heroTitle: '白龙马专题页',
      heroDescription:
        '这一页将对标参考专题站，但不做静态硬编码站点。后续会由 Payload 后台的 pages 集合驱动。',
      seoTitle: '白龙马专题页',
      seoDescription: '白龙马专题页将由 Payload 后台统一管理和发布。',
      sections: [
        {
          type: 'hero',
          eyebrow: 'AI Partner',
          title: '白龙马专题页',
          description: '更适合招商、品牌、活动和专题落地页的区块化结构。',
          primaryLabel: '查看商城方案',
          primaryHref: '/shop',
          secondaryLabel: '阅读博客',
          secondaryHref: '/blog',
        },
        {
          type: 'featureGrid',
          heading: '页面结构',
          description: '在 Payload 后台中拆成明确区块，方便运营同学调整内容。',
          items: [
            { title: '首屏 Hero', body: '主标题、副标题、行动按钮和品牌立场。' },
            { title: '优势模块', body: '把卖点拆成卡片，适合 B 端专题页表达。' },
            { title: '转化区块', body: '最终用 CTA 把用户引导到咨询或下单。' },
          ],
        },
        {
          type: 'stats',
          heading: '适合的使用场景',
          items: [
            { value: '2F', label: '二级专题页面' },
            { value: 'B2B', label: '企业内容表达' },
            { value: 'CMS', label: '后台可运营更新' },
          ],
        },
      ],
      blocks: [
        {
          heading: 'Hero 区块',
          body: '主标题、副标题、主按钮、首屏主视觉',
        },
        {
          heading: '内容区块',
          body: '图文交错、卡片模块、优势描述、FAQ',
        },
        {
          heading: '可运营化',
          body: '支持后台改文案、换图、发布博客与专题联动',
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
      summary: '适用于需要官网、专题页、商城和内容后台一体化管理的团队。',
      content: '这是企业部署方案示例详情。后续将由 products 集合和订单流程驱动。',
    },
    {
      name: '白龙马专题页方案',
      slug: 'bailongma-landing-kit',
      price: 2999,
      currency: 'CNY',
      summary: '面向单个专题页、招商页或品牌宣传二级页面的专项交付包。',
      content: '这是白龙马专题页方案详情示例，用于衔接商城与专题内容。',
    },
  ],
}

async function getFrontendDataSource(): Promise<FrontendDataSource> {
  try {
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

    const posts = postsResult.docs.map((post) => ({
      title: post.title,
      slug: post.slug,
      category: post.category ?? undefined,
      excerpt: post.excerpt ?? lexicalToPlainText(post.content).slice(0, 140),
      cover: resolveMedia(post.cover),
      content: lexicalToPlainText(post.content),
      publishedAt: post.publishedAt ?? undefined,
    }))

    const products = productsResult.docs.map((product) => ({
      name: product.name,
      id: product.id,
      slug: product.slug,
      price: product.price,
      currency: product.currency,
      summary: product.summary ?? undefined,
      cover: resolveMedia(product.cover),
      gallery:
        product.gallery
          ?.map((item) => resolveMedia(item.image))
          .filter((item): item is FrontendMedia => Boolean(item)) ?? [],
      content: lexicalToPlainText(product.content),
    }))

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

export async function getPageBySlug(slug: string): Promise<FrontendPage | null> {
  const data = await getFrontendDataSource()
  return data.pages[slug] ?? null
}

export async function listPosts(): Promise<FrontendPost[]> {
  const data = await getFrontendDataSource()
  return data.posts
}

export async function getPostBySlug(slug: string): Promise<FrontendPost | null> {
  const data = await getFrontendDataSource()
  return data.posts.find((item) => item.slug === slug) ?? null
}

export async function listProducts(): Promise<FrontendProduct[]> {
  const data = await getFrontendDataSource()
  return data.products
}

export async function getProductBySlug(slug: string): Promise<FrontendProduct | null> {
  const data = await getFrontendDataSource()
  return data.products.find((item) => item.slug === slug) ?? null
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
