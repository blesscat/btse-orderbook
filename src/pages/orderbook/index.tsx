import { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { subscribeAtom, unsubscribeAtom } from '@/ws-manager/orderbook'
import { UPDATE_BTCPFC } from '@/constants'
import { splitBidsAtom, splitAsksAtom } from '@/atoms'
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
    <div className="min-h-screen bg-bg-primary p-6">
      <h1 className="mb-6 font-mono text-3xl font-bold text-text-primary">Order Book</h1>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 px-4 py-2 text-sm text-text-secondary">
          <span>Price (USD)</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        <div className="space-y-1">
          {asksAtoms.map((asksAtom) => (
            <OrderRow key={`${asksAtom}`} rowAtom={asksAtom} type="ask" />
          ))}
        </div>

        <div className="my-4 border-t border-[#1e2329]" />

        <div className="space-y-1">
          {bidsAtoms.map((bidsAtom) => (
            <OrderRow key={`${bidsAtom}`} rowAtom={bidsAtom} type="bid" />
          ))}
        </div>
      </div>
    </div>
  )
}
