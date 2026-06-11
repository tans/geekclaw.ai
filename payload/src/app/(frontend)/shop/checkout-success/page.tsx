import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { createOrderPayment } from '@/lib/orders'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>
}) {
  const { orderNo } = await searchParams
  const paymentDiagnostics = await getPaymentDiagnostics()

  async function startPayment() {
    'use server'

    if (!orderNo) {
      return
    }

    const payment = await createOrderPayment(orderNo)
    redirect(payment.paymentUrl)
  }

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
            Order Created
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(32px, 5vw, 52px)' }}>订单已创建</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9 }}>
            订单已经写入 Payload 后台。点击下方按钮后，会按当前服务端配置自动发起 `{paymentDiagnostics.mode}` 支付流程。
          </p>
          <p style={{ margin: '20px 0 0', fontSize: 18, fontWeight: 700 }}>
            订单号：{orderNo || '未获取到订单号'}
          </p>
          <p style={{ margin: '8px 0 0', color: '#6f6661' }}>
            当前支付模式：<strong style={{ color: '#1d1a17' }}>{paymentDiagnostics.mode}</strong>
          </p>
          <form action={startPayment} style={{ marginTop: 20 }}>
            <button type="submit" style={buttonPrimaryButton}>
              发起支付
            </button>
          </form>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href="/payment-diagnostics" style={buttonSecondary}>
              支付配置诊断
            </Link>
            <Link href="/shop" style={buttonSecondary}>
              返回商城
            </Link>
            <Link href="/admin/collections/orders" style={buttonSecondary}>
              后台查看订单
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

const buttonPrimaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 140,
  padding: '12px 18px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  border: 0,
  fontWeight: 600,
  cursor: 'pointer',
} as const

const buttonSecondary = {
  ...buttonPrimaryButton,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
  textDecoration: 'none',
} as const
