import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt'],
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
      name: 'category',
      type: 'text',
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
