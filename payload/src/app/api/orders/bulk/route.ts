import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureRole, hasSystemAuthorization } from '@/lib/access'
import { cancelOrder, reviewProcessingOrder, updateOrderFulfillment } from '@/lib/orders'

type BulkAction =
  | 'cancel'
  | 'mark-processing'
  | 'mark-completed'
  | 'mark-paid'
  | 'mark-failed'

export async function POST(request: Request) {
  try {
    if (!hasSystemAuthorization(request.headers)) {
      const payload = await getPayload({ config })
      const auth = await payload.auth({ headers: request.headers })
      ensureRole(auth.user ? ({ user: auth.user } as never) : undefined, ['super-admin', 'ops'])
    }

    const body = (await request.json()) as {
      orderNos?: string[]
      action?: BulkAction
    }

    const orderNos = Array.isArray(body.orderNos)
      ? body.orderNos.map((value) => value.trim()).filter(Boolean)
      : []

    if (!orderNos.length || !body.action) {
      return NextResponse.json({ error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 })
    }

    if (orderNos.length > 50) {
      return NextResponse.json({ error: 'TOO_MANY_ORDERS' }, { status: 400 })
    }

    const results = await Promise.all(
      orderNos.map(async (orderNo) => {
        try {
          switch (body.action) {
            case 'cancel': {
              const order = await cancelOrder({
                orderNo,
                source: 'operator',
                reason: '后台批量取消订单，库存占用已释放。',
              })

              return {
                orderNo,
                ok: true,
                status: order.status,
                paymentStatus: order.paymentStatus,
              }
            }
            case 'mark-processing': {
              const order = await updateOrderFulfillment({
                orderNo,
                fulfillmentStatus: 'processing',
              })

              return {
                orderNo,
                ok: true,
                status: order.status,
                fulfillmentStatus: order.fulfillmentStatus,
              }
            }
            case 'mark-completed': {
              const order = await updateOrderFulfillment({
                orderNo,
                fulfillmentStatus: 'completed',
              })

              return {
                orderNo,
                ok: true,
                status: order.status,
                fulfillmentStatus: order.fulfillmentStatus,
              }
            }
            case 'mark-paid': {
              const order = await reviewProcessingOrder({
                orderNo,
                outcome: 'paid',
                reason: '后台批量复核后确认该订单已支付。',
              })

              return {
                orderNo,
                ok: true,
                status: order.status,
                paymentStatus: order.paymentStatus,
              }
            }
            case 'mark-failed': {
              const order = await reviewProcessingOrder({
                orderNo,
                outcome: 'failed',
                reason: '后台批量复核后确认该订单支付失败。',
              })

              return {
                orderNo,
                ok: true,
                status: order.status,
                paymentStatus: order.paymentStatus,
              }
            }
            default:
              throw new Error('UNSUPPORTED_ACTION')
          }
        } catch (error) {
          return {
            orderNo,
            ok: false,
            error: error instanceof Error ? error.message : 'BULK_OPERATION_FAILED',
          }
        }
      }),
    )

    return NextResponse.json(
      {
        action: body.action,
        totalCount: orderNos.length,
        successCount: results.filter((item) => item.ok).length,
        failureCount: results.filter((item) => !item.ok).length,
        results,
      },
      { status: 200 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'BULK_OPERATION_FAILED'
    return NextResponse.json({ error: code }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}
