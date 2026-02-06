import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'
import type { OrderBook, OrderBookLevel } from './types'

export * from './types'

// Base atom for the order book
export const orderBookAtom = atom<OrderBook | null>(null)

// Atoms for bids and asks as arrays (for splitAtom) - returns object format for UI
export const bidsArrayAtom = atom<OrderBookLevel[]>((get) => {
  const orderBook = get(orderBookAtom)
  if (!orderBook) return []

  return Array.from(orderBook.bids.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)) // Descending order by price
    .slice(0, 50) // Top 50 levels
})

export const asksArrayAtom = atom<OrderBookLevel[]>((get) => {
  const orderBook = get(orderBookAtom)
  if (!orderBook) return []

  return Array.from(orderBook.asks.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)) // Ascending order by price
    .slice(0, 50) // Top 50 levels
})

// Split atoms for individual bid/ask levels
export const splitBidsAtom = splitAtom(bidsArrayAtom)
export const splitAsksAtom = splitAtom(asksArrayAtom)

// Derived atoms for best bid/ask
export const bestBidAtom = atom<OrderBookLevel | null>((get) => {
  const bids = get(bidsArrayAtom)
  return bids[0] || null
})

export const bestAskAtom = atom<OrderBookLevel | null>((get) => {
  const asks = get(asksArrayAtom)
  return asks[0] || null
})

// Derived atom for spread
export const spreadAtom = atom<{ absolute: string; percentage: string } | null>((get) => {
  const bestBid = get(bestBidAtom)
  const bestAsk = get(bestAskAtom)

  if (!bestBid || !bestAsk) return null

  const bidPrice = parseFloat(bestBid.price)
  const askPrice = parseFloat(bestAsk.price)
  const spread = askPrice - bidPrice
  const spreadPercent = (spread / bidPrice) * 100

  return {
    absolute: spread.toFixed(2),
    percentage: spreadPercent.toFixed(4),
  }
})
