import { describe, expect, it } from 'vitest'
import {
  decodeAddressingField,
  encodeAddressingField,
  MAX_ADDRESS,
  MAX_SIZE,
} from '../../../src/codecs/tulip3/addressingField'

describe('addressingField', () => {
  describe('encodeAddressingField', () => {
    it('should encode address 0 and size 0', () => {
      const result = encodeAddressingField(0, 0)
      expect(result).toEqual([0x00, 0x00])
    })

    it('should encode address 512 (0x200) and size 4', () => {
      // address 512 = 0x200, shifted left 5 = 0x4000
      // size 4 = 0x04
      // combined = 0x4004 = [0x40, 0x04]
      const result = encodeAddressingField(512, 4)
      expect(result).toEqual([0x40, 0x04])
    })

    it('should encode maximum address (2047) and size 0', () => {
      // address 2047 = 0x7FF, shifted left 5 = 0xFFE0
      // size 0 = 0x00
      // combined = 0xFFE0 = [0xFF, 0xE0]
      const result = encodeAddressingField(MAX_ADDRESS, 0)
      expect(result).toEqual([0xFF, 0xE0])
    })

    it('should encode address 0 and maximum size (31)', () => {
      // address 0 shifted left 5 = 0x0000
      // size 31 = 0x1F
      // combined = 0x001F = [0x00, 0x1F]
      const result = encodeAddressingField(0, MAX_SIZE)
      expect(result).toEqual([0x00, 0x1F])
    })

    it('should encode maximum address (2047) and maximum size (31)', () => {
      // address 2047 = 0x7FF, shifted left 5 = 0xFFE0
      // size 31 = 0x1F
      // combined = 0xFFFF = [0xFF, 0xFF]
      const result = encodeAddressingField(MAX_ADDRESS, MAX_SIZE)
      expect(result).toEqual([0xFF, 0xFF])
    })

    it('should throw on address > 2047', () => {
      expect(() => encodeAddressingField(2048, 0)).toThrow(RangeError)
      expect(() => encodeAddressingField(2048, 0)).toThrow('Address 2048 is out of range')
    })

    it('should throw on negative address', () => {
      expect(() => encodeAddressingField(-1, 0)).toThrow(RangeError)
      expect(() => encodeAddressingField(-1, 0)).toThrow('Address -1 is out of range')
    })

    it('should throw on size > 31', () => {
      expect(() => encodeAddressingField(0, 32)).toThrow(RangeError)
      expect(() => encodeAddressingField(0, 32)).toThrow('Size 32 is out of range')
    })

    it('should throw on negative size', () => {
      expect(() => encodeAddressingField(0, -1)).toThrow(RangeError)
      expect(() => encodeAddressingField(0, -1)).toThrow('Size -1 is out of range')
    })
  })

  describe('decodeAddressingField', () => {
    it('should decode [0x00, 0x00] to address 0, size 0', () => {
      const result = decodeAddressingField(0x00, 0x00)
      expect(result).toEqual({ address: 0, size: 0 })
    })

    it('should decode [0x40, 0x04] to address 512, size 4', () => {
      const result = decodeAddressingField(0x40, 0x04)
      expect(result).toEqual({ address: 512, size: 4 })
    })

    it('should decode [0xFF, 0xE0] to address 2047, size 0', () => {
      const result = decodeAddressingField(0xFF, 0xE0)
      expect(result).toEqual({ address: MAX_ADDRESS, size: 0 })
    })

    it('should decode [0x00, 0x1F] to address 0, size 31', () => {
      const result = decodeAddressingField(0x00, 0x1F)
      expect(result).toEqual({ address: 0, size: MAX_SIZE })
    })

    it('should decode [0xFF, 0xFF] to address 2047, size 31', () => {
      const result = decodeAddressingField(0xFF, 0xFF)
      expect(result).toEqual({ address: MAX_ADDRESS, size: MAX_SIZE })
    })
  })

  describe('roundtrip encode/decode', () => {
    it('should roundtrip address 0, size 0', () => {
      const encoded = encodeAddressingField(0, 0)
      const decoded = decodeAddressingField(encoded[0], encoded[1])
      expect(decoded).toEqual({ address: 0, size: 0 })
    })

    it('should roundtrip address 512, size 4', () => {
      const encoded = encodeAddressingField(512, 4)
      const decoded = decodeAddressingField(encoded[0], encoded[1])
      expect(decoded).toEqual({ address: 512, size: 4 })
    })

    it('should roundtrip address 2047, size 31', () => {
      const encoded = encodeAddressingField(MAX_ADDRESS, MAX_SIZE)
      const decoded = decodeAddressingField(encoded[0], encoded[1])
      expect(decoded).toEqual({ address: MAX_ADDRESS, size: MAX_SIZE })
    })

    it('should roundtrip various addresses and sizes', () => {
      const testCases = [
        { address: 1, size: 1 },
        { address: 100, size: 10 },
        { address: 1000, size: 20 },
        { address: 1500, size: 15 },
        { address: 2000, size: 30 },
      ]

      for (const { address, size } of testCases) {
        const encoded = encodeAddressingField(address, size)
        const decoded = decodeAddressingField(encoded[0], encoded[1])
        expect(decoded).toEqual({ address, size })
      }
    })
  })
})
