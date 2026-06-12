import type { CollectionConfig } from 'payload'
import { canAccessAdmin, canManageCommerce, canManageCommerceBoolean, hiddenFromRoles } from '@/lib/access'
import { buildSlugFromTitle, normalizeSlugValue, normalizeText } from '@/lib/content-validation'

export const ProductTags: CollectionConfig = {
  slug: 'product-tags',
  access: {
    admin: canManageCommerceBoolean,
    create: canManageCommerce,
    delete: canManageCommerce,
    read: canAccessAdmin,
    update: canManageCommerce,
  },
  admin: {
    useAsTitle: 'name',
    hidden: hiddenFromRoles(['super-admin', 'ops']),
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Taxonomy',
    components: {
      beforeList: ['@/components/admin/product-tag-ops-panel'],
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
          throw new Error('PRODUCT_TAG_NAME_REQUIRED')
        }

        if (!slug) {
          throw new Error('PRODUCT_TAG_SLUG_REQUIRED')
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
