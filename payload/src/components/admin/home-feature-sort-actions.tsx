'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function HomeFeatureSortActions({
  entityType,
  id,
  disableMoveUp = false,
  disableMoveDown = false,
}: {
  entityType: 'page' | 'post' | 'product'
  id: number
  disableMoveUp?: boolean
  disableMoveDown?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState<'move-up' | 'move-down' | null>(null)
  const [error, setError] = useState('')

  async function move(action: 'move-up' | 'move-down') {
    setPending(action)
    setError('')

    try {
      const response = await fetch('/api/admin/home-feature-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          id,
          action,
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(mapSortError(result.error || 'HOME_FEATURE_TOGGLE_FAILED'))
      }

      router.refresh()
    } catch (sortError) {
      setError(sortError instanceof Error ? sortError.message : mapSortError('HOME_FEATURE_TOGGLE_FAILED'))
    } finally {
      setPending(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => move('move-up')} disabled={pending !== null || disableMoveUp} style={buttonNeutral}>
          {pending === 'move-up' ? '上移中...' : '上移'}
        </button>
        <button type="button" onClick={() => move('move-down')} disabled={pending !== null || disableMoveDown} style={buttonNeutral}>
          {pending === 'move-down' ? '下移中...' : '下移'}
        </button>
      </div>
      {error ? <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>{error}</p> : null}
    </div>
  )
}

function mapSortError(code: string) {
  switch (code) {
    case 'INVALID_ENTITY_TYPE':
      return '不支持的内容类型。'
    case 'INVALID_ENTITY_ID':
      return '内容 ID 无效。'
    case 'ENTITY_NOT_FOUND':
      return '内容不存在。'
    case 'HOME_FEATURE_TOGGLE_FAILED':
    default:
      return '首页推荐排序失败，请稍后重试。'
  }
}

const buttonNeutral = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 72,
  padding: '8px 12px',
  borderRadius: 999,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 13,
} as const
