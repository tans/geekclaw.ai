import type { CollectionConfig } from 'payload'
import { canAccessAdmin, canManageContent, canManageContentBoolean, hiddenFromRoles } from '@/lib/access'
import { buildSlugFromTitle, normalizeSlugValue, normalizeText } from '@/lib/content-validation'

export const PostCategories: CollectionConfig = {
  slug: 'post-categories',
  access: {
    admin: canManageContentBoolean,
    create: canManageContent,
    delete: canManageContent,
    read: canAccessAdmin,
    update: canManageContent,
  },
  admin: {
    useAsTitle: 'name',
    hidden: hiddenFromRoles(['super-admin', 'editor']),
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Taxonomy',
    components: {
      beforeList: ['@/components/admin/post-taxonomy-ops-panel'],
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        const nextData = { ...(data || {}) } as Record<string, unknown>
        const name = normalizeText(nextData.name || originalDoc?.name)
        const slug = normalizeSlugValue(normalizeText(nextData.slug || originalDoc?.slug) || buildSlugFromTitle(name))

        nextData.slug = slug

        if (!name) {
          throw new Error('POST_CATEGORY_NAME_REQUIRED')
        }

        if (!slug) {
          throw new Error('POST_CATEGORY_SLUG_REQUIRED')
        }

        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'name',
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
      name: 'description',
      type: 'textarea',
    },
  ],
}
