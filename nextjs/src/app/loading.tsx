export default function Loading() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
          animation: 'pt-spin 0.7s linear infinite',
        }} />
        <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>Yükleniyor...</div>
        <style>{`@keyframes pt-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
