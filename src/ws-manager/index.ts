import { atom } from 'jotai'
import { connectionStatusAtom, errorAtom, orderBookAtom } from './atoms'
import { WS_URL } from './constants'
import { wsMessageSchema } from './schemas'
import { resetDataTimeout, clearAllTimers, processSubscriptionEvent, processDataMessage } from './helpers'

export * from './atoms'
export type * from './types'

// WebSocket instance (stored outside of atoms to persist)
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let dataTimeoutTimer: number | null = null

// Subscriptions set (tracks active subscriptions)
let activeSubscriptions = new Set<string>()

// Base atom for tracking subscriptions
export const subscriptionsAtom = atom(new Set<string>())

/**
 * Connect WebSocket if not already connected
 */
function connectWebSocket(get: any, set: any) {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return
  }

  set(connectionStatusAtom, 'connecting')
  set(errorAtom, null)

  try {
    ws = new WebSocket(WS_URL)

    const refs = {
      ws,
      reconnectTimer,
      dataTimeoutTimer,
      connectWSAtom,
    }

    ws.onopen = () => {
      console.log('WebSocket connected')
      set(connectionStatusAtom, 'connected')
      set(errorAtom, null)

      // Subscribe to all active subscriptions
      const subs = get(subscriptionsAtom)
      for (const topic of subs) {
        const subscribeMessage = {
          op: 'subscribe',
          args: [topic],
        }
        ws?.send(JSON.stringify(subscribeMessage))
        console.log('Subscription sent:', subscribeMessage)
      }

      // Start data timeout timer
      if (subs.size > 0) {
        resetDataTimeout(refs, set)
      }
    }

    ws.onmessage = (event) => {
      resetDataTimeout(refs, set)

      try {
        const rawData = JSON.parse(event.data)
        const validationResult = wsMessageSchema.safeParse(rawData)

        if (!validationResult.success) {
          console.warn('Message validation failed:', validationResult.error.issues)
          return
        }

        const data = validationResult.data

        if ('event' in data && data.event === 'subscribe') return processSubscriptionEvent(data)
        if ('topic' in data && 'data' in data) return processDataMessage(data, refs.ws, get, set)

        console.warn('Unknown message format:', data)
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

      if (dataTimeoutTimer) {
        clearTimeout(dataTimeoutTimer)
        dataTimeoutTimer = null
      }

      // Reconnect if there are active subscriptions
      const subs = get(subscriptionsAtom)
      if (subs.size > 0) {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connectWebSocket(get, set)
        }, 3000)
      }
    }
  } catch (error) {
    console.error('Failed to create WebSocket:', error)
    set(connectionStatusAtom, 'error')
    set(errorAtom, 'Failed to create WebSocket connection')
  }
}

/**
 * Disconnect WebSocket
 */
function disconnectWebSocket(set: any) {
  const refs = {
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
  set(orderBookAtom, null)
  set(errorAtom, null)
}

// Action atom to subscribe to a topic
export const subscribeAtom = atom(null, (get, set, topic: string) => {
  const subs = get(subscriptionsAtom)

  if (subs.has(topic)) {
    console.log(`Already subscribed to ${topic}`)
    return
  }

  const newSubs = new Set(subs)

  newSubs.add(topic)
  activeSubscriptions.add(topic)
  set(subscriptionsAtom, newSubs)

  console.log(`Subscribing to ${topic}`)

  // If WebSocket is connected, send subscription immediately
  if (ws?.readyState === WebSocket.OPEN) {
    const subscribeMessage = {
      op: 'subscribe',
      args: [topic],
    }
    ws.send(JSON.stringify(subscribeMessage))
    console.log('Subscription sent:', subscribeMessage)
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
    console.log(`Not subscribed to ${topic}`)
    return
  }

  newSubs.delete(topic)
  activeSubscriptions.delete(topic)
  set(subscriptionsAtom, newSubs)

  console.log(`Unsubscribing from ${topic}`)

  // Send unsubscribe message if WebSocket is connected
  if (ws?.readyState === WebSocket.OPEN) {
    const unsubscribeMessage = {
      op: 'unsubscribe',
      args: [topic],
    }
    ws.send(JSON.stringify(unsubscribeMessage))
    console.log('Unsubscription sent:', unsubscribeMessage)
  }

  // Disconnect if no more active subscriptions
  if (newSubs.size === 0) {
    console.log('No more active subscriptions, disconnecting WebSocket')
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
