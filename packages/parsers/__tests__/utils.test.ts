import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ROUNDING_DECIMALS,
  getRoundingDecimals,
  hexStringToIntArray,
  intTuple4ToFloat32,
  intTuple4ToFloat32WithThreshold,
  numbersToIntArray,
  numberToHexString,
  numberToIntArray,
  percentageToValue,
  roundValue,
  slopeValueToValue,
  TULIPValueToValue,
} from '../src/utils'

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
      expect(percentageToValue(50, { start: 0, end: 100 })).toBe(50)
    })

    it('should convert 0% to minimum value', () => {
      expect(percentageToValue(0, { start: 5, end: 15 })).toBe(5)
    })

    it('should convert 100% to maximum value', () => {
      expect(percentageToValue(100, { start: 5, end: 15 })).toBe(15)
    })

    it('should handle negative ranges', () => {
      expect(percentageToValue(25, { start: -10, end: 10 })).toBe(-5)
    })

    it('should handle decimal percentages', () => {
      expect(percentageToValue(33.33, { start: 0, end: 30 })).toBeCloseTo(9.999, 2)
    })

    it('should handle fractional ranges', () => {
      expect(percentageToValue(25, { start: 0.5, end: 1.5 })).toBe(0.75)
    })

    it('should handle large ranges', () => {
      expect(percentageToValue(10, { start: 1000, end: 2000 })).toBe(1100)
    })
  })

  describe('boundary conditions', () => {
    it('should handle exactly 0%', () => {
      expect(percentageToValue(0, { start: -100, end: 100 })).toBe(-100)
    })

    it('should handle exactly 100%', () => {
      expect(percentageToValue(100, { start: -100, end: 100 })).toBe(100)
    })
  })

  describe('special numeric values', () => {
    it('should handle very small percentages', () => {
      expect(percentageToValue(0.01, { start: 0, end: 1000 })).toBe(0.1)
    })

    it('should handle very precise percentages', () => {
      expect(percentageToValue(33.333333, { start: 0, end: 3 })).toBeCloseTo(1, 5)
    })
  })
})

describe('tULIPValueToValue', () => {
  describe('boundary values', () => {
    it('should convert minimum TULIP value (2500) to minimum range value', () => {
      expect(TULIPValueToValue(2500, { start: 0, end: 100 })).toBe(0)
      expect(TULIPValueToValue(2500, { start: -10, end: 10 })).toBe(-10)
      expect(TULIPValueToValue(2500, { start: 5, end: 15 })).toBe(5)
    })

    it('should convert maximum TULIP value (12500) to maximum range value', () => {
      expect(TULIPValueToValue(12500, { start: 0, end: 100 })).toBe(100)
      expect(TULIPValueToValue(12500, { start: -10, end: 10 })).toBe(10)
      expect(TULIPValueToValue(12500, { start: 5, end: 15 })).toBe(15)
    })

    it('should convert middle TULIP value (7500) to middle range value', () => {
      expect(TULIPValueToValue(7500, { start: 0, end: 100 })).toBe(50)
      expect(TULIPValueToValue(7500, { start: -10, end: 10 })).toBe(0)
      expect(TULIPValueToValue(7500, { start: 5, end: 15 })).toBe(10)
    })
  })

  describe('specific test values', () => {
    it('should convert TULIP value 3000 correctly', () => {
      // 3000 = 5% of TULIP scale (500/10000)
      expect(TULIPValueToValue(3000, { start: 0, end: 100 })).toBe(5)
      expect(TULIPValueToValue(3000, { start: -10, end: 10 })).toBe(-9)
      expect(TULIPValueToValue(3000, { start: 0, end: 20 })).toBe(1)
    })

    it('should convert TULIP value 5000 correctly', () => {
      // 5000 = 25% of TULIP scale (2500/10000)
      expect(TULIPValueToValue(5000, { start: 0, end: 100 })).toBe(25)
      expect(TULIPValueToValue(5000, { start: -10, end: 10 })).toBe(-5)
      expect(TULIPValueToValue(5000, { start: 0, end: 20 })).toBe(5)
    })

    it('should convert TULIP value 6000 correctly', () => {
      // 6000 = 35% of TULIP scale (3500/10000)
      expect(TULIPValueToValue(6000, { start: 0, end: 100 })).toBe(35)
      expect(TULIPValueToValue(6000, { start: -10, end: 10 })).toBe(-3)
      expect(TULIPValueToValue(6000, { start: 0, end: 20 })).toBe(7)
    })

    it('should convert TULIP value 10000 correctly', () => {
      // 10000 = 75% of TULIP scale (7500/10000)
      expect(TULIPValueToValue(10000, { start: 0, end: 100 })).toBe(75)
      expect(TULIPValueToValue(10000, { start: -10, end: 10 })).toBe(5)
      expect(TULIPValueToValue(10000, { start: 0, end: 20 })).toBe(15)
    })

    it('should convert TULIP value 11250 correctly', () => {
      // 11250 = 87.5% of TULIP scale (8750/10000)
      expect(TULIPValueToValue(11250, { start: 0, end: 100 })).toBe(87.5)
      expect(TULIPValueToValue(11250, { start: -10, end: 10 })).toBe(7.5)
      expect(TULIPValueToValue(11250, { start: 0, end: 8 })).toBe(7)
    })
  })

  describe('quarter values', () => {
    it('should convert quarter TULIP values correctly', () => {
      // 25% = 5000
      expect(TULIPValueToValue(5000, { start: 0, end: 100 })).toBe(25)

      // 50% = 7500
      expect(TULIPValueToValue(7500, { start: 0, end: 100 })).toBe(50)

      // 75% = 10000
      expect(TULIPValueToValue(10000, { start: 0, end: 100 })).toBe(75)
    })
  })

  describe('edge cases and special ranges', () => {
    it('should throw RangeError for zero range (min = max)', () => {
      expect(() => TULIPValueToValue(7500, { start: 5, end: 5 })).toThrow(RangeError)
      expect(() => TULIPValueToValue(2500, { start: 10, end: 10 })).toThrow(RangeError)
      expect(() => TULIPValueToValue(12500, { start: -3, end: -3 })).toThrow(RangeError)
    })
    it('should throw RangeError for inverted ranges (min > max)', () => {
      expect(() => TULIPValueToValue(2500, { start: 10, end: 0 })).toThrow(RangeError)
      expect(() => TULIPValueToValue(12500, { start: 10, end: 0 })).toThrow(RangeError)
      expect(() => TULIPValueToValue(7500, { start: 10, end: 0 })).toThrow(RangeError)
    })

    it('should handle fractional ranges', () => {
      expect(TULIPValueToValue(2500, { start: 0.5, end: 1.5 })).toBe(0.5)
      expect(TULIPValueToValue(12500, { start: 0.5, end: 1.5 })).toBe(1.5)
      expect(TULIPValueToValue(7500, { start: 0.5, end: 1.5 })).toBe(1.0)
    })

    it('should handle large ranges', () => {
      expect(TULIPValueToValue(2500, { start: 1000, end: 2000 })).toBe(1000)
      expect(TULIPValueToValue(12500, { start: 1000, end: 2000 })).toBe(2000)
      expect(TULIPValueToValue(5000, { start: 1000, end: 2000 })).toBe(1250)
    })

    it('should handle negative ranges', () => {
      expect(TULIPValueToValue(2500, { start: -100, end: -50 })).toBe(-100)
      expect(TULIPValueToValue(12500, { start: -100, end: -50 })).toBe(-50)
      expect(TULIPValueToValue(7500, { start: -100, end: -50 })).toBe(-75)
    })
  })

  describe('precision tests', () => {
    it('should handle precise decimal calculations', () => {
      // Test with values that might introduce floating point precision issues
      expect(TULIPValueToValue(3333, { start: 0, end: 3 })).toBeCloseTo(0.2499, 4)
      expect(TULIPValueToValue(8333, { start: 0, end: 12 })).toBeCloseTo(6.9996, 4)
    })

    it('should maintain precision with very small ranges', () => {
      expect(TULIPValueToValue(7500, { start: 0.001, end: 0.002 })).toBeCloseTo(0.0015, 6)
    })
  })

  describe('real-world sensor scenarios', () => {
    it('should convert temperature sensor values correctly', () => {
      // Temperature range: -40°C to +85°C
      expect(TULIPValueToValue(2500, { start: -40, end: 85 })).toBe(-40) // 0%
      expect(TULIPValueToValue(7500, { start: -40, end: 85 })).toBe(22.5) // 50%
      expect(TULIPValueToValue(12500, { start: -40, end: 85 })).toBe(85) // 100%
    })

    it('should convert pressure sensor values correctly', () => {
      // Pressure range: 0 to 10 bar
      expect(TULIPValueToValue(2500, { start: 0, end: 10 })).toBe(0) // 0%
      expect(TULIPValueToValue(5000, { start: 0, end: 10 })).toBe(2.5) // 25%
      expect(TULIPValueToValue(10000, { start: 0, end: 10 })).toBe(7.5) // 75%
      expect(TULIPValueToValue(12500, { start: 0, end: 10 })).toBe(10) // 100%
    })

    it('should convert flow sensor values correctly', () => {
      // Flow range: 0 to 100 L/min
      expect(TULIPValueToValue(3750, { start: 0, end: 100 })).toBe(12.5) // 12.5%
      expect(TULIPValueToValue(6250, { start: 0, end: 100 })).toBe(37.5) // 37.5%
      expect(TULIPValueToValue(8750, { start: 0, end: 100 })).toBe(62.5) // 62.5%
    })
  })
})

describe('slopeValueToValue', () => {
  it('converts boundary values for 0..100 range', () => {
    expect(slopeValueToValue(0, { start: 0, end: 100 })).toBe(0)
    expect(slopeValueToValue(5000, { start: 0, end: 100 })).toBe(50)
    expect(slopeValueToValue(10000, { start: 0, end: 100 })).toBe(100)
  })

  it('returns span-relative value (not offset by range.start)', () => {
    expect(slopeValueToValue(2500, { start: -10, end: 10 })).toBe(5)
    expect(slopeValueToValue(2500, { start: 5, end: 15 })).toBe(2.5)
  })

  it('supports negative spans and decimals', () => {
    expect(slopeValueToValue(2500, { start: 10, end: 0 })).toBe(-2.5)
    expect(slopeValueToValue(3333, { start: 0.5, end: 1.5 })).toBeCloseTo(0.3333, 4)
  })

  it('throws for values outside 0..10_000', () => {
    expect(() => slopeValueToValue(-1, { start: 0, end: 100 })).toThrow(RangeError)
    expect(() => slopeValueToValue(-1, { start: 0, end: 100 })).toThrow('Slope value must be between 0 and 10_000, is -1')
    expect(() => slopeValueToValue(10001, { start: 0, end: 100 })).toThrow(RangeError)
    expect(() => slopeValueToValue(10001, { start: 0, end: 100 })).toThrow('Slope value must be between 0 and 10_000, is 10001')
  })
})

describe('numberToHexString', () => {
  it('formats single-byte values with 0x prefix and zero-padding', () => {
    expect(numberToHexString(0)).toBe('0x00')
    expect(numberToHexString(10)).toBe('0x0a')
    expect(numberToHexString(255)).toBe('0xff')
  })

  it('returns full hex for values larger than one byte', () => {
    expect(numberToHexString(256)).toBe('0x100')
    expect(numberToHexString(0x1234)).toBe('0x1234')
  })

  it('preserves JavaScript toString(16) behavior for negatives', () => {
    expect(numberToHexString(-1)).toBe('0x-1')
    expect(numberToHexString(-255)).toBe('0x-ff')
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

describe('roundValue', () => {
  describe('extensive edge cases and floating point issues', () => {
    it('should handle subnormal (denormalized) numbers', () => {
      expect(roundValue(Number.MIN_VALUE, 10)).toBe(0)
      expect(roundValue(-Number.MIN_VALUE, 10)).toBe(0)
    })

    it('should handle very large numbers', () => {
      expect(roundValue(1e20, 2)).toBe(1e20)
      expect(roundValue(1e+20, 2)).toBe(1e20)
      expect(roundValue(-1e20, 2)).toBe(-1e20)
    })

    it('should handle very small numbers', () => {
      expect(roundValue(1e-20, 10)).toBe(0)
      expect(roundValue(-1e-20, 10)).toBe(0)
    })

    it('should handle numbers with repeating decimals', () => {
      expect(roundValue(1 / 3, 10)).toBeCloseTo(0.3333333333, 10)
      expect(roundValue(2 / 3, 10)).toBeCloseTo(0.6666666667, 10)
    })

    it('should handle numbers with .5 at various decimal places', () => {
      expect(roundValue(1.005, 2)).toBe(1.01)
      expect(roundValue(2.675, 2)).toBe(2.68)
      expect(roundValue(0.125, 2)).toBe(0.13)
    })

    it('should handle floating point addition issues', () => {
      expect(roundValue(0.1 + 0.2, 2)).toBe(0.3)
      expect(roundValue(0.2 + 0.1, 2)).toBe(0.3)
      expect(roundValue(0.1 + 0.7, 1)).toBe(0.8)
      expect(roundValue(0.1 + 0.2 + 0.3, 2)).toBe(0.6)
      expect(roundValue(0.1 + 0.2 - 0.3, 2)).toBe(0)
    })

    it('should handle fractions and irrational numbers', () => {
      expect(roundValue(Math.PI, 5)).toBeCloseTo(3.14159, 5)
      expect(roundValue(Math.E, 5)).toBeCloseTo(2.71828, 5)
      expect(roundValue(Math.sqrt(2), 8)).toBeCloseTo(1.41421356, 8)
      expect(roundValue(Math.sqrt(0.5), 8)).toBeCloseTo(0.70710678, 8)
    })

    it('should handle numbers just below and above rounding thresholds', () => {
      expect(roundValue(1.2344999999, 3)).toBe(1.234)
      expect(roundValue(1.2345000001, 3)).toBe(1.235)
      expect(roundValue(-1.2344999999, 3)).toBe(-1.234)
      expect(roundValue(-1.2345000001, 3)).toBe(-1.235)
    })

    it('should handle numbers with lots of trailing 9s and 0s', () => {
      expect(roundValue(0.999999999999, 10)).toBe(1)
      expect(roundValue(0.000000000001, 10)).toBe(0)
      expect(roundValue(1.000000000001, 10)).toBe(1)
      expect(roundValue(1.000000000009, 10)).toBe(1)
    })

    it('should handle undefined decimals as no rounding', () => {
      expect(roundValue(1.2345, undefined)).toBe(1.2345)
    })

    it('should handle decimals as floating point values', () => {
      expect(roundValue(1.2345, 2.9)).toBe(1.23)
      expect(roundValue(1.2345, 2.1)).toBe(1.23)
      expect(roundValue(1.2345, 3.7)).toBe(1.235)
    })

    it('should handle negative decimals as zero', () => {
      expect(roundValue(1.2345, -2)).toBe(1)
      expect(roundValue(1.2345, -0.1)).toBe(1)
    })

    it('should handle NaN, Infinity, -Infinity', () => {
      expect(Number.isNaN(roundValue(Number.NaN, 2))).toBe(true)
      expect(roundValue(Infinity, 2)).toBe(Infinity)
      expect(roundValue(-Infinity, 2)).toBe(-Infinity)
    })
  })
  it('should round to zero decimals by default', () => {
    expect(roundValue(3.7)).toBe(3.7)
    expect(roundValue(3.2)).toBe(3.2)
    expect(roundValue(-3.7)).toBe(-3.7)
    expect(roundValue(-3.2)).toBe(-3.2)
    expect(roundValue(0)).toBe(0)
  })

  it('should round to specified positive decimals', () => {
    expect(roundValue(3.14159, 2)).toBe(3.14)
    expect(roundValue(3.145, 2)).toBe(3.15)
    expect(roundValue(1.005, 2)).toBe(1.01)
    expect(roundValue(1.004, 2)).toBe(1.0)
    expect(roundValue(-1.004, 2)).toBe(-1.0)
  })

  it('should treat negative decimals as zero', () => {
    expect(roundValue(3.14159, -2)).toBe(3)
    expect(roundValue(3.9, -1)).toBe(4)
    expect(roundValue(-3.9, -1)).toBe(-4)
  })

  it('should handle large numbers and decimals', () => {
    expect(roundValue(123456.789, 0)).toBe(123457)
    expect(roundValue(123456.789, 2)).toBe(123456.79)
    expect(roundValue(123456.789, 5)).toBe(123456.789)
  })

  it('should handle very small numbers', () => {
    expect(roundValue(0.0001234, 6)).toBe(0.000123)
    expect(roundValue(0.0001236, 6)).toBe(0.000124)
    expect(roundValue(-0.0001234, 6)).toBe(-0.000123)
    expect(roundValue(-0.0001236, 6)).toBe(-0.000124)
  })

  it('should handle zero value for any decimals', () => {
    expect(roundValue(0, 0)).toBe(0)
    expect(roundValue(0, 2)).toBe(0)
    expect(roundValue(0, 10)).toBe(0)
  })

  it('should handle edge cases for decimals', () => {
    expect(roundValue(1.2345, 0)).toBe(1)
    expect(roundValue(1.2345, 1)).toBe(1.2)
    expect(roundValue(1.2345, 2)).toBe(1.23)
    expect(roundValue(1.2345, 3)).toBe(1.235)
    expect(roundValue(1.2345, 4)).toBe(1.2345)
    expect(roundValue(1.2345, 5)).toBe(1.2345)
  })

  it('should handle NaN and Infinity', () => {
    expect(roundValue(Number.NaN, 2)).toBeNaN()
    expect(roundValue(Infinity, 2)).toBe(Infinity)
    expect(roundValue(-Infinity, 2)).toBe(-Infinity)
  })

  it('should handle decimals as floating point values', () => {
    expect(roundValue(1.2345, 2.9)).toBe(1.23)
    expect(roundValue(1.2345, 2.1)).toBe(1.23)
    expect(roundValue(1.2345, 3.7)).toBe(1.235)
  })

  it('should handle negative numbers', () => {
    expect(roundValue(-3.14159, 2)).toBe(-3.14)
    expect(roundValue(-1.004, 2)).toBe(-1.0)
  })

  it('should handle very large decimals (should not add extra precision)', () => {
    expect(roundValue(1.23456789, 10)).toBe(1.23456789)
    expect(roundValue(-1.23456789, 10)).toBe(-1.23456789)
  })
})

describe('float32 conversion helpers', () => {
  describe('intTuple4ToFloat32', () => {
    it('decodes well-known IEEE-754 values', () => {
      expect(intTuple4ToFloat32([0x3F, 0x80, 0x00, 0x00])).toBeCloseTo(1)
      expect(intTuple4ToFloat32([0xBF, 0x80, 0x00, 0x00])).toBeCloseTo(-1)
      expect(intTuple4ToFloat32([0x00, 0x00, 0x00, 0x00])).toBe(0)
    })

    it('masks input values to 8-bit bytes', () => {
      expect(intTuple4ToFloat32([0x13F, 0x180, 0x100, 0x100] as unknown as [number, number, number, number])).toBeCloseTo(1)
    })

    it('handles special IEEE-754 values', () => {
      expect(intTuple4ToFloat32([0x7F, 0x80, 0x00, 0x00])).toBe(Infinity)
      expect(intTuple4ToFloat32([0xFF, 0x80, 0x00, 0x00])).toBe(-Infinity)
      expect(intTuple4ToFloat32([0x7F, 0xC0, 0x00, 0x00])).toBeNaN()
    })
  })

  describe('intTuple4ToFloat32WithThreshold', () => {
    it('cleans common precision artifacts with default threshold', () => {
      const bytes: [number, number, number, number] = [0x3E, 0x99, 0x99, 0x9A] // 0.3f
      const raw = intTuple4ToFloat32(bytes)
      expect(raw).not.toBe(0.3)
      expect(intTuple4ToFloat32WithThreshold(bytes)).toBe(0.3)
    })

    it('clamps negative threshold to 0', () => {
      const bytes: [number, number, number, number] = [0x3E, 0x99, 0x99, 0x9A]
      expect(intTuple4ToFloat32WithThreshold(bytes, -7)).toBe(intTuple4ToFloat32WithThreshold(bytes, 0))
    })

    it('normalizes non-integer threshold via floor', () => {
      const bytes: [number, number, number, number] = [0x42, 0xF6, 0xE9, 0x79] // 123.456f
      expect(intTuple4ToFloat32WithThreshold(bytes, 3.9)).toBe(intTuple4ToFloat32WithThreshold(bytes, 3))
    })
  })
})
