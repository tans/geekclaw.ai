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

export function ensureProductsSchema() {
  if (ensured) {
    return
  }

  const db = new DatabaseSync(getDatabasePath())

  try {
    const columns = db.prepare('pragma table_info(products)').all() as Array<{ name: string }>
    const names = new Set(columns.map((column) => column.name))

    if (!names.has('sku')) {
      db.exec('alter table products add column sku text')
    }

    if (!names.has('track_inventory')) {
      db.exec('alter table products add column track_inventory integer default 0')
    }

    if (!names.has('stock_quantity')) {
      db.exec('alter table products add column stock_quantity numeric default 0')
    }

    if (!names.has('allow_backorder')) {
      db.exec('alter table products add column allow_backorder integer default 0')
    }

    if (!names.has('limit_per_order')) {
      db.exec('alter table products add column limit_per_order numeric')
    }

    ensured = true
  } finally {
    db.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureProductsSchema()
  console.log('products schema ensured')
}
