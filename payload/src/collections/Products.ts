import type { CollectionConfig } from 'payload'
import { canAccessAdmin, canManageCommerce, canManageCommerceBoolean, hiddenFromRoles } from '@/lib/access'
import { buildSlugFromTitle, hasLexicalContent, normalizeSlugValue, normalizeText } from '@/lib/content-validation'

export const Products: CollectionConfig = {
  slug: 'products',
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
    defaultColumns: ['name', 'sku', 'price', 'stockQuantity', 'status'],
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/product-edit-home-status'],
      },
      beforeList: [
        '@/components/admin/product-inventory-ops-panel',
        '@/components/admin/product-taxonomy-ops-panel',
        '@/components/admin/product-tag-ops-panel',
        '@/components/admin/products-list-home-status',
      ],
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        const nextData = { ...(data || {}) } as Record<string, unknown>
        const name = normalizeText(nextData.name || originalDoc?.name)
        const slug = normalizeSlugValue(normalizeText(nextData.slug || originalDoc?.slug) || buildSlugFromTitle(name))
        const status = typeof nextData.status === 'string' ? nextData.status : originalDoc?.status
        const summary = normalizeText(nextData.summary || originalDoc?.summary)
        const content = nextData.content !== undefined ? nextData.content : originalDoc?.content
        const primaryCategory = nextData.primaryCategory ?? originalDoc?.primaryCategory
        const price =
          typeof nextData.price === 'number'
            ? nextData.price
            : typeof originalDoc?.price === 'number'
              ? originalDoc.price
              : null
        const currency = normalizeText(nextData.currency || originalDoc?.currency)
        const trackInventory = Boolean(nextData.trackInventory ?? originalDoc?.trackInventory)
        const allowBackorder = Boolean(nextData.allowBackorder ?? originalDoc?.allowBackorder)
        const stockQuantity =
          typeof nextData.stockQuantity === 'number'
            ? nextData.stockQuantity
            : typeof originalDoc?.stockQuantity === 'number'
              ? originalDoc.stockQuantity
              : 0
        const limitPerOrder =
          typeof nextData.limitPerOrder === 'number'
            ? nextData.limitPerOrder
            : typeof originalDoc?.limitPerOrder === 'number'
              ? originalDoc.limitPerOrder
              : null

        nextData.slug = slug

        if (!slug) {
          throw new Error('PRODUCT_SLUG_REQUIRED')
        }

        if (trackInventory && stockQuantity < 0) {
          throw new Error('PRODUCT_STOCK_INVALID')
        }

        if (limitPerOrder !== null && limitPerOrder < 1) {
          throw new Error('PRODUCT_LIMIT_INVALID')
        }

        if (status === 'active') {
          if (!primaryCategory) {
            throw new Error('PRODUCT_ACTIVE_REQUIRES_CATEGORY')
          }

          if (price === null || price < 0) {
            throw new Error('PRODUCT_ACTIVE_REQUIRES_PRICE')
          }

          if (!currency) {
            throw new Error('PRODUCT_ACTIVE_REQUIRES_CURRENCY')
          }

          if (!summary) {
            throw new Error('PRODUCT_ACTIVE_REQUIRES_SUMMARY')
          }

          if (!hasLexicalContent(content)) {
            throw new Error('PRODUCT_ACTIVE_REQUIRES_CONTENT')
          }

          if (trackInventory && stockQuantity <= 0 && !allowBackorder) {
            throw new Error('PRODUCT_ACTIVE_REQUIRES_STOCK_OR_BACKORDER')
          }
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
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'primaryCategory',
      type: 'relationship',
      relationTo: 'product-categories',
      admin: {
        description: '商城列表和导购筛选默认使用这个主分类。',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'product-categories',
      hasMany: true,
      admin: {
        description: '可用于多分类归档、专题筛选和首页商品编排。',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'product-tags',
      hasMany: true,
      admin: {
        description: '适合库存策略、硬件能力、部署形态和运营标签。',
      },
    },
    {
      name: 'sku',
      type: 'text',
      admin: {
        description: '给运营和履约使用的商品编号。',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'CNY',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'trackInventory',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '33%',
            description: '开启后，下单会按库存数校验可售数量。',
          },
        },
        {
          name: 'allowBackorder',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '33%',
            description: '库存不足时仍允许继续接单。',
          },
        },
        {
          name: 'stockQuantity',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            width: '33%',
            condition: (_, siblingData) => Boolean(siblingData?.trackInventory),
            description: '当前可售库存总量。',
          },
        },
      ],
    },
    {
      name: 'limitPerOrder',
      type: 'number',
      min: 1,
      admin: {
        description: '单笔订单最多可购买数量，留空表示不限制。',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '上架', value: 'active' },
        { label: '下架', value: 'archived' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
  ],
}
