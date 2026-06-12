import { NextResponse } from 'next/server'
import { toggleHomeFeaturedEntity } from '@/lib/site'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      entityType?: 'page' | 'post' | 'product'
      id?: number
      action?: 'add' | 'remove' | 'move-up' | 'move-down'
    }

    if (!body.entityType || (body.entityType !== 'page' && body.entityType !== 'post' && body.entityType !== 'product')) {
      return NextResponse.json({ error: 'INVALID_ENTITY_TYPE' }, { status: 400 })
    }

    const id = Number(body.id)

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'INVALID_ENTITY_ID' }, { status: 400 })
    }

    const action =
      body.action === 'remove' || body.action === 'move-up' || body.action === 'move-down'
        ? body.action
        : 'add'

    const result = await toggleHomeFeaturedEntity({
      entityType: body.entityType,
      id,
      action,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'HOME_FEATURE_TOGGLE_FAILED'
    const status = code === 'ENTITY_NOT_FOUND' ? 404 : code === 'ENTITY_NOT_PUBLISHABLE' ? 400 : 500
    return NextResponse.json({ error: code }, { status })
  }
}
