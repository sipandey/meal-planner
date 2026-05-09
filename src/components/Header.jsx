export default function Header({ showConstraints, setShowConstraints }) {
  return (
    <div style={{
      background: '#2d6a4f', color: '#fff',
      padding: '0 16px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
      boxShadow: '0 1px 4px rgba(27,67,50,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🌿</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>Meal Planner</div>
          <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.2 }}>Personalised · Vegetarian · 1400–1500 kcal</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '4px 10px', fontSize: 11, display: 'flex', gap: 12,
          border: '1px solid rgba(255,255,255,0.18)'
        }}>
          <span>🎯 65–80g protein</span>
          <span>🌿 25–30g fibre</span>
          <span>🌡️ Gurgaon summer</span>
        </div>
        <button
          onClick={() => setShowConstraints(v => !v)}
          style={{
            background: showConstraints ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.28)',
            color: '#fff', borderRadius: 8, padding: '5px 12px',
            fontSize: 12, cursor: 'pointer', fontWeight: 500
          }}
        >
          {showConstraints ? '✕ Rules' : '📋 Rules'}
        </button>
      </div>
    </div>
  )
}
