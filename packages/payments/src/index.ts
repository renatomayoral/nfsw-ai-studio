// ─── Shared ──────────────────────────────────────────────────────────────────
export { PLANS, PLAN_ALIASES, TAKE_RATE_BPS, takeRatePercent } from './plans.js'
export type { Plan } from './plans.js'

// ─── Stripe (fiat card subscriptions) ────────────────────────────────────────
export { stripe, getStripe } from './stripe/index.js'
export type { default as Stripe } from 'stripe'
export {
  createConnectedAccount,
  createOnboardingLink,
  isAccountReady,
  createDashboardLink,
  createVipPrice,
  archiveVipPrice,
  createSubscriptionCheckout,
} from './stripe/connect.js'
export type {
  CreateConnectedAccountParams,
  OnboardingLinkParams,
  CreateVipPriceParams,
  SubscriptionCheckoutParams,
} from './stripe/connect.js'
export {
  constructWebhookEvent,
  ACCESS_GRANTING_EVENTS,
  ACCESS_REVOKING_EVENTS,
} from './stripe/webhook.js'

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
