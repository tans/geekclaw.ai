import { AlipaySdk } from 'alipay-sdk'
import { getOrderByOrderNo } from '@/lib/orders'

export type PaymentProvider = 'alipay'

export type CreatePaymentOrderInput = {
  mode?: 'mock' | 'redirect'
  appId?: string
  gateway?: string
  privateKey?: string
  publicKey?: string
  orderNo: string
  subject: string
  amount: number
  returnUrl: string
  notifyUrl: string
}

export type CreatePaymentOrderResult = {
  provider: PaymentProvider
  paymentUrl: string
  isMock: boolean
  payload: Record<string, unknown>
}

export async function createAlipayPaymentOrder(
  input: CreatePaymentOrderInput,
): Promise<CreatePaymentOrderResult> {
  const mode = input.mode || 'mock'

  if (mode === 'redirect') {
    const appId = input.appId?.trim()
    const privateKey = input.privateKey?.trim()
    const publicKey = input.publicKey?.trim()

    if (appId && privateKey && publicKey) {
      const sdk = new AlipaySdk({
        appId,
        privateKey,
        alipayPublicKey: publicKey,
        gateway: input.gateway || 'https://openapi.alipay.com/gateway.do',
      })

      const paymentUrl = sdk.pageExecute('alipay.trade.page.pay', 'GET', {
        notifyUrl: input.notifyUrl,
        returnUrl: input.returnUrl,
        bizContent: {
          outTradeNo: input.orderNo,
          productCode: 'FAST_INSTANT_TRADE_PAY',
          subject: input.subject,
          totalAmount: input.amount.toFixed(2),
        },
      })

      return {
        provider: 'alipay',
        paymentUrl,
        isMock: false,
        payload: {
          outTradeNo: input.orderNo,
          subject: input.subject,
          totalAmount: input.amount.toFixed(2),
          notifyUrl: input.notifyUrl,
          returnUrl: input.returnUrl,
          gateway: input.gateway || 'https://openapi.alipay.com/gateway.do',
        },
      }
    }

    const query = new URLSearchParams({
      outTradeNo: input.orderNo,
      subject: input.subject,
      totalAmount: String(input.amount),
      notifyUrl: input.notifyUrl,
      returnUrl: input.returnUrl,
    })

    return {
      provider: 'alipay',
      paymentUrl: `/pay/alipay/redirect?${query.toString()}`,
      isMock: true,
      payload: Object.fromEntries(query.entries()),
    }
  }

  return {
    provider: 'alipay',
    paymentUrl: `/pay/mock/${input.orderNo}`,
    isMock: true,
    payload: {
      subject: input.subject,
      amount: input.amount,
      notifyUrl: input.notifyUrl,
      returnUrl: input.returnUrl,
      mode,
    },
  }
}

export function verifyAlipayNotify(input: {
  appId: string
  publicKey: string
  postData: Record<string, string>
}) {
  const sdk = new AlipaySdk({
    appId: input.appId,
    privateKey: 'mock-private-key',
    alipayPublicKey: input.publicKey,
  })

  return sdk.checkNotifySign(input.postData)
}

export async function validateAlipayOrderResult(input: {
  orderNo: string
  appId?: string
  sellerId?: string
  totalAmount?: string
  postData?: Record<string, string>
}) {
  const order = await getOrderByOrderNo(input.orderNo)

  if (!order) {
    return {
      ok: false as const,
      code: 'ORDER_NOT_FOUND',
      message: '订单不存在。',
      order: null,
    }
  }

  const expectedAmount = order.totalAmount.toFixed(2)
  const normalizedAmount = normalizeAmount(input.totalAmount)

  if (input.appId?.trim()) {
    const payloadAppId = input.postData?.app_id?.trim()

    if (payloadAppId && payloadAppId !== input.appId.trim()) {
      return {
        ok: false as const,
        code: 'APP_ID_MISMATCH',
        message: `支付宝回调 app_id 不匹配，期望 ${input.appId.trim()}，实际 ${payloadAppId}。`,
        order,
      }
    }
  }

  if (input.sellerId?.trim()) {
    const payloadSellerId = input.postData?.seller_id?.trim()

    if (!payloadSellerId) {
      return {
        ok: false as const,
        code: 'SELLER_ID_MISSING',
        message: '支付宝回调缺少 seller_id。',
        order,
      }
    }

    if (payloadSellerId !== input.sellerId.trim()) {
      return {
        ok: false as const,
        code: 'SELLER_ID_MISMATCH',
        message: `支付宝回调 seller_id 不匹配，期望 ${input.sellerId.trim()}，实际 ${payloadSellerId}。`,
        order,
      }
    }
  }

  if (normalizedAmount && normalizedAmount !== expectedAmount) {
    return {
      ok: false as const,
      code: 'TOTAL_AMOUNT_MISMATCH',
      message: `支付宝回调金额不匹配，期望 ${expectedAmount}，实际 ${normalizedAmount}。`,
      order,
    }
  }

  return {
    ok: true as const,
    code: 'OK',
    message: '支付宝回调业务字段校验通过。',
    order,
  }
}

function normalizeAmount(value: string | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed)) {
    return trimmed
  }

  return parsed.toFixed(2)
}
