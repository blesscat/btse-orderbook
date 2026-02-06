export const formatNumber = (num: string | number, fractionDigits?: number): string => {
  const n = Number(num)

  if (fractionDigits !== undefined) {
    return n.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
  }

  // Check if the number is an integer
  if (Number.isInteger(n)) {
    return n.toLocaleString('en-US')
  }

  // For decimal numbers, keep original decimal places
  return n.toLocaleString('en-US')
}
