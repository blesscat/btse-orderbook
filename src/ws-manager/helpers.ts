import type { OrderBookMessage, OrderBook } from './types'
import { connectionStatusAtom, orderBookAtom } from './atoms'
import { DATA_TIMEOUT_MS, UPDATE_TOPIC } from './constants'

// WebSocket and timer instance references
export interface WSRefs {
  ws: WebSocket | null
  reconnectTimer: number | null
  dataTimeoutTimer: number | null
  connectWSAtom: any
}

/**
 * Apply order book updates
 * Handles incremental updates, removes price level when size is 0
 */
export function applyOrderBookUpdate(currentBook: OrderBook, message: OrderBookMessage): OrderBook {
  const newBids = new Map(currentBook.bids)
  const newAsks = new Map(currentBook.asks)

  // Update bids
  for (const level of message.bids) {
    if (parseFloat(level.size) === 0) {
      newBids.delete(level.price)
    } else {
      newBids.set(level.price, level.size)
    }
  }

  // Update asks
  for (const level of message.asks) {
    if (parseFloat(level.size) === 0) {
      newAsks.delete(level.price)
    } else {
      newAsks.set(level.price, level.size)
    }
  }

  return {
    symbol: message.symbol,
    bids: newBids,
    asks: newAsks,
    lastSeqNum: message.seqNum,
    timestamp: message.timestamp,
  }
}

/**
 * Reset data timeout timer
 * Triggers reconnection if no data is received within the specified time
 */
export function resetDataTimeout(refs: WSRefs, set: any) {
  // Clear existing timer
  if (refs.dataTimeoutTimer) {
    clearTimeout(refs.dataTimeoutTimer)
  }

  // Set new timer - if no data received within DATA_TIMEOUT_MS, reconnect
  refs.dataTimeoutTimer = setTimeout(() => {
    console.warn(`No data received for ${DATA_TIMEOUT_MS / 1000} seconds, reconnecting...`)

    // Close current connection
    if (refs.ws) {
      refs.ws.close()
      refs.ws = null
    }

    // Clear timers
    if (refs.reconnectTimer) {
      clearTimeout(refs.reconnectTimer)
      refs.reconnectTimer = null
    }

    // Trigger reconnection
    set(connectionStatusAtom, 'disconnected')
    setTimeout(() => {
      console.log('Reconnecting after data timeout...')
      set(refs.connectWSAtom)
    }, 1000)
  }, DATA_TIMEOUT_MS)
}

/**
 * Clear all timers
 */
export function clearAllTimers(refs: WSRefs) {
  if (refs.reconnectTimer) {
    clearTimeout(refs.reconnectTimer)
    refs.reconnectTimer = null
  }

  if (refs.dataTimeoutTimer) {
    clearTimeout(refs.dataTimeoutTimer)
    refs.dataTimeoutTimer = null
  }
}

/**
 * Initialize order book from snapshot message
 */
export function initializeOrderBookFromSnapshot(message: OrderBookMessage, set: any) {
  const newBook: OrderBook = {
    symbol: message.symbol,
    bids: new Map(message.bids.map((level) => [level.price, level.size])),
    asks: new Map(message.asks.map((level) => [level.price, level.size])),
    lastSeqNum: message.seqNum,
    timestamp: message.timestamp,
  }
  set(orderBookAtom, newBook)
  console.log('Order book snapshot received')
}

/**
 * Apply incremental update from delta message
 */
export function applyIncrementalUpdate(
  message: OrderBookMessage,
  currentOrderBook: OrderBook | null,
  ws: WebSocket | null,
  set: any
) {
  // Check sequence number continuity
  if (currentOrderBook && message.prevSeqNum !== currentOrderBook.lastSeqNum) {
    console.warn(
      `Sequence number mismatch! Expected ${currentOrderBook.lastSeqNum}, got ${message.prevSeqNum}. Re-subscribing...`
    )
    // Re-subscribe to get a fresh snapshot
    const resubscribeMessage = {
      op: 'unsubscribe',
      args: [UPDATE_TOPIC],
    }
    ws?.send(JSON.stringify(resubscribeMessage))

    setTimeout(() => {
      const subscribeMessage = {
        op: 'subscribe',
        args: [UPDATE_TOPIC],
      }
      ws?.send(JSON.stringify(subscribeMessage))
      console.log('Re-subscription sent after sequence mismatch')
    }, 100)
    return
  }

  // Apply delta update
  if (currentOrderBook) {
    const updatedBook = applyOrderBookUpdate(currentOrderBook, message)
    set(orderBookAtom, updatedBook)
  }
}
