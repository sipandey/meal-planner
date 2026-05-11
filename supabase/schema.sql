-- =============================================================
-- Meal Planner — Supabase Schema
-- Auth: Clerk (JWT). RLS policies read auth.jwt() ->> 'sub'
--       which maps to the Clerk user ID.
-- Run this in the Supabase SQL editor after:
--   1. Creating the Supabase project
--   2. Adding the Clerk JWT template in Supabase dashboard
--      (Settings > API > JWT Settings > JWKS URL from Clerk)
-- =============================================================

-- ─── Profiles ───────────────────────────────────────────────
-- One row per Clerk user. Created on first sign-in via the app.

create table if not exists profiles (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text unique not null,
  name            text,
  kcal_min        int  not null default 1300,
  kcal_max        int  not null default 1550,
  protein_min     int  not null default 65,
  protein_max     int  not null default 82,
  fibre_min       int  not null default 22,
  fibre_max       int  not null default 32,
  city            text not null default 'Gurgaon',
  diet            text not null default 'vegetarian'
                    check (diet in ('vegetarian', 'vegan', 'non-vegetarian')),
  onboarded       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: select own"
  on profiles for select
  using (clerk_user_id = auth.jwt() ->> 'sub');

create policy "profiles: insert own"
  on profiles for insert
  with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy "profiles: update own"
  on profiles for update
  using (clerk_user_id = auth.jwt() ->> 'sub');

-- ─── Day Plans ───────────────────────────────────────────────
-- One row per (user, date). picks is a JSON object keyed by
-- slot id, value is the option index (or null if unpicked).
-- Example: { "wakeup": 0, "bfast": 2, "lunch": null, ... }

create table if not exists day_plans (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  date            date not null,
  picks           jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (clerk_user_id, date)
);

alter table day_plans enable row level security;

create policy "day_plans: all own"
  on day_plans for all
  using (clerk_user_id = auth.jwt() ->> 'sub')
  with check (clerk_user_id = auth.jwt() ->> 'sub');

-- ─── Custom Meal Options ─────────────────────────────────────
-- User-created meals that supplement the global options in
-- the app's data.ts. clerk_user_id = null means global/system.

create table if not exists meal_options (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text,                    -- null = global option
  slot_id         text not null,           -- matches SLOTS[].id
  name            text not null,
  detail          text not null default '',
  protein         int  not null default 0, -- grams
  fibre           int  not null default 0,
  carbs           int  not null default 0,
  kcal            int  not null default 0,
  tags            text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table meal_options enable row level security;

-- Global options are readable by everyone authenticated.
create policy "meal_options: read global or own"
  on meal_options for select
  using (
    clerk_user_id is null
    or clerk_user_id = auth.jwt() ->> 'sub'
  );

create policy "meal_options: insert own"
  on meal_options for insert
  with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy "meal_options: update own"
  on meal_options for update
  using (clerk_user_id = auth.jwt() ->> 'sub');

create policy "meal_options: delete own"
  on meal_options for delete
  using (clerk_user_id = auth.jwt() ->> 'sub');

-- ─── updated_at trigger ──────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger day_plans_updated_at
  before update on day_plans
  for each row execute function set_updated_at();
