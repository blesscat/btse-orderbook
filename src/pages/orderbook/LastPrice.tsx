import { formatNumber } from './utils'

interface LastPriceProps {
  price: number
}

export function LastPrice({ price }: LastPriceProps) {
  return (
    <div className="border-b border-[#1e2329] bg-[#0f1419] px-4 py-4">
      <div className="flex items-center justify-center gap-3">
        <span className="font-['JetBrains_Mono'] text-2xl font-bold text-[#00b15d]">{formatNumber(price)}</span>
        <span className="text-[#00b15d]">↑</span>
      </div>
    </div>
  )
}
