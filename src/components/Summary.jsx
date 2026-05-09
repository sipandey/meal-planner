import { SLOTS, OPTIONS } from '../data'

function MacroBar({ label, value, min, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  const ok = value >= min && value <= max
  const over = value > max
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: ok ? '#166534' : over ? '#dc2626' : '#92400e' }}>
          {value} <span style={{ fontWeight: 400, color: '#aaa' }}>/ {min}–{max}</span>
        </span>
      </div>
      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${pct}%`,
          background: ok ? color : over ? '#ef4444' : '#f59e0b',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, textAlign: 'right' }}>
        target {min}–{max}
      </div>
    </div>
  )
}

export default function Summary({ picks, totals, pickedCount, onClear, onSlotClick }) {
  const allPicked = pickedCount === SLOTS.length
  const allOk = totals.p >= 65 && totals.p <= 82
    && totals.f >= 22 && totals.f <= 32
    && totals.c >= 130 && totals.c <= 170
    && totals.k >= 1300 && totals.k <= 1550

  return (
    <div>
      {/* Day status */}
      <div style={{
        background: allPicked ? (allOk ? '#f0fdf4' : '#fff7ed') : '#fff',
        border: `1px solid ${allPicked ? (allOk ? '#bbf7d0' : '#fed7aa') : '#e5e7eb'}`,
        borderRadius: 12, padding: '14px 16px', marginBottom: 14
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: '#1a1a1a' }}>
          {allPicked
            ? allOk ? '✅ Day on target' : '⚠️ Review macros'
            : `${pickedCount} / ${SLOTS.length} slots picked`}
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          {allPicked
            ? allOk ? 'All macros within range' : 'Some macros out of range — adjust picks'
            : 'Pick one option per meal slot'}
        </div>
      </div>

      {/* Macro bars */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: '14px 16px', marginBottom: 14
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Daily macros
        </div>
        <MacroBar label="Protein (g)"   value={totals.p} min={65}   max={82}   color="#7c3aed" />
        <MacroBar label="Fibre (g)"     value={totals.f} min={22}   max={32}   color="#16a34a" />
        <MacroBar label="Carbs (g)"     value={totals.c} min={130}  max={170}  color="#d97706" />
        <MacroBar label="Calories"      value={totals.k} min={1300} max={1550} color="#6b7280" />
      </div>

      {/* Slot picks list */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: '14px 16px', marginBottom: 14
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Today's picks
        </div>
        {SLOTS.map(s => {
          const idx = picks[s.id]
          const hasPick = idx !== null
          const o = hasPick ? OPTIONS[s.id][idx] : null
          return (
            <div
              key={s.id}
              onClick={() => onSlotClick(s.id)}
              style={{
                display: 'flex', gap: 8, padding: '7px 0',
                borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                alignItems: 'flex-start'
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{s.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 1 }}>{s.time} · {s.label}</div>
                {hasPick ? (
                  <>
                    <div style={{
                      fontSize: 12, fontWeight: 500, color: '#1a1a1a',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {o.name.split('(')[0].trim()}
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>
                      {o.p}g protein · {o.f}g fibre · {o.c}g carbs · {o.k} kcal
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#ccc', fontStyle: 'italic' }}>tap to pick</div>
                )}
              </div>
              {hasPick && (
                <span style={{
                  fontSize: 10, color: '#7c3aed', fontWeight: 500,
                  flexShrink: 0, marginTop: 4
                }}>change</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Constraint reminders */}
      <div style={{
        background: '#faf5ff', border: '1px solid #e9d5ff',
        borderRadius: 12, padding: '12px 16px', marginBottom: 14
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick checks
        </div>
        {[
          { emoji: '🫘', text: 'Soya: max 4×/week, no 2 consecutive days' },
          { emoji: '🧀', text: 'Paneer: max 2×/week, low-fat only' },
          { emoji: '🥛', text: '4:30 pm: chaas ↔ chana chaat alternates' },
          { emoji: '🌡️', text: 'No bajra roti until October' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: 11, color: '#5b21b6', lineHeight: 1.4 }}>
            <span style={{ flexShrink: 0 }}>{r.emoji}</span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>

      {pickedCount > 0 && (
        <button onClick={onClear} style={{
          width: '100%', padding: '8px', borderRadius: 8,
          border: '1px solid #e5e7eb', background: '#fff',
          color: '#666', fontSize: 12, cursor: 'pointer', fontWeight: 500
        }}>
          ✕ Clear all picks
        </button>
      )}
    </div>
  )
}
