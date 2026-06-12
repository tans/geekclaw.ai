'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type ProductOption = {
  slug: string
  name: string
  category?: string
  price: number
  currency: string
  sku?: string
  availableQuantity?: number | null
  allowBackorder?: boolean
  limitPerOrder?: number
  isSoldOut?: boolean
  purchaseMessage?: string
}

export function ManualOrderForm({
  products,
}: {
  products: ProductOption[]
}) {
  const router = useRouter()
  const [markAsPaid, setMarkAsPaid] = useState(false)
  const [afterCreateAction, setAfterCreateAction] = useState<'detail' | 'pay' | 'workbench'>('pay')
  const [deliveryMethod, setDeliveryMethod] = useState<'digital' | 'shipping' | 'service'>('digital')
  const [trackingNo, setTrackingNo] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [startFulfillment, setStartFulfillment] = useState(true)
  const [productSlug, setProductSlug] = useState(products[0]?.slug || '')
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [operatorNote, setOperatorNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedProduct = useMemo(
    () => products.find((item) => item.slug === productSlug) || products[0] || null,
    [productSlug, products],
  )

  const maxQuantity =
    typeof selectedProduct?.availableQuantity === 'number' && !selectedProduct.allowBackorder
      ? Math.max(1, selectedProduct.availableQuantity)
      : undefined

  const totalAmount = (selectedProduct?.price || 0) * quantity

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/orders/manual-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productSlug,
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
          quantity,
          operatorNote,
          markAsPaid,
          startFulfillment,
          deliveryMethod,
          trackingNo,
          deliveryNote,
        }),
      })

      const result = (await response.json()) as {
        error?: string
        orderNo?: string
        markedAsPaid?: boolean
      }

      if (!response.ok || !result.orderNo) {
        throw new Error(mapCreateError(result.error || 'ORDER_CREATE_FAILED'))
      }

      if (result.markedAsPaid) {
        if (afterCreateAction === 'workbench') {
          router.push('/admin/orders-workbench')
        } else {
          router.push(`/orders/${encodeURIComponent(result.orderNo)}`)
        }
      } else if (afterCreateAction === 'pay') {
        const payResponse = await fetch('/api/orders/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderNo: result.orderNo,
          }),
        })

        const payResult = (await payResponse.json()) as { error?: string; paymentUrl?: string }

        if (!payResponse.ok || !payResult.paymentUrl) {
          throw new Error(mapPayError(payResult.error || 'PAYMENT_CREATE_FAILED'))
        }

        router.push(payResult.paymentUrl)
      } else if (afterCreateAction === 'workbench') {
        router.push('/admin/orders-workbench')
      } else {
        router.push(`/orders/${encodeURIComponent(result.orderNo)}`)
      }

      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : mapCreateError('ORDER_CREATE_FAILED'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <div style={heroCard}>
        <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Manual Order
        </p>
        <h1 style={{ margin: '10px 0 0', fontSize: 30 }}>后台手工录单</h1>
        <p style={{ margin: '10px 0 0', color: '#5c5048', lineHeight: 1.8 }}>
          适合客服代客下单、线下收款录单或内部测试。选择商品后会自动带出价格，提交后直接创建订单。
        </p>
      </div>

      <div style={gridStyle}>
        <label style={labelStyle}>
          商品
          <select value={productSlug} onChange={(event) => setProductSlug(event.target.value)} style={inputStyle}>
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.name}
                {product.category ? ` [${product.category}]` : ''}
                {product.sku ? ` (${product.sku})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          数量
          <input
            type="number"
            min={1}
            max={selectedProduct?.limitPerOrder || maxQuantity}
            value={quantity}
            onChange={(event) => setQuantity(normalizeQuantity(Number(event.target.value) || 1, selectedProduct?.limitPerOrder, maxQuantity))}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          联系人
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required style={inputStyle} />
        </label>

        <label style={labelStyle}>
          手机号
          <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} required style={inputStyle} />
        </label>

        <label style={labelStyle}>
          邮箱
          <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          创建后动作
          <select value={afterCreateAction} onChange={(event) => setAfterCreateAction(event.target.value as 'detail' | 'pay' | 'workbench')} style={inputStyle}>
            <option value="pay">直接进入支付</option>
            <option value="detail">打开订单详情</option>
            <option value="workbench">返回订单工作台</option>
          </select>
        </label>
      </div>

      <label
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          padding: '14px 16px',
          borderRadius: 16,
          background: '#faf5f3',
          color: '#4f4742',
          lineHeight: 1.7,
        }}
      >
        <input
          type="checkbox"
          checked={markAsPaid}
          onChange={(event) => {
            const nextValue = event.target.checked
            setMarkAsPaid(nextValue)
            if (nextValue && afterCreateAction === 'pay') {
              setAfterCreateAction('detail')
            }
          }}
        />
        <span>
          <strong style={{ display: 'block', color: '#1d1a17' }}>已确认线下到账</strong>
          勾选后，订单创建时会直接标记为已支付，并写入后台录单到账事件，不再进入在线支付流程。
        </span>
      </label>

      <div
        style={{
          display: 'grid',
          gap: 12,
          padding: '16px 18px',
          borderRadius: 18,
          background: '#f7f7f6',
          border: '1px solid rgba(20,20,20,0.08)',
        }}
      >
        <label
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          <input
            type="checkbox"
            checked={startFulfillment}
            onChange={(event) => setStartFulfillment(event.target.checked)}
            disabled={!markAsPaid}
          />
          <span>
            <strong style={{ display: 'block', color: '#1d1a17' }}>创建后直接进入履约准备中</strong>
            仅在线下已收款时生效。适合已经确认要继续交付的订单，提交后会自动写入交付方式、跟踪号和备注。
          </span>
        </label>

        <div style={gridStyle}>
          <label style={labelStyle}>
            交付方式
            <select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as 'digital' | 'shipping' | 'service')} style={inputStyle} disabled={!markAsPaid || !startFulfillment}>
              <option value="digital">数字交付</option>
              <option value="shipping">快递物流</option>
              <option value="service">人工服务</option>
            </select>
          </label>

          <label style={labelStyle}>
            跟踪号
            <input value={trackingNo} onChange={(event) => setTrackingNo(event.target.value)} style={inputStyle} disabled={!markAsPaid || !startFulfillment} />
          </label>
        </div>

        <label style={labelStyle}>
          交付备注
          <textarea
            rows={3}
            value={deliveryNote}
            onChange={(event) => setDeliveryNote(event.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
            disabled={!markAsPaid || !startFulfillment}
          />
        </label>
      </div>

      <label style={labelStyle}>
        收货/服务地址
        <textarea
          rows={4}
          value={shippingAddress}
          onChange={(event) => setShippingAddress(event.target.value)}
          required
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      <label style={labelStyle}>
        运营备注
        <textarea
          rows={3}
          value={operatorNote}
          onChange={(event) => setOperatorNote(event.target.value)}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="例如客户偏好、沟通记录、交付注意事项。"
        />
      </label>

      <div style={summaryCard}>
        <p style={{ margin: 0, color: '#6f6661' }}>当前商品</p>
        <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{selectedProduct?.name || '-'}</p>
        {selectedProduct?.sku ? <p style={{ margin: '6px 0 0', color: '#6f6661', fontSize: 13 }}>SKU：{selectedProduct.sku}</p> : null}
        <p style={{ margin: '12px 0 0', color: '#6f6661' }}>应付金额</p>
        <p style={{ margin: '8px 0 0', fontSize: 30, fontWeight: 700 }}>
          {selectedProduct?.currency === 'CNY' ? '¥' : ''}
          {totalAmount.toLocaleString('zh-CN')}
        </p>
        {selectedProduct?.purchaseMessage ? (
          <p style={{ margin: '8px 0 0', color: '#5c5048', fontSize: 13, lineHeight: 1.7 }}>{selectedProduct.purchaseMessage}</p>
        ) : null}
        {typeof selectedProduct?.availableQuantity === 'number' ? (
          <p style={{ margin: '8px 0 0', color: '#5c5048', fontSize: 13 }}>
            剩余可售：{selectedProduct.availableQuantity} 件
          </p>
        ) : null}
        {markAsPaid ? (
          <p style={{ margin: '8px 0 0', color: '#265b35', fontSize: 13 }}>
            当前将按“线下已收款”创建订单，提交后直接进入已支付流程。
          </p>
        ) : null}
      </div>

      {error ? <p style={{ margin: 0, color: '#b42318', fontSize: 14 }}>录单失败：{error}</p> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="submit" disabled={submitting || !selectedProduct || selectedProduct.isSoldOut} style={primaryButton}>
          {submitting ? '正在创建订单...' : selectedProduct?.isSoldOut ? '当前商品不可下单' : '创建后台订单'}
        </button>
        <a href="/admin/orders-workbench" style={secondaryButton}>
          返回订单工作台
        </a>
      </div>
    </form>
  )
}

function normalizeQuantity(nextValue: number, limitPerOrder?: number, maxQuantity?: number) {
  let quantity = Math.max(1, Math.floor(nextValue))

  if (limitPerOrder) {
    quantity = Math.min(quantity, limitPerOrder)
  }

  if (typeof maxQuantity === 'number') {
    quantity = Math.min(quantity, maxQuantity)
  }

  return quantity
}

function mapCreateError(code: string) {
  switch (code) {
    case 'PRODUCT_SOLD_OUT':
      return '当前商品库存不足或已售罄。'
    case 'PRODUCT_LIMIT_EXCEEDED':
      return '已超过单笔限购数量。'
    case 'PRODUCT_NOT_FOUND':
      return '商品不存在或未上架。'
    case 'MISSING_REQUIRED_FIELDS':
      return '请填写完整的客户信息和地址。'
    case 'ORDER_NOT_FOUND':
      return '订单创建成功后未能继续写入后台信息，请到工作台检查。'
    case 'ORDER_CREATE_FAILED':
    default:
      return '创建订单失败，请稍后重试。'
  }
}

function mapPayError(code: string) {
  switch (code) {
    case 'ORDER_NOT_FOUND':
      return '订单已创建，但发起支付时找不到订单。'
    case 'ORDER_ALREADY_PAID':
      return '订单已是支付成功状态。'
    case 'ORDER_CANCELLED':
      return '订单已取消，不能再发起支付。'
    case 'ORDER_EXPIRED':
      return '订单已超时关闭，不能再发起支付。'
    case 'PAYMENT_CREATE_FAILED':
    default:
      return '订单已创建，但发起支付失败，请到订单详情页继续处理。'
  }
}

const heroCard = {
  borderRadius: 20,
  background: 'linear-gradient(135deg, #fff8f7 0%, #ffffff 45%, #fff5f3 100%)',
  border: '1px solid rgba(180,35,24,0.12)',
  padding: 20,
} as const

const summaryCard = {
  borderRadius: 20,
  background: '#faf5f3',
  border: '1px solid rgba(20,20,20,0.08)',
  padding: 18,
} as const

const gridStyle = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
} as const

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
  padding: '10px 12px',
  background: '#fff',
  fontSize: 14,
} as const

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 160,
  height: 46,
  borderRadius: 999,
  border: 0,
  background: '#b42318',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
} as const

const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 160,
  height: 46,
  borderRadius: 999,
  border: '1px solid rgba(20,20,20,0.12)',
  background: '#fff',
  color: '#1d1a17',
  fontWeight: 700,
  textDecoration: 'none',
} as const
