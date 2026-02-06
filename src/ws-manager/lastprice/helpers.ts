import { type Setter, type Getter } from 'jotai'
import { lastPriceAtom, prevPriceAtom } from './atoms'
import { parseTopic, type TradeFill, type LastPriceData } from './schemas'

/**
 * Process WebSocket data message
 */
export function processDataMessage(data: any, get: Getter, set: Setter) {
  // Parse and validate topic
  const parsed = parseTopic(data.topic)
  if (!parsed) {
    console.warn('[LastPrice] Invalid topic format:', data.topic)
    return
  }

  const { action } = parsed

  // Handle tradeHistoryApi topic (main public trade fills API)
  if (action === 'tradeHistoryApi') {
    updateLastPrice(data.data, get, set)
  } else {
    console.warn('[LastPrice] Unknown topic action:', action)
  }
}

/**
 * Update last price atom with new trade data
 * Data can be a single trade or an array of trades
 */
function updateLastPrice(data: TradeFill | TradeFill[], get: Getter, set: Setter) {
  // If it's an array, take the most recent trade (last one)
  const latestTrade = Array.isArray(data) ? data[data.length - 1] : data

  if (!latestTrade) {
    console.warn('[LastPrice] No trade data received')
    return
  }

  // Get previous price to compare
  const prevPrice = get(prevPriceAtom)

  // Determine price change status
  let priceChanged: 'increase' | 'decrease' | 'normal' = 'normal'
  if (prevPrice !== null) {
    if (latestTrade.price > prevPrice) {
      priceChanged = 'increase'
    } else if (latestTrade.price < prevPrice) {
      priceChanged = 'decrease'
    }
  }

  const lastPriceData: LastPriceData = {
    price: latestTrade.price,
    priceChanged,
    size: latestTrade.size,
    side: latestTrade.side,
    symbol: latestTrade.symbol,
    timestamp: latestTrade.timestamp,
    tradeId: latestTrade.tradeId,
  }

  // Update both atoms
  set(prevPriceAtom, latestTrade.price)
  set(lastPriceAtom, lastPriceData)
}
