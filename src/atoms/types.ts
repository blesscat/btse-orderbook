// Order book level for UI (object format)
export interface OrderBookLevel {
  price: string
  size: string
  total: string
  isNewOrder: boolean
}

// Order book level from API (tuple format)
export type OrderBookLevelTuple = [string, string]

export interface OrderBookSnapshot {
  type: 'snapshot'
  symbol: string
  timestamp: number
  seqNum: number
  prevSeqNum: number
  bids: OrderBookLevelTuple[]
  asks: OrderBookLevelTuple[]
}

export interface OrderBookDelta {
  type: 'delta'
  symbol: string
  timestamp: number
  seqNum: number
  prevSeqNum: number
  bids: OrderBookLevelTuple[]
  asks: OrderBookLevelTuple[]
}

export type OrderBookMessage = OrderBookSnapshot | OrderBookDelta

export interface OrderBook {
  symbol: string
  bids: Map<string, string> // price -> size
  asks: Map<string, string> // price -> size
  lastSeqNum: number
  timestamp: number
}
