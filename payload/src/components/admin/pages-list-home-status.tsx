import type { BeforeListServerProps } from 'payload'

export default async function PagesListHomeStatus(props: BeforeListServerProps) {
  const siteSettings = await props.payload
    .findGlobal({
      slug: 'site-settings',
      depth: 1,
    })
    .catch(() => null)

  const featuredPages = Array.isArray(siteSettings?.home?.featuredPages) ? siteSettings.home.featuredPages : []
  const featuredItems = featuredPages
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const title = typeof item.title === 'string' ? item.title : '未命名页面'
      const slug = typeof item.slug === 'string' ? item.slug : ''

      return {
        title,
        slug,
        href: slug ? (slug === 'home' ? '/' : `/${slug}`) : '/admin/collections/pages',
      }
    })
    .filter((item): item is { title: string; slug: string; href: string } => Boolean(item))

  const docs = Array.isArray(props.data?.docs) ? props.data.docs : []
  const currentPageMatches = docs
    .map((doc) => {
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const title = typeof doc?.title === 'string' ? doc.title : '未命名页面'

      if (!slug || !featuredItems.some((item) => item.slug === slug)) {
        return null
      }

      return {
        slug,
        title,
        href: slug === 'home' ? '/' : `/${slug}`,
      }
    })
    .filter((item): item is { slug: string; title: string; href: string } => Boolean(item))

  return (
    <section
      style={{
        marginBottom: 20,
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
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>首页推荐页面协同</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            当前首页手动推荐了 {featuredItems.length} 个页面。这里会提示本页结果里哪些页面已经上首页，减少在 `site-settings` 和页面列表之间反复核对。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/globals/site-settings" style={buttonPrimary}>
            编辑首页推荐
          </a>
          <a href="/" style={buttonSecondary}>
            查看前台首页
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <MetricCard label="已手动推荐页面" value={String(featuredItems.length)} note={featuredItems.length ? '首页会优先使用这些页面' : '当前未手动配置，将按回退规则取页面'} tone={featuredItems.length ? '#265b35' : '#8a5b12'} />
        <MetricCard label="当前页命中推荐" value={String(currentPageMatches.length)} note={currentPageMatches.length ? '这些页面已经在首页推荐中' : '当前列表这一页没有命中首页推荐页面'} tone={currentPageMatches.length ? '#265b35' : '#6f6661'} />
      </div>

      <ListCard
        title="首页推荐页面"
        emptyText="当前没有手动推荐页面。前台会优先尝试 `bailongma` 和 `home`，再回退到已发布页面。"
        items={featuredItems.map((item) => ({
          title: item.title,
          note: item.slug ? `slug: ${item.slug}` : '未读取到 slug',
          href: item.href,
        }))}
      />
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

function ListCard({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: Array<{
    title: string
    note: string
    href: string
  }>
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: '#faf8f7',
        padding: 16,
        display: 'grid',
        gap: 12,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
      {items.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item) => (
            <a
              key={`${item.title}-${item.href}`}
              href={item.href}
              style={{
                borderRadius: 14,
                border: '1px solid rgba(20,20,20,0.08)',
                padding: '12px 14px',
                textDecoration: 'none',
                color: '#1d1a17',
                background: '#fff',
                display: 'grid',
                gap: 6,
              }}
            >
              <strong>{item.title}</strong>
              <span style={{ color: '#6f6661', fontSize: 13 }}>{item.note}</span>
            </a>
          ))}
        </div>
      ) : (
        <div style={{ color: '#4f4742', lineHeight: 1.7 }}>{emptyText}</div>
      )}
    </div>
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
