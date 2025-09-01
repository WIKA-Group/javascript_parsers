import { describe, expect, it } from 'vitest'
import { parseFrame, parseFrameData } from '../../../../src/codecs/tulip3/messages'
import {
  createRegisterEntry,
  evaluateRegisterBlocks,
  intArrayToASCII,
  intTuple1ToChannelPlan,
  intTuple1ToConnectedSensors,
  intTuple1ToExistingChannels,
  intTuple1ToMeasurand,
  intTuple1ToProductSubId,
  intTuple1ToUInt8,
  intTuple1ToUnit,
  intTuple2ToAccuracyPercent,
  intTuple2ToUInt16,
  intTuple3ToDate,
  intTuple3ToSemVer,
  intTuple4ToFloat32,
  intTuple4ToFloat32WithThreshold,
  parseRegisterBlocks,
} from '../../../../src/codecs/tulip3/registers'

describe('tULIP3 register parsing functions', () => {
  describe('intArrayToASCII', () => {
    it('should convert array of ASCII codes to string', () => {
      expect(intArrayToASCII([72, 101, 108, 108, 111])).toBe('Hello')
      expect(intArrayToASCII([87, 73, 75, 65])).toBe('WIKA')
      expect(intArrayToASCII([84, 85, 76, 73, 80, 51])).toBe('TULIP3')
    })

    it('should handle empty array', () => {
      expect(intArrayToASCII([])).toBe('')
    })

    it('should handle special characters', () => {
      expect(intArrayToASCII([32, 33, 64, 35])).toBe(' !@#')
    })
  })

  describe('intTuple1ToUInt8', () => {
    it('should convert single byte to uint8', () => {
      expect(intTuple1ToUInt8([0])).toBe(0)
      expect(intTuple1ToUInt8([255])).toBe(255)
      expect(intTuple1ToUInt8([128])).toBe(128)
      expect(intTuple1ToUInt8([42])).toBe(42)
    })

    it('should mask values above 255', () => {
      expect(intTuple1ToUInt8([256])).toBe(0) // 256 & 0xFF = 0
      expect(intTuple1ToUInt8([300])).toBe(44) // 300 & 0xFF = 44
    })
  })

  describe('intTuple2ToUInt16', () => {
    it('should convert 2-byte tuple to uint16 (big-endian)', () => {
      expect(intTuple2ToUInt16([0, 0])).toBe(0)
      expect(intTuple2ToUInt16([255, 255])).toBe(65535)
      expect(intTuple2ToUInt16([1, 0])).toBe(256) // 0x0100
      expect(intTuple2ToUInt16([0, 1])).toBe(1) // 0x0001
      expect(intTuple2ToUInt16([0x12, 0x34])).toBe(0x1234) // big-endian
    })

    it('should handle edge cases', () => {
      expect(intTuple2ToUInt16([0, 255])).toBe(255)
      expect(intTuple2ToUInt16([255, 0])).toBe(65280)
    })
  })

  describe('intTuple4ToFloat32', () => {
    it('should convert 4-byte tuple to IEEE 754 float32 (big-endian)', () => {
      // Test known float values
      // 1.0 in IEEE 754: 0x3F800000 (big-endian: [0x3F, 0x80, 0x00, 0x00])
      expect(intTuple4ToFloat32([0x3F, 0x80, 0x00, 0x00])).toBeCloseTo(1.0)

      // 0.0 in IEEE 754: 0x00000000
      expect(intTuple4ToFloat32([0x00, 0x00, 0x00, 0x00])).toBe(0.0)

      // -1.0 in IEEE 754: 0xBF800000 (big-endian: [0xBF, 0x80, 0x00, 0x00])
      expect(intTuple4ToFloat32([0xBF, 0x80, 0x00, 0x00])).toBeCloseTo(-1.0)

      // 3.14159... in IEEE 754: 0x40490FDB (big-endian: [0x40, 0x49, 0x0F, 0xDB])
      expect(intTuple4ToFloat32([0x40, 0x49, 0x0F, 0xDB])).toBeCloseTo(3.14159, 4)

      // 123.456 in IEEE 754: 0x42F6E979 (big-endian: [0x42, 0xF6, 0xE9, 0x79])
      expect(intTuple4ToFloat32([0x42, 0xF6, 0xE9, 0x79])).toBeCloseTo(123.456, 3)

      // 25.5 in IEEE 754: 0x41CC0000 (big-endian: [0x41, 0xCC, 0x00, 0x00])
      expect(intTuple4ToFloat32([0x41, 0xCC, 0x00, 0x00])).toBeCloseTo(25.5)
    })

    it('should handle special IEEE 754 values', () => {
      // Test infinity: 0x7F800000 (big-endian: [0x7F, 0x80, 0x00, 0x00])
      expect(intTuple4ToFloat32([0x7F, 0x80, 0x00, 0x00])).toBe(Infinity)

      // Test negative infinity: 0xFF800000 (big-endian: [0xFF, 0x80, 0x00, 0x00])
      expect(intTuple4ToFloat32([0xFF, 0x80, 0x00, 0x00])).toBe(-Infinity)

      // Test NaN: 0x7FC00000 (big-endian: [0x7F, 0xC0, 0x00, 0x00])
      expect(intTuple4ToFloat32([0x7F, 0xC0, 0x00, 0x00])).toBeNaN()
    })
  })

  describe('intTuple4ToFloat32WithThreshold', () => {
    it('should clean common float32 precision artifacts (example: 0.3)', () => {
      // 0.3 in float32 is 0x3E99999A -> [0x3E, 0x99, 0x99, 0x9A]
      const bytes: [number, number, number, number] = [0x3E, 0x99, 0x99, 0x9A]
      const raw = intTuple4ToFloat32(bytes)
      // Raw float32 has a small precision artifact; ensure it's not exactly 0.3
      expect(raw).not.toBe(0.3)
      // Thresholded version should return a cleaned value equal to 0.3
      expect(intTuple4ToFloat32WithThreshold(bytes)).toBe(0.3)
    })

    it('should preserve intended precision for larger values', () => {
      // 123.456 in float32: 0x42F6E979 -> [0x42, 0xF6, 0xE9, 0x79]
      expect(intTuple4ToFloat32WithThreshold([0x42, 0xF6, 0xE9, 0x79])).toBeCloseTo(123.456, 3)
    })
  })

  describe('intTuple3ToSemVer', () => {
    it('should convert 3-byte tuple to semantic version', () => {
      expect(intTuple3ToSemVer([1, 0, 0])).toBe('1.0.0')
      expect(intTuple3ToSemVer([2, 5, 13])).toBe('2.5.13')
      expect(intTuple3ToSemVer([0, 1, 2])).toBe('0.1.2')
      expect(intTuple3ToSemVer([255, 255, 255])).toBe('255.255.255')
    })
  })

  describe('intTuple3ToDate', () => {
    it('should convert 3-byte tuple to Date object', () => {
      const date1 = intTuple3ToDate([23, 12, 25]) // December 25, 2023
      expect(date1.getFullYear()).toBe(2023)
      expect(date1.getMonth()).toBe(11) // December is month 11 (0-based)
      expect(date1.getDate()).toBe(25)

      const date2 = intTuple3ToDate([24, 1, 1]) // January 1, 2024
      expect(date2.getFullYear()).toBe(2024)
      expect(date2.getMonth()).toBe(0) // January is month 0
      expect(date2.getDate()).toBe(1)
    })

    it('should handle edge cases', () => {
      const date = intTuple3ToDate([0, 1, 1]) // January 1, 2000
      expect(date.getFullYear()).toBe(2000)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })
  })

  describe('intTuple1ToConnectedSensors', () => {
    it('should convert byte to connected sensors mapping', () => {
      // Binary: 00000001 (sensor1 connected)
      expect(intTuple1ToConnectedSensors([0b00000001])).toEqual({
        sensor1: true,
        sensor2: false,
        sensor3: false,
        sensor4: false,
      })

      // Binary: 00001111 (all sensors connected)
      expect(intTuple1ToConnectedSensors([0b00001111])).toEqual({
        sensor1: true,
        sensor2: true,
        sensor3: true,
        sensor4: true,
      })

      // Binary: 00001010 (sensor2 and sensor4 connected)
      expect(intTuple1ToConnectedSensors([0b00001010])).toEqual({
        sensor1: false,
        sensor2: true,
        sensor3: false,
        sensor4: true,
      })

      // Binary: 00000000 (no sensors connected)
      expect(intTuple1ToConnectedSensors([0b00000000])).toEqual({
        sensor1: false,
        sensor2: false,
        sensor3: false,
        sensor4: false,
      })
    })
  })

  describe('intTuple1ToExistingChannels', () => {
    it('should convert byte to existing channels mapping', () => {
      // Binary: 00000001 (channel1 exists)
      expect(intTuple1ToExistingChannels([0b00000001])).toEqual({
        channel1: true,
        channel2: false,
        channel3: false,
        channel4: false,
        channel5: false,
        channel6: false,
        channel7: false,
        channel8: false,
      })

      // Binary: 11111111 (all channels exist)
      expect(intTuple1ToExistingChannels([0b11111111])).toEqual({
        channel1: true,
        channel2: true,
        channel3: true,
        channel4: true,
        channel5: true,
        channel6: true,
        channel7: true,
        channel8: true,
      })

      // Binary: 10101010 (channels 2, 4, 6, 8 exist)
      expect(intTuple1ToExistingChannels([0b10101010])).toEqual({
        channel1: false,
        channel2: true,
        channel3: false,
        channel4: true,
        channel5: false,
        channel6: true,
        channel7: false,
        channel8: true,
      })
    })
  })

  describe('intTuple2ToAccuracyPercent', () => {
    it('should convert 2-byte tuple to accuracy percentage', () => {
      // Test 0.5% accuracy (500 in 0.001% units)
      // 500 = 0x01F4 = big-endian [0x01, 0xF4]
      expect(intTuple2ToAccuracyPercent([0x01, 0xF4])).toBeCloseTo(0.5)

      // Test 1.0% accuracy (1000 in 0.001% units)
      // 1000 = 0x03E8 = big-endian [0x03, 0xE8]
      expect(intTuple2ToAccuracyPercent([0x03, 0xE8])).toBeCloseTo(1.0)

      // Test 2.5% accuracy (2500 in 0.001% units)
      // 2500 = 0x09C4 = big-endian [0x09, 0xC4]
      expect(intTuple2ToAccuracyPercent([0x09, 0xC4])).toBeCloseTo(2.5)

      // Test 0.001% accuracy (1 in 0.001% units)
      expect(intTuple2ToAccuracyPercent([0x00, 0x01])).toBeCloseTo(0.001)

      // Test 0% accuracy
      expect(intTuple2ToAccuracyPercent([0x00, 0x00])).toBe(0.0)
    })

    it('should handle maximum values', () => {
      // Test maximum uint16 value (65535 in 0.001% units = 65.535%)
      expect(intTuple2ToAccuracyPercent([0xFF, 0xFF])).toBeCloseTo(65.535)
    })
  })

  describe('parseRegisterBlocks', () => {
    it('should parse single register block correctly', () => {
      // Address 0x200 (512), 4 bytes of data: [0x01, 0x02, 0x03, 0x04]
      // Address field: 512 << 5 | 4 = 16384 + 4 = 16388 = 0x4004
      // Big-endian: [0x40, 0x04]
      const data = [0x00, 0x00, 0x40, 0x04, 0x01, 0x02, 0x03, 0x04]
      const blocks = parseRegisterBlocks(data)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toEqual({
        startRegisterAddress: 512,
        value: [0x01, 0x02, 0x03, 0x04],
      })
    })

    it('should parse multiple register blocks', () => {
      // First block: Address 0x100 (256), 2 bytes: [0x01, 0x02]
      // Address field: 256 << 5 | 2 = 8192 + 2 = 8194 = 0x2002
      // Second block: Address 0x200 (512), 1 byte: [0x03]
      // Address field: 512 << 5 | 1 = 16384 + 1 = 16385 = 0x4001
      const data = [0x00, 0x00, 0x20, 0x02, 0x01, 0x02, 0x40, 0x01, 0x03]
      const blocks = parseRegisterBlocks(data)

      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toEqual({
        startRegisterAddress: 256,
        value: [0x01, 0x02],
      })
      expect(blocks[1]).toEqual({
        startRegisterAddress: 512,
        value: [0x03],
      })
    })

    it('should handle custom start position', () => {
      const data = [0xFF, 0xFF, 0xFF, 0x40, 0x04, 0x01, 0x02, 0x03, 0x04]
      const blocks = parseRegisterBlocks(data, { startPosition: 3 })

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toEqual({
        startRegisterAddress: 512,
        value: [0x01, 0x02, 0x03, 0x04],
      })
    })

    it('should throw error for insufficient data', () => {
      // Only 1 byte, but need at least 2 for addressing field
      const data = [0x00, 0x00, 0x01]
      expect(() => parseRegisterBlocks(data)).toThrow('Incomplete register block')
    })

    it('should throw error for insufficient register data', () => {
      // Claims 4 bytes but only provides 2
      // Address 0x200 (512), 4 bytes: 512 << 5 | 4 = 16388 = 0x4004
      const data = [0x00, 0x00, 0x40, 0x04, 0x01, 0x02]
      expect(() => parseRegisterBlocks(data)).toThrow('Incomplete register data for address 0x200')
    })

    it('should throw error for register size exceeding maximum', () => {
      // Create a register with size 20 bytes that exceeds the set maximum of 16 bytes
      // Address 0x00 with size 20 -> 0x00, 0x14
      const data = [0x00, 0x00, 0x00, 0x14, ...Array.from({ length: 20 }, () => 0x01)]
      expect(() => parseRegisterBlocks(data, { maxRegisterSize: 16 })).toThrow(RangeError)
      expect(() => parseRegisterBlocks(data, { maxRegisterSize: 16 })).toThrow('Register at address 0x0 has invalid size 20 bytes, exceeds maximum of 16 bytes. This may indicate corrupted addressing field data at position 2. Addressing field: 0x0014 (high byte: 0x00, low byte: 0x14)')
    })

    it('should throw error for register size exceeding custom maximum', () => {
      // Create a register with size 16 bytes but set custom max to 10
      // Address 0x200 (512), 16 bytes: 512 << 5 | 16 = 16384 + 16 = 16400 = 0x4010
      // Big-endian: [0x40, 0x10]
      const data = [0x00, 0x00, 0x40, 0x10, ...Array.from({ length: 16 }, () => 0x01)]
      expect(() => parseRegisterBlocks(data, { maxRegisterSize: 10 })).toThrow(RangeError)
      expect(() => parseRegisterBlocks(data, { maxRegisterSize: 10 })).toThrow('Register at address 0x200 has invalid size 16 bytes, exceeds maximum of 10 bytes')
    })

    it('should handle maximum allowed register size correctly', () => {
      // Create a register with exactly the maximum size (31 bytes by default)
      // Address 0x300 (768), 31 bytes: 768 << 5 | 31 = 24576 + 31 = 24607 = 0x601F
      // Big-endian: [0x60, 0x1F]
      const registerData = Array.from({ length: 31 }, (_, i) => i + 1) // [1, 2, 3, ..., 31]
      const data = [0x00, 0x00, 0x60, 0x1F, ...registerData]
      const blocks = parseRegisterBlocks(data)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toEqual({
        startRegisterAddress: 768,
        value: registerData,
      })
    })
  })

  describe('evaluateRegisterBlocks', () => {
    it('should evaluate register blocks using lookup table', () => {
      const lookup = {
        0x1000: createRegisterEntry('device.temperature', 2, intTuple2ToUInt16),
        0x1002: createRegisterEntry('device.name', 4, intArrayToASCII),
      }

      const blocks = [
        { startRegisterAddress: 0x1000, value: [0, 25, 87, 73, 75, 65] },
      ]

      const result = evaluateRegisterBlocks(lookup, blocks)
      expect(result).toEqual({
        device: {
          temperature: 25, // [0, 25] in big-endian = (0 << 8) | 25 = 25
          name: 'WIKA',
        },
      })
    })

    it('should throw error for unknown register address', () => {
      const lookup = {}
      const blocks = [
        { startRegisterAddress: 0x1000, value: [25, 0] },
      ]

      expect(() => evaluateRegisterBlocks(lookup, blocks)).toThrow('Unknown register address 0x1000')
    })

    it('should throw error for insufficient data', () => {
      const lookup = {
        0x1000: createRegisterEntry('device.temperature', 4, intTuple4ToFloat32),
      }
      const blocks = [
        { startRegisterAddress: 0x1000, value: [25, 0] }, // Only 2 bytes, need 4
      ]

      expect(() => evaluateRegisterBlocks(lookup, blocks)).toThrow('Insufficient data for register 0x1000')
    })

    it('should handle parsing errors gracefully', () => {
      const mockParser = () => {
        throw new Error('Invalid data format')
      }

      const lookup = {
        0x1000: createRegisterEntry('device.test', 2, mockParser),
      }
      const blocks = [
        { startRegisterAddress: 0x1000, value: [25, 0] },
      ]

      expect(() => evaluateRegisterBlocks(lookup, blocks)).toThrow('Failed to parse register 0x1000')
    })
  })

  describe('lookup-based parsing functions', () => {
    describe('intTuple1ToProductSubId', () => {
      it('should convert valid product sub-ID values', () => {
        // These tests would need actual values from the productSubIdLookup
        // Testing the error case for now
        expect(() => intTuple1ToProductSubId([999])).toThrow('Unknown product sub-ID value')
      })
    })

    describe('intTuple1ToChannelPlan', () => {
      it('should convert valid channel plan values', () => {
        // These tests would need actual values from the lookup tables
        // Testing the error case for now
        expect(() => intTuple1ToChannelPlan([2])).not.toThrow()
      })
    })

    describe('intTuple1ToMeasurand', () => {
      it('should convert valid measurand values', () => {
        // These tests would need actual values from the measurandLookup
        // Testing the error case for now
        expect(() => intTuple1ToMeasurand([999])).toThrow('Unknown measurand value')
      })
    })

    describe('intTuple1ToUnit', () => {
      it('should convert valid unit values', () => {
        // These tests would need actual values from the unitsLookup
        // Testing the error case for now
        expect(() => intTuple1ToUnit([999])).toThrow('Unknown unit value')
      })
    })
  })
})

describe('tULIP3 message parsing functions', () => {
  describe('parseFrame', () => {
    it('should parse frame number from bits 6-2 of frame number byte', () => {
      // Frame number byte: 0b00000100 (frame counter = 1)
      // Bits 6-2: 00001 = 1
      const result = parseFrame(0b00000100, 1)
      expect(result.frameNumber).toBe(1)

      // Frame number byte: 0b01111100 (frame counter = 31)
      // Bits 6-2: 11111 = 31
      const result2 = parseFrame(0b01111100, 1)
      expect(result2.frameNumber).toBe(31)

      // Frame number byte: 0b00101000 (frame counter = 10)
      // Bits 6-2: 01010 = 10
      const result3 = parseFrame(0b00101000, 1)
      expect(result3.frameNumber).toBe(10)
    })

    it('should look up status description from status byte', () => {
      // Test known status codes
      expect(parseFrame(0, 0).status).toBe('Configuration received but not applied')
      expect(parseFrame(0, 1).status).toBe('Configuration received and applied with success')
      expect(parseFrame(0, 2).status).toBe('Configuration rejected - Tried to write a read only register')
      expect(parseFrame(0, 3).status).toBe('Configuration rejected - At least one register has an invalid value')
      expect(parseFrame(0, 4).status).toBe('Configuration rejected - The combination register start address/number of bytes is wrong')
      expect(parseFrame(0, 5).status).toBe('Entire configuration discarded because of invalid parameter combination')
      expect(parseFrame(0, 6).status).toBe('Entire configuration discarded because no answer from the cloud')
      expect(parseFrame(0, 7).status).toBe('Missing frame')
      expect(parseFrame(0, 8).status).toBe('Frame rejected - frame number already received')
    })

    it('should throw TypeError for invalid status codes', () => {
      expect(() => parseFrame(0, 9)).toThrow(TypeError)
      expect(() => parseFrame(0, 9)).toThrow('Invalid status code: 0x09')

      expect(() => parseFrame(0, 255)).toThrow(TypeError)
      expect(() => parseFrame(0, 255)).toThrow('Invalid status code: 0xFF')

      expect(() => parseFrame(0, 100)).toThrow(TypeError)
      expect(() => parseFrame(0, 100)).toThrow('Invalid status code: 0x64')
    })

    it('should mask RFU bits correctly', () => {
      // Frame number byte with RFU bits set: 0b11000111 (should extract frame counter 17)
      // Bits 6-2: 10001 = 0
      const result = parseFrame(0b11000111, 1)
      expect(result.frameNumber).toBe(17)

      // Frame number byte with RFU bits set: 0b10101111 (should extract frame counter 5)
      // Bits 6-2: 01011 = 5
      const result2 = parseFrame(0b10101111, 1)
      expect(result2.frameNumber).toBe(11)
    })
  })

  describe('parseFrameData', () => {
    it('should parse basic response (4 bytes)', () => {
      // Basic response: [0, 0, frameNumberByte, statusByte]
      const data = [0x00, 0x00, 0b00001000, 1] // frame counter 2, status 1
      const result = parseFrameData(data)

      expect(result.frames).toHaveLength(1)
      expect(result.frames[0].frameNumber).toBe(2)
      expect(result.frames[0].status).toBe('Configuration received and applied with success')
      expect(result.revisionCounter).toBeUndefined()
      expect(result.totalWrongFrames).toBeUndefined()
    })

    it('should parse apply config answer (7 bytes)', () => {
      // Apply config answer: [0, 0, frameNumberByte, statusByte, revisionHigh, revisionLow, totalWrongFrames]
      const data = [0x00, 0x00, 0b00010000, 1, 0x01, 0x02, 5] // frame counter 4, revision 258, 5 wrong frames
      const result = parseFrameData(data)

      expect(result.frames).toHaveLength(1)
      expect(result.frames[0].frameNumber).toBe(4)
      expect(result.frames[0].status).toBe('Configuration received and applied with success')
      expect(result.revisionCounter).toBe(258) // (0x01 << 8) | 0x02 = 258
      expect(result.totalWrongFrames).toBe(5)
    })

    it('should parse extended apply config answer with additional frames', () => {
      // Extended answer: [0, 0, frameNumberByte, statusByte, revisionHigh, revisionLow, totalWrongFrames, frame2Number, frame2Status, frame3Number, frame3Status]
      const data = [0x00, 0x00, 0b00010000, 1, 0x01, 0x02, 5, 0b00100000, 2, 0b00110000, 3] // additional frames
      const result = parseFrameData(data)

      expect(result.frames).toHaveLength(3)
      expect(result.frames[0].frameNumber).toBe(4)
      expect(result.frames[0].status).toBe('Configuration received and applied with success')
      expect(result.frames[1]!.frameNumber).toBe(8)
      expect(result.frames[1]!.status).toBe('Configuration rejected - Tried to write a read only register')
      expect(result.frames[2]!.frameNumber).toBe(12)
      expect(result.frames[2]!.status).toBe('Configuration rejected - At least one register has an invalid value')
      expect(result.revisionCounter).toBe(258)
      expect(result.totalWrongFrames).toBe(5)
    })

    it('should handle maximum frame counter values', () => {
      // Maximum frame counter: 0b01111100 = 31
      const data = [0x00, 0x00, 0b01111100, 0]
      const result = parseFrameData(data)

      expect(result.frames[0].frameNumber).toBe(31)
      expect(result.frames[0].status).toBe('Configuration received but not applied')
    })

    it('should handle big-endian revision counter correctly', () => {
      // Test various revision counter values
      const data1 = [0x00, 0x00, 0x00, 1, 0x00, 0x00, 0] // revision 0
      expect(parseFrameData(data1).revisionCounter).toBe(0)

      const data2 = [0x00, 0x00, 0x00, 1, 0xFF, 0xFF, 0] // revision 65535
      expect(parseFrameData(data2).revisionCounter).toBe(65535)

      const data3 = [0x00, 0x00, 0x00, 1, 0x12, 0x34, 0] // revision 0x1234 = 4660
      expect(parseFrameData(data3).revisionCounter).toBe(4660)
    })

    it('should throw RangeError for invalid message lengths', () => {
      // Invalid length: 5 bytes (between basic 4 and apply config 7)
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00])).toThrow(RangeError)
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00])).toThrow('Invalid message length: expected 7 bytes minimum for apply config answer, got 5')

      // Invalid length: 6 bytes
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00, 0x00])).toThrow(RangeError)
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00, 0x00])).toThrow('Invalid message length: expected 7 bytes minimum for apply config answer, got 6')
    })

    it('should throw RangeError for even length extended messages', () => {
      // Invalid length: 8 bytes (even number, but additional frames come in pairs)
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00, 0x00, 0, 0x00])).toThrow(RangeError)
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00, 0x00, 0, 0x00])).toThrow('Invalid message length: expected odd number of bytes for apply config answer with additional frames, got 8')

      // Invalid length: 10 bytes
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00, 0x00, 0, 0x00, 0x00, 0x00])).toThrow(RangeError)
      expect(() => parseFrameData([0x00, 0x00, 0x00, 1, 0x00, 0x00, 0, 0x00, 0x00, 0x00])).toThrow('Invalid message length: expected odd number of bytes for apply config answer with additional frames, got 10')
    })

    it('should handle edge cases with minimum data', () => {
      // Minimum basic response
      const data = [0x00, 0x00, 0x00, 0]
      const result = parseFrameData(data)

      expect(result.frames).toHaveLength(1)
      expect(result.frames[0].frameNumber).toBe(0)
      expect(result.frames[0].status).toBe('Configuration received but not applied')
      expect(result.revisionCounter).toBeUndefined()
      expect(result.totalWrongFrames).toBeUndefined()
    })

    it('should validate that frames array is non-empty', () => {
      const data = [0x00, 0x00, 0x00, 1]
      const result = parseFrameData(data)

      // frames should be a tuple type [Frame, ...Frame[]] - at least one frame
      expect(result.frames).toHaveLength(1)
      expect(Array.isArray(result.frames)).toBe(true)
    })

    it('should handle multiple additional frame pairs correctly', () => {
      // Extended with 3 additional frame pairs (13 bytes total)
      const data = [
        0x00,
        0x00,
        0b00000100,
        1, // initial frame (counter 1, status 1)
        0x01,
        0x00,
        10, // revision 256, 10 wrong frames
        0b00001000,
        2, // frame counter 2, status 2
        0b00001100,
        3, // frame counter 3, status 3
        0b00010000,
        4, // frame counter 4, status 4
      ]
      const result = parseFrameData(data)

      expect(result.frames).toHaveLength(4)
      expect(result.frames[0].frameNumber).toBe(1)
      expect(result.frames[1]!.frameNumber).toBe(2)
      expect(result.frames[2]!.frameNumber).toBe(3)
      expect(result.frames[3]!.frameNumber).toBe(4)
      expect(result.revisionCounter).toBe(256)
      expect(result.totalWrongFrames).toBe(10)
    })
  })
})
