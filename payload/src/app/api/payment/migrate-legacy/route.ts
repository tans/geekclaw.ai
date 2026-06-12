import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureRole } from '@/lib/access'
import { migrateLegacyPaymentConfig } from '@/lib/site'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const auth = await payload.auth({ headers: request.headers })
    ensureRole(auth.user ? ({ user: auth.user } as never) : undefined, ['super-admin', 'ops'])

    const result = await migrateLegacyPaymentConfig()

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PAYMENT_MIGRATION_FAILED'
    const status =
      code === 'FORBIDDEN'
        ? 403
        : code === 'LEGACY_PAYMENT_EMPTY'
          ? 400
          : 500

    return NextResponse.json({ error: code }, { status })
  }
}
