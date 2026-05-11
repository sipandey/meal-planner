import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'
import { getSupabaseClient } from '../lib/supabase'

// Returns an authenticated Supabase client bound to the current Clerk session.
// Re-memoised whenever getToken changes (i.e. on sign-in / sign-out).
export function useSupabase() {
  const { getToken } = useAuth()

  return useMemo(
    () => ({
      // Call db() inside async functions — it awaits the fresh JWT each time.
      async db() {
        const token = await getToken({ template: 'supabase' })
        if (!token) throw new Error('Not authenticated')
        return getSupabaseClient(token)
      },
    }),
    [getToken],
  )
}
