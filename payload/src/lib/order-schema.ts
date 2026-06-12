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

export function ensureOrdersSchema() {
  if (ensured) {
    return
  }

  const db = new DatabaseSync(getDatabasePath())

  try {
    const columns = db.prepare('pragma table_info(orders)').all() as Array<{ name: string }>
    const names = new Set(columns.map((column) => column.name))

    if (!names.has('payment_last_error')) {
      db.exec('alter table orders add column payment_last_error text')
    }

    if (!names.has('payment_events')) {
      db.exec('alter table orders add column payment_events text')
    }

    if (!names.has('payment_chain_tags')) {
      db.exec('alter table orders add column payment_chain_tags text')
    }

    if (!names.has('payment_has_issue')) {
      db.exec('alter table orders add column payment_has_issue integer default 0')
    }

    if (!names.has('payment_has_notify_issue')) {
      db.exec('alter table orders add column payment_has_notify_issue integer default 0')
    }

    if (!names.has('payment_has_return_record')) {
      db.exec('alter table orders add column payment_has_return_record integer default 0')
    }

    if (!names.has('payment_has_query_record')) {
      db.exec('alter table orders add column payment_has_query_record integer default 0')
    }

    if (!names.has('payment_has_final_result')) {
      db.exec('alter table orders add column payment_has_final_result integer default 0')
    }

    if (!names.has('fulfillment_status')) {
      db.exec("alter table orders add column fulfillment_status text default 'pending'")
    }

    if (!names.has('delivery_method')) {
      db.exec("alter table orders add column delivery_method text default 'digital'")
    }

    if (!names.has('tracking_no')) {
      db.exec('alter table orders add column tracking_no text')
    }

    if (!names.has('delivery_note')) {
      db.exec('alter table orders add column delivery_note text')
    }

    if (!names.has('fulfilled_at')) {
      db.exec('alter table orders add column fulfilled_at text')
    }

    ensured = true
  } finally {
    db.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureOrdersSchema()
  console.log('orders schema ensured')
}
