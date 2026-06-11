import Link from 'next/link'
import { PageShell } from '@/components/page-shell'

export default async function AlipayRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{
    outTradeNo?: string
    subject?: string
    totalAmount?: string
  }>
}) {
  const params = await searchParams

  return (
    <PageShell>
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section
          style={{
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 28,
            padding: 32,
          }}
        >
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
            Alipay Bridge
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(30px, 5vw, 48px)' }}>支付宝跳转占位页</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9 }}>
            当前已完成订单到支付发起的骨架。接入真实支付宝签名后，这里会替换成真实跳转表单。
          </p>
          <div style={{ marginTop: 24, lineHeight: 1.9, color: '#4f4742' }}>
            <p style={{ margin: 0 }}>订单号：{params.outTradeNo || '-'}</p>
            <p style={{ margin: 0 }}>商品：{params.subject || '-'}</p>
            <p style={{ margin: 0 }}>金额：{params.totalAmount || '-'}</p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href="/shop" style={buttonPrimary}>
              返回商城
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

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
