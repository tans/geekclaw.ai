import type { Metadata } from 'next'
import { MarketingPage } from '@/components/marketing-page'
import { opcContent } from '@/lib/marketing-content'

export const metadata: Metadata = opcContent.seo

export default function OpcPage() {
  return <MarketingPage content={opcContent} />
}
