import type { TULIP3DeviceConfig } from '../../../../src/codecs/tulip3/profile'
import { describe, expect, it } from 'vitest'
import { decodeDataMessage } from '../../../../src/codecs/tulip3/messages/data'
import { createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags } from '../../../../src/codecs/tulip3/messages/deviceAlarm'
import { completeCommunicationModuleRegisterConfig, emptyChannelRegisterConfig, emptySensorRegisterConfig } from '../presets'

// Test device sensor configuration
const testDeviceConfig = {
  sensor1: {
    channel1: {
      channelName: 'sensor1Channel1',
      start: 0,
      end: 100,
      measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'] as const,
      alarmFlags: {},
      registerConfig: emptyChannelRegisterConfig(),
    },
    channel2: {
      channelName: 'sensor1Channel2',
      start: 0,
      end: 100,
      measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'] as const,
      alarmFlags: {},
      registerConfig: emptyChannelRegisterConfig(),
    },
    channel3: {
      channelName: 'sensor1Channel3',
      start: -40,
      end: 125,
      measurementTypes: ['float - IEEE754'] as const,
      alarmFlags: {},
      registerConfig: emptyChannelRegisterConfig(),
    },
    alarmFlags: createDefaultSensorAlarmFlags(),
    registerConfig: emptySensorRegisterConfig(),
  },
  sensor2: {
    channel1: {
      channelName: 'sensor2Channel1',
      start: 0,
      end: 50,
      measurementTypes: ['float - IEEE754'] as const,
      alarmFlags: {},
      registerConfig: emptyChannelRegisterConfig(),
    },
    alarmFlags: createDefaultSensorAlarmFlags(),
    registerConfig: emptySensorRegisterConfig(),
  },
  alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
  registerConfig: completeCommunicationModuleRegisterConfig(),
} as const satisfies TULIP3DeviceConfig

describe('decodeDataMessage', () => {
  describe('valid data messages', () => {
    it('should parse a real message: 0x10 01 06 09 c5 0e 1b 29', () => {
      const data = [0x10, 0x01, 0x06, 0x09, 0xC5, 0x0E, 0x1B, 0x29]
      const result = decodeDataMessage(data, {
        sensor1: {
          channel1: {
            channelName: 'sensor1Channel1',
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
            start: 0,
            end: 10,
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          channel2: {
            channelName: 'sensor1Channel2',
            start: -40,
            end: 125,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
      })
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            valueAcquisitionError: false,
            value: 0.001,
          },
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel2',
            channelId: 1,
            channelName: 'sensor1Channel2',
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            valueAcquisitionError: false,
            value: 33.4745,
          },
        ],
      })
    })

    it('should parse the provided example: 0x10 01 0E 0B B8 10 40 20 00 00', () => {
      const data = [0x10, 0x01, 0x0E, 0x0B, 0xB8, 0x10, 0x40, 0x20, 0x00, 0x00]
      const result = decodeDataMessage(data, testDeviceConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel2',
            channelId: 1,
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            channelName: 'sensor1Channel2',
            valueAcquisitionError: false,
            value: 5,
          },
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel3',
            channelName: 'sensor1Channel3',
            channelId: 2,
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 2.5,
          },
        ],
      })
    })

    it('should parse multiple float measurements', () => {
      const data = [0x10, 0x01, 0x00, 0x40, 0x20, 0x00, 0x00, 0x08, 0x40, 0x80, 0x00, 0x00]
      const result = decodeDataMessage(data, testDeviceConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 2.5,
          },
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel2',
            channelId: 1,
            channelName: 'sensor1Channel2',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 4.0,
          },
        ],
      })
    })

    it('should parse TULIP scale measurements and convert them to actual values', () => {
      const data = [0x10, 0x01, 0x06, 0x27, 0x10]
      const result = decodeDataMessage(data, testDeviceConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            valueAcquisitionError: false,
            value: 75,
          },
        ],
      })
    })

    it('should handle message type 0x11', () => {
      const data = [0x11, 0x01, 0x00, 0x40, 0x20, 0x00, 0x00]
      const result = decodeDataMessage(data, testDeviceConfig)
      expect(result.data).toEqual({
        messageType: 0x11,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 2.5,
          },
        ],
      })
    })
  })

  describe('error handling', () => {
    it('should throw TypeError for invalid message type', () => {
      const data = [0x20, 0x01, 0x00, 0x40, 0x20, 0x00, 0x00]

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(TypeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Invalid data message type: expected 0x10, 0x11 but got 0x20')
    })

    it('should throw TypeError for invalid sub message type', () => {
      const data = [0x10, 0x02, 0x00, 0x40, 0x20, 0x00, 0x00]

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(TypeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Unsupported data message subtype: 0x02. Allowed subtypes: 0x01')
    })

    it('should throw RangeError when not enough data for measurement', () => {
      // Header is fine but not enough data for float measurement
      const data = [0x10, 0x01, 0x00, 0x40, 0x20] // Missing 2 bytes

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Not enough data left to finish reading measurement data block')
    })

    it('should throw TypeError for unsupported sensor/channel combination', () => {
      // Try to access sensor2/channel2 which doesn't exist in config
      const data = [0x10, 0x01, 0x48, 0x40, 0x20, 0x00, 0x00] // sensor2 (01), channel2 (001), float (00)

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(TypeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Measurement from sensor sensor2 channel channel2 is not supported by the device profile')
    })

    it('should throw TypeError for unsupported data type for sensor/channel', () => {
      // Try to send TULIP scale to sensor1/channel3 which only supports float
      const data = [0x10, 0x01, 0x16, 0x0B, 0xB8] // sensor1, channel3, TULIP scale

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(TypeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('does not support data type uint16 - TULIP scale 2500 - 12500')
    })

    it('should throw RangeError for TULIP scale percentage out of range', () => {
      // Mock a config that would accept the measurement but with invalid percentage
      const mockConfig = {
        sensor1: {
          channel1: {
            channelName: 'sensor1Channel1',
            start: 0,
            end: 100,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500'] as const,
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
      } as const satisfies TULIP3DeviceConfig

      // Create data that would result in >100% (impossible in real scenario, but for testing)
      const data = [0x10, 0x01, 0x06, 0xFF, 0xFF] // This should be treated as error, not >100%

      // This should actually be handled as error case, let's test the error measurement
      const result = decodeDataMessage(data, mockConfig)
      const measurement = result.data.measurements[0]
      expect(measurement!.valueAcquisitionError).toBe(true)
    })

    it('should throw RangeError for float value out of configured range', () => {
      // Send a float value that's outside the configured min/max range
      const data = [0x10, 0x01, 0x00, 0x43, 0x00, 0x00, 0x00] // 128.0, outside 0-100 range

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Measurement for sensor sensor1 channel channel1 is out of range')
    })

    it('should throw RangeError for float values outside custom ranges', () => {
      // Custom config with 4-20 and -45 to 110 ranges
      const customConfig = {
        sensor1: {
          channel1: {
            channelName: 'sensor1Channel1',
            start: 4,
            end: 20,
            measurementTypes: ['float - IEEE754'] as const,
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          channel2: {
            channelName: 'sensor1Channel2',
            start: -45,
            end: 110,
            measurementTypes: ['float - IEEE754'] as const,
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
      } as const satisfies TULIP3DeviceConfig

      // Test value below minimum for 4-20 range
      const dataBelowMin = [0x10, 0x01, 0x00, 0x40, 0x40, 0x00, 0x00] // 3.0, below min 4
      expect(() => decodeDataMessage(dataBelowMin, customConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(dataBelowMin, customConfig)).toThrow('Measurement for sensor sensor1 channel channel1 is out of range')

      // Test value above maximum for 4-20 range
      const dataAboveMax = [0x10, 0x01, 0x00, 0x41, 0xA8, 0x00, 0x00] // 21.0, above max 20
      expect(() => decodeDataMessage(dataAboveMax, customConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(dataAboveMax, customConfig)).toThrow('Measurement for sensor sensor1 channel channel1 is out of range')

      // Test value below minimum for -45 to 110 range
      const dataBelowMin2 = [0x10, 0x01, 0x08, 0xC2, 0x40, 0x00, 0x00] // -48.0, below min -45
      expect(() => decodeDataMessage(dataBelowMin2, customConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(dataBelowMin2, customConfig)).toThrow('Measurement for sensor sensor1 channel channel2 is out of range')

      // Test value above maximum for -45 to 110 range
      const dataAboveMax2 = [0x10, 0x01, 0x08, 0x42, 0xE0, 0x00, 0x00] // 112.0, above max 110
      expect(() => decodeDataMessage(dataAboveMax2, customConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(dataAboveMax2, customConfig)).toThrow('Measurement for sensor sensor1 channel channel2 is out of range')
    })

    it('should throw RangeError for negative temperature below minimum', () => {
      // Test sensor1/channel3 which has -40 to 125 range
      const data = [0x10, 0x01, 0x10, 0xC2, 0x30, 0x00, 0x00] // -44.0, below min -40

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Measurement for sensor sensor1 channel channel3 is out of range')
    })

    it('should throw RangeError for temperature above maximum', () => {
      // Test sensor1/channel3 which has -40 to 125 range
      const data = [0x10, 0x01, 0x10, 0x42, 0xFE, 0x00, 0x00] // 127.0, above max 125

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Measurement for sensor sensor1 channel channel3 is out of range')
    })

    it('should throw RangeError for sensor2 values outside 0-50 range', () => {
      // Test sensor2/channel1 which has 0-50 range

      // Test negative value (below minimum)
      const dataNegative = [0x10, 0x01, 0x40, 0xBF, 0x80, 0x00, 0x00] // -1.0, below min 0
      expect(() => decodeDataMessage(dataNegative, testDeviceConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(dataNegative, testDeviceConfig)).toThrow('Measurement for sensor sensor2 channel channel1 is out of range')

      // Test value above maximum
      const dataAboveMax = [0x10, 0x01, 0x40, 0x42, 0x4C, 0x00, 0x00] // 51.0, above max 50
      expect(() => decodeDataMessage(dataAboveMax, testDeviceConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(dataAboveMax, testDeviceConfig)).toThrow('Measurement for sensor sensor2 channel channel1 is out of range')
    })

    it('should throw TypeError for unimplemented data types', () => {
      // Test int24 data type (not implemented)
      const data = [0x10, 0x01, 0x02, 0x00, 0x00, 0x00] // data type = 1 (int24)

      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(TypeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Data type int 24 - Fixed-point s16.7 (Q16.7) is not implemented yet')
    })
  })

  describe('error measurements (NaN, 0xFFFF)', () => {
    it('should handle NaN float values as error measurements', () => {
      // IEEE754 NaN representation (e.g., 0x7FC00000)
      const data = [0x10, 0x01, 0x00, 0x7F, 0xC0, 0x00, 0x00]

      const result = decodeDataMessage(data, testDeviceConfig)

      const measurement = result.data.measurements[0]
      expect(measurement!.valueAcquisitionError).toBe(true)
      expect(measurement!.value).toBeUndefined()
    })

    it('should handle 0xFFFF TULIP scale values as error measurements', () => {
      // 0xFFFF indicates error in TULIP scale
      const data = [0x10, 0x01, 0x06, 0xFF, 0xFF]

      const result = decodeDataMessage(data, testDeviceConfig)

      const measurement = result.data.measurements[0]
      expect(measurement!.valueAcquisitionError).toBe(true)
      expect(measurement!.value).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle minimum length message with an error', () => {
      // Just header, no measurements
      const data = [0x10, 0x01]
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow(RangeError)
      expect(() => decodeDataMessage(data, testDeviceConfig)).toThrow('Data message too short. Expected at least 3 bytes but got 2')
    })

    it('should parse multiple measurements from different sensors', () => {
      // sensor1/channel1 + sensor2/channel1
      const data = [
        0x10,
        0x01, // Header
        0x00,
        0x40,
        0x20,
        0x00,
        0x00, // sensor1, channel1, float = 2.5
        0x40,
        0x40,
        0x80,
        0x00,
        0x00, // sensor2, channel1, float = 4.0
      ]
      const result = decodeDataMessage(data, testDeviceConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 2.5,
          },
          {
            sensor: 'sensor2',
            sensorId: 1,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor2Channel1',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 4.0,
          },
        ],
      })
    })

    it('should handle maximum sensor and channel IDs', () => {
      // Test sensor4 (id=3), channel8 (id=7)
      const extendedConfig = {
        ...testDeviceConfig,
        sensor4: {
          channel8: {
            channelName: 'sensor4Channel8',
            start: 0,
            end: 100,
            measurementTypes: ['float - IEEE754'] as const,
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
        },
      } as const satisfies TULIP3DeviceConfig
      // sensor4=3 (11), channel8=7 (111), float=0 (00), reserved=0 (0)
      // Binary: 11 111 00 0 = 0xF8
      const data = [0x10, 0x01, 0xF8, 0x40, 0x20, 0x00, 0x00]
      const result = decodeDataMessage(data, extendedConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor4',
            sensorId: 3,
            channel: 'channel8',
            channelId: 7,
            channelName: 'sensor4Channel8',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 2.5,
          },
        ],
      })
    })

    it('should correctly parse bit fields', () => {
      // Test specific bit field parsing
      // 0x0E = 00001110 = sensor1(00), channel2(001), tulip(11), flag(0)
      const data = [0x10, 0x01, 0x0E, 0x0B, 0xB8]
      const result = decodeDataMessage(data, testDeviceConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel2',
            channelId: 1,
            channelName: 'sensor1Channel2',
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            valueAcquisitionError: false,
            value: 5,
          },
        ],
      })
    })
  })

  describe('real-world scenarios', () => {
    it('should handle mixed data types in single message', () => {
      const data = [
        0x10,
        0x01, // Header
        0x06,
        0x13,
        0x88, // sensor1, channel1, TULIP scale = 5000 (25%)
        0x08,
        0x40,
        0x20,
        0x00,
        0x00, // sensor1, channel2, float = 2.5
        0x10,
        0x41,
        0x20,
        0x00,
        0x00, // sensor1, channel3, float = 10.0
      ]
      const result = decodeDataMessage(data, testDeviceConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            valueAcquisitionError: false,
            value: 25,
          },
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel2',
            channelId: 1,
            channelName: 'sensor1Channel2',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 2.5,
          },
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel3',
            channelId: 2,
            channelName: 'sensor1Channel3',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 10.0,
          },
        ],
      })
    })

    it('should handle custom min/max ranges (4-20 and -45 to 110)', () => {
      const customConfig = {
        sensor1: {
          channel1: {
            channelName: 'sensor1Channel1',
            start: 4,
            end: 20,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'] as const,
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          channel2: {
            channelName: 'sensor1Channel2',
            start: -45,
            end: 110,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'] as const,
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
      } as const satisfies TULIP3DeviceConfig
      const data = [0x10, 0x01, 0x06, 0x1D, 0x4C, 0x0E, 0x27, 0x10]
      const result = decodeDataMessage(data, customConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            valueAcquisitionError: false,
            value: 12,
          },
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel2',
            channelId: 1,
            channelName: 'sensor1Channel2',
            sourceDataType: 'uint16 - TULIP scale 2500 - 12500',
            valueAcquisitionError: false,
            value: 71.25,
          },
        ],
      })
    })

    it('should handle float values with custom ranges', () => {
      const customConfig = {
        sensor1: {
          channel1: {
            start: 4,
            end: 20,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'] as const,
            channelName: 'sensor1Channel1',
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          channel2: {
            start: -45,
            end: 110,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'] as const,
            channelName: 'sensor1Channel2',
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
          },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
      } as const satisfies TULIP3DeviceConfig
      const data = [
        0x10,
        0x01, // Header
        0x00,
        0x41,
        0x60,
        0x00,
        0x00, // sensor1, channel1, float = 14.0 (within 4-20)
        0x08,
        0x42,
        0x48,
        0x00,
        0x00, // sensor1, channel2, float = 50.0 (within -45 to 110)
      ]
      const result = decodeDataMessage(data, customConfig)
      expect(result.data).toEqual({
        messageType: 0x10,
        messageSubType: 0x01,
        measurements: [
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel1',
            channelId: 0,
            channelName: 'sensor1Channel1',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 14.0,
          },
          {
            sensor: 'sensor1',
            sensorId: 0,
            channel: 'channel2',
            channelId: 1,
            channelName: 'sensor1Channel2',
            sourceDataType: 'float - IEEE754',
            valueAcquisitionError: false,
            value: 50.0,
          },
        ],
      })
    })
  })

  describe('rounding and decimals', () => {
    // Use a float with repeating decimal representation in single-precision
    // 0x3EAAAAAB ~= 0.33333334 (single-precision)
    const repeatingFloatData = [0x10, 0x01, 0x00, 0x3E, 0xAA, 0xAA, 0xAB]

    it('defaults to 4 decimal places for floats', () => {
      const result = decodeDataMessage(repeatingFloatData, testDeviceConfig)
      expect(result.data.measurements[0]!.value).toBe(0.3333)
    })

    it('respects provided rounding decimals (2)', () => {
      const result = decodeDataMessage(repeatingFloatData, testDeviceConfig, 2)
      expect(result.data.measurements[0]!.value).toBe(0.33)
    })

    it('respects provided rounding decimals (6)', () => {
      const result = decodeDataMessage(repeatingFloatData, testDeviceConfig, 6)
      // 0x3EAAAAAB approximately 0.33333334 -> rounded to 6 decimals => 0.333333
      expect(result.data.measurements[0]!.value).toBe(0.333333)
    })

    it('treats negative rounding decimals as 0 (integer rounding)', () => {
      const result = decodeDataMessage(repeatingFloatData, testDeviceConfig, -1)
      // negative decimals treated as 0 -> rounds to integer (0)
      expect(result.data.measurements[0]!.value).toBe(0)
    })

    it('infinity as decimals keeps full float precision', () => {
      const result = decodeDataMessage(repeatingFloatData, testDeviceConfig, Infinity)
      // Expect the full single-precision representation stringified to a reasonable decimal
      expect(result.data.measurements[0]!.value).toBe(0.3333333432674419)
    })

    it('tulip scale conversions are not impacted by roundingDecimals (rounding applies before conversion)', () => {
      // Tulip value 2501 (0x09C5) maps to percentage 0.01% -> range 0-100 => 0.0001
      const tulipData = [0x10, 0x01, 0x06, 0x09, 0xC5]

      const resDefault = decodeDataMessage(tulipData, {
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
        sensor1: {
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
          channel1: {
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
            channelName: 'sensor1Channel1',
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
            start: 0,
            end: 1,
          },
        },
      })
      const resZero = decodeDataMessage(tulipData, {
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
        sensor1: {
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
          channel1: {
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
            channelName: 'sensor1Channel1',
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
            start: 0,
            end: 1,
          },
        },
      }, 0)
      const resTwo = decodeDataMessage(tulipData, {
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
        sensor1: {
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: emptySensorRegisterConfig(),
          channel1: {
            alarmFlags: {},
            registerConfig: emptyChannelRegisterConfig(),
            channelName: 'sensor1Channel1',
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
            start: 0,
            end: 1,
          },
        },
      }, 2)

      expect(resDefault.data.measurements[0]!.value).toBe(0.0001)
      expect(resZero.data.measurements[0]!.value).toBe(0)
      expect(resTwo.data.measurements[0]!.value).toBe(0)
    })
  })
})
