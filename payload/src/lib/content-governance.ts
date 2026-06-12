import type { Media, Page, Post, Product, SiteSetting } from '@/payload-types'

export type GovernanceIssue = {
  href: string
  title: string
  note: string
  severity: 'warning' | 'error'
}

export type GovernanceMetric = {
  total: number
  errors: number
  warnings: number
}

export type ContentGovernanceSummary = {
  pageIssues: GovernanceIssue[]
  postIssues: GovernanceIssue[]
  productIssues: GovernanceIssue[]
  mediaIssues: GovernanceIssue[]
  mediaUsage: {
    assetId: number
    title: string
    alt: string
    href: string
    width: number
    height: number
    usageCount: number
    usedIn: string[]
    isUnused: boolean
  }[]
  metrics: {
    pages: GovernanceMetric
    posts: GovernanceMetric
    products: GovernanceMetric
    media: GovernanceMetric
    unusedMediaCount: number
  }
}

export function buildContentGovernanceSummary(input: {
  pages: Page[]
  posts: Post[]
  products: Product[]
  media: Media[]
  siteSettings?: SiteSetting | null
}): ContentGovernanceSummary {
  const mediaUsageMap = buildMediaUsageMap({
    pages: input.pages,
    posts: input.posts,
    products: input.products,
    siteSettings: input.siteSettings || null,
  })

  const pageIssues = input.pages
    .map((page) => {
      const softProblems: string[] = []
      const hardProblems: string[] = []

      if (!hasMedia(page.heroImage)) {
        softProblems.push('缺 Hero 图')
      }

      if (!hasEnoughText(page.seoTitle, 8)) {
        softProblems.push('SEO 标题偏弱')
      }

      if (!hasEnoughText(page.seoDescription, 50)) {
        softProblems.push('SEO 描述偏弱')
      }

      if (page.status === 'published' && !hasEnoughText(page.heroDescription, 30)) {
        hardProblems.push('已发布页面首屏描述偏弱')
      }

      return buildIssue(`/admin/collections/pages/${page.id}`, asText(page.title) || '未命名页面', hardProblems, softProblems)
    })
    .filter((item): item is GovernanceIssue => Boolean(item))

  const postIssues = input.posts
    .map((post) => {
      const softProblems: string[] = []
      const hardProblems: string[] = []

      if (!hasMedia(post.cover)) {
        softProblems.push('缺封面')
      }

      if (!hasEnoughText(post.excerpt, 50)) {
        softProblems.push('摘要偏弱')
      }

      if (post.status === 'published' && !post.primaryCategory) {
        hardProblems.push('已发布文章缺主分类')
      }

      return buildIssue(`/admin/collections/posts/${post.id}`, asText(post.title) || '未命名文章', hardProblems, softProblems)
    })
    .filter((item): item is GovernanceIssue => Boolean(item))

  const productIssues = input.products
    .map((product) => {
      const softProblems: string[] = []
      const hardProblems: string[] = []

      if (!hasMedia(product.cover)) {
        softProblems.push('缺封面')
      }

      if (!Array.isArray(product.gallery) || product.gallery.length === 0) {
        softProblems.push('缺商品图库')
      }

      if (!hasEnoughText(product.summary, 40)) {
        softProblems.push('摘要偏弱')
      }

      if (product.status === 'active' && !product.primaryCategory) {
        hardProblems.push('已上架商品缺主分类')
      }

      return buildIssue(`/admin/collections/products/${product.id}`, asText(product.name) || '未命名商品', hardProblems, softProblems)
    })
    .filter((item): item is GovernanceIssue => Boolean(item))

  const mediaIssues = input.media
    .map((item) => {
      const width = typeof item.width === 'number' ? item.width : 0
      const height = typeof item.height === 'number' ? item.height : 0
      const softProblems: string[] = []
      const hardProblems: string[] = []
      const usage = mediaUsageMap.get(item.id)

      if (!hasEnoughText(item.alt, 4)) {
        softProblems.push('alt 太短')
      }

      if (width > 0 && height > 0 && width < 1200) {
        softProblems.push('宽度偏小')
      }

      if (width > 0 && height > 0 && width < 800) {
        hardProblems.push('素材过小')
      }

      if (!usage || usage.usageCount === 0) {
        softProblems.push('未被引用')
      }

      return buildIssue(
        `/admin/collections/media/${item.id}`,
        asText(item.filename) || asText(item.alt) || '未命名素材',
        hardProblems,
        softProblems,
      )
    })
    .filter((item): item is GovernanceIssue => Boolean(item))

  return {
    pageIssues,
    postIssues,
    productIssues,
    mediaIssues,
    mediaUsage: input.media
      .map((item) => {
        const usage = mediaUsageMap.get(item.id)
        return {
          assetId: item.id,
          title: asText(item.filename) || asText(item.alt) || '未命名素材',
          alt: asText(item.alt),
          href: `/admin/collections/media/${item.id}`,
          width: typeof item.width === 'number' ? item.width : 0,
          height: typeof item.height === 'number' ? item.height : 0,
          usageCount: usage?.usageCount || 0,
          usedIn: usage?.usedIn || [],
          isUnused: !usage || usage.usageCount === 0,
        }
      })
      .sort((a, b) => {
        if (Number(b.isUnused) !== Number(a.isUnused)) {
          return Number(b.isUnused) - Number(a.isUnused)
        }

        return a.usageCount - b.usageCount
      }),
    metrics: {
      pages: buildMetric(pageIssues),
      posts: buildMetric(postIssues),
      products: buildMetric(productIssues),
      media: buildMetric(mediaIssues),
      unusedMediaCount: input.media.filter((item) => {
        const usage = mediaUsageMap.get(item.id)
        return !usage || usage.usageCount === 0
      }).length,
    },
  }
}

type MediaUsageEntry = {
  usageCount: number
  usedIn: string[]
}

function buildMediaUsageMap(input: {
  pages: Page[]
  posts: Post[]
  products: Product[]
  siteSettings: SiteSetting | null
}) {
  const map = new Map<number, MediaUsageEntry>()

  const addUsage = (mediaValue: unknown, label: string) => {
    const mediaId = readMediaId(mediaValue)

    if (!mediaId) {
      return
    }

    const current = map.get(mediaId) || { usageCount: 0, usedIn: [] }
    current.usageCount += 1

    if (!current.usedIn.includes(label)) {
      current.usedIn.push(label)
    }

    map.set(mediaId, current)
  }

  for (const page of input.pages) {
    addUsage(page.heroImage, `页面 Hero: ${page.title || '未命名页面'}`)

    for (const block of page.blocks || []) {
      addUsage(block?.image, `页面区块: ${page.title || '未命名页面'}`)
    }
  }

  for (const post of input.posts) {
    addUsage(post.cover, `文章封面: ${post.title || '未命名文章'}`)
  }

  for (const product of input.products) {
    addUsage(product.cover, `商品封面: ${product.name || '未命名商品'}`)

    for (const item of product.gallery || []) {
      addUsage(item?.image, `商品图库: ${product.name || '未命名商品'}`)
    }
  }

  if (input.siteSettings) {
    addUsage(input.siteSettings.logo, '站点 Logo')
  }

  return map
}

function buildIssue(href: string, title: string, hardProblems: string[], softProblems: string[]) {
  const issues = [...hardProblems, ...softProblems]

  if (!issues.length) {
    return null
  }

  return {
    href,
    title,
    note: issues.join(' · '),
    severity: hardProblems.length ? 'error' : 'warning',
  } satisfies GovernanceIssue
}

function buildMetric(items: GovernanceIssue[]): GovernanceMetric {
  return {
    total: items.length,
    errors: items.filter((item) => item.severity === 'error').length,
    warnings: items.filter((item) => item.severity === 'warning').length,
  }
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function hasEnoughText(value: unknown, minLength: number) {
  return asText(value).length >= minLength
}

function hasMedia(value: unknown) {
  if (!value) {
    return false
  }

  if (typeof value === 'number') {
    return value > 0
  }

  if (typeof value !== 'object') {
    return false
  }

  const id = 'id' in value ? value.id : 0
  return typeof id === 'number' ? id > 0 : false
}

function readMediaId(value: unknown) {
  if (!value) {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'object') {
    return 0
  }

  const id = 'id' in value ? value.id : 0
  return typeof id === 'number' ? id : 0
}
