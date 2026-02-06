import { z } from 'zod'

// Trade fill data schema based on BTSE API documentation
export const tradeFillSchema = z.object({
  price: z.number(), // Transacted price
  size: z.number(), // Transacted size
  side: z.enum(['BUY', 'SELL']), // Trade direction
  symbol: z.string(), // Market symbol
  tradeId: z.number(), // Trade identifier
  timestamp: z.number(), // Trade execution timestamp
})

export type TradeFill = z.infer<typeof tradeFillSchema>

// For UI display, we track the latest trade
export interface LastPriceData {
  price: number
  priceChanged: 'increase' | 'decrease' | 'normal'
  size: number
  side: 'BUY' | 'SELL'
  symbol: string
  timestamp: number
  tradeId: number
}

// Subscription event schema
const subscriptionEventSchema = z.object({
  event: z.literal('subscribe'),
  channel: z.string().optional(),
})

// Data message schema - can contain single trade or array of trades
const dataMessageSchema = z.object({
  topic: z.string(),
  data: z.union([tradeFillSchema, z.array(tradeFillSchema)]),
})

// Union of all possible WebSocket messages
export const wsMessageSchema = z.union([subscriptionEventSchema, dataMessageSchema])

export type WSMessage = z.infer<typeof wsMessageSchema>

/**
 * Topic format: "tradeHistoryApi" or "tradeHistoryApi:BTCPFC"
 * Examples: "tradeHistoryApi", "tradeHistoryApi:BTCPFC"
 */
export function parseTopic(topic: string): { action: string; symbol?: string } | null {
  const match = topic.match(/^([^:]+)(?::(.+))?$/)
  if (!match) return null

  return {
    action: match[1],
    symbol: match[2], // undefined if no colon
  }
}
