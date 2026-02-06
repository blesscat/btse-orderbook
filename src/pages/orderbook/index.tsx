import { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { subscribeAtom, unsubscribeAtom } from '@/ws-manager/orderbook'
import { UPDATE_BTCPFC } from '@/constants'
import { splitBidsAtom, splitAsksAtom } from '@/atoms'
import LastPrice from './LastPrice'
import OrderRow from './OrderRow'

export default function OrderBookPage() {
  const subscribe = useSetAtom(subscribeAtom)
  const unsubscribe = useSetAtom(unsubscribeAtom)
  const bidsAtoms = useAtomValue(splitBidsAtom)
  const asksAtoms = useAtomValue(splitAsksAtom)

  useEffect(() => {
    subscribe(UPDATE_BTCPFC)
    return () => unsubscribe(UPDATE_BTCPFC)
  }, [subscribe, unsubscribe])

  return (
    <div className="bg-bg-primary min-h-screen p-6">
      <h1 className="text-text-primary mb-6 font-mono text-3xl font-bold">Order Book</h1>

      <div className="space-y-4">
        <div className="text-text-secondary grid grid-cols-[1fr_1fr_1.5fr] text-sm">
          <span className="text-nowrap">Price(USD)</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        <div>
          {asksAtoms.map((asksAtom) => (
            <OrderRow key={`${asksAtom}`} rowAtom={asksAtom} type="ask" />
          ))}
        </div>

        <LastPrice />

        <div>
          {bidsAtoms.map((bidsAtom) => (
            <OrderRow key={`${bidsAtom}`} rowAtom={bidsAtom} type="bid" />
          ))}
        </div>
      </div>
    </div>
  )
}
