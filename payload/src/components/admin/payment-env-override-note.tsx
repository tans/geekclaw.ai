import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export default async function PaymentEnvOverrideNote() {
  const diagnostics = await getPaymentDiagnostics()

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(20,20,20,0.08)',
        background: '#faf8f7',
        padding: '14px 16px',
        color: '#4f4742',
        lineHeight: 1.7,
      }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          环境变量优先于当前后台配置。
          <br />
          如果这里修改后前台诊断没有变化，优先检查 PM2 环境，并重启 `payload-geekclaw`。
        </div>
        {diagnostics.envOverrides.length ? (
          <div
            style={{
              borderRadius: 12,
              background: '#fff3f1',
              padding: '10px 12px',
              color: '#7a271a',
            }}
          >
            当前这些字段正被环境变量覆盖：{diagnostics.envOverrides.map((item) => item.label).join('、')}。
            在这里修改它们只会影响后台回退值，不会立刻改变线上实际生效配置。
          </div>
        ) : (
          <div
            style={{
              borderRadius: 12,
              background: '#f4fbf6',
              padding: '10px 12px',
              color: '#265b35',
            }}
          >
            当前没有检测到环境变量覆盖支付全局字段，这里修改后会直接影响服务端下一次读取到的支付回退配置。
          </div>
        )}
      </div>
    </div>
  )
}
