import type { CollectionConfig } from 'payload'
import { canAccessAdmin, canManageContent, canManageContentBoolean, hiddenFromRoles } from '@/lib/access'
import { buildSlugFromTitle, hasLexicalContent, normalizeSlugValue, normalizeText } from '@/lib/content-validation'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    admin: canManageContentBoolean,
    create: canManageContent,
    delete: canManageContent,
    read: canAccessAdmin,
    update: canManageContent,
  },
  admin: {
    useAsTitle: 'title',
    hidden: hiddenFromRoles(['super-admin', 'editor']),
    defaultColumns: ['title', 'primaryCategory', 'publishedAt'],
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/post-edit-home-status'],
      },
      beforeList: [
        '@/components/admin/post-taxonomy-ops-panel',
        '@/components/admin/post-tag-ops-panel',
        '@/components/admin/posts-list-home-status',
      ],
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        const nextData = { ...(data || {}) } as Record<string, unknown>
        const title = normalizeText(nextData.title || originalDoc?.title)
        const slug = normalizeSlugValue(normalizeText(nextData.slug || originalDoc?.slug) || buildSlugFromTitle(title))
        const status = typeof nextData.status === 'string' ? nextData.status : originalDoc?.status
        const excerpt = normalizeText(nextData.excerpt || originalDoc?.excerpt)
        const content = nextData.content !== undefined ? nextData.content : originalDoc?.content
        const currentPublishedAt = nextData.publishedAt || originalDoc?.publishedAt
        const primaryCategory = nextData.primaryCategory ?? originalDoc?.primaryCategory

        nextData.slug = slug

        if (!slug) {
          throw new Error('POST_SLUG_REQUIRED')
        }

        if (status === 'published') {
          if (!primaryCategory) {
            throw new Error('POST_PUBLISH_REQUIRES_CATEGORY')
          }

          if (!excerpt) {
            throw new Error('POST_PUBLISH_REQUIRES_EXCERPT')
          }

          if (!hasLexicalContent(content)) {
            throw new Error('POST_PUBLISH_REQUIRES_CONTENT')
          }

          if (!currentPublishedAt) {
            nextData.publishedAt = new Date().toISOString()
          }
        }

        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'primaryCategory',
      type: 'relationship',
      relationTo: 'post-categories',
      admin: {
        description: '博客列表、详情页和内容筛选默认使用这个主分类。',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'post-categories',
      hasMany: true,
      admin: {
        description: '可用于扩展筛选、专题聚合和首页内容编排。',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'post-tags',
      hasMany: true,
      admin: {
        description: '适合观点、专题、阶段标签和跨分类内容聚合。',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
      ],
      required: true,
    },
  ],
}
