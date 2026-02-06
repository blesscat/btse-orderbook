import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'
import type { OrderBook, OrderBookLevel } from './types'

export * from './types'

// Base atom for the order book
export const orderBookAtom = atom<OrderBook | null>(null)

// Track previous order book to detect new orders
export const prevOrderBookAtom = atom<OrderBook | null>(null)

// Atoms for bids and asks as arrays (for splitAtom) - returns object format for UI
export const bidsArrayAtom = atom<OrderBookLevel[]>((get) => {
  const orderBook = get(orderBookAtom)
  const prevOrderBook = get(prevOrderBookAtom)
  if (!orderBook) return []

  const bids = Array.from(orderBook.bids.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => Number(b.price) - Number(a.price)) // Descending order by price (high to low)
    .slice(0, 8) // Top 8 levels

  // Calculate cumulative total from highest price downwards
  let cumulativeTotal = 0
  return bids.map((bid) => {
    cumulativeTotal += Number(bid.size)
    const isNewOrder = !prevOrderBook?.bids.has(bid.price)
    return {
      price: bid.price,
      size: bid.size,
      total: cumulativeTotal.toString(),
      isNewOrder: isNewOrder ?? false,
    }
  })
})

export const asksArrayAtom = atom<OrderBookLevel[]>((get) => {
  const orderBook = get(orderBookAtom)
  const prevOrderBook = get(prevOrderBookAtom)
  if (!orderBook) return []

  const asks = Array.from(orderBook.asks.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => Number(b.price) - Number(a.price)) // Descending order by price (high to low)
    .slice(0, 8) // Top 8 levels

  // Calculate cumulative total from lowest price upwards
  return asks.map((ask, index) => {
    // Sum from current index to the end (lowest prices)
    const cumulativeTotal = asks.slice(index).reduce((sum, a) => sum + Number(a.size), 0)
    const isNewOrder = !prevOrderBook?.asks.has(ask.price)
    return {
      price: ask.price,
      size: ask.size,
      total: cumulativeTotal.toString(),
      isNewOrder: isNewOrder ?? false,
    }
  })
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

  const bidPrice = Number(bestBid.price)
  const askPrice = Number(bestAsk.price)
  const spread = askPrice - bidPrice
  const spreadPercent = (spread / bidPrice) * 100

  return {
    absolute: spread.toFixed(2),
    percentage: spreadPercent.toFixed(4),
  }
})
