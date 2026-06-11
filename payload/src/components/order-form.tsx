'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OrderForm({
  productSlug,
  productName,
  unitPrice,
  currency,
  availableQuantity,
  allowBackorder,
  isSoldOut,
  limitPerOrder,
  purchaseMessage,
  sku,
}: {
  productSlug: string
  productName: string
  unitPrice: number
  currency: string
  availableQuantity?: number | null
  allowBackorder?: boolean
  isSoldOut?: boolean
  limitPerOrder?: number
  purchaseMessage?: string
  sku?: string
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const maxQuantity =
    typeof availableQuantity === 'number' && !allowBackorder ? Math.max(1, availableQuantity) : undefined
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
        throw new Error(mapOrderCreateError(result.error || 'ORDER_CREATE_FAILED'))
      }

      router.push(`/shop/checkout-success?orderNo=${encodeURIComponent(result.orderNo)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : mapOrderCreateError('ORDER_CREATE_FAILED'))
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
        {sku ? <p style={{ margin: '6px 0 0', color: '#6f6661', fontSize: 13 }}>SKU：{sku}</p> : null}
      </div>

      <div
        style={{
          borderRadius: 16,
          background: isSoldOut ? '#fff1f0' : '#faf5f3',
          padding: 14,
          color: '#4f4742',
          lineHeight: 1.7,
        }}
      >
        <strong style={{ display: 'block', color: '#1d1a17' }}>{isSoldOut ? '当前不可下单' : '购买说明'}</strong>
        <p style={{ margin: '8px 0 0' }}>{purchaseMessage || '当前可直接下单。'}</p>
        {typeof availableQuantity === 'number' ? <p style={{ margin: '8px 0 0', fontSize: 13 }}>剩余可售：{availableQuantity} 件</p> : null}
        {limitPerOrder ? <p style={{ margin: '4px 0 0', fontSize: 13 }}>单笔限购：{limitPerOrder} 件</p> : null}
      </div>

      <label style={labelStyle}>
        联系人
        <input disabled={isSoldOut} required value={customerName} onChange={(event) => setCustomerName(event.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        手机号
        <input disabled={isSoldOut} required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        邮箱
        <input disabled={isSoldOut} type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        收货/服务地址
        <textarea
          required
          rows={4}
          value={shippingAddress}
          onChange={(event) => setShippingAddress(event.target.value)}
          disabled={isSoldOut}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      <label style={labelStyle}>
        数量
        <input
          min={1}
          max={limitPerOrder || maxQuantity}
          type="number"
          value={quantity}
          onChange={(event) =>
            setQuantity(
              normalizeQuantity({
                nextValue: Number(event.target.value) || 1,
                limitPerOrder,
                maxQuantity,
              }),
            )
          }
          disabled={isSoldOut}
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
        disabled={submitting || Boolean(isSoldOut)}
        type="submit"
        style={{
          border: 0,
          borderRadius: 999,
          background: isSoldOut ? '#c8c3bf' : '#b42318',
          color: '#fff',
          height: 48,
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? 'progress' : isSoldOut ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? '正在创建订单...' : isSoldOut ? '当前不可下单' : '提交订单'}
      </button>
    </form>
  )
}

function normalizeQuantity(args: {
  nextValue: number
  limitPerOrder?: number
  maxQuantity?: number
}) {
  let quantity = Math.max(1, Math.floor(args.nextValue))

  if (args.limitPerOrder) {
    quantity = Math.min(quantity, args.limitPerOrder)
  }

  if (typeof args.maxQuantity === 'number') {
    quantity = Math.min(quantity, args.maxQuantity)
  }

  return quantity
}

function mapOrderCreateError(code: string) {
  switch (code) {
    case 'PRODUCT_SOLD_OUT':
      return '当前商品库存不足或已售罄，请调整数量后重试。'
    case 'PRODUCT_LIMIT_EXCEEDED':
      return '当前商品超出单笔限购数量，请减少购买数量。'
    case 'PRODUCT_NOT_FOUND':
      return '商品不存在或暂未上架。'
    case 'MISSING_REQUIRED_FIELDS':
      return '请完整填写联系人、手机号和收货信息。'
    case 'ORDER_CREATE_FAILED':
    default:
      return '订单创建失败，请稍后重试。'
  }
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
