import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

let ensured = false

function getDatabasePath() {
  const configured = process.env.DATABASE_URI

  if (configured?.startsWith('file:')) {
    return configured.slice(5)
  }

  if (configured && !configured.includes(':')) {
    return configured
  }

  return path.resolve(process.cwd(), '.payload/geekclaw.db')
}

export function ensureTaxonomySchema() {
  if (ensured) {
    return
  }

  const db = new DatabaseSync(getDatabasePath())

  try {
    db.exec(`
      create table if not exists post_categories (
        id integer primary key not null,
        name text not null,
        slug text not null unique,
        description text,
        updated_at text default (current_timestamp) not null,
        created_at text default (current_timestamp) not null
      )
    `)

    db.exec(`
      create table if not exists product_categories (
        id integer primary key not null,
        name text not null,
        slug text not null unique,
        description text,
        updated_at text default (current_timestamp) not null,
        created_at text default (current_timestamp) not null
      )
    `)

    db.exec(`
      create table if not exists post_tags (
        id integer primary key not null,
        name text not null,
        slug text not null unique,
        description text,
        updated_at text default (current_timestamp) not null,
        created_at text default (current_timestamp) not null
      )
    `)

    db.exec(`
      create table if not exists product_tags (
        id integer primary key not null,
        name text not null,
        slug text not null unique,
        description text,
        updated_at text default (current_timestamp) not null,
        created_at text default (current_timestamp) not null
      )
    `)

    db.exec(`
      create table if not exists posts_rels (
        id integer primary key not null,
        "order" integer,
        parent_id integer not null,
        path text not null,
        post_categories_id integer,
        post_tags_id integer,
        foreign key (parent_id) references posts(id) on update no action on delete cascade,
        foreign key (post_categories_id) references post_categories(id) on update no action on delete cascade,
        foreign key (post_tags_id) references post_tags(id) on update no action on delete cascade
      )
    `)
    db.exec('create index if not exists posts_rels_order_idx on posts_rels ("order")')
    db.exec('create index if not exists posts_rels_parent_idx on posts_rels (parent_id)')
    db.exec('create index if not exists posts_rels_path_idx on posts_rels (path)')

    const postRelColumns = db.prepare('pragma table_info(posts_rels)').all() as Array<{ name: string }>
    const postRelNames = new Set(postRelColumns.map((column) => column.name))

    if (!postRelNames.has('post_categories_id')) {
      db.exec('alter table posts_rels add column post_categories_id integer')
    }

    if (!postRelNames.has('post_tags_id')) {
      db.exec('alter table posts_rels add column post_tags_id integer')
    }

    db.exec('create index if not exists posts_rels_post_categories_id_idx on posts_rels (post_categories_id)')
    db.exec('create index if not exists posts_rels_post_tags_id_idx on posts_rels (post_tags_id)')

    db.exec(`
      create table if not exists products_rels (
        id integer primary key not null,
        "order" integer,
        parent_id integer not null,
        path text not null,
        product_categories_id integer,
        product_tags_id integer,
        foreign key (parent_id) references products(id) on update no action on delete cascade,
        foreign key (product_categories_id) references product_categories(id) on update no action on delete cascade,
        foreign key (product_tags_id) references product_tags(id) on update no action on delete cascade
      )
    `)
    db.exec('create index if not exists products_rels_order_idx on products_rels ("order")')
    db.exec('create index if not exists products_rels_parent_idx on products_rels (parent_id)')
    db.exec('create index if not exists products_rels_path_idx on products_rels (path)')

    const productRelColumns = db.prepare('pragma table_info(products_rels)').all() as Array<{ name: string }>
    const productRelNames = new Set(productRelColumns.map((column) => column.name))

    if (!productRelNames.has('product_categories_id')) {
      db.exec('alter table products_rels add column product_categories_id integer')
    }

    if (!productRelNames.has('product_tags_id')) {
      db.exec('alter table products_rels add column product_tags_id integer')
    }

    db.exec('create index if not exists products_rels_product_categories_id_idx on products_rels (product_categories_id)')
    db.exec('create index if not exists products_rels_product_tags_id_idx on products_rels (product_tags_id)')

    const postColumns = db.prepare('pragma table_info(posts)').all() as Array<{ name: string }>
    const postColumnNames = new Set(postColumns.map((column) => column.name))

    if (!postColumnNames.has('primary_category_id')) {
      db.exec('alter table posts add column primary_category_id integer')
    }

    if (!postColumnNames.has('categories')) {
      db.exec('alter table posts add column categories text')
    }

    if (!postColumnNames.has('tags')) {
      db.exec('alter table posts add column tags text')
    }

    const productColumns = db.prepare('pragma table_info(products)').all() as Array<{ name: string }>
    const productColumnNames = new Set(productColumns.map((column) => column.name))

    if (!productColumnNames.has('primary_category_id')) {
      db.exec('alter table products add column primary_category_id integer')
    }

    if (!productColumnNames.has('categories')) {
      db.exec('alter table products add column categories text')
    }

    if (!productColumnNames.has('tags')) {
      db.exec('alter table products add column tags text')
    }

    const lockedDocumentRelColumns = db.prepare('pragma table_info(payload_locked_documents_rels)').all() as Array<{ name: string }>
    const lockedDocumentRelNames = new Set(lockedDocumentRelColumns.map((column) => column.name))

    if (!lockedDocumentRelNames.has('post_categories_id')) {
      db.exec('alter table payload_locked_documents_rels add column post_categories_id integer')
      db.exec('create index if not exists payload_locked_documents_rels_post_categories_id_idx on payload_locked_documents_rels (post_categories_id)')
    }

    if (!lockedDocumentRelNames.has('post_tags_id')) {
      db.exec('alter table payload_locked_documents_rels add column post_tags_id integer')
      db.exec('create index if not exists payload_locked_documents_rels_post_tags_id_idx on payload_locked_documents_rels (post_tags_id)')
    }

    if (!lockedDocumentRelNames.has('product_categories_id')) {
      db.exec('alter table payload_locked_documents_rels add column product_categories_id integer')
      db.exec('create index if not exists payload_locked_documents_rels_product_categories_id_idx on payload_locked_documents_rels (product_categories_id)')
    }

    if (!lockedDocumentRelNames.has('product_tags_id')) {
      db.exec('alter table payload_locked_documents_rels add column product_tags_id integer')
      db.exec('create index if not exists payload_locked_documents_rels_product_tags_id_idx on payload_locked_documents_rels (product_tags_id)')
    }

    const preferenceRelColumns = db.prepare('pragma table_info(payload_preferences_rels)').all() as Array<{ name: string }>
    const preferenceRelNames = new Set(preferenceRelColumns.map((column) => column.name))

    if (!preferenceRelNames.has('post_categories_id')) {
      db.exec('alter table payload_preferences_rels add column post_categories_id integer')
      db.exec('create index if not exists payload_preferences_rels_post_categories_id_idx on payload_preferences_rels (post_categories_id)')
    }

    if (!preferenceRelNames.has('post_tags_id')) {
      db.exec('alter table payload_preferences_rels add column post_tags_id integer')
      db.exec('create index if not exists payload_preferences_rels_post_tags_id_idx on payload_preferences_rels (post_tags_id)')
    }

    if (!preferenceRelNames.has('product_categories_id')) {
      db.exec('alter table payload_preferences_rels add column product_categories_id integer')
      db.exec('create index if not exists payload_preferences_rels_product_categories_id_idx on payload_preferences_rels (product_categories_id)')
    }

    if (!preferenceRelNames.has('product_tags_id')) {
      db.exec('alter table payload_preferences_rels add column product_tags_id integer')
      db.exec('create index if not exists payload_preferences_rels_product_tags_id_idx on payload_preferences_rels (product_tags_id)')
    }

    ensured = true
  } finally {
    db.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureTaxonomySchema()
  console.log('taxonomy schema ensured')
}
