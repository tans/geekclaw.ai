export {}

async function main() {
  const baseUrl = process.env.CLOSE_EXPIRED_BASE_URL || process.env.PAYMENT_SMOKE_BASE_URL || 'http://127.0.0.1:26223'
  const secret = process.env.CRON_SECRET || 'change-me-too'

  const response = await fetch(`${baseUrl}/api/orders/close-expired`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${secret}`,
    },
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`close expired api failed: ${response.status} ${text}`)
  }

  const result = JSON.parse(text) as {
    closedCount: number
    cutoff: string
    expireMinutes: number
    closedOrderNos: string[]
  }

  console.log(
    `[close-expired-orders] closed=${result.closedCount} cutoff=${result.cutoff} expireMinutes=${result.expireMinutes} orders=${result.closedOrderNos.join(',') || '-'}`,
  )
}

main().catch((error) => {
  console.error('[close-expired-orders] failed', error)
  process.exit(1)
})
