import type { TULIP3DeviceConfig } from '../../../../src/codecs/tulip3/profile'
import { describe, expect, it } from 'vitest'
import { decodeProcessAlarmMessage } from '../../../../src/codecs/tulip3/messages/processAlarm'
import { completeCommunicationModuleRegisterConfig, emptyChannelRegisterConfig, emptySensorRegisterConfig } from '../presets'

describe('tulip3 process alarm message decoding (0x12/0x01)', () => {
  // Minimal device profile: sensor2/channel1 exists
  const deviceSensorConfig = {
    alarmFlags: {},
    registerConfig: completeCommunicationModuleRegisterConfig(),
    sensor1: {
      alarmFlags: {},
      registerConfig: emptySensorRegisterConfig(),
      channel1: {
        alarmFlags: {},
        registerConfig: emptyChannelRegisterConfig(),
        start: 4,
        end: 20,
        channelName: 'current',
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
      },
    },
    sensor2: {
      alarmFlags: {},
      registerConfig: emptySensorRegisterConfig(),
      channel1: {
        alarmFlags: {},
        registerConfig: emptyChannelRegisterConfig(),
        start: 0,
        end: 10,
        channelName: 'voltage',
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
      },
    },
  } as const satisfies TULIP3DeviceConfig

  it('low threshold alarm of the second sensor first channel is triggered (0x12 01 40 80)', () => {
    const bytes = [0x12, 0x01, 0x40, 0x80]
    const out = decodeProcessAlarmMessage(bytes, deviceSensorConfig)

    expect(out.data.processAlarms).toEqual([
      {
        sensor: 'sensor2',
        sensorId: 1,
        channel: 'channel1',
        channelId: 0,
        channelName: 'voltage',
        alarmFlags: {
          lowThreshold: true,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
    ])
  })

  it('low threshold alarm of the second sensor first channel is turned off (0x12 01 40 00)', () => {
    const bytes = [0x12, 0x01, 0x40, 0x00]
    const out = decodeProcessAlarmMessage(bytes, deviceSensorConfig)

    expect(out.data.processAlarms).toEqual([
      {
        sensor: 'sensor2',
        sensorId: 1,
        channel: 'channel1',
        channelId: 0,
        channelName: 'voltage',
        alarmFlags: {
          lowThreshold: false,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
    ])
  })

  it('parses multiple entries and different alarm flags', () => {
    // Entry 1: sensor1/channel1: highThreshold true
    // Entry 2: sensor2/channel1: risingSlope true
    const bytes = [
      0x12,
      0x01,
      0x00,
      0x40, // s1 c1, highThreshold
      0x40,
      0x10, // s2 c1, risingSlope
    ]
    const out = decodeProcessAlarmMessage(bytes, deviceSensorConfig)

    expect(out.data.processAlarms).toEqual([
      {
        sensor: 'sensor1',
        sensorId: 0,
        channel: 'channel1',
        channelId: 0,
        channelName: 'current',
        alarmFlags: {
          lowThreshold: false,
          highThreshold: true,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
      {
        sensor: 'sensor2',
        sensorId: 1,
        channel: 'channel1',
        channelId: 0,
        channelName: 'voltage',
        alarmFlags: {
          lowThreshold: false,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: true,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
    ])
  })

  it('sets all alarm flags when alarm byte has all bits set (including RFU bits)', () => {
    // RFU bits (1-0) should be ignored by the parser, but high bits should be read as true
    const bytes = [0x12, 0x01, 0x40, 0xFF]
    const out = decodeProcessAlarmMessage(bytes, deviceSensorConfig)

    expect(out.data.processAlarms[0]).toMatchObject({
      sensor: 'sensor2',
      sensorId: 1,
      channel: 'channel1',
      channelId: 0,
      channelName: 'voltage',
      alarmFlags: {
        lowThreshold: true,
        highThreshold: true,
        fallingSlope: true,
        risingSlope: true,
        lowThresholdWithDelay: true,
        highThresholdWithDelay: true,
      },
    })
  })

  it('ignores idByte RFU bits (2-0) and still maps to the correct sensor/channel', () => {
    // Base idByte for sensor2/channel1 is 0x40; set bits 2-0 => 0x47
    const bytes = [0x12, 0x01, 0x47, 0x80]
    const out = decodeProcessAlarmMessage(bytes, deviceSensorConfig)

    expect(out.data.processAlarms).toEqual([
      {
        sensor: 'sensor2',
        sensorId: 1,
        channel: 'channel1',
        channelId: 0,
        channelName: 'voltage',
        alarmFlags: {
          lowThreshold: true,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
    ])
  })

  it('handles empty payload (header only) and returns no alarms', () => {
    const bytes = [0x12, 0x01]
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow(RangeError)
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow('Process alarm message too short. Expected at least 4 bytes but got 2')
  })

  it('throws for invalid message type', () => {
    const bytes = [0x10, 0x01, 0x40, 0x80]
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow(TypeError)
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow('Invalid process alarm message type: expected 0x12 but got 0x10')
  })

  it('throws for invalid sub message type', () => {
    const bytes = [0x12, 0x02, 0x40, 0x80]
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow(TypeError)
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow('Unsupported process alarm message subtype: 0x02. Allowed subtypes: 0x01')
  })

  it('throws when there is an odd trailing byte (incomplete entry)', () => {
    const bytes = [0x12, 0x01, 0x40]
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow(RangeError)
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow('Process alarm message too short. Expected at least 4 bytes but got 3')
  })

  it('throws when sensor/channel is not supported by device profile', () => {
    // sensor2/channel2 does not exist in minimal config
    const bytes = [0x12, 0x01, 0x48, 0x00]
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow(TypeError)
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow('Process alarm for sensor sensor2 channel channel2 is not supported by the device profile.')
  })

  it('throws if a later entry is unsupported (fails fast)', () => {
    // First entry supported (s2/c1), second entry unsupported (s2/c2)
    const bytes = [0x12, 0x01, 0x40, 0x80, 0x48, 0x00]
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow(TypeError)
  })

  it('parses delayed threshold alarms correctly', () => {
    // lowThresholdWithDelay + highThresholdWithDelay
    const bytes = [0x12, 0x01, 0x40, 0x0C]
    const out = decodeProcessAlarmMessage(bytes, deviceSensorConfig)
    expect(out.data.processAlarms[0]).toMatchObject({
      alarmFlags: {
        lowThresholdWithDelay: true,
        highThresholdWithDelay: true,
        lowThreshold: false,
        highThreshold: false,
        fallingSlope: false,
        risingSlope: false,
      },
    })
  })

  it('supports maximum sensor and channel IDs (sensor4/channel8)', () => {
    // Custom config that supports sensor4/channel8
    const maxConfig = {
      alarmFlags: {},
      registerConfig: completeCommunicationModuleRegisterConfig(),
      sensor4: {
        alarmFlags: {},
        registerConfig: emptySensorRegisterConfig(),
        channel8: {
          alarmFlags: {},
          registerConfig: emptyChannelRegisterConfig(),
          start: 0,
          end: 1,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          channelName: 'sensor4Channel8',
        },
      },
    } as const satisfies TULIP3DeviceConfig

    // idByte: sensorId=3 (bits 7-6), channelId=7 (bits 5-3) => (3<<6)|(7<<3) = 0xF8
    const bytes = [0x12, 0x01, 0xF8, 0x80]
    const out = decodeProcessAlarmMessage(bytes, maxConfig)

    expect(out.data.processAlarms).toEqual([
      {
        sensor: 'sensor4',
        sensorId: 3,
        channel: 'channel8',
        channelId: 7,
        channelName: 'sensor4Channel8',
        alarmFlags: {
          lowThreshold: true,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
    ])
  })

  it('parses a message with at least 6 sensor/channel pairs across sensors', () => {
    const richConfig = {
      alarmFlags: {},
      registerConfig: completeCommunicationModuleRegisterConfig(),
      sensor1: {
        alarmFlags: {},
        registerConfig: emptySensorRegisterConfig(),
        channel1: { alarmFlags: {}, registerConfig: emptyChannelRegisterConfig(), start: 0, end: 1, measurementTypes: ['uint16 - TULIP scale 2500 - 12500'], channelName: 'sensor1Channel1' },
        channel2: { alarmFlags: {}, registerConfig: emptyChannelRegisterConfig(), start: 0, end: 1, measurementTypes: ['uint16 - TULIP scale 2500 - 12500'], channelName: 'sensor1Channel2' },
        channel3: { alarmFlags: {}, registerConfig: emptyChannelRegisterConfig(), start: 0, end: 1, measurementTypes: ['uint16 - TULIP scale 2500 - 12500'], channelName: 'sensor1Channel3' },
      },
      sensor2: {
        alarmFlags: {},
        registerConfig: emptySensorRegisterConfig(),
        channel1: { alarmFlags: {}, registerConfig: emptyChannelRegisterConfig(), start: 0, end: 1, measurementTypes: ['uint16 - TULIP scale 2500 - 12500'], channelName: 'sensor2Channel1' },
        channel2: { alarmFlags: {}, registerConfig: emptyChannelRegisterConfig(), start: 0, end: 1, measurementTypes: ['uint16 - TULIP scale 2500 - 12500'], channelName: 'sensor2Channel2' },
      },
      sensor3: {
        alarmFlags: {},
        registerConfig: emptySensorRegisterConfig(),
        channel4: { alarmFlags: {}, registerConfig: emptyChannelRegisterConfig(), start: 0, end: 1, measurementTypes: ['uint16 - TULIP scale 2500 - 12500'], channelName: 'sensor3Channel4' },
      },
    } as const satisfies TULIP3DeviceConfig

    // Build a payload with 6 entries
    // 1) s1/c1 low
    // 2) s1/c2 high
    // 3) s1/c3 falling + rising
    // 4) s2/c1 lowDelay + highDelay
    // 5) s2/c2 none
    // 6) s3/c4 all flags
    const bytes = [
      0x12,
      0x01,
      0x00,
      0x80, // s1 c1 low
      0x08,
      0x40, // s1 c2 high
      0x10,
      0x30, // s1 c3 falling+rising
      0x40,
      0x0C, // s2 c1 delays
      0x48,
      0x00, // s2 c2 none
      0x98,
      0xFF, // s3 c4 all
    ]

    const out = decodeProcessAlarmMessage(bytes, richConfig)

    expect(out.data.processAlarms).toEqual([
      {
        sensor: 'sensor1',
        sensorId: 0,
        channel: 'channel1',
        channelId: 0,
        channelName: 'sensor1Channel1',
        alarmFlags: {
          lowThreshold: true,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
      {
        sensor: 'sensor1',
        sensorId: 0,
        channel: 'channel2',
        channelId: 1,
        channelName: 'sensor1Channel2',
        alarmFlags: {
          lowThreshold: false,
          highThreshold: true,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
      {
        sensor: 'sensor1',
        sensorId: 0,
        channel: 'channel3',
        channelId: 2,
        channelName: 'sensor1Channel3',
        alarmFlags: {
          lowThreshold: false,
          highThreshold: false,
          fallingSlope: true,
          risingSlope: true,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
      {
        sensor: 'sensor2',
        sensorId: 1,
        channel: 'channel1',
        channelId: 0,
        channelName: 'sensor2Channel1',
        alarmFlags: {
          lowThreshold: false,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: true,
          highThresholdWithDelay: true,
        },
      },
      {
        sensor: 'sensor2',
        sensorId: 1,
        channel: 'channel2',
        channelId: 1,
        channelName: 'sensor2Channel2',
        alarmFlags: {
          lowThreshold: false,
          highThreshold: false,
          fallingSlope: false,
          risingSlope: false,
          lowThresholdWithDelay: false,
          highThresholdWithDelay: false,
        },
      },
      {
        sensor: 'sensor3',
        sensorId: 2,
        channel: 'channel4',
        channelId: 3,
        channelName: 'sensor3Channel4',
        alarmFlags: {
          lowThreshold: true,
          highThreshold: true,
          fallingSlope: true,
          risingSlope: true,
          lowThresholdWithDelay: true,
          highThresholdWithDelay: true,
        },
      },
    ])
  })

  it('throws when an unsupported sensor ID is used (e.g., sensor3 not present)', () => {
    const bytes = [0x12, 0x01, 0x80, 0x80] // sensor3/channel1 low
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow(TypeError)
    expect(() => decodeProcessAlarmMessage(bytes, deviceSensorConfig)).toThrow('Process alarm for sensor sensor3 channel channel1 is not supported by the device profile.')
  })
})
