import { describe, expect, it } from 'vitest'
import { decodeKeepAliveMessage } from '../../../../src/codecs/tulip3/messages/keepAlive'

describe('tulip3 keep alive message decoding (0x16/0x01)', () => {
  describe('valid messages', () => {
    it('should decode keep alive message with battery level (example from spec)', () => {
      // Example from spec: 0x16 01 60 00 02 64
      // 0x16 01 = Periodic event – Keep alive message
      // 0x60 = Status: battery powered, can compute battery level, CM restarted
      // 0x00 02 = Revision counter: 2 modifications since default config
      // 0x64 = Battery level: 100%
      const data = [0x16, 0x01, 0x60, 0x00, 0x02, 0x64]

      const result = decodeKeepAliveMessage(data)

      expect(result).toEqual({
        data: {
          messageType: 0x16,
          messageSubType: 0x01,
          keepAliveData: {
            status: {
              mainPowered: false, // bit 7 = 0 (battery powered)
              ableToComputeBatteryLevel: true, // bit 6 = 1
              hasCommunicationModuleRestarted: true, // bit 5 = 1
            },
            revisionCounter: 2, // 0x0002
            batteryLevel: 100, // 0x64 = 100%
          },
        },
      })
    })

    it('should decode keep alive message with main power and battery level', () => {
      // Status: 0xC0 = 11000000b = main powered + can compute battery level
      const data = [0x16, 0x01, 0xC0, 0x27, 0x10, 0x4B]

      const result = decodeKeepAliveMessage(data)

      expect(result).toEqual({
        data: {
          messageType: 0x16,
          messageSubType: 0x01,
          keepAliveData: {
            status: {
              mainPowered: true, // bit 7 = 1 (main powered)
              ableToComputeBatteryLevel: true, // bit 6 = 1
              hasCommunicationModuleRestarted: false, // bit 5 = 0
            },
            revisionCounter: 10000, // 0x2710
            batteryLevel: 75, // 0x4B = 75%
          },
        },
      })
    })

    it('should decode keep alive message without battery level', () => {
      // Status: 0x80 = 10000000b = main powered + cannot compute battery level
      const data = [0x16, 0x01, 0x80, 0xFF, 0xFF]

      const result = decodeKeepAliveMessage(data)

      expect(result).toEqual({
        data: {
          messageType: 0x16,
          messageSubType: 0x01,
          keepAliveData: {
            status: {
              mainPowered: true, // bit 7 = 1 (main powered)
              ableToComputeBatteryLevel: false, // bit 6 = 0
              hasCommunicationModuleRestarted: false, // bit 5 = 0
            },
            revisionCounter: 65535, // 0xFFFF
            batteryLevel: undefined, // not present when ableToComputeBatteryLevel is false
          },
        },
      })
    })

    it('should decode keep alive message with battery powered and no battery level computation', () => {
      // Status: 0x00 = 00000000b = battery powered + cannot compute battery level
      const data = [0x16, 0x01, 0x00, 0x00, 0x01]

      const result = decodeKeepAliveMessage(data)

      expect(result).toEqual({
        data: {
          messageType: 0x16,
          messageSubType: 0x01,
          keepAliveData: {
            status: {
              mainPowered: false, // bit 7 = 0 (battery powered)
              ableToComputeBatteryLevel: false, // bit 6 = 0
              hasCommunicationModuleRestarted: false, // bit 5 = 0
            },
            revisionCounter: 1, // 0x0001
            batteryLevel: undefined,
          },
        },
      })
    })

    it('should decode keep alive message with CM restart flag', () => {
      // Status: 0xE0 = 11100000b = main powered + can compute battery level + CM restarted
      const data = [0x16, 0x01, 0xE0, 0x12, 0x34, 0x32]

      const result = decodeKeepAliveMessage(data)

      expect(result).toEqual({
        data: {
          messageType: 0x16,
          messageSubType: 0x01,
          keepAliveData: {
            status: {
              mainPowered: true, // bit 7 = 1
              ableToComputeBatteryLevel: true, // bit 6 = 1
              hasCommunicationModuleRestarted: true, // bit 5 = 1
            },
            revisionCounter: 4660, // 0x1234
            batteryLevel: 50, // 0x32 = 50%
          },
        },
      })
    })

    it('should handle minimum battery level (0%)', () => {
      const data = [0x16, 0x01, 0x40, 0x00, 0x00, 0x00]

      const result = decodeKeepAliveMessage(data)

      expect(result.data.keepAliveData.batteryLevel).toBe(0)
    })

    it('should handle maximum battery level (100%)', () => {
      const data = [0x16, 0x01, 0x40, 0x00, 0x00, 0x64]

      const result = decodeKeepAliveMessage(data)

      expect(result.data.keepAliveData.batteryLevel).toBe(100)
    })

    it('should handle zero revision counter', () => {
      const data = [0x16, 0x01, 0x40, 0x00, 0x00, 0x50]

      const result = decodeKeepAliveMessage(data)

      expect(result.data.keepAliveData.revisionCounter).toBe(0)
    })

    it('should handle maximum revision counter', () => {
      const data = [0x16, 0x01, 0x40, 0xFF, 0xFF, 0x50]

      const result = decodeKeepAliveMessage(data)

      expect(result.data.keepAliveData.revisionCounter).toBe(65535)
    })
  })

  describe('error handling', () => {
    it('should throw error for invalid message type', () => {
      const data = [0x15, 0x01, 0x60, 0x00, 0x02, 0x64] // Wrong message type

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Invalid keep alive message type: expected 0x16 but got 0x15',
      )
    })

    it('should throw error for invalid sub message type', () => {
      const data = [0x16, 0x02, 0x60, 0x00, 0x02, 0x64] // Wrong sub message type

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Unsupported keep alive message subtype: 0x02. Allowed subtypes: 0x01',
      )
    })

    it('should throw error for message too short (less than 5 bytes)', () => {
      const data = [0x16, 0x01, 0x60] // Only 3 bytes

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Keep alive message too short. Expected at least 5 bytes but got 3',
      )
    })

    it('should throw error for missing revision counter', () => {
      const data = [0x16, 0x01, 0x60, 0x00] // Missing second byte of revision counter

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Keep alive message too short. Expected at least 5 bytes but got 4',
      )
    })

    it('should throw error for missing battery level when required', () => {
      const data = [0x16, 0x01, 0x40, 0x00, 0x02] // Status indicates battery level should be present but missing

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Keep alive message missing battery level. Expected 6 bytes when battery level computation is enabled but got 5',
      )
    })

    it('should throw error for unexpected extra bytes when battery level disabled', () => {
      const data = [0x16, 0x01, 0x00, 0x00, 0x02, 0x64] // Status indicates no battery level but extra byte present

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Keep alive message has unexpected extra bytes. Expected 5 bytes when battery level computation is disabled but got 6',
      )
    })

    it('should throw error for invalid battery level (> 100%)', () => {
      const data = [0x16, 0x01, 0x40, 0x00, 0x02, 0x65] // 101%

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Invalid battery level: 101%. Must be between 0 and 100',
      )
    })

    it('should throw error for invalid battery level (< 0% - represented as large number)', () => {
      const data = [0x16, 0x01, 0x40, 0x00, 0x02, 0xFF] // 255 (invalid)

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Invalid battery level: 255%. Must be between 0 and 100',
      )
    })

    it('should throw error for empty data array', () => {
      const data: number[] = []

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Keep alive message too short. Expected at least 5 bytes but got 0',
      )
    })

    it('should handle undefined/null message type gracefully', () => {
      const data = [undefined as any, 0x01, 0x60, 0x00, 0x02, 0x64]

      expect(() => decodeKeepAliveMessage(data)).toThrow(
        'Cannot read properties of undefined (reading \'toString\')',
      )
    })
  })

  describe('bit field parsing', () => {
    it('should correctly parse all status bit combinations', () => {
      const testCases = [
        { status: 0x00, expected: { mainPowered: false, ableToComputeBatteryLevel: false, hasCommunicationModuleRestarted: false } },
        { status: 0x20, expected: { mainPowered: false, ableToComputeBatteryLevel: false, hasCommunicationModuleRestarted: true } },
        { status: 0x40, expected: { mainPowered: false, ableToComputeBatteryLevel: true, hasCommunicationModuleRestarted: false } },
        { status: 0x60, expected: { mainPowered: false, ableToComputeBatteryLevel: true, hasCommunicationModuleRestarted: true } },
        { status: 0x80, expected: { mainPowered: true, ableToComputeBatteryLevel: false, hasCommunicationModuleRestarted: false } },
        { status: 0xA0, expected: { mainPowered: true, ableToComputeBatteryLevel: false, hasCommunicationModuleRestarted: true } },
        { status: 0xC0, expected: { mainPowered: true, ableToComputeBatteryLevel: true, hasCommunicationModuleRestarted: false } },
        { status: 0xE0, expected: { mainPowered: true, ableToComputeBatteryLevel: true, hasCommunicationModuleRestarted: true } },
      ]

      testCases.forEach(({ status, expected }) => {
        const hasBattery = expected.ableToComputeBatteryLevel
        const data = hasBattery
          ? [0x16, 0x01, status, 0x00, 0x00, 0x50]
          : [0x16, 0x01, status, 0x00, 0x00]

        const result = decodeKeepAliveMessage(data)

        expect(result.data.keepAliveData.status).toEqual(expected)
      })
    })

    it('should ignore RFU bits (bits 4-0) in status byte', () => {
      // Status with RFU bits set: 0x4F = 01001111b
      // Should only parse bits 7, 6, 5 and ignore bits 4-0
      const data = [0x16, 0x01, 0x4F, 0x00, 0x00, 0x50]

      const result = decodeKeepAliveMessage(data)

      expect(result.data.keepAliveData.status).toEqual({
        mainPowered: false, // bit 7 = 0
        ableToComputeBatteryLevel: true, // bit 6 = 1
        hasCommunicationModuleRestarted: false, // bit 5 = 0
      })
    })
  })

  describe('revision counter endianness', () => {
    it('should correctly parse little-endian revision counter', () => {
      const testCases = [
        { bytes: [0x00, 0x00], expected: 0 },
        { bytes: [0x01, 0x00], expected: 256 },
        { bytes: [0x00, 0x01], expected: 1 },
        { bytes: [0x12, 0x34], expected: 4660 }, // 0x1234
        { bytes: [0xFF, 0xFF], expected: 65535 },
      ]

      testCases.forEach(({ bytes, expected }) => {
        const data = [0x16, 0x01, 0x40, bytes[0]!, bytes[1]!, 0x50]

        const result = decodeKeepAliveMessage(data)

        expect(result.data.keepAliveData.revisionCounter).toBe(expected)
      })
    })
  })
})
