import { useState, useMemo } from 'react'
import { SLOTS, OPTIONS } from './data'
import SlotPanel from './components/SlotPanel'
import Summary from './components/Summary'
import Header from './components/Header'
import ConstraintsPanel from './components/ConstraintsPanel'
import WeekView from './components/WeekView'
import { useDayPlan, todayISO } from './hooks/useDayPlan'
import { useProfile } from './hooks/useProfile'
import { useConstraints } from './hooks/useConstraints'
import { useAISuggestion } from './hooks/useAISuggestion'
import { useNaturalMeal } from './hooks/useNaturalMeal'
import { useIsMobile } from './hooks/useIsMobile'
import { useWeekPlan, getMondayOfWeek, addDays } from './hooks/useWeekPlan'
import { calculateMacroTargets, DEFAULT_TARGETS } from './data/macroTargets'

export default function App() {
  const today    = todayISO()
  const isMobile = useIsMobile()

  const [activeDate, setActiveDate]   = useState(today)
  const [activeSlot, setActiveSlot]   = useState('wakeup')
  const [filters, setFilters]         = useState({ tag: 'all', search: '' })
  const [showConstraints, setShowConstraints] = useState(false)
  const [view, setView]               = useState('day')       // 'day' | 'week'
  const [mobileTab, setMobileTab]     = useState('planner')   // mobile only
  const [weekMonday, setWeekMonday]   = useState(() => getMondayOfWeek(today))

  const isPastDate = activeDate < today

  // ── Data hooks ────────────────────────────────────────────────
  const { picks, pick, clearAll, isLoading, isSaving } = useDayPlan(activeDate)
  const { profile } = useProfile()
  const { weekPicks, copyDay, isCopying } = useWeekPlan(weekMonday)

  // ── Dynamic macro targets ──────────────────────────────────────
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

  // ── Constraint engine — now with real week history ─────────────
  const { getViolations, hardViolation, dailyRequirements, activeRulesCount } =
    useConstraints(picks, weekPicks, activeDate)

  // ── AI hooks ───────────────────────────────────────────────────
  const { suggestions, loading: aiLoading, error: aiError, suggestForSlot, suggestAll, clearSuggestion } =
    useAISuggestion({ picks, profile, dailyTargets: targets, getViolations })
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

  // ── Week navigation ────────────────────────────────────────────
  const handleSelectDay = (date) => {
    setActiveDate(date)
    // Jump to the week containing this date
    setWeekMonday(getMondayOfWeek(date))
    setView('day')
    setActiveSlot('wakeup')
    if (isMobile) setMobileTab('planner')
  }

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

  // ── Shared pieces ──────────────────────────────────────────────

  // Day/Week toggle + date label bar
  const viewToggle = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '10px 0 6px' : '14px 0 10px',
      position: 'sticky', top: 56, background: '#f6f3ee', zIndex: 9,
      borderBottom: '1px solid #e8dfd0',
      ...(isMobile ? { marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 } : {}),
    }}>
      {/* Date label */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1c2b1c' }}>
          {activeDate === today ? '📅 Today' : `📅 ${new Date(activeDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`}
          {isPastDate && <span style={{ fontSize: 10, color: '#c0392b', marginLeft: 6, fontWeight: 600 }}>PAST · read-only</span>}
        </div>
        {activeDate !== today && (
          <button
            onClick={() => handleSelectDay(today)}
            style={{ fontSize: 11, color: '#2d6a4f', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
          >
            ← Back to today
          </button>
        )}
      </div>

      {/* Day / Week switcher */}
      <div style={{ display: 'flex', background: '#fff', borderRadius: 8, border: '1px solid #e8dfd0', overflow: 'hidden' }}>
        {[
          { id: 'day',  label: isMobile ? '📅' : '📅 Day'  },
          { id: 'week', label: isMobile ? '📆' : '📆 Week' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: isMobile ? '6px 12px' : '6px 16px', fontSize: 12, fontWeight: 600,
              background: view === v.id ? '#2d6a4f' : '#fff',
              color:      view === v.id ? '#fff'     : '#6a7a6a',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )

  const slotTabBar = view === 'day' && (
    <div style={{
      display: 'flex', gap: 6, padding: isMobile ? '8px 16px' : '10px 0',
      overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none', msOverflowStyle: 'none',
      background: '#f6f3ee',
      borderBottom: '1px solid #e8dfd0',
      ...(isMobile ? { marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 } : {}),
    }}>
      {SLOTS.map(s => {
        const hasPick          = picks[s.id] !== null && picks[s.id] !== undefined
        const isActive         = activeSlot === s.id
        const pickedIdx        = picks[s.id]
        const hasHardViolation = pickedIdx !== null && pickedIdx !== undefined && hardViolation(s.id, pickedIdx)
        const hasSuggestion    = !hasPick && !!suggestions[s.id]

        return (
          <button
            key={s.id}
            onClick={() => { setActiveSlot(s.id); if (isMobile) setMobileTab('planner') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: isMobile ? '5px 10px' : '6px 14px',
              borderRadius: 99, fontSize: isMobile ? 11 : 12, fontWeight: 500,
              border: isActive         ? '1.5px solid #2d6a4f'
                : hasHardViolation     ? '1.5px solid #c0392b'
                : hasSuggestion        ? '1.5px solid #c8a8e0'
                : hasPick              ? '1.5px solid #95c99d'
                : '1px solid #e8dfd0',
              background: isActive     ? '#2d6a4f'
                : hasHardViolation     ? '#fde8e8'
                : hasSuggestion        ? '#f8f0ff'
                : hasPick              ? '#edf5ea'
                : '#fff',
              color: isActive          ? '#fff'
                : hasHardViolation     ? '#c0392b'
                : hasSuggestion        ? '#6b3fa0'
                : hasPick              ? '#2d6a4f'
                : '#5a6b5a',
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
            {(hasPick || hasSuggestion) && (
              <span style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                background: isActive ? 'rgba(255,255,255,0.8)' : hasHardViolation ? '#c0392b' : hasSuggestion ? '#c8a8e0' : '#52b788',
              }} />
            )}
          </button>
        )
      })}
      {isSaving && <span style={{ fontSize: 11, color: '#8a9a8a', alignSelf: 'center', marginLeft: 4, flexShrink: 0 }}>saving…</span>}
    </div>
  )

  const slotPanel = (
    <SlotPanel
      slot={SLOTS.find(s => s.id === activeSlot)}
      options={OPTIONS[activeSlot]}
      picked={picks[activeSlot]}
      filters={filters}
      setFilters={setFilters}
      onPick={isPastDate ? () => {} : (idx) => { pick(activeSlot, idx); clearSuggestion(activeSlot); naturalMeal.clear() }}
      getViolations={(idx) => getViolations(activeSlot, idx)}
      aiSuggestion={!isPastDate ? suggestions[activeSlot] : null}
      aiLoading={aiLoading[activeSlot]}
      aiError={aiError[activeSlot]}
      onAISuggest={!isPastDate ? () => suggestForSlot(activeSlot) : null}
      naturalMeal={!isPastDate ? naturalMeal : null}
      onNaturalRequest={!isPastDate ? (text) => naturalMeal.request(activeSlot, text) : null}
      isMobile={isMobile}
      readOnly={isPastDate}
    />
  )

  const summaryPanel = (
    <Summary
      picks={picks}
      totals={totals}
      targets={targets}
      pickedCount={pickedCount}
      onClear={isPastDate ? null : clearAll}
      onSlotClick={(slotId) => { setActiveSlot(slotId); if (isMobile) setMobileTab('planner') }}
      profile={profile}
      onAIFillDay={isPastDate ? null : suggestAll}
      aiSuggestions={suggestions}
      aiFilling={Object.values(aiLoading).some(Boolean)}
      readOnly={isPastDate}
    />
  )

  const requirementsBar = !isPastDate && dailyRequirements.filter(r => !r.met).length > 0 && (
    <div style={{ background: '#fef8ec', borderBottom: '1px solid #f0d080', padding: '8px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#8a6500', flexShrink: 0 }}>Must-haves:</span>
        {dailyRequirements.filter(r => !r.met).map(({ rule }) => (
          <span key={rule.id} style={{ fontSize: 11, color: '#8a6500', background: '#fdf0c0', borderRadius: 99, padding: '2px 10px' }}>
            {rule.text}
          </span>
        ))}
      </div>
    </div>
  )

  const weekView = (
    <WeekView
      monday={weekMonday}
      weekPicks={weekPicks}
      targets={targets}
      onSelectDay={handleSelectDay}
      activeDate={activeDate}
      onPrevWeek={() => setWeekMonday(d => addDays(d, -7))}
      onNextWeek={() => setWeekMonday(d => addDays(d, 7))}
      onCopyDay={copyDay}
      isCopying={isCopying}
      isMobile={isMobile}
    />
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

        <div style={{ padding: '0 16px' }}>
          {viewToggle}
          {slotTabBar}
        </div>

        {view === 'week' ? (
          <div style={{ padding: '0 16px 80px' }}>{weekView}</div>
        ) : (
          <>
            {/* Mobile Planner/Summary tab bar */}
            <div style={{
              display: 'flex', background: '#fff',
              borderBottom: '1px solid #e8dfd0',
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
          </>
        )}
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
        {viewToggle}
        {slotTabBar}

        {view === 'week' ? (
          <div style={{ marginTop: 8 }}>{weekView}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 16, alignItems: 'start' }}>
            {slotPanel}
            <div style={{ position: 'sticky', top: 160 }}>
              {summaryPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
