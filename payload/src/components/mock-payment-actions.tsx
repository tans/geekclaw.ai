'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MockPaymentActions({ orderNo }: { orderNo: string }) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'paid' | 'failed' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submitOutcome(outcome: 'paid' | 'failed') {
    setPendingAction(outcome)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/pay/mock/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo,
          outcome,
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'MOCK_PAYMENT_FAILED')
      }

      setSuccess(outcome === 'paid' ? '模拟支付成功，正在跳转到成功页。' : '模拟支付失败，正在跳转到失败页。')

      if (outcome === 'paid') {
        router.push(`/pay-success?out_trade_no=${encodeURIComponent(orderNo)}&trade_no=${encodeURIComponent(`MOCK-${orderNo}`)}`)
        return
      }

      router.push(`/pay-failed?orderNo=${encodeURIComponent(orderNo)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'MOCK_PAYMENT_FAILED')
      setPendingAction(null)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
        <button disabled={pendingAction !== null} onClick={() => submitOutcome('paid')} style={buttonPrimaryLink} type="button">
          {pendingAction === 'paid' ? '正在确认支付...' : '确认模拟支付成功'}
        </button>
        <button disabled={pendingAction !== null} onClick={() => submitOutcome('failed')} style={buttonSecondaryLink} type="button">
          {pendingAction === 'failed' ? '正在标记失败...' : '确认模拟支付失败'}
        </button>
      </div>
      <p style={{ margin: '18px 0 0', color: '#6f6661', lineHeight: 1.8 }}>
        自动化验证和本地联调时，也可以直接调用 `POST /api/pay/mock/complete` 完成订单状态切换。
      </p>
      {error ? (
        <p style={{ margin: '12px 0 0', color: '#b42318', lineHeight: 1.7 }}>
          Mock 支付处理失败：{error}
        </p>
      ) : null}
      {!error && success ? (
        <p style={{ margin: '12px 0 0', color: '#265b35', lineHeight: 1.7 }}>
          {success}
        </p>
      ) : null}
    </>
  )
}

const buttonPrimaryLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 180,
  height: 46,
  padding: '0 18px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
  border: 0,
  cursor: 'pointer',
} as const

const buttonSecondaryLink = {
  ...buttonPrimaryLink,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
