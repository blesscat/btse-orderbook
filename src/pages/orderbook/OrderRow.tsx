import { useMemo } from 'react'
import { twJoin } from 'tailwind-merge'
import { useAtomValue, type Atom } from 'jotai'
import { type OrderBookLevel } from '@/atoms'
import { formatNumber } from './utils'

interface OrderRowProps {
  rowAtom: Atom<OrderBookLevel>
  type: 'bid' | 'ask'
}

export default function OrderRow({ rowAtom, type }: OrderRowProps) {
  const row = useAtomValue(rowAtom)
  const priceColor = type === 'bid' ? 'text-buy-quote' : 'text-sell-quote'
  const flashAnimation = row.isNewOrder ? (type === 'bid' ? 'animate-flash-green' : 'animate-flash-red') : ''

  const sizeAnimation = useMemo(() => {
    // Size change animation - only if not a new order
    if (row.isNewOrder) return ''
    if (!row.sizeChanged) return ''
    if (row.sizeChanged === 'increase') return 'animate-flash-green'
    return 'animate-flash-red'
  }, [row])

  return (
    <div
      className={twJoin(
        'grid grid-cols-[1fr_1fr_1.5fr] py-1 font-mono text-sm',
        'text-text-primary hover:bg-row-hover cursor-pointer transition-colors',
        flashAnimation
      )}
    >
      <span className={priceColor}>{formatNumber(row.price, 1)}</span>
      <span className={twJoin('text-right', sizeAnimation)}>{formatNumber(row.size)}</span>
      <span className="text-text-secondary text-right">{formatNumber(row.total)}</span>
    </div>
  )
}
