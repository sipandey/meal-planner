/**
 * useNaturalMeal
 * Sends a free-text user request ("I have lauki and moong dal, I'm tired")
 * to the /natural-meal edge function and gets back the best matching option.
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { SLOTS, OPTIONS } from '../data'
import type { Picks } from './useDayPlan'

export interface NaturalSuggestion {
  index:  number
  reason: string
}

interface UseNaturalMealOptions {
  picks:        Picks
  profile:      Record<string, unknown> | null
  dailyTargets: {
    protein: { min: number; max: number }
    fibre:   { min: number; max: number }
    carbs:   { min: number; max: number }
    kcal:    { min: number; max: number }
  }
}

export function useNaturalMeal({ picks, profile, dailyTargets }: UseNaturalMealOptions) {
  const { getToken } = useAuth()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState<NaturalSuggestion | null>(null)

  const getMacrosSoFar = useCallback((excludeSlot: string) => {
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

  const request = useCallback(async (slotId: string, userText: string) => {
    const slot = SLOTS.find(s => s.id === slotId)
    if (!slot || !userText.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) throw new Error('Not authenticated')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

      const res = await fetch(`${supabaseUrl}/functions/v1/natural-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slotId,
          slotLabel:        slot.label,
          userText:         userText.trim(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          availableOptions: (OPTIONS as any)[slotId] ?? [],
          profile:          profile ?? {},
          dailyTargets,
          dailyMacrosSoFar: getMacrosSoFar(slotId),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`)

      setResult({ index: json.index, reason: json.reason })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process your request')
    } finally {
      setLoading(false)
    }
  }, [getToken, picks, profile, dailyTargets, getMacrosSoFar])

  const clear = useCallback(() => { setResult(null); setError('') }, [])

  return { request, loading, error, result, clear }
}
