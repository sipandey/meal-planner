import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useProfile } from '../hooks/useProfile'
import { CONDITION_LIST } from '../data/conditions'
import type { ConditionId } from '../data/conditions'
import type { ProfileUpdate } from '../hooks/useProfile'

// ── Design tokens ─────────────────────────────────────────────────
const GREEN = '#2d6a4f'
const GREEN_LIGHT = '#edf5ea'
const GREEN_BORDER = '#95c99d'
const WARM_BG = '#f6f3ee'
const WARM_BORDER = '#e8dfd0'
const TEXT = '#1c2b1c'
const TEXT_MUTED = '#6a7a6a'

const CITIES = [
  'Gurgaon / Gurugram', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad',
  'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Noida', 'Faridabad', 'Indore', 'Other',
]

const REGIONS = [
  { id: 'north_indian',    label: 'North Indian', desc: 'Dal-roti-sabzi, paratha, paneer' },
  { id: 'south_indian',    label: 'South Indian', desc: 'Rice, sambar, idli, dosa, rasam' },
  { id: 'gujarati',        label: 'Gujarati',     desc: 'Dal-bati, dhokla, thepla, farsan' },
  { id: 'bengali',         label: 'Bengali',      desc: 'Rice-based, mustard, mishti' },
  { id: 'maharashtrian',   label: 'Maharashtrian',desc: 'Bhakri, missal, poha, pithla' },
  { id: 'other',           label: 'Mixed / Other',desc: 'A bit of everything' },
]

const COOKING_FOR = [
  { id: 'self',   label: 'Just me',        icon: '🙋' },
  { id: 'couple', label: 'Me + partner',   icon: '👫' },
  { id: 'family', label: 'Full family',    icon: '👨‍👩‍👧‍👦' },
]

const DIET_TYPES = [
  { id: 'vegetarian',     label: 'Vegetarian',     icon: '🌿' },
  { id: 'vegan',          label: 'Vegan',           icon: '🌱' },
  { id: 'non-vegetarian', label: 'Non-Vegetarian',  icon: '🍗' },
]

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Mostly sitting',  desc: 'Desk job, light movement' },
  { id: 'light',     label: 'Light activity',  desc: 'Short walks, occasional gym' },
  { id: 'moderate',  label: 'Moderately active',desc: 'Exercise 3–5×/week' },
  { id: 'active',    label: 'Very active',     desc: 'Daily intense exercise or physical job' },
]

const GOALS = [
  { id: 'manage_condition', label: 'Manage my health condition', icon: '🏥' },
  { id: 'lose_weight',      label: 'Lose weight',                icon: '⚡' },
  { id: 'maintain',         label: 'Maintain & eat better',      icon: '🌿' },
  { id: 'build_muscle',     label: 'Build muscle',               icon: '💪' },
]

// ── Step sub-components ───────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 99,
          width: i === step ? 32 : 16,
          background: i <= step ? GREEN : WARM_BORDER,
          transition: 'all 0.3s',
        }} />
      ))}
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
      width: '100%', textAlign: 'left', padding: '12px 16px',
      borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
      border: selected ? `2px solid ${GREEN}` : `1.5px solid ${WARM_BORDER}`,
      background: selected ? GREEN_LIGHT : '#fff',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {icon && <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? GREEN : TEXT }}>
          {label}
        </div>
        {desc && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{desc}</div>}
      </div>
      {selected && (
        <div style={{
          marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%',
          background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
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
      padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
      transition: 'all 0.15s', textAlign: 'left',
      border: selected ? `2px solid ${GREEN}` : `1.5px solid ${WARM_BORDER}`,
      background: selected ? GREEN_LIGHT : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{condition.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: selected ? GREEN : TEXT }}>
          {condition.label}
        </span>
        {selected && (
          <span style={{
            marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%',
            background: GREEN, color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✓</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.4 }}>
        {condition.description}
      </div>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────

interface WizardData {
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
}

const EMPTY: WizardData = {
  name: '', city: 'Gurgaon / Gurugram', region: 'north_indian',
  diet: 'vegetarian', cooking_for: 'self', conditions: [],
  activity_level: 'light', goal: 'maintain',
  age: '', weight_kg: '', height_cm: '',
}

export default function OnboardingPage() {
  const [step, setStep]   = useState(0)
  const [data, setData]   = useState<WizardData>(EMPTY)
  const [error, setError] = useState('')
  const { completeOnboarding, isSaving } = useProfile()
  const navigate = useNavigate()

  const set = <K extends keyof WizardData>(key: K, val: WizardData[K]) =>
    setData(d => ({ ...d, [key]: val }))

  const toggleCondition = (id: ConditionId) =>
    set('conditions', data.conditions.includes(id)
      ? data.conditions.filter(c => c !== id)
      : [...data.conditions, id])

  const next = () => { setError(''); setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleFinish = async () => {
    try {
      const payload: ProfileUpdate = {
        name: data.name || null,
        city: data.city.split(' /')[0], // "Gurgaon / Gurugram" → "Gurgaon"
        region: data.region as ProfileUpdate['region'],
        diet: data.diet as ProfileUpdate['diet'],
        cooking_for: data.cooking_for as ProfileUpdate['cooking_for'],
        conditions: data.conditions,
        activity_level: data.activity_level as ProfileUpdate['activity_level'],
        goal: data.goal as ProfileUpdate['goal'],
        age: data.age ? parseInt(data.age) : null,
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
        height_cm: data.height_cm ? parseInt(data.height_cm) : null,
      }
      await completeOnboarding(payload)
      navigate('/', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: WARM_BG,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 16px 80px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🌿</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>
          Aahar
        </div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
          आहार — your food, your health
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#fff', borderRadius: 20,
        border: `1px solid ${WARM_BORDER}`,
        padding: '32px 28px',
        boxShadow: '0 4px 24px rgba(27,67,50,0.06)',
      }}>
        <StepIndicator step={step} total={3} />

        {/* ── Step 0: Your Kitchen ──────────────────────────────── */}
        {step === 0 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
              Let's set up your kitchen 🍽️
            </h1>
            <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24, lineHeight: 1.6 }}>
              Tell us a little about how you eat. Takes 90 seconds.
            </p>

            {/* Name */}
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>
              What should we call you?
            </label>
            <input
              value={data.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Your first name (optional)"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${WARM_BORDER}`, fontSize: 14,
                color: TEXT, background: '#fff', outline: 'none', marginBottom: 20,
              }}
            />

            {/* City */}
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>
              Your city
            </label>
            <select
              value={data.city}
              onChange={e => set('city', e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${WARM_BORDER}`, fontSize: 14,
                color: TEXT, background: '#fff', outline: 'none', marginBottom: 20,
              }}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Home cuisine */}
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
              Your home cuisine
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {REGIONS.map(r => (
                <SelectCard
                  key={r.id} selected={data.region === r.id}
                  onClick={() => set('region', r.id)}
                  label={r.label} desc={r.desc}
                />
              ))}
            </div>

            {/* Diet */}
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
              Diet type
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {DIET_TYPES.map(d => (
                <SelectCard
                  key={d.id} selected={data.diet === d.id}
                  onClick={() => set('diet', d.id)}
                  icon={d.icon} label={d.label}
                />
              ))}
            </div>

            {/* Cooking for */}
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
              You're planning meals for…
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COOKING_FOR.map(c => (
                <SelectCard
                  key={c.id} selected={data.cooking_for === c.id}
                  onClick={() => set('cooking_for', c.id)}
                  icon={c.icon} label={c.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Your Health ───────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
              Your health 🩺
            </h1>
            <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 8, lineHeight: 1.6 }}>
              Select any conditions that apply to you or your household.
              This is how Aahar builds your personal food rules.
            </p>
            <p style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 20, padding: '8px 12px',
              background: GREEN_LIGHT, borderRadius: 8, lineHeight: 1.5 }}>
              🔒 This information stays on your device and is never shared or sold.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {CONDITION_LIST.map(c => (
                <ConditionChip
                  key={c.id}
                  condition={c}
                  selected={data.conditions.includes(c.id)}
                  onClick={() => toggleCondition(c.id)}
                />
              ))}
            </div>

            {data.conditions.length === 0 && (
              <p style={{ fontSize: 12, color: TEXT_MUTED, textAlign: 'center' }}>
                No conditions? Great — we'll set up a general wellness plan. ✅
              </p>
            )}

            {data.conditions.length > 0 && (
              <div style={{
                background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
                borderRadius: 12, padding: '12px 16px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 6 }}>
                  Your plan will include:
                </div>
                {data.conditions.map(id => {
                  const c = CONDITION_LIST.find(x => x.id === id)!
                  return (
                    <div key={id} style={{ fontSize: 12, color: '#3a6a40', marginBottom: 4, display: 'flex', gap: 6 }}>
                      <span>{c.icon}</span>
                      <span>{c.description}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Your Body & Goals ─────────────────────────── */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
              Your body & goals 🎯
            </h1>
            <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20, lineHeight: 1.6 }}>
              Optional — helps us calculate your exact calorie and protein targets.
              You can skip and update later from Settings.
            </p>

            {/* Body metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Age', key: 'age' as const, placeholder: 'e.g. 35', unit: 'yrs' },
                { label: 'Weight', key: 'weight_kg' as const, placeholder: 'e.g. 68', unit: 'kg' },
                { label: 'Height', key: 'height_cm' as const, placeholder: 'e.g. 165', unit: 'cm' },
              ].map(({ label, key, placeholder, unit }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 5 }}>
                    {label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={data[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder={placeholder}
                      style={{
                        width: '100%', padding: '9px 32px 9px 10px', borderRadius: 10,
                        border: `1.5px solid ${WARM_BORDER}`, fontSize: 13,
                        color: TEXT, background: '#fff', outline: 'none',
                      }}
                    />
                    <span style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 10, color: TEXT_MUTED,
                    }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity level */}
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 10 }}>
              How active are you?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {ACTIVITY_LEVELS.map(a => (
                <SelectCard
                  key={a.id} selected={data.activity_level === a.id}
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
                  key={g.id} selected={data.goal === g.id}
                  onClick={() => set('goal', g.id)}
                  icon={g.icon} label={g.label}
                />
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#c0392b', marginTop: 16, textAlign: 'center' }}>
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          {step > 0 && (
            <button onClick={back} style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              border: `1.5px solid ${WARM_BORDER}`, background: '#fff',
              fontSize: 14, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer',
            }}>
              ← Back
            </button>
          )}

          {step < 2 && (
            <button onClick={next} style={{
              flex: 2, padding: '12px 0', borderRadius: 12,
              border: 'none', background: GREEN, color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Continue →
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleFinish}
              disabled={isSaving}
              style={{
                flex: 2, padding: '12px 0', borderRadius: 12,
                border: 'none',
                background: isSaving ? '#95c99d' : GREEN,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: isSaving ? 'wait' : 'pointer',
              }}
            >
              {isSaving ? 'Setting up your plan…' : 'Build my plan 🌿'}
            </button>
          )}
        </div>

        {/* Skip link for step 2 */}
        {step === 2 && (
          <button
            onClick={() => { set('age', ''); set('weight_kg', ''); set('height_cm', ''); handleFinish() }}
            style={{
              display: 'block', margin: '12px auto 0',
              background: 'none', border: 'none', fontSize: 12,
              color: TEXT_MUTED, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Skip body metrics for now
          </button>
        )}
      </div>
    </div>
  )
}
