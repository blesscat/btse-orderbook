import { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { subscribeAtom, unsubscribeAtom, lastPriceAtom } from '@/ws-manager/lastprice'
import { TRADE_BRCPFC } from '@/constants'

export default function LastPrice() {
  const subscribe = useSetAtom(subscribeAtom)
  const unsubscribe = useSetAtom(unsubscribeAtom)
  const lastPrice = useAtomValue(lastPriceAtom)
  console.log('lastPrice', lastPrice)

  useEffect(() => {
    subscribe(TRADE_BRCPFC)
    return () => unsubscribe(TRADE_BRCPFC)
  }, [subscribe, unsubscribe])

  return <div>lastPrice</div>
}
