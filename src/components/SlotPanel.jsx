import { useState } from 'react'

const ALL_TAGS = ['all', 'cooling', 'summer', 'fibre', 'quick', 'sattu', 'soya', 'paneer', 'oats', 'chaas', 'chana', 'flexi']

const TAG_COLORS = {
  cooling:  { bg: '#dceef5', text: '#1a5c70' },
  summer:   { bg: '#fdf0cc', text: '#7a5500' },
  fibre:    { bg: '#d8f0d0', text: '#2a5e24' },
  quick:    { bg: '#ede8e0', text: '#5a5040' },
  oats:     { bg: '#fde8c0', text: '#8a5500' },
  sattu:    { bg: '#d0ece2', text: '#1a5840' },
  soya:     { bg: '#e0ecd8', text: '#3a6028' },
  paneer:   { bg: '#fde0d0', text: '#8a3820' },
  chaas:    { bg: '#d0e8f5', text: '#1a5870' },
  chana:    { bg: '#fdf0c0', text: '#7a5c00' },
  flexi:    { bg: '#fde0d8', text: '#8a3028' },
}

const MACRO_COLORS = {
  protein: { bg: '#d8f0d0', text: '#1b4332' },
  fibre:   { bg: '#d0ece2', text: '#1a5840' },
  carbs:   { bg: '#fde8c0', text: '#7a4f00' },
  kcal:    { bg: '#ede8e0', text: '#5a5040' },
}

function Tag({ tag }) {
  const c = TAG_COLORS[tag] || { bg: '#ede8e0', text: '#5a5040' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, borderRadius: 99,
      padding: '1px 7px', background: c.bg, color: c.text,
    }}>{tag}</span>
  )
}

function MacroBadge({ label, value, unit = 'g', color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, borderRadius: 99,
      padding: '2px 8px', background: color.bg, color: color.text,
    }}>
      {value}{unit} {label}
    </span>
  )
}

// Inline violation badge shown on meal cards
function ViolationBadge({ violations }) {
  const [expanded, setExpanded] = useState(false)
  if (!violations?.length) return null

  const hasHard = violations.some(v => v.severity === 'hard')
  const bg   = hasHard ? '#fde8e8' : '#fef8ec'
  const text = hasHard ? '#c0392b' : '#8a6500'
  const icon = hasHard ? '🔴' : '🟡'

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: bg, border: 'none', borderRadius: 8,
          padding: '4px 10px', cursor: 'pointer', width: '100%', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 10 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: text, flex: 1 }}>
          {violations[0].text}
        </span>
        <span style={{ fontSize: 10, color: text }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{
          background: bg, borderRadius: '0 0 8px 8px',
          padding: '6px 10px', marginTop: -2,
        }}>
          <div style={{ fontSize: 11, color: text, lineHeight: 1.5 }}>
            {violations[0].rationale}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SlotPanel({ slot, options, picked, filters, setFilters, onPick, getViolations }) {
  const { tag, search } = filters

  const filtered = options.filter(o => {
    const matchTag = tag === 'all' || (o.tags || []).includes(tag)
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  const availableTags = ['all', ...ALL_TAGS.filter(t => t !== 'all' && options.some(o => (o.tags || []).includes(t)))]

  return (
    <div>
      {/* Slot header */}
      <div style={{
        background: '#fff', border: '1px solid #e8dfd0', borderRadius: 12,
        padding: '14px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <span style={{ fontSize: 20, marginRight: 8 }}>{slot.emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1c2b1c' }}>{slot.label}</span>
            <span style={{ fontSize: 13, color: '#8a9a8a', marginLeft: 8 }}>{slot.time}</span>
          </div>
          <span style={{ fontSize: 12, color: '#8a9a8a' }}>{filtered.length} of {options.length} options</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#5a6b5a' }}>
          <span>Target: <b style={{ color: '#2d6a4f' }}>{slot.target.p[0]}–{slot.target.p[1]}g protein</b></span>
          <span><b style={{ color: '#3a7a30' }}>{slot.target.f[0]}–{slot.target.f[1]}g fibre</b></span>
          <span><b style={{ color: '#8a5500' }}>{slot.target.c[0]}–{slot.target.c[1]}g carbs</b></span>
          <span><b style={{ color: '#5a5040' }}>{slot.target.k[0]}–{slot.target.k[1]} kcal</b></span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search meals…"
          style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid #e8dfd0',
            fontSize: 12, outline: 'none', width: 160, background: '#fff', color: '#1c2b1c',
          }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {availableTags.map(t => (
            <button key={t} onClick={() => setFilters(f => ({ ...f, tag: t }))} style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 500,
              border: tag === t ? '1.5px solid #2d6a4f' : '1px solid #e8dfd0',
              background: tag === t ? '#2d6a4f' : '#fff',
              color: tag === t ? '#fff' : '#5a6b5a', cursor: 'pointer',
            }}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Option cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
        {filtered.map((o, i) => {
          const realIdx = options.indexOf(o)
          const isSelected = picked === realIdx
          const violations = getViolations ? getViolations(realIdx) : []
          const hasHard = violations.some(v => v.severity === 'hard')

          return (
            <div
              key={i}
              onClick={() => onPick(realIdx)}
              style={{
                background: isSelected ? '#edf5ea' : hasHard ? '#fdf8f8' : '#fff',
                border: isSelected
                  ? '2px solid #2d6a4f'
                  : hasHard
                  ? '1.5px solid #e8c0c0'
                  : '1px solid #e8dfd0',
                borderRadius: 12, padding: '12px 14px',
                cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#2d6a4f', color: '#fff',
                  fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}>✓</div>
              )}

              <div style={{
                fontSize: 13, fontWeight: 600, marginBottom: 5, lineHeight: 1.35,
                color: isSelected ? '#1b4332' : '#1c2b1c',
                paddingRight: isSelected ? 24 : 0,
              }}>{o.name}</div>

              {(o.tags || []).length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 7 }}>
                  {o.tags.map(t => <Tag key={t} tag={t} />)}
                </div>
              )}

              <div style={{ fontSize: 11, color: '#6a7a6a', lineHeight: 1.55, marginBottom: 8 }}>
                {o.detail}
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <MacroBadge label="protein" value={o.p} color={MACRO_COLORS.protein} />
                <MacroBadge label="fibre"   value={o.f} color={MACRO_COLORS.fibre} />
                <MacroBadge label="carbs"   value={o.c} color={MACRO_COLORS.carbs} />
                <MacroBadge label="kcal"    value={o.k} unit="" color={MACRO_COLORS.kcal} />
              </div>

              {/* Constraint violation badge — advisory, expandable */}
              <ViolationBadge violations={violations} />
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9aaa99', fontSize: 13 }}>
          No options match your filter.{' '}
          <button onClick={() => setFilters({ tag: 'all', search: '' })}
            style={{ color: '#2d6a4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
