import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'
import type { OrderBook, OrderBookLevel, OrderBookLevelTuple, ConnectionStatus, WSManagerState } from './types'

// Base atom for connection status
export const connectionStatusAtom = atom<ConnectionStatus>('disconnected')

// Base atom for error messages
export const errorAtom = atom<string | null>(null)

// Base atom for the order book
export const orderBookAtom = atom<OrderBook | null>(null)

// Combined state atom
export const wsManagerStateAtom = atom<WSManagerState>((get) => ({
  status: get(connectionStatusAtom),
  orderBook: get(orderBookAtom),
  error: get(errorAtom),
}))

// Atoms for bids and asks as arrays (for splitAtom) - returns tuple format for UI
export const bidsArrayAtom = atom<OrderBookLevelTuple[]>((get) => {
  const orderBook = get(orderBookAtom)
  if (!orderBook) return []

  return Array.from(orderBook.bids.entries())
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a)) // Descending order by price
    .slice(0, 50) // Top 50 levels
})

export const asksArrayAtom = atom<OrderBookLevelTuple[]>((get) => {
  const orderBook = get(orderBookAtom)
  if (!orderBook) return []

  return Array.from(orderBook.asks.entries())
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b)) // Ascending order by price
    .slice(0, 50) // Top 50 levels
})

// Split atoms for individual bid/ask levels
export const splitBidsAtom = splitAtom(bidsArrayAtom)
export const splitAsksAtom = splitAtom(asksArrayAtom)

// Derived atoms for best bid/ask
export const bestBidAtom = atom<OrderBookLevelTuple | null>((get) => {
  const bids = get(bidsArrayAtom)
  return bids[0] || null
})

export const bestAskAtom = atom<OrderBookLevelTuple | null>((get) => {
  const asks = get(asksArrayAtom)
  return asks[0] || null
})

// Derived atom for spread
export const spreadAtom = atom<{ absolute: string; percentage: string } | null>((get) => {
  const bestBid = get(bestBidAtom)
  const bestAsk = get(bestAskAtom)

  if (!bestBid || !bestAsk) return null

  const bidPrice = parseFloat(bestBid[0]) // price is first element in tuple
  const askPrice = parseFloat(bestAsk[0]) // price is first element in tuple
  const spread = askPrice - bidPrice
  const spreadPercent = (spread / bidPrice) * 100

  return {
    absolute: spread.toFixed(2),
    percentage: spreadPercent.toFixed(4),
  }
})
