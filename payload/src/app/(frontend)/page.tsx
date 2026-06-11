import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { MarketingPage } from '@/components/marketing-page'
import { homeContent, opcContent } from '@/lib/marketing-content'

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') || ''
  return host.startsWith('opc.') ? opcContent.seo : homeContent.seo
}

export default async function HomePage() {
  const host = (await headers()).get('host') || ''
  const content = host.startsWith('opc.') ? opcContent : homeContent

  return <MarketingPage content={content} />
}
