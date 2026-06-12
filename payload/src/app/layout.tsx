import './globals.css'
import type { Metadata } from 'next'
import { getSiteData, siteFallback } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData().catch(() => siteFallback)

  return {
    title: site.seoTitle,
    description: site.seoDescription,
    metadataBase: new URL(site.siteUrl),
    icons: {
      icon: site.logo?.url || '/geekclaw-logo.png',
      apple: site.logo?.url || '/geekclaw-logo.png',
    },
    openGraph: {
      title: site.seoTitle,
      description: site.seoDescription,
      url: site.siteUrl,
      siteName: site.siteName,
      images: site.logo ? [{ url: site.logo.url, alt: site.logo.alt }] : undefined,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
