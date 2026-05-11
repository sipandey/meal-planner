import { useState, useMemo } from 'react'
import { SLOTS, OPTIONS } from './data'
import SlotPanel from './components/SlotPanel'
import Summary from './components/Summary'
import Header from './components/Header'
import ConstraintsPanel from './components/ConstraintsPanel'
import { useDayPlan, todayISO } from './hooks/useDayPlan'
import { useProfile } from './hooks/useProfile'
import { useConstraints } from './hooks/useConstraints'
import { useAISuggestion } from './hooks/useAISuggestion'
import { useNaturalMeal } from './hooks/useNaturalMeal'
import { useIsMobile } from './hooks/useIsMobile'
import { calculateMacroTargets, DEFAULT_TARGETS } from './data/macroTargets'

export default function App() {
  const { picks, pick, clearAll, isLoading, isSaving } = useDayPlan()
  const { profile } = useProfile()
  const isMobile = useIsMobile()

  const [activeSlot, setActiveSlot]     = useState('wakeup')
  const [filters, setFilters]           = useState({ tag: 'all', search: '' })
  const [showConstraints, setShowConstraints] = useState(false)
  // Mobile-only: which main panel is visible — 'planner' | 'summary'
  const [mobileTab, setMobileTab]       = useState('planner')

  // ── Dynamic macro targets from health profile ──────────────────
  const targets = useMemo(() => {
    if (!profile) return DEFAULT_TARGETS
    return calculateMacroTargets({
      age:           profile.age ?? undefined,
      weightKg:      profile.weight_kg ?? undefined,
      heightCm:      profile.height_cm ?? undefined,
      gender:        profile.gender ?? undefined,
      activityLevel: profile.activity_level,
      goal:          profile.goal,
      conditions:    profile.conditions ?? [],
    })
  }, [profile])

  // ── Constraint engine ──────────────────────────────────────────
  const today = todayISO()
  const { getViolations, hardViolation, dailyRequirements, activeRulesCount } =
    useConstraints(picks, {}, today)

  // ── AI Meal Suggestion ─────────────────────────────────────────
  const { suggestions, loading: aiLoading, error: aiError, suggestForSlot, suggestAll, clearSuggestion } =
    useAISuggestion({ picks, profile, dailyTargets: targets, getViolations })

  // ── Natural language meal request ──────────────────────────────
  const naturalMeal = useNaturalMeal({ picks, profile, dailyTargets: targets })

  // ── Running macro totals ───────────────────────────────────────
  const totals = useMemo(() =>
    SLOTS.reduce((acc, s) => {
      const idx = picks[s.id]
      if (idx !== null && idx !== undefined) {
        const o = OPTIONS[s.id][idx]
        acc.p += o.p; acc.f += o.f; acc.c += o.c; acc.k += o.k
      }
      return acc
    }, { p: 0, f: 0, c: 0, k: 0 }),
  [picks])

  const pickedCount = Object.values(picks).filter(v => v !== null && v !== undefined).length

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f6f3ee',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#6a7a6a' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
          <div style={{ fontSize: 13 }}>Loading your plan…</div>
        </div>
      </div>
    )
  }

  // ── Shared sub-components ──────────────────────────────────────

  const slotTabBar = (
    <div style={{
      display: 'flex', gap: 6, padding: isMobile ? '10px 16px' : '16px 0',
      overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      // hide scrollbar on all browsers
      scrollbarWidth: 'none', msOverflowStyle: 'none',
      position: 'sticky', top: 56, background: '#f6f3ee', zIndex: 9,
      borderBottom: '1px solid #e8dfd0',
      // negative margin trick so slots reach edge on mobile
      ...(isMobile ? { marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 } : {}),
    }}>
      {SLOTS.map(s => {
        const hasPick           = picks[s.id] !== null && picks[s.id] !== undefined
        const isActive          = activeSlot === s.id
        const pickedIdx         = picks[s.id]
        const hasHardViolation  = pickedIdx !== null && pickedIdx !== undefined && hardViolation(s.id, pickedIdx)
        const hasSuggestion     = !hasPick && !!suggestions[s.id]

        return (
          <button
            key={s.id}
            onClick={() => {
              setActiveSlot(s.id)
              if (isMobile) setMobileTab('planner')
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: isMobile ? '6px 12px' : '7px 16px',
              borderRadius: 99,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 500,
              border: isActive          ? '1.5px solid #2d6a4f'
                : hasHardViolation      ? '1.5px solid #c0392b'
                : hasSuggestion         ? '1.5px solid #c8a8e0'
                : hasPick               ? '1.5px solid #95c99d'
                : '1px solid #e8dfd0',
              background: isActive      ? '#2d6a4f'
                : hasHardViolation      ? '#fde8e8'
                : hasSuggestion         ? '#f8f0ff'
                : hasPick               ? '#edf5ea'
                : '#fff',
              color: isActive           ? '#fff'
                : hasHardViolation      ? '#c0392b'
                : hasSuggestion         ? '#6b3fa0'
                : hasPick               ? '#2d6a4f'
                : '#5a6b5a',
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            <span>{s.emoji}</span>
            {!isMobile && <span>{s.time}</span>}
            <span style={{ fontSize: isMobile ? 11 : 11, opacity: isMobile ? 1 : 0.8 }}>
              {isMobile ? s.label : s.label}
            </span>
            {(hasPick || hasSuggestion) && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: isActive      ? 'rgba(255,255,255,0.8)'
                  : hasHardViolation      ? '#c0392b'
                  : hasSuggestion         ? '#c8a8e0'
                  : '#52b788',
              }} />
            )}
          </button>
        )
      })}
      {isSaving && (
        <span style={{ fontSize: 11, color: '#8a9a8a', alignSelf: 'center', marginLeft: 4, flexShrink: 0 }}>
          saving…
        </span>
      )}
    </div>
  )

  const slotPanel = (
    <SlotPanel
      slot={SLOTS.find(s => s.id === activeSlot)}
      options={OPTIONS[activeSlot]}
      picked={picks[activeSlot]}
      filters={filters}
      setFilters={setFilters}
      onPick={(idx) => { pick(activeSlot, idx); clearSuggestion(activeSlot); naturalMeal.clear() }}
      getViolations={(idx) => getViolations(activeSlot, idx)}
      aiSuggestion={suggestions[activeSlot]}
      aiLoading={aiLoading[activeSlot]}
      aiError={aiError[activeSlot]}
      onAISuggest={() => suggestForSlot(activeSlot)}
      naturalMeal={naturalMeal}
      onNaturalRequest={(text) => naturalMeal.request(activeSlot, text)}
      isMobile={isMobile}
    />
  )

  const summaryPanel = (
    <Summary
      picks={picks}
      totals={totals}
      targets={targets}
      pickedCount={pickedCount}
      onClear={clearAll}
      onSlotClick={(slotId) => { setActiveSlot(slotId); if (isMobile) setMobileTab('planner') }}
      profile={profile}
      onAIFillDay={suggestAll}
      aiSuggestions={suggestions}
      aiFilling={Object.values(aiLoading).some(Boolean)}
    />
  )

  const requirementsBar = dailyRequirements.filter(r => !r.met).length > 0 && (
    <div style={{ background: '#fef8ec', borderBottom: '1px solid #f0d080', padding: '8px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#8a6500', flexShrink: 0 }}>Must-haves:</span>
        {dailyRequirements.filter(r => !r.met).map(({ rule }) => (
          <span key={rule.id} style={{
            fontSize: 11, color: '#8a6500',
            background: '#fdf0c0', borderRadius: 99, padding: '2px 10px',
          }}>
            {rule.text}
          </span>
        ))}
      </div>
    </div>
  )

  // ── Mobile layout ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f3ee', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Header
          showConstraints={showConstraints}
          setShowConstraints={setShowConstraints}
          profile={profile}
          targets={targets}
          activeRulesCount={activeRulesCount}
          isMobile={isMobile}
        />
        {showConstraints && <ConstraintsPanel onClose={() => setShowConstraints(false)} />}
        {requirementsBar}

        {slotTabBar}

        {/* Mobile tab switcher — Planner / Summary */}
        <div style={{
          display: 'flex', background: '#fff',
          borderBottom: '1px solid #e8dfd0',
          position: 'sticky', top: 101, zIndex: 8,   // below slot tab bar
        }}>
          {[
            { id: 'planner', label: '🍽️ Planner' },
            { id: 'summary', label: `📊 Summary${pickedCount > 0 ? ` (${pickedCount}/${SLOTS.length})` : ''}` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id)}
              style={{
                flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                color: mobileTab === t.id ? '#2d6a4f' : '#8a9a8a',
                borderBottom: mobileTab === t.id ? '2.5px solid #2d6a4f' : '2.5px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 16px 80px' }}>
          {mobileTab === 'planner' ? slotPanel : summaryPanel}
        </div>
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f6f3ee', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header
        showConstraints={showConstraints}
        setShowConstraints={setShowConstraints}
        profile={profile}
        targets={targets}
        activeRulesCount={activeRulesCount}
        isMobile={false}
      />
      {showConstraints && <ConstraintsPanel onClose={() => setShowConstraints(false)} />}
      {requirementsBar}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 48px' }}>
        {slotTabBar}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 24, alignItems: 'start' }}>
          {slotPanel}
          <div style={{ position: 'sticky', top: 120 }}>
            {summaryPanel}
          </div>
        </div>
      </div>
    </div>
  )
}
