import type { ServerProps } from 'payload'
import { buildContentGovernanceSummary, type GovernanceIssue } from '@/lib/content-governance'

export default async function ContentQualityPanel(props: ServerProps) {
  const [siteSettings, pages, posts, products, media] = await Promise.all([
    props.payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
    }).catch(() => null),
    props.payload
      .find({
        collection: 'pages',
        depth: 1,
        limit: 50,
        pagination: false,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload
      .find({
        collection: 'posts',
        depth: 1,
        limit: 50,
        pagination: false,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload
      .find({
        collection: 'products',
        depth: 1,
        limit: 50,
        pagination: false,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload
      .find({
        collection: 'media',
        depth: 0,
        limit: 50,
        pagination: false,
        sort: '-updatedAt',
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
  ])
  const summary = buildContentGovernanceSummary({
    pages: pages.docs as never[],
    posts: posts.docs as never[],
    products: products.docs as never[],
    media: media.docs as never[],
    siteSettings: siteSettings as never,
  })

  const pageIssues = summary.pageIssues
  const postIssues = summary.postIssues
  const productIssues = summary.productIssues
  const mediaIssues = summary.mediaIssues

  return (
    <section
      style={{
        marginBottom: 24,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 24,
        background: '#fff',
        padding: 24,
        display: 'grid',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={eyebrowStyle}>Content Quality</p>
          <h1 style={{ margin: '12px 0 0', fontSize: 30, lineHeight: 1.2 }}>内容质量与素材治理</h1>
          <p style={descStyle}>
            这里集中暴露缺封面、摘要偏弱、SEO 描述不足和素材 alt / 尺寸问题，帮助运营快速补齐前台表现最明显的短板。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/content-governance" style={buttonPrimary}>
            打开治理台
          </a>
          <a href="/admin/media-governance" style={buttonPrimary}>
            素材治理台
          </a>
          <a href="/admin/collections/media" style={buttonPrimary}>
            管理素材库
          </a>
          <a href="/admin/collections/posts" style={buttonSecondary}>
            管理文章
          </a>
          <a href="/admin/collections/products" style={buttonSecondary}>
            管理商品
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="页面质量问题" value={String(pageIssues.length)} tone={pageIssues.length ? '#b42318' : '#265b35'} />
        <MetricCard label="文章质量问题" value={String(postIssues.length)} tone={postIssues.length ? '#b42318' : '#265b35'} />
        <MetricCard label="商品质量问题" value={String(productIssues.length)} tone={productIssues.length ? '#b42318' : '#265b35'} />
        <MetricCard label="素材质量问题" value={String(mediaIssues.length)} tone={mediaIssues.length ? '#b42318' : '#265b35'} />
        <MetricCard label="未引用素材" value={String(summary.metrics.unusedMediaCount)} tone={summary.metrics.unusedMediaCount ? '#b42318' : '#265b35'} />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <IssueCard title="页面待处理" items={pageIssues.slice(0, 6)} emptyText="当前没有明显的页面质量问题。" />
        <IssueCard title="文章待处理" items={postIssues.slice(0, 6)} emptyText="当前没有明显的文章质量问题。" />
        <IssueCard title="商品待处理" items={productIssues.slice(0, 6)} emptyText="当前没有明显的商品质量问题。" />
        <IssueCard title="素材待处理" items={mediaIssues.slice(0, 6)} emptyText="当前没有明显的素材质量问题。" />
      </div>
    </section>
  )
}

function IssueCard({
  title,
  items,
  emptyText,
}: {
  title: string
  items: GovernanceIssue[]
  emptyText: string
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 18,
        display: 'grid',
        gap: 12,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      {items.length ? (
        items.map((item) => (
          <a
            key={`${item.href}-${item.title}`}
            href={item.href}
            style={{
              borderRadius: 16,
              border: item.severity === 'error' ? '1px solid rgba(180,35,24,0.12)' : '1px solid rgba(138,91,18,0.12)',
              background: item.severity === 'error' ? '#fff8f7' : '#fffaf2',
              padding: '12px 14px',
              textDecoration: 'none',
              color: '#1d1a17',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{item.title}</strong>
            <span style={{ color: item.severity === 'error' ? '#8a2f16' : '#8a5b12', fontSize: 13 }}>{item.note}</span>
          </a>
        ))
      ) : (
        <div style={{ borderRadius: 14, background: '#f7f4f3', padding: '12px 14px', color: '#5c5048', lineHeight: 1.7 }}>{emptyText}</div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '16px 18px',
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: '#6f6661' }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 700, color: tone }}>{value}</p>
    </div>
  )
}

const eyebrowStyle = {
  margin: 0,
  color: '#b42318',
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
} as const

const descStyle = {
  margin: '12px 0 0',
  color: '#5c5048',
  lineHeight: 1.8,
} as const

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
