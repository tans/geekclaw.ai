import { NextResponse } from 'next/server'
import { exportOrdersCsv, exportProductSalesCsv, type OrderExportFilters } from '@/lib/orders'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = normalizeMode(searchParams.get('mode'))

    const filters: OrderExportFilters = {
      paymentStatus: normalizePaymentStatus(searchParams.get('paymentStatus')),
      fulfillmentStatus: normalizeFulfillmentStatus(searchParams.get('fulfillmentStatus')),
      source: normalizeSource(searchParams.get('source')),
      createdFrom: normalizeDateStart(searchParams.get('createdFrom')),
      createdTo: normalizeDateEnd(searchParams.get('createdTo')),
      limit: normalizeLimit(searchParams.get('limit')),
    }

    const csv = mode === 'product-sales' ? await exportProductSalesCsv(filters) : await exportOrdersCsv(filters)
    const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
    const filenamePrefix = mode === 'product-sales' ? 'product-sales' : 'orders'

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenamePrefix}-${timestamp}.csv"`,
      },
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ORDER_EXPORT_FAILED'
    return NextResponse.json({ error: code }, { status: 500 })
  }
}

function normalizeMode(value: string | null) {
  return value === 'product-sales' ? 'product-sales' : 'orders'
}

function normalizePaymentStatus(value: string | null) {
  if (value === 'unpaid' || value === 'processing' || value === 'paid' || value === 'failed' || value === 'refunded') {
    return value
  }

  return undefined
}

function normalizeFulfillmentStatus(value: string | null) {
  if (value === 'pending' || value === 'processing' || value === 'shipped' || value === 'completed') {
    return value
  }

  return undefined
}

function normalizeSource(value: string | null) {
  if (value === 'shop' || value === 'landing' || value === 'manual') {
    return value
  }

  return undefined
}

function normalizeLimit(value: string | null) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function normalizeDateStart(value: string | null) {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function normalizeDateEnd(value: string | null) {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T23:59:59.999Z`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}
