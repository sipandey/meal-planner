/**
 * Aahar — AI Meal Suggestion Edge Function
 * POST /suggest-meal
 *
 * Called by the client with:
 *   { slotId, slotLabel, slotTime, slotTarget, availableOptions, currentPicks, profile, dailyMacrosSoFar }
 *
 * Returns:
 *   { index: number, reason: string }
 *
 * Auth: Clerk JWT in Authorization header (verified via Supabase RLS)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5'          // fast + cheap for a single-slot suggestion

// CORS headers for browser requests
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface MealOption {
  name: string
  detail: string
  p: number   // protein g
  f: number   // fibre g
  c: number   // carbs g
  k: number   // kcal
  tags?: string[]
}

interface SlotTarget {
  p: [number, number]
  f: [number, number]
  c: [number, number]
  k: [number, number]
}

interface MacroTotals {
  p: number; f: number; c: number; k: number
}

interface Profile {
  name?: string | null
  conditions?: string[]
  region?: string
  diet?: string
  activity_level?: string
  goal?: string
}

interface MacroTargets {
  protein: { min: number; max: number }
  fibre:   { min: number; max: number }
  carbs:   { min: number; max: number }
  kcal:    { min: number; max: number }
}

interface RequestBody {
  slotId:             string
  slotLabel:          string
  slotTime:           string
  slotTarget:         SlotTarget
  availableOptions:   MealOption[]
  pickedOptionNames:  string[]           // names of already-picked meals today
  profile:            Profile
  dailyTargets:       MacroTargets
  dailyMacrosSoFar:   MacroTotals
  activeViolationTags: string[]          // tags that would violate hard rules today
}

function buildPrompt(body: RequestBody): string {
  const {
    slotLabel, slotTime, slotTarget, availableOptions,
    pickedOptionNames, profile, dailyTargets, dailyMacrosSoFar,
    activeViolationTags,
  } = body

  const remainingBudget = {
    p: dailyTargets.protein.max - dailyMacrosSoFar.p,
    f: dailyTargets.fibre.max   - dailyMacrosSoFar.f,
    c: dailyTargets.carbs.max   - dailyMacrosSoFar.c,
    k: dailyTargets.kcal.max    - dailyMacrosSoFar.k,
  }

  const conditionText = (profile.conditions ?? []).length > 0
    ? profile.conditions!.join(', ')
    : 'none — general wellness'

  const optionsList = availableOptions.map((o, i) => {
    const violationFlag = (o.tags ?? []).some(t => activeViolationTags.includes(t))
      ? ' ⚠️ HARD RULE VIOLATION — avoid if possible'
      : ''
    return `${i}. ${o.name} | ${o.p}g protein · ${o.f}g fibre · ${o.c}g carbs · ${o.k} kcal | tags: ${(o.tags ?? []).join(', ')}${violationFlag}`
  }).join('\n')

  const alreadyPicked = pickedOptionNames.length > 0
    ? pickedOptionNames.join(', ')
    : 'nothing yet'

  return `You are Aahar's nutrition AI — a warm, knowledgeable expert in Indian vegetarian nutrition and home cooking. You suggest the single best meal for a user's next slot.

USER PROFILE
- Health conditions: ${conditionText}
- Cuisine: ${profile.region ?? 'north_indian'} · Diet: ${profile.diet ?? 'vegetarian'}
- Activity: ${profile.activity_level ?? 'light'} · Goal: ${profile.goal ?? 'maintain'}

DAILY MACRO TARGETS
- Protein: ${dailyTargets.protein.min}–${dailyTargets.protein.max}g
- Fibre:   ${dailyTargets.fibre.min}–${dailyTargets.fibre.max}g
- Carbs:   ${dailyTargets.carbs.min}–${dailyTargets.carbs.max}g
- Calories: ${dailyTargets.kcal.min}–${dailyTargets.kcal.max} kcal

TODAY'S PROGRESS SO FAR
- Already planned: ${alreadyPicked}
- Macros accumulated: ${dailyMacrosSoFar.p}g protein · ${dailyMacrosSoFar.f}g fibre · ${dailyMacrosSoFar.c}g carbs · ${dailyMacrosSoFar.k} kcal
- Remaining daily budget: ~${remainingBudget.p}g protein · ~${remainingBudget.f}g fibre · ~${remainingBudget.c}g carbs · ~${remainingBudget.k} kcal

SLOT TO FILL
- ${slotLabel} (${slotTime})
- Slot target: ${slotTarget.p[0]}–${slotTarget.p[1]}g protein · ${slotTarget.f[0]}–${slotTarget.f[1]}g fibre · ${slotTarget.c[0]}–${slotTarget.c[1]}g carbs · ${slotTarget.k[0]}–${slotTarget.k[1]} kcal

AVAILABLE OPTIONS (0-indexed)
${optionsList}

INSTRUCTIONS
1. Pick the option (by 0-based index) that best balances: (a) slot macro targets, (b) remaining daily budget, (c) user's health conditions, (d) variety (avoid repeating ingredients already picked today), (e) avoid hard-rule violations marked ⚠️ unless no alternative exists.
2. Write a single warm, helpful sentence (max 20 words) explaining why this option is best for THIS user — reference their conditions or goals if relevant.
3. Respond ONLY with valid JSON. No markdown, no explanation outside JSON.

REQUIRED JSON FORMAT
{"index": <integer>, "reason": "<one warm sentence>"}`.trim()
}

Deno.serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Auth: verify Clerk JWT via Supabase ────────────────────────
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

  // ── Parse body ────────────────────────────────────────────────
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (!body.availableOptions?.length) {
    return new Response(JSON.stringify({ error: 'No options provided' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Call Anthropic ─────────────────────────────────────────────
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const prompt = buildPrompt(body)

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key':         anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('Anthropic API error:', errText)
    return new Response(JSON.stringify({ error: 'AI service unavailable. Please try again.' }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const anthropicData = await anthropicRes.json()
  const rawText: string = anthropicData.content?.[0]?.text ?? ''

  // Parse JSON from the model's response (strip any accidental markdown)
  let parsed: { index: number; reason: string }
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? rawText)
  } catch {
    console.error('Failed to parse AI response:', rawText)
    return new Response(JSON.stringify({ error: 'AI returned unexpected format' }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Validate index is in range
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
