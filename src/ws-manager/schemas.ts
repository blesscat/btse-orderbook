import { z } from 'zod'

// Order book level schema - API returns [price, size] tuple
export const orderBookLevelSchema = z.tuple([
  z.string(), // price
  z.string(), // size
])

// Base message schema
const baseMessageSchema = z.object({
  symbol: z.string(),
  timestamp: z.number(),
  seqNum: z.number(),
  prevSeqNum: z.number(),
  bids: z.array(orderBookLevelSchema),
  asks: z.array(orderBookLevelSchema),
})

// Snapshot message schema
export const snapshotMessageSchema = baseMessageSchema.extend({
  type: z.literal('snapshot'),
})

// Delta message schema
export const deltaMessageSchema = baseMessageSchema.extend({
  type: z.literal('delta'),
})

// Union of all order book message types
export const orderBookMessageSchema = z.discriminatedUnion('type', [snapshotMessageSchema, deltaMessageSchema])

// Subscription confirmation schema
export const subscriptionEventSchema = z.object({
  event: z.literal('subscribe'),
  channel: z.array(z.string()).optional(),
})

// WebSocket data message schema
export const wsDataMessageSchema = z.object({
  topic: z.string(),
  data: orderBookMessageSchema,
})

// Main WebSocket message schema (union of all possible messages)
export const wsMessageSchema = z.union([subscriptionEventSchema, wsDataMessageSchema])

// Topic parser schema - validates "action:symbol" format
export const topicSchema = z
  .string()
  .regex(/^[a-z]+:[A-Z0-9]+$/, 'Topic must be in format "action:symbol"')
  .transform((topic) => {
    const [action, symbol] = topic.split(':')
    return { action, symbol }
  })

// Topic action types
export type TopicAction = 'update' | 'subscribe' | 'unsubscribe'

// Parse and validate topic
export function parseTopic(topic: string): { action: TopicAction; symbol: string } | null {
  try {
    const result = topicSchema.parse(topic)
    return result as { action: TopicAction; symbol: string }
  } catch {
    return null
  }
}
