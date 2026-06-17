// ─── Shared ──────────────────────────────────────────────────────────────────
export { PLANS, PLAN_ALIASES } from './plans.js'
export type { Plan } from './plans.js'

// ─── Stripe (fiat card subscriptions) ────────────────────────────────────────
export { stripe, getStripe } from './stripe/index.js'

// ─── NOWPayments (crypto subscriptions) ──────────────────────────────────────
export {
  NowPaymentsClient,
  NowPaymentsError,
  getNowPayments,
  isPaidStatus,
} from './nowpayments/index.js'
export type {
  NowPaymentsConfig,
  PaymentStatus,
  CreatePaymentParams,
  Payment,
  CreateInvoiceParams,
  Invoice,
  CreateSubscriptionPlanParams,
  SubscriptionPlan,
  CreateSubscriptionParams,
  Subscription,
  IpnPayload,
} from './nowpayments/types.js'
