'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CancelOrderButton } from '@/components/cancel-order-button'

export function WorkbenchOrderActions({
  orderNo,
  fulfillmentStatus,
  deliveryMethod,
  trackingNo,
  deliveryNote,
  operatorNote,
}: {
  orderNo: string
  fulfillmentStatus?: string | null
  deliveryMethod?: string | null
  trackingNo?: string | null
  deliveryNote?: string | null
  operatorNote?: string | null
}) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'processing' | 'completed' | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)
  const [savingOperatorNote, setSavingOperatorNote] = useState(false)
  const [error, setError] = useState('')
  const [trackingValue, setTrackingValue] = useState(trackingNo || '')
  const [noteValue, setNoteValue] = useState(deliveryNote || '')
  const [operatorNoteValue, setOperatorNoteValue] = useState(operatorNote || '')
  const [deliveryMethodValue, setDeliveryMethodValue] = useState(deliveryMethod || 'digital')

  async function runAction(nextStatus: 'processing' | 'completed') {
    setPendingAction(nextStatus)
    setError('')

    try {
      const response = await fetch('/api/orders/fulfillment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo,
          fulfillmentStatus: nextStatus,
          deliveryMethod: deliveryMethodValue,
          trackingNo: trackingValue,
          deliveryNote: noteValue,
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'FULFILLMENT_UPDATE_FAILED')
      }

      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'FULFILLMENT_UPDATE_FAILED')
    } finally {
      setPendingAction(null)
    }
  }

  async function saveDetails() {
    setSavingDetails(true)
    setError('')

    try {
      const response = await fetch('/api/orders/fulfillment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo,
          fulfillmentStatus:
            fulfillmentStatus === 'processing' || fulfillmentStatus === 'completed' || fulfillmentStatus === 'shipped'
              ? fulfillmentStatus
              : 'pending',
          deliveryMethod: deliveryMethodValue,
          trackingNo: trackingValue,
          deliveryNote: noteValue,
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'FULFILLMENT_UPDATE_FAILED')
      }

      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'FULFILLMENT_UPDATE_FAILED')
    } finally {
      setSavingDetails(false)
    }
  }

  async function saveOperatorNote() {
    setSavingOperatorNote(true)
    setError('')

    try {
      const response = await fetch('/api/orders/operator-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo,
          operatorNote: operatorNoteValue,
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'OPERATOR_NOTE_UPDATE_FAILED')
      }

      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'OPERATOR_NOTE_UPDATE_FAILED')
    } finally {
      setSavingOperatorNote(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 14, background: '#fdf7f6' }}>
        <label style={labelStyle}>
          运营备注
          <textarea
            rows={3}
            value={operatorNoteValue}
            onChange={(event) => setOperatorNoteValue(event.target.value)}
            placeholder="记录内部跟进情况、客户偏好、异常说明等。"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div>
          <button
            disabled={savingOperatorNote || pendingAction !== null || savingDetails}
            onClick={saveOperatorNote}
            style={buttonGhost}
            type="button"
          >
            {savingOperatorNote ? '正在保存备注...' : '保存运营备注'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 14, background: '#f7f7f6' }}>
        <label style={labelStyle}>
          交付方式
          <select value={deliveryMethodValue} onChange={(event) => setDeliveryMethodValue(event.target.value)} style={inputStyle}>
            <option value="digital">数字交付</option>
            <option value="shipping">快递物流</option>
            <option value="service">人工服务</option>
          </select>
        </label>

        <label style={labelStyle}>
          跟踪号
          <input value={trackingValue} onChange={(event) => setTrackingValue(event.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          交付备注
          <textarea rows={3} value={noteValue} onChange={(event) => setNoteValue(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>

        <div>
          <button disabled={savingDetails || pendingAction !== null} onClick={saveDetails} style={buttonGhost} type="button">
            {savingDetails ? '正在保存信息...' : '保存交付信息'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {fulfillmentStatus !== 'processing' ? (
          <button disabled={pendingAction !== null || savingDetails} onClick={() => runAction('processing')} style={buttonPrimary} type="button">
            {pendingAction === 'processing' ? '正在更新...' : '标记准备中'}
          </button>
        ) : null}
        {fulfillmentStatus !== 'completed' ? (
          <button disabled={pendingAction !== null || savingDetails} onClick={() => runAction('completed')} style={buttonSecondary} type="button">
            {pendingAction === 'completed' ? '正在完成...' : '标记已完成'}
          </button>
        ) : null}
        <CancelOrderButton
          orderNo={orderNo}
          label="取消订单"
          reason="后台运营取消订单，库存占用已释放。"
          source="operator"
          variant="secondary"
        />
      </div>
      {error ? (
        <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>
          操作失败：{error}
        </p>
      ) : null}
    </div>
  )
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 96,
  padding: '8px 12px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  border: 0,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
} as const

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const

const buttonGhost = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
  minWidth: 128,
} as const

const labelStyle = {
  display: 'grid',
  gap: 6,
  color: '#4f4742',
  fontSize: 13,
} as const

const inputStyle = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid rgba(20,20,20,0.12)',
  background: '#fff',
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
} as const
