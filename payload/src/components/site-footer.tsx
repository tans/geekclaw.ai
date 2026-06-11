import { siteFallback } from '@/lib/site'

export function SiteFooter({
  siteName = siteFallback.siteName,
  description = siteFallback.footerDescription,
  contactEmail = siteFallback.contactEmail,
  siteUrl = siteFallback.siteUrl,
}: {
  siteName?: string
  description?: string
  contactEmail?: string
  siteUrl?: string
}) {
  return (
    <footer
      style={{
        marginTop: 80,
        borderTop: '1px solid rgba(20,20,20,0.08)',
        background: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '32px 20px 56px',
          color: '#6b625e',
          fontSize: 14,
          lineHeight: 1.8,
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: '#1d1a17' }}>{siteName}</p>
        <p style={{ margin: '8px 0 0' }}>{description}</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <a href={siteUrl} style={{ color: 'var(--gc-accent)', textDecoration: 'none' }}>
            {siteUrl}
          </a>
          <a href={`mailto:${contactEmail}`} style={{ color: 'var(--gc-accent)', textDecoration: 'none' }}>
            {contactEmail}
          </a>
        </div>
      </div>
    </footer>
  )
}
