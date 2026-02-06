import { useAtomValue, type Atom } from 'jotai'
import { type OrderBookLevel } from '@/atoms'
import { formatNumber } from './utils'

export default function OrderRow({ rowAtom }: { rowAtom: Atom<OrderBookLevel> }) {
  const row = useAtomValue(rowAtom)

  return (
    <div className="grid grid-cols-[1fr_1fr_2fr]">
      <span>{formatNumber(row.price, 1)}</span>
      <span className="pr-[5px] text-right">{formatNumber(row.size)}</span>
      <span className="text-right">{formatNumber(row.total)}</span>
    </div>
  )
}
