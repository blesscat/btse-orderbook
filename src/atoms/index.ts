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
  const levelsWithTotal = bids.map((bid) => {
    cumulativeTotal += Number(bid.size)
    const isNewOrder = !prevOrderBook?.bids.has(bid.price)

    // Compare size with previous order book to determine if size increased or decreased
    let sizeChanged: 'increase' | 'decrease' = 'increase'
    if (prevOrderBook?.bids.has(bid.price)) {
      const prevSize = Number(prevOrderBook.bids.get(bid.price))
      const currentSize = Number(bid.size)
      sizeChanged = currentSize > prevSize ? 'increase' : 'decrease'
    }

    return {
      price: bid.price,
      size: bid.size,
      total: cumulativeTotal.toString(),
      isNewOrder: isNewOrder ?? false,
      sizeChanged,
      totalValue: cumulativeTotal,
    }
  })

  // Calculate max total and add percentage
  const maxTotal = levelsWithTotal.length > 0 ? levelsWithTotal[levelsWithTotal.length - 1].totalValue : 1

  return levelsWithTotal.map(({ totalValue, ...level }) => ({
    ...level,
    percentage: maxTotal > 0 ? (totalValue / maxTotal) * 100 : 0,
  }))
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
  const levelsWithTotal = asks.map((ask, index) => {
    // Sum from current index to the end (lowest prices)
    const cumulativeTotal = asks.slice(index).reduce((sum, a) => sum + Number(a.size), 0)
    const isNewOrder = !prevOrderBook?.asks.has(ask.price)

    // Compare size with previous order book to determine if size increased or decreased
    let sizeChanged: 'increase' | 'decrease' = 'increase'
    if (prevOrderBook?.asks.has(ask.price)) {
      const prevSize = Number(prevOrderBook.asks.get(ask.price))
      const currentSize = Number(ask.size)
      sizeChanged = currentSize > prevSize ? 'increase' : 'decrease'
    }

    return {
      price: ask.price,
      size: ask.size,
      total: cumulativeTotal.toString(),
      isNewOrder: isNewOrder ?? false,
      sizeChanged,
      totalValue: cumulativeTotal,
    }
  })

  // Calculate max total and add percentage
  // For asks: first row has the highest total (sum of all), last row has the lowest
  const maxTotal = levelsWithTotal.length > 0 ? levelsWithTotal[0].totalValue : 1

  return levelsWithTotal.map(({ totalValue, ...level }) => ({
    ...level,
    percentage: maxTotal > 0 ? (totalValue / maxTotal) * 100 : 0,
  }))
})

// Split atoms for individual bid/ask levels
export const splitBidsAtom = splitAtom(bidsArrayAtom)
export const splitAsksAtom = splitAtom(asksArrayAtom)
