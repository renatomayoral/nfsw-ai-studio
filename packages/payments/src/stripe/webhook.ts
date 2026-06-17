import type Stripe from 'stripe'
import { getStripe } from './index'

/**
 * Verifies a Stripe webhook signature and returns the parsed event.
 *
 * Pass the RAW request body (string/Buffer) — not the parsed JSON — or
 * signature verification will fail.
 */
export function constructWebhookEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
  const secret = process.env['STRIPE_WEBHOOK_SECRET']
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  return getStripe().webhooks.constructEvent(rawBody, signature, secret)
}

// Events that affect a fan's access to a creator's VIP. Used by the webhook
// handler to decide whether to grant or revoke access.
export const ACCESS_GRANTING_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'invoice.paid',
] as const

export const ACCESS_REVOKING_EVENTS = [
  'customer.subscription.deleted',
  'invoice.payment_failed',
] as const
