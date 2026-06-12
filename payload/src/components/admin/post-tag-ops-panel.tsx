import type { BeforeListServerProps } from 'payload'

export default async function PostTagOpsPanel(props: BeforeListServerProps) {
  const [tagsResult, postsResult] = await Promise.all([
    props.payload
      .find({
        collection: 'post-tags',
        depth: 0,
        limit: 100,
        pagination: false,
        sort: 'name',
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload
      .find({
        collection: 'posts',
        depth: 1,
        limit: 200,
        pagination: false,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
  ])

  const tagCounts = new Map<number, number>()

  for (const post of postsResult.docs) {
    const tags = Array.isArray(post.tags) ? post.tags : []

    for (const tag of tags) {
      const id = getRelationshipId(tag)

      if (!id) {
        continue
      }

      tagCounts.set(id, (tagCounts.get(id) || 0) + 1)
    }
  }

  const tagSummaries = tagsResult.docs
    .map((tag) => {
      const id = typeof tag.id === 'number' ? tag.id : 0
      const name = typeof tag.name === 'string' ? tag.name : ''

      if (!id || !name) {
        return null
      }

      return {
        id,
        name,
        total: tagCounts.get(id) || 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b?.total || 0) - (a?.total || 0))

  return (
    <section style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={eyebrowStyle}>Tag Ops</p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>文章标签运营</h2>
          <p style={descStyle}>标签适合观点、专题、阶段性话题和跨分类内容聚合。这里提供标签使用概况和快捷筛选入口。</p>
        </div>
        <a href="/admin/collections/post-tags" style={buttonPrimary}>
          管理文章标签
        </a>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a href="/admin/collections/posts" style={chipPrimary}>
          全部文章
        </a>
        {tagSummaries.map((tag) => (
          <a key={tag?.id} href={`/admin/collections/posts?where[tags][contains]=${encodeURIComponent(String(tag?.id || 0))}`} style={chipSecondary}>
            #{tag?.name} ({tag?.total || 0})
          </a>
        ))}
      </div>
    </section>
  )
}

function getRelationshipId(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return 0
  }

  const id = 'id' in value ? value.id : 0
  return typeof id === 'number' ? id : 0
}

const panelStyle = {
  marginBottom: 20,
  border: '1px solid rgba(20,20,20,0.08)',
  borderRadius: 20,
  background: '#fff',
  padding: 20,
  display: 'grid',
  gap: 16,
} as const

const eyebrowStyle = {
  margin: 0,
  color: '#b42318',
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
} as const

const descStyle = {
  margin: '10px 0 0',
  color: '#4f4742',
  lineHeight: 1.7,
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

const chipPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 14px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
} as const

const chipSecondary = {
  ...chipPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
