// ─── Plan tier names ───────────────────────────────────────────────────────────
export type PlanTier = 'anonymous' | 'free' | 'spark' | 'creator' | 'pro'

// ─── Per-plan limits ───────────────────────────────────────────────────────────
export type PlanLimits = {
  /** Fast-queue image generations per day (hard cap before slow queue) */
  imagesFastPerDay: number
  /** Fast-queue video generations per day (hard cap before slow queue) */
  videosFastPerDay: number
  /** Welcome video — one-time lifetime perk (only on 'free' tier) */
  welcomeVideoLifetime: boolean
  /** Max output resolution in pixels (width or height) */
  maxResolutionPx: number
  /** Output has watermark */
  watermark: boolean
  /** Image-to-video (I2V / Wan 2.2 I2V) */
  i2v: boolean
  /** Import custom LoRA weights */
  loraImport: boolean
  /** Train a new LoRA on the platform */
  loraTrain: boolean
  /** REST API access */
  api: boolean
  /** Concurrent API jobs allowed */
  apiConcurrentJobs: number
  /** History retention (days, 0 = no history, -1 = forever) */
  historyDays: number
}

// ─── Plan limit definitions ────────────────────────────────────────────────────
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  anonymous: {
    imagesFastPerDay: 5,
    videosFastPerDay: 0,
    welcomeVideoLifetime: false,
    maxResolutionPx: 512,
    watermark: true,
    i2v: false,
    loraImport: false,
    loraTrain: false,
    api: false,
    apiConcurrentJobs: 0,
    historyDays: 0,
  },
  free: {
    imagesFastPerDay: 20,
    videosFastPerDay: 0,
    welcomeVideoLifetime: true, // 1 video total, lifetime
    maxResolutionPx: 1024,
    watermark: true,
    i2v: false,
    loraImport: false,
    loraTrain: false,
    api: false,
    apiConcurrentJobs: 0,
    historyDays: 7,
  },
  spark: {
    imagesFastPerDay: 100,
    videosFastPerDay: 5,
    welcomeVideoLifetime: false,
    maxResolutionPx: 1024,
    watermark: false,
    i2v: false,
    loraImport: false,
    loraTrain: false,
    api: false,
    apiConcurrentJobs: 0,
    historyDays: 30,
  },
  creator: {
    imagesFastPerDay: 300,
    videosFastPerDay: 20,
    welcomeVideoLifetime: false,
    maxResolutionPx: 1280,
    watermark: false,
    i2v: true,
    loraImport: true,
    loraTrain: false,
    api: false,
    apiConcurrentJobs: 0,
    historyDays: -1,
  },
  pro: {
    imagesFastPerDay: 1000,
    videosFastPerDay: 60,
    welcomeVideoLifetime: false,
    maxResolutionPx: 1920,
    watermark: false,
    i2v: true,
    loraImport: true,
    loraTrain: true,
    api: true,
    apiConcurrentJobs: 5,
    historyDays: -1,
  },
}

// ─── Stripe plan name → PlanTier mapping ──────────────────────────────────────
// Maps the 'plan' string stored in the subscription table to our tier system.
export const STRIPE_PLAN_TO_TIER: Record<string, PlanTier> = {
  spark: 'spark',
  starter: 'spark',   // legacy name
  creator: 'creator',
  pro: 'pro',
  studio: 'pro',      // legacy name
  free: 'free',
}

// ─── Plan metadata (for UI) ────────────────────────────────────────────────────
export type PlanMeta = {
  tier: PlanTier
  label: string
  price: number       // USD/month
  priceAnnual: number // USD/month billed annually
  highlighted: boolean
  description: string
  cta: string
}

export const PLAN_META: Record<Exclude<PlanTier, 'anonymous'>, PlanMeta> = {
  free: {
    tier: 'free',
    label: 'Free',
    price: 0,
    priceAnnual: 0,
    highlighted: false,
    description: 'Experimente sem compromisso.',
    cta: 'Criar conta grátis',
  },
  spark: {
    tier: 'spark',
    label: 'Spark',
    price: 12,
    priceAnnual: 9.6,
    highlighted: false,
    description: 'Para criadores que estão começando.',
    cta: 'Assinar Spark',
  },
  creator: {
    tier: 'creator',
    label: 'Creator',
    price: 39,
    priceAnnual: 31.2,
    highlighted: true,
    description: 'O favorito de criadores profissionais.',
    cta: 'Assinar Creator',
  },
  pro: {
    tier: 'pro',
    label: 'Pro',
    price: 99,
    priceAnnual: 79.2,
    highlighted: false,
    description: 'Para volume alto, API e estúdios.',
    cta: 'Assinar Pro',
  },
}
