'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PaymentConfigMigrationPanel({
  hasLegacyData,
  needsMigration,
  legacySummary,
}: {
  hasLegacyData: boolean
  needsMigration: boolean
  legacySummary: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function migrate() {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/payment/migrate-legacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = (await response.json()) as {
        error?: string
        migratedFields?: string[]
      }

      if (!response.ok) {
        throw new Error(mapMigrationError(result.error || 'PAYMENT_MIGRATION_FAILED'))
      }

      setMessage(`已迁移旧支付配置，共写入 ${result.migratedFields?.length || 0} 个字段。`)
      router.refresh()
    } catch (migrationError) {
      setError(migrationError instanceof Error ? migrationError.message : mapMigrationError('PAYMENT_MIGRATION_FAILED'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          borderRadius: 16,
          border: '1px solid rgba(20,20,20,0.08)',
          background: needsMigration ? '#fff7f6' : hasLegacyData ? '#faf8f7' : '#f4fbf6',
          padding: '14px 16px',
          display: 'grid',
          gap: 8,
        }}
      >
        <strong>{needsMigration ? '检测到旧支付配置尚未迁移' : hasLegacyData ? '检测到旧支付配置遗留' : '当前没有旧支付配置遗留'}</strong>
        <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{legacySummary}</p>
      </div>

      {needsMigration ? (
        <div>
          <button type="button" onClick={migrate} disabled={loading} style={buttonPrimary}>
            {loading ? '迁移中...' : '一键迁移到 payment-settings'}
          </button>
        </div>
      ) : null}

      {message ? <p style={{ margin: 0, color: '#265b35', lineHeight: 1.7 }}>{message}</p> : null}
      {error ? <p style={{ margin: 0, color: '#b42318', lineHeight: 1.7 }}>{error}</p> : null}
    </div>
  )
}

function mapMigrationError(code: string) {
  switch (code) {
    case 'LEGACY_PAYMENT_EMPTY':
      return '旧站点设置里没有可迁移的支付配置。'
    case 'FORBIDDEN':
      return '当前账号没有迁移支付配置的权限。'
    case 'PAYMENT_MIGRATION_FAILED':
    default:
      return '支付配置迁移失败，请稍后重试。'
  }
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 168,
  padding: '10px 14px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
} as const
