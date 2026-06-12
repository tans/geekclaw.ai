'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PaymentKeyRotationPanel() {
  const router = useRouter()
  const [privateKey, setPrivateKey] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [clearPrivateKey, setClearPrivateKey] = useState(false)
  const [clearPublicKey, setClearPublicKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit() {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/payment/update-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privateKey,
          publicKey,
          clearPrivateKey,
          clearPublicKey,
        }),
      })

      const result = (await response.json()) as {
        error?: string
        privateKeyUpdated?: boolean
        publicKeyUpdated?: boolean
        privateKeyCleared?: boolean
        publicKeyCleared?: boolean
      }

      if (!response.ok) {
        throw new Error(mapError(result.error || 'PAYMENT_KEYS_UPDATE_FAILED'))
      }

      const changedParts = [
        result.privateKeyUpdated ? '已更新应用私钥' : '',
        result.privateKeyCleared ? '已清空应用私钥' : '',
        result.publicKeyUpdated ? '已更新支付宝公钥' : '',
        result.publicKeyCleared ? '已清空支付宝公钥' : '',
      ].filter(Boolean)

      setMessage(changedParts.join('；') + '。')
      setPrivateKey('')
      setPublicKey('')
      setClearPrivateKey(false)
      setClearPublicKey(false)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : mapError('PAYMENT_KEYS_UPDATE_FAILED'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        borderRadius: 18,
        border: '1px solid rgba(20,20,20,0.08)',
        background: '#fff',
        padding: 18,
        display: 'grid',
        gap: 12,
      }}
    >
      <div>
        <strong>密钥轮换</strong>
        <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
          后台不再直接回显完整私钥/公钥。需要更新时，在这里粘贴新的 PEM 密钥内容并提交。留空的项会保持原值不变；如需删除后台回退值，请显式勾选清空。
        </p>
      </div>

      <label style={labelStyle}>
        新应用私钥
        <textarea
          rows={5}
          value={privateKey}
          onChange={(event) => setPrivateKey(event.target.value)}
          placeholder="粘贴新的 PEM 私钥；留空表示保持现有后台回退值。"
          style={textareaStyle}
          disabled={clearPrivateKey}
        />
      </label>

      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={clearPrivateKey}
          onChange={(event) => setClearPrivateKey(event.target.checked)}
          disabled={loading}
        />
        清空后台保存的应用私钥
      </label>

      <label style={labelStyle}>
        新支付宝公钥
        <textarea
          rows={5}
          value={publicKey}
          onChange={(event) => setPublicKey(event.target.value)}
          placeholder="粘贴新的 PEM 公钥；留空表示保持现有后台回退值。"
          style={textareaStyle}
          disabled={clearPublicKey}
        />
      </label>

      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={clearPublicKey}
          onChange={(event) => setClearPublicKey(event.target.checked)}
          disabled={loading}
        />
        清空后台保存的支付宝公钥
      </label>

      <div>
        <button type="button" onClick={submit} disabled={loading} style={buttonPrimary}>
          {loading ? '更新中...' : '提交密钥轮换'}
        </button>
      </div>

      {message ? <p style={{ margin: 0, color: '#265b35', lineHeight: 1.7 }}>{message}</p> : null}
      {error ? <p style={{ margin: 0, color: '#b42318', lineHeight: 1.7 }}>{error}</p> : null}
    </div>
  )
}

function mapError(code: string) {
  switch (code) {
    case 'NO_KEY_CHANGES':
      return '没有可提交的密钥变更。请填写新密钥，或勾选需要清空的项。'
    case 'INVALID_PRIVATE_KEY_FORMAT':
      return '应用私钥格式不符合 PEM 预期，请检查 BEGIN/PRIVATE KEY 头尾。'
    case 'INVALID_PUBLIC_KEY_FORMAT':
      return '支付宝公钥格式不符合 PEM 预期，请检查 BEGIN/PUBLIC KEY 头尾。'
    case 'FORBIDDEN':
      return '当前账号没有更新支付密钥的权限。'
    case 'PAYMENT_KEYS_UPDATE_FAILED':
    default:
      return '支付密钥更新失败，请稍后重试。'
  }
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 148,
  padding: '10px 14px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
} as const

const labelStyle = {
  display: 'grid',
  gap: 6,
  color: '#4f4742',
  fontSize: 13,
} as const

const textareaStyle = {
  borderRadius: 12,
  border: '1px solid rgba(20,20,20,0.12)',
  padding: '10px 12px',
  fontSize: 14,
  color: '#1d1a17',
  background: '#fff',
  resize: 'vertical',
} as const

const checkboxRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#4f4742',
  fontSize: 13,
} as const
