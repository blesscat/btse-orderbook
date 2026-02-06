import type { OrderBookLevel } from '../../ws-manager'

// 格式化數字，加入千分位逗號
export const formatNumber = (num: string | number): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num
  return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// 計算累積總量
export const calculateAccumulativeTotal = (levels: OrderBookLevel[], index: number, isBid: boolean): number => {
  if (isBid) {
    // 買單：從最高價累積到最低價
    return levels.slice(0, index + 1).reduce((sum, level) => sum + parseFloat(level.size), 0)
  } else {
    // 賣單：從最低價累積到最高價
    return levels.slice(0, index + 1).reduce((sum, level) => sum + parseFloat(level.size), 0)
  }
}
