'use client'

import { useState } from 'react'
import { formatPaymentMode } from '@/lib/order-status'
import type { PaymentDiagnostics } from '@/lib/payment-diagnostics'

const sourceLabel: Record<string, string> = {
  env: '环境变量',
  'payment-settings': 'payment-settings',
  'legacy-site-settings': '旧 site-settings.payment',
  fallback: '回退值',
  missing: '缺失',
}

const runtimeSourceLabel: Record<PaymentDiagnostics['runtimeConfigSource'], string> = {
  'env-first': '环境变量优先，站点设置回退',
  'site-settings-fallback': '站点设置回退',
}

export function PaymentDiagnosticsLivePanel({
  initialDiagnostics,
}: {
  initialDiagnostics: PaymentDiagnostics
}) {
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const blockingChecks = diagnostics.readiness.checks.filter((item) => !item.passed)
  const passedChecks = diagnostics.readiness.checks.filter((item) => item.passed)

  async function handleRefresh() {
    try {
      setIsRefreshing(true)
      setRefreshError('')

      const response = await fetch('/api/payment/diagnostics', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const nextDiagnostics = (await response.json()) as PaymentDiagnostics
      setDiagnostics(nextDiagnostics)
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'unknown error')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 28,
        padding: 32,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
            Payment Diagnostics
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(30px, 5vw, 48px)' }}>支付配置诊断</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9 }}>{diagnostics.summary}</p>
        </div>
        <div style={{ display: 'grid', gap: 10, alignSelf: 'flex-start', justifyItems: 'end' }}>
          <button type="button" onClick={handleRefresh} disabled={isRefreshing} style={buttonPrimary}>
            {isRefreshing ? '复检中...' : '重新检测'}
          </button>
          <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>
            最近检测：{formatDateTime(diagnostics.generatedAt)}
          </p>
          {refreshError ? (
            <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>复检失败：{refreshError}</p>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Card title="支付模式" value={formatPaymentMode(diagnostics.mode)} hint="由当前服务端最终配置自动判断" />
        <Card title="支付提供方" value={diagnostics.provider} hint="当前仅接入支付宝" />
        <Card title="配置优先级" value={runtimeSourceLabel[diagnostics.runtimeConfigSource]} hint="当前服务端优先读取环境变量，再回退站点设置" />
        <Card
          title="异步通知"
          value={diagnostics.notifyReadiness.canFinalizeOrderFromNotify ? '可回写订单' : diagnostics.notifyReadiness.canVerifyNotify ? '仅部分就绪' : '未就绪'}
          hint={diagnostics.notifyReadiness.summary}
        />
        <Card title="阻断项" value={String(blockingChecks.length)} hint={blockingChecks.length ? '需先解决这些问题，真实支付才能工作' : '当前没有阻断真实支付的配置缺口'} />
        <Card title="一般提醒" value={String(diagnostics.warnings.length)} hint={diagnostics.warnings.length ? '这些问题不会全部阻断，但建议尽快收敛' : '当前没有额外提醒'} />
        <Card title="Notify URL" value={diagnostics.notifyUrl.configured ? '已配置' : '缺失'} hint={diagnostics.notifyUrl.value} />
        <Card title="Return URL" value={diagnostics.returnUrl.configured ? '已配置' : '缺失'} hint={diagnostics.returnUrl.value} />
        <Card
          title="支付复核"
          value={`${diagnostics.processingReview.reviewMinutes} 分钟`}
          hint={diagnostics.processingReview.queryEnabled ? '已具备主动查单条件' : '当前只能人工复核'}
        />
      </div>

      <div style={{ marginTop: 28, display: 'grid', gap: 14 }}>
        {diagnostics.envOverrides.length ? (
          <div
            style={{
              borderRadius: 18,
              border: '1px solid rgba(180,35,24,0.12)',
              background: '#fff7f6',
              padding: '16px 18px',
              display: 'grid',
              gap: 10,
            }}
          >
            <strong>环境变量覆盖提醒</strong>
            <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>
              当前这些字段正优先使用服务端环境变量；即使后台 `payment-settings` 同名字段也有值，线上实际生效的仍是环境变量。
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {diagnostics.envOverrides.map((item) => (
                <div key={item.key} style={{ display: 'grid', gap: 4 }}>
                  <strong style={{ fontSize: 14 }}>{item.label}</strong>
                  <span style={{ color: '#4f4742' }}>
                    env: {item.envValuePreview} | payment-settings: {item.paymentSettingsValuePreview}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <DetailRow label="App ID" value={diagnostics.appId.configured ? diagnostics.appId.valuePreview : '未配置'} source={sourceLabel[diagnostics.appId.source]} />
        <DetailRow label="Seller ID" value={diagnostics.sellerId.configured ? diagnostics.sellerId.valuePreview : '未配置'} source={sourceLabel[diagnostics.sellerId.source]} />
        <DetailRow label="应用私钥" value={diagnostics.privateKey.configured ? `${diagnostics.privateKey.lineCount} 行` : '未配置'} source={sourceLabel[diagnostics.privateKey.source]} />
        <DetailRow label="支付宝公钥" value={diagnostics.publicKey.configured ? `${diagnostics.publicKey.lineCount} 行` : '未配置'} source={sourceLabel[diagnostics.publicKey.source]} />
        <DetailRow label="Notify URL" value={diagnostics.notifyUrl.value || '-'} source={sourceLabel[diagnostics.notifyUrl.source]} />
        <DetailRow label="Return URL" value={diagnostics.returnUrl.value || '-'} source={sourceLabel[diagnostics.returnUrl.source]} />
        <DetailRow label="Gateway" value={diagnostics.gateway.value || '-'} source={sourceLabel[diagnostics.gateway.source]} />
        <DetailRow
          label="超时关闭接口"
          value={diagnostics.orderExpiry.closeExpiredApiPath}
          source={diagnostics.orderExpiry.cronSecretConfigured ? '已保护' : '缺少口令'}
        />
        <DetailRow
          label="主动查单接口"
          value={diagnostics.processingReview.queryApiPath}
          source={diagnostics.processingReview.queryEnabled ? '已启用' : '仅 Mock'}
        />
        <DetailRow label="批量同步接口" value={diagnostics.processingReview.batchSyncApiPath} source="已保护" />
      </div>

      <div style={{ marginTop: 28, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <IssuePanel
          title="异步通知就绪检查"
          emptyText="当前异步通知关键前提已经满足。"
          background={diagnostics.notifyReadiness.canFinalizeOrderFromNotify ? '#f4fbf6' : '#fff7f6'}
          border={diagnostics.notifyReadiness.canFinalizeOrderFromNotify ? 'rgba(38,91,53,0.12)' : 'rgba(180,35,24,0.12)'}
          items={diagnostics.notifyReadiness.checks
            .filter((item) => !item.passed)
            .map((item) => ({
              key: item.key,
              title: item.label,
              detail: item.detail,
            }))}
        />
        <IssuePanel
          title="阻断真实支付的问题"
          emptyText="当前没有阻断项，可以继续联调真实支付宝。"
          background="#fff7f6"
          border="rgba(180,35,24,0.12)"
          items={blockingChecks.map((item) => ({
            key: item.key,
            title: item.label,
            detail: item.detail,
          }))}
        />
        <IssuePanel
          title="一般提醒"
          emptyText="当前没有额外提醒。"
          background="#faf8f7"
          border="rgba(20,20,20,0.08)"
          items={diagnostics.warnings.map((warning) => ({
            key: warning,
            title: '配置提醒',
            detail: warning,
          }))}
        />
      </div>

      <div style={{ marginTop: 28 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>真实支付就绪检查</h2>
        <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8 }}>
          这里不仅检查字段是否填写，还会在服务端尝试初始化 Alipay SDK 并本地生成一笔签名跳转参数。
        </p>
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {diagnostics.readiness.checks.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'grid',
                gap: 8,
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 18,
                padding: '14px 18px',
                background: item.passed ? '#f4fbf6' : '#fff7f6',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{item.label}</strong>
                <span style={{ color: item.passed ? '#265b35' : '#b42318', fontWeight: 700 }}>
                  {item.passed ? '通过' : '未通过'}
                </span>
              </div>
              <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {passedChecks.length ? (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>已通过项</h2>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {passedChecks.map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'grid',
                  gap: 6,
                  border: '1px solid rgba(38,91,53,0.12)',
                  borderRadius: 18,
                  padding: '14px 18px',
                  background: '#f4fbf6',
                }}
              >
                <strong style={{ color: '#265b35' }}>{item.label}</strong>
                <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function Card({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 22,
        padding: 20,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{title}</p>
      <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700, color: '#1d1a17' }}>{value}</p>
      <p style={{ margin: '10px 0 0', color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>{hint}</p>
    </article>
  )
}

function DetailRow({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: '180px minmax(0, 1fr) 120px',
        alignItems: 'center',
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 18,
        padding: '14px 18px',
      }}
    >
      <strong>{label}</strong>
      <span style={{ color: '#4f4742', wordBreak: 'break-all' }}>{value}</span>
      <span style={{ color: '#6f6661', textAlign: 'right' }}>{source}</span>
    </div>
  )
}

function IssuePanel({
  title,
  emptyText,
  background,
  border,
  items,
}: {
  title: string
  emptyText: string
  background: string
  border: string
  items: Array<{
    key: string
    title: string
    detail: string
  }>
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        background,
        border: `1px solid ${border}`,
        padding: 20,
        display: 'grid',
        gap: 12,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      {items.length ? (
        items.map((item) => (
          <div
            key={item.key}
            style={{
              borderRadius: 16,
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              padding: '12px 14px',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{item.title}</strong>
            <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{item.detail}</p>
          </div>
        ))
      ) : (
        <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{emptyText}</p>
      )}
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
  })
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 132,
  padding: '12px 18px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
} as const
