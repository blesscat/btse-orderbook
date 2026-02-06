import { atom, type Getter, type Setter } from 'jotai'
import { WS_URL, DATA_TIMEOUT_MS, RECONNECT_DELAY_MS } from './constants'
import { wsMessageSchema, type LastPriceData } from './schemas'
import {
  clearAllTimers,
  resetDataTimeout,
  processSubscriptionEvent,
  sendSubscribe,
  sendUnsubscribe,
  type ConnectionStatus,
  type WSRefs,
  type WSConfig,
} from '../shared/base'
import { processDataMessage } from './helpers'

// WebSocket instance (stored outside of atoms to persist)
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let dataTimeoutTimer: number | null = null

// Base atom for tracking subscriptions
export const subscriptionsAtom = atom(new Set<string>())

// Base atom for connection status
export const connectionStatusAtom = atom<ConnectionStatus>('disconnected')

// Base atom for error messages
export const errorAtom = atom<string | null>(null)

// Base atom for last price data
export const lastPriceAtom = atom<LastPriceData | null>(null)

/**
 * Connect WebSocket if not already connected
 */
function connectWebSocket(get: Getter, set: Setter) {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return
  }

  set(connectionStatusAtom, 'connecting')
  set(errorAtom, null)

  try {
    ws = new WebSocket(WS_URL)

    const refs: WSRefs = {
      ws,
      reconnectTimer,
      dataTimeoutTimer,
      connectWSAtom,
    }

    const config: WSConfig = {
      url: WS_URL,
      dataTimeoutMs: DATA_TIMEOUT_MS,
      reconnectDelayMs: RECONNECT_DELAY_MS,
    }

    ws.onopen = () => {
      console.log('[LastPrice] WebSocket connected')
      set(connectionStatusAtom, 'connected')
      set(errorAtom, null)

      // Subscribe to all active subscriptions
      const subs = get(subscriptionsAtom)
      for (const topic of subs) {
        sendSubscribe(ws, topic)
      }

      // Start data timeout timer
      if (subs.size > 0) {
        resetDataTimeout(refs, set, config, connectionStatusAtom)
      }
    }

    ws.onmessage = (event) => {
      resetDataTimeout(refs, set, config, connectionStatusAtom)

      try {
        const rawData = JSON.parse(event.data)
        const validationResult = wsMessageSchema.safeParse(rawData)

        if (!validationResult.success) {
          console.warn('[LastPrice] Message validation failed:', validationResult.error.issues)
          return
        }

        const data = validationResult.data

        if ('event' in data && data.event === 'subscribe') return processSubscriptionEvent(data)
        if ('topic' in data && 'data' in data) return processDataMessage(data, get, set)

        console.warn('[LastPrice] Unknown message format:', data)
      } catch (error) {
        console.error('[LastPrice] Error parsing WebSocket message:', error)
        set(errorAtom, 'Failed to parse message')
      }
    }

    ws.onerror = (error) => {
      console.error('[LastPrice] WebSocket error:', error)
      set(connectionStatusAtom, 'error')
      set(errorAtom, 'WebSocket connection error')
    }

    ws.onclose = () => {
      console.log('[LastPrice] WebSocket disconnected')
      set(connectionStatusAtom, 'disconnected')

      if (dataTimeoutTimer) {
        clearTimeout(dataTimeoutTimer)
        dataTimeoutTimer = null
      }

      // Reconnect if there are active subscriptions
      const subs = get(subscriptionsAtom)
      if (subs.size > 0) {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => {
          console.log('[LastPrice] Attempting to reconnect...')
          connectWebSocket(get, set)
        }, RECONNECT_DELAY_MS)
      }
    }
  } catch (error) {
    console.error('[LastPrice] Failed to create WebSocket:', error)
    set(connectionStatusAtom, 'error')
    set(errorAtom, 'Failed to create WebSocket connection')
  }
}

/**
 * Disconnect WebSocket
 */
function disconnectWebSocket(set: Setter) {
  const refs: WSRefs = {
    ws,
    reconnectTimer,
    dataTimeoutTimer,
    connectWSAtom,
  }

  clearAllTimers(refs)

  if (ws) {
    ws.close()
    ws = null
  }

  set(connectionStatusAtom, 'disconnected')
  set(lastPriceAtom, null)
  set(errorAtom, null)
}

// Action atom to subscribe to a topic
export const subscribeAtom = atom(null, (get, set, topic: string) => {
  const subs = get(subscriptionsAtom)

  if (subs.has(topic)) {
    console.log(`[LastPrice] Already subscribed to ${topic}`)
    return
  }

  const newSubs = new Set(subs)
  newSubs.add(topic)
  set(subscriptionsAtom, newSubs)

  console.log(`[LastPrice] Subscribing to ${topic}`)

  // If WebSocket is connected, send subscription immediately
  if (ws?.readyState === WebSocket.OPEN) {
    sendSubscribe(ws, topic)
  } else {
    // Connect WebSocket if not already connected
    connectWebSocket(get, set)
  }
})

// Action atom to unsubscribe from a topic
export const unsubscribeAtom = atom(null, (get, set, topic: string) => {
  const subs = get(subscriptionsAtom)
  const newSubs = new Set(subs)

  if (!newSubs.has(topic)) {
    console.log(`[LastPrice] Not subscribed to ${topic}`)
    return
  }

  newSubs.delete(topic)
  set(subscriptionsAtom, newSubs)

  console.log(`[LastPrice] Unsubscribing from ${topic}`)

  // Send unsubscribe message if WebSocket is connected
  sendUnsubscribe(ws, topic)

  // Disconnect if no more active subscriptions
  if (newSubs.size === 0) {
    console.log('[LastPrice] No more active subscriptions, disconnecting WebSocket')
    disconnectWebSocket(set)
  }
})

// Legacy atoms for backwards compatibility
export const connectWSAtom = atom(null, (get, set) => {
  connectWebSocket(get, set)
})

export const disconnectWSAtom = atom(null, (_get, set) => {
  disconnectWebSocket(set)
})
