import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'price', 'stockQuantity', 'status'],
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
