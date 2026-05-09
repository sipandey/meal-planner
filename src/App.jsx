import { useState, useMemo } from 'react'
import { SLOTS, OPTIONS, CONSTRAINTS } from './data'
import SlotPanel from './components/SlotPanel'
import Summary from './components/Summary'
import Header from './components/Header'
import ConstraintsPanel from './components/ConstraintsPanel'

const INITIAL_PICKS = Object.fromEntries(SLOTS.map(s => [s.id, null]))

export default function App() {
  const [picks, setPicks] = useState(INITIAL_PICKS)
  const [activeSlot, setActiveSlot] = useState('wakeup')
  const [filters, setFilters] = useState({ tag: 'all', search: '' })
  const [showConstraints, setShowConstraints] = useState(false)

  const pick = (slotId, idx) =>
    setPicks(p => ({ ...p, [slotId]: p[slotId] === idx ? null : idx }))

  const totals = useMemo(() =>
    SLOTS.reduce((acc, s) => {
      const idx = picks[s.id]
      if (idx !== null) {
        const o = OPTIONS[s.id][idx]
        acc.p += o.p; acc.f += o.f; acc.c += o.c; acc.k += o.k
      }
      return acc
    }, { p: 0, f: 0, c: 0, k: 0 }), [picks])

  const pickedCount = Object.values(picks).filter(v => v !== null).length

  return (
    <div style={{ minHeight: '100vh', background: '#f6f3ee', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header showConstraints={showConstraints} setShowConstraints={setShowConstraints} />
      {showConstraints && <ConstraintsPanel onClose={() => setShowConstraints(false)} />}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 48px' }}>
        {/* Slot tabs */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0',
          position: 'sticky', top: 56, background: '#f6f3ee', zIndex: 9,
          borderBottom: '1px solid #e8dfd0'
        }}>
          {SLOTS.map(s => {
            const hasPick = picks[s.id] !== null
            const isActive = activeSlot === s.id
            return (
              <button key={s.id} onClick={() => setActiveSlot(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                border: isActive ? '1.5px solid #2d6a4f' : hasPick ? '1.5px solid #95c99d' : '1px solid #e8dfd0',
                background: isActive ? '#2d6a4f' : hasPick ? '#edf5ea' : '#fff',
                color: isActive ? '#fff' : hasPick ? '#2d6a4f' : '#5a6b5a',
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
                <span>{s.emoji}</span>
                <span>{s.time}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>{s.label}</span>
                {hasPick && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isActive ? 'rgba(255,255,255,0.8)' : '#52b788'
                  }} />
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 24, alignItems: 'start' }}>
          <SlotPanel
            slot={SLOTS.find(s => s.id === activeSlot)}
            options={OPTIONS[activeSlot]}
            picked={picks[activeSlot]}
            filters={filters}
            setFilters={setFilters}
            onPick={(idx) => pick(activeSlot, idx)}
          />
          <div style={{ position: 'sticky', top: 120 }}>
            <Summary
              picks={picks}
              totals={totals}
              pickedCount={pickedCount}
              onClear={() => setPicks(INITIAL_PICKS)}
              onSlotClick={setActiveSlot}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
