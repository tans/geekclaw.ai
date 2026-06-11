'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OrderForm({
  productSlug,
  productName,
  unitPrice,
  currency,
}: {
  productSlug: string
  productName: string
  unitPrice: number
  currency: string
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totalAmount = unitPrice * quantity

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productSlug,
          customerEmail,
          customerName,
          customerPhone,
          shippingAddress,
          quantity,
        }),
      })

      const result = (await response.json()) as { error?: string; orderNo?: string }

      if (!response.ok || !result.orderNo) {
        throw new Error(result.error || 'ORDER_CREATE_FAILED')
      }

      router.push(`/shop/checkout-success?orderNo=${encodeURIComponent(result.orderNo)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'ORDER_CREATE_FAILED')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 14,
      }}
    >
      <div>
        <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>商品</p>
        <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{productName}</p>
      </div>

      <label style={labelStyle}>
        联系人
        <input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        手机号
        <input required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        邮箱
        <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        收货/服务地址
        <textarea
          required
          rows={4}
          value={shippingAddress}
          onChange={(event) => setShippingAddress(event.target.value)}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      <label style={labelStyle}>
        数量
        <input
          min={1}
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          style={inputStyle}
        />
      </label>

      <div
        style={{
          borderRadius: 18,
          background: '#faf5f3',
          padding: 16,
        }}
      >
        <p style={{ margin: 0, color: '#6f6661' }}>应付金额</p>
        <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 700 }}>
          {currency === 'CNY' ? '¥' : ''}
          {totalAmount.toLocaleString('zh-CN')}
        </p>
        <p style={{ margin: '8px 0 0', color: '#6f6661', fontSize: 13 }}>
          提交后会先创建订单，再根据当前支付配置自动进入真实支付宝或 mock 支付流程。
        </p>
      </div>

      {error ? (
        <p style={{ margin: 0, color: '#b42318', fontSize: 14 }}>
          下单失败：{error}
        </p>
      ) : null}

      <button
        disabled={submitting}
        type="submit"
        style={{
          border: 0,
          borderRadius: 999,
          background: '#b42318',
          color: '#fff',
          height: 48,
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? 'progress' : 'pointer',
        }}
      >
        {submitting ? '正在创建订单...' : '提交订单'}
      </button>
    </form>
  )
}

const labelStyle = {
  display: 'grid',
  gap: 8,
  fontSize: 14,
  color: '#4f4742',
} as const

const inputStyle = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid rgba(20,20,20,0.12)',
  padding: '12px 14px',
  fontSize: 14,
  outline: 'none',
  background: '#fff',
} as const
