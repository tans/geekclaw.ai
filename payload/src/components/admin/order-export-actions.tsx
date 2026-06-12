'use client'

import { useMemo, useState } from 'react'

type OrderExportActionsProps = {
  basePath?: string
}

type ExportMode = 'orders' | 'product-sales'
type PaymentStatus = '' | 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded'
type FulfillmentStatus = '' | 'pending' | 'processing' | 'shipped' | 'completed'
type OrderSource = '' | 'shop' | 'landing' | 'manual'

export function OrderExportActions({ basePath = '/api/order-export' }: OrderExportActionsProps) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [mode, setMode] = useState<ExportMode>('orders')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('')
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>('')
  const [source, setSource] = useState<OrderSource>('')
  const [createdFrom, setCreatedFrom] = useState(formatDateParam(thirtyDaysAgo))
  const [createdTo, setCreatedTo] = useState(formatDateParam(now))
  const [limit, setLimit] = useState('200')

  const previewHref = useMemo(() => {
    const params = new URLSearchParams()

    if (mode === 'product-sales') {
      params.set('mode', 'product-sales')
    }

    if (paymentStatus) {
      params.set('paymentStatus', paymentStatus)
    }

    if (fulfillmentStatus) {
      params.set('fulfillmentStatus', fulfillmentStatus)
    }

    if (source) {
      params.set('source', source)
    }

    if (createdFrom) {
      params.set('createdFrom', createdFrom)
    }

    if (createdTo) {
      params.set('createdTo', createdTo)
    }

    if (limit) {
      params.set('limit', limit)
    }

    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }, [basePath, createdFrom, createdTo, fulfillmentStatus, limit, mode, paymentStatus, source])

  const presetLinks = [
    { label: '导出全部订单', href: basePath },
    { label: '导出支付失败', href: `${basePath}?paymentStatus=failed` },
    { label: '导出待履约', href: `${basePath}?paymentStatus=paid&fulfillmentStatus=pending` },
    { label: '导出支付中', href: `${basePath}?paymentStatus=processing` },
    {
      label: '导出近 30 天订单',
      href: `${basePath}?createdFrom=${formatDateParam(thirtyDaysAgo)}&createdTo=${formatDateParam(now)}`,
    },
    {
      label: '导出商品销售汇总',
      href: `${basePath}?mode=product-sales&createdFrom=${formatDateParam(thirtyDaysAgo)}&createdTo=${formatDateParam(now)}`,
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {presetLinks.map((item) => (
          <a key={item.href} href={item.href} style={buttonStyle}>
            {item.label}
          </a>
        ))}
      </div>

      <div
        style={{
          borderRadius: 18,
          background: '#fff7f5',
          border: '1px solid rgba(180,35,24,0.12)',
          padding: 16,
          display: 'grid',
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>自定义导出</p>
          <p style={{ margin: '6px 0 0', color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>
            按当前筛选条件生成导出链接，适合按时间段、来源、支付状态或商品销售汇总做分析。
          </p>
        </div>

        <div style={gridStyle}>
          <label style={labelStyle}>
            导出类型
            <select value={mode} onChange={(event) => setMode(event.target.value as ExportMode)} style={inputStyle}>
              <option value="orders">订单明细</option>
              <option value="product-sales">商品销售汇总</option>
            </select>
          </label>

          <label style={labelStyle}>
            支付状态
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)} style={inputStyle}>
              <option value="">全部</option>
              <option value="unpaid">未支付</option>
              <option value="processing">支付中</option>
              <option value="paid">已支付</option>
              <option value="failed">支付失败</option>
              <option value="refunded">已退款</option>
            </select>
          </label>

          <label style={labelStyle}>
            履约状态
            <select
              value={fulfillmentStatus}
              onChange={(event) => setFulfillmentStatus(event.target.value as FulfillmentStatus)}
              style={inputStyle}
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="processing">准备中</option>
              <option value="shipped">已发货/已交付</option>
              <option value="completed">已完成</option>
            </select>
          </label>

          <label style={labelStyle}>
            订单来源
            <select value={source} onChange={(event) => setSource(event.target.value as OrderSource)} style={inputStyle}>
              <option value="">全部</option>
              <option value="shop">商城</option>
              <option value="landing">专题页</option>
              <option value="manual">后台录入</option>
            </select>
          </label>

          <label style={labelStyle}>
            开始日期
            <input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            结束日期
            <input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            数量上限
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href={previewHref} style={primaryButtonStyle}>
            按当前条件导出
          </a>
          <code
            style={{
              display: 'inline-block',
              maxWidth: '100%',
              padding: '8px 10px',
              borderRadius: 12,
              background: '#fff',
              color: '#6f6661',
              fontSize: 12,
              overflowX: 'auto',
            }}
          >
            {previewHref}
          </code>
        </div>
      </div>
    </div>
  )
}

function formatDateParam(value: Date) {
  return value.toISOString().slice(0, 10)
}

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 120,
  padding: '10px 14px',
  borderRadius: 999,
  background: '#fff',
  color: '#7e2d1a',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
  border: '1px solid rgba(180,35,24,0.18)',
} as const

const primaryButtonStyle = {
  ...buttonStyle,
  background: '#b42318',
  color: '#fff',
  border: '1px solid #b42318',
} as const

const gridStyle = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
