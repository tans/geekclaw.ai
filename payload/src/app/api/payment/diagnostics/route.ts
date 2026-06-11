import { NextResponse } from 'next/server'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export async function GET() {
  const diagnostics = await getPaymentDiagnostics()
  return NextResponse.json(diagnostics, { status: 200 })
}
