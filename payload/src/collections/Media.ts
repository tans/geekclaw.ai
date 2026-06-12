import type { CollectionConfig } from 'payload'
import { canAccessAdmin, canAccessAdminBoolean, canManageContent } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    admin: canAccessAdminBoolean,
    create: canManageContent,
    delete: canManageContent,
    read: canAccessAdmin,
    update: canManageContent,
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'card',
        width: 1200,
        height: 800,
        position: 'centre',
      },
    ],
    adminThumbnail: 'card',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
