import { getPayload } from 'payload'
import config from '../payload.config.ts'
import {
  defaultPages,
  defaultPosts,
  defaultProducts,
  defaultSiteSettings,
} from '../lib/seed/default-content.ts'

async function seed() {
  const payload = await getPayload({ config })

  const existingAdmin = await payload.find({
    collection: "users",
    limit: 1,
    pagination: false,
  }).catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  if (!existingAdmin.docs[0] && process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const username = process.env.SEED_ADMIN_USERNAME || process.env.SEED_ADMIN_EMAIL.split("@")[0] || "root"

    await payload.create({
      collection: "users",
      draft: false,
      data: {
        username,
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
        role: "super-admin",
      },
    })
    console.log("[seed] created initial super-admin " + process.env.SEED_ADMIN_EMAIL)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: defaultSiteSettings,
  })
  console.log('[seed] updated global site-settings')

  for (const page of defaultPages) {
    const existing = await payload.find({
      collection: 'pages',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: page.slug,
        },
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: page,
      })
      console.log(`[seed] updated page ${page.slug}`)
    } else {
      await payload.create({
        collection: 'pages',
        data: page,
      })
      console.log(`[seed] created page ${page.slug}`)
    }
  }

  for (const post of defaultPosts) {
    const existing = await payload.find({
      collection: 'posts',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: post.slug,
        },
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'posts',
        id: existing.docs[0].id,
        data: post,
      })
      console.log(`[seed] updated post ${post.slug}`)
    } else {
      await payload.create({
        collection: 'posts',
        data: post,
      })
      console.log(`[seed] created post ${post.slug}`)
    }
  }

  for (const product of defaultProducts) {
    const existing = await payload.find({
      collection: 'products',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: product.slug,
        },
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'products',
        id: existing.docs[0].id,
        data: product,
      })
      console.log(`[seed] updated product ${product.slug}`)
    } else {
      await payload.create({
        collection: 'products',
        data: product,
      })
      console.log(`[seed] created product ${product.slug}`)
    }
  }
}

seed().catch((error) => {
  console.error('[payload seed] failed', error)
  process.exit(1)
})
