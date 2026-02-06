import { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { subscribeAtom, unsubscribeAtom, connectionStatusAtom } from '../../ws-manager'
import { UPDATE_BTCPFC } from '../../constants'
import { splitBidsAtom } from '../../atoms'
import { Header } from './Header'
import OrderRow from './OrderRow'

export default function OrderBookPage() {
  const subscribe = useSetAtom(subscribeAtom)
  const unsubscribe = useSetAtom(unsubscribeAtom)
  const status = useAtomValue(connectionStatusAtom)
  const bidsAtoms = useAtomValue(splitBidsAtom)

  useEffect(() => {
    subscribe(UPDATE_BTCPFC)
    // return () => unsubscribe(UPDATE_TOPIC)
  }, [subscribe, unsubscribe])

  return (
    <div className="min-h-screen">
      <Header status={status} />
      <div>
        {bidsAtoms.splice(0, 8).map((bidsAtom) => (
          <OrderRow key={`${bidsAtom}`} rowAtom={bidsAtom} />
        ))}
      </div>
    </div>
  )
}
