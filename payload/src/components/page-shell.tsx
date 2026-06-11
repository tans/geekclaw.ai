import type { ReactNode } from 'react'
import { getSiteData } from '@/lib/site'
import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'

export async function PageShell({ children }: { children: ReactNode }) {
  const site = await getSiteData()

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, color-mix(in srgb, var(--gc-accent) 10%, transparent), transparent 24%), linear-gradient(180deg, var(--gc-bg), var(--gc-bg-soft))',
        color: '#1d1a17',
        ['--gc-accent' as string]: site.primaryColor,
      }}
    >
      <SiteHeader siteName={site.siteName} logo={site.logo} navigation={site.navigation} />
      {children}
      <SiteFooter
        siteName={site.siteName}
        description={site.footerDescription}
        contactEmail={site.contactEmail}
        siteUrl={site.siteUrl}
      />
    </div>
  )
}
