import { createHmac } from 'node:crypto'
import type {
  NowPaymentsConfig,
  CreatePaymentParams,
  Payment,
  CreateInvoiceParams,
  Invoice,
  CreateSubscriptionPlanParams,
  SubscriptionPlan,
  CreateSubscriptionParams,
  Subscription,
  PaymentStatus,
  IpnPayload,
} from './types'

const DEFAULT_BASE_URL = 'https://api.nowpayments.io/v1'

export class NowPaymentsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message)
    this.name = 'NowPaymentsError'
  }
}

export class NowPaymentsClient {
  private readonly apiKey: string
  private readonly ipnSecret: string | undefined
  private readonly baseUrl: string

  constructor(config: NowPaymentsConfig) {
    if (!config.apiKey) throw new Error('NowPaymentsClient: apiKey is required')
    this.apiKey = config.apiKey
    this.ipnSecret = config.ipnSecret
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await res.text()
    const data = text ? JSON.parse(text) : null

    if (!res.ok) {
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as { message: unknown }).message)
          : `NOWPayments ${method} ${path} failed`
      throw new NowPaymentsError(msg, res.status, data)
    }
    return data as T
  }

  /** Liveness check — returns true when the API is up. */
  async status(): Promise<boolean> {
    const data = await this.request<{ message: string }>('GET', '/status')
    return data.message === 'OK'
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    return this.request<Payment>('POST', '/payment', {
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      pay_currency: params.payCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: params.ipnCallbackUrl,
    })
  }

  async getPaymentStatus(paymentId: string): Promise<Payment> {
    return this.request<Payment>('GET', `/payment/${paymentId}`)
  }

  // ─── Invoices (hosted checkout) ──────────────────────────────────────────────

  async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    return this.request<Invoice>('POST', '/invoice', {
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ipn_callback_url: params.ipnCallbackUrl,
    })
  }

  // ─── Subscriptions (recurring) ───────────────────────────────────────────────

  async createSubscriptionPlan(params: CreateSubscriptionPlanParams): Promise<SubscriptionPlan> {
    return this.request<SubscriptionPlan>('POST', '/subscriptions/plans', {
      title: params.title,
      interval_day: params.intervalDay,
      amount: params.amount,
      currency: params.currency,
      ipn_callback_url: params.ipnCallbackUrl,
      partially_paid_reminder_days: params.partiallyPaidReminderDays,
    })
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    const data = await this.request<{ result: SubscriptionPlan }>(
      'GET',
      `/subscriptions/plans/${planId}`,
    )
    return data.result
  }

  /** Creates a subscription and emails the customer the payment link. */
  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription[]> {
    const data = await this.request<{ result: Subscription[] }>('POST', '/subscriptions', {
      subscription_plan_id: params.subscriptionPlanId,
      email: params.email,
      order_id: params.orderId,
      order_description: params.orderDescription,
    })
    return data.result
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const data = await this.request<{ result: Subscription }>(
      'GET',
      `/subscriptions/${subscriptionId}`,
    )
    return data.result
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.request<unknown>('DELETE', `/subscriptions/${subscriptionId}`)
  }

  // ─── IPN signature verification ──────────────────────────────────────────────

  /**
   * Verifies the `x-nowpayments-sig` header against the raw IPN body.
   *
   * NOWPayments signs an HMAC-SHA512 of the JSON payload with its keys sorted
   * alphabetically — passing the raw request string verbatim will NOT match.
   */
  verifyIpnSignature(payload: Record<string, unknown>, signature: string): boolean {
    if (!this.ipnSecret) throw new Error('NowPaymentsClient: ipnSecret is required to verify IPN')
    const sorted = sortObjectKeys(payload)
    const hmac = createHmac('sha512', this.ipnSecret)
    hmac.update(JSON.stringify(sorted))
    const digest = hmac.digest('hex')
    return timingSafeEqualHex(digest, signature)
  }

  parseIpn(payload: Record<string, unknown>): IpnPayload {
    return payload as unknown as IpnPayload
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Statuses that mean the money has settled and access should be granted.
const PAID_STATUSES: ReadonlySet<PaymentStatus> = new Set(['confirmed', 'finished'])

export function isPaidStatus(status: PaymentStatus): boolean {
  return PAID_STATUSES.has(status)
}

function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = obj[key]
      acc[key] =
        value && typeof value === 'object' && !Array.isArray(value)
          ? sortObjectKeys(value as Record<string, unknown>)
          : value
      return acc
    }, {})
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

// Lazy singleton mirroring the Stripe export style.
let _client: NowPaymentsClient | null = null

export function getNowPayments(): NowPaymentsClient {
  if (_client) return _client
  const apiKey = process.env['NOWPAYMENTS_API_KEY']
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY is not set')
  _client = new NowPaymentsClient({
    apiKey,
    ipnSecret: process.env['NOWPAYMENTS_IPN_SECRET'],
  })
  return _client
}
