import { useEffect, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { connectWSAtom, disconnectWSAtom, bidsArrayAtom, asksArrayAtom, connectionStatusAtom } from '../../ws-manager'
import { Header } from './Header'
import { OrderBookPanel } from './OrderBookPanel'
import { Features } from './Features'

export default function OrderBookTradingPage() {
  const connect = useSetAtom(connectWSAtom)
  const disconnect = useSetAtom(disconnectWSAtom)
  const status = useAtomValue(connectionStatusAtom)
  const bids = useAtomValue(bidsArrayAtom).slice(0, 8)
  const asks = useAtomValue(asksArrayAtom).slice(0, 8).reverse() // 反轉，讓最低賣價在底部

  const [prevBidPrices, setPrevBidPrices] = useState<string[]>([])
  const [prevAskPrices, setPrevAskPrices] = useState<string[]>([])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  useEffect(() => {
    setPrevBidPrices(bids.map((b) => b.price))
  }, [bids])

  useEffect(() => {
    setPrevAskPrices(asks.map((a) => a.price))
  }, [asks])

  // 計算最大累積總量
  const maxBidTotal = bids.reduce((sum, level) => sum + parseFloat(level.size), 0)
  const maxAskTotal = asks.reduce((sum, level) => sum + parseFloat(level.size), 0)

  // 最後成交價
  const lastPrice = bids[0] ? parseFloat(bids[0].price) : 0

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <Header status={status} />

      <div className="mx-auto max-w-7xl p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* 左側 Order Book */}
          <OrderBookPanel
            asks={asks}
            bids={bids}
            prevAskPrices={prevAskPrices}
            prevBidPrices={prevBidPrices}
            maxAskTotal={maxAskTotal}
            maxBidTotal={maxBidTotal}
            lastPrice={lastPrice}
          />

          {/* 右側 Order Book (鏡像) */}
          <OrderBookPanel
            asks={asks}
            bids={bids}
            prevAskPrices={prevAskPrices}
            prevBidPrices={prevBidPrices}
            maxAskTotal={maxAskTotal}
            maxBidTotal={maxBidTotal}
            lastPrice={lastPrice}
          />
        </div>

        <Features />
      </div>
    </div>
  )
}
