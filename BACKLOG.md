# Aahar — Product Backlog

> India's first AI nutritionist that speaks Indian food.
> See `PRODUCT_VISION.md` for the full strategic brief.

Last updated: 2026-05-11
Status legend: 🔴 Not started · 🟡 In progress · 🟢 Done

---

## Milestones

| # | Milestone | Theme | Target |
|---|-----------|-------|--------|
| M0 | Infrastructure | Auth + persistence (done) | ✅ Complete |
| M1 | Health Profile | Condition onboarding + constraint engine | Sprint 1–2 |
| M2 | AI Core | Meal generator + family profiles | Sprint 3–4 |
| M3 | Intelligence | Seasonal logic + Indian food database | Sprint 5–6 |
| M4 | Clinical | Doctor reports + dietitian tools | Sprint 7–8 |
| M5 | Growth | Grocery integration + sharing + scale | Sprint 9–10 |

---

## M0 — Infrastructure (Done ✅)

| ID | Feature | Status |
|----|---------|--------|
| M0-001 | Earthy green theme rebrand | 🟢 Done |
| M0-002 | React Router v7 + protected routes | 🟢 Done |
| M0-003 | Clerk auth (sign-in, sign-up, UserButton) | 🟢 Done |
| M0-004 | Supabase schema + RLS | 🟢 Done |
| M0-005 | TanStack Query + optimistic persistence | 🟢 Done |
| M0-006 | TypeScript config + Tailwind v4 | 🟢 Done |

---

## M1 — Health Profile & Constraint Engine

> Goal: The app understands *who* the user is and *what* their body needs.
> No more generic 1400 kcal plan. Every plan is generated from the user's conditions.

---

### FEAT-101 · Health condition onboarding wizard
**Priority:** P0 · **Size:** M · **Status:** 🔴

The single most important feature. Replaces the current generic onboarding.
This is what makes Aahar a medical-grade product, not a calorie counter.

**Conditions to capture (v1):**
- High LDL / cholesterol
- Type 2 diabetes / pre-diabetes
- PCOS
- Hypothyroidism / hyperthyroidism
- High uric acid / gout
- Hypertension
- Post-partum / breastfeeding
- Active weight loss goal
- Athletic / muscle gain goal
- None (healthy, general wellness)

**Also capture:**
- City (for seasonal intelligence)
- Diet type: vegetarian / vegan / non-vegetarian
- Cooking time available: quick (<30 min) / normal / relaxed

**Acceptance criteria:**
- 3-step wizard: (1) Who are you? (2) Your conditions, (3) Your household
- Each condition shows a one-line plain-language explanation of what it means for food
- Conditions stored in `profiles.conditions[]` in Supabase
- Wizard can be revisited and updated from Settings at any time
- Profile completeness shown as a % prompt in the header until done

---

### FEAT-102 · Condition → Constraint Engine (rule-based v1)
**Priority:** P0 · **Size:** L · **Status:** 🔴

The core intelligence of Aahar. Translates health conditions into a
personalized food rule set — automatically, without the user manually entering rules.

This is the IP. Every condition–food mapping must be clinically validated.

**Condition rules (v1):**

| Condition | Generated rules |
|-----------|----------------|
| High LDL | Walnuts daily (non-negotiable), 1 tbsp flaxseed in atta, soya max 4×/week no consecutive days, no cream/full-fat dairy, paneer max 2×/week low-fat only, chaas over lassi |
| Type 2 Diabetes | Low-GI rotis (jowar/bajra preferred in season), dal before rice always, no fruit juice, khichdi on high-sugar-risk days, fibre target +20% |
| PCOS | Anti-inflammatory priority (turmeric, ginger in meals), iron-rich dals 4×/week, seed cycling integration, balanced carbs across meals (no big gaps) |
| High uric acid | No spinach + dal same meal, masoor dal max 2×/week, rajma max 1×/week, high fluid targets, cooling foods priority |
| Hypertension | Low sodium targets, no pickle with every meal, potassium-rich foods (banana, sweet potato) weekly |
| Hypothyroid | No raw cruciferous in morning (cooked ok), selenium-rich foods (brazil nuts once weekly), iodine from curd/dahi |

**Acceptance criteria:**
- Rules are generated at profile save, stored in `profiles.rules[]`
- Rules are shown to the user in plain language ("Why am I seeing this?")
- The meal picker surfaces a warning badge on options that violate active rules
- Rules interact correctly (e.g. LDL + diabetes combined → specific rule union)
- New conditions can be added without code changes (data-driven rule table)

---

### FEAT-103 · Dynamic macro targets per profile
**Priority:** P0 · **Size:** S · **Status:** 🔴

Current: targets are hardcoded (65–80g protein, 1300–1550 kcal).
Needed: targets derived from condition + body metrics.

**Inputs:**
- Age, weight, height, gender (optional but improve accuracy)
- Activity level: sedentary / lightly active / moderately active / very active
- Health condition (from FEAT-101)
- Goal: maintain / lose / gain

**Outputs (auto-calculated):**
- Daily kcal range
- Protein range (g)
- Fibre target (g)
- Carb ceiling (g) — especially for diabetics
- Sodium ceiling (mg) — especially for hypertensives
- Specific nutrient targets (iron for PCOS, potassium for hypertension, etc.)

**Acceptance criteria:**
- Targets calculated using standard formulas (Mifflin-St Jeor for BMR, multiplied by activity factor)
- Condition-specific adjustments applied on top
- Header and Summary panel reflect the user's actual targets
- Targets recalculate when profile is updated

---

### FEAT-104 · Constraint violation warnings in the meal picker
**Priority:** P1 · **Size:** M · **Status:** 🔴

When a user picks a meal, the app checks it against their active rules.
Violations are flagged clearly — never blocked, always explained.

**Warning types:**
- 🔴 Hard conflict: "You had soya yesterday. Adding soya today violates your LDL rule."
- 🟡 Soft advisory: "This option has more saturated fat than ideal for your cholesterol target."
- ℹ️ Information: "This is a paneer meal. You've had 1 paneer meal this week (limit: 2)."

**Acceptance criteria:**
- Warnings shown inline on option cards — a badge, not a blocking modal
- Tapping/clicking the badge shows a full explanation with the clinical rationale
- Weekly frequency tracking for flagged ingredients (soya, paneer, rajma, masoor)
- Warnings respect the user's condition profile — no warnings if no conditions set

---

### FEAT-105 · Settings page
**Priority:** P1 · **Size:** S · **Status:** 🔴

**Acceptance criteria:**
- Edit profile: name, city, diet type
- Edit conditions: add/remove health conditions
- Edit body metrics: age, weight, height, activity level
- Edit family members (placeholder — full feature in M2)
- Danger zone: delete account

---

## M2 — AI Meal Generator & Family Profiles

> Goal: The app actively suggests what to eat, not just lets you pick from a list.
> And it does this for the whole family, not just one person.

---

### FEAT-201 · AI Meal Generator
**Priority:** P0 · **Size:** XL · **Status:** 🔴

**The signature feature. This is what makes Aahar feel like magic.**

Replaces the static option list with an AI-generated, always-personalized
suggestion for each meal slot. The AI knows:
- The user's health conditions and constraints
- What they've already picked today (running macro total)
- What they ate earlier this week (avoid repetition, enforce frequencies)
- The current season and city
- Time of day and slot context

**Input (to the LLM):**
```
User: 38F, High LDL, pre-diabetic, Gurgaon, May
Already today: wakeup=walnuts+almonds, breakfast=overnight oats
Running macros: P=29g, F=17g, C=74g, kcal=635
Slot: mid-morning
Remaining targets: P=51g, F=13g, C=96g, kcal=865
Rules: soya ok today (last was 2 days ago), paneer limit not hit
Season: summer, 40°C forecast

Generate 4 mid-morning options. Indian ingredients only.
Each must: hit slot macro targets, respect rules, be summer-appropriate.
Output JSON: [{name, detail, macros, tags, prep_time}]
```

**Acceptance criteria:**
- AI generates 4 options per slot on demand (tap "Suggest" button)
- Generated options are saved to the user's personal library for reuse
- Options that clash with constraints are never generated (pre-filtered in prompt)
- Generation takes < 5 seconds (streaming preferred)
- Fallback to curated options if AI call fails
- Cost guardrails: cache identical context hits for 24h

---

### FEAT-202 · Natural language meal request
**Priority:** P1 · **Size:** M · **Status:** 🔴

*"I have lauki and moong dal. I'm tired. Plan my dinner."*

A text input per slot (or for the whole day) that the AI interprets.
Contextual constraints are applied automatically.

**Acceptance criteria:**
- Text input field available on the slot panel ("Tell me what you have...")
- AI extracts: ingredients mentioned, energy level, time constraint, preferences
- Generates options that use those ingredients + meet constraints
- Response time < 8 seconds
- Input pre-filled with yesterday's dinner context on first open (reduces friction)

---

### FEAT-203 · Family profiles
**Priority:** P0 · **Size:** L · **Status:** 🔴

**The feature that makes Aahar a household product, not an individual tracker.**

Up to 5 family member profiles per account. Each has:
- Name, age, gender
- Health conditions (from the same FEAT-101 list)
- Dietary restrictions
- Calorie target

**The Family Nutrition Harmonizer:**
- When planning a meal, the AI sees all active family profiles
- It finds meal options that satisfy all profiles simultaneously
- It flags where a modification is needed ("Add extra roti for Arjun, skip achaar for Papa")
- The main macro tracker shows the primary user's macros; family view shows all

**Acceptance criteria:**
- Add/edit/remove family members from Settings
- Family view on the weekly planner shows all members' coverage
- Meal cards show a "works for" indicator (which family members it satisfies)
- Household grocery list aggregates across all profiles

---

### FEAT-204 · Weekly planner view
**Priority:** P1 · **Size:** L · **Status:** 🔴

7-day planning grid. The daily view (current) slots into this as one column.

**Acceptance criteria:**
- Mon–Sun grid with day-level status (kcal filled, slots picked, constraint violations)
- Click any day to open that day's plan
- "Copy from yesterday" one-tap action
- Week-level constraint checks (e.g., soya 4×/week limit shown at week level)
- Days in the past are read-only
- Week navigation (prev/next) without page reload

---

### FEAT-205 · Plan memory & learning
**Priority:** P2 · **Size:** M · **Status:** 🔴

The app should learn from what the user actually picks and avoid monotony.

**Acceptance criteria:**
- Track frequency of each meal option in the last 30 days
- AI generator deprioritizes recently repeated options
- "Haven't had this in a while" tags on options not picked in 14+ days
- Monthly variety score shown in the dashboard

---

## M3 — Seasonal Intelligence & Indian Food Database

> Goal: The deepest Indian food knowledge of any product on the market.
> The moat that takes years to replicate.

---

### FEAT-301 · Indian food database v1
**Priority:** P0 · **Size:** XL · **Status:** 🔴

The foundation of everything. A nutritionally accurate, culturally complete database
of Indian ingredients and meals.

**Scope (v1):**
- 500+ Indian ingredients with accurate macros (accounting for cooking method)
- Regional variants (North Indian dal differs from South Indian sambar)
- Preparation method adjustments (pressure-cooked dal vs stovetop)
- Seasonal availability by region
- Ayurvedic properties (cooling/heating/neutral) — validated against nutritional science
- Common Indian cooking oil quantities (not raw ingredient nutrition)

**Quality standard:**
- Sources: NIN (National Institute of Nutrition India) + peer-reviewed Indian nutrition studies
- Macros verified for cooked, not raw, portions (how Indians actually eat)
- Quantities in Indian measurements (katori, tbsp, pieces) not just grams

**Acceptance criteria:**
- Stored in Supabase `ingredients` and `meal_templates` tables
- Queryable by condition, season, region, cook-time, available ingredients
- Admin interface to add/edit entries (FEAT-501)

---

### FEAT-302 · Seasonal intelligence engine
**Priority:** P1 · **Size:** M · **Status:** 🔴

The app that knows it's June in Gurgaon.

**Season definitions (North India as v1):**
- Summer (Apr–Jun): cooling foods, high-water veg, lighter proteins
- Monsoon (Jul–Sep): light, easy-to-digest, avoid raw salads
- Autumn (Oct–Nov): transitional, reintroduce warming foods
- Winter (Dec–Mar): heavier foods, warming spices, bajra/makki rotis

**Acceptance criteria:**
- City + current month determines active season automatically
- Out-of-season options hidden by default (bajra roti hidden in June Delhi)
- "Show all seasons" toggle to override
- Seasonal badges on option cards ("summer pick", "winter only")
- Hydration targets adjust based on city temperature (API or static seasonal lookup)
- Seasonal intelligence extends to generated AI meals (FEAT-201)

---

### FEAT-303 · Regional meal intelligence
**Priority:** P2 · **Size:** L · **Status:** 🔴

India is not one cuisine. A user in Chennai eats differently from one in Lucknow.

**v1 regions:**
- North Indian (default) — dal-roti-sabzi base
- South Indian — rice/idli/dosa base, sambar, rasam, coconut
- Gujarati — dal-bati, dhokla, thepla, sweet-sour balance
- Bengali — fish-centric (non-veg option), mustard, panch phoron
- Maharashtrian — bhakri, missal, poha base

**Acceptance criteria:**
- User selects home cuisine in profile setup
- Meal database filters to show region-appropriate options by default
- AI generator respects regional cuisine in prompts
- Cross-regional options tagged appropriately

---

### FEAT-304 · Ingredient availability & substitution AI
**Priority:** P2 · **Size:** M · **Status:** 🔴

*"I don't have hung curd — what can I use?"*
*"Sattu isn't available in my city — what's equivalent?"*

**Acceptance criteria:**
- Ingredient substitution available on any meal card (tap ingredient in detail)
- AI suggests 2–3 Indian substitutes with nutrition impact delta
- "What can I make with these?" — enter available ingredients, AI suggests meals
- Common substitutions pre-cached (no API call needed for top 50 swaps)

---

## M4 — Clinical Tier & Dietitian Tools

> Goal: Make Aahar medically credible and open the B2B channel.

---

### FEAT-401 · Doctor / dietitian report
**Priority:** P1 · **Size:** M · **Status:** 🔴

Weekly nutrition report formatted for clinical review.

**Report contents:**
- 7-day macro averages vs targets
- Condition-specific metrics (e.g., saturated fat and fibre for LDL users)
- Key food frequency table (soya, dairy, pulses, specific prescribed foods)
- Constraint compliance rate (% of days rules were followed)
- Notable patterns ("You skipped breakfast 3 times this week")

**Acceptance criteria:**
- Generated as a PDF (Puppeteer or similar server-side rendering)
- Shareable via link (expires in 7 days) or downloadable
- Formatted for a doctor to scan in 60 seconds — not a data dump
- Patient name, date range, and conditions shown on the report header

---

### FEAT-402 · Dietitian Pro mode
**Priority:** P2 · **Size:** L · **Status:** 🔴

The B2B wedge. Dietitians manage Aahar plans for their clients.

**Acceptance criteria:**
- Dietitian account type (set in admin)
- Dietitian can view and edit plans for clients who have granted access
- Dietitian can annotate meal slots with comments
- Client sees comments with "From your dietitian" tag
- Dietitian dashboard: all clients' compliance rates at a glance
- Clients managed by a dietitian get the Clinical tier features included

---

### FEAT-403 · Lab report integration
**Priority:** P3 · **Size:** L · **Status:** 🔴

Upload a blood test report. AI extracts LDL, HbA1c, ferritin, etc.
and updates condition rules automatically.

**Acceptance criteria:**
- PDF/image upload of common Indian lab formats (Thyrocare, Dr Lal, SRL)
- AI OCR + extraction of key biomarkers
- Side-by-side: last report vs current report — delta shown
- Extracted values update the condition → rule engine automatically
- Privacy: lab reports stored encrypted, never used for ML training without consent

---

## M5 — Growth & Scale

---

### FEAT-501 · Grocery list with BigBasket / Zepto integration
**Priority:** P1 · **Size:** L · **Status:** 🔴

Turn the week's meal plan into a one-tap grocery order.

**Acceptance criteria:**
- "Generate grocery list" from any planned week
- Ingredients grouped by category (grains, pulses, dairy, produce, pantry)
- Quantities aggregated across the week and scaled for family size
- BigBasket deep-link integration (add to cart via API or search deep-link)
- Zepto integration (same)
- Manual check-off for items already at home
- Estimated cost shown (BigBasket pricing API if available, else manual)

---

### FEAT-502 · Shareable meal plans
**Priority:** P2 · **Size:** S · **Status:** 🔴

**Acceptance criteria:**
- "Share this week" generates a read-only public link
- Shared view shows all picks + macro summary, no edit controls
- Link expires in 7 days, user can revoke
- Share to WhatsApp one-tap (primary Indian sharing channel)

---

### FEAT-503 · Tiffin planner
**Priority:** P2 · **Size:** M · **Status:** 🔴

A uniquely Indian use case: planning the next day's tiffin alongside dinner.

**Acceptance criteria:**
- "Plan tomorrow's tiffin" mode suggests lunch options that travel well cold
- Cross-uses tonight's dinner ingredients where possible (reduce waste)
- Flags items that need morning prep vs can be packed from dinner leftovers
- Packing checklist with tiffin box layout suggestions

---

### FEAT-504 · Festival & occasion mode
**Priority:** P3 · **Size:** M · **Status:** 🔴

Navratri fasts, Karva Chauth, Ramzan, Diwali — Indian calendars have
nutritional implications that no app currently handles.

**Acceptance criteria:**
- Calendar overlay of major Indian festivals
- Navratri mode: automatically filters to saatvik/vrat-appropriate options
- Pre-festival prep: suggests liver-friendly, light foods in the week before Diwali
- Post-fast meal planning: appropriate re-introduction of foods
- Regional festival calendar variants (South Indian, Bengali, Gujarati)

---

## Tech Debt & Infrastructure

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| TD-001 | Migrate inline styles to Tailwind | P1 | Start with new components, migrate existing over time |
| TD-002 | Vitest unit tests for constraint engine | P0 | Clinical logic must be tested exhaustively |
| TD-003 | Playwright E2E for pick → persist flow | P1 | Core user journey |
| TD-004 | GitHub Actions CI (lint + test + preview deploy) | P1 | Before any team scaling |
| TD-005 | LLM cost monitoring + budget alerts | P1 | Needed before FEAT-201 ships |
| TD-006 | Indian food database schema design | P0 | Foundation for M3 — design before building |
| TD-007 | Error boundary + friendly error UI | P1 | Basic UX hygiene |
| TD-008 | Mobile responsive layout | P0 | Primary device for target user is mobile |
| TD-009 | Rate limiting on AI endpoints | P1 | Prevent abuse and runaway costs |
| TD-010 | DPDP Act compliance audit | P1 | India's Digital Personal Data Protection Act — health data is sensitive |

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-09 | Supabase for DB | Postgres + RLS + realtime; zero infra ops for early stage |
| 2026-05-09 | Clerk for auth | Pre-built UI, Google OAuth, clean Supabase JWT integration |
| 2026-05-09 | Constraint engine is advisory, never blocking | Hard blocks create frustration; warnings educate |
| 2026-05-09 | Monitoring / analytics deferred | Not needed until meaningful traffic |
| 2026-05-11 | Product renamed to Aahar | Authentic Indian word, spans all languages, clinically resonant |
| 2026-05-11 | Core pivot: personal tracker → AI clinical nutritionist | The data revealed a medical nutrition layer that is the real differentiator |
| 2026-05-11 | Family-first planning as key differentiator | No competitor approaches Indian household cooking dynamics |
| 2026-05-11 | Seasonal + Ayurvedic intelligence is core, not a feature | This is the moat — Indian knowledge no global company will build |
| 2026-05-11 | Dietitian B2B is the monetization wedge | Scales the knowledge graph + opens institutional revenue |
