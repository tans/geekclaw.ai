import type { BeforeListServerProps } from 'payload'
import { OrdersListBatchPanel } from '@/components/admin/orders-list-batch-panel'

const quickFilters = [
  {
    label: 'Notify 异常',
    description: '验签失败、缺字段或业务校验失败',
    href: '/admin/collections/orders?where[paymentHasNotifyIssue][equals]=1',
    tone: '#b42318',
  },
  {
    label: '无回跳记录',
    description: '适合排查跳转链路或用户未返回',
    href: '/admin/collections/orders?where[paymentHasReturnRecord][equals]=0',
    tone: '#8a5b12',
  },
  {
    label: '已查单',
    description: '已经触发主动查单的订单',
    href: '/admin/collections/orders?where[paymentHasQueryRecord][equals]=1',
    tone: '#7c4d12',
  },
  {
    label: '结果未确认',
    description: '还没有 paid / failed 明确结果',
    href: '/admin/collections/orders?where[paymentHasFinalResult][equals]=0',
    tone: '#6f6661',
  },
] as const

export default async function OrdersListToolbar(props: BeforeListServerProps) {
  const totalDocs = props.data?.totalDocs || 0
  const docs = Array.isArray(props.data?.docs) ? props.data.docs : []
  const batchOrders = docs
    .filter((doc): doc is Record<string, unknown> => !!doc && typeof doc === 'object')
    .map((doc) => ({
      id: typeof doc.id === 'number' ? doc.id : Number(doc.id || 0),
      orderNo: typeof doc.orderNo === 'string' ? doc.orderNo : '',
      customerName: typeof doc.customerName === 'string' ? doc.customerName : null,
      totalAmount: typeof doc.totalAmount === 'number' ? doc.totalAmount : null,
      paymentStatus: typeof doc.paymentStatus === 'string' ? doc.paymentStatus : null,
      fulfillmentStatus: typeof doc.fulfillmentStatus === 'string' ? doc.fulfillmentStatus : null,
    }))
    .filter((doc) => doc.id > 0 && doc.orderNo)
  const summary = docs.reduce(
    (acc, doc) => {
      if (!doc || typeof doc !== 'object') {
        return acc
      }

      const paymentStatus = typeof doc.paymentStatus === 'string' ? doc.paymentStatus : ''
      const fulfillmentStatus = typeof doc.fulfillmentStatus === 'string' ? doc.fulfillmentStatus : ''
      const paymentHasIssue = doc.paymentHasIssue === true
      const paymentHasNotifyIssue = doc.paymentHasNotifyIssue === true
      const paymentHasReturnRecord = doc.paymentHasReturnRecord === true
      const paymentHasQueryRecord = doc.paymentHasQueryRecord === true
      const paymentHasFinalResult = doc.paymentHasFinalResult === true

      if (paymentStatus === 'processing') {
        acc.processing += 1
      }

      if (paymentStatus === 'failed') {
        acc.failed += 1
      }

      if (paymentStatus === 'paid' && fulfillmentStatus !== 'completed') {
        acc.pendingFulfillment += 1
      }

      if (paymentHasIssue) {
        acc.chainIssue += 1
      }

      if (paymentHasNotifyIssue) {
        acc.notifyIssue += 1
      }

      if (!paymentHasReturnRecord) {
        acc.missingReturn += 1
      }

      if (paymentHasQueryRecord) {
        acc.queried += 1
      }

      if (!paymentHasFinalResult) {
        acc.resultMissing += 1
      }

      return acc
    },
    {
      processing: 0,
      failed: 0,
      pendingFulfillment: 0,
      chainIssue: 0,
      notifyIssue: 0,
      missingReturn: 0,
      queried: 0,
      resultMissing: 0,
    },
  )

  return (
    <section
      style={{
        marginBottom: 20,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fff',
        padding: 20,
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Orders List Ops
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>订单列表运营工具条</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            当前原生列表结果 {totalDocs} 条。这里提供最常用的支付链路筛选入口，不必先回工作台再进入订单集合。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/orders-workbench" style={buttonPrimary}>
            返回订单工作台
          </a>
          <a href="/admin/payment-observability" style={buttonSecondary}>
            支付回调观测页
          </a>
          <a href="/admin/payment-readiness" style={buttonSecondary}>
            支付联调就绪页
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {quickFilters.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 18,
              background: '#faf8f7',
              padding: '16px 18px',
              textDecoration: 'none',
              display: 'grid',
              gap: 8,
            }}
          >
            <strong style={{ color: item.tone, fontSize: 18 }}>{item.label}</strong>
            <span style={{ color: '#4f4742', lineHeight: 1.7, fontSize: 13 }}>{item.description}</span>
            <span style={{ color: '#6f6661', fontSize: 12 }}>打开原生列表筛选</span>
          </a>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="当前结果" value={String(totalDocs)} note="当前 Payload 原生列表命中的订单数" tone="#1d1a17" />
        <MetricCard label="支付中" value={String(summary.processing)} note="适合继续查单或人工复核" tone="#8a5b12" />
        <MetricCard label="待履约" value={String(summary.pendingFulfillment)} note="已支付但尚未完成交付" tone="#265b35" />
        <MetricCard label="支付失败" value={String(summary.failed)} note="适合回访用户或排查失败原因" tone="#b42318" />
        <MetricCard label="链路异常" value={String(summary.chainIssue)} note="当前结果集中被标记为需关注的订单" tone="#b42318" />
        <MetricCard label="Notify 异常" value={String(summary.notifyIssue)} note="优先排验签、缺字段和业务校验失败" tone="#b42318" />
        <MetricCard label="无回跳" value={String(summary.missingReturn)} note="适合排查 return 链路或用户未返回" tone="#8a5b12" />
        <MetricCard label="结果未确认" value={String(summary.resultMissing)} note="还没有 paid / failed 明确结果" tone="#6f6661" />
      </div>

      <OrdersListBatchPanel orders={batchOrders} />

      <div
        style={{
          borderRadius: 14,
          background: '#f7f7f6',
          padding: '12px 14px',
          color: '#4f4742',
          lineHeight: 1.7,
        }}
      >
        默认列表列已包含 `paymentChainTags`。如果需要进一步组合条件，可以在当前列表基础上继续叠加 `paymentStatus`、`fulfillmentStatus`
        或日期筛选。当前摘要基于这一页已经命中的结果实时聚合，不需要额外跳回工作台。
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone: string
}) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 16,
        background: '#fff',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
  )
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 140,
  padding: '12px 18px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
} as const

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
