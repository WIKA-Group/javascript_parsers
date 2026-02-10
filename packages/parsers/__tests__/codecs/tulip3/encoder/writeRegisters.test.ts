import { describe, expect, it } from 'vitest'
import { createMultipleEncoderFactory } from '../../../../src/codecs/tulip3/encoder/encode'
import { createCompleteTULIP3Profile } from '../constants/completeProfile'

describe('tULIP3 Downlink Encoding - Write Registers', () => {
  const profile = createCompleteTULIP3Profile()
  const encode = createMultipleEncoderFactory(profile)

  describe('identification Write', () => {
    it('should encode write identification fields', () => {
      // ORIGINAL Example: 0x01 02 80 0F 21 01 11 88 3D 4C CC CD 3F 80 20 C5
      // Decoding:
      // 01 02 - Identification – Write fields message
      // 80 - Apply configuration after this frame, frame counter = 0
      // 0F 21 - Start from register address 0x079 and 1 byte register will be written
      // 01 - Unit of sensor 1 channel 1: °C
      // 11 88 - Start from register address 0x08C and 8 bytes register will be written
      // 3D 4C CC CD - Offset of sensor 1 channel 1: 0.05
      // 3F 80 20 C5 - Gain of sensor 1 channel 1: 1.001

      // ! 0x0F, 0x21, 0x1 are the first 3 bytes after the header in the original example
      // as we use ffd to optimize the payload, the registers are in another order

      const expected = [
        0x01,
        0x02,
        0x80,
        0x11,
        0x88,
        0x3D,
        0x4C,
        0xCC,
        0xCD,
        0x3F,
        0x80,
        0x20,
        0xC5,
        0x0F, // in original example at index 3
        0x21, // in original example at index 4
        0x01, // in original example at index 5
      ]

      const result = encode({
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              identification: {
                unit: '°C',
                offset: 0.05,
                gain: 1.001,
              },
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

  describe('configuration Write', () => {
    it('should encode write configuration fields - Single frame', () => {
      // Example: 0x02 02 80 00 0C 00 00 1C 20 00 00 0E 10 00 02 00 01
      // Decoding:
      // 02 02 - Configuration – Write fields message
      // 80 - Apply configuration after this frame, frame counter = 0
      // 00 0C - Start from register address 0x000 and 12 bytes register will be written
      // 00 00 1C 20 - CM Measuring period alarm off: 7200
      // 00 00 0E 10 - CM Measuring period alarm on: 3600
      // 00 02 - CM Transmission rate alarm off: 2
      // 00 01 - CM Transmission rate alarm on: 1

      const expected = [
        0x02,
        0x02,
        0x80,
        0x00,
        0x0C,
        0x00,
        0x00,
        0x1C,
        0x20,
        0x00,
        0x00,
        0x0E,
        0x10,
        0x00,
        0x02,
        0x00,
        0x01,
      ]

      const result = encode({
        action: 'writeRegisters',
        input: {
          communicationModule: {
            configuration: {
              measuringPeriodAlarmOff: 7200,
              measuringPeriodAlarmOn: 3600,
              transmissionRateAlarmOff: 2,
              transmissionRateAlarmOn: 1,

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
        action: 'writeRegisters',
        input: {
          communicationModule: {
            configuration: {
              measuringPeriodAlarmOff: 7200,
              measuringPeriodAlarmOn: 3600,
              transmissionRateAlarmOff: 2,
              transmissionRateAlarmOn: 1,
            },
          },
        },
        metadata: {
          byteLimit: 15, // Small limit to force splitting (minimum is 11)
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames!.length).toBeGreaterThan(1)

      // Each frame should respect the byte limit
      result.frames!.forEach((frame) => {
        expect(frame.length).toBeLessThanOrEqual(15)
        expect(frame.length).toBeGreaterThan(0)
      })

      // All frames should start with message type (0x02) and subtype (0x02)
      result.frames!.forEach((frame) => {
        expect(frame[0]).toBe(0x02) // Configuration message type
        expect(frame[1]).toBe(0x02) // Write subtype
      })

      // Last frame should have apply bit set (0x80 | frameCounter)
      const lastFrame = result.frames![result.frames!.length - 1]!
      expect(lastFrame[2]! & 0x80).toBe(0x80) // Apply bit should be set

      // Earlier frames should NOT have apply bit set
      if (result.frames!.length > 1) {
        for (let i = 0; i < result.frames!.length - 1; i++) {
          const frame = result.frames![i]!
          expect(frame[2]! & 0x80).toBe(0) // Apply bit should NOT be set
        }
      }

      expect(result.fPort).toBe(1)
    })

    it('should split into multiple frames with correct frame counters', () => {
      // Use more data to ensure multiple frames
      const result = encode({
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                processAlarmEnabled: {
                  highThreshold: true,
                  lowThresholdWithDelay: true,
                },
                processAlarmDeadBand: 0.01,
                highThresholdAlarmValue: 20,
                lowThresholdWithDelayAlarmValue: 10,
                lowThresholdWithDelayAlarmDelay: 18000,
              },
            },
          },
        },
        metadata: {
          byteLimit: 20, // Small enough to force splitting (minimum is 11)
          startingFrameCounter: 0,
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames!.length).toBeGreaterThan(1)

      // Verify frame counters increment correctly
      result.frames!.forEach((frame, index) => {
        const frameType = frame[0]!
        const frameSubType = frame[1]!
        expect(frameType).toBe(0x02) // Configuration message type
        expect(frameSubType).toBe(0x02) // Write subtype
        const frameCounterByte = frame[2]!
        const frameCounter = (frameCounterByte & 0b01111100) >> 2
        expect(frameCounter).toBe(index)
      })

      // Only last frame should have apply bit
      const lastFrameIndex = result.frames!.length - 1
      result.frames!.forEach((frame, index) => {
        const applyBit = frame[2]! & 0x80
        if (index === lastFrameIndex) {
          expect(applyBit).toBe(0x80)
        }
        else {
          expect(applyBit).toBe(0)
        }
      })

      expect(result.fPort).toBe(1)
    })

    it('should respect custom starting frame counter when splitting', () => {
      const result = encode({
        action: 'writeRegisters',
        input: {
          communicationModule: {
            configuration: {
              measuringPeriodAlarmOff: 7200,
              measuringPeriodAlarmOn: 3600,
              transmissionRateAlarmOff: 2,
              transmissionRateAlarmOn: 1,
            },
          },
        },
        metadata: {
          byteLimit: 15,
          startingFrameCounter: 5, // Start from frame 5
          autoApplyConfig: true,
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames!.length).toBeGreaterThan(1)

      // Verify frame counters start from 5
      result.frames!.forEach((frame, index) => {
        const frameCounterByte = frame[2]!
        const frameCounter = (frameCounterByte & 0b01111100) >> 2
        expect(frameCounter).toBe(5 + index)
      })

      expect(result.fPort).toBe(1)
    })

    it('should encode write configuration fields - Multi-frame Frame 0', () => {
      // Example: 0x02 02 00 09 05 48 3C 23 D7 0A
      // Decoding:
      // 02 02 - Configuration – Write fields message
      // 00 - frame counter = 0
      // 09 05 - Start from register address 0x048 and 5 bytes register will be written
      // 48 - High threshold and low threshold with delay process alarms enabled
      // 3C 23 D7 0A - Process alarms dead band of sensor 1 channel 1: 0.01

      const expected = [
        0x02,
        0x02,
        0x00,
        0x09,
        0x05,
        0x48,
        0x3C,
        0x23,
        0xD7,
        0x0A,
      ]

      const result = encode({
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                processAlarmEnabled: {
                  highThreshold: true,
                  lowThresholdWithDelay: true,
                },
                processAlarmDeadBand: 0.01,
              },
            },
          },
        },
        metadata: {
          autoApplyConfig: false,
          startingFrameCounter: 0,
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames).toHaveLength(1)
      expect(result.frames![0]).toEqual(expected)
      expect(result.fPort).toBe(1)
    })

    it('should encode write configuration fields - Multi-frame Frame 1', () => {
      // Example: 0x02 02 04 0A 24 41 A0 00 00
      // Decoding:
      // 02 02 - Configuration – Write fields message
      // 04 - frame counter = 1
      // 0A 24 - Start from register address 0x051 and 4 bytes register will be written
      // 41 A0 00 00 - High threshold of sensor 1 channel 1: 20

      const expected = [
        0x02,
        0x02,
        0x04,
        0x0A,
        0x24,
        0x41,
        0xA0,
        0x00,
        0x00,
      ]

      const result = encode({
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                highThresholdAlarmValue: 20,
              },
            },
          },
        },
        metadata: {
          autoApplyConfig: false,
          startingFrameCounter: 1,
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames).toHaveLength(1)
      expect(result.frames![0]).toEqual(expected)
      expect(result.fPort).toBe(1)
    })

    it('should encode write configuration fields - Multi-frame Frame 2', () => {
      // Example: 0x02 02 88 0B A6 41 20 00 00 46 50
      // Decoding:
      // 02 02 - Configuration – Write fields message
      // 88 - Apply configuration after this frame, frame counter = 2
      // 0B A6 - Start from register address 0x05D and 6 bytes register will be written
      // 41 20 00 00 - Low threshold with delay of sensor 1 channel 1: Threshold 10
      // 46 50 - Low threshold with delay of sensor 1 channel 1: Delay= 18000*1s = 5h

      const expected = [
        0x02,
        0x02,
        0x88,
        0x0B,
        0xA6,
        0x41,
        0x20,
        0x00,
        0x00,
        0x46,
        0x50,
      ]

      const result = encode({
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdWithDelayAlarmValue: 10,
                lowThresholdWithDelayAlarmDelay: 18000,
              },
            },
          },
        },
        metadata: {
          autoApplyConfig: true,
          startingFrameCounter: 2,
        },
      })

      expect(result.errors).toBeUndefined()
      expect(result.frames).toBeDefined()
      expect(result.frames).toHaveLength(1)
      expect(result.frames![0]).toEqual(expected)
      expect(result.fPort).toBe(1)
    })
  })
})
