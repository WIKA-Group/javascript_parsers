import type { Frame } from '../shared'
import { describe, expect, it } from 'vitest'
import { FirstFitDecreasing } from '../ffd'

describe('firstFitDecreasing', () => {
  it('should handle empty input', () => {
    const result = FirstFitDecreasing([], 10)
    expect(result).toEqual([])
  })

  it('should handle single packet fitting within limit', () => {
    const packets: Frame[] = [[1, 2, 3]]
    const result = FirstFitDecreasing(packets, 10)
    expect(result).toEqual([[1, 2, 3]])
  })

  it('should handle single packet exceeding limit', () => {
    const packets: Frame[] = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]
    expect(() => FirstFitDecreasing(packets, 10)).toThrow('Packet is too big to fit in any bin')
  })

  it('should handle multiple packets fitting within limit', () => {
    const packets: Frame[] = [[1, 2], [3, 4], [5, 6]]
    const result = FirstFitDecreasing(packets, 10)
    expect(result).toEqual([[1, 2, 3, 4, 5, 6]])
  })

  it('should handle multiple packets exceeding limit', () => {
    const packets: Frame[] = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    const result = FirstFitDecreasing(packets, 6)
    expect(result).toEqual([[1, 2, 3, 4, 5, 6], [7, 8, 9]])
  })

  it('should handle packets with varying sizes', () => {
    const packets: Frame[] = [[1, 2, 3], [4], [5, 6, 7, 8], [9]]
    const result = FirstFitDecreasing(packets, 10)
    expect(result).toEqual([[5, 6, 7, 8, 1, 2, 3, 4, 9]])
  })

  it('should handle packets that exactly fit the limit', () => {
    const packets: Frame[] = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    const result = FirstFitDecreasing(packets, 9)
    expect(result).toEqual([[1, 2, 3, 4, 5, 6, 7, 8, 9]])
  })

  it('should handle packets that need to be split into multiple bins', () => {
    const packets: Frame[] = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]
    const result = FirstFitDecreasing(packets, 6)
    expect(result).toEqual([[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]])
  })

  it('should throw an error if a packet is too big', () => {
    const packets: Frame[] = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]
    expect(() => FirstFitDecreasing(packets, 10)).toThrow('Packet is too big to fit in any bin')
  })

  it('should handle float limits by using Math.floor', () => {
    const packets: Frame[] = [[1, 2, 3]]
    const result = FirstFitDecreasing(packets, 10.5)
    expect(result).toEqual([[1, 2, 3]])
  })

  it('should throw an error if the limit is 0', () => {
    const packets: Frame[] = [[1, 2, 3]]
    expect(() => FirstFitDecreasing(packets, 0)).toThrow('Limit must be greater than 0')
  })
})
