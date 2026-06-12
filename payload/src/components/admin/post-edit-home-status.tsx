import type { BeforeDocumentControlsServerProps } from 'payload'
import { HomeFeatureToggle } from '@/components/admin/home-feature-toggle'
import { PublishReadinessCard } from '@/components/admin/publish-readiness-card'

export default async function PostEditHomeStatus(props: BeforeDocumentControlsServerProps) {
  const id = typeof props.id === 'number' || typeof props.id === 'string' ? Number(props.id) : 0

  if (!id) {
    return null
  }

  const [post, siteSettings] = await Promise.all([
    props.payload.findByID({
      collection: 'posts',
      id,
      depth: 0,
    }).catch(() => null),
    props.payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
    }).catch(() => null),
  ])

  if (!post) {
    return null
  }

  const featuredPosts = Array.isArray(siteSettings?.home?.featuredPosts) ? siteSettings.home.featuredPosts : []
  const isFeatured = featuredPosts.some((item) => typeof item === 'object' && item && Number(item.id) === post.id)
  const slug = typeof post.slug === 'string' ? post.slug : ''
  const frontendHref = slug ? `/blog/${slug}` : null
  const isPublished = post.status === 'published'
  const publishStatus = typeof post.status === 'string' ? post.status : 'unknown'
  const hasExcerpt = typeof post.excerpt === 'string' && post.excerpt.trim().length > 0
  const hasCategory = hasRelationshipName(post.primaryCategory)
  const hasPublishedAt = typeof post.publishedAt === 'string' && post.publishedAt.trim().length > 0
  const hasContent = Boolean(post.content && typeof post.content === 'object')
  const hasCover = Boolean(post.cover)
  const issues = [
    slug
      ? { label: `slug 已就绪：${slug}`, tone: 'success' as const }
      : { label: '缺少 slug，文章详情页无法访问。', tone: 'error' as const },
    hasExcerpt
      ? { label: '摘要已填写。', tone: 'success' as const }
      : { label: '缺少摘要，列表页和 SEO 摘要会偏弱。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasContent
      ? { label: '正文内容已填写。', tone: 'success' as const }
      : { label: '缺少正文内容，文章不适合发布。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasCategory
      ? { label: '分类已填写。', tone: 'success' as const }
      : { label: '未设置分类，建议补齐便于内容运营。', tone: 'warning' as const },
    hasPublishedAt || !isPublished
      ? { label: hasPublishedAt ? '发布时间已记录。' : '发布时间会在正式发布时自动补齐。', tone: 'success' as const }
      : { label: '已发布文章应具备发布时间。', tone: 'error' as const },
    hasCover
      ? { label: '文章封面已配置。', tone: 'success' as const }
      : { label: '建议补齐文章封面，列表页点击率会更稳定。', tone: 'warning' as const },
  ]
  const blockingIssues = issues.filter((issue) => issue.tone === 'error').length
  const readinessTone = blockingIssues ? 'error' : issues.some((issue) => issue.tone === 'warning') ? 'warning' : 'success'
  const readinessLabel = blockingIssues ? '当前不可稳妥发布' : readinessTone === 'warning' ? '可发布但建议补齐' : '发布就绪'

  return (
    <>
      <PublishReadinessCard
        title="文章发布就绪度"
        description="这里按博客详情页的真实使用方式检查摘要、正文和发布时间是否已经到位。"
        statusLabel={readinessLabel}
        statusTone={readinessTone}
        issues={issues}
      />

      <section
        style={{
          marginBottom: 16,
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 20,
          background: '#fff',
          padding: 20,
          display: 'grid',
          gap: 16,
        }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Home Featured Status
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>首页推荐协同</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            当前文章 {isFeatured ? '已进入首页推荐' : '尚未进入首页推荐'}。如果需要把这篇文章挂到首页内容区，请去首页配置维护推荐文章。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/globals/site-settings" style={buttonPrimary}>
            编辑首页推荐
          </a>
          {frontendHref ? (
            <a href={frontendHref} style={buttonSecondary}>
              打开前台文章
            </a>
          ) : null}
        </div>
      </div>

      {!isPublished && isFeatured ? (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid rgba(180,35,24,0.24)',
            background: '#fff3f1',
            padding: '14px 16px',
            color: '#7a271a',
            lineHeight: 1.7,
          }}
        >
          当前文章还未发布，但仍保留在首页推荐里。前台可能回退到其他已发布文章，建议先发布或从首页推荐移除。
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="推荐状态" value={isFeatured ? '已推荐' : '未推荐'} note={isFeatured ? '首页会优先使用这篇文章' : '当前只能通过文章列表或回退规则进入首页'} tone={isFeatured ? '#265b35' : '#8a5b12'} />
        <MetricCard
          label="发布状态"
          value={isPublished ? '已发布' : '草稿'}
          note={isPublished ? '允许加入首页推荐' : '草稿文章不能再加入首页推荐'}
          tone={isPublished ? '#265b35' : '#b42318'}
        />
        <MetricCard label="文章标题" value={typeof post.title === 'string' ? post.title : '未命名文章'} note={slug ? `slug: ${slug}` : '未设置 slug'} />
        <MetricCard label="当前状态值" value={publishStatus} note="用于核对文章保存状态和首页推荐资格" tone={isPublished ? '#1d1a17' : '#b42318'} />
      </div>

      <HomeFeatureToggle entityType="post" id={post.id} isFeatured={isFeatured} />
      </section>
    </>
  )
}

function MetricCard({
  label,
  value,
  note,
  tone = '#1d1a17',
}: {
  label: string
  value: string
  note: string
  tone?: string
}) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 16,
        background: '#fff',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
  )
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 120,
  padding: '10px 14px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
} as const

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const

function hasRelationshipName(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const name = 'name' in value ? value.name : ''
  return typeof name === 'string' && name.trim().length > 0
}
