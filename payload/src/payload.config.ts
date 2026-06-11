import path from 'node:path'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { Pages } from './collections/Pages.ts'
import { Posts } from './collections/Posts.ts'
import { Products } from './collections/Products.ts'
import { Orders } from './collections/Orders.ts'
import { Media } from './collections/Media.ts'
import { SiteSettings } from './globals/SiteSettings.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '..')
const defaultDatabasePath = `file:${path.resolve(projectRoot, '.payload/geekclaw.db')}`

export default buildConfig({
  admin: {
    user: 'users',
    components: {
      beforeDashboard: ['@/components/admin/payment-status-panel'],
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
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [],
    },
    Media,
    Pages,
    Posts,
    Products,
    Orders,
  ],
  globals: [SiteSettings],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
