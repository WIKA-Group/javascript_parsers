import { describe, expect, it } from 'vitest'
import { createMultipleEncoderFactory } from '../../../../src/codecs/tulip3/encoder/encode'
import {
  encodeForceCloseSessionComplete,
  encodeGetAlarmStatusComplete,
  encodeNewBatteryInsertedComplete,
  encodeRestoreDefaultConfigurationComplete,
} from '../../../../src/codecs/tulip3/encoder/encodeGeneric'
import { createCompleteTULIP3Profile } from '../constants/completeProfile'

describe('tULIP3 Downlink Encoding - Generic Commands', () => {
  const profile = createCompleteTULIP3Profile()
  const encode = createMultipleEncoderFactory(profile)
  const byteLimit = 51 // Standard LoRaWAN payload limit

  describe('force Close Session', () => {
    it('should encode force close session', () => {
      const expected = [0x03, 0x01]

      const directResult = encodeForceCloseSessionComplete({ byteLimit })
      const factoryResult = encode({ action: 'forceCloseSession' })

      expect(directResult.errors).toBeUndefined()
      expect(directResult.frames).toBeDefined()
      expect(directResult.frames).toHaveLength(1)
      expect(directResult.frames![0]).toEqual(expected)
      expect(directResult.fPort).toBe(1)

      // Verify factory produces same result
      expect(factoryResult).toEqual(directResult)
    })
  })

  describe('restore Default Configuration', () => {
    it('should encode restore default configuration', () => {
      const expected = [0x03, 0x02]

      const directResult = encodeRestoreDefaultConfigurationComplete({ byteLimit })
      const factoryResult = encode({ action: 'restoreDefaultConfiguration' })

      expect(directResult.errors).toBeUndefined()
      expect(directResult.frames).toBeDefined()
      expect(directResult.frames).toHaveLength(1)
      expect(directResult.frames![0]).toEqual(expected)
      expect(directResult.fPort).toBe(1)

      // Verify factory produces same result
      expect(factoryResult).toEqual(directResult)
    })
  })

  describe('new Battery Inserted', () => {
    it('should encode new battery inserted', () => {
      const expected = [0x03, 0x03]

      const directResult = encodeNewBatteryInsertedComplete({ byteLimit })
      const factoryResult = encode({ action: 'newBatteryInserted' })

      expect(directResult.errors).toBeUndefined()
      expect(directResult.frames).toBeDefined()
      expect(directResult.frames).toHaveLength(1)
      expect(directResult.frames![0]).toEqual(expected)
      expect(directResult.fPort).toBe(1)

      // Verify factory produces same result
      expect(factoryResult).toEqual(directResult)
    })
  })

  describe('get Alarm Status', () => {
    describe('single alarm type requests', () => {
      it('should encode get alarm status - Process alarm only', () => {
        const expected = [0x04, 0x01, 0b0001]

        const input = {
          processAlarmRequested: true,
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })

      it('should encode get alarm status - CM alarm only', () => {
        const expected = [0x04, 0x01, 0b0010]

        const input = {
          cmAlarmRequested: true,
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })

      it('should encode get alarm status - Sensor alarm only', () => {
        const expected = [0x04, 0x01, 0b0100]

        const input = {
          sensorAlarmRequested: true,
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })

      it('should encode get alarm status - Channel alarm only', () => {
        const expected = [0x04, 0x01, 0b1000]

        const input = {
          channelAlarmRequested: true,
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })
    })

    describe('multiple alarm type combinations', () => {
      it('should encode get alarm status - Process + CM alarms', () => {
        const expected = [0x04, 0x01, 0b0011]

        const input = {
          processAlarmRequested: true,
          cmAlarmRequested: true,
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })

      it('should encode get alarm status - All alarm types', () => {
        const expected = [0x04, 0x01, 0b1111]

        const input = {
          processAlarmRequested: true,
          cmAlarmRequested: true,
          sensorAlarmRequested: true,
          channelAlarmRequested: true,
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })
    })

    describe('targeted sensor/channel requests', () => {
      it('should encode get alarm status - Single sensor/channel target', () => {
        // Sensor 1 (ID 0), Channel 1 (ID 0): 0b00_000_000 = 0x00
        const expected = [0x04, 0x01, 0b1111, 0x00]

        const input = {
          processAlarmRequested: true,
          cmAlarmRequested: true,
          sensorAlarmRequested: true,
          channelAlarmRequested: true,
          targets: {
            sensor1: {
              channel1: true,
            },
          },
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })

      it('should encode get alarm status - Multiple sensor/channel targets', () => {
        // Sensor 1 (ID 0), Channel 1 (ID 0): 0b00_000_000 = 0x00
        const expected = [0x04, 0x01, 0b1111, 0x00]

        const input = {
          processAlarmRequested: true,
          cmAlarmRequested: true,
          sensorAlarmRequested: true,
          channelAlarmRequested: true,
          targets: {
            sensor1: {
              channel1: true,
              // Note: channel2 is omitted - not requesting all channels, so target bytes are included
            },
          },
        }

        const directResult = encodeGetAlarmStatusComplete(
          input,
          profile.sensorChannelConfig,
          { byteLimit },
        )

        expect(directResult.errors).toBeUndefined()
        expect(directResult.frames).toBeDefined()
        expect(directResult.frames).toHaveLength(1)
        expect(directResult.frames![0]).toEqual(expected)
        expect(directResult.fPort).toBe(1)

        // Verify factory produces same result
        const factoryResult = encode({ action: 'getAlarmStatus', input })
        expect(factoryResult).toEqual(directResult)
      })
    })
  })
})
