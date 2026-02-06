export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface WSRefs {
  ws: WebSocket | null
  reconnectTimer: number | null
  dataTimeoutTimer: number | null
  connectWSAtom: any
}

export interface WSConfig {
  url: string
  dataTimeoutMs: number
  reconnectDelayMs: number
}

/**
 * Clear all WebSocket timers
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
 * Reset data timeout timer
 * Triggers reconnection if no data is received within the specified time
 */
export function resetDataTimeout(refs: WSRefs, set: any, config: WSConfig, connectionStatusAtom: any) {
  // Clear existing timer
  if (refs.dataTimeoutTimer) {
    clearTimeout(refs.dataTimeoutTimer)
  }

  // Set new timer - if no data received within dataTimeoutMs, reconnect
  refs.dataTimeoutTimer = setTimeout(() => {
    console.warn(`No data received for ${config.dataTimeoutMs / 1000} seconds, reconnecting...`)

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
  }, config.dataTimeoutMs)
}

/**
 * Process subscription confirmation event
 */
export function processSubscriptionEvent(data: any) {
  console.log('Subscription confirmed:', data)
}

/**
 * Send subscribe message to WebSocket
 */
export function sendSubscribe(ws: WebSocket | null, topic: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return

  const subscribeMessage = {
    op: 'subscribe',
    args: [topic],
  }
  ws.send(JSON.stringify(subscribeMessage))
  console.log('Subscription sent:', subscribeMessage)
}

/**
 * Send unsubscribe message to WebSocket
 */
export function sendUnsubscribe(ws: WebSocket | null, topic: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return

  const unsubscribeMessage = {
    op: 'unsubscribe',
    args: [topic],
  }
  ws.send(JSON.stringify(unsubscribeMessage))
  console.log('Unsubscription sent:', unsubscribeMessage)
}
