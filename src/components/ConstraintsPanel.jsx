import { CONSTRAINTS } from '../data'

export default function ConstraintsPanel({ onClose }) {
  return (
    <div style={{
      background: '#f2f7ee', borderBottom: '1px solid #c5dbbf',
      padding: '12px 16px'
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Weekly rules — always apply
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#2d6a4f', fontSize: 13, fontWeight: 500
          }}>✕ Close</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
          {CONSTRAINTS.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#52b788',
                flexShrink: 0, marginTop: 5
              }} />
              <span style={{ fontSize: 12, color: '#1b4332', lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
