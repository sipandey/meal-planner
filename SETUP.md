# Setup Guide — Meal Planner (M1)

## Prerequisites
- Node.js 20+
- A [Clerk](https://clerk.com) account
- A [Supabase](https://supabase.com) account

---

## 1. Clone & install

```bash
git clone https://github.com/sipandey/meal-planner.git
cd meal-planner
npm install
```

---

## 2. Create a Clerk application

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application**
2. Enable **Email** and **Google** sign-in methods
3. Copy the **Publishable Key** (starts with `pk_test_...`)

---

## 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Once created, go to **Settings → API** and copy:
   - **Project URL** (`https://xxx.supabase.co`)
   - **anon / public key**
3. Run the schema — paste the contents of `supabase/schema.sql` into **SQL Editor → New query → Run**

---

## 4. Connect Clerk JWT to Supabase

This lets Supabase RLS policies read the Clerk user ID from the JWT.

1. In **Supabase → Settings → API → JWT Settings**, copy the **JWT Secret**
2. In **Clerk → Configure → JWT Templates → New template**:
   - Name it exactly **`supabase`**
   - Set the signing algorithm to **HS256**
   - Paste the Supabase JWT Secret
   - Add this claim:
     ```json
     {
       "role": "authenticated"
     }
     ```
3. Save the template — Clerk will now issue tokens that Supabase accepts

---

## 5. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 6. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 7. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the three env vars in **Project Settings → Environment Variables**:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. In **Clerk → Configure → Domains**, add your Vercel production URL as an allowed origin

---

## Architecture at a glance

```
Browser
  └─ ClerkProvider          (auth session, JWT)
       └─ QueryClientProvider (TanStack Query cache)
            └─ RouterProvider
                 ├─ /sign-in   → SignInPage (Clerk hosted UI)
                 ├─ /sign-up   → SignUpPage
                 └─ /          → ProtectedRoute → App
                                    └─ useDayPlan()
                                         ├─ reads: Supabase day_plans (with Clerk JWT)
                                         └─ writes: upsert on every pick (optimistic)
```

## Key files

| File | Purpose |
|------|---------|
| `src/Root.tsx` | Provider tree root |
| `src/router.tsx` | Route definitions |
| `src/pages/ProtectedRoute.tsx` | Redirects unauthenticated users to /sign-in |
| `src/hooks/useDayPlan.ts` | Load + save today's plan from Supabase |
| `src/hooks/useSupabase.ts` | Authenticated Supabase client per request |
| `src/lib/supabase.ts` | Supabase client factory + TypeScript types |
| `src/lib/queryClient.ts` | TanStack Query configuration |
| `supabase/schema.sql` | Full DB schema with RLS policies |
