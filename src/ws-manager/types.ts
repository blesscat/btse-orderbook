export interface OrderBookLevel {
  price: string
  size: string
}

export interface OrderBookSnapshot {
  type: 'snapshot'
  symbol: string
  timestamp: number
  seqNum: number
  prevSeqNum: number
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export interface OrderBookDelta {
  type: 'delta'
  symbol: string
  timestamp: number
  seqNum: number
  prevSeqNum: number
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export type OrderBookMessage = OrderBookSnapshot | OrderBookDelta

export interface OrderBook {
  symbol: string
  bids: Map<string, string> // price -> size
  asks: Map<string, string> // price -> size
  lastSeqNum: number
  timestamp: number
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface WSManagerState {
  status: ConnectionStatus
  orderBook: OrderBook | null
  error: string | null
}
