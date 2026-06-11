import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
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
