import { UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router'

export default function Header({ showConstraints, setShowConstraints, profile, targets, activeRulesCount }) {
  const navigate = useNavigate()
  const city = profile?.city ?? 'India'
  const proteinLabel = targets
    ? `${targets.protein.min}–${targets.protein.max}g protein`
    : '65–80g protein'
  const fibreLabel = targets
    ? `${targets.fibre.min}–${targets.fibre.max}g fibre`
    : '25–30g fibre'

  return (
    <div style={{
      background: '#2d6a4f', color: '#fff',
      padding: '0 16px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
      boxShadow: '0 1px 4px rgba(27,67,50,0.3)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🌿</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Aahar
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.2 }}>
            {profile?.diet ?? 'personalised'} · {city}
          </div>
        </div>
      </div>

      {/* Targets + controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Personalised targets pill */}
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '4px 10px', fontSize: 11, display: 'flex', gap: 12,
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <span>🎯 {proteinLabel}</span>
          <span>🌿 {fibreLabel}</span>
        </div>

        {/* Active rules badge */}
        {activeRulesCount > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 8,
            padding: '4px 10px', fontSize: 11,
            border: '1px solid rgba(255,255,255,0.22)',
          }}>
            ⚕️ {activeRulesCount} active rules
          </div>
        )}

        {/* Rules toggle */}
        <button
          onClick={() => setShowConstraints(v => !v)}
          style={{
            background: showConstraints ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.28)',
            color: '#fff', borderRadius: 8, padding: '5px 12px',
            fontSize: 12, cursor: 'pointer', fontWeight: 500,
          }}
        >
          {showConstraints ? '✕ Rules' : '📋 Rules'}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.28)',
            color: '#fff', borderRadius: 8, padding: '5px 10px',
            fontSize: 15, cursor: 'pointer', lineHeight: 1,
          }}
        >
          ⚙️
        </button>

        {/* Clerk user button */}
        <UserButton
          appearance={{ variables: { colorPrimary: '#2d6a4f' } }}
        />
      </div>
    </div>
  )
}
