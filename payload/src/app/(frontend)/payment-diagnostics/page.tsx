import { PageShell } from '@/components/page-shell'
import { PaymentDiagnosticsLivePanel } from '@/components/payment-diagnostics-live-panel'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export default async function PaymentDiagnosticsPage() {
  const diagnostics = await getPaymentDiagnostics()

  return (
    <PageShell>
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '64px 20px 40px' }}>
        <PaymentDiagnosticsLivePanel initialDiagnostics={diagnostics} />
      </main>
    </PageShell>
  )
}
