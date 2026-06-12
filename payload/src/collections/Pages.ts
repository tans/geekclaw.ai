import type { CollectionConfig } from 'payload'
import { canAccessAdmin, canManageContent, canManageContentBoolean, hiddenFromRoles } from '@/lib/access'
import { buildSlugFromTitle, hasLexicalContent, isReservedGenericPageSlug, normalizeSlugValue, normalizeText } from '@/lib/content-validation'

export const Pages: CollectionConfig = {
  slug: 'pages',
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
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/page-edit-home-status'],
      },
      beforeList: ['@/components/admin/pages-list-home-status'],
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, operation }) => {
        const nextData = { ...(data || {}) } as Record<string, unknown>
        const title = normalizeText(nextData.title || originalDoc?.title)
        const currentSlug = normalizeText(nextData.slug || originalDoc?.slug)
        const slug = normalizeSlugValue(currentSlug || buildSlugFromTitle(title))
        const status = typeof nextData.status === 'string' ? nextData.status : originalDoc?.status
        const heroTitle = normalizeText(nextData.heroTitle || originalDoc?.heroTitle)
        const heroDescription = normalizeText(nextData.heroDescription || originalDoc?.heroDescription)
        const seoTitle = normalizeText(nextData.seoTitle || originalDoc?.seoTitle)
        const seoDescription = normalizeText(nextData.seoDescription || originalDoc?.seoDescription)
        const blocks: unknown[] = Array.isArray(nextData.blocks)
          ? nextData.blocks
          : Array.isArray(originalDoc?.blocks)
            ? originalDoc.blocks
            : []
        const sections: unknown[] = Array.isArray(nextData.sections)
          ? nextData.sections
          : Array.isArray(originalDoc?.sections)
            ? originalDoc.sections
            : []
        const hasBlocks = blocks.some((block: unknown) => {
          if (!block || typeof block !== 'object') {
            return false
          }

          const heading = normalizeText((block as { heading?: unknown }).heading)
          const body = (block as { body?: unknown }).body
          return Boolean(heading || hasLexicalContent(body))
        })
        const hasSections = sections.length > 0

        nextData.slug = slug

        if (!slug) {
          throw new Error('PAGE_SLUG_REQUIRED')
        }

        if (slug !== 'home' && isReservedGenericPageSlug(slug)) {
          throw new Error('PAGE_SLUG_RESERVED')
        }

        if (status === 'published') {
          if (!heroTitle && !title) {
            throw new Error('PAGE_PUBLISH_REQUIRES_TITLE')
          }

          if (!heroDescription && !hasBlocks && !hasSections) {
            throw new Error('PAGE_PUBLISH_REQUIRES_CONTENT')
          }

          if (!seoTitle) {
            nextData.seoTitle = heroTitle || title
          }

          if (!seoDescription) {
            const fallbackDescription = heroDescription

            if (!fallbackDescription) {
              throw new Error('PAGE_PUBLISH_REQUIRES_SEO_DESCRIPTION')
            }

            nextData.seoDescription = fallbackDescription
          }
        }

        if (operation === 'create' && !nextData.heroTitle && title) {
          nextData.heroTitle = title
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
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
      ],
      required: true,
    },
    {
      name: 'heroTitle',
      type: 'text',
    },
    {
      name: 'heroDescription',
      type: 'textarea',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'blocks',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'body', type: 'richText' },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: [
        {
          slug: 'hero',
          labels: {
            singular: 'Hero',
            plural: 'Hero',
          },
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'primaryLabel', type: 'text' },
            { name: 'primaryHref', type: 'text' },
            { name: 'secondaryLabel', type: 'text' },
            { name: 'secondaryHref', type: 'text' },
          ],
        },
        {
          slug: 'featureGrid',
          labels: {
            singular: 'Feature Grid',
            plural: 'Feature Grids',
          },
          fields: [
            { name: 'heading', type: 'text' },
            { name: 'description', type: 'textarea' },
            {
              name: 'items',
              type: 'array',
              required: true,
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'textarea' },
              ],
            },
          ],
        },
        {
          slug: 'stats',
          labels: {
            singular: 'Stats',
            plural: 'Stats',
          },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'items',
              type: 'array',
              required: true,
              fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          slug: 'cta',
          labels: {
            singular: 'CTA',
            plural: 'CTAs',
          },
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'buttonLabel', type: 'text' },
            { name: 'buttonHref', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'seoTitle',
      type: 'text',
    },
    {
      name: 'seoDescription',
      type: 'textarea',
    },
  ],
}
