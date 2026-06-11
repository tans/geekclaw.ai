import { NextResponse } from 'next/server'
import { appendOrderPaymentEvent, markOrderFailed, markOrderPaid } from '@/lib/orders'
import { getSiteData } from '@/lib/site'
import { validateAlipayOrderResult, verifyAlipayNotify } from '@/lib/payment'

export async function POST(request: Request) {
  const raw = await request.text()
  const formData = new URLSearchParams(raw)
  const postData = Object.fromEntries(formData.entries())
  const site = await getSiteData()
  const orderNo = postData.out_trade_no
  const tradeNo = postData.trade_no
  const tradeStatus = postData.trade_status
  const sellerId = postData.seller_id

  if (!site.payment.publicKey) {
    if (orderNo) {
      await appendOrderPaymentEvent(orderNo, {
        createdAt: new Date().toISOString(),
        source: 'alipay-notify',
        type: 'notify_error',
        message: '收到支付宝 notify，但当前服务端未配置支付宝公钥。',
        status: 'missing_public_key',
        payload: postData,
      }).catch(() => undefined)
    }

    return new NextResponse('missing public key', { status: 400 })
  }

  if (!tradeStatus) {
    if (orderNo) {
      await appendOrderPaymentEvent(orderNo, {
        createdAt: new Date().toISOString(),
        source: 'alipay-notify',
        type: 'notify_invalid',
        message: '支付宝 notify 缺少 trade_status。',
        status: 'missing_trade_status',
        payload: postData,
      }).catch(() => undefined)
    }

    return new NextResponse('missing trade_status', { status: 400 })
  }

  let isValid = false

  try {
    isValid = verifyAlipayNotify({
      appId: site.payment.appId || 'mock-app-id',
      publicKey: site.payment.publicKey,
      postData,
    })
  } catch (error) {
    if (orderNo) {
      await appendOrderPaymentEvent(orderNo, {
        createdAt: new Date().toISOString(),
        source: 'alipay-notify',
        type: 'notify_invalid',
        message: `支付宝 notify 验签异常：${error instanceof Error ? error.message : 'unknown error'}`,
        status: 'verify_exception',
        payload: postData,
      }).catch(() => undefined)
    }

    return new NextResponse('invalid sign', { status: 400 })
  }
  if (!isValid) {
    if (orderNo) {
      await appendOrderPaymentEvent(orderNo, {
        createdAt: new Date().toISOString(),
        source: 'alipay-notify',
        type: 'notify_invalid',
        message: '支付宝 notify 验签失败。',
        status: 'invalid_sign',
        payload: postData,
      }).catch(() => undefined)
    }

    return new NextResponse('invalid sign', { status: 400 })
  }

  if (!orderNo) {
    return new NextResponse('missing order', { status: 400 })
  }

  const validation = await validateAlipayOrderResult({
    orderNo,
    appId: site.payment.appId,
    sellerId: site.payment.sellerId,
    totalAmount: postData.total_amount,
    postData,
  })

  if (!validation.ok) {
    await appendOrderPaymentEvent(orderNo, {
      createdAt: new Date().toISOString(),
      source: 'alipay-notify',
      type: 'notify_invalid',
      message: `支付宝 notify 业务校验失败：${validation.message}`,
      status: validation.code,
      payload: postData,
    }).catch(() => undefined)

    return new NextResponse(validation.code.toLowerCase(), { status: validation.code === 'ORDER_NOT_FOUND' ? 404 : 400 })
  }

  const paid = tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED'
  const closed = tradeStatus === 'TRADE_CLOSED'

  if (!paid && !closed) {
    await appendOrderPaymentEvent(orderNo, {
      createdAt: new Date().toISOString(),
      source: 'alipay-notify',
      type: 'notify_invalid',
      message: `支付宝 notify 返回了未支持的交易状态：${tradeStatus}`,
      status: 'unsupported_trade_status',
      payload: postData,
    }).catch(() => undefined)

    return new NextResponse('unsupported trade_status', { status: 400 })
  }

  try {
    await appendOrderPaymentEvent(orderNo, {
      createdAt: new Date().toISOString(),
      source: 'alipay-notify',
      type: 'notify_received',
      message: '已收到支付宝异步通知。',
      status: tradeStatus || 'unknown',
      payload: postData,
    })

    if (paid) {
      await markOrderPaid({
        orderNo,
        paymentPayload: postData,
        tradeNo,
        source: 'alipay-notify',
        message: '支付宝异步通知确认支付成功。',
      })
    } else {
      await markOrderFailed({
        orderNo,
        paymentPayload: postData,
        source: 'alipay-notify',
        message: sellerId
          ? `支付宝异步通知确认交易关闭：${tradeStatus}`
          : `支付宝异步通知返回非成功状态：${tradeStatus || 'unknown'}`,
        status: tradeStatus || 'unknown',
      })
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ORDER_UPDATE_FAILED'

    if (code === 'ORDER_NOT_FOUND') {
      return new NextResponse('order not found', { status: 404 })
    }

    if (code === 'ORDER_CANCELLED') {
      await appendOrderPaymentEvent(orderNo, {
        createdAt: new Date().toISOString(),
        source: 'alipay-notify',
        type: 'notify_invalid',
        message: '支付宝异步通知到达时，订单已被取消，已拒绝回写支付成功。',
        status: 'order_cancelled',
        payload: postData,
      }).catch(() => undefined)

      return new NextResponse('order cancelled', { status: 409 })
    }

    return new NextResponse('order update failed', { status: 500 })
  }

  return new NextResponse('success', { status: 200 })
}
