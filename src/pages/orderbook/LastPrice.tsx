import { useEffect, useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import { useAtomValue, useSetAtom } from 'jotai'
import { subscribeAtom, unsubscribeAtom, lastPriceAtom } from '@/ws-manager/lastprice'
import { TRADE_BRCPFC } from '@/constants'
import { formatNumber } from './utils'

const increase = { color: 'var(--color-green-quote)', bg: 'var(--color-green-12)' }
const decrease = { color: 'var(--color-red-quote)', bg: 'var(--color-red-12)' }
const normal = { color: 'var(--color-text-primary)', bg: 'var(--color-normal-12)' }

export default function LastPrice({ className }: { className?: string }) {
  const subscribe = useSetAtom(subscribeAtom)
  const unsubscribe = useSetAtom(unsubscribeAtom)
  const lastPrice = useAtomValue(lastPriceAtom)

  useEffect(() => {
    subscribe(TRADE_BRCPFC)
    return () => unsubscribe(TRADE_BRCPFC)
  }, [subscribe, unsubscribe])

  const colors = useMemo(() => {
    switch (lastPrice?.priceChanged) {
      case 'increase':
        return increase
      case 'decrease':
        return decrease
      case 'normal':
        return normal
    }
  }, [lastPrice])

  return (
    <div className={twMerge('text-center', className)} style={{ color: colors?.color, background: colors?.bg }}>
      {formatNumber(lastPrice?.price, 1)}
    </div>
  )
}
