import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Unauthenticated client — only for public/anon operations.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authenticated client — call getSupabaseClient(token) inside hooks
// where you already have the Clerk JWT. The token is passed per-call
// so the client always uses a fresh token and never caches stale auth.
export function getSupabaseClient(clerkToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${clerkToken}` },
    },
  })
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Profile {
  id: string
  clerk_user_id: string
  name: string | null
  kcal_min: number
  kcal_max: number
  protein_min: number
  protein_max: number
  fibre_min: number
  fibre_max: number
  city: string
  diet: 'vegetarian' | 'vegan' | 'non-vegetarian'
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface DayPlan {
  id: string
  clerk_user_id: string
  date: string              // ISO date string YYYY-MM-DD
  picks: Record<string, number | null>
  created_at: string
  updated_at: string
}
