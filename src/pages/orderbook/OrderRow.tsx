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
    <div
      className={`text-text-primary hover:bg-row-hover grid grid-cols-[1fr_1fr_1.5fr] py-1 font-mono text-sm transition-colors`}
    >
      <span className={priceColor}>{formatNumber(row.price, 1)}</span>
      <span className="text-right">{formatNumber(row.size)}</span>
      <span className="text-text-secondary text-right">{formatNumber(row.total)}</span>
    </div>
  )
}
