'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CancelOrderButton({
  orderNo,
  reason,
  label,
  source,
  variant = 'secondary',
}: {
  orderNo: string
  reason?: string
  label?: string
  source: 'shop' | 'operator'
  variant?: 'secondary' | 'danger'
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCancel() {
    const confirmed = window.confirm('确认取消这个订单吗？未支付订单取消后会释放库存占用。')

    if (!confirmed) {
      return
    }

    setPending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo,
          reason,
          source,
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(mapCancelError(result.error || 'ORDER_CANCEL_FAILED'))
      }

      setSuccess('订单已取消，页面正在刷新。')
      router.refresh()
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : mapCancelError('ORDER_CANCEL_FAILED'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button
        type="button"
        onClick={handleCancel}
        disabled={pending}
        style={variant === 'danger' ? dangerButton : secondaryButton}
      >
        {pending ? '正在取消...' : label || '取消订单'}
      </button>
      {error ? <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>{error}</p> : null}
      {!error && success ? <p style={{ margin: 0, color: '#265b35', fontSize: 13 }}>{success}</p> : null}
    </div>
  )
}

function mapCancelError(code: string) {
  switch (code) {
    case 'ORDER_CANNOT_CANCEL':
      return '已支付或已退款订单不能直接取消。'
    case 'ORDER_ALREADY_CANCELLED':
      return '这个订单已经取消过了。'
    case 'ORDER_NOT_FOUND':
      return '订单不存在。'
    case 'ORDER_CANCELLED':
      return '订单已取消，不能继续操作。'
    case 'ORDER_CANCEL_FAILED':
    default:
      return '取消订单失败，请稍后重试。'
  }
}

const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 140,
  padding: '12px 18px',
  borderRadius: 999,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
  fontWeight: 600,
  cursor: 'pointer',
} as const

const dangerButton = {
  ...secondaryButton,
  background: '#b42318',
  color: '#fff',
  border: '1px solid #b42318',
} as const
