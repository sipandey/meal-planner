/**
 * useAISuggestion
 * Calls the /suggest-meal edge function to get an AI-recommended meal for a slot.
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { SLOTS, OPTIONS } from '../data'
import type { Picks } from './useDayPlan'

export interface AISuggestion {
  slotId: string
  index:  number
  reason: string
}

interface UseAISuggestionOptions {
  picks:          Picks
  profile:        Record<string, unknown> | null
  dailyTargets:   {
    protein: { min: number; max: number }
    fibre:   { min: number; max: number }
    carbs:   { min: number; max: number }
    kcal:    { min: number; max: number }
  }
  getViolations?: (slotId: string, idx: number) => { severity: string }[]
}

export function useAISuggestion({
  picks,
  profile,
  dailyTargets,
  getViolations,
}: UseAISuggestionOptions) {
  const { getToken } = useAuth()
  const [suggestions, setSuggestions] = useState<Record<string, AISuggestion>>({})
  const [loading, setLoading]         = useState<Record<string, boolean>>({})
  const [error, setError]             = useState<Record<string, string>>({})

  // Compute current macro totals from picks
  const getMacrosSoFar = useCallback((excludeSlot?: string) => {
    return SLOTS.reduce(
      (acc, s) => {
        if (s.id === excludeSlot) return acc
        const idx = picks[s.id]
        if (idx !== null && idx !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const o = (OPTIONS as any)[s.id][idx]
          acc.p += o.p; acc.f += o.f; acc.c += o.c; acc.k += o.k
        }
        return acc
      },
      { p: 0, f: 0, c: 0, k: 0 },
    )
  }, [picks])

  // Get names of already-picked meals (for variety context)
  const getPickedNames = useCallback((excludeSlot?: string) => {
    return SLOTS
      .filter(s => s.id !== excludeSlot)
      .map(s => {
        const idx = picks[s.id]
        if (idx === null || idx === undefined) return null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (OPTIONS as any)[s.id][idx]?.name ?? null
      })
      .filter(Boolean) as string[]
  }, [picks])

  // Tags that would trigger hard violations for any option in a slot
  const getActiveViolationTags = useCallback((slotId: string): string[] => {
    if (!getViolations) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opts = (OPTIONS as any)[slotId] ?? []
    const hardTags = new Set<string>()
    opts.forEach((o: { tags?: string[] }, i: number) => {
      const violations = getViolations(slotId, i)
      if (violations.some(v => v.severity === 'hard')) {
        ;(o.tags ?? []).forEach(t => hardTags.add(t))
      }
    })
    return Array.from(hardTags)
  }, [getViolations])

  const suggestForSlot = useCallback(async (slotId: string) => {
    const slot = SLOTS.find(s => s.id === slotId)
    if (!slot) return

    setLoading(l => ({ ...l, [slotId]: true }))
    setError(e => ({ ...e, [slotId]: '' }))
    // Clear previous suggestion for this slot so stale data isn't shown
    setSuggestions(s => {
      const next = { ...s }
      delete next[slotId]
      return next
    })

    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) throw new Error('Not authenticated')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

      const body = {
        slotId,
        slotLabel:          slot.label,
        slotTime:           slot.time,
        slotTarget:         slot.target,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        availableOptions:   (OPTIONS as any)[slotId] ?? [],
        pickedOptionNames:  getPickedNames(slotId),
        profile:            profile ?? {},
        dailyTargets,
        dailyMacrosSoFar:   getMacrosSoFar(slotId),
        activeViolationTags: getActiveViolationTags(slotId),
      }

      const res = await fetch(
        `${supabaseUrl}/functions/v1/suggest-meal`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? `Server error ${res.status}`)
      }

      setSuggestions(s => ({ ...s, [slotId]: { slotId, index: json.index, reason: json.reason } }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not get suggestion'
      setError(e => ({ ...e, [slotId]: msg }))
    } finally {
      setLoading(l => ({ ...l, [slotId]: false }))
    }
  }, [getToken, picks, profile, dailyTargets, getMacrosSoFar, getPickedNames, getActiveViolationTags])

  /** Suggest for all empty slots sequentially */
  const suggestAll = useCallback(async () => {
    const emptySlots = SLOTS.filter(s => picks[s.id] === null || picks[s.id] === undefined)
    for (const slot of emptySlots) {
      await suggestForSlot(slot.id)
    }
  }, [picks, suggestForSlot])

  const clearSuggestion = useCallback((slotId: string) => {
    setSuggestions(s => {
      const next = { ...s }
      delete next[slotId]
      return next
    })
  }, [])

  return {
    suggestions,
    loading,
    error,
    suggestForSlot,
    suggestAll,
    clearSuggestion,
  }
}
