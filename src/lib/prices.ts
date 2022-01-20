import Price from 'stripe'
import { query } from '../utils/PostgresConnection'
import { pg as sql } from 'yesql'
import { getConfig } from '../utils/config'
import { stripe } from '../utils/StripeClientManager'
import { verifyProductExists, fetchAndInsertProduct } from './products'
import { cleanseArrayField, constructUpsertSql } from '../utils/helpers'
import { priceSchema } from '../schemas/price'

const config = getConfig()

export const upsertPrice = async (price: Price.Price): Promise<Price.Price[]> => {
  // Backfill product if it doesn't already exist
  const productId = price.product.toString()
  if (productId && !(await verifyProductExists(productId))) {
    await fetchAndInsertProduct(productId)
  }

  // Create the SQL
  const upsertString = constructUpsertSql(config.SCHEMA || 'stripe', 'prices', priceSchema)

  // Inject the values
  const cleansed = cleanseArrayField(price)
  const prepared = sql(upsertString)(cleansed)

  // Run it
  const { rows } = await query(prepared.text, prepared.values)
  return rows
}

export const verifyPriceExists = async (id: string): Promise<boolean> => {
  const prepared = sql(`
    select id from "${config.SCHEMA}"."prices" 
    where id = :id;
    `)({ id })
  const { rows } = await query(prepared.text, prepared.values)
  return rows.length > 0
}

export const fetchAndInsertPrice = async (id: string): Promise<Price.Price[]> => {
  const price = await stripe.prices.retrieve(id)
  return upsertPrice(price)
}

export const deletePrice = async (id: string): Promise<boolean> => {
  const prepared = sql(`
    delete from "${config.SCHEMA}"."prices" 
    where id = :id
    returning id;
    `)({ id })
  const { rows } = await query(prepared.text, prepared.values)
  return rows.length > 0
}

type fetchPriceResponse = Price.Response<Price.ApiList<Price.Price>>
type fetchPriceParams = {
  limit: number
  id: string | undefined
}
const fetchProductsDefaults = {
  limit: 100,
  id: undefined,
}
export const fetchPrices = async (
  options: fetchPriceParams = fetchProductsDefaults
): Promise<fetchPriceResponse> => {
  const prices = await stripe.prices.list({
    limit: options.limit,
  })
  return prices
}
