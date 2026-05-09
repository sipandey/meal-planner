import { TAG_META } from '../data'

const ALL_TAGS = ['all', 'cooling', 'summer', 'fibre', 'quick', 'sattu', 'soya', 'paneer', 'oats', 'chaas', 'chana', 'flexi']

const TAG_COLORS = {
  cooling:  { bg: '#e0f2fe', text: '#0369a1' },
  summer:   { bg: '#e0f7ff', text: '#0e7490' },
  fibre:    { bg: '#dcfce7', text: '#166534' },
  quick:    { bg: '#f3f4f6', text: '#4b5563' },
  oats:     { bg: '#fef3c7', text: '#92400e' },
  sattu:    { bg: '#ccfbf1', text: '#115e59' },
  soya:     { bg: '#ede9fe', text: '#5b21b6' },
  paneer:   { bg: '#fce7f3', text: '#9d174d' },
  chaas:    { bg: '#e0f2fe', text: '#075985' },
  chana:    { bg: '#fef9c3', text: '#713f12' },
  flexi:    { bg: '#fee2e2', text: '#9f1239' },
}

function Tag({ tag }) {
  const c = TAG_COLORS[tag] || { bg: '#f3f4f6', text: '#4b5563' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, borderRadius: 99,
      padding: '1px 7px', background: c.bg, color: c.text
    }}>{tag}</span>
  )
}

function MacroBadge({ label, value, unit = 'g', color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, borderRadius: 99,
      padding: '2px 8px', background: color.bg, color: color.text
    }}>
      {value}{unit} {label}
    </span>
  )
}

const MACRO_COLORS = {
  protein: { bg: '#ede9fe', text: '#5b21b6' },
  fibre:   { bg: '#dcfce7', text: '#166534' },
  carbs:   { bg: '#fef3c7', text: '#92400e' },
  kcal:    { bg: '#f3f4f6', text: '#4b5563' },
}

export default function SlotPanel({ slot, options, picked, filters, setFilters, onPick }) {
  const { tag, search } = filters

  const filtered = options.filter(o => {
    const matchTag = tag === 'all' || (o.tags || []).includes(tag)
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  const availableTags = ['all', ...ALL_TAGS.filter(t => t !== 'all' && options.some(o => (o.tags||[]).includes(t)))]

  return (
    <div>
      {/* Slot header */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '14px 18px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <span style={{ fontSize: 20, marginRight: 8 }}>{slot.emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{slot.label}</span>
            <span style={{ fontSize: 13, color: '#888', marginLeft: 8 }}>{slot.time}</span>
          </div>
          <span style={{ fontSize: 12, color: '#888' }}>{filtered.length} of {options.length} options</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#666' }}>
          <span>Target: <b style={{ color: '#5b21b6' }}>{slot.target.p[0]}–{slot.target.p[1]}g protein</b></span>
          <span><b style={{ color: '#166534' }}>{slot.target.f[0]}–{slot.target.f[1]}g fibre</b></span>
          <span><b style={{ color: '#92400e' }}>{slot.target.c[0]}–{slot.target.c[1]}g carbs</b></span>
          <span><b style={{ color: '#555' }}>{slot.target.k[0]}–{slot.target.k[1]} kcal</b></span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search..."
          style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid #e0e0e0',
            fontSize: 12, outline: 'none', width: 160, background: '#fff'
          }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {availableTags.map(t => (
            <button key={t} onClick={() => setFilters(f => ({ ...f, tag: t }))} style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 500,
              border: tag === t ? '1.5px solid #6d28d9' : '1px solid #e0e0e0',
              background: tag === t ? '#6d28d9' : '#fff',
              color: tag === t ? '#fff' : '#555',
              cursor: 'pointer'
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
          return (
            <div
              key={i}
              onClick={() => onPick(realIdx)}
              style={{
                background: isSelected ? '#f5f3ff' : '#fff',
                border: isSelected ? '2px solid #6d28d9' : '1px solid #e5e7eb',
                borderRadius: 12, padding: '12px 14px',
                cursor: 'pointer', transition: 'all 0.15s',
                position: 'relative'
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#6d28d9', color: '#fff',
                  fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700
                }}>✓</div>
              )}
              <div style={{
                fontSize: 13, fontWeight: 600, marginBottom: 5, lineHeight: 1.35,
                color: isSelected ? '#3730a3' : '#1a1a1a',
                paddingRight: isSelected ? 24 : 0
              }}>{o.name}</div>

              {(o.tags||[]).length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 7 }}>
                  {o.tags.map(t => <Tag key={t} tag={t} />)}
                </div>
              )}

              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.55, marginBottom: 8 }}>
                {o.detail}
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <MacroBadge label="protein" value={o.p} color={MACRO_COLORS.protein} />
                <MacroBadge label="fibre"   value={o.f} color={MACRO_COLORS.fibre} />
                <MacroBadge label="carbs"   value={o.c} color={MACRO_COLORS.carbs} />
                <MacroBadge label="kcal"    value={o.k} unit="" color={MACRO_COLORS.kcal} />
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa', fontSize: 13 }}>
          No options match your filter. <button onClick={() => setFilters({ tag: 'all', search: '' })}
            style={{ color: '#6d28d9', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
