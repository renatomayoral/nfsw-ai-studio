// ─── NOWPayments API types ───────────────────────────────────────────────────
// Reference: https://documenter.getpostman.com/view/7907941/2s93JusNJt
// Base URL: https://api.nowpayments.io/v1

export type NowPaymentsConfig = {
  /** API key from the NOWPayments dashboard (Store settings). */
  apiKey: string
  /** IPN secret used to verify webhook (callback) signatures. */
  ipnSecret?: string
  /** Override the base URL (e.g. sandbox: https://api-sandbox.nowpayments.io/v1). */
  baseUrl?: string
}

// Lifecycle of a crypto payment. `finished` = settled to the merchant wallet.
export type PaymentStatus =
  | 'waiting'
  | 'confirming'
  | 'confirmed'
  | 'sending'
  | 'partially_paid'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'expired'

// ─── Payments ────────────────────────────────────────────────────────────────

export type CreatePaymentParams = {
  /** Amount in fiat (price_currency) that the customer should pay. */
  priceAmount: number
  /** Fiat currency the price is denominated in, e.g. 'usd'. */
  priceCurrency: string
  /** Crypto the customer pays with, e.g. 'btc', 'usdttrc20'. */
  payCurrency: string
  /** Your internal reference (creator/subscription id). */
  orderId?: string
  orderDescription?: string
  /** Where NOWPayments POSTs IPN status updates. */
  ipnCallbackUrl?: string
}

export type Payment = {
  payment_id: string
  payment_status: PaymentStatus
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string | null
  order_description: string | null
  created_at: string
  updated_at: string
}

// ─── Invoices (hosted checkout page) ─────────────────────────────────────────

export type CreateInvoiceParams = {
  priceAmount: number
  priceCurrency: string
  orderId?: string
  orderDescription?: string
  /** Customer is sent here after paying. */
  successUrl?: string
  /** Customer is sent here if they cancel. */
  cancelUrl?: string
  ipnCallbackUrl?: string
}

export type Invoice = {
  id: string
  order_id: string | null
  order_description: string | null
  price_amount: string
  price_currency: string
  /** Hosted page the customer is redirected to. */
  invoice_url: string
  created_at: string
}

// ─── Subscriptions (recurring) ───────────────────────────────────────────────
// NOTE: crypto recurring works on a pre-funded balance model — the customer
// keeps a balance and each cycle is debited from it. When the balance runs out
// the customer must top up again (no card-style silent auto-debit exists).

export type IntervalDay = number // billing period length in days (e.g. 30)

export type CreateSubscriptionPlanParams = {
  title: string
  intervalDay: IntervalDay
  amount: number
  currency: string
  ipnCallbackUrl?: string
  /** Days before expiry to send a renewal reminder email. */
  partiallyPaidReminderDays?: number
}

export type SubscriptionPlan = {
  id: string
  title: string
  interval_day: number
  amount: number
  currency: string
  created_at: string
  updated_at: string
}

export type CreateSubscriptionParams = {
  /** Plan the customer is subscribed to. */
  subscriptionPlanId: string
  /** Customer email — NOWPayments emails the payment/top-up link. */
  email: string
  orderId?: string
  orderDescription?: string
}

export type Subscription = {
  id: string
  subscription_plan_id: string
  status: string
  email: string
  created_at: string
  expire_date: string | null
}

// ─── IPN (webhook) payload ───────────────────────────────────────────────────

export type IpnPayload = {
  payment_id: string
  payment_status: PaymentStatus
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid: number
  pay_currency: string
  order_id: string | null
  order_description: string | null
  purchase_id: string
  outcome_amount: number
  outcome_currency: string
}
