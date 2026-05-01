export default function SectionHead({ title, sub, action }: {
  title: string; sub?: string; action?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      marginBottom: 20, gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}
