import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { MarketingPage } from '@/components/marketing-page'
import { getFrontendHomeContent } from '@/lib/frontend-data'
import { homeContent, opcContent } from '@/lib/marketing-content'

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') || ''
  if (host.startsWith('opc.')) {
    return opcContent.seo
  }

  const content = await getFrontendHomeContent()

  return {
    title: content.seoTitle,
    description: content.seoDescription,
  }
}

export default async function HomePage() {
  const host = (await headers()).get('host') || ''
  if (host.startsWith('opc.')) {
    return <MarketingPage content={opcContent} />
  }

  const content = await getFrontendHomeContent()

  return (
    <MarketingPage
      content={{
        seo: {
          title: content.seoTitle,
          description: content.seoDescription,
        },
        eyebrow: content.eyebrow,
        title: content.title,
        lead: content.lead,
        primaryAction: content.primaryAction,
        secondaryAction: content.secondaryAction,
        panel: content.panel,
        sections: content.sections,
        cta: content.cta,
      }}
    />
  )
}
