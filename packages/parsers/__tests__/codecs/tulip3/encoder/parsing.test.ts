import { describe, expect, it } from 'vitest'
import {
  booleanToIntTuple1,
  float32ToIntTuple4,
  int8ToIntTuple1,
  numberToIntTuple4,
  processAlarmEnabledToIntTuple1,
  protocolDataTypeToIntTuple1,
  sampleChannelsToIntTuple1,
  uint8ToIntTuple1,
  uint16ToIntTuple2,
  uint32ToIntTuple4,
  unitToIntTuple1,
} from '../../../../src/codecs/tulip3/encoder/parsing'

describe('encoder/parsing', () => {
  describe('uint8ToIntTuple1', () => {
    it('encodes valid uint8 values', () => {
      expect(uint8ToIntTuple1(0)).toEqual([0])
      expect(uint8ToIntTuple1(255)).toEqual([255])
      expect(uint8ToIntTuple1(42)).toEqual([42])
    })

    it('throws for invalid uint8 values', () => {
      expect(() => uint8ToIntTuple1(-1)).toThrow(TypeError)
      expect(() => uint8ToIntTuple1(256)).toThrow(TypeError)
      expect(() => uint8ToIntTuple1(1.2)).toThrow(TypeError)
    })
  })

  describe('int8ToIntTuple1', () => {
    it('encodes valid int8 values', () => {
      expect(int8ToIntTuple1(-128)).toEqual([128])
      expect(int8ToIntTuple1(-1)).toEqual([255])
      expect(int8ToIntTuple1(0)).toEqual([0])
      expect(int8ToIntTuple1(127)).toEqual([127])
    })

    it('throws for invalid int8 values', () => {
      expect(() => int8ToIntTuple1(-129)).toThrow(TypeError)
      expect(() => int8ToIntTuple1(128)).toThrow(TypeError)
      expect(() => int8ToIntTuple1(2.5)).toThrow(TypeError)
    })
  })

  describe('uint16ToIntTuple2', () => {
    it('encodes valid uint16 values in big-endian', () => {
      expect(uint16ToIntTuple2(0)).toEqual([0, 0])
      expect(uint16ToIntTuple2(0x1234)).toEqual([0x12, 0x34])
      expect(uint16ToIntTuple2(65535)).toEqual([255, 255])
    })

    it('throws for invalid uint16 values', () => {
      expect(() => uint16ToIntTuple2(-1)).toThrow(TypeError)
      expect(() => uint16ToIntTuple2(65536)).toThrow(TypeError)
      expect(() => uint16ToIntTuple2(12.3)).toThrow(TypeError)
    })
  })

  describe('uint32ToIntTuple4', () => {
    it('encodes valid uint32 values in big-endian', () => {
      expect(uint32ToIntTuple4(0)).toEqual([0, 0, 0, 0])
      expect(uint32ToIntTuple4(0x12345678)).toEqual([0x12, 0x34, 0x56, 0x78])
      expect(uint32ToIntTuple4(0xFFFFFFFF)).toEqual([0xFF, 0xFF, 0xFF, 0xFF])
    })

    it('throws for invalid uint32 values', () => {
      expect(() => uint32ToIntTuple4(-1)).toThrow(TypeError)
      expect(() => uint32ToIntTuple4(4294967296)).toThrow(TypeError)
      expect(() => uint32ToIntTuple4(1.1)).toThrow(TypeError)
    })
  })

  describe('float32ToIntTuple4', () => {
    it('encodes finite numbers to IEEE-754 big-endian bytes', () => {
      expect(float32ToIntTuple4(0)).toEqual([0x00, 0x00, 0x00, 0x00])
      expect(float32ToIntTuple4(1)).toEqual([0x3F, 0x80, 0x00, 0x00])
      expect(float32ToIntTuple4(-1)).toEqual([0xBF, 0x80, 0x00, 0x00])
    })

    it('throws for non-finite numbers', () => {
      expect(() => float32ToIntTuple4(Number.POSITIVE_INFINITY)).toThrow(TypeError)
      expect(() => float32ToIntTuple4(Number.NEGATIVE_INFINITY)).toThrow(TypeError)
      expect(() => float32ToIntTuple4(Number.NaN)).toThrow(TypeError)
    })
  })

  describe('numberToIntTuple4', () => {
    it('uses float32 encoding', () => {
      expect(numberToIntTuple4(3.5)).toEqual(float32ToIntTuple4(3.5))
    })
  })

  describe('booleanToIntTuple1', () => {
    it('encodes booleans to 0/1', () => {
      expect(booleanToIntTuple1(true)).toEqual([1])
      expect(booleanToIntTuple1(false)).toEqual([0])
    })
  })

  describe('unitToIntTuple1', () => {
    it('encodes valid unit strings', () => {
      expect(unitToIntTuple1('°C')).toEqual([1])
      expect(unitToIntTuple1('bar')).toEqual([7])
    })

    it('throws for unknown unit strings', () => {
      expect(() => unitToIntTuple1('not-a-unit')).toThrow(TypeError)
      expect(() => unitToIntTuple1('not-a-unit')).toThrow('Unknown unit string')
    })
  })

  describe('sampleChannelsToIntTuple1', () => {
    it('encodes empty channel map to zero', () => {
      expect(sampleChannelsToIntTuple1({})).toEqual([0x00])
    })

    it('encodes selected channels to bitfield', () => {
      expect(sampleChannelsToIntTuple1({ channel1: true })).toEqual([0x01])
      expect(sampleChannelsToIntTuple1({ channel2: true, channel4: true, channel8: true })).toEqual([0x8A])
    })

    it('encodes all channels enabled', () => {
      expect(sampleChannelsToIntTuple1({
        channel1: true,
        channel2: true,
        channel3: true,
        channel4: true,
        channel5: true,
        channel6: true,
        channel7: true,
        channel8: true,
      })).toEqual([0xFF])
    })
  })

  describe('protocolDataTypeToIntTuple1', () => {
    it('encodes known protocol data type strings', () => {
      expect(protocolDataTypeToIntTuple1('float - IEEE754')).toEqual([0])
      expect(protocolDataTypeToIntTuple1('uint16 - TULIP scale 2500 - 12500')).toEqual([3])
    })

    it('throws for unknown protocol data type strings', () => {
      expect(() => protocolDataTypeToIntTuple1('unsupported-type')).toThrow(TypeError)
      expect(() => protocolDataTypeToIntTuple1('unsupported-type')).toThrow('Unknown protocol data type')
    })
  })

  describe('processAlarmEnabledToIntTuple1', () => {
    it('encodes empty alarm map to zero', () => {
      expect(processAlarmEnabledToIntTuple1({})).toEqual([0x00])
    })

    it('encodes each supported alarm bit', () => {
      expect(processAlarmEnabledToIntTuple1({ lowThreshold: true })).toEqual([0x80])
      expect(processAlarmEnabledToIntTuple1({ highThreshold: true })).toEqual([0x40])
      expect(processAlarmEnabledToIntTuple1({ fallingSlope: true })).toEqual([0x20])
      expect(processAlarmEnabledToIntTuple1({ risingSlope: true })).toEqual([0x10])
      expect(processAlarmEnabledToIntTuple1({ lowThresholdWithDelay: true })).toEqual([0x08])
      expect(processAlarmEnabledToIntTuple1({ highThresholdWithDelay: true })).toEqual([0x04])
    })

    it('encodes combined alarm bits', () => {
      expect(processAlarmEnabledToIntTuple1({
        lowThreshold: true,
        highThreshold: true,
        fallingSlope: true,
        risingSlope: true,
        lowThresholdWithDelay: true,
        highThresholdWithDelay: true,
      })).toEqual([0xFC])
    })
  })
})
