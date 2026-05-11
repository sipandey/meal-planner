import { SLOTS, OPTIONS } from '../data'
import { DEFAULT_TARGETS } from '../data/macroTargets'

function MacroBar({ label, value, min, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  const ok   = value >= min && value <= max
  const over = value > max
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#6a7a6a' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: ok ? '#2d6a4f' : over ? '#c0392b' : '#c9933a' }}>
          {value} <span style={{ fontWeight: 400, color: '#9aaa99' }}>/ {min}–{max}</span>
        </span>
      </div>
      <div style={{ height: 6, background: '#eee8df', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, width: `${pct}%`,
          background: ok ? color : over ? '#c0392b' : '#c9933a',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#9aaa99', marginTop: 2, textAlign: 'right' }}>
        target {min}–{max}
      </div>
    </div>
  )
}

export default function Summary({ picks, totals, targets, pickedCount, onClear, onSlotClick, profile, onAIFillDay, aiSuggestions, aiFilling, readOnly }) {
  const t = targets ?? DEFAULT_TARGETS

  const allPicked = pickedCount === SLOTS.length
  const allOk =
    totals.p >= t.protein.min && totals.p <= t.protein.max &&
    totals.f >= t.fibre.min   && totals.f <= t.fibre.max   &&
    totals.c >= t.carbs.min   && totals.c <= t.carbs.max   &&
    totals.k >= t.kcal.min    && totals.k <= t.kcal.max

  const greeting = profile?.name ? `${profile.name}'s plan` : "Today's plan"

  const emptySlotCount = SLOTS.length - pickedCount

  return (
    <div>
      {/* AI Fill Day button */}
      {onAIFillDay && emptySlotCount > 0 && !readOnly && (
        <button
          onClick={onAIFillDay}
          disabled={aiFilling}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 10,
            border: '2px solid #c8a8e0',
            background: aiFilling ? '#f0e8f8' : 'linear-gradient(135deg, #f8f0ff 0%, #ede0ff 100%)',
            color: '#6b3fa0', fontSize: 13, fontWeight: 700,
            cursor: aiFilling ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 12,
            boxShadow: aiFilling ? 'none' : '0 2px 8px rgba(107,63,160,0.12)',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 16 }}>{aiFilling ? '⏳' : '✨'}</span>
          <span>{aiFilling ? `Filling ${emptySlotCount} slot${emptySlotCount > 1 ? 's' : ''}…` : `AI-fill ${emptySlotCount} empty slot${emptySlotCount > 1 ? 's' : ''}`}</span>
        </button>
      )}

      {/* Day status */}
      <div style={{
        background: allPicked ? (allOk ? '#edf5ea' : '#fef8ec') : '#fff',
        border: `1px solid ${allPicked ? (allOk ? '#95c99d' : '#f0d080') : '#e8dfd0'}`,
        borderRadius: 12, padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: '#1c2b1c' }}>
          {allPicked
            ? allOk ? '✅ Day on target' : '⚠️ Review macros'
            : `${pickedCount} / ${SLOTS.length} slots picked`}
        </div>
        <div style={{ fontSize: 11, color: '#6a7a6a' }}>
          {allPicked
            ? allOk
              ? 'All macros within your personal range'
              : 'Some macros out of range — adjust picks'
            : greeting + ' — pick one option per slot'}
        </div>
      </div>

      {/* Macro bars — dynamic targets */}
      <div style={{
        background: '#fff', border: '1px solid #e8dfd0',
        borderRadius: 12, padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8a9a8a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Daily macros
        </div>
        <MacroBar label="Protein (g)" value={totals.p} min={t.protein.min} max={t.protein.max} color="#2d6a4f" />
        <MacroBar label="Fibre (g)"   value={totals.f} min={t.fibre.min}   max={t.fibre.max}   color="#52b788" />
        <MacroBar label="Carbs (g)"   value={totals.c} min={t.carbs.min}   max={t.carbs.max}   color="#c9933a" />
        <MacroBar label="Calories"    value={totals.k} min={t.kcal.min}    max={t.kcal.max}    color="#9c8b7a" />
      </div>

      {/* Slot picks list */}
      <div style={{
        background: '#fff', border: '1px solid #e8dfd0',
        borderRadius: 12, padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8a9a8a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          {greeting}
        </div>
        {SLOTS.map(s => {
          const idx    = picks[s.id]
          const hasPick = idx !== null && idx !== undefined
          const o      = hasPick ? OPTIONS[s.id][idx] : null
          const suggestion = aiSuggestions?.[s.id]
          const hasSuggestion = !hasPick && suggestion
          const suggestedOption = hasSuggestion ? OPTIONS[s.id][suggestion.index] : null

          return (
            <div
              key={s.id}
              onClick={() => onSlotClick(s.id)}
              style={{
                display: 'flex', gap: 8, padding: '7px 0',
                borderBottom: '1px solid #f0e9df', cursor: 'pointer',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{s.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#9aaa99', marginBottom: 1 }}>{s.time} · {s.label}</div>
                {hasPick ? (
                  <>
                    <div style={{
                      fontSize: 12, fontWeight: 500, color: '#1c2b1c',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {o.name.split('(')[0].trim()}
                    </div>
                    <div style={{ fontSize: 10, color: '#8a9a8a', marginTop: 1 }}>
                      {o.p}g protein · {o.f}g fibre · {o.c}g carbs · {o.k} kcal
                    </div>
                  </>
                ) : hasSuggestion ? (
                  <>
                    <div style={{
                      fontSize: 12, fontWeight: 500, color: '#6b3fa0',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      ✨ {suggestedOption?.name?.split('(')[0]?.trim()}
                    </div>
                    <div style={{ fontSize: 10, color: '#9a7aaa', marginTop: 1 }}>
                      AI suggestion — tap to review
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#c5cfc5', fontStyle: 'italic' }}>tap to pick</div>
                )}
              </div>
              {hasPick && (
                <span style={{ fontSize: 10, color: '#2d6a4f', fontWeight: 500, flexShrink: 0, marginTop: 4 }}>
                  change
                </span>
              )}
              {hasSuggestion && (
                <span style={{ fontSize: 10, color: '#6b3fa0', fontWeight: 600, flexShrink: 0, marginTop: 4 }}>
                  view →
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick constraint checks */}
      <div style={{
        background: '#f2f7ee', border: '1px solid #c5dbbf',
        borderRadius: 12, padding: '12px 16px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#2d6a4f', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick checks
        </div>
        {[
          { emoji: '🫘', text: 'Soya: max 4×/week, no 2 consecutive days' },
          { emoji: '🧀', text: 'Paneer: max 2×/week, low-fat only' },
          { emoji: '🥛', text: '4:30 pm: chaas ↔ chana chaat alternates' },
          { emoji: '🌡️', text: 'No bajra roti until October' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: 11, color: '#3a6a40', lineHeight: 1.4 }}>
            <span style={{ flexShrink: 0 }}>{r.emoji}</span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>

      {pickedCount > 0 && onClear && !readOnly && (
        <button onClick={onClear} style={{
          width: '100%', padding: '8px', borderRadius: 8,
          border: '1px solid #e8dfd0', background: '#fff',
          color: '#6a7a6a', fontSize: 12, cursor: 'pointer', fontWeight: 500,
        }}>
          ✕ Clear all picks
        </button>
      )}
    </div>
  )
}
