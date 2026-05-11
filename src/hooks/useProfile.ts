import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { useSupabase } from './useSupabase'
import type { Profile } from '../lib/supabase'

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'clerk_user_id' | 'created_at' | 'updated_at'>>

const PROFILE_KEY = (userId: string) => ['profile', userId]

export function useProfile() {
  const { user } = useUser()
  const { db } = useSupabase()
  const qc = useQueryClient()

  // ── Fetch ────────────────────────────────────────────────────────
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: PROFILE_KEY(user?.id ?? ''),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Profile | null> => {
      const client = await db()
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', user!.id)
        .maybeSingle()

      if (error) throw error
      return data as Profile | null
    },
  })

  // ── Upsert ───────────────────────────────────────────────────────
  const { mutateAsync: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      const client = await db()
      const { data, error } = await client
        .from('profiles')
        .upsert(
          { clerk_user_id: user!.id, ...updates },
          { onConflict: 'clerk_user_id' },
        )
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: (updated) => {
      qc.setQueryData(PROFILE_KEY(user!.id), updated)
    },
  })

  // ── Complete onboarding ──────────────────────────────────────────
  const completeOnboarding = async (finalData: ProfileUpdate) => {
    return saveProfile({ ...finalData, onboarded: true })
  }

  return {
    profile,
    isLoading,
    isError,
    isSaving,
    saveProfile,
    completeOnboarding,
  }
}
