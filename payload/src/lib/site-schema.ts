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

    if (!names.has('home_eyebrow')) {
      db.exec("alter table site_settings add column home_eyebrow text default 'GeekClaw AI Agent'")
    }

    if (!names.has('home_hero_title')) {
      db.exec("alter table site_settings add column home_hero_title text default '一个 7 x 24 小时帮团队干活的 AI Agent'")
    }

    if (!names.has('home_hero_description')) {
      db.exec("alter table site_settings add column home_hero_description text")
    }

    if (!names.has('home_primary_action_label')) {
      db.exec("alter table site_settings add column home_primary_action_label text default '预约演示'")
    }

    if (!names.has('home_primary_action_href')) {
      db.exec("alter table site_settings add column home_primary_action_href text default 'mailto:team@geekclaw.ai?subject=GeekClaw%20演示预约'")
    }

    if (!names.has('home_secondary_action_label')) {
      db.exec("alter table site_settings add column home_secondary_action_label text default '查看部署方案'")
    }

    if (!names.has('home_secondary_action_href')) {
      db.exec("alter table site_settings add column home_secondary_action_href text default '/#deployment'")
    }

    if (!names.has('home_panel_eyebrow')) {
      db.exec("alter table site_settings add column home_panel_eyebrow text default 'Product System'")
    }

    if (!names.has('home_panel_title')) {
      db.exec("alter table site_settings add column home_panel_title text default '像助理一样理解任务，像系统一样稳定执行。'")
    }

    if (!names.has('home_panel_body')) {
      db.exec('alter table site_settings add column home_panel_body text')
    }

    if (!names.has('home_featured_pages_heading')) {
      db.exec("alter table site_settings add column home_featured_pages_heading text default '从聊天到行动的 Agent 能力'")
    }

    if (!names.has('home_featured_pages_description')) {
      db.exec('alter table site_settings add column home_featured_pages_description text')
    }

    if (!names.has('home_featured_posts_heading')) {
      db.exec("alter table site_settings add column home_featured_posts_heading text default '覆盖团队每天都会遇到的任务'")
    }

    if (!names.has('home_featured_posts_description')) {
      db.exec('alter table site_settings add column home_featured_posts_description text')
    }

    if (!names.has('home_featured_products_heading')) {
      db.exec("alter table site_settings add column home_featured_products_heading text default '部署与交付方式'")
    }

    if (!names.has('home_featured_products_description')) {
      db.exec('alter table site_settings add column home_featured_products_description text')
    }

    if (!names.has('home_cta_eyebrow')) {
      db.exec("alter table site_settings add column home_cta_eyebrow text default 'Start Building'")
    }

    if (!names.has('home_cta_title')) {
      db.exec("alter table site_settings add column home_cta_title text default '从一个可验收的 Agent 场景开始'")
    }

    if (!names.has('home_cta_description')) {
      db.exec('alter table site_settings add column home_cta_description text')
    }

    if (!names.has('home_cta_label')) {
      db.exec("alter table site_settings add column home_cta_label text default '预约部署评估'")
    }

    if (!names.has('home_cta_href')) {
      db.exec("alter table site_settings add column home_cta_href text default 'mailto:team@geekclaw.ai?subject=GeekClaw%20部署评估'")
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
