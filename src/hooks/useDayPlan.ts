import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { useSupabase } from './useSupabase'
import { SLOTS } from '../data'

const INITIAL_PICKS = Object.fromEntries(SLOTS.map(s => [s.id, null])) as Record<string, number | null>

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function planKey(date: string) {
  return ['day_plan', date]
}

export function useDayPlan(date = todayISO()) {
  const { user } = useUser()
  const supabase = useSupabase()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: planKey(date),
    enabled: !!user,
    queryFn: async () => {
      const client = await supabase.db()
      const { data, error } = await client
        .from('day_plans')
        .select('picks')
        .eq('clerk_user_id', user!.id)
        .eq('date', date)
        .maybeSingle()

      if (error) throw error

      // Return saved picks merged with INITIAL_PICKS so new slots default to null
      return { ...INITIAL_PICKS, ...(data?.picks ?? {}) } as Record<string, number | null>
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (picks: Record<string, number | null>) => {
      const client = await supabase.db()
      const { error } = await client
        .from('day_plans')
        .upsert(
          { clerk_user_id: user!.id, date, picks },
          { onConflict: 'clerk_user_id,date' },
        )
      if (error) throw error
      return picks
    },
    onMutate: async (picks) => {
      // Optimistic update — reflect the change instantly
      await qc.cancelQueries({ queryKey: planKey(date) })
      const prev = qc.getQueryData(planKey(date))
      qc.setQueryData(planKey(date), picks)
      return { prev }
    },
    onError: (_err, _picks, ctx) => {
      if (ctx?.prev) qc.setQueryData(planKey(date), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: planKey(date) })
    },
  })

  const picks = query.data ?? INITIAL_PICKS

  function pick(slotId: string, idx: number) {
    const next = {
      ...picks,
      [slotId]: picks[slotId] === idx ? null : idx,
    }
    saveMutation.mutate(next)
  }

  function clearAll() {
    saveMutation.mutate(INITIAL_PICKS)
  }

  return {
    picks,
    pick,
    clearAll,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
  }
}
