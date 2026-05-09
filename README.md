# 🥗 Meal Planner — Personalised Vegetarian

A React app for building your daily meal plan from a curated options library.
Tracks protein, fibre, carbs and calories against personalised targets.

## Features
- 6 meal slots with multiple options each
- Filter by tag (cooling, summer, soya, paneer, sattu, fibre, quick...)
- Live macro tracking with visual progress bars
- Weekly constraint reminders (soya alternating, paneer cap, chaas/chana rotation)
- Gurgaon summer-aware (cooling foods flagged, bajra warning)
- Fully responsive

## Deploy to Vercel (3 steps)

### Step 1 — Push to GitHub
```bash
cd meal-planner
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/meal-planner.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to https://vercel.com and sign in (free account works)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"** → select `meal-planner`
4. Vercel auto-detects Vite — leave all settings as default
5. Click **"Deploy"** — takes about 30 seconds

Your app is live at `https://meal-planner-xxx.vercel.app`

### Step 3 — Custom domain (optional)
Vercel dashboard → Your Project → Settings → Domains → Add domain

## Local development
```bash
npm install
npm run dev        # runs at http://localhost:5173
```

## Tech stack
- React 19 + Vite 8
- No CSS framework — inline styles only (zero dependencies beyond React)
- Vercel for hosting (free tier is sufficient)
