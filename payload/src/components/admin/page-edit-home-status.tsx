import type { BeforeDocumentControlsServerProps } from 'payload'
import { HomeFeatureToggle } from '@/components/admin/home-feature-toggle'
import { PublishReadinessCard } from '@/components/admin/publish-readiness-card'

export default async function PageEditHomeStatus(props: BeforeDocumentControlsServerProps) {
  const id = typeof props.id === 'number' || typeof props.id === 'string' ? Number(props.id) : 0

  if (!id) {
    return null
  }

  const [page, siteSettings] = await Promise.all([
    props.payload.findByID({
      collection: 'pages',
      id,
      depth: 0,
    }).catch(() => null),
    props.payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
    }).catch(() => null),
  ])

  if (!page) {
    return null
  }

  const featuredPages = Array.isArray(siteSettings?.home?.featuredPages) ? siteSettings.home.featuredPages : []
  const isFeatured = featuredPages.some((item) => typeof item === 'object' && item && Number(item.id) === page.id)
  const slug = typeof page.slug === 'string' ? page.slug : ''
  const frontendHref = slug ? (slug === 'home' ? '/' : `/${slug}`) : null
  const isPublished = page.status === 'published'
  const publishStatus = typeof page.status === 'string' ? page.status : 'unknown'
  const hasHeroTitle = typeof page.heroTitle === 'string' && page.heroTitle.trim().length > 0
  const hasHeroDescription = typeof page.heroDescription === 'string' && page.heroDescription.trim().length > 0
  const hasSections = Array.isArray(page.sections) && page.sections.length > 0
  const hasBlocks = Array.isArray(page.blocks) && page.blocks.length > 0
  const hasSeoTitle = typeof page.seoTitle === 'string' && page.seoTitle.trim().length > 0
  const hasSeoDescription = typeof page.seoDescription === 'string' && page.seoDescription.trim().length > 0
  const hasHeroImage = Boolean(page.heroImage)
  const issues = [
    slug
      ? { label: `slug 已就绪：${slug}`, tone: 'success' as const }
      : { label: '缺少 slug，页面无法前台访问。', tone: 'error' as const },
    hasHeroTitle
      ? { label: 'Hero 标题已填写。', tone: 'success' as const }
      : { label: '建议补齐 Hero 标题，避免页面头部信息过弱。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasHeroDescription || hasSections || hasBlocks
      ? { label: '页面主体内容已存在。', tone: 'success' as const }
      : { label: '缺少页面正文、区块或说明文案，发布后会显得过空。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasSeoTitle
      ? { label: 'SEO 标题已填写。', tone: 'success' as const }
      : { label: 'SEO 标题未单独填写，发布时会回退到页面标题。', tone: 'warning' as const },
    hasSeoDescription || hasHeroDescription
      ? { label: 'SEO 描述已具备。', tone: 'success' as const }
      : { label: '缺少 SEO 描述或 Hero 描述，搜索摘要会偏弱。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasHeroImage
      ? { label: 'Hero 图片已配置。', tone: 'success' as const }
      : { label: '建议补齐 Hero 图片，页面首屏表现会更完整。', tone: 'warning' as const },
  ]
  const blockingIssues = issues.filter((issue) => issue.tone === 'error').length
  const readinessTone = blockingIssues ? 'error' : issues.some((issue) => issue.tone === 'warning') ? 'warning' : 'success'
  const readinessLabel = blockingIssues ? '当前不可稳妥发布' : readinessTone === 'warning' ? '可发布但建议补齐' : '发布就绪'

  return (
    <>
      <PublishReadinessCard
        title="页面发布就绪度"
        description="这里按当前前台真实约束检查页面是否适合发布，以及是否还缺少 SEO 和正文信息。"
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
            当前页面 {isFeatured ? '已进入首页推荐' : '尚未进入首页推荐'}。如果需要把这个页面放到首页重点入口，请去首页配置维护推荐页面。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/globals/site-settings" style={buttonPrimary}>
            编辑首页推荐
          </a>
          {frontendHref ? (
            <a href={frontendHref} style={buttonSecondary}>
              打开前台页面
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
          当前页面还是草稿，但仍保留在首页推荐里。前台可能回退到其他已发布页面，建议先发布或从首页推荐移除。
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="推荐状态" value={isFeatured ? '已推荐' : '未推荐'} note={isFeatured ? '首页会优先使用这条页面入口' : '当前只能通过页面列表或回退规则进入首页'} tone={isFeatured ? '#265b35' : '#8a5b12'} />
        <MetricCard
          label="发布状态"
          value={isPublished ? '已发布' : '草稿'}
          note={isPublished ? '允许加入首页推荐' : '草稿页面不能再加入首页推荐'}
          tone={isPublished ? '#265b35' : '#b42318'}
        />
        <MetricCard label="页面标题" value={typeof page.title === 'string' ? page.title : '未命名页面'} note={slug ? `slug: ${slug}` : '未设置 slug'} />
        <MetricCard label="当前状态值" value={publishStatus} note="用于核对页面保存状态和首页推荐资格" tone={isPublished ? '#1d1a17' : '#b42318'} />
      </div>

      <HomeFeatureToggle entityType="page" id={page.id} isFeatured={isFeatured} />
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
