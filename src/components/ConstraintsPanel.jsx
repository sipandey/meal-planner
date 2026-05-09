import { CONSTRAINTS } from '../data'

export default function ConstraintsPanel({ onClose }) {
  return (
    <div style={{
      background: '#f5f3ff', borderBottom: '1px solid #e0d9ff',
      padding: '12px 16px'
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Weekly rules — always apply
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#7c3aed', fontSize: 13, fontWeight: 500
          }}>✕ Close</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
          {CONSTRAINTS.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#7c3aed',
                flexShrink: 0, marginTop: 5
              }} />
              <span style={{ fontSize: 12, color: '#4c1d95', lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
