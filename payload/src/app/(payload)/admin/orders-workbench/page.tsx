import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { BatchOrderQueue } from '@/components/admin/batch-order-queue'
import { hasRole } from '@/lib/access'
import { OrderExportActions } from '@/components/admin/order-export-actions'
import { parseOrderPaymentEvents, summarizePaymentChain } from '@/lib/payment-chain'
import { getPendingFulfillmentOrders, getPendingPaymentOrders, getRecentPaymentExceptions, getStaleProcessingOrders } from '@/lib/orders'
import { getProcessingReviewMinutes } from '@/lib/payment-review'

type WorkbenchFilter = 'all' | 'notify-issue' | 'missing-return' | 'queried' | 'result-missing'

export default async function OrdersWorkbenchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  const canManageCommerce = hasRole(auth.user, ['super-admin', 'ops'])
  const resolvedSearchParams = (await searchParams) || {}
  const activeFilter = normalizeWorkbenchFilter(readSingleParam(resolvedSearchParams.chain))
  const [pendingPayments, pendingFulfillment, paymentExceptions, staleProcessingOrders] = await Promise.all([
    getPendingPaymentOrders(12),
    getPendingFulfillmentOrders(12),
    getRecentPaymentExceptions(12),
    getStaleProcessingOrders(12),
  ])
  const processingReviewMinutes = getProcessingReviewMinutes()
  const exceptionSummary = buildChainSummary(paymentExceptions)
  const filteredExceptions = filterOrdersByChain(paymentExceptions, activeFilter)
  const filteredPendingPayments = filterOrdersByChain(pendingPayments, activeFilter)
  const filteredStaleProcessingOrders = filterOrdersByChain(staleProcessingOrders, activeFilter)

  return (
    <main
      style={{
        padding: 24,
        display: 'grid',
        gap: 20,
        background: '#f5f5f3',
        minHeight: '100vh',
      }}
    >
      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 20,
          background: '#fff',
          padding: 24,
        }}
      >
        <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Orders Workbench
        </p>
        <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>订单运营工作台</h1>
        <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          把待支付、待履约、异常单集中到一个后台页面，方便运营同学按优先级处理。
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link href="/admin/collections/orders" style={buttonPrimary}>
            打开订单列表
          </Link>
          <Link href="/admin/manual-order" style={buttonPrimary}>
            后台录单
          </Link>
          <Link href="/admin/payment-readiness" style={buttonPrimary}>
            支付联调就绪页
          </Link>
          <Link href="/admin/payment-observability" style={buttonPrimary}>
            支付回调观测页
          </Link>
          <Link href={buildOrdersFilterHref({ paymentStatus: 'failed' })} style={buttonSecondary}>
            仅看支付失败
          </Link>
          <Link href={buildOrdersFilterHref({ paymentStatus: 'processing' })} style={buttonSecondary}>
            仅看支付中
          </Link>
          {activeFilter !== 'all' ? (
            <Link href={buildNativeChainFilterHref(activeFilter)} style={buttonSecondary}>
              用原生列表查看当前链路筛选
            </Link>
          ) : null}
          <Link href={buildPendingFulfillmentHref()} style={buttonSecondary}>
            仅看待履约
          </Link>
          <Link href="/admin/globals/site-settings" style={buttonSecondary}>
            站点设置
          </Link>
        </div>
        <div style={{ marginTop: 16 }}>
          <OrderExportActions />
        </div>
      </section>

      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 20,
          background: '#fff',
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>异常链路概览</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            先看这组链路标签，再决定今天优先处理 notify 异常、无回跳订单，还是已查单但仍未收敛的订单。
          </p>
        </div>
        <div style={summaryGridStyle}>
          <SummaryFilterCard
            label="全部异常单"
            value={String(exceptionSummary.total)}
            note="最近异常 / 处理中队列"
            href={buildWorkbenchFilterHref('all')}
            active={activeFilter === 'all'}
            tone="#1d1a17"
          />
          <SummaryFilterCard
            label="notify 异常"
            value={String(exceptionSummary.notifyIssue)}
            note="优先排验签、缺字段、业务校验失败"
            href={buildWorkbenchFilterHref('notify-issue')}
            active={activeFilter === 'notify-issue'}
            tone="#b42318"
          />
          <SummaryFilterCard
            label="无回跳记录"
            value={String(exceptionSummary.missingReturn)}
            note="适合排查跳转链路或用户未返回"
            href={buildWorkbenchFilterHref('missing-return')}
            active={activeFilter === 'missing-return'}
            tone="#8a5b12"
          />
          <SummaryFilterCard
            label="已查单"
            value={String(exceptionSummary.queried)}
            note="已经触发主动查单"
            href={buildWorkbenchFilterHref('queried')}
            active={activeFilter === 'queried'}
            tone="#7c4d12"
          />
          <SummaryFilterCard
            label="结果未确认"
            value={String(exceptionSummary.resultMissing)}
            note="还没有 paid / failed 明确结果"
            href={buildWorkbenchFilterHref('result-missing')}
            active={activeFilter === 'result-missing'}
            tone="#6f6661"
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={buildWorkbenchFilterHref('all')} style={activeFilter === 'all' ? buttonPrimary : smallButtonSecondary}>
            查看全部异常队列
          </Link>
          <Link href={buildWorkbenchFilterHref('notify-issue')} style={activeFilter === 'notify-issue' ? buttonPrimary : smallButtonSecondary}>
            仅看 notify 异常
          </Link>
          <Link href={buildWorkbenchFilterHref('missing-return')} style={activeFilter === 'missing-return' ? buttonPrimary : smallButtonSecondary}>
            仅看无回跳
          </Link>
          <Link href={buildWorkbenchFilterHref('queried')} style={activeFilter === 'queried' ? buttonPrimary : smallButtonSecondary}>
            仅看已查单
          </Link>
          <Link href={buildWorkbenchFilterHref('result-missing')} style={activeFilter === 'result-missing' ? buttonPrimary : smallButtonSecondary}>
            仅看结果未确认
          </Link>
        </div>
        <div
          style={{
            borderRadius: 14,
            background: '#faf8f7',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          当前筛选：{describeWorkbenchFilter(activeFilter)}。该筛选会同时作用于“支付中待复核”、“待支付 / 支付中”和“异常 / 处理中”三个运营队列。
        </div>
      </section>

      <section style={gridStyle}>
        <MetricCard label="待支付/支付中" value={String(filteredPendingPayments.length)} tone="#8a5b12" />
        <MetricCard label="待履约" value={String(pendingFulfillment.length)} tone="#265b35" />
        <MetricCard label="异常/处理中" value={String(filteredExceptions.length)} tone="#b42318" />
        <MetricCard label="超时待复核" value={String(filteredStaleProcessingOrders.length)} tone="#7c4d12" />
      </section>

      <BatchOrderQueue
        title="支付中待复核"
        description={`支付状态停留在 processing 超过 ${processingReviewMinutes} 分钟的订单，建议人工确认是否到账。`}
        emptyText={buildEmptyText('当前没有超时待复核的支付中订单。', activeFilter)}
        orders={filteredStaleProcessingOrders}
        viewAllHref={buildOrdersFilterHref({ paymentStatus: 'processing' })}
        renderMode="review"
        allowCommerceActions={canManageCommerce}
        batchActions={[
          { label: '批量确认已支付', action: 'mark-paid', tone: 'success' },
          { label: '批量标记失败', action: 'mark-failed', tone: 'danger' },
        ]}
      />

      <BatchOrderQueue
        title="待支付 / 支付中"
        description="适合客服或运营跟进用户补支付、确认支付卡点。"
        emptyText={buildEmptyText('当前没有待支付或支付中的订单。', activeFilter)}
        orders={filteredPendingPayments}
        viewAllHref={buildPendingPaymentHref()}
        allowCommerceActions={canManageCommerce}
        batchActions={[{ label: '批量取消订单', action: 'cancel', tone: 'danger' }]}
      />

      <BatchOrderQueue
        title="待履约"
        description="已支付但尚未完成交付的订单，适合运营逐单推进。"
        emptyText="当前没有待履约订单。"
        orders={pendingFulfillment}
        viewAllHref={buildPendingFulfillmentHref()}
        renderMode="fulfillment"
        allowCommerceActions={canManageCommerce}
        batchActions={[
          { label: '批量标记准备中', action: 'mark-processing', tone: 'primary' },
          { label: '批量标记已完成', action: 'mark-completed', tone: 'success' },
        ]}
      />

      <BatchOrderQueue
        title="异常 / 处理中"
        description="聚合支付失败和处理中订单，便于排查支付问题。"
        emptyText={buildEmptyText('当前没有异常或处理中订单。', activeFilter)}
        orders={filteredExceptions}
        viewAllHref={buildExceptionHref()}
        allowCommerceActions={canManageCommerce}
        batchActions={[{ label: '批量取消订单', action: 'cancel', tone: 'danger' }]}
      />
    </main>
  )
}

function buildOrdersFilterHref(filters: {
  paymentStatus?: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded'
  fulfillmentStatusNotEquals?: 'completed'
}) {
  const params = new URLSearchParams()

  if (filters.paymentStatus) {
    params.set('where[paymentStatus][equals]', filters.paymentStatus)
  }

  if (filters.fulfillmentStatusNotEquals) {
    params.set('where[fulfillmentStatus][not_equals]', filters.fulfillmentStatusNotEquals)
  }

  return `/admin/collections/orders?${params.toString()}`
}

function buildPendingPaymentHref() {
  return buildOrdersFilterHref({ paymentStatus: 'unpaid' })
}

function buildPendingFulfillmentHref() {
  const params = new URLSearchParams()
  params.set('where[paymentStatus][equals]', 'paid')
  params.set('where[fulfillmentStatus][not_equals]', 'completed')
  return `/admin/collections/orders?${params.toString()}`
}

function buildExceptionHref() {
  return buildOrdersFilterHref({ paymentStatus: 'failed' })
}

function buildWorkbenchFilterHref(filter: WorkbenchFilter) {
  return filter === 'all' ? '/admin/orders-workbench' : `/admin/orders-workbench?chain=${encodeURIComponent(filter)}`
}

function buildNativeChainFilterHref(filter: Exclude<WorkbenchFilter, 'all'>) {
  const params = new URLSearchParams()
  switch (filter) {
    case 'notify-issue':
      params.set('where[paymentHasNotifyIssue][equals]', '1')
      break
    case 'missing-return':
      params.set('where[paymentHasReturnRecord][equals]', '0')
      break
    case 'queried':
      params.set('where[paymentHasQueryRecord][equals]', '1')
      break
    case 'result-missing':
      params.set('where[paymentHasFinalResult][equals]', '0')
      break
  }
  return `/admin/collections/orders?${params.toString()}`
}

function readSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function normalizeWorkbenchFilter(value: string): WorkbenchFilter {
  const candidates: WorkbenchFilter[] = ['all', 'notify-issue', 'missing-return', 'queried', 'result-missing']
  return candidates.includes(value as WorkbenchFilter) ? (value as WorkbenchFilter) : 'all'
}

function buildChainSummary(orders: Array<{ paymentEvents?: unknown }>) {
  return orders.reduce(
    (acc, order) => {
      const chain = summarizePaymentChain(parseOrderPaymentEvents(order.paymentEvents))
      acc.total += 1
      if (chain.notifyState === 'issue') acc.notifyIssue += 1
      if (!chain.lastReturn) acc.missingReturn += 1
      if (chain.lastQuery) acc.queried += 1
      if (!chain.lastPaid && !chain.lastFailed) acc.resultMissing += 1
      return acc
    },
    {
      total: 0,
      notifyIssue: 0,
      missingReturn: 0,
      queried: 0,
      resultMissing: 0,
    },
  )
}

function filterOrdersByChain<T extends { paymentEvents?: unknown }>(orders: T[], filter: WorkbenchFilter) {
  if (filter === 'all') {
    return orders
  }

  return orders.filter((order) => {
    const chain = summarizePaymentChain(parseOrderPaymentEvents(order.paymentEvents))

    switch (filter) {
      case 'notify-issue':
        return chain.notifyState === 'issue'
      case 'missing-return':
        return !chain.lastReturn
      case 'queried':
        return Boolean(chain.lastQuery)
      case 'result-missing':
        return !chain.lastPaid && !chain.lastFailed
      default:
        return true
    }
  })
}

function describeWorkbenchFilter(filter: WorkbenchFilter) {
  return (
    {
      all: '全部异常链路',
      'notify-issue': '仅看 notify 异常',
      'missing-return': '仅看无回跳记录',
      queried: '仅看已查单',
      'result-missing': '仅看结果未确认',
    }[filter] || filter
  )
}

function buildEmptyText(base: string, filter: WorkbenchFilter) {
  return filter === 'all' ? base : `${base} 当前筛选为“${describeWorkbenchFilter(filter)}”。`
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 18,
        background: '#fff',
        padding: 20,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 30, fontWeight: 700, color: tone }}>{value}</p>
    </article>
  )
}

function SummaryFilterCard({
  label,
  value,
  note,
  href,
  active,
  tone,
}: {
  label: string
  value: string
  note: string
  href: string
  active: boolean
  tone: string
}) {
  return (
    <Link
      href={href}
      style={{
        border: active ? `1px solid ${tone}` : '1px solid rgba(20,20,20,0.08)',
        borderRadius: 18,
        background: active ? '#fff7f6' : '#fff',
        padding: 20,
        textDecoration: 'none',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7, fontSize: 13 }}>{note}</p>
    </Link>
  )
}

const gridStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} as const

const summaryGridStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
} as const

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

const smallButtonSecondary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 96,
  padding: '8px 12px',
  borderRadius: 999,
  background: '#fff',
  color: '#1d1a17',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
  border: '1px solid rgba(20,20,20,0.12)',
} as const
