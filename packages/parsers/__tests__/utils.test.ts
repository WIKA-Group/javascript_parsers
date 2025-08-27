import { describe, expect, it } from 'vitest'
import { DEFAULT_ROUNDING_DECIMALS, getRoundingDecimals, hexStringToIntArray, numbersToIntArray, numberToIntArray, percentageToValue, TULIPValueToValue } from '../src/utils'

describe('numberToIntArray', () => {
  it('should convert a 4-byte number to byte array correctly', () => {
    expect(numberToIntArray(0x12345678, 4)).toEqual([0x12, 0x34, 0x56, 0x78])
  })

  it('should convert a 2-byte number to byte array correctly', () => {
    expect(numberToIntArray(0x1234, 2)).toEqual([0x12, 0x34])
  })

  it('should convert single byte number correctly', () => {
    expect(numberToIntArray(0x12, 1)).toEqual([0x12])
  })

  it('should pad with zeros when number is smaller than byte length', () => {
    expect(numberToIntArray(2, 2)).toEqual([0x00, 0x02])
    expect(numberToIntArray(5, 3)).toEqual([0x00, 0x00, 0x05])
  })

  it('should handle zero value', () => {
    expect(numberToIntArray(0, 2)).toEqual([0x00, 0x00])
  })

  it('should handle maximum values for different byte lengths', () => {
    expect(numberToIntArray(0xFF, 1)).toEqual([0xFF])
    expect(numberToIntArray(0xFFFF, 2)).toEqual([0xFF, 0xFF])
    expect(numberToIntArray(0xFFFFFF, 3)).toEqual([0xFF, 0xFF, 0xFF])
  })

  it('should handle edge case with larger byte lengths', () => {
    expect(numberToIntArray(0x123, 4)).toEqual([0x00, 0x00, 0x01, 0x23])
  })
})

describe('numbersToIntArray', () => {
  it('should convert multiple numbers to flattened byte array', () => {
    const input = [
      { value: 0x1234, bytes: 2 },
      { value: 0x5678, bytes: 2 },
    ]
    expect(numbersToIntArray(input)).toEqual([0x12, 0x34, 0x56, 0x78])
  })

  it('should handle numbers with different byte lengths', () => {
    const input = [
      { value: 0x12, bytes: 1 },
      { value: 0x3456, bytes: 2 },
      { value: 0x789ABC, bytes: 3 },
    ]
    expect(numbersToIntArray(input)).toEqual([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC])
  })

  it('should handle the provided example correctly', () => {
    const input = [
      { value: 7200, bytes: 4 },
      { value: 1, bytes: 2 },
      { value: 7200, bytes: 4 },
      { value: 1, bytes: 2 },
    ]
    expect(numbersToIntArray(input)).toEqual([
      0x00,
      0x00,
      0x1C,
      0x20,
      0x00,
      0x01,
      0x00,
      0x00,
      0x1C,
      0x20,
      0x00,
      0x01,
    ])
  })

  it('should handle empty array', () => {
    expect(numbersToIntArray([])).toEqual([])
  })

  it('should handle single number', () => {
    expect(numbersToIntArray([{ value: 0xAB, bytes: 1 }])).toEqual([0xAB])
  })

  it('should handle zero values', () => {
    const input = [
      { value: 0, bytes: 2 },
      { value: 0, bytes: 1 },
    ]
    expect(numbersToIntArray(input)).toEqual([0x00, 0x00, 0x00])
  })
})

describe('hexStringToIntArray', () => {
  describe('valid hex strings', () => {
    it('should convert basic hex string to int array', () => {
      expect(hexStringToIntArray('1234')).toEqual([0x12, 0x34])
    })

    it('should handle hex string with 0x prefix', () => {
      expect(hexStringToIntArray('0x1234')).toEqual([0x12, 0x34])
    })

    it('should handle hex string with spaces', () => {
      expect(hexStringToIntArray('12 34')).toEqual([0x12, 0x34])
      expect(hexStringToIntArray('12 34 56')).toEqual([0x12, 0x34, 0x56])
    })

    it('should handle mixed case hex characters', () => {
      expect(hexStringToIntArray('AbCd')).toEqual([0xAB, 0xCD])
      expect(hexStringToIntArray('0xAbCd')).toEqual([0xAB, 0xCD])
    })

    it('should handle single byte', () => {
      expect(hexStringToIntArray('FF')).toEqual([0xFF])
    })

    it('should handle multiple spaces', () => {
      expect(hexStringToIntArray('12  34   56')).toEqual([0x12, 0x34, 0x56])
    })

    it('should handle combination of prefix and spaces', () => {
      expect(hexStringToIntArray('0x12 34')).toEqual([0x12, 0x34])
    })

    it('should handle empty string after cleaning', () => {
      expect(hexStringToIntArray('0x')).toEqual(null)
    })

    it('should handle long hex strings', () => {
      expect(hexStringToIntArray('123456789ABCDEF0')).toEqual([
        0x12,
        0x34,
        0x56,
        0x78,
        0x9A,
        0xBC,
        0xDE,
        0xF0,
      ])
    })
  })

  describe('invalid hex strings', () => {
    it('should return null for completely invalid hex string', () => {
      expect(hexStringToIntArray('xyz')).toBeNull()
    })

    it('should return null for string with invalid characters', () => {
      expect(hexStringToIntArray('12g4')).toBeNull()
    })

    it('should return null for string with special characters', () => {
      expect(hexStringToIntArray('12!34')).toBeNull()
    })

    it('should return null for mixed valid/invalid characters', () => {
      expect(hexStringToIntArray('12zz')).toBeNull()
    })

    it('should return null for string with numbers and letters not in hex range', () => {
      expect(hexStringToIntArray('12GH')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle odd-length hex strings by treating them as pairs', () => {
      // Note: depending on implementation, this might need special handling
      // For now, testing current behavior
      expect(hexStringToIntArray('123')).toEqual([0x12, 0x03])
    })

    it('should handle single hex character', () => {
      expect(hexStringToIntArray('A')).toEqual([0x0A])
    })
  })
})

describe('percentageToValue', () => {
  describe('valid percentages', () => {
    it('should convert 50% to middle value', () => {
      expect(percentageToValue(50, { min: 0, max: 100 })).toBe(50)
    })

    it('should convert 0% to minimum value', () => {
      expect(percentageToValue(0, { min: 5, max: 15 })).toBe(5)
    })

    it('should convert 100% to maximum value', () => {
      expect(percentageToValue(100, { min: 5, max: 15 })).toBe(15)
    })

    it('should handle negative ranges', () => {
      expect(percentageToValue(25, { min: -10, max: 10 })).toBe(-5)
    })

    it('should handle inverted ranges (min > max)', () => {
      expect(percentageToValue(50, { min: 10, max: 0 })).toBe(5)
    })

    it('should handle decimal percentages', () => {
      expect(percentageToValue(33.33, { min: 0, max: 30 })).toBeCloseTo(9.999, 2)
    })

    it('should handle zero range (min = max)', () => {
      expect(percentageToValue(50, { min: 5, max: 5 })).toBe(5)
    })

    it('should handle fractional ranges', () => {
      expect(percentageToValue(25, { min: 0.5, max: 1.5 })).toBe(0.75)
    })

    it('should handle large ranges', () => {
      expect(percentageToValue(10, { min: 1000, max: 2000 })).toBe(1100)
    })
  })

  describe('boundary conditions', () => {
    it('should handle exactly 0%', () => {
      expect(percentageToValue(0, { min: -100, max: 100 })).toBe(-100)
    })

    it('should handle exactly 100%', () => {
      expect(percentageToValue(100, { min: -100, max: 100 })).toBe(100)
    })
  })

  describe('invalid percentages', () => {
    it('should throw RangeError for negative percentage', () => {
      expect(() => percentageToValue(-1, { min: 0, max: 100 }))
        .toThrow('Percentage must be between 0 and 100')
    })

    it('should throw RangeError for percentage over 100', () => {
      expect(() => percentageToValue(101, { min: 0, max: 100 }))
        .toThrow('Percentage must be between 0 and 100')
    })

    it('should throw RangeError for significantly negative percentage', () => {
      expect(() => percentageToValue(-50, { min: 0, max: 100 }))
        .toThrow(RangeError)
    })

    it('should throw RangeError for significantly over 100 percentage', () => {
      expect(() => percentageToValue(200, { min: 0, max: 100 }))
        .toThrow(RangeError)
    })
  })

  describe('special numeric values', () => {
    it('should handle very small percentages', () => {
      expect(percentageToValue(0.01, { min: 0, max: 1000 })).toBe(0.1)
    })

    it('should handle very precise percentages', () => {
      expect(percentageToValue(33.333333, { min: 0, max: 3 })).toBeCloseTo(1, 5)
    })
  })
})

describe('tULIPValueToValue', () => {
  describe('boundary values', () => {
    it('should convert minimum TULIP value (2500) to minimum range value', () => {
      expect(TULIPValueToValue(2500, { min: 0, max: 100 })).toBe(0)
      expect(TULIPValueToValue(2500, { min: -10, max: 10 })).toBe(-10)
      expect(TULIPValueToValue(2500, { min: 5, max: 15 })).toBe(5)
    })

    it('should convert maximum TULIP value (12500) to maximum range value', () => {
      expect(TULIPValueToValue(12500, { min: 0, max: 100 })).toBe(100)
      expect(TULIPValueToValue(12500, { min: -10, max: 10 })).toBe(10)
      expect(TULIPValueToValue(12500, { min: 5, max: 15 })).toBe(15)
    })

    it('should convert middle TULIP value (7500) to middle range value', () => {
      expect(TULIPValueToValue(7500, { min: 0, max: 100 })).toBe(50)
      expect(TULIPValueToValue(7500, { min: -10, max: 10 })).toBe(0)
      expect(TULIPValueToValue(7500, { min: 5, max: 15 })).toBe(10)
    })
  })

  describe('specific test values', () => {
    it('should convert TULIP value 3000 correctly', () => {
      // 3000 = 5% of TULIP scale (500/10000)
      expect(TULIPValueToValue(3000, { min: 0, max: 100 })).toBe(5)
      expect(TULIPValueToValue(3000, { min: -10, max: 10 })).toBe(-9)
      expect(TULIPValueToValue(3000, { min: 0, max: 20 })).toBe(1)
    })

    it('should convert TULIP value 5000 correctly', () => {
      // 5000 = 25% of TULIP scale (2500/10000)
      expect(TULIPValueToValue(5000, { min: 0, max: 100 })).toBe(25)
      expect(TULIPValueToValue(5000, { min: -10, max: 10 })).toBe(-5)
      expect(TULIPValueToValue(5000, { min: 0, max: 20 })).toBe(5)
    })

    it('should convert TULIP value 6000 correctly', () => {
      // 6000 = 35% of TULIP scale (3500/10000)
      expect(TULIPValueToValue(6000, { min: 0, max: 100 })).toBe(35)
      expect(TULIPValueToValue(6000, { min: -10, max: 10 })).toBe(-3)
      expect(TULIPValueToValue(6000, { min: 0, max: 20 })).toBe(7)
    })

    it('should convert TULIP value 10000 correctly', () => {
      // 10000 = 75% of TULIP scale (7500/10000)
      expect(TULIPValueToValue(10000, { min: 0, max: 100 })).toBe(75)
      expect(TULIPValueToValue(10000, { min: -10, max: 10 })).toBe(5)
      expect(TULIPValueToValue(10000, { min: 0, max: 20 })).toBe(15)
    })

    it('should convert TULIP value 11250 correctly', () => {
      // 11250 = 87.5% of TULIP scale (8750/10000)
      expect(TULIPValueToValue(11250, { min: 0, max: 100 })).toBe(87.5)
      expect(TULIPValueToValue(11250, { min: -10, max: 10 })).toBe(7.5)
      expect(TULIPValueToValue(11250, { min: 0, max: 8 })).toBe(7)
    })
  })

  describe('quarter values', () => {
    it('should convert quarter TULIP values correctly', () => {
      // 25% = 5000
      expect(TULIPValueToValue(5000, { min: 0, max: 100 })).toBe(25)

      // 50% = 7500
      expect(TULIPValueToValue(7500, { min: 0, max: 100 })).toBe(50)

      // 75% = 10000
      expect(TULIPValueToValue(10000, { min: 0, max: 100 })).toBe(75)
    })
  })

  describe('edge cases and special ranges', () => {
    it('should handle zero range (min = max)', () => {
      expect(TULIPValueToValue(7500, { min: 5, max: 5 })).toBe(5)
      expect(TULIPValueToValue(2500, { min: 10, max: 10 })).toBe(10)
      expect(TULIPValueToValue(12500, { min: -3, max: -3 })).toBe(-3)
    })

    it('should handle inverted ranges (min > max)', () => {
      expect(TULIPValueToValue(2500, { min: 10, max: 0 })).toBe(10)
      expect(TULIPValueToValue(12500, { min: 10, max: 0 })).toBe(0)
      expect(TULIPValueToValue(7500, { min: 10, max: 0 })).toBe(5)
    })

    it('should handle fractional ranges', () => {
      expect(TULIPValueToValue(2500, { min: 0.5, max: 1.5 })).toBe(0.5)
      expect(TULIPValueToValue(12500, { min: 0.5, max: 1.5 })).toBe(1.5)
      expect(TULIPValueToValue(7500, { min: 0.5, max: 1.5 })).toBe(1.0)
    })

    it('should handle large ranges', () => {
      expect(TULIPValueToValue(2500, { min: 1000, max: 2000 })).toBe(1000)
      expect(TULIPValueToValue(12500, { min: 1000, max: 2000 })).toBe(2000)
      expect(TULIPValueToValue(5000, { min: 1000, max: 2000 })).toBe(1250)
    })

    it('should handle negative ranges', () => {
      expect(TULIPValueToValue(2500, { min: -100, max: -50 })).toBe(-100)
      expect(TULIPValueToValue(12500, { min: -100, max: -50 })).toBe(-50)
      expect(TULIPValueToValue(7500, { min: -100, max: -50 })).toBe(-75)
    })
  })

  describe('precision tests', () => {
    it('should handle precise decimal calculations', () => {
      // Test with values that might introduce floating point precision issues
      expect(TULIPValueToValue(3333, { min: 0, max: 3 })).toBeCloseTo(0.2499, 4)
      expect(TULIPValueToValue(8333, { min: 0, max: 12 })).toBeCloseTo(6.9996, 4)
    })

    it('should maintain precision with very small ranges', () => {
      expect(TULIPValueToValue(7500, { min: 0.001, max: 0.002 })).toBeCloseTo(0.0015, 6)
    })
  })

  describe('invalid TULIP values', () => {
    it('should throw RangeError for values below 2500', () => {
      expect(() => TULIPValueToValue(2499, { min: 0, max: 100 }))
        .toThrow('TULIP scale value must be between 2500 and 12500, is 2499')
    })

    it('should throw RangeError for values above 12500', () => {
      expect(() => TULIPValueToValue(12501, { min: 0, max: 100 }))
        .toThrow('TULIP scale value must be between 2500 and 12500, is 12501')
    })

    it('should throw RangeError for significantly out of range values', () => {
      expect(() => TULIPValueToValue(0, { min: 0, max: 100 }))
        .toThrow(RangeError)

      expect(() => TULIPValueToValue(20000, { min: 0, max: 100 }))
        .toThrow(RangeError)

      expect(() => TULIPValueToValue(-1000, { min: 0, max: 100 }))
        .toThrow(RangeError)
    })
  })

  describe('real-world sensor scenarios', () => {
    it('should convert temperature sensor values correctly', () => {
      // Temperature range: -40°C to +85°C
      expect(TULIPValueToValue(2500, { min: -40, max: 85 })).toBe(-40) // 0%
      expect(TULIPValueToValue(7500, { min: -40, max: 85 })).toBe(22.5) // 50%
      expect(TULIPValueToValue(12500, { min: -40, max: 85 })).toBe(85) // 100%
    })

    it('should convert pressure sensor values correctly', () => {
      // Pressure range: 0 to 10 bar
      expect(TULIPValueToValue(2500, { min: 0, max: 10 })).toBe(0) // 0%
      expect(TULIPValueToValue(5000, { min: 0, max: 10 })).toBe(2.5) // 25%
      expect(TULIPValueToValue(10000, { min: 0, max: 10 })).toBe(7.5) // 75%
      expect(TULIPValueToValue(12500, { min: 0, max: 10 })).toBe(10) // 100%
    })

    it('should convert flow sensor values correctly', () => {
      // Flow range: 0 to 100 L/min
      expect(TULIPValueToValue(3750, { min: 0, max: 100 })).toBe(12.5) // 12.5%
      expect(TULIPValueToValue(6250, { min: 0, max: 100 })).toBe(37.5) // 37.5%
      expect(TULIPValueToValue(8750, { min: 0, max: 100 })).toBe(62.5) // 62.5%
    })
  })
})

describe('getRoundingDecimals', () => {
  it('returns fallback (currentDecimals) if roundingDecimals is undefined', () => {
    expect(getRoundingDecimals(undefined, 2)).toBe(2)
    expect(getRoundingDecimals(undefined, 0)).toBe(0)
    expect(getRoundingDecimals(undefined, undefined)).toBe(DEFAULT_ROUNDING_DECIMALS)
  })

  it('returns Math.floor(roundingDecimals) if >= 0', () => {
    expect(getRoundingDecimals(3.7, 2)).toBe(3)
    expect(getRoundingDecimals(0.9, 2)).toBe(0)
    expect(getRoundingDecimals(5, 2)).toBe(5)
    expect(getRoundingDecimals(0, 2)).toBe(0)
  })

  it('returns fallback (currentDecimals) if Math.floor(roundingDecimals) < 0', () => {
    expect(getRoundingDecimals(-1, 2)).toBe(2)
    expect(getRoundingDecimals(-0.1, 3)).toBe(3)
    expect(getRoundingDecimals(-5, undefined)).toBe(DEFAULT_ROUNDING_DECIMALS)
  })

  it('handles edge cases', () => {
    expect(getRoundingDecimals(Number.NaN, 2)).toBe(2)
    expect(getRoundingDecimals(Infinity, 2)).toBe(Infinity)
    expect(getRoundingDecimals(-Infinity, 2)).toBe(2)
  })
})
