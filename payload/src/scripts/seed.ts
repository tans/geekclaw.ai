import { getPayload } from 'payload'
import config from '../payload.config.ts'
import {
  defaultPages,
  defaultPostCategories,
  defaultPostTags,
  defaultPosts,
  defaultPaymentSettings,
  defaultProductCategories,
  defaultProductTags,
  defaultProducts,
  defaultSiteSettings,
} from '../lib/seed/default-content.ts'
import { ensureTaxonomySchema } from '../lib/taxonomy-schema.ts'

async function seed() {
  ensureTaxonomySchema()
  const payload = await getPayload({ config })

  const existingAdmin = await payload.find({
    collection: 'users',
    limit: 1,
    pagination: false,
  }).catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  if (!existingAdmin.docs[0] && process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const username = process.env.SEED_ADMIN_USERNAME || process.env.SEED_ADMIN_EMAIL.split('@')[0] || 'root'

    await payload.create({
      collection: 'users',
      draft: false,
      data: {
        username,
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
        role: 'super-admin',
      },
    })
    console.log(`[seed] created initial super-admin ${process.env.SEED_ADMIN_EMAIL}`)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: defaultSiteSettings,
  })
  console.log('[seed] updated global site-settings')

  await payload.updateGlobal({
    slug: 'payment-settings',
    data: defaultPaymentSettings,
  })
  console.log('[seed] updated global payment-settings')

  const postCategoryIdBySlug = new Map<string, number>()

  for (const category of defaultPostCategories) {
    const existing = await payload.find({
      collection: 'post-categories',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: category.slug,
        },
      },
    })

    const doc = existing.docs[0]
      ? await payload.update({
          collection: 'post-categories',
          id: existing.docs[0].id,
          data: category,
        })
      : await payload.create({
          collection: 'post-categories',
          data: category,
        })

    postCategoryIdBySlug.set(category.slug, doc.id)
    console.log(`[seed] ${existing.docs[0] ? 'updated' : 'created'} post category ${category.slug}`)
  }

  const productCategoryIdBySlug = new Map<string, number>()

  for (const category of defaultProductCategories) {
    const existing = await payload.find({
      collection: 'product-categories',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: category.slug,
        },
      },
    })

    const doc = existing.docs[0]
      ? await payload.update({
          collection: 'product-categories',
          id: existing.docs[0].id,
          data: category,
        })
      : await payload.create({
          collection: 'product-categories',
          data: category,
        })

    productCategoryIdBySlug.set(category.slug, doc.id)
    console.log(`[seed] ${existing.docs[0] ? 'updated' : 'created'} product category ${category.slug}`)
  }

  const postTagIdBySlug = new Map<string, number>()

  for (const tag of defaultPostTags) {
    const existing = await payload.find({
      collection: 'post-tags',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: tag.slug,
        },
      },
    })

    const doc = existing.docs[0]
      ? await payload.update({
          collection: 'post-tags',
          id: existing.docs[0].id,
          data: tag,
        })
      : await payload.create({
          collection: 'post-tags',
          data: tag,
        })

    postTagIdBySlug.set(tag.slug, doc.id)
    console.log(`[seed] ${existing.docs[0] ? 'updated' : 'created'} post tag ${tag.slug}`)
  }

  const productTagIdBySlug = new Map<string, number>()

  for (const tag of defaultProductTags) {
    const existing = await payload.find({
      collection: 'product-tags',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: tag.slug,
        },
      },
    })

    const doc = existing.docs[0]
      ? await payload.update({
          collection: 'product-tags',
          id: existing.docs[0].id,
          data: tag,
        })
      : await payload.create({
          collection: 'product-tags',
          data: tag,
        })

    productTagIdBySlug.set(tag.slug, doc.id)
    console.log(`[seed] ${existing.docs[0] ? 'updated' : 'created'} product tag ${tag.slug}`)
  }

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
    const normalizedPost = {
      ...post,
      primaryCategory: postCategoryIdBySlug.get('site-building') || post.primaryCategory,
      categories: [postCategoryIdBySlug.get('site-building') || post.primaryCategory].filter(
        (value): value is number => typeof value === 'number' && value > 0,
      ),
      tags: [postTagIdBySlug.get('payload'), postTagIdBySlug.get('migration')].filter(
        (value): value is number => typeof value === 'number' && value > 0,
      ),
    }

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
        data: normalizedPost,
      })
      console.log(`[seed] updated post ${post.slug}`)
    } else {
      await payload.create({
        collection: 'posts',
        data: normalizedPost,
      })
      console.log(`[seed] created post ${post.slug}`)
    }
  }

  for (const product of defaultProducts) {
    const normalizedProduct = {
      ...product,
      primaryCategory: productCategoryIdBySlug.get('enterprise-solutions') || product.primaryCategory,
      categories: [productCategoryIdBySlug.get('enterprise-solutions') || product.primaryCategory].filter(
        (value): value is number => typeof value === 'number' && value > 0,
      ),
      tags: [productTagIdBySlug.get('delivery-plan'), productTagIdBySlug.get('enterprise-grade')].filter(
        (value): value is number => typeof value === 'number' && value > 0,
      ),
    }

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
        data: normalizedProduct,
      })
      console.log(`[seed] updated product ${product.slug}`)
    } else {
      await payload.create({
        collection: 'products',
        data: normalizedProduct,
      })
      console.log(`[seed] created product ${product.slug}`)
    }
  }
}

seed().catch((error) => {
  console.error('[payload seed] failed', error)
  process.exit(1)
})
