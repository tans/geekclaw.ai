import type { Metadata } from 'next'
import { MarketingPage } from '@/components/marketing-page'
import { liloAvatarContent } from '@/lib/marketing-content'

export const metadata: Metadata = liloAvatarContent.seo

export default function LiloAvatarPage() {
  return <MarketingPage content={liloAvatarContent} />
}
