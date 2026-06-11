import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MockPaymentActions } from '@/components/mock-payment-actions'
import { PageShell } from '@/components/page-shell'
import { getOrderByOrderNo } from '@/lib/orders'

export default async function MockPayPage({
  params,
}: {
  params: Promise<{ orderNo: string }>
}) {
  const { orderNo } = await params
  const order = await getOrderByOrderNo(orderNo)

  if (!order) {
    notFound()
  }

  return (
    <PageShell>
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: '1.1fr 0.9fr',
          }}
        >
          <article
            style={{
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 32,
            }}
          >
            <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
              Mock Payment
            </p>
            <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(30px, 5vw, 48px)' }}>模拟支付页</h1>
            <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9 }}>
              当前环境未配置真实支付宝密钥，所以这里用 mock 支付页完成订单闭环验证。
            </p>
            <MockPaymentActions orderNo={orderNo} />
          </article>

          <aside
            style={{
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 28,
              alignSelf: 'start',
            }}
          >
            <p style={{ margin: 0, color: '#6f6661' }}>订单号</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{order.orderNo}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>支付状态</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{order.paymentStatus}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>金额</p>
            <p style={{ margin: '8px 0 0', fontSize: 30, fontWeight: 700 }}>¥{order.totalAmount.toLocaleString('zh-CN')}</p>
            <div style={{ marginTop: 20 }}>
              <Link href={`/orders/${order.orderNo}`} style={linkStyle}>
                查看订单详情
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  )
}

const linkStyle = {
  color: '#b42318',
  textDecoration: 'none',
  fontWeight: 600,
} as const
