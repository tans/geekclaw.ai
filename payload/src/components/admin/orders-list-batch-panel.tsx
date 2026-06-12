'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type ListOrder = {
  id: number
  orderNo: string
  customerName?: string | null
  totalAmount?: number | null
  paymentStatus?: string | null
  fulfillmentStatus?: string | null
}

type BatchAction = 'cancel' | 'mark-processing' | 'mark-completed' | 'mark-paid' | 'mark-failed'

export function OrdersListBatchPanel({
  orders,
}: {
  orders: ListOrder[]
}) {
  const router = useRouter()
  const [selectedOrderNos, setSelectedOrderNos] = useState<string[]>([])
  const [pendingAction, setPendingAction] = useState<BatchAction | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const selectedSet = useMemo(() => new Set(selectedOrderNos), [selectedOrderNos])

  const actionableOrders = orders.filter((order) => typeof order.orderNo === 'string' && order.orderNo.trim())
  const allSelected = actionableOrders.length > 0 && selectedOrderNos.length === actionableOrders.length
  const cancellableCount = actionableOrders.filter((order) => order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded').length
  const fulfillmentCount = actionableOrders.filter((order) => order.paymentStatus === 'paid').length
  const reviewCount = actionableOrders.filter((order) => order.paymentStatus === 'processing').length

  function toggleAll() {
    setSelectedOrderNos((current) =>
      current.length === actionableOrders.length ? [] : actionableOrders.map((order) => order.orderNo),
    )
  }

  function toggleOrder(orderNo: string) {
    setSelectedOrderNos((current) =>
      current.includes(orderNo) ? current.filter((item) => item !== orderNo) : [...current, orderNo],
    )
  }

  async function runBatchAction(action: BatchAction) {
    if (!selectedOrderNos.length) {
      setError('请先选择至少一笔订单。')
      setMessage('')
      return
    }

    setPendingAction(action)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNos: selectedOrderNos,
          action,
        }),
      })

      const result = (await response.json()) as {
        error?: string
        successCount?: number
        failureCount?: number
      }

      if (!response.ok) {
        throw new Error(mapBulkError(result.error || 'BULK_OPERATION_FAILED'))
      }

      setMessage(`批量操作完成：成功 ${result.successCount || 0} 笔，失败 ${result.failureCount || 0} 笔。`)
      setSelectedOrderNos([])
      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : mapBulkError('BULK_OPERATION_FAILED'))
    } finally {
      setPendingAction(null)
    }
  }

  if (!actionableOrders.length) {
    return null
  }

  return (
    <section
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fffaf9',
        padding: 20,
        display: 'grid',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20 }}>当前页批量处理</h3>
          <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            基于当前原生列表这一页的结果，直接完成批量取消、批量复核和批量推进履约。
          </p>
        </div>
        <div style={{ display: 'grid', gap: 6, color: '#6f6661', fontSize: 13 }}>
          <span>当前页订单：{actionableOrders.length} 笔</span>
          <span>可取消：{cancellableCount} 笔</span>
          <span>可复核 processing：{reviewCount} 笔</span>
          <span>已支付可履约：{fulfillmentCount} 笔</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4f4742', fontSize: 13 }}>
          <input checked={allSelected} onChange={toggleAll} type="checkbox" />
          全选当前页
        </label>
        <span style={{ color: '#8d827a', fontSize: 13 }}>已选 {selectedOrderNos.length} / {actionableOrders.length}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {cancellableCount > 0 ? (
          <button
            type="button"
            onClick={() => runBatchAction('cancel')}
            disabled={pendingAction !== null}
            style={buttonDanger}
          >
            {pendingAction === 'cancel' ? '处理中...' : '批量取消订单'}
          </button>
        ) : null}
        {reviewCount > 0 ? (
          <>
            <button
              type="button"
              onClick={() => runBatchAction('mark-paid')}
              disabled={pendingAction !== null}
              style={buttonSuccess}
            >
              {pendingAction === 'mark-paid' ? '处理中...' : '批量确认已支付'}
            </button>
            <button
              type="button"
              onClick={() => runBatchAction('mark-failed')}
              disabled={pendingAction !== null}
              style={buttonDanger}
            >
              {pendingAction === 'mark-failed' ? '处理中...' : '批量标记失败'}
            </button>
          </>
        ) : null}
        {fulfillmentCount > 0 ? (
          <>
            <button
              type="button"
              onClick={() => runBatchAction('mark-processing')}
              disabled={pendingAction !== null}
              style={buttonPrimary}
            >
              {pendingAction === 'mark-processing' ? '处理中...' : '批量标记准备中'}
            </button>
            <button
              type="button"
              onClick={() => runBatchAction('mark-completed')}
              disabled={pendingAction !== null}
              style={buttonSuccess}
            >
              {pendingAction === 'mark-completed' ? '处理中...' : '批量标记已完成'}
            </button>
          </>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {actionableOrders.map((order) => (
          <label
            key={order.orderNo}
            style={{
              display: 'grid',
              gap: 6,
              border: selectedSet.has(order.orderNo) ? '1px solid rgba(180,35,24,0.4)' : '1px solid rgba(20,20,20,0.08)',
              borderRadius: 16,
              padding: '12px 14px',
              background: selectedSet.has(order.orderNo) ? '#fff3f1' : '#fff',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1d1a17' }}>
              <input checked={selectedSet.has(order.orderNo)} onChange={() => toggleOrder(order.orderNo)} type="checkbox" />
              {order.orderNo}
            </span>
            <span style={{ color: '#4f4742', fontSize: 13 }}>
              {order.customerName || '未填写联系人'} · ¥{formatCurrency(order.totalAmount)}
            </span>
            <span style={{ color: '#6f6661', fontSize: 12 }}>
              支付：{formatPaymentStatus(order.paymentStatus)} / 履约：{formatFulfillmentStatus(order.fulfillmentStatus)}
            </span>
          </label>
        ))}
      </div>

      {message ? <p style={{ margin: 0, color: '#265b35', fontSize: 13 }}>{message}</p> : null}
      {error ? <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>{error}</p> : null}
    </section>
  )
}

function formatPaymentStatus(value?: string | null) {
  return (
    {
      unpaid: '未支付',
      processing: '支付中',
      paid: '已支付',
      failed: '支付失败',
      refunded: '已退款',
    }[value || ''] || '-'
  )
}

function formatFulfillmentStatus(value?: string | null) {
  return (
    {
      pending: '待处理',
      processing: '准备中',
      shipped: '已发货',
      completed: '已完成',
    }[value || ''] || '-'
  )
}

function formatCurrency(value?: number | null) {
  return (typeof value === 'number' ? value : 0).toLocaleString('zh-CN')
}

function mapBulkError(code: string) {
  switch (code) {
    case 'TOO_MANY_ORDERS':
      return '单次最多只能处理 50 笔订单。'
    case 'ORDER_NOT_FOUND':
      return '部分订单不存在，建议刷新列表后重试。'
    case 'ORDER_ALREADY_CANCELLED':
      return '所选订单中包含已取消订单。'
    case 'ORDER_NOT_PROCESSING':
      return '只有 paymentStatus=processing 的订单才能执行支付复核。'
    case 'ORDER_NOT_PAID':
      return '只有已支付订单才能推进履约。'
    default:
      return code || '批量操作失败，请稍后重试。'
  }
}

const baseButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 124,
  padding: '10px 14px',
  borderRadius: 999,
  border: 0,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
} as const

const buttonPrimary = {
  ...baseButton,
  background: '#1d1a17',
  color: '#fff',
} as const

const buttonSuccess = {
  ...baseButton,
  background: '#265b35',
  color: '#fff',
} as const

const buttonDanger = {
  ...baseButton,
  background: '#b42318',
  color: '#fff',
} as const
