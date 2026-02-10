import { describe, expect, it } from 'vitest'
import { createMultipleEncoderFactory } from '../../../../src/codecs/tulip3/encoder/encode'
import { createCompleteTULIP3Profile } from '../constants/completeProfile'

describe('tULIP3 Downlink Encoding - Read Registers', () => {
  const profile = createCompleteTULIP3Profile()
  const encode = createMultipleEncoderFactory(profile)

  describe('identification Read', () => {
    it('should encode read identification fields request', () => {
      // Example: 0x01 01 01 AB
      // Decoding:
      // 01 01 - Identification – Read fields message
      // 01 AB - Start from register address 0x00D and read 11 bytes registers

      const expected = [0x01, 0x01, 0x01, 0xAB]

      const result = encode({
        action: 'readRegisters',
        input: {
          communicationModule: {
            identification: {
              serialNumberPart1: true,
              serialNumberPart2: true,
            },
          },
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames).toHaveLength(1)
      expect(result.frames![0]).toEqual(expected)
      expect(result.fPort).toBe(1)
    })
  })

  describe('configuration Read', () => {
    it('should encode read configuration fields request', () => {
      // Example: 0x02 01 00 0C 05 62
      // Decoding:
      // 02 01 - Configuration – Read fields message
      // 00 0C - Start from register address 0x000 and read 12 bytes registers
      // 05 62 - Start from register address 0x02B and read 2 bytes registers

      const expected = [0x02, 0x01, 0x00, 0x0C, 0x05, 0x62]

      const result = encode({
        action: 'readRegisters',
        input: {
          communicationModule: {
            configuration: {
              measuringPeriodAlarmOff: true,
              measuringPeriodAlarmOn: true,
              transmissionRateAlarmOff: true,
              transmissionRateAlarmOn: true,
            },
          },
          sensor1: {
            configuration: {
              bootTime: true,
            },
          },
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames).toHaveLength(1)
      expect(result.frames![0]).toEqual(expected)
      expect(result.fPort).toBe(1)
    })

    it('should split into multiple frames when byte limit is exceeded', () => {
      // Test with a small byte limit to force frame splitting
      const result = encode({
        action: 'readRegisters',
        input: {
          communicationModule: {
            configuration: {
              measuringPeriodAlarmOff: true,

              transmissionRateAlarmOff: true,
              transmissionRateAlarmOn: true,

              underVoltageThreshold: true,
              underTemperatureCmChip: true,
              fetchAdditionalDownlinkTimeInterval: true,
            },
          },
          sensor1: {
            configuration: {
              bootTime: true,
            },
          },
        },
        metadata: {
          byteLimit: 12, // Small limit to force splitting (minimum is 11)
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames).toHaveLength(2)

      expect(result.frames![0]).toEqual([
        2,
        1,
        0,
        4,
        1,
        4,
        1,
        194,
        2,
        33,
        2,
        97,
      ])
      expect(result.frames![1]).toEqual([2, 1, 5, 98])
    })
  })
})
