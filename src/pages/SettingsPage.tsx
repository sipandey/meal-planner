import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useProfile } from '../hooks/useProfile'
import { CONDITION_LIST } from '../data/conditions'
import type { ConditionId } from '../data/conditions'
import type { ProfileUpdate } from '../hooks/useProfile'

// ── Design tokens ──────────────────────────────────────────────────
const GREEN        = '#2d6a4f'
const GREEN_LIGHT  = '#edf5ea'
const GREEN_BORDER = '#95c99d'
const WARM_BG      = '#f6f3ee'
const WARM_BORDER  = '#e8dfd0'
const TEXT         = '#1c2b1c'
const TEXT_MUTED   = '#6a7a6a'

const CITIES = [
  'Gurgaon / Gurugram', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad',
  'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Noida', 'Faridabad', 'Indore', 'Other',
]

const REGIONS = [
  { id: 'north_indian',    label: 'North Indian',  desc: 'Dal-roti-sabzi, paratha, paneer' },
  { id: 'south_indian',    label: 'South Indian',  desc: 'Rice, sambar, idli, dosa, rasam' },
  { id: 'gujarati',        label: 'Gujarati',      desc: 'Dal-bati, dhokla, thepla, farsan' },
  { id: 'bengali',         label: 'Bengali',       desc: 'Rice-based, mustard, mishti' },
  { id: 'maharashtrian',   label: 'Maharashtrian', desc: 'Bhakri, missal, poha, pithla' },
  { id: 'other',           label: 'Mixed / Other', desc: 'A bit of everything' },
]

const DIET_TYPES = [
  { id: 'vegetarian',     label: 'Vegetarian',    icon: '🌿' },
  { id: 'vegan',          label: 'Vegan',         icon: '🌱' },
  { id: 'non-vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
]

const COOKING_FOR = [
  { id: 'self',   label: 'Just me',      icon: '🙋' },
  { id: 'couple', label: 'Me + partner', icon: '👫' },
  { id: 'family', label: 'Full family',  icon: '👨‍👩‍👧‍👦' },
]

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Mostly sitting',    desc: 'Desk job, light movement' },
  { id: 'light',     label: 'Light activity',    desc: 'Short walks, occasional gym' },
  { id: 'moderate',  label: 'Moderately active', desc: 'Exercise 3–5×/week' },
  { id: 'active',    label: 'Very active',       desc: 'Daily intense exercise or physical job' },
]

const GOALS = [
  { id: 'manage_condition', label: 'Manage my health condition', icon: '🏥' },
  { id: 'lose_weight',      label: 'Lose weight',                icon: '⚡' },
  { id: 'maintain',         label: 'Maintain & eat better',      icon: '🌿' },
  { id: 'build_muscle',     label: 'Build muscle',               icon: '💪' },
]

// ── Reusable sub-components ────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 12, marginTop: 28,
    }}>
      {children}
    </div>
  )
}

function SelectCard({
  selected, onClick, icon, label, desc,
}: {
  selected: boolean; onClick: () => void
  icon?: string; label: string; desc?: string
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '10px 14px',
      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
      border: selected ? `2px solid ${GREEN}` : `1.5px solid ${WARM_BORDER}`,
      background: selected ? GREEN_LIGHT : '#fff',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {icon && <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: selected ? GREEN : TEXT }}>
          {label}
        </div>
        {desc && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>{desc}</div>}
      </div>
      {selected && (
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>✓</div>
      )}
    </button>
  )
}

function ConditionChip({
  condition, selected, onClick,
}: {
  condition: typeof CONDITION_LIST[0]; selected: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
      transition: 'all 0.15s', textAlign: 'left',
      border: selected ? `2px solid ${GREEN}` : `1.5px solid ${WARM_BORDER}`,
      background: selected ? GREEN_LIGHT : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <span style={{ fontSize: 16 }}>{condition.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: selected ? GREEN : TEXT, flex: 1 }}>
          {condition.label}
        </span>
        {selected && (
          <span style={{
            width: 16, height: 16, borderRadius: '50%',
            background: GREEN, color: '#fff', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✓</span>
        )}
      </div>
      <div style={{ fontSize: 10, color: TEXT_MUTED, lineHeight: 1.4 }}>
        {condition.description}
      </div>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────

interface FormData {
  name: string
  city: string
  region: string
  diet: string
  cooking_for: string
  conditions: ConditionId[]
  activity_level: string
  goal: string
  age: string
  weight_kg: string
  height_cm: string
  gender: string
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { profile, saveProfile, isSaving } = useProfile()

  const [form, setForm] = useState<FormData>({
    name: '',
    city: 'Gurgaon / Gurugram',
    region: 'north_indian',
    diet: 'vegetarian',
    cooking_for: 'self',
    conditions: [],
    activity_level: 'light',
    goal: 'maintain',
    age: '',
    weight_kg: '',
    height_cm: '',
    gender: '',
  })

  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  // Pre-fill from existing profile once loaded
  useEffect(() => {
    if (!profile) return
    setForm({
      name:           profile.name ?? '',
      city:           profile.city ?? 'Gurgaon / Gurugram',
      region:         profile.region ?? 'north_indian',
      diet:           profile.diet ?? 'vegetarian',
      cooking_for:    profile.cooking_for ?? 'self',
      conditions:     (profile.conditions ?? []) as ConditionId[],
      activity_level: profile.activity_level ?? 'light',
      goal:           profile.goal ?? 'maintain',
      age:            profile.age != null ? String(profile.age) : '',
      weight_kg:      profile.weight_kg != null ? String(profile.weight_kg) : '',
      height_cm:      profile.height_cm != null ? String(profile.height_cm) : '',
      gender:         profile.gender ?? '',
    })
  }, [profile])

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  const toggleCondition = (id: ConditionId) =>
    set('conditions', form.conditions.includes(id)
      ? form.conditions.filter(c => c !== id)
      : [...form.conditions, id])

  const handleSave = async () => {
    setError('')
    try {
      const payload: ProfileUpdate = {
        name:           form.name || null,
        city:           form.city.split(' /')[0],
        region:         form.region as ProfileUpdate['region'],
        diet:           form.diet as ProfileUpdate['diet'],
        cooking_for:    form.cooking_for as ProfileUpdate['cooking_for'],
        conditions:     form.conditions,
        activity_level: form.activity_level as ProfileUpdate['activity_level'],
        goal:           form.goal as ProfileUpdate['goal'],
        gender:         (form.gender || null) as ProfileUpdate['gender'],
        age:            form.age       ? parseInt(form.age)          : null,
        weight_kg:      form.weight_kg ? parseFloat(form.weight_kg)  : null,
        height_cm:      form.height_cm ? parseInt(form.height_cm)    : null,
      }
      await saveProfile(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Could not save changes. Please try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: WARM_BG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#2d6a4f', color: '#fff',
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 4px rgba(27,67,50,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🌿</span>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Aahar</div>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
            color: '#fff', borderRadius: 8, padding: '5px 14px',
            fontSize: 12, cursor: 'pointer', fontWeight: 500,
          }}
        >
          ← Back to planner
        </button>
      </div>

      {/* Page body */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 0 }}>
          Update your profile, health conditions and macro targets anytime.
        </p>

        {/* ── Basic info ─────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: `1px solid ${WARM_BORDER}`, borderRadius: 14, padding: '20px 20px 24px', marginTop: 24 }}>

          <SectionTitle>Your kitchen</SectionTitle>

          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>
            Name
          </label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Your first name (optional)"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: `1.5px solid ${WARM_BORDER}`, fontSize: 14,
              color: TEXT, background: '#faf9f7', outline: 'none', marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>
            City
          </label>
          <select
            value={form.city}
            onChange={e => set('city', e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: `1.5px solid ${WARM_BORDER}`, fontSize: 14,
              color: TEXT, background: '#faf9f7', outline: 'none', marginBottom: 20,
            }}
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
            Home cuisine
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {REGIONS.map(r => (
              <SelectCard
                key={r.id} selected={form.region === r.id}
                onClick={() => set('region', r.id)}
                label={r.label} desc={r.desc}
              />
            ))}
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
            Diet type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            {DIET_TYPES.map(d => (
              <SelectCard
                key={d.id} selected={form.diet === d.id}
                onClick={() => set('diet', d.id)}
                icon={d.icon} label={d.label}
              />
            ))}
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
            Planning meals for
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {COOKING_FOR.map(c => (
              <SelectCard
                key={c.id} selected={form.cooking_for === c.id}
                onClick={() => set('cooking_for', c.id)}
                icon={c.icon} label={c.label}
              />
            ))}
          </div>
        </div>

        {/* ── Health conditions ──────────────────────────────────── */}
        <div style={{ background: '#fff', border: `1px solid ${WARM_BORDER}`, borderRadius: 14, padding: '20px 20px 24px', marginTop: 16 }}>
          <SectionTitle>Health conditions</SectionTitle>

          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 14, lineHeight: 1.5,
            background: GREEN_LIGHT, borderRadius: 8, padding: '8px 12px' }}>
            🔒 Private — used only to generate your personal food rules
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CONDITION_LIST.map(c => (
              <ConditionChip
                key={c.id}
                condition={c}
                selected={form.conditions.includes(c.id)}
                onClick={() => toggleCondition(c.id)}
              />
            ))}
          </div>

          {form.conditions.length > 0 && (
            <div style={{
              background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
              borderRadius: 10, padding: '10px 14px', marginTop: 14,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 5 }}>
                Active food rules for your conditions:
              </div>
              {form.conditions.map(id => {
                const c = CONDITION_LIST.find(x => x.id === id)!
                return (
                  <div key={id} style={{ fontSize: 11, color: '#3a6a40', marginBottom: 3, display: 'flex', gap: 6 }}>
                    <span>{c.icon}</span>
                    <span>{c.description}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Body metrics & goals ───────────────────────────────── */}
        <div style={{ background: '#fff', border: `1px solid ${WARM_BORDER}`, borderRadius: 14, padding: '20px 20px 24px', marginTop: 16 }}>
          <SectionTitle>Body metrics & goals</SectionTitle>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Used for precise calorie and protein targets via the Mifflin-St Jeor formula.
          </p>

          {/* Age / Weight / Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {([
              { label: 'Age',    key: 'age'       as const, placeholder: 'e.g. 35',  unit: 'yrs' },
              { label: 'Weight', key: 'weight_kg' as const, placeholder: 'e.g. 68',  unit: 'kg'  },
              { label: 'Height', key: 'height_cm' as const, placeholder: 'e.g. 165', unit: 'cm'  },
            ] as const).map(({ label, key, placeholder, unit }) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 5 }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%', padding: '9px 32px 9px 10px', borderRadius: 10,
                      border: `1.5px solid ${WARM_BORDER}`, fontSize: 13,
                      color: TEXT, background: '#faf9f7', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 10, color: TEXT_MUTED, pointerEvents: 'none',
                  }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Gender */}
          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
            Gender <span style={{ fontWeight: 400 }}>(affects BMR calculation)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { id: 'male',              label: 'Male' },
              { id: 'female',            label: 'Female' },
              { id: 'other',             label: 'Other' },
              { id: 'prefer_not_to_say', label: 'Prefer not to say' },
            ].map(g => (
              <SelectCard
                key={g.id} selected={form.gender === g.id}
                onClick={() => set('gender', g.id)}
                label={g.label}
              />
            ))}
          </div>

          {/* Activity level */}
          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
            Activity level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {ACTIVITY_LEVELS.map(a => (
              <SelectCard
                key={a.id} selected={form.activity_level === a.id}
                onClick={() => set('activity_level', a.id)}
                label={a.label} desc={a.desc}
              />
            ))}
          </div>

          {/* Goal */}
          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
            Primary goal
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GOALS.map(g => (
              <SelectCard
                key={g.id} selected={form.goal === g.id}
                onClick={() => set('goal', g.id)}
                icon={g.icon} label={g.label}
              />
            ))}
          </div>
        </div>

        {/* ── Save ──────────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          {error && (
            <p style={{ fontSize: 13, color: '#c0392b', textAlign: 'center', marginBottom: 10 }}>
              {error}
            </p>
          )}

          {saved && (
            <div style={{
              textAlign: 'center', fontSize: 13, color: GREEN,
              background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
              borderRadius: 10, padding: '10px 16px', marginBottom: 12,
              fontWeight: 600,
            }}>
              ✓ Changes saved — your targets and rules are updated
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              border: 'none',
              background: isSaving ? '#95c99d' : GREEN,
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: isSaving ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(45,106,79,0.2)',
            }}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
