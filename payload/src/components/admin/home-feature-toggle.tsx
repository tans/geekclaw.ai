'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function HomeFeatureToggle({
  entityType,
  id,
  isFeatured,
}: {
  entityType: 'page' | 'post' | 'product'
  id: number
  isFeatured: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function toggleFeature() {
    setPending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/home-feature-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          id,
          action: isFeatured ? 'remove' : 'add',
        }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(mapToggleError(result.error || 'HOME_FEATURE_TOGGLE_FAILED'))
      }

      setSuccess(isFeatured ? '已从首页推荐移除，页面正在刷新。' : '已加入首页推荐，页面正在刷新。')
      router.refresh()
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : mapToggleError('HOME_FEATURE_TOGGLE_FAILED'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button type="button" onClick={toggleFeature} disabled={pending} style={isFeatured ? buttonDanger : buttonPrimary}>
        {pending ? '处理中...' : isFeatured ? '从首页推荐移除' : '加入首页推荐'}
      </button>
      {error ? <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>{error}</p> : null}
      {!error && success ? <p style={{ margin: 0, color: '#265b35', fontSize: 13 }}>{success}</p> : null}
    </div>
  )
}

function mapToggleError(code: string) {
  switch (code) {
    case 'INVALID_ENTITY_TYPE':
      return '不支持的内容类型。'
    case 'INVALID_ENTITY_ID':
      return '内容 ID 无效。'
    case 'ENTITY_NOT_FOUND':
      return '内容不存在。'
    case 'ENTITY_NOT_PUBLISHABLE':
      return '只有已发布页面、已发布文章或已上架商品才能加入首页推荐。'
    case 'HOME_FEATURE_TOGGLE_FAILED':
    default:
      return '首页推荐更新失败，请稍后重试。'
  }
}

const baseButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 144,
  padding: '10px 14px',
  borderRadius: 999,
  border: 0,
  fontWeight: 600,
  cursor: 'pointer',
} as const

const buttonPrimary = {
  ...baseButton,
  background: '#265b35',
  color: '#fff',
} as const

const buttonDanger = {
  ...baseButton,
  background: '#b42318',
  color: '#fff',
} as const
