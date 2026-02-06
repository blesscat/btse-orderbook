import type { OrderBookLevel } from '../../ws-manager'
import { QuoteRow } from './QuoteRow'
import { LastPrice } from './LastPrice'

interface OrderBookPanelProps {
  asks: OrderBookLevel[]
  bids: OrderBookLevel[]
  prevAskPrices: string[]
  prevBidPrices: string[]
  maxAskTotal: number
  maxBidTotal: number
  lastPrice: number
}

export function OrderBookPanel({
  asks,
  bids,
  prevAskPrices,
  prevBidPrices,
  maxAskTotal,
  maxBidTotal,
  lastPrice,
}: OrderBookPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1e2329] bg-[#181a20]">
      {/* 標題 */}
      <div className="border-b border-[#1e2329] bg-[#0f1419] px-4 py-3">
        <h2 className="font-['JetBrains_Mono'] text-lg font-semibold">Order Book</h2>
      </div>

      {/* 表頭 */}
      <div className="grid grid-cols-3 gap-4 border-b border-[#1e2329] bg-[#0f1419] px-4 py-3 font-['JetBrains_Mono'] text-xs font-medium text-[#8898aa]">
        <div className="text-center">Price (USD)</div>
        <div className="text-center">Size</div>
        <div className="text-center">Total</div>
      </div>

      {/* 賣單 (Asks) - 紅色 */}
      <div className="border-b border-[#1e2329]">
        {asks.length === 0 ? (
          <div className="py-8 text-center text-[#8898aa]">Loading asks...</div>
        ) : (
          asks.map((ask, index) => (
            <QuoteRow
              key={`ask-${ask.price}`}
              level={ask}
              isBid={false}
              index={index}
              totalLevels={asks}
              maxTotal={maxAskTotal}
              prevPrice={prevAskPrices[index] || null}
            />
          ))
        )}
      </div>

      {/* 最後成交價 */}
      <LastPrice price={lastPrice} />

      {/* 買單 (Bids) - 綠色 */}
      <div>
        {bids.length === 0 ? (
          <div className="py-8 text-center text-[#8898aa]">Loading bids...</div>
        ) : (
          bids.map((bid, index) => (
            <QuoteRow
              key={`bid-${bid.price}`}
              level={bid}
              isBid={true}
              index={index}
              totalLevels={bids}
              maxTotal={maxBidTotal}
              prevPrice={prevBidPrices[index] || null}
            />
          ))
        )}
      </div>
    </div>
  )
}
