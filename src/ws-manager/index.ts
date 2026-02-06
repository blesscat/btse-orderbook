import { atom } from 'jotai'
import { connectionStatusAtom, errorAtom, orderBookAtom } from './atoms'
import { WS_URL, UPDATE_TOPIC } from './constants'
import { wsMessageSchema } from './schemas'
import { resetDataTimeout, clearAllTimers, processSubscriptionEvent, processDataMessage } from './helpers'

export * from './atoms'
export type * from './types'

// WebSocket instance (stored outside of atoms to persist)
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let dataTimeoutTimer: number | null = null

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

    // Create refs object for helper functions
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

      // Subscribe to order book updates
      const subscribeMessage = {
        op: 'subscribe',
        args: [UPDATE_TOPIC],
      }
      ws?.send(JSON.stringify(subscribeMessage))
      console.log('Subscription sent:', subscribeMessage)

      // Start data timeout timer after subscription
      resetDataTimeout(refs, set)
    }

    ws.onmessage = (event) => {
      // Reset timeout on any message received
      resetDataTimeout(refs, set)

      try {
        const rawData = JSON.parse(event.data)

        // Validate message with zod
        const validationResult = wsMessageSchema.safeParse(rawData)

        if (!validationResult.success) {
          console.log('???????????', rawData)
          console.warn('Message validation failed:', validationResult.error.issues)
          return
        }

        const data = validationResult.data

        // Handle subscription event
        if ('event' in data && data.event === 'subscribe') return processSubscriptionEvent(data)

        // Handle data message
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

      // Clear data timeout timer
      if (dataTimeoutTimer) {
        clearTimeout(dataTimeoutTimer)
        dataTimeoutTimer = null
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
export const disconnectWSAtom = atom(null, (_get, set) => {
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
})
