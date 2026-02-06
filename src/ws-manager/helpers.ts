import type { OrderBookMessage, OrderBook } from '../atoms/types'
import { orderBookAtom } from '../atoms'
import { connectionStatusAtom } from './atoms'
import { DATA_TIMEOUT_MS } from './constants'
import { parseTopic, type TopicAction } from './schemas'

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

  // Update bids - API format: [price, size]
  for (const [price, size] of message.bids) {
    if (Number(size) === 0) {
      newBids.delete(price)
    } else {
      newBids.set(price, size)
    }
  }

  // Update asks - API format: [price, size]
  for (const [price, size] of message.asks) {
    if (Number(size) === 0) {
      newAsks.delete(price)
    } else {
      newAsks.set(price, size)
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
    bids: new Map(message.bids), // Already in [price, size] format
    asks: new Map(message.asks), // Already in [price, size] format
    lastSeqNum: message.seqNum,
    timestamp: message.timestamp,
  }
  set(orderBookAtom, newBook)
  console.log('Order book snapshot received')
}

export function reconnectTopic(ws: WebSocket | null, topic: string) {
  // Re-subscribe to get a fresh snapshot
  const resubscribeMessage = {
    op: 'unsubscribe',
    args: [topic],
  }
  ws?.send(JSON.stringify(resubscribeMessage))

  setTimeout(() => {
    const subscribeMessage = {
      op: 'subscribe',
      args: [topic],
    }
    ws?.send(JSON.stringify(subscribeMessage))
    console.log('Re-subscription sent after sequence mismatch')
  }, 100)
  return
}

/**
 * Apply incremental update from delta message
 */
export function applyIncrementalUpdate(
  message: OrderBookMessage,
  currentOrderBook: OrderBook | null,
  topic: string,
  ws: WebSocket | null,
  set: any
) {
  // Check sequence number continuity
  if (currentOrderBook && message.prevSeqNum !== currentOrderBook.lastSeqNum) {
    console.warn(
      `Sequence number mismatch! Expected ${currentOrderBook.lastSeqNum}, got ${message.prevSeqNum}. Re-subscribing...`
    )

    return reconnectTopic(ws, topic)
  }

  // Apply delta update
  if (currentOrderBook) {
    const updatedBook = applyOrderBookUpdate(currentOrderBook, message)
    set(orderBookAtom, updatedBook)
  }
}

/**
 * Process subscription confirmation event
 */
export function processSubscriptionEvent(data: any) {
  console.log('Subscription confirmed:', data)
}

/**
 * Process update action based on message type
 */
function processUpdateAction(
  _symbol: string,
  message: OrderBookMessage,
  topic: string,
  ws: WebSocket | null,
  get: any,
  set: any
) {
  const currentOrderBook = get(orderBookAtom)

  switch (message.type) {
    case 'snapshot':
      return initializeOrderBookFromSnapshot(message, set)

    case 'delta':
      return applyIncrementalUpdate(message, currentOrderBook, topic, ws, set)

    default:
      console.warn('Unknown message type:', message)
  }
}

/**
 * Process WebSocket data message based on topic action
 */
export function processDataMessage(data: any, ws: WebSocket | null, get: any, set: any) {
  // Parse and validate topic
  const parsed = parseTopic(data.topic)
  if (!parsed) {
    console.warn('Invalid topic format:', data.topic)
    return
  }

  const { action, symbol } = parsed

  // Route to handler based on action
  switch (action as TopicAction) {
    case 'update':
      processUpdateAction(symbol, data.data, data.topic, ws, get, set)
      break

    case 'subscribe':
      console.log(`Subscription event for ${symbol}`)
      break

    case 'unsubscribe':
      console.log(`Unsubscription event for ${symbol}`)
      break

    default:
      console.warn('Unknown topic action:', action)
  }
}
