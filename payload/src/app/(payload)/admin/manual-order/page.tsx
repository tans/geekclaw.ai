import { ManualOrderForm } from '@/components/admin/manual-order-form'
import { listActiveProductsForAdmin } from '@/lib/frontend-data'

export default async function ManualOrderPage() {
  const products = await listActiveProductsForAdmin()

  return (
    <main
      style={{
        padding: 24,
        background: '#f5f5f3',
        minHeight: '100vh',
      }}
    >
      <section
        style={{
          maxWidth: 980,
          margin: '0 auto',
          background: '#fff',
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 24,
          padding: 24,
        }}
      >
        <ManualOrderForm products={products} />
      </section>
    </main>
  )
}
