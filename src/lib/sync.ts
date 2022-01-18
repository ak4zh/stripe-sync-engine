import { upsertProduct } from './products'
import { upsertPrice } from './prices'
import { upsertSubscription } from './subscriptions'
import { stripe } from '../utils/StripeClientManager'

export async function syncProducts(): Promise<{ synced: number }> {
  let synced = 0
  for await (const product of stripe.products.list({ limit: 50 })) {
    await upsertProduct(product)
    synced++
  }

  return { synced }
}

export async function syncPrices(): Promise<{ synced: number }> {
  let synced = 0
  for await (const price of stripe.prices.list({ limit: 50 })) {
    await upsertPrice(price)
    synced++
  }

  return { synced }
}

export async function syncSubscriptions(): Promise<{ synced: number }> {
  let synced = 0
  for await (const subscription of stripe.subscriptions.list({ limit: 50 })) {
    await upsertSubscription(subscription)
    synced++
  }

  return { synced }
}