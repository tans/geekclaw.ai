import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { getOrderByOrderNo, markOrderPaid } from '@/lib/orders'
import { formatOrderStatus, formatPaymentMode, formatPaymentStatus } from '@/lib/order-status'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'
import { getSiteData } from '@/lib/site'
import { validateAlipayOrderResult } from '@/lib/payment'

export default async function PaySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ out_trade_no?: string; trade_no?: string; trade_status?: string; total_amount?: string }>
}) {
  const { out_trade_no, trade_no, trade_status, total_amount } = await searchParams
  let order = out_trade_no ? await getOrderByOrderNo(out_trade_no) : null
  const paymentDiagnostics = await getPaymentDiagnostics()
  const site = await getSiteData()
  const validation =
    out_trade_no && order
      ? await validateAlipayOrderResult({
          orderNo: out_trade_no,
          appId: site.payment.appId,
          totalAmount: total_amount,
        })
      : null

  if (
    order &&
    out_trade_no &&
    trade_no &&
    isPaidTradeStatus(trade_status) &&
    order.paymentStatus !== 'paid' &&
    validation?.ok
  ) {
    try {
      order = await markOrderPaid({
        orderNo: out_trade_no,
        tradeNo: trade_no,
        source: 'alipay-return',
        message: '支付宝同步返回页已确认支付成功，最终状态仍以异步通知回写为准。',
        paymentPayload: {
          provider: 'alipay-return',
          outTradeNo: out_trade_no,
          tradeNo: trade_no,
          tradeStatus: trade_status,
          totalAmount: total_amount,
        },
      })
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'ORDER_CANCELLED') {
        throw error
      }
    }
  }

  const firstItem = order?.items?.[0]
  const productName =
    typeof firstItem?.product === 'object' && firstItem.product?.name
      ? firstItem.product.name
      : 'GeekClaw 商品'

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
            Payment Success
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(32px, 5vw, 52px)' }}>支付返回页</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9 }}>
            当前页用于承接支付宝同步返回。若订单业务校验通过，会先做一次同步回写兜底，最终状态仍以异步通知为准。
          </p>
          <div style={{ marginTop: 24, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <InfoCard label="订单号" value={out_trade_no || '-'} />
            <InfoCard label="交易号" value={trade_no || '-'} />
            <InfoCard label="支付状态" value={formatPaymentStatus(order?.paymentStatus)} />
            <InfoCard label="订单状态" value={formatOrderStatus(order?.status)} />
            <InfoCard label="支付模式" value={formatPaymentMode(paymentDiagnostics.mode)} />
          </div>
          {validation && !validation.ok ? (
            <div
              style={{
                marginTop: 20,
                borderRadius: 18,
                background: '#faf5f3',
                padding: '14px 16px',
                color: '#4f4742',
                lineHeight: 1.8,
              }}
            >
              当前返回参数未通过业务校验：{validation.message}
            </div>
          ) : null}
          {order?.status === 'cancelled' ? (
            <div
              style={{
                marginTop: 20,
                borderRadius: 18,
                background: '#faf5f3',
                padding: '14px 16px',
                color: '#4f4742',
                lineHeight: 1.8,
              }}
            >
              这个订单已提前取消。即使支付返回页到达，也不会再把订单改成已支付。
            </div>
          ) : null}
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
              <p style={{ margin: 0 }}><strong>商品：</strong>{productName}</p>
              <p style={{ margin: 0 }}><strong>应付金额：</strong>¥{formatCurrency(order.totalAmount)}</p>
              <p style={{ margin: 0 }}><strong>联系人：</strong>{order.customerName || '-'}</p>
              <p style={{ margin: 0 }}><strong>订单详情页：</strong>/orders/{order.orderNo}</p>
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
            {out_trade_no ? (
              <Link href={`/orders/${out_trade_no}`} style={buttonPrimary}>
                查看订单详情
              </Link>
            ) : null}
            <Link href="/payment-diagnostics" style={buttonSecondary}>
              支付配置诊断
            </Link>
            <Link href="/shop" style={buttonSecondary}>
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

function isPaidTradeStatus(value: string | undefined) {
  return value === 'TRADE_SUCCESS' || value === 'TRADE_FINISHED'
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

function formatCurrency(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '0'
}
