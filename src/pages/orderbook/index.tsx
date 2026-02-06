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
    <div className="min-h-screen">
      <div className="grid grid-cols-[1fr_1fr_2fr]">
        <span> Price (USD) </span>
        <span className="text-right"> Size </span>
        <span className="text-right">Total </span>
      </div>

      <div>
        {asksAtoms.map((asksAtom) => (
          <OrderRow key={`${asksAtom}`} rowAtom={asksAtom} />
        ))}
      </div>

      <div className="mt-[20px]">
        {bidsAtoms.map((bidsAtom) => (
          <OrderRow key={`${bidsAtom}`} rowAtom={bidsAtom} />
        ))}
      </div>
    </div>
  )
}
