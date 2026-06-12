import { getLegacySitePaymentConfig, getPaymentSettingsConfig, getSiteData, siteFallback } from '@/lib/site'
import { getUnpaidOrderExpireMinutes } from '@/lib/order-expiry'
import { getProcessingReviewMinutes } from '@/lib/payment-review'
import { validateAlipayRuntimeConfig } from '@/lib/payment'

type ConfigSource = 'env' | 'payment-settings' | 'legacy-site-settings' | 'fallback' | 'missing'

export type PaymentDiagnostics = {
  provider: 'alipay'
  mode: 'real' | 'mock'
  summary: string
  generatedAt: string
  runtimeConfigSource: 'env-first' | 'site-settings-fallback'
  readiness: {
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
  orderExpiry: {
    expireMinutes: number
    cronSecretConfigured: boolean
    closeExpiredApiPath: string
  }
  processingReview: {
    reviewMinutes: number
    queryEnabled: boolean
    queryApiPath: string
    batchSyncApiPath: string
  }
  notifyReadiness: {
    canVerifyNotify: boolean
    canFinalizeOrderFromNotify: boolean
    checks: Array<{
      key: 'appId' | 'sellerId' | 'publicKey' | 'notifyUrl'
      label: string
      passed: boolean
      detail: string
    }>
    summary: string
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
  envOverrides: Array<{
    key: 'appId' | 'sellerId' | 'privateKey' | 'publicKey' | 'notifyUrl' | 'returnUrl' | 'gateway'
    label: string
    envValuePreview: string
    paymentSettingsValuePreview: string
  }>
  warnings: string[]
}

function detectSource(
  value: string | undefined,
  envValue: string | undefined,
  paymentSettingsValue: string | undefined,
  legacyValue: string | undefined,
  fallbackValue?: string,
): ConfigSource {
  const normalized = value?.trim() || ''

  if (!normalized) {
    return 'missing'
  }

  if ((envValue || '').trim() === normalized) {
    return 'env'
  }

  if ((paymentSettingsValue || '').trim() === normalized) {
    return 'payment-settings'
  }

  if ((legacyValue || '').trim() === normalized) {
    return 'legacy-site-settings'
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

function formatPreview(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '未配置'
  }

  if (trimmed.includes('BEGIN') || trimmed.length > 48) {
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
  }

  return trimmed
}

export async function getPaymentDiagnostics(): Promise<PaymentDiagnostics> {
  const site = await getSiteData()
  const [paymentSettings, legacyPayment] = await Promise.all([getPaymentSettingsConfig(), getLegacySitePaymentConfig()])

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

  const envOverrides = [
    {
      key: 'appId' as const,
      label: 'App ID',
      envValue: envValues.appId,
      paymentSettingsValue: paymentSettings.appId,
    },
    {
      key: 'sellerId' as const,
      label: 'Seller ID',
      envValue: envValues.sellerId,
      paymentSettingsValue: paymentSettings.sellerId,
    },
    {
      key: 'privateKey' as const,
      label: '应用私钥',
      envValue: envValues.privateKey,
      paymentSettingsValue: paymentSettings.privateKey,
    },
    {
      key: 'publicKey' as const,
      label: '支付宝公钥',
      envValue: envValues.publicKey,
      paymentSettingsValue: paymentSettings.publicKey,
    },
    {
      key: 'notifyUrl' as const,
      label: 'Notify URL',
      envValue: envValues.notifyUrl,
      paymentSettingsValue: paymentSettings.notifyUrl,
    },
    {
      key: 'returnUrl' as const,
      label: 'Return URL',
      envValue: envValues.returnUrl,
      paymentSettingsValue: paymentSettings.returnUrl,
    },
    {
      key: 'gateway' as const,
      label: 'Gateway',
      envValue: envValues.gateway,
      paymentSettingsValue: paymentSettings.gateway,
    },
  ]
    .filter((item) => item.envValue.trim())
    .map((item) => ({
      key: item.key,
      label: item.label,
      envValuePreview: formatPreview(item.envValue),
      paymentSettingsValuePreview: formatPreview(item.paymentSettingsValue),
    }))

  const readiness = validateAlipayRuntimeConfig({
    appId: site.payment.appId,
    sellerId: site.payment.sellerId,
    gateway: site.payment.gateway,
    privateKey: site.payment.privateKey,
    publicKey: site.payment.publicKey,
    notifyUrl: site.payment.notifyUrl,
    returnUrl: site.payment.returnUrl,
  })

  const notifyReadinessChecks = [
    {
      key: 'appId' as const,
      label: 'App ID',
      passed: Boolean(site.payment.appId.trim()),
      detail: site.payment.appId.trim()
        ? '已提供 app_id，可用于支付宝通知参数比对。'
        : '缺少 App ID，notify 验签时只能回退到占位值，无法完成真实应用身份校验。',
    },
    {
      key: 'sellerId' as const,
      label: 'Seller ID',
      passed: Boolean(site.payment.sellerId.trim()),
      detail: site.payment.sellerId.trim()
        ? '已提供 seller_id，可校验收款账号归属。'
        : '缺少 Seller ID，notify 到达后无法校验收款账号是否属于当前应用。',
    },
    {
      key: 'publicKey' as const,
      label: '支付宝公钥',
      passed: Boolean(site.payment.publicKey.trim()),
      detail: site.payment.publicKey.trim()
        ? '已提供支付宝公钥，可尝试进行 notify 验签。'
        : '缺少支付宝公钥，notify 即使到达也会被直接拒绝，订单无法通过异步通知回写。',
    },
    {
      key: 'notifyUrl' as const,
      label: 'Notify URL',
      passed: site.payment.notifyUrl.startsWith('https://'),
      detail: site.payment.notifyUrl
        ? site.payment.notifyUrl.startsWith('https://')
          ? 'notifyUrl 使用 HTTPS，可作为线上异步通知入口。'
          : 'notifyUrl 已配置但不是 HTTPS，线上异步通知存在失败风险。'
        : '缺少 notifyUrl，支付宝无法把异步通知正确推回当前站点。',
    },
  ]

  const notifyReadiness = {
    canVerifyNotify:
      Boolean(site.payment.appId.trim()) &&
      Boolean(site.payment.publicKey.trim()) &&
      site.payment.notifyUrl.startsWith('https://'),
    canFinalizeOrderFromNotify:
      Boolean(site.payment.appId.trim()) &&
      Boolean(site.payment.sellerId.trim()) &&
      Boolean(site.payment.publicKey.trim()) &&
      site.payment.notifyUrl.startsWith('https://'),
    checks: notifyReadinessChecks,
    summary:
      Boolean(site.payment.appId.trim()) &&
      Boolean(site.payment.sellerId.trim()) &&
      Boolean(site.payment.publicKey.trim()) &&
      site.payment.notifyUrl.startsWith('https://')
        ? '当前已具备异步通知验签和订单回写的基础前提。'
        : Boolean(site.payment.publicKey.trim()) && site.payment.notifyUrl.startsWith('https://')
          ? '当前部分具备 notify 验签前提，但仍缺少 App ID 或 Seller ID，真实回调的业务校验仍不完整。'
          : '当前还不具备稳定处理真实支付宝异步通知的前提，需要优先补齐公钥、应用身份或 notify 地址。',
  }

  const mode = readiness.canUseRealPayment ? 'real' : 'mock'

  return {
    provider: 'alipay',
    mode,
    summary: mode === 'real' ? '已具备真实支付宝跳转条件，并通过本地 SDK 签名自检。' : '当前缺少真实支付宝关键配置或本地签名自检未通过，将自动回退到 mock 支付。',
    generatedAt: new Date().toISOString(),
    runtimeConfigSource: 'env-first',
    readiness,
    orderExpiry: {
      expireMinutes: getUnpaidOrderExpireMinutes(),
      cronSecretConfigured: Boolean((process.env.CRON_SECRET || '').trim()),
      closeExpiredApiPath: '/api/orders/close-expired',
    },
    processingReview: {
      reviewMinutes: getProcessingReviewMinutes(),
      queryEnabled: readiness.canUseRealPayment,
      queryApiPath: '/api/orders/query-payment',
      batchSyncApiPath: '/api/orders/sync-processing',
    },
    notifyReadiness,
    appId: {
      configured: Boolean(site.payment.appId.trim()),
      source: detectSource(site.payment.appId, envValues.appId, paymentSettings.appId, legacyPayment.appId, siteFallback.payment.appId),
      valuePreview: maskText(site.payment.appId),
    },
    sellerId: {
      configured: Boolean(site.payment.sellerId.trim()),
      source: detectSource(site.payment.sellerId, envValues.sellerId, paymentSettings.sellerId, legacyPayment.sellerId, siteFallback.payment.sellerId),
      valuePreview: maskText(site.payment.sellerId),
    },
    privateKey: {
      configured: Boolean(site.payment.privateKey.trim()),
      source: detectSource(site.payment.privateKey, envValues.privateKey, paymentSettings.privateKey, legacyPayment.privateKey, siteFallback.payment.privateKey),
      lineCount: countLines(site.payment.privateKey),
    },
    publicKey: {
      configured: Boolean(site.payment.publicKey.trim()),
      source: detectSource(site.payment.publicKey, envValues.publicKey, paymentSettings.publicKey, legacyPayment.publicKey, siteFallback.payment.publicKey),
      lineCount: countLines(site.payment.publicKey),
    },
    notifyUrl: {
      configured: Boolean(site.payment.notifyUrl.trim()),
      source: detectSource(site.payment.notifyUrl, envValues.notifyUrl, paymentSettings.notifyUrl, legacyPayment.notifyUrl, siteFallback.payment.notifyUrl),
      value: site.payment.notifyUrl,
    },
    returnUrl: {
      configured: Boolean(site.payment.returnUrl.trim()),
      source: detectSource(site.payment.returnUrl, envValues.returnUrl, paymentSettings.returnUrl, legacyPayment.returnUrl, siteFallback.payment.returnUrl),
      value: site.payment.returnUrl,
    },
    gateway: {
      configured: Boolean(site.payment.gateway.trim()),
      source: detectSource(site.payment.gateway, envValues.gateway, paymentSettings.gateway, legacyPayment.gateway, siteFallback.payment.gateway),
      value: site.payment.gateway,
    },
    envOverrides,
    warnings,
  }
}
