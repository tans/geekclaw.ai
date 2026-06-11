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
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(14px)',
        background: 'rgba(255,255,255,0.9)',
        borderBottom: '1px solid rgba(20,20,20,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 20,
            fontWeight: 700,
            color: '#141414',
            textDecoration: 'none',
          }}
        >
          {logo ? (
            <img
              src={logo.url}
              alt={logo.alt}
              style={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                borderRadius: 10,
              }}
            />
          ) : null}
          {siteName}
        </Link>

        <nav
          style={{
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: '#5f5a57',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
