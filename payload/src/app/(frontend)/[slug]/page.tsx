import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { getPageBySlug } from '@/lib/frontend-data'
import { getSiteData, siteFallback } from '@/lib/site'

const reservedSlugs = new Set(['bailongma', 'blog', 'shop', 'payment-diagnostics'])

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const [{ slug }, site] = await Promise.all([params, getSiteData().catch(() => siteFallback)])

  if (reservedSlugs.has(slug)) {
    return {
      title: site.seoTitle,
      description: site.seoDescription,
    }
  }

  const page = await getPageBySlug(slug)

  if (!page) {
    return {
      title: site.seoTitle,
      description: site.seoDescription,
    }
  }

  return {
    title: `${page.seoTitle || page.title} | ${site.siteName}`,
    description: page.seoDescription || page.heroDescription || site.seoDescription,
    openGraph: {
      title: page.seoTitle || page.title,
      description: page.seoDescription || page.heroDescription || site.seoDescription,
      url: `${site.siteUrl.replace(/\/$/, '')}/${page.slug}`,
      siteName: site.siteName,
    },
    twitter: {
      card: 'summary',
      title: page.seoTitle || page.title,
      description: page.seoDescription || page.heroDescription || site.seoDescription,
    },
  }
}

export default async function GenericPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (reservedSlugs.has(slug)) {
    notFound()
  }

  const page = await getPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <PageShell>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section
          style={{
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 32,
            padding: '42px 36px',
            boxShadow: '0 24px 80px rgba(40, 20, 10, 0.06)',
          }}
        >
          <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            Page
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 1.04 }}>
            {page.heroTitle || page.title}
          </h1>
          {page.heroDescription ? (
            <p style={{ margin: '18px 0 0', maxWidth: 760, color: '#6f6661', lineHeight: 1.9, fontSize: 18 }}>
              {page.heroDescription}
            </p>
          ) : null}
        </section>

        {page.sections?.length
          ? page.sections.map((section, index) => {
              if (section.type === 'hero') {
                return (
                  <section
                    key={`hero-${index}`}
                    style={{
                      marginTop: 26,
                      background: '#fff',
                      border: '1px solid rgba(20,20,20,0.08)',
                      borderRadius: 32,
                      padding: '42px 36px',
                    }}
                  >
                    {section.eyebrow ? (
                      <p
                        style={{
                          margin: 0,
                          color: 'var(--gc-accent)',
                          fontSize: 12,
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {section.eyebrow}
                      </p>
                    ) : null}
                    <h2 style={{ margin: '18px 0 0', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.08 }}>
                      {section.title}
                    </h2>
                    {section.description ? (
                      <p style={{ margin: '16px 0 0', maxWidth: 760, color: '#6f6661', lineHeight: 1.9, fontSize: 18 }}>
                        {section.description}
                      </p>
                    ) : null}
                    {(section.primaryLabel && section.primaryHref) || (section.secondaryLabel && section.secondaryHref) ? (
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
                        {section.primaryLabel && section.primaryHref ? (
                          <Link href={section.primaryHref} style={buttonPrimary}>
                            {section.primaryLabel}
                          </Link>
                        ) : null}
                        {section.secondaryLabel && section.secondaryHref ? (
                          <Link href={section.secondaryHref} style={buttonSecondary}>
                            {section.secondaryLabel}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                )
              }

              if (section.type === 'featureGrid') {
                return (
                  <section key={`feature-${index}`} style={{ marginTop: 26 }}>
                    {section.heading ? <h2 style={{ margin: 0, fontSize: 28 }}>{section.heading}</h2> : null}
                    {section.description ? (
                      <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8, maxWidth: 720 }}>
                        {section.description}
                      </p>
                    ) : null}
                    <div
                      style={{
                        marginTop: 20,
                        display: 'grid',
                        gap: 20,
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      }}
                    >
                      {section.items.map((item) => (
                        <article
                          key={item.title}
                          style={{
                            background: '#fff',
                            border: '1px solid rgba(20,20,20,0.08)',
                            borderRadius: 24,
                            padding: 24,
                          }}
                        >
                          <h3 style={{ margin: 0, fontSize: 22 }}>{item.title}</h3>
                          {item.body ? <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{item.body}</p> : null}
                        </article>
                      ))}
                    </div>
                  </section>
                )
              }

              if (section.type === 'stats') {
                return (
                  <section key={`stats-${index}`} style={{ marginTop: 26 }}>
                    {section.heading ? <h2 style={{ margin: 0, fontSize: 28 }}>{section.heading}</h2> : null}
                    <div
                      style={{
                        marginTop: 20,
                        display: 'grid',
                        gap: 20,
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      }}
                    >
                      {section.items.map((item) => (
                        <article
                          key={`${item.value}-${item.label}`}
                          style={{
                            background: '#fff',
                            border: '1px solid rgba(20,20,20,0.08)',
                            borderRadius: 24,
                            padding: 24,
                          }}
                        >
                          <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 32, fontWeight: 700 }}>{item.value}</p>
                          <p style={{ margin: '10px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{item.label}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )
              }

              return (
                <section
                  key={`cta-${index}`}
                  style={{
                    marginTop: 26,
                    background: '#fff7f5',
                    border: '1px solid color-mix(in srgb, var(--gc-accent) 16%, white)',
                    borderRadius: 28,
                    padding: 28,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 28 }}>{section.heading}</h2>
                  {section.description ? <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{section.description}</p> : null}
                  {section.buttonLabel && section.buttonHref ? (
                    <div style={{ marginTop: 20 }}>
                      <Link href={section.buttonHref} style={buttonPrimary}>
                        {section.buttonLabel}
                      </Link>
                    </div>
                  ) : null}
                </section>
              )
            })
          : null}

        {page.blocks?.length ? (
          <section
            style={{
              marginTop: 26,
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {page.blocks.map((block) => (
              <article
                key={block.heading}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(20,20,20,0.08)',
                  borderRadius: 24,
                  padding: 24,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 22 }}>{block.heading}</h2>
                <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{block.body}</p>
              </article>
            ))}
          </section>
        ) : null}
      </main>
    </PageShell>
  )
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 140,
  padding: '12px 18px',
  borderRadius: 999,
  background: 'var(--gc-accent)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
} as const

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
