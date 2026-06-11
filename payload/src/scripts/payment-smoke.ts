export {}

type Diagnostics = {
  mode: 'real' | 'mock'
  appId: {
    configured: boolean
  }
  sellerId: {
    configured: boolean
  }
  publicKey: {
    configured: boolean
  }
}

type CreatedOrder = {
  orderNo: string
  totalAmount: number
  productName: string
}

type PaymentStart = {
  orderNo: string
  paymentUrl: string
  isMock: boolean
  mode: 'mock' | 'redirect'
}

const baseUrl = process.env.PAYMENT_SMOKE_BASE_URL || 'http://127.0.0.1:26223'

async function main() {
  logStep(`base url: ${baseUrl}`)

  const diagnostics = await getJson<Diagnostics>(`${baseUrl}/api/payment/diagnostics`)
  logInfo(
    `diagnostics mode=${diagnostics.mode} appId=${diagnostics.appId.configured} sellerId=${diagnostics.sellerId.configured} publicKey=${diagnostics.publicKey.configured}`,
  )

  const order = await createOrder()
  logStep(`created order ${order.orderNo} amount=${order.totalAmount}`)

  const mismatchText = await getText(
    `${baseUrl}/pay-success?out_trade_no=${encodeURIComponent(order.orderNo)}&trade_no=SMOKE-MISMATCH-${Date.now()}&trade_status=TRADE_SUCCESS&total_amount=1.00`,
  )
  assertContains(mismatchText, '当前返回参数未通过业务校验')
  assertContains(mismatchText, '金额不匹配')
  logStep('return page rejects mismatched amount')

  const orderPageBeforePay = await getText(`${baseUrl}/orders/${encodeURIComponent(order.orderNo)}`)
  assertContains(orderPageBeforePay, '支付状态')
  assertContains(orderPageBeforePay, 'unpaid')
  assertContains(orderPageBeforePay, '继续支付')
  logStep('order stays unpaid after mismatched return')

  const payment = await postJson<PaymentStart>(`${baseUrl}/api/orders/pay`, {
    orderNo: order.orderNo,
  })
  if (payment.orderNo !== order.orderNo) {
    throw new Error(`unexpected orderNo from pay api: ${payment.orderNo}`)
  }
  logStep(`pay api started: mode=${payment.mode} mock=${payment.isMock} url=${payment.paymentUrl}`)

  const notifyResponse = await postForm(`${baseUrl}/api/pay/alipay/notify`, {
    out_trade_no: order.orderNo,
    trade_no: `SMOKE-NOTIFY-${Date.now()}`,
    total_amount: order.totalAmount.toFixed(2),
  })

  if (!diagnostics.publicKey.configured) {
    assertStatus(notifyResponse.status, 400)
    assertContains(notifyResponse.body, 'missing public key')
    logStep('notify is correctly blocked without public key')
  } else {
    assertStatus(notifyResponse.status, 400)
    assertContains(notifyResponse.body, 'missing trade_status')
    logStep('notify rejects request without trade_status')
  }

  const orderPageAfterNotify = await getText(`${baseUrl}/orders/${encodeURIComponent(order.orderNo)}`)
  assertContains(orderPageAfterNotify, '支付状态')
  if (diagnostics.publicKey.configured) {
    assertContains(orderPageAfterNotify, 'processing')
  } else {
    assertContains(orderPageAfterNotify, 'processing')
  }
  logStep('order remains non-paid after notify rejection')

  const expiredOrder = await createOrder()
  await backdateOrder(expiredOrder.orderNo, 45)
  const closeExpired = await postAuthorizedJson<{ closedCount: number; closedOrderNos: string[] }>(
    `${baseUrl}/api/orders/close-expired`,
    process.env.CRON_SECRET || 'change-me-too',
  )
  if (!closeExpired.closedOrderNos.includes(expiredOrder.orderNo)) {
    throw new Error(`expected expired order ${expiredOrder.orderNo} to be closed`)
  }
  logStep(`expired order auto-close closed ${expiredOrder.orderNo}`)

  const expiredPayAttempt = await postJsonExpectStatus(`${baseUrl}/api/orders/pay`, {
    orderNo: expiredOrder.orderNo,
  })
  assertStatus(expiredPayAttempt.status, 400)
  assertContains(expiredPayAttempt.body, 'ORDER_CANCELLED')
  logStep('expired order was closed and cannot re-enter payment')

  logInfo('payment smoke passed')
}

async function createOrder() {
  return postJson<CreatedOrder>(`${baseUrl}/api/orders/create`, {
    productSlug: 'enterprise-deployment',
    customerName: `Smoke ${Date.now()}`,
    customerPhone: '13600000000',
    customerEmail: 'smoke@example.com',
    shippingAddress: 'Shanghai',
    quantity: 1,
  })
}

async function getJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${text}`)
  }

  return JSON.parse(text) as T
}

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`POST ${url} failed: ${response.status} ${text}`)
  }

  return JSON.parse(text) as T
}

async function postJsonExpectStatus(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  return {
    status: response.status,
    body: await response.text(),
  }
}

async function postAuthorizedJson<T>(url: string, secret: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${secret}`,
    },
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`POST ${url} failed: ${response.status} ${text}`)
  }

  return JSON.parse(text) as T
}

async function backdateOrder(orderNo: string, minutesAgo: number) {
  const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
  const databasePath = process.env.DATABASE_URI?.startsWith('file:')
    ? process.env.DATABASE_URI.slice(5)
    : `${process.cwd()}/.payload/geekclaw.db`

  const sqlite = await import('node:sqlite')
  const db = new sqlite.DatabaseSync(databasePath)

  try {
    db.prepare('update orders set created_at = ? where order_no = ?').run(timestamp, orderNo)
  } finally {
    db.close()
  }
}

async function postForm(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  })

  return {
    status: response.status,
    body: await response.text(),
  }
}

async function getText(url: string) {
  const response = await fetch(url)
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${text}`)
  }

  return text
}

function assertContains(value: string, expected: string) {
  if (!value.includes(expected)) {
    throw new Error(`expected response to contain "${expected}"`)
  }
}

function assertStatus(actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`expected status ${expected}, got ${actual}`)
  }
}

function logStep(message: string) {
  console.log(`[payment-smoke] ${message}`)
}

function logInfo(message: string) {
  console.log(`[payment-smoke] ${message}`)
}

main().catch((error) => {
  console.error('[payment-smoke] failed', error)
  process.exit(1)
})
