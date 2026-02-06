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

  return (
    <div className={`grid grid-cols-[1fr_1fr_2fr] gap-4 px-4 py-1 font-mono text-sm text-text-primary hover:bg-row-hover transition-colors`}>
      <span className={priceColor}>{formatNumber(row.price, 1)}</span>
      <span className="text-right">{formatNumber(row.size)}</span>
      <span className="text-right text-text-secondary">{formatNumber(row.total)}</span>
    </div>
  )
}
