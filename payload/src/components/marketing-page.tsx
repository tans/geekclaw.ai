import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import type { MarketingPageContent } from '@/lib/marketing-content'

const assistantTasks = ['梳理客户跟进记录', '查询知识库与业务系统', '生成下一步任务', '等待人工确认后执行']

const workflowSteps = ['理解目标', '检索资料', '调用工具', '沉淀记录']

export function MarketingPage({ content }: { content: MarketingPageContent }) {
  return (
    <PageShell>
      <main className="gc-landing">
        <section className="gc-hero">
          <div className="gc-hero-copy">
            <p className="gc-eyebrow">{content.eyebrow}</p>
            <h1>{content.title}</h1>
            <p className="gc-hero-lead">{content.lead}</p>
            <div className="gc-actions">
              <MarketingLink href={content.primaryAction.href} className="gc-button gc-button-primary">
                {content.primaryAction.label}
              </MarketingLink>
              {content.secondaryAction ? (
                <MarketingLink href={content.secondaryAction.href} className="gc-button gc-button-secondary">
                  {content.secondaryAction.label}
                </MarketingLink>
              ) : null}
            </div>
          </div>

          <div className="gc-console" aria-label="GeekClaw Agent 工作台预览">
            <div className="gc-console-top">
              <div>
                <span className="gc-status-dot" />
                Agent Workspace
              </div>
              <span>7 x 24</span>
            </div>
            <div className="gc-chat-card gc-chat-card-user">帮我整理今天的客户跟进，并把需要处理的事项推进到任务列表。</div>
            <div className="gc-chat-card gc-chat-card-agent">
              <p>{content.panel.title}</p>
              <ul>
                {assistantTasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </div>
            <div className="gc-workflow">
              {workflowSteps.map((step, index) => (
                <div key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="gc-hero-metrics">
            {content.panel.metrics.map((metric) => (
              <div key={`${metric.value}-${metric.label}`}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="gc-panel-section">
          <div>
            <p className="gc-eyebrow">{content.panel.eyebrow}</p>
            <h2>{content.panel.title}</h2>
          </div>
          <p>{content.panel.body}</p>
        </section>

        {content.sections.map((section, sectionIndex) => (
          <section key={section.title} id={section.id} className="gc-section">
            <div className="gc-section-heading">
              <p className="gc-eyebrow">{section.eyebrow}</p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
            <div className={sectionIndex === 1 ? 'gc-card-grid gc-card-grid-scenarios' : 'gc-card-grid'}>
              {section.cards.map((card, index) => (
                <article key={card.title} className="gc-feature-card">
                  <div className="gc-card-index">{String(index + 1).padStart(2, '0')}</div>
                  {card.label ? <p className="gc-card-label">{card.label}</p> : null}
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  {card.href ? (
                    <MarketingLink href={card.href} className="gc-card-link">
                      了解更多
                    </MarketingLink>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="gc-cta">
          <div>
            <p className="gc-eyebrow">{content.cta.eyebrow}</p>
            <h2>{content.cta.title}</h2>
            <p>{content.cta.body}</p>
          </div>
          <MarketingLink href={content.cta.href} className="gc-button gc-button-primary">
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
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  if (href.startsWith('mailto:') || href.startsWith('http')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
