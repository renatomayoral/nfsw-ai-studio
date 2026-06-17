export type Plan = {
  priceId: string | undefined
  /** Monthly price in USD cents */
  amount: number
  /** Annual price in USD cents (per month) */
  amountAnnual: number
  label: string
  description: string
}

// ─── Plan definitions — prices aligned with market research ──────────────────
// Spark $12/mo · Creator $39/mo · Pro $99/mo
// Annual = 20% discount: Spark $9.60 · Creator $31.20 · Pro $79.20

export const PLANS: Record<string, Plan> = {
  spark: {
    priceId: process.env['STRIPE_PRICE_SPARK'],
    amount: 1200,       // $12.00
    amountAnnual: 960,  // $9.60
    label: 'Spark',
    description: 'Para criadores que estão começando. Imagens ilimitadas, 5 vídeos/dia.',
  },
  creator: {
    priceId: process.env['STRIPE_PRICE_CREATOR'],
    amount: 3900,         // $39.00
    amountAnnual: 3120,   // $31.20
    label: 'Creator',
    description: 'Para criadores profissionais. I2V, LoRA, 20 vídeos/dia.',
  },
  pro: {
    priceId: process.env['STRIPE_PRICE_PRO'],
    amount: 9900,         // $99.00
    amountAnnual: 7920,   // $79.20
    label: 'Pro',
    description: 'Para volume alto e estúdios. API, LoRA training, 60 vídeos/dia.',
  },
}

// ─── Legacy plan name aliases (backward compat for existing subscriptions) ───
export const PLAN_ALIASES: Record<string, string> = {
  starter: 'spark',
  studio: 'pro',
}
