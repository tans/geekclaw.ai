async function main() {
  const baseUrl = process.env.SYNC_PROCESSING_BASE_URL || process.env.PAYMENT_SMOKE_BASE_URL || 'http://127.0.0.1:26223'
  const secret = process.env.CRON_SECRET || 'change-me-too'
  const limit = process.env.SYNC_PROCESSING_LIMIT || '20'

  const response = await fetch(`${baseUrl}/api/orders/sync-processing`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: Number(limit),
    }),
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`sync processing api failed: ${response.status} ${text}`)
  }

  const result = JSON.parse(text) as {
    scannedCount: number
    reviewMinutes: number
    results: Array<{
      orderNo: string
      action: string
      paymentStatus: string
      tradeStatus: string | null
      isMock: boolean
    }>
  }

  console.log(
    `[sync-processing-orders] scanned=${result.scannedCount} reviewMinutes=${result.reviewMinutes} results=${result.results
      .map((item) => `${item.orderNo}:${item.action}:${item.paymentStatus}:${item.tradeStatus || '-'}`)
      .join(',') || '-'}`,
  )
}

main().catch((error) => {
  console.error('[sync-processing-orders] failed', error)
  process.exit(1)
})
