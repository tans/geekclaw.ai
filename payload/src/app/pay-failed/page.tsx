import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { getOrderByOrderNo } from '@/lib/orders'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export default async function PayFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>
}) {
  const { orderNo } = await searchParams
  const order = orderNo ? await getOrderByOrderNo(orderNo) : null
  const paymentDiagnostics = await getPaymentDiagnostics()

  return (
    <PageShell>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section
          style={{
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 28,
            padding: 32,
          }}
        >
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
            Payment Failed
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(32px, 5vw, 52px)' }}>支付未完成</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9 }}>
            当前页面用于承接支付中断或失败后的用户回流，后续会结合真实回调状态进一步完善。
          </p>
          <div style={{ marginTop: 24, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <InfoCard label="订单号" value={orderNo || '-'} />
            <InfoCard label="当前支付状态" value={order?.paymentStatus || '-'} />
            <InfoCard label="订单状态" value={order?.status || '-'} />
            <InfoCard label="支付模式" value={paymentDiagnostics.mode} />
          </div>
          {order ? (
            <div
              style={{
                marginTop: 20,
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 22,
                padding: 20,
                color: '#4f4742',
                lineHeight: 1.8,
              }}
            >
              <p style={{ margin: 0 }}><strong>联系人：</strong>{order.customerName || '-'}</p>
              <p style={{ margin: 0 }}><strong>手机号：</strong>{order.customerPhone || '-'}</p>
              <p style={{ margin: 0 }}><strong>应付金额：</strong>¥{order.totalAmount.toLocaleString('zh-CN')}</p>
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
            {orderNo ? (
              <Link href={`/orders/${orderNo}`} style={buttonPrimary}>
                返回订单详情
              </Link>
            ) : null}
            {orderNo ? (
              <Link href={`/shop/checkout-success?orderNo=${encodeURIComponent(orderNo)}`} style={buttonPrimary}>
                重新发起支付
              </Link>
            ) : null}
            <Link href="/shop" style={buttonPrimary}>
              返回商城
            </Link>
            <Link href="/payment-diagnostics" style={buttonSecondary}>
              支付配置诊断
            </Link>
            <Link href="/admin/collections/orders" style={buttonSecondary}>
              查看订单
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
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

const infoCard = {
  border: '1px solid rgba(20,20,20,0.08)',
  borderRadius: 22,
  padding: 18,
} as const

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article style={infoCard}>
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '8px 0 0', color: '#1d1a17', fontWeight: 700, wordBreak: 'break-all' }}>{value}</p>
    </article>
  )
}

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
