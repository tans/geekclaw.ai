import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { buildContentGovernanceSummary } from '@/lib/content-governance'
import type { Media, Page, Post, Product, SiteSetting } from '@/payload-types'

export default async function MediaGovernancePage() {
  const payload = await getPayload({ config })
  const [pages, posts, products, media, siteSettings] = await Promise.all([
    payload.find({ collection: 'pages', depth: 1, limit: 200, pagination: false, sort: '-updatedAt' }),
    payload.find({ collection: 'posts', depth: 1, limit: 200, pagination: false, sort: '-updatedAt' }),
    payload.find({ collection: 'products', depth: 1, limit: 200, pagination: false, sort: '-updatedAt' }),
    payload.find({ collection: 'media', depth: 0, limit: 200, pagination: false, sort: '-updatedAt' }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }).catch(() => null),
  ])

  const summary = buildContentGovernanceSummary({
    pages: pages.docs as Page[],
    posts: posts.docs as Post[],
    products: products.docs as Product[],
    media: media.docs as Media[],
    siteSettings: siteSettings as SiteSetting | null,
  })

  const unusedAssets = summary.mediaUsage.filter((item) => item.isUnused)
  const lowUsageAssets = summary.mediaUsage.filter((item) => !item.isUnused && item.usageCount === 1)

  return (
    <main
      style={{
        padding: 24,
        display: 'grid',
        gap: 20,
        background: '#f5f5f3',
        minHeight: '100vh',
      }}
    >
      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 24,
          background: '#fff',
          padding: 24,
          display: 'grid',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={eyebrowStyle}>Media Governance</p>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>素材治理台</h1>
            <p style={descStyle}>
              这里集中看素材是否真的被页面、文章、商品或站点设置使用，帮助你清理未引用素材，也能快速定位哪些资源承担了前台关键展示。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Link href="/admin/collections/media" style={buttonPrimary}>
              管理素材库
            </Link>
            <Link href="/admin/content-governance" style={buttonSecondary}>
              内容治理台
            </Link>
            <Link href="/admin/globals/site-settings" style={buttonSecondary}>
              站点设置
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <MetricCard label="素材总数" value={String(summary.mediaUsage.length)} note="当前已收录素材" tone="#1d1a17" />
          <MetricCard label="未引用素材" value={String(summary.metrics.unusedMediaCount)} note="没有在页面、文章、商品或站点设置里使用" tone={summary.metrics.unusedMediaCount ? '#b42318' : '#265b35'} />
          <MetricCard label="低频素材" value={String(lowUsageAssets.length)} note="只被单处内容使用" tone={lowUsageAssets.length ? '#8a5b12' : '#265b35'} />
          <MetricCard label="质量问题素材" value={String(summary.metrics.media.total)} note="alt 或尺寸存在问题" tone={summary.metrics.media.total ? '#8a2f16' : '#265b35'} />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <UsageColumn title="未引用素材" emptyText="当前没有未引用素材。" items={unusedAssets.slice(0, 20)} />
        <UsageColumn title="低频素材" emptyText="当前没有只被单处使用的素材。" items={lowUsageAssets.slice(0, 20)} />
        <UsageColumn title="质量问题素材" emptyText="当前没有明显的素材质量问题。" items={summary.mediaUsage.filter((asset) => summary.mediaIssues.some((issue) => issue.href === asset.href)).slice(0, 20)} />
      </section>
    </main>
  )
}

function UsageColumn({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: Array<{
    assetId: number
    title: string
    alt: string
    href: string
    width: number
    height: number
    usageCount: number
    usedIn: string[]
    isUnused: boolean
  }>
}) {
  return (
    <section
      style={{
        borderRadius: 20,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 18,
        display: 'grid',
        gap: 12,
        alignContent: 'start',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
      {items.length ? (
        items.map((item) => (
          <Link
            key={item.assetId}
            href={item.href}
            style={{
              borderRadius: 16,
              border: item.isUnused ? '1px solid rgba(180,35,24,0.16)' : '1px solid rgba(20,20,20,0.08)',
              background: item.isUnused ? '#fff5f3' : '#faf8f7',
              padding: '12px 14px',
              textDecoration: 'none',
              color: '#1d1a17',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{item.title}</strong>
            <span style={{ color: '#6f6661', fontSize: 13 }}>
              alt: {item.alt || '未填写'} · 尺寸 {item.width || 0} x {item.height || 0}
            </span>
            <span style={{ color: item.isUnused ? '#b42318' : '#4f4742', fontSize: 13 }}>
              使用次数 {item.usageCount} {item.usedIn.length ? `· ${item.usedIn.slice(0, 2).join(' / ')}` : '· 当前未被引用'}
            </span>
          </Link>
        ))
      ) : (
        <div style={{ borderRadius: 14, background: '#f7f4f3', padding: '12px 14px', color: '#5c5048', lineHeight: 1.7 }}>{emptyText}</div>
      )}
    </section>
  )
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone: string
}) {
  return (
    <article
      style={{
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
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
