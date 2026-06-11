import { getRawSitePaymentConfig, getSiteData, siteFallback } from '@/lib/site'
import { getUnpaidOrderExpireMinutes } from '@/lib/order-expiry'

type ConfigSource = 'env' | 'site-settings' | 'fallback' | 'missing'

export type PaymentDiagnostics = {
  provider: 'alipay'
  mode: 'real' | 'mock'
  summary: string
  runtimeConfigSource: 'env-first' | 'site-settings-fallback'
  orderExpiry: {
    expireMinutes: number
    cronSecretConfigured: boolean
    closeExpiredApiPath: string
  }
  appId: {
    configured: boolean
    source: ConfigSource
    valuePreview: string
  }
  sellerId: {
    configured: boolean
    source: ConfigSource
    valuePreview: string
  }
  privateKey: {
    configured: boolean
    source: ConfigSource
    lineCount: number
  }
  publicKey: {
    configured: boolean
    source: ConfigSource
    lineCount: number
  }
  notifyUrl: {
    configured: boolean
    source: ConfigSource
    value: string
  }
  returnUrl: {
    configured: boolean
    source: ConfigSource
    value: string
  }
  gateway: {
    configured: boolean
    source: ConfigSource
    value: string
  }
  warnings: string[]
}

function detectSource(
  value: string | undefined,
  envValue: string | undefined,
  globalValue: string | undefined,
  fallbackValue?: string,
): ConfigSource {
  const normalized = value?.trim() || ''

  if (!normalized) {
    return 'missing'
  }

  if ((envValue || '').trim() === normalized) {
    return 'env'
  }

  if ((globalValue || '').trim() === normalized) {
    return 'site-settings'
  }

  if ((fallbackValue || '').trim() === normalized) {
    return 'fallback'
  }

  return 'missing'
}

function maskText(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.length <= 8) {
    return trimmed
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
}

function countLines(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return 0
  }

  return trimmed.split(/\r?\n/).filter(Boolean).length
}

export async function getPaymentDiagnostics(): Promise<PaymentDiagnostics> {
  const site = await getSiteData()
  const globalPayment = await getRawSitePaymentConfig()

  const envValues = {
    appId: process.env.ALIPAY_APP_ID || '',
    sellerId: process.env.ALIPAY_SELLER_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
    returnUrl: process.env.ALIPAY_RETURN_URL || '',
    gateway: process.env.ALIPAY_GATEWAY || '',
  }

  const warnings: string[] = []

  if (!site.payment.appId.trim()) warnings.push('未配置 `ALIPAY_APP_ID`，当前无法发起真实支付宝支付。')
  if (!site.payment.privateKey.trim()) warnings.push('未配置应用私钥，当前会回退到 mock 支付。')
  if (!site.payment.publicKey.trim()) warnings.push('未配置支付宝公钥，异步通知验签无法通过。')
  if (!site.payment.sellerId.trim()) warnings.push('未配置 `ALIPAY_SELLER_ID`，notify 无法校验收款账号归属。')
  if (!site.payment.notifyUrl.startsWith('https://')) warnings.push('`notifyUrl` 不是 HTTPS 地址，线上异步通知存在风险。')
  if (!site.payment.returnUrl.startsWith('https://')) warnings.push('`returnUrl` 不是 HTTPS 地址，支付回跳体验会异常。')
  if (!site.payment.gateway.startsWith('https://')) warnings.push('`gateway` 不是 HTTPS 地址，请检查支付宝网关配置。')
  if (site.payment.appId.trim() && !site.payment.publicKey.trim()) {
    warnings.push('即使已配置 App ID，没有支付宝公钥也无法完成 notify 验签与订单安全回写。')
  }

  const mode = site.payment.appId && site.payment.privateKey && site.payment.publicKey ? 'real' : 'mock'

  return {
    provider: 'alipay',
    mode,
    summary: mode === 'real' ? '已具备真实支付宝跳转条件。' : '当前缺少真实支付宝关键配置，将自动回退到 mock 支付。',
    runtimeConfigSource: 'env-first',
    orderExpiry: {
      expireMinutes: getUnpaidOrderExpireMinutes(),
      cronSecretConfigured: Boolean((process.env.CRON_SECRET || '').trim()),
      closeExpiredApiPath: '/api/orders/close-expired',
    },
    appId: {
      configured: Boolean(site.payment.appId.trim()),
      source: detectSource(site.payment.appId, envValues.appId, globalPayment.appId, siteFallback.payment.appId),
      valuePreview: maskText(site.payment.appId),
    },
    sellerId: {
      configured: Boolean(site.payment.sellerId.trim()),
      source: detectSource(site.payment.sellerId, envValues.sellerId, globalPayment.sellerId, siteFallback.payment.sellerId),
      valuePreview: maskText(site.payment.sellerId),
    },
    privateKey: {
      configured: Boolean(site.payment.privateKey.trim()),
      source: detectSource(site.payment.privateKey, envValues.privateKey, globalPayment.privateKey, siteFallback.payment.privateKey),
      lineCount: countLines(site.payment.privateKey),
    },
    publicKey: {
      configured: Boolean(site.payment.publicKey.trim()),
      source: detectSource(site.payment.publicKey, envValues.publicKey, globalPayment.publicKey, siteFallback.payment.publicKey),
      lineCount: countLines(site.payment.publicKey),
    },
    notifyUrl: {
      configured: Boolean(site.payment.notifyUrl.trim()),
      source: detectSource(site.payment.notifyUrl, envValues.notifyUrl, globalPayment.notifyUrl, siteFallback.payment.notifyUrl),
      value: site.payment.notifyUrl,
    },
    returnUrl: {
      configured: Boolean(site.payment.returnUrl.trim()),
      source: detectSource(site.payment.returnUrl, envValues.returnUrl, globalPayment.returnUrl, siteFallback.payment.returnUrl),
      value: site.payment.returnUrl,
    },
    gateway: {
      configured: Boolean(site.payment.gateway.trim()),
      source: detectSource(site.payment.gateway, envValues.gateway, globalPayment.gateway, siteFallback.payment.gateway),
      value: site.payment.gateway,
    },
    warnings,
  }
}
