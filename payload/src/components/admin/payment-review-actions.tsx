'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PaymentReviewActions({
  orderNo,
  compact = false,
}: {
  orderNo: string
  compact?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState<'paid' | 'failed' | null>(null)
  const [error, setError] = useState('')

  async function submitReview(outcome: 'paid' | 'failed') {
    setPending(outcome)
    setError('')

    try {
      const response = await fetch('/api/orders/review-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo,
          outcome,
          reason:
            outcome === 'paid'
              ? '运营在后台复核后确认该支付单已到账。'
              : '运营在后台复核后确认该支付单未到账，转为支付失败。',
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(mapReviewError(result.error || 'PAYMENT_REVIEW_FAILED'))
      }

      router.refresh()
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : mapReviewError('PAYMENT_REVIEW_FAILED'))
    } finally {
      setPending(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => submitReview('paid')} disabled={pending !== null} style={compact ? compactSuccess : successButton}>
          {pending === 'paid' ? '确认中...' : '确认已支付'}
        </button>
        <button type="button" onClick={() => submitReview('failed')} disabled={pending !== null} style={compact ? compactDanger : dangerButton}>
          {pending === 'failed' ? '处理中...' : '标记失败'}
        </button>
      </div>
      {error ? <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>{error}</p> : null}
    </div>
  )
}

function mapReviewError(code: string) {
  switch (code) {
    case 'ORDER_NOT_PROCESSING':
      return '只有支付中的订单才需要复核。'
    case 'ORDER_CANCELLED':
      return '订单已取消，不能再做支付复核。'
    case 'ORDER_NOT_FOUND':
      return '订单不存在。'
    case 'PAYMENT_REVIEW_FAILED':
    default:
      return '支付复核失败，请稍后重试。'
  }
}

const baseButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 116,
  padding: '10px 14px',
  borderRadius: 999,
  border: 0,
  fontWeight: 600,
  cursor: 'pointer',
} as const

const successButton = {
  ...baseButton,
  background: '#265b35',
  color: '#fff',
} as const

const dangerButton = {
  ...baseButton,
  background: '#b42318',
  color: '#fff',
} as const

const compactSuccess = {
  ...successButton,
  minWidth: 96,
  padding: '8px 12px',
  fontSize: 13,
} as const

const compactDanger = {
  ...dangerButton,
  minWidth: 96,
  padding: '8px 12px',
  fontSize: 13,
} as const
