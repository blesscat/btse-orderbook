import { useMemo } from 'react'
import { twJoin } from 'tailwind-merge'
import { useAtomValue, type Atom } from 'jotai'
import { type OrderBookLevel } from '@/atoms'
import { formatNumber } from './utils'

interface OrderRowProps {
  rowAtom: Atom<OrderBookLevel>
  type: 'bid' | 'ask'
}

const bid = {
  priceColor: 'text-buy-quote',
  flashAnimation: 'animate-flash-green',
  barColor: 'bg-[rgba(16,186,104,0.12)]',
} as const

const ask = {
  priceColor: 'text-sell-quote',
  flashAnimation: 'animate-flash-red',
  barColor: 'bg-[rgba(255,90,90,0.12)]',
} as const

export default function OrderRow({ rowAtom, type }: OrderRowProps) {
  const row = useAtomValue(rowAtom)

  const sizeAnimation = useMemo(() => {
    // Size change animation - only if not a new order
    if (row.isNewOrder) return ''
    if (!row.sizeChanged) return ''
    if (row.sizeChanged === 'increase') return 'animate-flash-green'
    return 'animate-flash-red'
  }, [row])

  const config = useMemo(() => {
    return type === 'bid' ? bid : ask
  }, [type])

  return (
    <div
      className={twJoin(
        'grid grid-cols-[1fr_1fr_1.5fr] py-1 font-mono text-sm',
        'text-text-primary hover:bg-row-hover cursor-pointer transition-colors',
        row.isNewOrder && config.flashAnimation
      )}
    >
      <span className={config.priceColor}>{formatNumber(row.price, 1)}</span>
      <span className={twJoin('text-right', sizeAnimation)}>{formatNumber(row.size)}</span>
      <span className="text-text-secondary relative text-right">
        <div
          className={twJoin('absolute inset-y-0 right-0', config.barColor)}
          style={{ width: `${row.percentage}%` }}
        />
        <span className="relative z-10">{formatNumber(row.total)}</span>
      </span>
    </div>
  )
}
