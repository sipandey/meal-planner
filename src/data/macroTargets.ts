/**
 * macroTargets.ts
 *
 * Calculates personalised daily macro targets from the user's profile.
 * Uses Mifflin-St Jeor BMR → TDEE → condition adjustments.
 *
 * Targets are expressed as {min, max} ranges so the UI can show
 * progress bars with a zone rather than a hard number.
 */

import { getMacroAdjustments, type ConditionId } from './conditions'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type Gender = 'male' | 'female' | 'other'
export type Goal = 'manage_condition' | 'lose_weight' | 'maintain' | 'build_muscle'

export interface ProfileMetrics {
  age?: number
  weightKg?: number
  heightCm?: number
  gender?: Gender
  activityLevel?: ActivityLevel
  goal?: Goal
  conditions: ConditionId[]
}

export interface MacroTargets {
  kcal: { min: number; max: number }
  protein: { min: number; max: number }
  fibre: { min: number; max: number }
  carbs: { min: number; max: number }
  // Slot-level targets are derived from these daily totals
  // at a fixed distribution (see SLOT_DISTRIBUTION below)
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // desk job, no exercise
  light: 1.375,      // light exercise 1–3 days/week
  moderate: 1.55,    // moderate exercise 3–5 days/week
  active: 1.725,     // hard exercise 6–7 days/week
}

// Default targets when we don't have body metrics —
// aligned with the original personalised plan in the seed data.
const DEFAULT_TARGETS: MacroTargets = {
  kcal:    { min: 1300, max: 1550 },
  protein: { min: 65,   max: 82   },
  fibre:   { min: 22,   max: 32   },
  carbs:   { min: 130,  max: 170  },
}

export function calculateMacroTargets(profile: ProfileMetrics): MacroTargets {
  const { age, weightKg, heightCm, gender, activityLevel, goal, conditions } = profile

  // If we don't have enough to calculate, return defaults
  if (!age || !weightKg || !heightCm || !gender || gender === 'other') {
    return applyConditionAdjustments(DEFAULT_TARGETS, weightKg, conditions)
  }

  // ── BMR (Mifflin-St Jeor) ─────────────────────────────────────────
  const bmr =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  // ── TDEE ─────────────────────────────────────────────────────────
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel ?? 'light']
  let tdee = bmr * multiplier

  // ── Condition adjustments ─────────────────────────────────────────
  const adj = getMacroAdjustments(conditions)
  tdee += adj.kcalAdjustment

  // Goal adjustment (on top of condition)
  if (goal === 'lose_weight'   && !conditions.includes('weight_loss')) tdee -= 350
  if (goal === 'build_muscle'  && !conditions.includes('muscle_gain')) tdee += 350

  const kcalMin = Math.max(1200, Math.round(tdee - 100))
  const kcalMax = Math.max(1400, Math.round(tdee + 100))

  // ── Protein ───────────────────────────────────────────────────────
  // Base 1.2g/kg, scaled by condition multiplier
  const proteinBase = Math.round(weightKg * adj.proteinMultiplier)
  const proteinMin = proteinBase - 5
  const proteinMax = proteinBase + 15

  // ── Fibre ─────────────────────────────────────────────────────────
  const fibreBase = 25 + adj.fibreBonus
  const fibreMin = fibreBase
  const fibreMax = fibreBase + 8

  // ── Carbs ─────────────────────────────────────────────────────────
  // 45–55% of calories from carbs, capped by condition ceiling
  const carbMin = Math.round((kcalMin * 0.45) / 4)
  const carbMaxCalc = Math.round((kcalMax * 0.55) / 4)
  const carbMax = adj.carbCeilingG
    ? Math.min(carbMaxCalc, adj.carbCeilingG)
    : carbMaxCalc

  return {
    kcal:    { min: kcalMin,    max: kcalMax    },
    protein: { min: proteinMin, max: proteinMax  },
    fibre:   { min: fibreMin,   max: fibreMax    },
    carbs:   { min: carbMin,    max: carbMax     },
  }
}

// When we have weight but not full metrics — apply condition rule adjustments
// to default targets without full Mifflin-St Jeor calculation.
function applyConditionAdjustments(
  base: MacroTargets,
  weightKg: number | undefined,
  conditions: ConditionId[],
): MacroTargets {
  if (!conditions.length) return base

  const adj = getMacroAdjustments(conditions)
  const proteinBase = weightKg
    ? Math.round(weightKg * adj.proteinMultiplier)
    : base.protein.min

  return {
    kcal: {
      min: Math.max(1200, base.kcal.min + adj.kcalAdjustment),
      max: Math.max(1400, base.kcal.max + adj.kcalAdjustment),
    },
    protein: {
      min: proteinBase - 5,
      max: proteinBase + 15,
    },
    fibre: {
      min: base.fibre.min + adj.fibreBonus,
      max: base.fibre.max + adj.fibreBonus,
    },
    carbs: adj.carbCeilingG
      ? { min: base.carbs.min, max: Math.min(base.carbs.max, adj.carbCeilingG) }
      : base.carbs,
  }
}

export { DEFAULT_TARGETS }
