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

export function ensureSiteSettingsSchema() {
  if (ensured) {
    return
  }

  const db = new DatabaseSync(getDatabasePath())

  try {
    const columns = db.prepare('pragma table_info(site_settings)').all() as Array<{ name: string }>
    const names = new Set(columns.map((column) => column.name))

    if (!names.has('payment_seller_id')) {
      db.exec('alter table site_settings add column payment_seller_id text')
    }

    ensured = true
  } finally {
    db.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureSiteSettingsSchema()
  console.log('site settings schema ensured')
}
