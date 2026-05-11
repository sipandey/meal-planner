-- =============================================================
-- Migration 001 — Health Profile Fields
-- Adds condition tracking, body metrics, and goal to profiles.
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- =============================================================

alter table profiles
  -- Health conditions array — IDs match ConditionId in conditions.ts
  add column if not exists conditions        text[]  not null default '{}',

  -- Body metrics (optional — used for macro target calculation)
  add column if not exists age               int,
  add column if not exists weight_kg         numeric(5,1),
  add column if not exists height_cm         int,
  add column if not exists gender            text
    check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),

  -- Activity & goal
  add column if not exists activity_level    text not null default 'light'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  add column if not exists goal              text not null default 'maintain'
    check (goal in ('manage_condition', 'lose_weight', 'maintain', 'build_muscle')),

  -- Cooking context
  add column if not exists cooking_for       text not null default 'self'
    check (cooking_for in ('self', 'couple', 'family')),

  -- City for seasonal intelligence (was already there — keep as-is)
  -- diet was already there — keep as-is

  -- Remove hardcoded targets (now computed from profile)
  -- NOTE: drop these only after verifying no existing data depends on them.
  -- Uncomment when ready:
  -- drop column if exists kcal_min,
  -- drop column if exists kcal_max,
  -- drop column if exists protein_min,
  -- drop column if exists protein_max,
  -- drop column if exists fibre_min,
  -- drop column if exists fibre_max,

  -- Region for regional cuisine intelligence (M3)
  add column if not exists region            text not null default 'north_indian'
    check (region in ('north_indian', 'south_indian', 'gujarati', 'bengali', 'maharashtrian', 'other'));
