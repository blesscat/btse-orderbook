import { useAtomValue } from 'jotai'
import { splitBidsAtom, type OrderBookLevel } from '../../atoms'
import OrderRow from './OrderRow'

export default function OrderBookPanel() {
  const bidsAtoms = useAtomValue(splitBidsAtom)
  return (
    <div>
      {bidsAtoms.map((bidsAtom) => (
        <OrderRow key={`${bidsAtom}`} rowAtom={bidsAtom} />
      ))}
    </div>
  )
}
