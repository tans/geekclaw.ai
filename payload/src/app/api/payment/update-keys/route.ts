import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureRole } from '@/lib/access'
import { isPemLikePrivateKey, isPemLikePublicKey } from '@/lib/payment'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const auth = await payload.auth({ headers: request.headers })
    ensureRole(auth.user ? ({ user: auth.user } as never) : undefined, ['super-admin', 'ops'])

    const body = (await request.json()) as {
      privateKey?: string
      publicKey?: string
      clearPrivateKey?: boolean
      clearPublicKey?: boolean
    }

    const privateKey = typeof body.privateKey === 'string' ? body.privateKey.trim() : ''
    const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim() : ''
    const clearPrivateKey = body.clearPrivateKey === true
    const clearPublicKey = body.clearPublicKey === true

    if (privateKey && !isPemLikePrivateKey(privateKey)) {
      return NextResponse.json({ error: 'INVALID_PRIVATE_KEY_FORMAT' }, { status: 400 })
    }

    if (publicKey && !isPemLikePublicKey(publicKey)) {
      return NextResponse.json({ error: 'INVALID_PUBLIC_KEY_FORMAT' }, { status: 400 })
    }

    if (!privateKey && !publicKey && !clearPrivateKey && !clearPublicKey) {
      return NextResponse.json({ error: 'NO_KEY_CHANGES' }, { status: 400 })
    }

    const current = await payload.findGlobal({
      slug: 'payment-settings',
    })

    const nextPrivateKey = clearPrivateKey
      ? ''
      : privateKey || (typeof current.privateKey === 'string' ? current.privateKey : '')
    const nextPublicKey = clearPublicKey
      ? ''
      : publicKey || (typeof current.publicKey === 'string' ? current.publicKey : '')

    const currentPrivateKey = typeof current.privateKey === 'string' ? current.privateKey : ''
    const currentPublicKey = typeof current.publicKey === 'string' ? current.publicKey : ''

    if (nextPrivateKey === currentPrivateKey && nextPublicKey === currentPublicKey) {
      return NextResponse.json({ error: 'NO_KEY_CHANGES' }, { status: 400 })
    }

    await payload.updateGlobal({
      slug: 'payment-settings',
      data: {
        privateKey: nextPrivateKey,
        publicKey: nextPublicKey,
      },
    })

    return NextResponse.json(
      {
        updated: true,
        privateKeyUpdated: Boolean(privateKey),
        publicKeyUpdated: Boolean(publicKey),
        privateKeyCleared: clearPrivateKey,
        publicKeyCleared: clearPublicKey,
      },
      { status: 200 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PAYMENT_KEYS_UPDATE_FAILED'
    const status =
      code === 'FORBIDDEN' ||
      code === 'NO_KEY_CHANGES' ||
      code === 'INVALID_PRIVATE_KEY_FORMAT' ||
      code === 'INVALID_PUBLIC_KEY_FORMAT'
        ? code === 'FORBIDDEN'
          ? 403
          : 400
        : 500
    return NextResponse.json({ error: code }, { status })
  }
}
