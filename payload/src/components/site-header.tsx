import Link from 'next/link'
import { siteFallback, type NavItem } from '@/lib/site'

export function SiteHeader({
  siteName = siteFallback.siteName,
  logo = siteFallback.logo,
  navigation = siteFallback.navigation,
}: {
  siteName?: string
  logo?: { url: string; alt: string } | null
  navigation?: NavItem[]
}) {
  return (
    <header className="gc-site-header">
      <div className="gc-site-header-inner">
        <Link href="/" className="gc-site-brand">
          {logo ? (
            <img
              src={logo.url}
              alt={logo.alt}
              className="gc-site-logo"
            />
          ) : (
            <span className="gc-site-logo-mark">G</span>
          )}
          {siteName}
        </Link>

        <nav className="gc-site-nav">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
