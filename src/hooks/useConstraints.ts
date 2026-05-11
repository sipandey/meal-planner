/**
 * useConstraints.ts
 *
 * Evaluates the user's active picks and week history against their
 * condition-based food rules. Returns violations with severity and rationale
 * so the UI can show inline warnings on meal cards.
 *
 * Rules are advisory — never blocking. The user always has the final say.
 */

import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { getRulesForConditions, type FoodRule, type ConditionId } from '../data/conditions'
import { OPTIONS } from '../data'
import type { Picks } from './useDayPlan'

// A week's worth of picks: date (ISO) → picks
export type WeekHistory = Record<string, Picks>

export interface Violation {
  ruleId: string
  conditionId: ConditionId
  severity: 'hard' | 'soft'
  text: string       // short warning shown on the card
  rationale: string  // full clinical explanation shown on tap
}

// Per slot-option, which violations apply if it were picked
export type ViolationMap = Record<string, Record<number, Violation[]>>

function getTagsForOption(slotId: string, optionIdx: number): string[] {
  const option = OPTIONS[slotId]?.[optionIdx]
  return option?.tags ?? []
}

// Count how many times a tag appears in this week's picks
function countTagInWeek(tag: string, weekHistory: WeekHistory): number {
  return Object.values(weekHistory).reduce((count, dayPicks) => {
    return count + Object.entries(dayPicks).filter(([slotId, idx]) => {
      if (idx === null || idx === undefined) return false
      return getTagsForOption(slotId, idx as number).includes(tag)
    }).length
  }, 0)
}

// Check if tag appeared yesterday (for no-consecutive-days rules)
function tagAppearedYesterday(tag: string, weekHistory: WeekHistory, today: string): boolean {
  const dates = Object.keys(weekHistory).sort()
  const todayIdx = dates.indexOf(today)
  if (todayIdx <= 0) return false

  const yesterday = dates[todayIdx - 1]
  const yesterdayPicks = weekHistory[yesterday] ?? {}

  return Object.entries(yesterdayPicks).some(([slotId, idx]) => {
    if (idx === null || idx === undefined) return false
    return getTagsForOption(slotId, idx as number).includes(tag)
  })
}

// Check if this option's tags conflict with another already-picked option today
function hasAvoidCombination(
  rule: FoodRule,
  optionTags: string[],
  todayPicks: Picks,
  slotId: string,
): boolean {
  if (!rule.avoidWith?.length) return false

  const optionMatchesAvoidWith = rule.avoidWith.some(t => optionTags.includes(t))
  if (!optionMatchesAvoidWith) return false

  // Check if any already-picked option today has the other conflicting tag
  return Object.entries(todayPicks).some(([pickedSlotId, idx]) => {
    if (pickedSlotId === slotId || idx === null || idx === undefined) return false
    const pickedTags = getTagsForOption(pickedSlotId, idx as number)
    return rule.avoidWith!.some(t => pickedTags.includes(t) && !optionTags.includes(t))
  })
}

export function useConstraints(
  todayPicks: Picks,
  weekHistory: WeekHistory,
  today: string,
) {
  const { profile } = useProfile()

  const rules = useMemo(() => {
    if (!profile?.conditions?.length) return []
    return getRulesForConditions(profile.conditions as ConditionId[])
  }, [profile?.conditions])

  // Build a violation map: slotId → optionIdx → violations[]
  const violationMap = useMemo((): ViolationMap => {
    if (!rules.length) return {}

    const map: ViolationMap = {}

    Object.entries(OPTIONS).forEach(([slotId, options]) => {
      map[slotId] = {}

      options.forEach((_, optionIdx) => {
        const optionTags = getTagsForOption(slotId, optionIdx)
        const violations: Violation[] = []

        rules.forEach(rule => {
          if (!rule.tag) return // rules without a tag are checked at the day level, not per option

          const optionHasTag = optionTags.includes(rule.tag)
          if (!optionHasTag) return

          // max_per_week check
          if (rule.type === 'max_per_week' && rule.maxPerWeek !== undefined) {
            const weekCount = countTagInWeek(rule.tag, weekHistory)
            if (weekCount >= rule.maxPerWeek) {
              violations.push({
                ruleId: rule.id,
                conditionId: rule.conditionId,
                severity: rule.severity,
                text: `${rule.tag} limit reached (${rule.maxPerWeek}×/week)`,
                rationale: rule.rationale,
              })
            }
          }

          // no_consecutive_days check
          if (rule.noConsecutiveDays && tagAppearedYesterday(rule.tag, weekHistory, today)) {
            violations.push({
              ruleId: rule.id,
              conditionId: rule.conditionId,
              severity: rule.severity,
              text: `${rule.tag} was yesterday — not on consecutive days`,
              rationale: rule.rationale,
            })
          }

          // avoid_combination check
          if (rule.type === 'avoid_combination') {
            if (hasAvoidCombination(rule, optionTags, todayPicks, slotId)) {
              violations.push({
                ruleId: rule.id,
                conditionId: rule.conditionId,
                severity: rule.severity,
                text: rule.text,
                rationale: rule.rationale,
              })
            }
          }
        })

        if (violations.length) map[slotId][optionIdx] = violations
      })
    })

    return map
  }, [rules, weekHistory, todayPicks, today])

  // Day-level required items check (walnuts, flaxseed, etc.)
  const dailyRequirements = useMemo(() => {
    return rules
      .filter(r => r.type === 'require_daily' && r.tag)
      .map(rule => {
        const metToday = Object.entries(todayPicks).some(([slotId, idx]) => {
          if (idx === null || idx === undefined) return false
          return getTagsForOption(slotId, idx as number).includes(rule.tag!)
        })
        return { rule, met: metToday }
      })
  }, [rules, todayPicks])

  const getViolations = (slotId: string, optionIdx: number): Violation[] =>
    violationMap[slotId]?.[optionIdx] ?? []

  const hasViolation = (slotId: string, optionIdx: number): boolean =>
    getViolations(slotId, optionIdx).length > 0

  const hardViolation = (slotId: string, optionIdx: number): boolean =>
    getViolations(slotId, optionIdx).some(v => v.severity === 'hard')

  return {
    getViolations,
    hasViolation,
    hardViolation,
    dailyRequirements,
    activeRulesCount: rules.length,
  }
}

export type { Picks }
