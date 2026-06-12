import path from 'node:path'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { isSuperAdmin, isSuperAdminBoolean } from './lib/access.ts'
import { Pages } from './collections/Pages.ts'
import { PostCategories } from './collections/PostCategories.ts'
import { PostTags } from './collections/PostTags.ts'
import { Posts } from './collections/Posts.ts'
import { ProductCategories } from './collections/ProductCategories.ts'
import { ProductTags } from './collections/ProductTags.ts'
import { Products } from './collections/Products.ts'
import { Orders } from './collections/Orders.ts'
import { Media } from './collections/Media.ts'
import { PaymentSettings } from './globals/PaymentSettings.ts'
import { SiteSettings } from './globals/SiteSettings.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '..')
const defaultDatabasePath = `file:${path.resolve(projectRoot, '.payload/geekclaw.db')}`

export default buildConfig({
  admin: {
    user: 'users',
    components: {
      beforeDashboard: [
        '@/components/admin/merchant-overview-panel',
        '@/components/admin/content-ops-panel',
        '@/components/admin/content-quality-panel',
        '@/components/admin/inventory-governance-panel',
        '@/components/admin/payment-status-panel',
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'geekclaw-payload-dev-secret',
  sharp,
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || defaultDatabasePath,
    },
  }),
  collections: [
    {
      slug: 'users',
      auth: {
        loginWithUsername: {
          allowEmailLogin: true,
          requireEmail: true,
          requireUsername: true,
        },
      },
      access: {
        admin: isSuperAdminBoolean,
        create: isSuperAdmin,
        delete: isSuperAdmin,
        read: isSuperAdmin,
        update: isSuperAdmin,
      },
      admin: {
        useAsTitle: 'username',
        hidden: ({ user }) => {
          const role = user && typeof user === 'object' && 'role' in user ? user.role : null
          return role !== 'super-admin'
        },
      },
      fields: [
        {
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'editor',
          options: [
            { label: '超级管理员', value: 'super-admin' },
            { label: '运营', value: 'ops' },
            { label: '内容编辑', value: 'editor' },
          ],
        },
      ],
    },
    Media,
    Pages,
    PostCategories,
    PostTags,
    Posts,
    ProductCategories,
    ProductTags,
    Products,
    Orders,
  ],
  globals: [SiteSettings, PaymentSettings],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
