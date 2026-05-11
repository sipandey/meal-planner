/**
 * Aahar — Natural Language Meal Request Edge Function
 * POST /natural-meal
 *
 * User types: "I have lauki and moong dal. I'm tired. Plan my dinner."
 * AI picks the best matching option from the available slot options.
 *
 * Body: { slotId, slotLabel, userText, availableOptions, profile, dailyMacrosSoFar, dailyTargets }
 * Returns: { index: number, reason: string }
 *
 * Auth: Clerk JWT in Authorization header
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL          = 'gpt-4o-mini'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface MealOption {
  name: string; detail: string
  p: number; f: number; c: number; k: number
  tags?: string[]
}

interface MacroTotals  { p: number; f: number; c: number; k: number }
interface MacroTargets {
  protein: { min: number; max: number }
  fibre:   { min: number; max: number }
  carbs:   { min: number; max: number }
  kcal:    { min: number; max: number }
}
interface Profile {
  conditions?: string[]; region?: string; diet?: string
  activity_level?: string; goal?: string
}

interface RequestBody {
  slotId:           string
  slotLabel:        string
  userText:         string
  availableOptions: MealOption[]
  profile:          Profile
  dailyTargets:     MacroTargets
  dailyMacrosSoFar: MacroTotals
}

function buildPrompt(body: RequestBody): string {
  const { slotLabel, userText, availableOptions, profile, dailyTargets, dailyMacrosSoFar } = body

  const remaining = {
    p: dailyTargets.protein.max - dailyMacrosSoFar.p,
    f: dailyTargets.fibre.max   - dailyMacrosSoFar.f,
    c: dailyTargets.carbs.max   - dailyMacrosSoFar.c,
    k: dailyTargets.kcal.max    - dailyMacrosSoFar.k,
  }

  const conditionText = (profile.conditions ?? []).length > 0
    ? profile.conditions!.join(', ') : 'none'

  const optionsList = availableOptions.map((o, i) =>
    `${i}. ${o.name} — ${o.detail} | ${o.p}g P · ${o.f}g F · ${o.c}g C · ${o.k} kcal`
  ).join('\n')

  return `You are Aahar's Indian nutrition AI. A user has typed a free-text meal request for their ${slotLabel}.

USER REQUEST: "${userText}"

USER PROFILE
- Conditions: ${conditionText}
- Cuisine: ${profile.region ?? 'north_indian'} · Diet: ${profile.diet ?? 'vegetarian'}

REMAINING DAILY BUDGET
~${remaining.p}g protein · ~${remaining.f}g fibre · ~${remaining.c}g carbs · ~${remaining.k} kcal

AVAILABLE OPTIONS FOR ${slotLabel.toUpperCase()} (0-indexed)
${optionsList}

TASK
1. Interpret the user's free-text request (ingredients mentioned, energy level, time constraint, cravings).
2. Pick the best matching option (by 0-based index) that: (a) uses the ingredients/theme the user mentioned where possible, (b) fits their conditions, (c) respects remaining macro budget.
3. If no option closely matches, pick the best nutritional fit and explain the mismatch warmly.
4. Write one warm, honest sentence (max 20 words) explaining the choice — mention their ingredients if matched.

Respond ONLY with JSON: {"index": <integer>, "reason": "<one sentence>"}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  let body: RequestBody
  try { body = await req.json() }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (!body.userText?.trim()) {
    return new Response(JSON.stringify({ error: 'userText is required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:           MODEL,
      max_tokens:      120,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are Aahar\'s Indian nutrition AI. Always respond with valid JSON.' },
        { role: 'user',   content: buildPrompt(body) },
      ],
    }),
  })

  if (!res.ok) {
    console.error('OpenAI error:', await res.text())
    return new Response(JSON.stringify({ error: 'AI service unavailable. Please try again.' }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const data  = await res.json()
  const raw   = data.choices?.[0]?.message?.content ?? ''
  let parsed: { index: number; reason: string }
  try { parsed = JSON.parse(raw) }
  catch {
    return new Response(JSON.stringify({ error: 'AI returned unexpected format' }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const idx = Math.round(parsed.index)
  if (idx < 0 || idx >= body.availableOptions.length) {
    return new Response(JSON.stringify({ error: 'AI returned out-of-range index' }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ index: idx, reason: parsed.reason ?? '' }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
