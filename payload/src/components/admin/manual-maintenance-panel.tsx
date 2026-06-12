'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type MaintenanceState = {
  action: 'close-expired' | 'sync-processing'
  loading: boolean
  message: string
  error: string
}

const initialState: MaintenanceState = {
  action: 'close-expired',
  loading: false,
  message: '',
  error: '',
}

export function ManualMaintenancePanel() {
  const router = useRouter()
  const [syncLimit, setSyncLimit] = useState('20')
  const [state, setState] = useState<MaintenanceState>(initialState)

  async function runAction(action: 'close-expired' | 'sync-processing') {
    setState({
      action,
      loading: true,
      message: '',
      error: '',
    })

    try {
      const response = await fetch('/api/orders/run-maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          limit: action === 'sync-processing' ? Number(syncLimit) : undefined,
        }),
      })

      const result = (await response.json()) as {
        error?: string
        closedCount?: number
        scannedCount?: number
        results?: Array<{
          orderNo: string
          action: 'no_change' | 'marked_paid' | 'marked_failed'
        }>
      }

      if (!response.ok) {
        throw new Error(mapMaintenanceError(result.error || 'RUN_MAINTENANCE_FAILED'))
      }

      if (action === 'close-expired') {
        setState({
          action,
          loading: false,
          message: `已执行超时关单，本次关闭 ${result.closedCount || 0} 笔订单。`,
          error: '',
        })
      } else {
        const paidCount = (result.results || []).filter((item) => item.action === 'marked_paid').length
        const failedCount = (result.results || []).filter((item) => item.action === 'marked_failed').length

        setState({
          action,
          loading: false,
          message: `已扫描 ${result.scannedCount || 0} 笔支付中订单，自动确认已支付 ${paidCount} 笔，标记失败 ${failedCount} 笔。`,
          error: '',
        })
      }

      router.refresh()
    } catch (error) {
      setState({
        action,
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : mapMaintenanceError('RUN_MAINTENANCE_FAILED'),
      })
    }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        style={{
          borderRadius: 18,
          border: '1px solid rgba(20,20,20,0.08)',
          padding: '16px 18px',
          display: 'grid',
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>立即执行超时关单</p>
          <p style={{ margin: '6px 0 0', color: '#5c5048', lineHeight: 1.7 }}>
            适合在运营确认大量未支付订单已过期、希望立即释放库存占用时手动触发。
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => runAction('close-expired')}
            disabled={state.loading}
            style={dangerButton}
          >
            {state.loading && state.action === 'close-expired' ? '执行中...' : '立即关超时未支付'}
          </button>
        </div>
      </div>

      <div
        style={{
          borderRadius: 18,
          border: '1px solid rgba(20,20,20,0.08)',
          padding: '16px 18px',
          display: 'grid',
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>立即同步支付中订单</p>
          <p style={{ margin: '6px 0 0', color: '#5c5048', lineHeight: 1.7 }}>
            扫描超时停留在 `processing` 的订单，自动调用现有查单逻辑收敛支付状态。
          </p>
        </div>
        <label style={{ display: 'grid', gap: 6, color: '#5c5048', fontSize: 13 }}>
          扫描数量上限
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={syncLimit}
            onChange={(event) => setSyncLimit(event.target.value)}
            style={inputStyle}
          />
        </label>
        <div>
          <button
            type="button"
            onClick={() => runAction('sync-processing')}
            disabled={state.loading}
            style={primaryButton}
          >
            {state.loading && state.action === 'sync-processing' ? '同步中...' : '立即批量同步支付中订单'}
          </button>
        </div>
      </div>

      {state.message ? <p style={{ margin: 0, color: '#265b35', lineHeight: 1.7 }}>{state.message}</p> : null}
      {state.error ? <p style={{ margin: 0, color: '#b42318', lineHeight: 1.7 }}>{state.error}</p> : null}
    </div>
  )
}

function mapMaintenanceError(code: string) {
  switch (code) {
    case 'MISSING_ACTION':
      return '缺少维护动作。'
    case 'UNSUPPORTED_ACTION':
      return '不支持的维护动作。'
    case 'RUN_MAINTENANCE_FAILED':
    default:
      return '维护任务执行失败，请稍后重试。'
  }
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 168,
  padding: '11px 14px',
  borderRadius: 999,
  background: '#265b35',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
} as const

const dangerButton = {
  ...primaryButton,
  background: '#b42318',
} as const

const inputStyle = {
  borderRadius: 12,
  border: '1px solid rgba(20,20,20,0.12)',
  padding: '10px 12px',
  fontSize: 14,
  color: '#1d1a17',
  background: '#fff',
} as const
