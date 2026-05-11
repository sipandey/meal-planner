/**
 * useWeekPlan
 * Fetches all day_plans for a given Mon–Sun week in a single Supabase query.
 * Also exposes helpers for week date math.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { useSupabase } from './useSupabase'
import { SLOTS, OPTIONS } from '../data'
import { INITIAL_PICKS } from './useDayPlan'
import type { Picks } from './useDayPlan'

// ── Date helpers ───────────────────────────────────────────────────

export function getMondayOfWeek(date: string): string {
  const d   = new Date(date + 'T00:00:00')
  const day = d.getDay()              // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export function getWeekDates(monday: string): string[] {
  const out: string[] = []
  const base = new Date(monday + 'T00:00:00')
  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getTime() + i * 86_400_000)
    out.push(d.toISOString().split('T')[0])
  }
  return out
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function formatDayLabel(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })
}

export function formatDateShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ── Macro totals helper (shared with App.jsx logic) ────────────────

export function computeTotals(picks: Picks) {
  return SLOTS.reduce(
    (acc, s) => {
      const idx = picks[s.id]
      if (idx !== null && idx !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const o = (OPTIONS as any)[s.id][idx]
        if (o) { acc.p += o.p; acc.f += o.f; acc.c += o.c; acc.k += o.k }
      }
      return acc
    },
    { p: 0, f: 0, c: 0, k: 0 },
  )
}

export type WeekPicks = Record<string, Picks>   // date → picks

function weekKey(monday: string) {
  return ['week_plan', monday]
}

// ── Hook ───────────────────────────────────────────────────────────

export function useWeekPlan(monday: string) {
  const { user } = useUser()
  const supabase  = useSupabase()
  const qc        = useQueryClient()

  const sunday = addDays(monday, 6)

  const query = useQuery({
    queryKey: weekKey(monday),
    enabled:  !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<WeekPicks> => {
      const client = await supabase.db()
      const { data, error } = await client
        .from('day_plans')
        .select('date, picks')
        .eq('clerk_user_id', user!.id)
        .gte('date', monday)
        .lte('date', sunday)

      if (error) throw error

      const result: WeekPicks = {}
      const dates = getWeekDates(monday)
      // Pre-fill every day with INITIAL_PICKS so UI always has a stable object
      dates.forEach(d => { result[d] = { ...INITIAL_PICKS } })
      // Overlay saved picks
      ;(data ?? []).forEach(row => {
        result[row.date] = { ...INITIAL_PICKS, ...(row.picks ?? {}) }
      })
      return result
    },
  })

  /** Copy one day's picks to another day */
  const copyDay = useMutation({
    mutationFn: async ({ fromDate, toDate }: { fromDate: string; toDate: string }) => {
      const weekPicks = qc.getQueryData<WeekPicks>(weekKey(monday))
      const sourcePicks = weekPicks?.[fromDate] ?? INITIAL_PICKS

      const client = await supabase.db()
      const { error } = await client
        .from('day_plans')
        .upsert(
          { clerk_user_id: user!.id, date: toDate, picks: sourcePicks },
          { onConflict: 'clerk_user_id,date' },
        )
      if (error) throw error

      // Also invalidate the individual day query so day view reflects the copy
      qc.invalidateQueries({ queryKey: ['day_plan', toDate] })
      return sourcePicks
    },
    onSuccess: (sourcePicks, { toDate }) => {
      qc.setQueryData<WeekPicks>(weekKey(monday), prev => ({
        ...(prev ?? {}),
        [toDate]: sourcePicks,
      }))
    },
  })

  return {
    weekPicks:  query.data ?? {},
    isLoading:  query.isLoading,
    copyDay:    copyDay.mutate,
    isCopying:  copyDay.isPending,
  }
}
