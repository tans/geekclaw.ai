import Link from 'next/link'
import { ManualMaintenancePanel } from '@/components/admin/manual-maintenance-panel'
import { PaymentConfigMigrationPanel } from '@/components/admin/payment-config-migration-panel'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'
import { getLegacySitePaymentConfig, getPaymentConfigMigrationStatus, getPaymentSettingsConfig, siteFallback } from '@/lib/site'

export default async function PaymentReadinessPage() {
  const [diagnostics, paymentSettingsConfig, legacySitePayment, migrationStatus] = await Promise.all([
    getPaymentDiagnostics(),
    getPaymentSettingsConfig(),
    getLegacySitePaymentConfig(),
    getPaymentConfigMigrationStatus(),
  ])

  const blockingChecks = diagnostics.readiness.checks.filter((item) => !item.passed)
  const passedChecks = diagnostics.readiness.checks.filter((item) => item.passed)
  const envConfig = {
    appId: process.env.ALIPAY_APP_ID || '',
    sellerId: process.env.ALIPAY_SELLER_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
    returnUrl: process.env.ALIPAY_RETURN_URL || '',
    gateway: process.env.ALIPAY_GATEWAY || '',
  }

  const checklist = [
    {
      title: '确认支付宝身份参数',
      done: Boolean(diagnostics.appId.configured && diagnostics.sellerId.configured),
      detail: '至少要同时具备 App ID 和 Seller ID，支付跳转和 notify 归属校验才有意义。',
    },
    {
      title: '确认密钥可用',
      done: Boolean(diagnostics.privateKey.configured && diagnostics.publicKey.configured),
      detail: '应用私钥用于本地签名，支付宝公钥用于 notify 验签，两者缺一不可。',
    },
    {
      title: '确认回调地址为 HTTPS',
      done: diagnostics.notifyUrl.value.startsWith('https://') && diagnostics.returnUrl.value.startsWith('https://'),
      detail: 'notifyUrl 和 returnUrl 应直接指向线上域名，避免支付成功后回跳或异步通知失败。',
    },
    {
      title: '确认服务进程已重启',
      done: diagnostics.generatedAt.length > 0,
      detail: '修改环境变量后必须重启 pm2，否则服务端仍会沿用旧进程中的支付配置。',
    },
    {
      title: '确认真实支付自检通过',
      done: diagnostics.readiness.canUseRealPayment,
      detail: '只有 SDK 初始化和签名跳转都通过，才算具备真实支付宝联调前提。',
    },
  ]

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
          borderRadius: 24,
          background: '#fff',
          padding: 24,
        }}
      >
        <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Payment Readiness
        </p>
        <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>支付联调就绪页</h1>
        <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          把真实支付宝联调前需要确认的配置、来源、阻断项和操作命令集中到一个后台页面，避免运营和部署来回切换。
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link href="/payment-diagnostics" style={buttonPrimary}>
            打开前台诊断页
          </Link>
          <Link href="/admin/payment-observability" style={buttonPrimary}>
            支付回调观测页
          </Link>
          <Link href="/admin/globals/payment-settings" style={buttonPrimary}>
            编辑支付配置
          </Link>
          <Link href="/admin/orders-workbench" style={buttonSecondary}>
            打开订单工作台
          </Link>
          <Link href="/admin/collections/orders" style={buttonSecondary}>
            查看订单列表
          </Link>
        </div>
      </section>

      <section style={gridStyle}>
        <MetricCard label="当前模式" value={diagnostics.mode === 'real' ? '真实支付' : 'Mock 联调'} tone={diagnostics.mode === 'real' ? '#265b35' : '#8a5b12'} />
        <MetricCard label="阻断项" value={String(blockingChecks.length)} tone={blockingChecks.length ? '#b42318' : '#265b35'} />
        <MetricCard label="已通过项" value={String(passedChecks.length)} tone="#265b35" />
        <MetricCard
          label="异步通知就绪"
          value={diagnostics.notifyReadiness.canFinalizeOrderFromNotify ? '可回写订单' : diagnostics.notifyReadiness.canVerifyNotify ? '仅部分就绪' : '未就绪'}
          tone={diagnostics.notifyReadiness.canFinalizeOrderFromNotify ? '#265b35' : diagnostics.notifyReadiness.canVerifyNotify ? '#8a5b12' : '#b42318'}
        />
        <MetricCard label="最近检测" value={formatDate(diagnostics.generatedAt)} tone="#1d1a17" />
      </section>

      <section
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: '1.15fr 0.85fr',
        }}
      >
        <Panel title="联调检查清单" description="先满足这些前提，再去做真实支付宝跳转、回调和查单验证。">
          <div style={{ display: 'grid', gap: 12 }}>
            {checklist.map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: 18,
                  border: '1px solid rgba(20,20,20,0.08)',
                  background: item.done ? '#f4fbf6' : '#fff7f6',
                  padding: '14px 16px',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{item.title}</strong>
                  <span style={{ color: item.done ? '#265b35' : '#b42318', fontWeight: 700 }}>{item.done ? '已满足' : '待处理'}</span>
                </div>
                <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="当前建议动作" description="按目前检测结果，下一步应该优先做什么。">
          <div style={{ display: 'grid', gap: 12 }}>
            {blockingChecks.length ? (
              <>
                <ActionCard
                  title="先补齐缺失的支付参数"
                  detail="当前仍有阻断项，应该先进入站点设置或 pm2 环境，补齐 App ID、Seller ID 和密钥。"
                  href="/admin/globals/payment-settings"
                  label="去支付配置"
                />
                <ActionCard
                  title="改完配置后重新检测"
                  detail="站点设置改完只能影响回退值；如果真实配置来自环境变量，还需要重启主站进程后再复检。"
                  href="/payment-diagnostics"
                  label="去诊断页复检"
                />
              </>
            ) : (
              <>
                <ActionCard
                  title="开始做真实支付跳转验证"
                  detail="现在可以创建测试订单，验证支付跳转、同步回跳与异步 notify 是否能把订单改为已支付。"
                  href="/shop"
                  label="去商城下单"
                />
                <ActionCard
                  title="验证支付中异常单处理链路"
                  detail="联调期间若订单停留在 processing，可到订单工作台验证主动查单、人工复核和批量同步流程。"
                  href="/admin/orders-workbench"
                  label="去订单工作台"
                />
              </>
            )}
          </div>
        </Panel>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Panel title="生效来源对照" description="同一个字段可能同时出现在环境变量和站点设置里，服务端会优先采用环境变量。">
          <ConfigTable
            rows={[
              compareConfig('App ID', envConfig.appId, paymentSettingsConfig.appId, legacySitePayment.appId, diagnostics.appId.source, diagnostics.appId.valuePreview || '未配置'),
              compareConfig('Seller ID', envConfig.sellerId, paymentSettingsConfig.sellerId, legacySitePayment.sellerId, diagnostics.sellerId.source, diagnostics.sellerId.valuePreview || '未配置'),
              compareConfig('应用私钥', envConfig.privateKey, paymentSettingsConfig.privateKey, legacySitePayment.privateKey, diagnostics.privateKey.source, diagnostics.privateKey.configured ? `${diagnostics.privateKey.lineCount} 行` : '未配置'),
              compareConfig('支付宝公钥', envConfig.publicKey, paymentSettingsConfig.publicKey, legacySitePayment.publicKey, diagnostics.publicKey.source, diagnostics.publicKey.configured ? `${diagnostics.publicKey.lineCount} 行` : '未配置'),
              compareConfig('Notify URL', envConfig.notifyUrl, paymentSettingsConfig.notifyUrl, legacySitePayment.notifyUrl, diagnostics.notifyUrl.source, diagnostics.notifyUrl.value || '未配置'),
              compareConfig('Return URL', envConfig.returnUrl, paymentSettingsConfig.returnUrl, legacySitePayment.returnUrl, diagnostics.returnUrl.source, diagnostics.returnUrl.value || '未配置'),
              compareConfig('Gateway', envConfig.gateway, paymentSettingsConfig.gateway, legacySitePayment.gateway, diagnostics.gateway.source, diagnostics.gateway.value || siteFallback.payment.gateway),
            ]}
          />
        </Panel>

        <Panel title="部署与联调命令" description="修改完环境变量或需要主动收敛订单状态时，直接复制这些命令执行。">
          <div style={{ display: 'grid', gap: 12 }}>
            <CodeBlock lines={['cd /data/clawos/payload', 'npm run build', 'pm2 restart payload-geekclaw', 'pm2 restart payload-orders-maintenance']} />
            <CodeBlock lines={['curl -X POST http://127.0.0.1:26223/api/orders/close-expired \\', '  -H "Authorization: Bearer $CRON_SECRET"']} />
            <CodeBlock lines={['curl -X POST http://127.0.0.1:26223/api/orders/sync-processing \\', '  -H "Authorization: Bearer $CRON_SECRET"']} />
            <CodeBlock lines={['cd /data/clawos/payload', 'npm run smoke:payment']} />
          </div>
        </Panel>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Panel title="异步通知就绪状态" description="真实支付宝联调不能只看跳转是否成功，还要确认 notify 是否具备验签和安全回写订单的条件。">
          <div
            style={{
              borderRadius: 16,
              background: diagnostics.notifyReadiness.canFinalizeOrderFromNotify
                ? '#f4fbf6'
                : diagnostics.notifyReadiness.canVerifyNotify
                  ? '#fffaf2'
                  : '#fff7f6',
              padding: '14px 16px',
              color: diagnostics.notifyReadiness.canFinalizeOrderFromNotify ? '#265b35' : '#4f4742',
              lineHeight: 1.7,
            }}
          >
            {diagnostics.notifyReadiness.summary}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {diagnostics.notifyReadiness.checks.map((item) => (
              <div
                key={item.key}
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(20,20,20,0.08)',
                  background: item.passed ? '#f4fbf6' : '#fff7f6',
                  padding: '14px 16px',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{item.label}</strong>
                  <span style={{ color: item.passed ? '#265b35' : '#b42318', fontWeight: 700 }}>{item.passed ? '已满足' : '待处理'}</span>
                </div>
                <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="环境变量覆盖提醒"
          description="这些字段当前优先生效的是 PM2 环境变量；后台 payment-settings 里的同名值只作为回退，不会立刻改变线上实际支付配置。"
        >
          {diagnostics.envOverrides.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {diagnostics.envOverrides.map((item) => (
                <div
                  key={item.key}
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(180,35,24,0.16)',
                    background: '#fff7f6',
                    padding: '14px 16px',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <strong>{item.label}</strong>
                  <Line label="环境变量" value={item.envValuePreview} />
                  <Line label="后台回退" value={item.paymentSettingsValuePreview} />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                borderRadius: 16,
                background: '#f4fbf6',
                color: '#265b35',
                padding: '14px 16px',
                lineHeight: 1.7,
              }}
            >
              当前没有检测到支付字段被环境变量覆盖，`payment-settings` 就是服务端主要使用的支付配置来源。
            </div>
          )}
        </Panel>

        <Panel title="旧支付配置迁移" description="如果早期支付参数还残留在 site-settings，这里会明确提示并提供一次性迁移入口。">
          <PaymentConfigMigrationPanel
            hasLegacyData={migrationStatus.hasLegacyData}
            needsMigration={migrationStatus.needsMigration}
            legacySummary={
              migrationStatus.hasLegacyData
                ? migrationStatus.needsMigration
                  ? '检测到旧 site-settings.payment 仍持有配置，且与当前 payment-settings 不一致。建议尽快迁移，避免后续维护混乱。'
                  : '检测到旧 site-settings.payment 遗留，但当前 payment-settings 已与之对齐。后续可以只维护 payment-settings。'
                : '当前没有检测到旧 site-settings.payment 遗留字段依赖。'
            }
          />
        </Panel>
        <Panel title="后台手动维护" description="不依赖 shell，也可以在后台立即触发一次维护任务，适合运营临时处理积压订单。">
          <ManualMaintenancePanel />
        </Panel>
        <Panel title="维护任务说明" description="这些动作和常驻维护进程使用同一套订单逻辑，不会产生第二套状态机。">
          <div style={{ display: 'grid', gap: 12 }}>
            <InfoCard
              title="超时关单"
              detail={`会把超过 ${diagnostics.orderExpiry.expireMinutes} 分钟仍未支付的订单关闭，并释放库存占用。`}
            />
            <InfoCard
              title="批量同步支付中订单"
              detail={`会扫描超过 ${diagnostics.processingReview.reviewMinutes} 分钟仍停留在 processing 的订单，并按现有查单逻辑尝试自动收敛。`}
            />
            <InfoCard
              title="与定时维护关系"
              detail="常驻维护进程仍会按既定周期执行；这里的按钮只是给后台增加一次人工立即触发入口。"
            />
          </div>
        </Panel>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Panel title="阻断项明细" description="这些项不通过时，真实支付宝无法进入可联调状态。">
          <CheckList items={blockingChecks} emptyText="当前没有阻断项，可以进入真实支付联调。" emptyTone="success" />
        </Panel>
        <Panel title="已通过项" description="这些基础条件已经满足，无需重复排查。">
          <CheckList items={passedChecks} emptyText="当前还没有已通过项。" emptyTone="neutral" />
        </Panel>
      </section>
    </main>
  )
}

function compareConfig(label: string, envValue: string, paymentSettingsValue: string, legacyValue: string, source: string, finalValue: string) {
  return {
    label,
    envValue: formatConfigValue(envValue),
    paymentSettingsValue: formatConfigValue(paymentSettingsValue),
    legacyValue: formatConfigValue(legacyValue),
    source: formatSource(source),
    finalValue,
  }
}

function ConfigTable({
  rows,
}: {
  rows: Array<{
    label: string
    envValue: string
    paymentSettingsValue: string
    legacyValue: string
    source: string
    finalValue: string
  }>
}) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            borderRadius: 16,
            border: '1px solid rgba(20,20,20,0.08)',
            padding: '14px 16px',
            display: 'grid',
            gap: 8,
          }}
        >
          <strong>{row.label}</strong>
          <Line label="环境变量" value={row.envValue} />
          <Line label="支付全局" value={row.paymentSettingsValue} />
          <Line label="旧站点支付" value={row.legacyValue} />
          <Line label="最终生效" value={row.finalValue} />
          <Line label="来源判断" value={row.source} />
        </div>
      ))}
    </div>
  )
}

function CheckList({
  items,
  emptyText,
  emptyTone,
}: {
  items: Array<{
    key: string
    label: string
    detail: string
  }>
  emptyText: string
  emptyTone: 'success' | 'neutral'
}) {
  if (!items.length) {
    return (
      <div
        style={{
          borderRadius: 16,
          background: emptyTone === 'success' ? '#f4fbf6' : '#f7f7f6',
          color: emptyTone === 'success' ? '#265b35' : '#4f4742',
          padding: '14px 16px',
          lineHeight: 1.7,
        }}
      >
        {emptyText}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <div
          key={item.key}
          style={{
            borderRadius: 16,
            border: '1px solid rgba(20,20,20,0.08)',
            background: '#fff7f6',
            padding: '14px 16px',
            display: 'grid',
            gap: 6,
          }}
        >
          <strong>{item.label}</strong>
          <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{item.detail}</p>
        </div>
      ))}
    </div>
  )
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 22,
        background: '#fff',
        padding: 20,
        display: 'grid',
        gap: 16,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>{description}</p>
      </div>
      {children}
    </section>
  )
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
      <p style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 700, color: tone, lineHeight: 1.35 }}>{value}</p>
    </article>
  )
}

function ActionCard({ title, detail, href, label }: { title: string; detail: string; href: string; label: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <strong>{title}</strong>
      <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{detail}</p>
      <div>
        <Link href={href} style={smallButtonPrimary}>
          {label}
        </Link>
      </div>
    </div>
  )
}

function InfoCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '14px 16px',
        display: 'grid',
        gap: 6,
      }}
    >
      <strong>{title}</strong>
      <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{detail}</p>
    </div>
  )
}

function CodeBlock({ lines }: { lines: string[] }) {
  return (
    <pre
      style={{
        margin: 0,
        borderRadius: 16,
        background: '#1d1a17',
        color: '#fff7f5',
        padding: '14px 16px',
        overflowX: 'auto',
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      {lines.join('\n')}
    </pre>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gap: 4, gridTemplateColumns: '88px minmax(0, 1fr)' }}>
      <span style={{ color: '#6f6661', fontSize: 13 }}>{label}</span>
      <span style={{ color: '#1d1a17', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

function formatConfigValue(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '未配置'
  }

  if (trimmed.includes('BEGIN') || trimmed.length > 48) {
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
  }

  return trimmed
}

function formatSource(value: string) {
  return (
    {
      env: '环境变量',
      'payment-settings': 'payment-settings',
      'legacy-site-settings': '旧 site-settings.payment',
      fallback: '回退值',
      missing: '缺失',
    }[value] || value
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

const gridStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} as const

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 148,
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
  minWidth: 112,
  padding: '9px 12px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
} as const
