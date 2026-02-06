import { atom } from 'jotai'
import type { OrderBookMessage, OrderBook } from './types'
import { connectionStatusAtom, errorAtom, orderBookAtom } from './atoms'
import { WS_URL, UPDATE_TOPIC } from './constants'

export * from './atoms'
export type * from './types'

// WebSocket instance (stored outside of atoms to persist)
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let pingTimer: number | null = null

// Helper function to apply order book updates
function applyOrderBookUpdate(currentBook: OrderBook, message: OrderBookMessage): OrderBook {
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

// Action atom to connect WebSocket
export const connectWSAtom = atom(null, (get, set) => {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    console.log('WebSocket already connected or connecting')
    return
  }

  set(connectionStatusAtom, 'connecting')
  set(errorAtom, null)

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('WebSocket connected')
      set(connectionStatusAtom, 'connected')
      set(errorAtom, null)

      // Subscribe to order book updates
      const subscribeMessage = {
        op: 'subscribe',
        args: [UPDATE_TOPIC],
      }
      ws?.send(JSON.stringify(subscribeMessage))

      // Set up ping to keep connection alive
      if (pingTimer) clearInterval(pingTimer)
      pingTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: 'ping' }))
        }
      }, 30000) // Ping every 30 seconds
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Handle pong response
        if (data.op === 'pong') {
          return
        }

        // Handle subscription confirmation
        if (data.event === 'subscribe') {
          console.log('Subscription confirmed:', data)
          return
        }

        // Handle order book data
        if (data.topic === UPDATE_TOPIC && data.data) {
          const message: OrderBookMessage = data.data

          const currentOrderBook = get(orderBookAtom)

          if (message.type === 'snapshot') {
            // Initialize order book with snapshot
            const newBook: OrderBook = {
              symbol: message.symbol,
              bids: new Map(message.bids.map((level) => [level.price, level.size])),
              asks: new Map(message.asks.map((level) => [level.price, level.size])),
              lastSeqNum: message.seqNum,
              timestamp: message.timestamp,
            }
            set(orderBookAtom, newBook)
            console.log('Order book snapshot received')
          } else if (message.type === 'delta') {
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
              }, 100)
              return
            }

            // Apply delta update
            if (currentOrderBook) {
              const updatedBook = applyOrderBookUpdate(currentOrderBook, message)
              set(orderBookAtom, updatedBook)
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
        set(errorAtom, 'Failed to parse message')
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      set(connectionStatusAtom, 'error')
      set(errorAtom, 'WebSocket connection error')
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      set(connectionStatusAtom, 'disconnected')

      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }

      // Auto-reconnect after 3 seconds
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect...')
        set(connectWSAtom)
      }, 3000)
    }
  } catch (error) {
    console.error('Failed to create WebSocket:', error)
    set(connectionStatusAtom, 'error')
    set(errorAtom, 'Failed to create WebSocket connection')
  }
})

// Action atom to disconnect WebSocket
export const disconnectWSAtom = atom(null, (get, set) => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = null
  }

  if (ws) {
    ws.close()
    ws = null
  }

  set(connectionStatusAtom, 'disconnected')
  set(orderBookAtom, null)
  set(errorAtom, null)
})
