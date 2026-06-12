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

export type QueryPaymentOrderInput = {
  mode?: 'mock' | 'query'
  appId?: string
  gateway?: string
  privateKey?: string
  publicKey?: string
  orderNo: string
}

export type QueryPaymentOrderResult = {
  provider: PaymentProvider
  isMock: boolean
  tradeStatus: string | null
  tradeNo?: string
  buyerPayAmount?: string
  raw: Record<string, unknown>
}

export type AlipayRuntimeReadiness = {
  canUseRealPayment: boolean
  checks: Array<{
    key:
      | 'appId'
      | 'sellerId'
      | 'privateKey'
      | 'publicKey'
      | 'notifyUrl'
      | 'returnUrl'
      | 'gateway'
      | 'sdkInit'
      | 'pageExecute'
      | 'queryPrerequisite'
    label: string
    passed: boolean
    detail: string
  }>
}

function normalizePemLikeValue(value?: string) {
  return value?.trim() || ''
}

export function isPemLikePrivateKey(value?: string) {
  const normalized = normalizePemLikeValue(value)
  return normalized.includes('BEGIN') && normalized.includes('PRIVATE KEY')
}

export function isPemLikePublicKey(value?: string) {
  const normalized = normalizePemLikeValue(value)
  return normalized.includes('BEGIN') && normalized.includes('PUBLIC KEY')
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

export async function queryAlipayPaymentOrder(
  input: QueryPaymentOrderInput,
): Promise<QueryPaymentOrderResult> {
  const mode = input.mode || 'mock'

  if (mode === 'query') {
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

      const result = await sdk.exec('alipay.trade.query', {
        bizContent: {
          outTradeNo: input.orderNo,
        },
      })

      const response = ((result as Record<string, unknown>).alipayTradeQueryResponse ||
        result) as Record<string, unknown>

      return {
        provider: 'alipay',
        isMock: false,
        tradeStatus: typeof response.tradeStatus === 'string' ? response.tradeStatus : null,
        tradeNo: typeof response.tradeNo === 'string' ? response.tradeNo : undefined,
        buyerPayAmount: typeof response.buyerPayAmount === 'string' ? response.buyerPayAmount : undefined,
        raw: response,
      }
    }
  }

  return {
    provider: 'alipay',
    isMock: true,
    tradeStatus: null,
    raw: {
      mode,
      orderNo: input.orderNo,
      reason: 'missing_real_payment_config',
    },
  }
}

export function validateAlipayRuntimeConfig(input: {
  appId?: string
  sellerId?: string
  gateway?: string
  privateKey?: string
  publicKey?: string
  notifyUrl?: string
  returnUrl?: string
}): AlipayRuntimeReadiness {
  const appId = input.appId?.trim() || ''
  const sellerId = input.sellerId?.trim() || ''
  const gateway = input.gateway?.trim() || ''
  const privateKey = normalizePemLikeValue(input.privateKey)
  const publicKey = normalizePemLikeValue(input.publicKey)
  const notifyUrl = input.notifyUrl?.trim() || ''
  const returnUrl = input.returnUrl?.trim() || ''

  const checks: AlipayRuntimeReadiness['checks'] = [
    {
      key: 'appId',
      label: 'App ID',
      passed: Boolean(appId),
      detail: appId ? '已提供应用标识。' : '缺少 App ID。',
    },
    {
      key: 'sellerId',
      label: 'Seller ID',
      passed: Boolean(sellerId),
      detail: sellerId ? '已提供收款账号校验标识。' : '缺少 Seller ID，notify 无法校验收款归属。',
    },
    {
      key: 'privateKey',
      label: '应用私钥',
      passed: isPemLikePrivateKey(privateKey),
      detail: privateKey
        ? isPemLikePrivateKey(privateKey)
          ? '私钥内容包含 PEM 头，满足本地签名初始化前提。'
          : '私钥已填写，但不像 PEM 格式，可能无法完成本地签名。'
        : '缺少应用私钥。',
    },
    {
      key: 'publicKey',
      label: '支付宝公钥',
      passed: isPemLikePublicKey(publicKey),
      detail: publicKey
        ? isPemLikePublicKey(publicKey)
          ? '公钥内容包含 PEM 头，满足验签初始化前提。'
          : '公钥已填写，但不像 PEM 格式，可能无法完成验签。'
        : '缺少支付宝公钥。',
    },
    {
      key: 'notifyUrl',
      label: 'Notify URL',
      passed: notifyUrl.startsWith('https://'),
      detail: notifyUrl ? (notifyUrl.startsWith('https://') ? '已使用 HTTPS 回调地址。' : 'notifyUrl 不是 HTTPS 地址。') : '缺少 notifyUrl。',
    },
    {
      key: 'returnUrl',
      label: 'Return URL',
      passed: returnUrl.startsWith('https://'),
      detail: returnUrl ? (returnUrl.startsWith('https://') ? '已使用 HTTPS 回跳地址。' : 'returnUrl 不是 HTTPS 地址。') : '缺少 returnUrl。',
    },
    {
      key: 'gateway',
      label: '支付宝网关',
      passed: gateway.startsWith('https://'),
      detail: gateway ? (gateway.startsWith('https://') ? '网关地址格式正常。' : 'gateway 不是 HTTPS 地址。') : '缺少支付宝网关地址。',
    },
  ]

  const prereqsOk = checks.every((item) => item.passed)

  if (!prereqsOk) {
    checks.push(
      {
        key: 'sdkInit',
        label: 'SDK 初始化',
        passed: false,
        detail: '基础配置未满足，跳过 SDK 初始化自检。',
      },
      {
        key: 'pageExecute',
        label: '签名跳转生成',
        passed: false,
        detail: '基础配置未满足，跳过支付跳转签名自检。',
      },
      {
        key: 'queryPrerequisite',
        label: '主动查单前提',
        passed: false,
        detail: '基础配置未满足，暂不具备真实查单前提。',
      },
    )

    return {
      canUseRealPayment: false,
      checks,
    }
  }

  try {
    const sdk = new AlipaySdk({
      appId,
      privateKey,
      alipayPublicKey: publicKey,
      gateway,
    })

    checks.push({
      key: 'sdkInit',
      label: 'SDK 初始化',
      passed: true,
      detail: '当前配置可完成 Alipay SDK 本地初始化。',
    })

    const previewUrl = sdk.pageExecute('alipay.trade.page.pay', 'GET', {
      notifyUrl,
      returnUrl,
      bizContent: {
        outTradeNo: 'READINESS-CHECK-ORDER',
        productCode: 'FAST_INSTANT_TRADE_PAY',
        subject: 'GeekClaw Readiness Check',
        totalAmount: '0.01',
      },
    })

    checks.push({
      key: 'pageExecute',
      label: '签名跳转生成',
      passed: Boolean(previewUrl && previewUrl.includes('app_id=')),
      detail: previewUrl && previewUrl.includes('app_id=')
        ? '已成功生成本地签名跳转链接，说明真实支付跳转参数可以被构造。'
        : 'SDK 初始化成功，但未能生成预期的跳转签名参数。',
    })

    checks.push({
      key: 'queryPrerequisite',
      label: '主动查单前提',
      passed: true,
      detail: '当前配置已满足真实支付宝主动查单的本地前提。',
    })

    return {
      canUseRealPayment: checks.every((item) => item.passed),
      checks,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown sdk error'

    checks.push(
      {
        key: 'sdkInit',
        label: 'SDK 初始化',
        passed: false,
        detail: `SDK 初始化失败：${message}`,
      },
      {
        key: 'pageExecute',
        label: '签名跳转生成',
        passed: false,
        detail: '由于 SDK 初始化失败，无法生成本地支付跳转签名参数。',
      },
      {
        key: 'queryPrerequisite',
        label: '主动查单前提',
        passed: false,
        detail: '由于 SDK 初始化失败，暂不具备真实查单前提。',
      },
    )

    return {
      canUseRealPayment: false,
      checks,
    }
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

  const expectedAmount = normalizeOrderAmount(order.totalAmount).toFixed(2)
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

function normalizeOrderAmount(value?: number | null) {
  return typeof value === 'number' ? value : 0
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
