import { PageShell } from '@/components/page-shell'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

const sourceLabel: Record<string, string> = {
  env: 'env',
  'site-settings': 'site-settings',
  fallback: 'fallback',
  missing: 'missing',
}

export default async function PaymentDiagnosticsPage() {
  const diagnostics = await getPaymentDiagnostics()

  return (
    <PageShell>
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section
          style={{
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 28,
            padding: 32,
          }}
        >
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
            Payment Diagnostics
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(30px, 5vw, 48px)' }}>支付配置诊断</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9 }}>{diagnostics.summary}</p>

          <div style={{ marginTop: 28, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Card title="支付模式" value={diagnostics.mode === 'real' ? 'real' : 'mock'} hint="由当前服务端最终配置自动判断" />
            <Card title="支付提供方" value={diagnostics.provider} hint="当前仅接入支付宝" />
            <Card title="配置优先级" value={diagnostics.runtimeConfigSource} hint="当前服务端优先读取环境变量，再回退站点设置" />
            <Card title="Notify URL" value={diagnostics.notifyUrl.configured ? '已配置' : '缺失'} hint={diagnostics.notifyUrl.value} />
            <Card title="Return URL" value={diagnostics.returnUrl.configured ? '已配置' : '缺失'} hint={diagnostics.returnUrl.value} />
            <Card
              title="未支付关闭"
              value={`${diagnostics.orderExpiry.expireMinutes} 分钟`}
              hint={diagnostics.orderExpiry.cronSecretConfigured ? '已配置 cron 保护口令' : '未配置 cron 保护口令'}
            />
          </div>

          <div style={{ marginTop: 28, display: 'grid', gap: 14 }}>
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
              source={diagnostics.orderExpiry.cronSecretConfigured ? 'protected' : 'secret-missing'}
            />
          </div>

          <div style={{ marginTop: 28 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>检查结果</h2>
            {diagnostics.warnings.length ? (
              <ul style={{ margin: '16px 0 0', paddingLeft: 20, color: '#4f4742', lineHeight: 1.9 }}>
                {diagnostics.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: '16px 0 0', color: '#4f4742' }}>没有发现阻断性问题，可以开始真实支付宝联调。</p>
            )}
          </div>
        </section>
      </main>
    </PageShell>
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
