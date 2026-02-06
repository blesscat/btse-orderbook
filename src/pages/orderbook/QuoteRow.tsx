import { useEffect, useState, useRef, memo } from 'react'
import type { OrderBookLevel } from '../../ws-manager'
import { formatNumber, calculateAccumulativeTotal } from './utils'

interface QuoteRowProps {
  level: OrderBookLevel
  isBid: boolean
  index: number
  totalLevels: OrderBookLevel[]
  maxTotal: number
  prevPrice: string | null
}

export const QuoteRow = memo(({ level, isBid, index, totalLevels, maxTotal, prevPrice }: QuoteRowProps) => {
  const [priceChange, setPriceChange] = useState<'up' | 'down' | 'same'>('same')
  const [isNew, setIsNew] = useState(false)
  const [sizeChange, setSizeChange] = useState<'increase' | 'decrease' | 'same'>('same')
  const prevPriceRef = useRef(level.price)
  const prevSizeRef = useRef(level.size)

  useEffect(() => {
    // 檢查是否為新報價
    if (prevPrice && level.price !== prevPrice) {
      setIsNew(true)
      setTimeout(() => setIsNew(false), 600)
    }

    // 檢查價格變化
    if (prevPriceRef.current !== level.price) {
      const current = parseFloat(level.price)
      const previous = parseFloat(prevPriceRef.current)
      setPriceChange(current > previous ? 'up' : current < previous ? 'down' : 'same')
      prevPriceRef.current = level.price
    }

    // 檢查數量變化
    if (prevSizeRef.current !== level.size) {
      const current = parseFloat(level.size)
      const previous = parseFloat(prevSizeRef.current)
      setSizeChange(current > previous ? 'increase' : current < previous ? 'decrease' : 'same')
      setTimeout(() => setSizeChange('same'), 600)
      prevSizeRef.current = level.size
    }
  }, [level.price, level.size, prevPrice])

  const price = parseFloat(level.price)
  const size = parseFloat(level.size)
  const total = price * size
  const accTotal = calculateAccumulativeTotal(totalLevels, index, isBid)
  const percentage = (accTotal / maxTotal) * 100

  // 價格顏色樣式
  const getPriceStyle = () => {
    if (priceChange === 'up') {
      return 'text-[#00b15d] bg-[rgba(16,186,104,0.12)]'
    } else if (priceChange === 'down') {
      return 'text-[#ff5b5a] bg-[rgba(255,90,90,0.12)]'
    }
    return 'text-[#f0f4f8] bg-[rgba(134,152,170,0.12)]'
  }

  // 新報價動畫樣式
  const getRowAnimationClass = () => {
    if (isNew) {
      return isBid ? 'animate-flash-green' : 'animate-flash-red'
    }
    return ''
  }

  // 數量變化動畫
  const getSizeAnimationClass = () => {
    if (sizeChange === 'increase') {
      return 'animate-pulse-green'
    } else if (sizeChange === 'decrease') {
      return 'animate-pulse-red'
    }
    return ''
  }

  return (
    <div
      className={`relative grid grid-cols-3 gap-4 px-4 py-2 font-mono text-sm transition-all hover:bg-white/5 ${getRowAnimationClass()}`}
    >
      {/* 背景進度條 */}
      <div
        className={`absolute inset-y-0 ${isBid ? 'right-0' : 'left-0'} transition-all duration-300`}
        style={{
          width: `${percentage}%`,
          background: isBid
            ? 'linear-gradient(to left, rgba(16, 186, 104, 0.1), transparent)'
            : 'linear-gradient(to right, rgba(255, 90, 90, 0.1), transparent)',
        }}
      />

      {/* 價格 */}
      <div className={`relative text-center ${getPriceStyle()} rounded px-2 py-1 transition-all duration-200`}>
        {formatNumber(price)}
      </div>

      {/* 數量 */}
      <div className={`relative text-center text-[#e0e6ed] ${getSizeAnimationClass()}`}>{formatNumber(size)}</div>

      {/* 總計 */}
      <div className="relative text-center text-[#8898aa]">{formatNumber(total)}</div>
    </div>
  )
})

QuoteRow.displayName = 'QuoteRow'
