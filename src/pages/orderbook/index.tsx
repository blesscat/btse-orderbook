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
    <div className="bg-bg-primary min-h-screen pt-3">
      <h1
        className="text-text-primary mb-3 border-b px-6 font-mono text-xl font-bold"
        style={{ borderColor: 'var(--color-normal-12)' }}
      >
        Order Book
      </h1>

      <div className="px-6">
        <div className="text-text-secondary grid grid-cols-[1fr_1fr_1.5fr] text-sm">
          <span className="text-nowrap">Price(USD)</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        <div className="mt-3">
          {asksAtoms.map((asksAtom) => (
            <OrderRow key={`${asksAtom}`} rowAtom={asksAtom} type="ask" />
          ))}
        </div>

        <LastPrice className="my-1" />

        <div>
          {bidsAtoms.map((bidsAtom) => (
            <OrderRow key={`${bidsAtom}`} rowAtom={bidsAtom} type="bid" />
          ))}
        </div>
      </div>
    </div>
  )
}
