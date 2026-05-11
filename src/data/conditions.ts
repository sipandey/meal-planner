/**
 * conditions.ts — Core IP of Aahar
 *
 * Every condition maps to a set of food rules grounded in clinical evidence
 * and expressed in Indian kitchen terms. This is the bidirectional mapping
 * the product vision calls the "Condition → Kitchen Engine".
 *
 * Rules are advisory, never blocking. Each rule carries:
 *   - text: plain language for the user
 *   - rationale: the clinical why (shown on tap)
 *   - check logic (evaluated in useConstraints.ts)
 */

export type ConditionId =
  | 'high_ldl'
  | 'type2_diabetes'
  | 'pcos'
  | 'hypothyroid'
  | 'hypertension'
  | 'high_uric_acid'
  | 'weight_loss'
  | 'muscle_gain'
  | 'post_partum'

export type RuleType =
  | 'require_daily'        // must appear every day
  | 'max_per_week'         // cap on weekly frequency
  | 'no_consecutive_days'  // can't appear on back-to-back days
  | 'avoid_combination'    // two ingredients shouldn't be on the same day
  | 'season_only'          // only available in specific seasons
  | 'fibre_target'         // elevated fibre requirement
  | 'carb_ceiling'         // hard carb limit (diabetics)
  | 'avoid_tag'            // avoid meals with a certain tag

export interface FoodRule {
  id: string
  conditionId: ConditionId
  text: string          // shown in the UI — plain language, Indian context
  rationale: string     // clinical reasoning — shown when user taps the rule
  type: RuleType
  tag?: string          // meal tag this rule targets (from TAG_META)
  maxPerWeek?: number
  noConsecutiveDays?: boolean
  avoidWith?: string[]  // tag IDs that shouldn't coexist on the same day
  seasons?: string[]    // which seasons this applies to
  severity: 'hard' | 'soft'   // hard = red warning, soft = amber advisory
}

export interface Condition {
  id: ConditionId
  label: string                 // short name shown in the UI
  description: string           // one-line plain language for onboarding
  detailText: string            // longer explanation shown in condition detail
  icon: string
  rules: FoodRule[]
  macroAdjustments: {
    proteinMultiplier?: number  // multiply base protein target
    fibreBonus?: number         // add grams to base fibre target
    carbCeilingG?: number       // absolute carb ceiling (null = no ceiling)
    kcalAdjustment?: number     // add/subtract from TDEE
  }
}

export const CONDITIONS: Record<ConditionId, Condition> = {

  // ─── High LDL / Cholesterol ───────────────────────────────────────
  high_ldl: {
    id: 'high_ldl',
    label: 'High Cholesterol / LDL',
    icon: '🫀',
    description: 'Your plan will prioritise LDL-lowering foods and limit saturated fat.',
    detailText:
      'LDL ("bad") cholesterol is managed through soluble fibre, omega-3 fatty acids, ' +
      'and limiting saturated fat. Indian foods like walnuts, flaxseed, oats, and dal ' +
      'are highly effective — when used consistently and in the right combinations.',
    rules: [
      {
        id: 'walnuts_daily',
        conditionId: 'high_ldl',
        text: 'Walnuts (4 halves) every day — your daily LDL-lowering dose',
        rationale:
          'Walnuts are the highest plant source of ALA omega-3. 4 halves daily is the ' +
          'clinically validated dose that reduces LDL by 5–10% over 6 weeks. This is non-negotiable.',
        type: 'require_daily',
        tag: 'walnuts',
        severity: 'hard',
      },
      {
        id: 'flaxseed_daily',
        conditionId: 'high_ldl',
        text: '1 tbsp ground flaxseed in atta (or curd) every day',
        rationale:
          'Ground flaxseed provides lignans and ALA. Soluble fibre in flaxseed binds ' +
          'bile acids, forcing the liver to use LDL cholesterol to make new bile. ' +
          '1 tbsp daily = ~2.4g ALA + 3g soluble fibre.',
        type: 'require_daily',
        tag: 'flaxseed',
        severity: 'soft',
      },
      {
        id: 'soya_frequency',
        conditionId: 'high_ldl',
        text: 'Soya max 4×/week — never on 2 consecutive days',
        rationale:
          'Soya protein reduces LDL, but excess phytoestrogens from daily consumption ' +
          'may affect thyroid function. 4×/week is the evidence-based sweet spot. ' +
          'Spacing prevents adaptation and maintains gut microbiome diversity.',
        type: 'max_per_week',
        tag: 'soya',
        maxPerWeek: 4,
        noConsecutiveDays: true,
        severity: 'hard',
      },
      {
        id: 'paneer_frequency',
        conditionId: 'high_ldl',
        text: 'Paneer max 2×/week — low-fat only, no cream ever',
        rationale:
          'Full-fat paneer is ~23g saturated fat per 100g — high LDL worsens with ' +
          'saturated fat. Low-fat paneer (7–9% fat) gives you the protein without ' +
          'the LDL impact. Cream has no place in a cholesterol-management plan.',
        type: 'max_per_week',
        tag: 'paneer',
        maxPerWeek: 2,
        severity: 'hard',
      },
      {
        id: 'oats_encouraged',
        conditionId: 'high_ldl',
        text: 'Oats or barley at least 3×/week (beta-glucan for LDL)',
        rationale:
          'Beta-glucan in oats is the most evidence-backed soluble fibre for LDL reduction. ' +
          '3g beta-glucan/day (achievable with 50g oats) reduces LDL by 5–8%. ' +
          'Consistent, not occasional.',
        type: 'max_per_week',
        tag: 'oats',
        severity: 'soft',
      },
    ],
    macroAdjustments: {
      fibreBonus: 5,        // +5g fibre over base target
      proteinMultiplier: 1.3,
    },
  },

  // ─── Type 2 Diabetes / Pre-diabetes ──────────────────────────────
  type2_diabetes: {
    id: 'type2_diabetes',
    label: 'Type 2 Diabetes / Pre-diabetes',
    icon: '🩸',
    description: 'Low-GI foods, timed meals, and balanced carbs across the day.',
    detailText:
      'Managing blood sugar through food is about the type of carbs, the sequence of eating, ' +
      'and consistent meal timing — not just avoiding sugar. Indian dals, vegetables, and ' +
      'traditional low-GI grains like jowar are powerful tools when used correctly.',
    rules: [
      {
        id: 'dal_before_roti',
        conditionId: 'type2_diabetes',
        text: 'Eat dal/sabzi before roti — always. Never roti first.',
        rationale:
          'Eating protein and fibre before carbs blunts the post-meal glucose spike by ' +
          '20–30%. This is one of the most evidence-backed dietary interventions for ' +
          'blood sugar management. Sequence matters as much as quantity.',
        type: 'require_daily',
        severity: 'hard',
      },
      {
        id: 'no_fruit_juice',
        conditionId: 'type2_diabetes',
        text: 'Whole fruit only — no juice, no smoothies',
        rationale:
          'Juicing removes fibre and concentrates fructose. A glass of orange juice spikes ' +
          'blood sugar faster than a soft drink. Whole fruit has intact fibre that slows glucose absorption.',
        type: 'avoid_tag',
        tag: 'juice',
        severity: 'hard',
      },
      {
        id: 'low_gi_grain',
        conditionId: 'type2_diabetes',
        text: 'Prefer jowar/bajra/ragi roti over maida — always',
        rationale:
          'Jowar (GI 55), bajra (GI 54), and ragi (GI 68) have significantly lower glycaemic ' +
          'index than wheat (GI 70+) and vastly lower than maida (GI 85+). Over months, ' +
          'this difference meaningfully impacts HbA1c.',
        type: 'require_daily',
        severity: 'soft',
      },
      {
        id: 'khichdi_high_sugar_days',
        conditionId: 'type2_diabetes',
        text: 'Moong dal khichdi on high-stress or high-heat days',
        rationale:
          'Stress and heat both raise cortisol, which raises blood sugar. Khichdi is the ' +
          'lowest GI complete meal in Indian cuisine — easy to digest, stabilises blood sugar, ' +
          'and requires minimal digestive effort.',
        type: 'season_only',
        seasons: ['summer'],
        severity: 'soft',
      },
    ],
    macroAdjustments: {
      fibreBonus: 8,           // significant fibre increase for glucose management
      carbCeilingG: 150,       // hard carb ceiling for diabetics
      proteinMultiplier: 1.4,
    },
  },

  // ─── PCOS ─────────────────────────────────────────────────────────
  pcos: {
    id: 'pcos',
    label: 'PCOS',
    icon: '⚖️',
    description: 'Anti-inflammatory foods, iron-rich dals, balanced carbs across the day.',
    detailText:
      'PCOS is driven by insulin resistance and low-grade inflammation. Indian cooking ' +
      'has powerful anti-inflammatory ingredients — turmeric, ginger, fenugreek — and ' +
      'iron-rich dals that address the anaemia common in PCOS. The plan avoids ' +
      'refined carbs and prioritises protein at every meal.',
    rules: [
      {
        id: 'iron_rich_dal',
        conditionId: 'pcos',
        text: 'Iron-rich dals (masoor, chana, rajma) at least 4×/week',
        rationale:
          'Iron deficiency is extremely common in PCOS due to heavy periods. Masoor dal ' +
          'has 3.3mg iron per 100g (cooked). Combining with vitamin C (lemon, tomato) ' +
          'doubles absorption. Plant iron (non-haem) requires consistency to build stores.',
        type: 'max_per_week',
        tag: 'iron_dal',
        severity: 'soft',
      },
      {
        id: 'anti_inflammatory',
        conditionId: 'pcos',
        text: 'Turmeric + ginger in at least one meal daily',
        rationale:
          'Curcumin (turmeric) reduces IL-6 and TNF-α — the inflammatory markers elevated ' +
          'in PCOS. Gingerol (ginger) improves insulin sensitivity. Both are in standard ' +
          'Indian cooking — this rule just ensures they appear at least once.',
        type: 'require_daily',
        severity: 'soft',
      },
      {
        id: 'no_refined_carbs',
        conditionId: 'pcos',
        text: 'No maida, no white rice as a main — whole grains always',
        rationale:
          'Refined carbs spike insulin rapidly. PCOS is fundamentally an insulin-resistance ' +
          'condition. Whole grains maintain slower glucose release and reduce androgen levels ' +
          'over time through lower insulin response.',
        type: 'avoid_tag',
        tag: 'refined_carb',
        severity: 'hard',
      },
    ],
    macroAdjustments: {
      proteinMultiplier: 1.6,  // high protein reduces androgen in PCOS
      fibreBonus: 6,
    },
  },

  // ─── Hypothyroidism ───────────────────────────────────────────────
  hypothyroid: {
    id: 'hypothyroid',
    label: 'Hypothyroidism',
    icon: '🦋',
    description: 'Selenium-rich foods, iodine from natural sources, cooked cruciferous only.',
    detailText:
      'Hypothyroidism slows metabolism and causes weight gain, fatigue, and iron deficiency. ' +
      'The Indian kitchen has excellent thyroid-supportive foods — curd for iodine, ' +
      'selenium from pumpkin seeds, and the simple rule of never eating raw cruciferous ' +
      'vegetables in the morning when thyroid medication is typically taken.',
    rules: [
      {
        id: 'no_raw_cruciferous_morning',
        conditionId: 'hypothyroid',
        text: 'Raw cabbage/broccoli/cauliflower not in morning — cooked is fine',
        rationale:
          'Raw cruciferous vegetables contain goitrogens that interfere with thyroid hormone ' +
          'synthesis and medication absorption. Cooking inactivates goitrogens. This is ' +
          'especially important in the morning when T4 medication is typically taken.',
        type: 'avoid_tag',
        tag: 'raw_cruciferous',
        severity: 'hard',
      },
      {
        id: 'selenium_weekly',
        conditionId: 'hypothyroid',
        text: 'Selenium-rich foods weekly (pumpkin seeds, sunflower seeds)',
        rationale:
          'Selenium is essential for converting T4 to active T3 — the form your cells actually use. ' +
          'Deficiency worsens hypothyroid symptoms even with medication. Pumpkin seeds ' +
          '(9.4 mcg/100g) are the most accessible Indian source.',
        type: 'max_per_week',
        severity: 'soft',
      },
      {
        id: 'curd_daily',
        conditionId: 'hypothyroid',
        text: 'Curd or dahi daily — natural iodine source',
        rationale:
          'Iodine deficiency is a primary cause of hypothyroidism. Curd provides ~8 mcg ' +
          'iodine per 100g — a meaningful contribution alongside iodised salt. ' +
          'Hung curd has higher protein but similar iodine.',
        type: 'require_daily',
        severity: 'soft',
      },
    ],
    macroAdjustments: {
      kcalAdjustment: -150,    // slower metabolism requires modest calorie reduction
      proteinMultiplier: 1.3,
    },
  },

  // ─── Hypertension ─────────────────────────────────────────────────
  hypertension: {
    id: 'hypertension',
    label: 'High Blood Pressure',
    icon: '💢',
    description: 'Low sodium, potassium-rich foods, and the DASH approach adapted for Indian cooking.',
    detailText:
      'Hypertension management through food follows the DASH principle — reduce sodium, ' +
      'increase potassium, calcium, and magnesium. Indian cooking has an edge here: ' +
      'dal, banana, sweet potato, and curd are all high in potassium. The challenge ' +
      'is sodium from achaar, papad, and processed foods.',
    rules: [
      {
        id: 'limit_pickle',
        conditionId: 'hypertension',
        text: 'Achaar / pickle max 1× per week — one teaspoon only',
        rationale:
          'Traditional Indian pickles contain 1500–2000mg sodium per 100g. One small serving ' +
          'can be 300–400mg sodium — 15–20% of the daily limit for hypertensives (2000mg/day). ' +
          'This is one of the highest-impact dietary changes for BP management in India.',
        type: 'max_per_week',
        tag: 'pickle',
        maxPerWeek: 1,
        severity: 'hard',
      },
      {
        id: 'potassium_foods',
        conditionId: 'hypertension',
        text: 'Potassium-rich foods daily: banana, sweet potato, dal, or curd',
        rationale:
          'Potassium directly counteracts sodium\'s effect on blood pressure. ' +
          '3500mg potassium/day is the target. Dal (moong, masoor) provides ~600mg per katori. ' +
          'Banana adds ~350mg. This is achievable through standard Indian food.',
        type: 'require_daily',
        severity: 'soft',
      },
      {
        id: 'no_papad_daily',
        conditionId: 'hypertension',
        text: 'No papad, namkeen, or packaged snacks — high hidden sodium',
        rationale:
          'A single papad has 300–500mg sodium. Namkeen and packaged bhujia can have ' +
          '800mg+ per serving. These silent sodium sources are why BP remains uncontrolled ' +
          'despite "healthy" eating. Roasted chana is the safe snack.',
        type: 'avoid_tag',
        tag: 'high_sodium',
        severity: 'hard',
      },
    ],
    macroAdjustments: {
      fibreBonus: 4,
    },
  },

  // ─── High Uric Acid / Gout ────────────────────────────────────────
  high_uric_acid: {
    id: 'high_uric_acid',
    label: 'High Uric Acid / Gout',
    icon: '🦵',
    description: 'Limit high-purine foods, separate spinach from protein dals, stay hydrated.',
    detailText:
      'Uric acid is produced when purines break down. High-purine foods — especially ' +
      'rajma, masoor dal, and spinach in large quantities — raise uric acid. ' +
      'The Indian kitchen fix: lighter dals like moong and chana, cooling vegetables, ' +
      'and cherry/amla for uric acid excretion.',
    rules: [
      {
        id: 'no_spinach_with_protein_dal',
        conditionId: 'high_uric_acid',
        text: 'Spinach and protein dal (rajma/masoor) never on the same day',
        rationale:
          'Spinach is high in oxalates AND purines. Combined with high-purine rajma or masoor, ' +
          'this doubles the uric acid load. On palak days, have moong dal. On rajma days, ' +
          'have low-purine vegetables (lauki, tinda, turai).',
        type: 'avoid_combination',
        avoidWith: ['spinach', 'rajma'],
        severity: 'hard',
      },
      {
        id: 'rajma_limit',
        conditionId: 'high_uric_acid',
        text: 'Rajma max 1×/week — high purine legume',
        rationale:
          'Rajma (kidney beans) are moderate-high purine (120–150mg/100g). During a gout flare, ' +
          'avoid completely. In maintenance, 1× per week is manageable for most people with ' +
          'adequate hydration.',
        type: 'max_per_week',
        tag: 'rajma',
        maxPerWeek: 1,
        severity: 'hard',
      },
      {
        id: 'amla_or_lemon_daily',
        conditionId: 'high_uric_acid',
        text: 'Amla, lemon, or kokum daily — vitamin C enhances uric acid excretion',
        rationale:
          'Vitamin C increases renal uric acid excretion. 500mg/day reduces serum uric acid ' +
          'by ~0.5mg/dL. One amla = 600mg vitamin C. Lemon in water/food achieves 50–100mg. ' +
          'Consistent, not occasional.',
        type: 'require_daily',
        severity: 'soft',
      },
      {
        id: 'high_hydration',
        conditionId: 'high_uric_acid',
        text: '3+ litres water daily — dilutes uric acid, prevents crystals',
        rationale:
          'Adequate hydration is the single most effective uric acid intervention. ' +
          'Concentrated urine crystallises urate in joints. 3L daily prevents this. ' +
          'Coconut water and nimbu pani count — achaar brine does not.',
        type: 'require_daily',
        severity: 'hard',
      },
    ],
    macroAdjustments: {
      fibreBonus: 3,
    },
  },

  // ─── Weight Loss ──────────────────────────────────────────────────
  weight_loss: {
    id: 'weight_loss',
    label: 'Weight Loss',
    icon: '⚡',
    description: 'High protein, high fibre, caloric deficit — through satisfying Indian meals.',
    detailText:
      'Weight loss through Indian food works when protein is high (preserves muscle), ' +
      'fibre is high (reduces hunger), and the calorie deficit is modest (300–400 kcal). ' +
      'No starvation. No crash diets. Sustainable Indian meals that keep you full.',
    rules: [
      {
        id: 'protein_at_every_meal',
        conditionId: 'weight_loss',
        text: 'Every meal must have a protein source — dal, curd, soya, or paneer',
        rationale:
          'Protein has the highest satiety per calorie. Meals without protein lead to hunger ' +
          'in 1–2 hours and overconsumption later. Dal at breakfast, hung curd mid-morning, ' +
          'and protein at dinner is the framework.',
        type: 'require_daily',
        severity: 'soft',
      },
      {
        id: 'kachumber_before_lunch',
        conditionId: 'weight_loss',
        text: 'Eat kachumber salad before lunch — always. Reduces portion size.',
        rationale:
          'Eating 100–150g raw vegetable salad before a meal reduces the subsequent meal ' +
          'consumption by 10–15% without conscious effort. Over months, this creates ' +
          'a meaningful calorie deficit. Volume eating, not restriction.',
        type: 'require_daily',
        severity: 'soft',
      },
    ],
    macroAdjustments: {
      kcalAdjustment: -350,   // 350 kcal deficit for sustainable ~1.5kg/month loss
      proteinMultiplier: 1.6, // high protein for muscle preservation in deficit
      fibreBonus: 5,
    },
  },

  // ─── Muscle Gain ──────────────────────────────────────────────────
  muscle_gain: {
    id: 'muscle_gain',
    label: 'Muscle Gain / Bulking',
    icon: '💪',
    description: 'High protein, caloric surplus, protein distribution across all meals.',
    detailText:
      'Building muscle on Indian vegetarian food requires deliberate protein stacking: ' +
      'soya, hung curd, paneer, and dals at every meal. The total target is 1.8–2g protein ' +
      'per kg body weight — achievable without supplements if meals are planned correctly.',
    rules: [
      {
        id: 'protein_distribution',
        conditionId: 'muscle_gain',
        text: 'Minimum 20g protein per main meal — breakfast, lunch, dinner',
        rationale:
          'Muscle protein synthesis is maximised when protein is distributed evenly across ' +
          'meals rather than concentrated in one. 20g per meal is the minimum threshold for ' +
          'a meaningful anabolic stimulus.',
        type: 'require_daily',
        severity: 'hard',
      },
      {
        id: 'post_workout_protein',
        conditionId: 'muscle_gain',
        text: 'Hung curd or soya within 45 min after workout',
        rationale:
          'The post-exercise anabolic window is real, though not as narrow as once believed. ' +
          'A protein-rich meal within 45–60 min maximises muscle protein synthesis response. ' +
          'Hung curd (18g protein/100g) is the most convenient Indian post-workout food.',
        type: 'require_daily',
        severity: 'soft',
      },
    ],
    macroAdjustments: {
      kcalAdjustment: 350,     // surplus for muscle gain
      proteinMultiplier: 1.8,  // 1.8g/kg bodyweight
    },
  },

  // ─── Post-partum ──────────────────────────────────────────────────
  post_partum: {
    id: 'post_partum',
    label: 'Post-partum / Breastfeeding',
    icon: '🌸',
    description: 'Iron recovery, calcium for breastfeeding, and galactagogue foods.',
    detailText:
      'Post-partum nutrition has two jobs: recovery from delivery (iron, protein, zinc) ' +
      'and supporting breastfeeding (calcium, adequate calories, galactagogues). ' +
      'Indian traditional foods — methi ladoo, ajwain water, jeera dal, ' +
      'ghee in moderation — are evidence-adjacent and culturally right.',
    rules: [
      {
        id: 'iron_recovery',
        conditionId: 'post_partum',
        text: 'Iron-rich dals + vitamin C at every main meal',
        rationale:
          'Post-delivery blood loss depletes iron. Recovery requires 25–35mg iron/day ' +
          '(vs normal 18mg). Masoor dal (3.3mg/100g cooked) + lemon squeeze = optimal ' +
          'non-haem iron absorption. Takes 3–4 months to fully restore stores.',
        type: 'require_daily',
        severity: 'hard',
      },
      {
        id: 'calcium_for_milk',
        conditionId: 'post_partum',
        text: 'Dahi, paneer, or ragi daily — 1200mg calcium target',
        rationale:
          'Breastfeeding draws calcium from bones if dietary intake is insufficient. ' +
          '1200mg/day is the target. Dahi (125mg/100g) + paneer (480mg/100g) + ragi ' +
          '(344mg/100g) make this achievable through Indian food alone.',
        type: 'require_daily',
        severity: 'hard',
      },
      {
        id: 'galactagogues',
        conditionId: 'post_partum',
        text: 'Methi, ajwain, jeera, or dill in meals daily — support milk supply',
        rationale:
          'These are galactagogues — foods with historical and some clinical evidence for ' +
          'supporting milk production. Methi (fenugreek) is the most studied. Already present ' +
          'in standard Indian tempering — just ensure they appear daily.',
        type: 'require_daily',
        severity: 'soft',
      },
    ],
    macroAdjustments: {
      kcalAdjustment: 500,     // +500 kcal for breastfeeding
      proteinMultiplier: 1.5,
      fibreBonus: 4,
    },
  },
}

// ── Helpers ──────────────────────────────────────────────────────────

export function getRulesForConditions(conditionIds: ConditionId[]): FoodRule[] {
  return conditionIds.flatMap(id => CONDITIONS[id]?.rules ?? [])
}

export function getMacroAdjustments(conditionIds: ConditionId[]) {
  return conditionIds.reduce(
    (acc, id) => {
      const adj = CONDITIONS[id]?.macroAdjustments ?? {}
      return {
        proteinMultiplier: Math.max(acc.proteinMultiplier, adj.proteinMultiplier ?? 1),
        fibreBonus: acc.fibreBonus + (adj.fibreBonus ?? 0),
        carbCeilingG: adj.carbCeilingG
          ? Math.min(acc.carbCeilingG ?? Infinity, adj.carbCeilingG)
          : acc.carbCeilingG,
        kcalAdjustment: acc.kcalAdjustment + (adj.kcalAdjustment ?? 0),
      }
    },
    { proteinMultiplier: 1.2, fibreBonus: 0, carbCeilingG: undefined as number | undefined, kcalAdjustment: 0 },
  )
}

export const CONDITION_LIST = Object.values(CONDITIONS)
