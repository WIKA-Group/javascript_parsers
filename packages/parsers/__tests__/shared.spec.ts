import { describe, expect, it } from 'vitest'
import { numbersToIntArray, numberToIntArray } from '../src/shared'

describe('numberToIntArray', () => {
  it('should convert a number to an array of bytes', () => {
    expect(numberToIntArray(0x12345678, 4)).toEqual([0x12, 0x34, 0x56, 0x78])
  })

  it('should convert single byte number correctly', () => {
    expect(numberToIntArray(0x12, 1)).toEqual([0x12])
  })
})

describe('numbersToIntArray', () => {
  it('should convert an array of numbers to an array of bytes', () => {
    expect(numbersToIntArray([{ value: 7200, bytes: 4 }, { value: 1, bytes: 2 }, { value: 7200, bytes: 4 }, { value: 1, bytes: 2 }])).toEqual([0x00, 0x00, 0x1C, 0x20, 0x00, 0x01, 0x00, 0x00, 0x1C, 0x20, 0x00, 0x01])
  })
})
