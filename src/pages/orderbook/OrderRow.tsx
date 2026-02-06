import { useAtomValue, type Atom } from 'jotai'
import { type OrderBookLevel } from '../../atoms'
import { formatNumber } from './utils'

export default function OrderRow({ rowAtom }: { rowAtom: Atom<OrderBookLevel> }) {
  const row = useAtomValue(rowAtom)
  const total = parseFloat(row.price) * parseFloat(row.size)

  return (
    <div className="grid grid-cols-3">
      <span>{formatNumber(row.price, 1)}</span>
      <span>{formatNumber(row.size)}</span>
      <span className="text-right">{formatNumber(total)}</span>
    </div>
  )
}
