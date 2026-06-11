import type { CSSProperties } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import type { MarketingPageContent } from '@/lib/marketing-content'

export function MarketingPage({ content }: { content: MarketingPageContent }) {
  return (
    <PageShell>
      <main style={mainStyle}>
        <section style={heroStyle}>
          <div style={heroCopyStyle}>
            <p style={eyebrowStyle}>{content.eyebrow}</p>
            <h1 style={heroTitleStyle}>{content.title}</h1>
            <p style={leadStyle}>{content.lead}</p>
            <div style={actionsStyle}>
              <MarketingLink href={content.primaryAction.href} style={buttonPrimary}>
                {content.primaryAction.label}
              </MarketingLink>
              {content.secondaryAction ? (
                <MarketingLink href={content.secondaryAction.href} style={buttonSecondary}>
                  {content.secondaryAction.label}
                </MarketingLink>
              ) : null}
            </div>
          </div>

          <div style={heroPanelStyle}>
            <div>
              <p style={panelLabelStyle}>{content.panel.eyebrow}</p>
              <h2 style={panelTitleStyle}>{content.panel.title}</h2>
              <p style={panelTextStyle}>{content.panel.body}</p>
            </div>
            <div style={metricGridStyle}>
              {content.panel.metrics.map((metric) => (
                <div key={`${metric.value}-${metric.label}`} style={metricStyle}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {content.sections.map((section) => (
          <section key={section.title} style={sectionStyle}>
            <div style={sectionHeadingStyle}>
              <p style={eyebrowStyle}>{section.eyebrow}</p>
              <h2 style={sectionTitleStyle}>{section.title}</h2>
              <p style={sectionDescriptionStyle}>{section.body}</p>
            </div>
            <div style={cardGridStyle}>
              {section.cards.map((card) => (
                <article key={card.title} style={cardStyle}>
                  {card.label ? <p style={smallMetaStyle}>{card.label}</p> : null}
                  <h3 style={cardTitleStyle}>{card.title}</h3>
                  <p style={mutedTextStyle}>{card.body}</p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section style={ctaStyle}>
          <div>
            <p style={eyebrowStyle}>{content.cta.eyebrow}</p>
            <h2 style={sectionTitleStyle}>{content.cta.title}</h2>
            <p style={sectionDescriptionStyle}>{content.cta.body}</p>
          </div>
          <MarketingLink href={content.cta.href} style={buttonPrimary}>
            {content.cta.label}
          </MarketingLink>
        </section>
      </main>
    </PageShell>
  )
}

function MarketingLink({
  href,
  children,
  style,
}: {
  href: string
  children: React.ReactNode
  style: CSSProperties
}) {
  if (href.startsWith('mailto:') || href.startsWith('http')) {
    return (
      <a href={href} style={style}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  )
}

const mainStyle: CSSProperties = {
  maxWidth: 1120,
  margin: '0 auto',
  padding: '64px 20px 48px',
}

const heroStyle: CSSProperties = {
  display: 'grid',
  gap: 24,
  gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, 0.92fr)',
  alignItems: 'stretch',
}

const heroCopyStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(20,20,20,0.08)',
  borderRadius: 32,
  padding: 44,
  boxShadow: '0 24px 80px rgba(40, 20, 10, 0.06)',
}

const heroTitleStyle: CSSProperties = {
  margin: '18px 0 0',
  fontSize: 'clamp(42px, 7vw, 82px)',
  lineHeight: 1.02,
  letterSpacing: '-0.055em',
}

const leadStyle: CSSProperties = {
  margin: '20px 0 0',
  maxWidth: 720,
  color: '#625a55',
  fontSize: 19,
  lineHeight: 1.9,
}

const heroPanelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: 420,
  color: '#f8fbff',
  background:
    'radial-gradient(circle at 20% 0%, rgba(103,232,249,0.24), transparent 34%), linear-gradient(145deg, #07111f, #14213d)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 32,
  padding: 34,
  boxShadow: '0 28px 90px rgba(7, 17, 31, 0.3)',
}

const panelLabelStyle: CSSProperties = {
  margin: 0,
  color: '#67e8f9',
  fontSize: 12,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
}

const panelTitleStyle: CSSProperties = {
  margin: '18px 0 0',
  fontSize: 34,
  lineHeight: 1.15,
  letterSpacing: '-0.035em',
}

const panelTextStyle: CSSProperties = {
  margin: '14px 0 0',
  color: 'rgba(248,251,255,0.76)',
  lineHeight: 1.85,
}

const metricGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  marginTop: 28,
}

const metricStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 14,
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.06)',
}

const sectionStyle: CSSProperties = {
  marginTop: 56,
}

const sectionHeadingStyle: CSSProperties = {
  maxWidth: 780,
  marginBottom: 24,
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: 'var(--gc-accent)',
  fontSize: 12,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
}

const sectionTitleStyle: CSSProperties = {
  margin: '14px 0 0',
  fontSize: 'clamp(30px, 4.8vw, 52px)',
  lineHeight: 1.08,
  letterSpacing: '-0.045em',
}

const sectionDescriptionStyle: CSSProperties = {
  margin: '16px 0 0',
  color: '#625a55',
  fontSize: 17,
  lineHeight: 1.9,
}

const cardGridStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
}

const cardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(20,20,20,0.08)',
  borderRadius: 26,
  padding: 26,
  boxShadow: '0 18px 60px rgba(40, 20, 10, 0.05)',
}

const cardTitleStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 25,
  lineHeight: 1.2,
  letterSpacing: '-0.025em',
}

const mutedTextStyle: CSSProperties = {
  margin: '14px 0 0',
  color: '#6f6661',
  lineHeight: 1.85,
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  flexWrap: 'wrap',
  marginTop: 28,
}

const buttonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 144,
  padding: '13px 20px',
  borderRadius: 999,
  textDecoration: 'none',
  fontWeight: 700,
}

const buttonPrimary: CSSProperties = {
  ...buttonBase,
  color: '#fff',
  background: 'var(--gc-accent)',
}

const buttonSecondary: CSSProperties = {
  ...buttonBase,
  color: '#1d1a17',
  background: '#fff',
  border: '1px solid rgba(20,20,20,0.12)',
}

const smallMetaStyle: CSSProperties = {
  margin: 0,
  color: 'var(--gc-accent)',
  fontSize: 13,
  fontWeight: 700,
}

const ctaStyle: CSSProperties = {
  ...cardStyle,
  marginTop: 56,
  display: 'flex',
  alignItems: 'end',
  justifyContent: 'space-between',
  gap: 24,
  flexWrap: 'wrap',
}
