import { headers } from 'next/headers'
import type { ServerProps } from 'payload'
import { PaymentReviewActions } from '@/components/admin/payment-review-actions'
import { hasRole } from '@/lib/access'
import { getPendingFulfillmentOrders, getRecentPaymentExceptions, getStaleProcessingOrders } from '@/lib/orders'
import { formatDeliveryMethod, formatFulfillmentStatus, formatPaymentMode, formatPaymentStatus } from '@/lib/order-status'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'
import { getProcessingReviewMinutes } from '@/lib/payment-review'

export default async function PaymentStatusPanel(_: ServerProps) {
  const auth = await _.payload.auth({ headers: await headers() })
  const canManageCommerce = hasRole(auth.user, ['super-admin', 'ops'])
  const diagnostics = await getPaymentDiagnostics()
  const [recentExceptions, pendingFulfillmentOrders, staleProcessingOrders] = await Promise.all([
    getRecentPaymentExceptions(),
    getPendingFulfillmentOrders(),
    getStaleProcessingOrders(),
  ])
  const processingReviewMinutes = getProcessingReviewMinutes()
  const blockingChecks = diagnostics.readiness.checks.filter((item) => !item.passed)
  const passedChecks = diagnostics.readiness.checks.filter((item) => item.passed)
  const paymentIssueLinks = buildPaymentIssueLinks(diagnostics)

  return (
    <section
      style={{
        marginBottom: 24,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fff',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Payment Status
          </p>
          <h2 style={{ margin: '12px 0 0', fontSize: 28, lineHeight: 1.2 }}>支付配置状态</h2>
          <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>{diagnostics.summary}</p>
        </div>
        <div
          style={{
            minWidth: 160,
            borderRadius: 18,
            background: diagnostics.mode === 'real' ? '#f4fbf6' : '#fff6f5',
            padding: '16px 18px',
            alignSelf: 'flex-start',
          }}
        >
          <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>当前模式</p>
          <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700, color: '#1d1a17' }}>{formatPaymentMode(diagnostics.mode)}</p>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Card title="最近检测" value={formatDate(diagnostics.generatedAt)} meta="服务端实时生成" />
        <Card title="阻断项" value={String(blockingChecks.length)} meta={blockingChecks.length ? '需先修复' : '当前无阻断'} />
        <Card title="已通过项" value={String(passedChecks.length)} meta="基础检查通过数" />
        <Card title="App ID" value={diagnostics.appId.configured ? diagnostics.appId.valuePreview : '未配置'} meta={diagnostics.appId.source} />
        <Card title="Seller ID" value={diagnostics.sellerId.configured ? diagnostics.sellerId.valuePreview : '未配置'} meta={diagnostics.sellerId.source} />
        <Card title="应用私钥" value={diagnostics.privateKey.configured ? `${diagnostics.privateKey.lineCount} 行` : '未配置'} meta={diagnostics.privateKey.source} />
        <Card title="支付宝公钥" value={diagnostics.publicKey.configured ? `${diagnostics.publicKey.lineCount} 行` : '未配置'} meta={diagnostics.publicKey.source} />
        <Card title="Notify URL" value={diagnostics.notifyUrl.configured ? '已配置' : '未配置'} meta={diagnostics.notifyUrl.source} />
        <Card
          title="未支付关闭"
          value={`${diagnostics.orderExpiry.expireMinutes} 分钟`}
          meta={diagnostics.orderExpiry.cronSecretConfigured ? '已配置口令保护' : '缺少保护口令'}
        />
        <Card
          title="支付复核"
          value={`${diagnostics.processingReview.reviewMinutes} 分钟`}
          meta={diagnostics.processingReview.queryEnabled ? '已启用主动查单' : '当前仅支持人工复核'}
        />
      </div>

      <div style={{ marginTop: 22, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {paymentIssueLinks.map((item) => (
          <div
            key={item.title}
            style={{
              borderRadius: 18,
              border: '1px solid rgba(20,20,20,0.08)',
              background: item.tone === 'danger' ? '#fff7f6' : '#faf8f7',
              padding: 18,
              display: 'grid',
              gap: 10,
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#6f6661' }}>{item.eyebrow}</p>
              <h3 style={{ margin: '8px 0 0', fontSize: 18, color: '#1d1a17' }}>{item.title}</h3>
              <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>{item.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={item.primaryHref} style={smallButtonPrimary}>
                {item.primaryLabel}
              </a>
              {item.secondaryHref ? (
                <a href={item.secondaryHref} style={smallButtonSecondary}>
                  {item.secondaryLabel}
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>联调提醒</p>
        <div
          style={{
            borderRadius: 14,
            background: '#f7f7f6',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          当前服务端读取顺序：环境变量优先，`payment-settings` 作为回退。联调前若修改了后台支付配置但结果没变化，需要同步检查 pm2 进程环境并重启服务。
        </div>
        <div
          style={{
            borderRadius: 14,
            background: '#f7f7f6',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          当前未支付订单会在 {diagnostics.orderExpiry.expireMinutes} 分钟后自动关闭。可通过 `POST {diagnostics.orderExpiry.closeExpiredApiPath}`
          配合 `Authorization: Bearer $CRON_SECRET` 触发。
        </div>
        <div
          style={{
            borderRadius: 14,
            background: '#f7f7f6',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          支付中的订单若超过 {diagnostics.processingReview.reviewMinutes} 分钟未确认，会进入待复核队列。
          {diagnostics.processingReview.queryEnabled
            ? ` 当前支持先调用 ${diagnostics.processingReview.queryApiPath} 主动查单，再决定是否人工确认。`
            : ' 当前未配置真实支付宝密钥，因此只能人工复核。'}
        </div>
        <div
          style={{
            borderRadius: 14,
            background: '#f7f7f6',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          支持通过 `POST {diagnostics.processingReview.batchSyncApiPath}` 批量扫描超时 processing 订单，配合 `Authorization: Bearer $CRON_SECRET`
          统一收敛可自动确认的支付状态。
        </div>
        {diagnostics.warnings.length ? (
          diagnostics.warnings.map((warning) => (
            <div
              key={warning}
              style={{
                borderRadius: 14,
                background: '#faf5f3',
                padding: '12px 14px',
                color: '#4f4742',
                lineHeight: 1.7,
              }}
            >
              {warning}
            </div>
          ))
        ) : (
          <div
            style={{
              borderRadius: 14,
              background: '#f4fbf6',
              padding: '12px 14px',
              color: '#265b35',
              lineHeight: 1.7,
            }}
          >
            当前未发现阻断真实支付宝联调的关键配置缺口，可以继续验证支付跳转与异步通知回写。
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>真实支付就绪检查</p>
        {diagnostics.readiness.checks.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'grid',
              gap: 8,
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 16,
              padding: '14px 16px',
              background: item.passed ? '#f4fbf6' : '#fff7f6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <strong>{item.label}</strong>
              <span style={{ color: item.passed ? '#265b35' : '#b42318', fontWeight: 700 }}>
                {item.passed ? '通过' : '未通过'}
              </span>
            </div>
            <div style={{ color: '#4f4742', lineHeight: 1.7 }}>{item.detail}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/admin/payment-readiness" style={buttonPrimary}>
          打开联调就绪页
        </a>
        <a href="/admin/payment-observability" style={buttonSecondary}>
          打开支付观测页
        </a>
        <a href="/payment-diagnostics" style={buttonSecondary}>
          打开诊断页并复检
        </a>
        <a href="/admin/globals/payment-settings" style={buttonSecondary}>
          打开支付配置
        </a>
        <a href="/admin/collections/orders" style={buttonSecondary}>
          查看订单列表
        </a>
        <a href={buildOrdersFilterHref({ paymentStatus: 'failed' })} style={buttonSecondary}>
          支付失败列表
        </a>
        <a href={buildOrdersFilterHref({ paymentStatus: 'processing' })} style={buttonSecondary}>
          支付中列表
        </a>
        <a href={buildPendingFulfillmentHref()} style={buttonSecondary}>
          待履约列表
        </a>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>支付中待复核订单</p>
        {staleProcessingOrders.length ? (
          staleProcessingOrders.map((order) => (
            <div
              key={order.id}
              style={{
                display: 'grid',
                gap: 8,
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 16,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{order.orderNo}</strong>
                <span style={{ color: '#7c4d12', fontWeight: 700 }}>
                  支付中超过 {processingReviewMinutes} 分钟
                </span>
              </div>
              <div style={{ color: '#4f4742', lineHeight: 1.7 }}>
                <span>{order.customerName || '未填写联系人'}</span>
                <span> · </span>
                <span>¥{formatCurrency(order.totalAmount)}</span>
                <span> · </span>
                <span>最近更新：{formatDate(order.updatedAt)}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`/admin/collections/orders/${order.id}`} style={smallButtonPrimary}>
                  订单详情
                </a>
                <a href={`/admin/collections/orders/${order.id}/payment-events`} style={smallButtonSecondary}>
                  订单时间线
                </a>
              </div>
              {canManageCommerce ? <PaymentReviewActions orderNo={order.orderNo} compact /> : null}
            </div>
          ))
        ) : (
          <div
            style={{
              borderRadius: 14,
              background: '#f7f7f6',
              padding: '12px 14px',
              color: '#4f4742',
              lineHeight: 1.7,
            }}
          >
            当前没有需要人工复核的支付中订单。
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>最近异常/处理中订单</p>
        {recentExceptions.length ? (
          recentExceptions.map((order) => (
            <div
              key={order.id}
              style={{
                display: 'grid',
                gap: 8,
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 16,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{order.orderNo}</strong>
                <span style={{ color: order.paymentStatus === 'failed' ? '#b42318' : '#8a5b12', fontWeight: 700 }}>
                  {formatPaymentStatus(order.paymentStatus)}
                </span>
              </div>
              <div style={{ color: '#4f4742', lineHeight: 1.7 }}>
                <span>{order.customerName || '未填写联系人'}</span>
                <span> · </span>
                <span>¥{formatCurrency(order.totalAmount)}</span>
                <span> · </span>
                <span>{formatFulfillmentStatus(order.fulfillmentStatus)}</span>
                <span> · </span>
                <span>{order.paymentLastError || '等待回调或处理中'}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`/admin/collections/orders/${order.id}`} style={smallButtonPrimary}>
                  订单详情
                </a>
                <a href={`/admin/collections/orders/${order.id}/payment-events`} style={smallButtonSecondary}>
                  订单时间线
                </a>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              borderRadius: 14,
              background: '#f7f7f6',
              padding: '12px 14px',
              color: '#4f4742',
              lineHeight: 1.7,
            }}
          >
            当前没有支付失败或支付中的订单。
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>待履约订单</p>
        {pendingFulfillmentOrders.length ? (
          pendingFulfillmentOrders.map((order) => (
            <div
              key={order.id}
              style={{
                display: 'grid',
                gap: 8,
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 16,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{order.orderNo}</strong>
                <span style={{ color: '#265b35', fontWeight: 700 }}>
                  {formatFulfillmentStatus(order.fulfillmentStatus)}
                </span>
              </div>
              <div style={{ color: '#4f4742', lineHeight: 1.7 }}>
                <span>{order.customerName || '未填写联系人'}</span>
                <span> · </span>
                <span>¥{formatCurrency(order.totalAmount)}</span>
                <span> · </span>
                <span>{formatDeliveryMethod(order.deliveryMethod)}</span>
                <span> · </span>
                <span>{order.paidAt ? `支付于 ${formatDate(order.paidAt)}` : '已支付，等待履约'}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`/admin/collections/orders/${order.id}`} style={smallButtonPrimary}>
                  处理订单
                </a>
                <a href={`/orders/${order.orderNo}`} style={smallButtonSecondary}>
                  前台详情
                </a>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              borderRadius: 14,
              background: '#f7f7f6',
              padding: '12px 14px',
              color: '#4f4742',
              lineHeight: 1.7,
            }}
          >
            当前没有已支付但未完成履约的订单。
          </div>
        )}
      </div>
    </section>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function formatCurrency(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '0'
}

function Card({ title, value, meta }: { title: string; value: string; meta: string }) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 18,
        padding: 18,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{title}</p>
      <p style={{ margin: '8px 0 0', color: '#1d1a17', fontWeight: 700, wordBreak: 'break-all' }}>{value}</p>
      <p style={{ margin: '10px 0 0', color: '#6f6661', fontSize: 12 }}>来源：{formatMetaLabel(meta)}</p>
    </article>
  )
}

function formatMetaLabel(value: string) {
  return (
    {
      env: '环境变量',
      'site-settings': '站点设置',
      fallback: '回退值',
      missing: '缺失',
      '服务端实时生成': '服务端实时生成',
      '需先修复': '需先修复',
      '当前无阻断': '当前无阻断',
      '基础检查通过数': '基础检查通过数',
    }[value] || value
  )
}

function buildPaymentIssueLinks(diagnostics: Awaited<ReturnType<typeof getPaymentDiagnostics>>) {
  const missingCredentials =
    !diagnostics.appId.configured || !diagnostics.sellerId.configured || !diagnostics.privateKey.configured || !diagnostics.publicKey.configured

  const missingUrls = !diagnostics.notifyUrl.configured || !diagnostics.returnUrl.configured

  return [
    {
      eyebrow: '配置修复',
      title: missingCredentials ? '补齐支付宝身份与密钥' : '核对当前密钥来源',
      description: missingCredentials
        ? 'App ID、Seller ID、应用私钥、支付宝公钥存在缺口时，真实支付和异步通知都无法联调。'
        : '核心身份和密钥已存在，若联调结果异常，先核对是环境变量生效还是站点设置生效。',
      primaryHref: '/admin/globals/site-settings',
      primaryLabel: '编辑站点设置',
      secondaryHref: '/payment-diagnostics',
      secondaryLabel: '查看完整诊断',
      tone: missingCredentials ? 'danger' : 'neutral',
    },
    {
      eyebrow: '回调校验',
      title: missingUrls ? '检查支付回调地址' : '验证 notify / return 联调',
      description: missingUrls
        ? 'notifyUrl 或 returnUrl 缺失时，支付结果无法可靠回写，用户回跳也会异常。'
        : '回调地址已存在，下一步应验证支付成功回跳、异步通知写单和订单详情展示是否一致。',
      primaryHref: '/payment-diagnostics',
      primaryLabel: '打开诊断页',
      secondaryHref: '/admin/collections/orders',
      secondaryLabel: '查看订单列表',
      tone: missingUrls ? 'danger' : 'neutral',
    },
    {
      eyebrow: '异常处理',
      title: staleProcessingLabel(diagnostics),
      description: diagnostics.processingReview.queryEnabled
        ? '当前已具备主动查单前提，支付中超时订单可先查单再决定人工确认或标记失败。'
        : '当前仍是 Mock 或缺少真实密钥，支付中异常单只能走人工复核与运营确认。',
      primaryHref: buildOrdersFilterHref({ paymentStatus: 'processing' }),
      primaryLabel: '打开支付中订单',
      secondaryHref: '/admin/orders-workbench',
      secondaryLabel: '进入订单工作台',
      tone: diagnostics.processingReview.queryEnabled ? 'neutral' : 'danger',
    },
  ]
}

function staleProcessingLabel(diagnostics: Awaited<ReturnType<typeof getPaymentDiagnostics>>) {
  return diagnostics.processingReview.queryEnabled ? '处理支付中超时订单' : '人工复核支付中异常单'
}

function buildOrdersFilterHref(filters: {
  paymentStatus?: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded'
}) {
  const params = new URLSearchParams()

  if (filters.paymentStatus) {
    params.set('where[paymentStatus][equals]', filters.paymentStatus)
  }

  return `/admin/collections/orders?${params.toString()}`
}

function buildPendingFulfillmentHref() {
  const params = new URLSearchParams()
  params.set('where[paymentStatus][equals]', 'paid')
  params.set('where[fulfillmentStatus][not_equals]', 'completed')
  return `/admin/collections/orders?${params.toString()}`
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

const smallButtonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 96,
  padding: '8px 12px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
} as const

const smallButtonSecondary = {
  ...smallButtonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
