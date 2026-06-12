type IssueTone = 'warning' | 'error' | 'success'

export function PublishReadinessCard({
  title,
  description,
  statusLabel,
  statusTone,
  issues,
}: {
  title: string
  description: string
  statusLabel: string
  statusTone: IssueTone
  issues: Array<{
    label: string
    tone: IssueTone
  }>
}) {
  return (
    <section
      style={{
        marginBottom: 16,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fff',
        padding: 20,
        display: 'grid',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Publish Readiness
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>{title}</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>{description}</p>
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            borderRadius: 999,
            padding: '8px 12px',
            background: toneToBackground(statusTone),
            color: toneToColor(statusTone),
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {issues.map((issue) => (
          <div
            key={issue.label}
            style={{
              borderRadius: 14,
              padding: '12px 14px',
              background: toneToBackground(issue.tone),
              color: toneToColor(issue.tone),
              lineHeight: 1.7,
              fontSize: 14,
              fontWeight: issue.tone === 'success' ? 500 : 600,
            }}
          >
            {issue.label}
          </div>
        ))}
      </div>
    </section>
  )
}

function toneToBackground(tone: IssueTone) {
  switch (tone) {
    case 'error':
      return '#fff3f1'
    case 'warning':
      return '#fff8e8'
    case 'success':
    default:
      return '#eef9f0'
  }
}

function toneToColor(tone: IssueTone) {
  switch (tone) {
    case 'error':
      return '#8a1c12'
    case 'warning':
      return '#8a5b12'
    case 'success':
    default:
      return '#265b35'
  }
}
