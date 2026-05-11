# Meal Planner — Product Backlog

> Maintained by: PM / Engineering lead
> Last updated: 2026-05-09
> Status legend: 🔴 Not started · 🟡 In progress · 🟢 Done

---

## Guiding Principles

1. **Nutrition-first** — every feature serves the user's health goals, never obscures them.
2. **Low friction** — picking a day's meals should take < 2 minutes.
3. **Multi-user ready** — the data model and API must support isolated user accounts from day one.
4. **Mobile-first** — the majority of meal planning happens on phones.
5. **Offline-capable** — plans should survive spotty connectivity.

---

## Milestones

| # | Milestone | Goal | Target |
|---|-----------|------|--------|
| M1 | Foundation | Persistence + auth + mobile layout | Sprint 1–2 |
| M2 | Core Planning | Weekly view + constraint engine + grocery list | Sprint 3–4 |
| M3 | Personalisation | User profiles + custom meals + smart suggestions | Sprint 5–6 |
| M4 | Social & Growth | Sharing + nutritionist mode + analytics | Sprint 7–8 |
| M5 | Scale & Ops | PWA + monitoring + admin + billing | Sprint 9–10 |

---

## M1 — Foundation

### FEAT-001 · Day plan persistence (localStorage)
**Priority:** P0 · **Size:** S

Current state: all picks reset on page refresh. Users lose their plan every time.

**Acceptance criteria:**
- Picks survive a full page reload.
- Clearing via the "Clear all" button also clears storage.
- Graceful fallback if storage is unavailable (private browsing, quota exceeded).

---

### FEAT-002 · User authentication
**Priority:** P0 · **Size:** M

Enable multi-user access. Each user sees only their own data.

**Approach:** Supabase Auth (email/password + Google OAuth).

**Acceptance criteria:**
- Sign up, sign in, sign out flows.
- Email verification on registration.
- JWT stored securely (httpOnly cookie preferred, not localStorage).
- Protected routes redirect unauthenticated users to login.
- Auth state persists across page refreshes.

---

### FEAT-003 · Backend: user data API
**Priority:** P0 · **Size:** M

Replace hardcoded `data.js` with a database-backed API so data is per-user and persistable.

**Tables needed (Supabase / Postgres):**
```
users           — id, email, created_at, profile_id
profiles        — id, user_id, name, kcal_target, protein_target, fibre_target, diet_tags[], city, season
day_plans       — id, user_id, date, picks (jsonb), created_at, updated_at
meal_options    — id, user_id (null = global), slot_id, name, detail, p, f, c, k, tags[]
constraints     — id, user_id, text, is_active
```

**Acceptance criteria:**
- `GET /plans/:date` returns the user's plan for that date (creates empty if none).
- `PUT /plans/:date` saves picks atomically.
- All endpoints require a valid JWT.
- Global meal options are readable by all users; user-created options are private.

---

### FEAT-004 · Mobile-responsive layout
**Priority:** P0 · **Size:** M

Current layout is desktop-only (1100px grid with a fixed 320px sidebar).

**Acceptance criteria:**
- On screens < 768px: slot tabs scroll horizontally; sidebar (Summary) moves below the main panel or becomes a bottom sheet.
- On screens < 480px: meal option cards go single-column.
- Slot tabs are touch-friendly (min 44px tap target).
- Sticky header and tab bar still work correctly on mobile Safari and Chrome.
- No horizontal scroll on any viewport ≥ 320px wide.

---

### FEAT-005 · Onboarding flow
**Priority:** P1 · **Size:** M

New users land on a blank app with no context. Need a guided first-run experience.

**Acceptance criteria:**
- After first sign-up, a 3-step wizard collects: name, daily kcal target, dietary preferences (veg / vegan / non-veg), city / season context.
- Wizard pre-populates targets and hides season-inappropriate options.
- Can be skipped and revisited via Settings.
- Progress is saved after each step so abandonment doesn't lose data.

---

## M2 — Core Planning

### FEAT-006 · Weekly planner view
**Priority:** P0 · **Size:** L

Users plan multiple days, not just today. Need a 7-day grid.

**Acceptance criteria:**
- Week grid shows Mon–Sun with a compact summary per day (total kcal, slots filled).
- Clicking a day loads that day's plan in the existing slot panel.
- "Copy from yesterday" button populates the current day with the previous day's picks.
- Days in the past are read-only (viewable, not editable).
- Navigating weeks (prev/next) works without page reload.

---

### FEAT-007 · Constraint enforcement engine
**Priority:** P1 · **Size:** M

Rules like "soya max 4×/week, never 2 consecutive days" are currently just text reminders — they aren't enforced. Users violate them unknowingly.

**Acceptance criteria:**
- When a user picks a soya option, the app checks the current week's soya count and yesterday's pick.
- If the constraint would be violated, show a non-blocking warning on the card (not a hard block).
- Constraint violations are summarised in the Summary panel with a badge count.
- Paneer, chaas/chana alternation, and bajra seasonality are all enforced the same way.
- Constraints are driven by data (configurable per user), not hardcoded.

---

### FEAT-008 · Grocery list generation
**Priority:** P1 · **Size:** M

A filled weekly plan contains all the information needed to produce a shopping list. Users currently re-derive this manually.

**Acceptance criteria:**
- "Generate grocery list" button appears when ≥ 3 days of the current week are planned.
- Output groups ingredients by category (grains, pulses, dairy, produce, pantry).
- Quantities are aggregated across the week (e.g. "oats: 350g").
- List is copyable as plain text and exportable as PDF.
- Users can check off items as they shop (state persists in localStorage / DB).

---

### FEAT-009 · Nutrition history & trends
**Priority:** P1 · **Size:** M

Users need to see whether their plan is working over time, not just for today.

**Acceptance criteria:**
- A "Trends" view shows a 4-week chart of daily kcal, protein, fibre.
- Bars are colour-coded: green = within target, amber = close, red = over/under.
- Hovering / tapping a bar shows that day's full plan summary.
- Data is derived from saved `day_plans` — no manual logging required.

---

### FEAT-010 · Plan templates
**Priority:** P2 · **Size:** S

Power users want to save and reuse proven day plans without re-picking every slot.

**Acceptance criteria:**
- "Save as template" action on any fully-picked day.
- Templates have a name and are listed on a Templates screen.
- "Apply template" one-click loads all picks into any empty day.
- Up to 10 templates per user; delete / rename supported.

---

## M3 — Personalisation

### FEAT-011 · User profile & custom targets
**Priority:** P1 · **Size:** M

Targets (1400–1500 kcal, 65–80g protein) are hardcoded. Every user has different needs.

**Acceptance criteria:**
- Settings page lets users update: name, daily kcal range, protein range, fibre range, dietary tags, city, season override.
- Changes immediately update all UI targets and macro bar ranges.
- Header subtitle reflects the user's actual targets, not hardcoded values.
- Targets validated: kcal 1000–3500, protein 40–200g, fibre 15–60g.

---

### FEAT-012 · Custom meal option creation
**Priority:** P1 · **Size:** M

Users want to add their own meals that aren't in the global database.

**Acceptance criteria:**
- "Add custom meal" button on each slot panel.
- Form collects: name, description, macros (p/f/c/kcal), tags, slot assignment.
- Custom meals appear in the options list with a "custom" tag and edit/delete controls.
- Custom meals are private to the user.
- Macro validation: warn if kcal is implausible vs. p/f/c.

---

### FEAT-013 · Smart meal suggestions
**Priority:** P2 · **Size:** L

As picks are made, the app can surface the best remaining options for unfilled slots to hit the day's macro targets.

**Acceptance criteria:**
- "Suggest" button per unfilled slot recommends 1–3 options that bring the running total closest to targets.
- Suggestions respect active constraints (e.g. won't suggest soya if already used today).
- Suggestions are dismissible and don't replace manual picks.
- Algorithm is simple linear scoring; no ML required in v1.

---

### FEAT-014 · Seasonal menu automation
**Priority:** P2 · **Size:** S

Currently season-inappropriate options (e.g. bajra roti in summer) are visible but flagged by text. They should be auto-hidden or de-prioritised by season.

**Acceptance criteria:**
- User's city + current month determines the active season (summer Apr–Jun, monsoon Jul–Sep, winter Oct–Mar for North India defaults).
- Out-of-season options are hidden by default with an "Show all" toggle to reveal them.
- Season can be manually overridden in profile settings.

---

## M4 — Social & Growth

### FEAT-015 · Shareable plan links
**Priority:** P2 · **Size:** S

Users want to share their day or week plan with family members, doctors, or nutritionists.

**Acceptance criteria:**
- "Share" action generates a read-only public link for the current day or week.
- Shared view shows all picks and macro summary but no edit controls.
- Link expires after 7 days (configurable).
- User can revoke a shared link at any time.

---

### FEAT-016 · Nutritionist / coach review mode
**Priority:** P2 · **Size:** M

Nutritionists reviewing a client's plan need to annotate and suggest changes without editing the client's data.

**Acceptance criteria:**
- A nutritionist can be invited via email to access a user's plan in review mode.
- Review mode allows adding comments per meal slot (text only, v1).
- Comments are visible to the user with timestamps.
- User can mark comments as resolved.
- Nutritionist cannot directly edit the user's picks.

---

### FEAT-017 · Export to image / PDF
**Priority:** P3 · **Size:** S

Users want a shareable, printable summary of the day or week plan.

**Acceptance criteria:**
- "Export" button generates a clean, branded PNG of the day's picks + macro summary.
- PDF version includes the full week plan with grocery list on the last page.
- Export uses html-to-canvas or a server-side rendering approach; no external image APIs.

---

## M5 — Scale & Ops

### FEAT-018 · Progressive Web App (PWA)
**Priority:** P2 · **Size:** M

Users on mobile should be able to install the app and access their plan offline.

**Acceptance criteria:**
- Service worker caches the app shell and the user's last 7 days of plan data.
- Offline edits are queued and synced when connectivity returns.
- "Add to home screen" prompt appears after 3rd visit.
- App works fully in airplane mode for viewing and editing cached plans.

---

### FEAT-019 · Error monitoring & observability
**Priority:** P3 · **Size:** S · **Status:** Deferred — not needed yet

Deferred until the app has meaningful production traffic. React error boundary is still worth adding (no external dependency).

---

### FEAT-020 · Admin panel
**Priority:** P2 · **Size:** M

Needed for managing global meal options, reviewing users, and operational tasks.

**Acceptance criteria:**
- Admin role (set in DB) unlocks an `/admin` route.
- Admin can create / edit / delete global meal options.
- Admin can view aggregated usage stats (DAU, plans created per day, most-picked meals).
- Admin cannot see individual user's meal picks (privacy).

---

### FEAT-021 · Analytics instrumentation
**Priority:** P3 · **Size:** S · **Status:** Deferred — not needed yet

Deferred until there are enough users to make the data meaningful.

---

### FEAT-022 · Multi-tenancy & billing (future)
**Priority:** P3 · **Size:** XL

If the product grows to serve nutritionists managing multiple clients, a workspace / subscription model is needed.

**Scope (v1 design only, not implementation):**
- Workspace owns multiple user accounts.
- Nutritionist role can manage plans for all workspace members.
- Free tier: 1 user, 7-day history, no sharing.
- Pro tier: unlimited history, sharing, trends, grocery list.
- Stripe integration for subscription management.

---

## Tech Debt & Infrastructure

| ID | Item | Priority |
|----|------|----------|
| TD-001 | Replace inline styles with a CSS-in-JS solution (styled-components or Tailwind) | P2 |
| TD-002 | Extract hardcoded colour values into a design token file | P1 |
| TD-003 | Add Vitest unit tests for macro calculation logic | P1 |
| TD-004 | Add Playwright E2E tests for the pick → summary flow | P2 |
| TD-005 | Set up CI/CD pipeline (GitHub Actions → Vercel preview → prod) | P1 |
| TD-006 | Environment variable management (`.env.example`, secrets in Vercel) | P0 |
| TD-007 | i18n scaffolding for Hindi localisation | P3 |

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-09 | Supabase chosen as backend | Postgres + RLS + realtime; zero infra ops for early stage |
| 2026-05-09 | Clerk chosen for auth (not Supabase Auth) | Better DX, pre-built UI components, Google OAuth, works cleanly with Supabase RLS via JWT |
| 2026-05-09 | Persistence goes direct to Supabase in M1 (no localStorage step) | Clerk is being set up anyway; skip the localStorage interim step |
| 2026-05-09 | Constraint engine is advisory (warnings), not blocking | Hard blocks create frustration; warnings educate without removing agency |
| 2026-05-09 | No ML for suggestions in v1 | Linear scoring is good enough and auditable; revisit if suggestions adoption > 30% |
| 2026-05-09 | Monitoring (Sentry) and analytics (PostHog) deferred | Not needed until meaningful traffic; revisit at M4 |
