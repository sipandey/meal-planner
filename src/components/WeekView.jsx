import { SLOTS } from '../data'
import {
  getWeekDates, formatDayLabel, formatDateShort, addDays,
  computeTotals,
} from '../hooks/useWeekPlan'
import { todayISO } from '../hooks/useDayPlan'

const GREEN      = '#2d6a4f'
const GREEN_LIGHT = '#edf5ea'
const WARM_BG    = '#f6f3ee'
const WARM_BORDER = '#e8dfd0'
const TEXT       = '#1c2b1c'
const TEXT_MUTED = '#6a7a6a'

function MiniBar({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div style={{ height: 4, background: '#eee8df', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
    </div>
  )
}

function DayCard({ date, picks, targets, isToday, isPast, isActive, onSelect, onCopyFrom, onCopyTo, isCopying, isMobile }) {
  const totals     = computeTotals(picks)
  const pickedCount = Object.values(picks).filter(v => v !== null && v !== undefined).length
  const allPicked  = pickedCount === SLOTS.length
  const allOk      = targets &&
    totals.p >= targets.protein.min && totals.p <= targets.protein.max &&
    totals.k >= targets.kcal.min    && totals.k <= targets.kcal.max
  const today = todayISO()
  const isPastDay = date < today

  const borderColor = isActive  ? GREEN
    : allPicked && allOk        ? '#95c99d'
    : allPicked                 ? '#f0d080'
    : WARM_BORDER

  const bgColor = isActive      ? GREEN_LIGHT
    : isPastDay && pickedCount === 0 ? '#faf8f5'
    : '#fff'

  return (
    <div
      onClick={() => !isPastDay ? onSelect(date) : onSelect(date)}
      style={{
        background: bgColor,
        border: `${isActive ? '2px' : '1px'} solid ${borderColor}`,
        borderRadius: 12, padding: isMobile ? '12px 14px' : '14px 16px',
        cursor: 'pointer', transition: 'all 0.15s',
        opacity: isPastDay ? 0.72 : 1,
        position: 'relative',
      }}
    >
      {/* Day label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{
            fontSize: isMobile ? 13 : 14, fontWeight: 700,
            color: isToday ? GREEN : TEXT,
          }}>
            {formatDayLabel(date)}
            {isToday && <span style={{ fontSize: 10, fontWeight: 600, color: GREEN, marginLeft: 5 }}>TODAY</span>}
          </div>
          <div style={{ fontSize: 11, color: TEXT_MUTED }}>{formatDateShort(date)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: allPicked ? (allOk ? GREEN : '#c9933a') : TEXT_MUTED,
          }}>
            {pickedCount}/{SLOTS.length}
          </div>
          <div style={{ fontSize: 10, color: TEXT_MUTED }}>slots</div>
        </div>
      </div>

      {/* Macro mini-bars */}
      {pickedCount > 0 && targets && (
        <div style={{ marginBottom: 8 }}>
          <MiniBar value={totals.k} max={targets.kcal.max}    color={allOk ? GREEN : '#c9933a'} />
          <MiniBar value={totals.p} max={targets.protein.max} color='#52b788' />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: TEXT_MUTED }}>
            <span>{totals.k} kcal</span>
            <span>{totals.p}g P</span>
          </div>
        </div>
      )}

      {/* Status badge */}
      <div style={{
        fontSize: 10, fontWeight: 600,
        color: allPicked ? (allOk ? GREEN : '#c9933a') : TEXT_MUTED,
      }}>
        {pickedCount === 0
          ? isPastDay ? '— no plan recorded' : 'Not started'
          : allPicked
            ? allOk ? '✅ On target' : '⚠️ Check macros'
            : `${SLOTS.length - pickedCount} slot${SLOTS.length - pickedCount > 1 ? 's' : ''} remaining`}
      </div>

      {/* Copy actions */}
      {!isPastDay && isToday && onCopyFrom && (
        <button
          onClick={e => { e.stopPropagation(); onCopyFrom() }}
          disabled={isCopying}
          style={{
            marginTop: 8, width: '100%', padding: '5px 0',
            borderRadius: 7, border: '1px solid #e8dfd0',
            background: '#faf9f7', fontSize: 10, fontWeight: 600,
            color: TEXT_MUTED, cursor: 'pointer',
          }}
        >
          {isCopying ? '…' : '⎘ Copy yesterday'}
        </button>
      )}
    </div>
  )
}

export default function WeekView({
  monday, weekPicks, targets, onSelectDay, activeDate,
  onPrevWeek, onNextWeek, onCopyDay, isCopying, isMobile,
}) {
  const today   = todayISO()
  const dates   = getWeekDates(monday)
  const prevMon = addDays(monday, -7)
  const nextMon = addDays(monday, 7)

  // Week-level stats
  const weekTotals = dates.reduce((acc, d) => {
    const t = computeTotals(weekPicks[d] ?? {})
    acc.p += t.p; acc.f += t.f; acc.c += t.c; acc.k += t.k
    return acc
  }, { p: 0, f: 0, c: 0, k: 0 })

  const daysWithPlan = dates.filter(d =>
    Object.values(weekPicks[d] ?? {}).some(v => v !== null && v !== undefined)
  ).length

  // Week-level ingredient frequency (for soya/paneer count display)
  const ingredientFreq = {}
  dates.forEach(d => {
    const picks = weekPicks[d] ?? {}
    SLOTS.forEach(s => {
      const idx = picks[s.id]
      if (idx !== null && idx !== undefined) {
        // eslint-disable-next-line no-undef
        const o = (window.__OPTIONS__ ?? {})[s.id]?.[idx]
        if (o?.tags) {
          o.tags.forEach(tag => {
            ingredientFreq[tag] = (ingredientFreq[tag] ?? 0) + 1
          })
        }
      }
    })
  })

  const isFutureWeek = nextMon > addDays(today, 7)

  return (
    <div>
      {/* Week navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '14px 0 10px' : '16px 0 12px',
      }}>
        <button onClick={onPrevWeek} style={{
          background: '#fff', border: `1px solid ${WARM_BORDER}`,
          borderRadius: 8, padding: '6px 14px', fontSize: 13,
          color: TEXT_MUTED, cursor: 'pointer', fontWeight: 500,
        }}>
          ← Prev
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
            {monday === addDays(today, -(new Date(today + 'T00:00:00').getDay() === 0 ? 6 : new Date(today + 'T00:00:00').getDay() - 1))
              ? 'This week'
              : `${formatDateShort(monday)} – ${formatDateShort(addDays(monday, 6))}`}
          </div>
          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
            {daysWithPlan} of 7 days planned · {weekTotals.p}g protein total
          </div>
        </div>

        <button
          onClick={onNextWeek}
          disabled={isFutureWeek}
          style={{
            background: '#fff', border: `1px solid ${WARM_BORDER}`,
            borderRadius: 8, padding: '6px 14px', fontSize: 13,
            color: isFutureWeek ? '#ccc' : TEXT_MUTED,
            cursor: isFutureWeek ? 'default' : 'pointer', fontWeight: 500,
          }}
        >
          Next →
        </button>
      </div>

      {/* Day cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(7, 1fr)',
        gap: isMobile ? 8 : 10,
        marginBottom: 20,
      }}>
        {dates.map(date => {
          const yesterday = addDays(date, -1)
          const hasYesterday = dates.includes(yesterday) &&
            Object.values(weekPicks[yesterday] ?? {}).some(v => v !== null && v !== undefined)

          return (
            <DayCard
              key={date}
              date={date}
              picks={weekPicks[date] ?? {}}
              targets={targets}
              isToday={date === today}
              isPast={date < today}
              isActive={date === activeDate}
              onSelect={onSelectDay}
              onCopyFrom={hasYesterday ? () => onCopyDay({ fromDate: yesterday, toDate: date }) : null}
              onCopyTo={null}
              isCopying={isCopying}
              isMobile={isMobile}
            />
          )
        })}
      </div>

      {/* Week summary bar */}
      <div style={{
        background: '#fff', border: `1px solid ${WARM_BORDER}`,
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Week summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Avg protein/day', value: daysWithPlan > 0 ? Math.round(weekTotals.p / daysWithPlan) : 0, unit: 'g', color: GREEN },
            { label: 'Avg fibre/day',   value: daysWithPlan > 0 ? Math.round(weekTotals.f / daysWithPlan) : 0, unit: 'g', color: '#52b788' },
            { label: 'Avg carbs/day',   value: daysWithPlan > 0 ? Math.round(weekTotals.c / daysWithPlan) : 0, unit: 'g', color: '#c9933a' },
            { label: 'Avg kcal/day',    value: daysWithPlan > 0 ? Math.round(weekTotals.k / daysWithPlan) : 0, unit: '',  color: '#9c8b7a' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>
                {m.value}{m.unit}
              </div>
              <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.4 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tap prompt */}
      <p style={{ textAlign: 'center', fontSize: 12, color: TEXT_MUTED, marginTop: 14 }}>
        Tap any day to open its meal plan
      </p>
    </div>
  )
}
