import type { TULIP3DeviceConfig } from '../../../../src/codecs/tulip3/profile'
import { describe, expect, it } from 'vitest'
import {
  decodeChannelAlarmMessage,
  decodeCommunicationModuleAlarmMessage,
  decodeSensorAlarmMessage,
} from '../../../../src/codecs/tulip3/messages/deviceAlarm'
import { completeCommunicationModuleRegisterConfig, completeTULIP3DeviceConfig, createDefaultCommunicationModuleAlarmFlags, emptyChannelRegisterConfig, emptySensorRegisterConfig } from '../presets'

const completeConfig = completeTULIP3DeviceConfig()

/**
 * Standard communication module alarm flags configuration based on TULIP3 specification.
 *
 * Bit mapping (MSB=15, LSB=0):
 * - 15-7: RFU
 * - 6: High voltage
 * - 5: Low voltage
 * - 4: Memory error
 * - 3: Air time limitation
 * - 2: CM cmChip high temperature
 * - 1: CM cmChip low temperature
 * - 0: Local user access denied
 */
const STANDARD_COMMUNICATION_MODULE_ALARMS = {
  alarmFlags: {
    highVoltage: 1 << 6,
    lowVoltage: 1 << 5,
    memoryError: 1 << 4,
    airTimeLimitation: 1 << 3,
    cmChipHighTemperature: 1 << 2,
    cmChipLowTemperature: 1 << 1,
    localUserAccessDenied: 1 << 0,
  },
  registerConfig: completeCommunicationModuleRegisterConfig(),
} as const satisfies TULIP3DeviceConfig

/**
 * Standard sensor alarm flags configuration based on TULIP3 specification.
 *
 * Bit mapping (MSB=15, LSB=0):
 * - 15-2: RFU
 * - 1: Sensor not supported
 * - 0: Sensor communication error
 */
const STANDARD_SENSOR_ALARMS = {
  sensorNotSupported: 1 << 1,
  sensorCommunicationError: 1 << 0,
} as const

/**
 * Standard channel alarm flags configuration based on TULIP3 specification.
 *
 * Bit mapping (MSB=15, LSB=0):
 * - 15-6: RFU
 * - 5: Out of max of physical sensor limit
 * - 4: Out of min of physical sensor limit
 * - 3: Out of max of measurement range (written on the sensor)
 * - 2: Out of min of measurement range (written on the sensor)
 * - 1: Open condition
 * - 0: Short condition
 */
const STANDARD_CHANNEL_ALARMS = {
  outOfMaxPhysicalSensorLimit: 1 << 5,
  outOfMinPhysicalSensorLimit: 1 << 4,
  outOfMaxMeasurementRange: 1 << 3,
  outOfMinMeasurementRange: 1 << 2,
  openCondition: 1 << 1,
  shortCondition: 1 << 0,
} as const

describe('tulip3 communication module device alarm message decoding (0x13/0x01)', () => {
  it('parses the example from spec: local user access denied alarm active (0x13 01 00 01)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x01]
    const out = decodeCommunicationModuleAlarmMessage(bytes, STANDARD_COMMUNICATION_MODULE_ALARMS)

    expect(out.data.messageType).toBe(0x13)
    expect(out.data.messageSubType).toBe(0x01)
    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: false,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: true,
    })
  })

  it('parses all alarms inactive (0x13 01 00 00)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x00]
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: false,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: false,
    })
  })

  it('parses high voltage alarm active (bit 6)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x40] // bit 6 set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: true,
      lowVoltage: false,
      memoryError: false,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: false,
    })
  })

  it('parses low voltage alarm active (bit 5)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x20] // bit 5 set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: true,
      memoryError: false,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: false,
    })
  })

  it('parses memory error alarm active (bit 4)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x10] // bit 4 set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: true,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: false,
    })
  })

  it('parses air time limitation alarm active (bit 3)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x08] // bit 3 set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: false,
      airTimeLimitation: true,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: false,
    })
  })

  it('parses CM cmChip high temperature alarm active (bit 2)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x04] // bit 2 set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: false,
      airTimeLimitation: false,
      cmChipHighTemperature: true,
      cmChipLowTemperature: false,
      localUserAccessDenied: false,
    })
  })

  it('parses CM cmChip low temperature alarm active (bit 1)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x02] // bit 1 set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: false,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: true,
      localUserAccessDenied: false,
    })
  })

  it('parses multiple alarms active simultaneously', () => {
    // High voltage + low voltage + memory error + local user access denied
    const bytes = [0x13, 0x01, 0x00, 0x71] // bits 6,5,4,0 set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: true,
      lowVoltage: true,
      memoryError: true,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: true,
    })
  })

  it('parses all possible alarms active (bits 6-0 set)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x7F] // bits 6-0 all set
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: true,
      lowVoltage: true,
      memoryError: true,
      airTimeLimitation: true,
      cmChipHighTemperature: true,
      cmChipLowTemperature: true,
      localUserAccessDenied: true,
    })
  })

  it('ignores RFU bits (15-7) when parsing alarms', () => {
    // Set all 16 bits including RFU bits 15-7
    const bytes = [0x13, 0x01, 0xFF, 0xFF]
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    // Should only consider bits 6-0, ignoring RFU bits
    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: true,
      lowVoltage: true,
      memoryError: true,
      airTimeLimitation: true,
      cmChipHighTemperature: true,
      cmChipLowTemperature: true,
      localUserAccessDenied: true,
    })
  })

  it('handles upper byte having values (testing 16-bit field parsing)', () => {
    // Upper byte has some bits set, but only lower byte bits 6-0 matter for alarms
    const bytes = [0x13, 0x01, 0xAB, 0x15] // upper byte = 0xAB, lower byte = 0x15
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    // Lower byte 0x15 = 0001 0101 = bits 4,2,0 set
    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: true, // bit 4
      airTimeLimitation: false,
      cmChipHighTemperature: true, // bit 2
      cmChipLowTemperature: false,
      localUserAccessDenied: true, // bit 0
    })
  })

  it('handles edge case with maximum 16-bit values', () => {
    const bytes = [0x13, 0x01, 0xFF, 0x00] // upper byte all set, lower byte clear
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    // All alarms should be inactive since only bits 6-0 of the 16-bit value matter
    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: false,
      memoryError: false,
      airTimeLimitation: false,
      cmChipHighTemperature: false,
      cmChipLowTemperature: false,
      localUserAccessDenied: false,
    })
  })

  it('validates message structure and returns correct message types', () => {
    const bytes = [0x13, 0x01, 0x00, 0x01]
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out).toEqual({
      data: {
        messageType: 0x13,
        messageSubType: 0x01,
        communicationModuleAlarms: {
          alarmFlags: {
            highVoltage: false,
            lowVoltage: false,
            memoryError: false,
            airTimeLimitation: false,
            cmChipHighTemperature: false,
            cmChipLowTemperature: false,
            localUserAccessDenied: true,
          },
        },
      },
    })
  })

  // Error handling tests
  it('throws TypeError for invalid message type', () => {
    const bytes = [0x12, 0x01, 0x00, 0x01] // wrong message type
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(TypeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Invalid communication module alarm message type: expected 0x13 but got 0x12')
  })

  it('throws TypeError for invalid sub message type', () => {
    const bytes = [0x13, 0x02, 0x00, 0x01] // wrong sub message type
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(TypeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Unsupported communication module alarm message subtype: 0x02. Allowed subtypes: 0x01')
  })

  it('throws RangeError for data too long (more than 4 bytes)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x01, 0xFF] // 5 bytes
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(RangeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Invalid data length for device alarm message: expected 4 but got 5')
  })

  it('throws TypeError for empty data', () => {
    const bytes: number[] = []
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(RangeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Communication module alarm message too short. Expected at least 4 bytes but got 0')
  })

  it('throws RangeError for header only (2 bytes)', () => {
    const bytes = [0x13, 0x01]
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(RangeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Communication module alarm message too short. Expected at least 4 bytes but got 2')
  })

  it('throws TypeError for completely wrong message type (not even close)', () => {
    const bytes = [0xFF, 0x01, 0x00, 0x01]
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(TypeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Invalid communication module alarm message type: expected 0x13 but got 0xFF')
  })

  it('throws TypeError for wrong sub message type (0x13/0x00)', () => {
    const bytes = [0x13, 0x00, 0x00, 0x01] // sub type 0x00 instead of 0x01
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(TypeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Unsupported communication module alarm message subtype: 0x00. Allowed subtypes: 0x01')
  })

  it('throws TypeError for wrong sub message type (0x13/0xFF)', () => {
    const bytes = [0x13, 0xFF, 0x00, 0x01] // sub type 0xFF instead of 0x01
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow(TypeError)
    expect(() => decodeCommunicationModuleAlarmMessage(bytes, completeConfig)).toThrow('Unsupported communication module alarm message subtype: 0x3F. Allowed subtypes: 0x01')
  })

  // Edge cases for bit field interpretation
  it('correctly interprets bit positions with alternating pattern', () => {
    const bytes = [0x13, 0x01, 0x00, 0x55] // 0101 0101 = bits 6,4,2,0
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: true, // bit 6
      lowVoltage: false,
      memoryError: true, // bit 4
      airTimeLimitation: false,
      cmChipHighTemperature: true, // bit 2
      cmChipLowTemperature: false,
      localUserAccessDenied: true, // bit 0
    })
  })

  it('correctly interprets bit positions with inverse alternating pattern', () => {
    const bytes = [0x13, 0x01, 0x00, 0x2A] // 0010 1010 = bits 5,3,1
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
      highVoltage: false,
      lowVoltage: true, // bit 5
      memoryError: false,
      airTimeLimitation: true, // bit 3
      cmChipHighTemperature: false,
      cmChipLowTemperature: true, // bit 1
      localUserAccessDenied: false,
    })
  })

  // Boundary value tests
  it('handles minimum valid alarm value (only bit 0 set)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x01]
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    expect(out.data.communicationModuleAlarms.alarmFlags.localUserAccessDenied).toBe(true)
    expect(Object.values(out.data.communicationModuleAlarms.alarmFlags).filter(Boolean)).toHaveLength(1)
  })

  it('handles maximum valid alarm value (bits 6-0 all set)', () => {
    const bytes = [0x13, 0x01, 0x00, 0x7F] // 0111 1111
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    const flags = out.data.communicationModuleAlarms.alarmFlags
    expect(Object.values(flags).every(Boolean)).toBe(true)
    expect(Object.values(flags)).toHaveLength(7)
  })

  // Prepare for future message types (keeping structure consistent)
  it('has consistent output structure for future 0x13/0x02 and 0x13/0x03 compatibility', () => {
    const bytes = [0x13, 0x01, 0x00, 0x01]
    const out = decodeCommunicationModuleAlarmMessage(bytes, completeConfig)

    // Ensure the structure is extensible for future device alarm subtypes
    expect(out.data).toHaveProperty('messageType', 0x13)
    expect(out.data).toHaveProperty('messageSubType', 0x01)
    expect(out.data).toHaveProperty('communicationModuleAlarms')
    expect(out.data.communicationModuleAlarms).toHaveProperty('alarmFlags')
  })
})

describe('tulip3 sensor alarm message decoding (0x13/0x02)', () => {
  // Test configuration with multiple sensors
  const testConfig = {
    sensor1: {
      channel1: {
        channelName: 'sensor1Channel1',
        start: 4,
        end: 20,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    sensor2: {
      channel1: {
        channelName: 'sensor2Channel1',
        start: 0,
        end: 10,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    sensor3: {
      channel1: {
        channelName: 'sensor3Channel1',
        start: 0,
        end: 100,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    sensor4: {
      channel1: {
        channelName: 'sensor4Channel1',
        start: 0,
        end: 1000,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
    registerConfig: completeCommunicationModuleRegisterConfig(),
  } as const satisfies TULIP3DeviceConfig

  // Minimal configuration with only sensor2
  const minimalConfig = {
    sensor2: {
      channel1: {
        channelName: 'sensor2Channel1',
        start: 0,
        end: 10,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
    registerConfig: completeCommunicationModuleRegisterConfig(),
  } as const satisfies TULIP3DeviceConfig

  it('parses the example from spec: sensor 2 communication error (0x13 02 40 00 01)', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x01]
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.messageType).toBe(0x13)
    expect(out.data.messageSubType).toBe(0x02)
    expect(out.data.sensorAlarms).toHaveLength(1)
    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1, // Sensor ID 1 represents sensor 2
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: true,
      },
    })
  })

  it('parses sensor 1 communication error (sensor ID 0)', () => {
    const bytes = [0x13, 0x02, 0x00, 0x00, 0x01] // sensor ID 0 = sensor1
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor1',
      sensorId: 0,
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: true,
      },
    })
  })

  it('parses sensor 3 communication error (sensor ID 2)', () => {
    const bytes = [0x13, 0x02, 0x80, 0x00, 0x01] // sensor ID 2 = sensor3
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor3',
      sensorId: 2,
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: true,
      },
    })
  })

  it('parses sensor 4 communication error (sensor ID 3)', () => {
    const bytes = [0x13, 0x02, 0xC0, 0x00, 0x01] // sensor ID 3 = sensor4
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor4',
      sensorId: 3,
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: true,
      },
    })
  })

  it('parses sensor not supported alarm (bit 1)', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x02] // sensor2, bit 1 set
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1,
      alarmFlags: {
        sensorNotSupported: true,
        sensorCommunicationError: false,
      },
    })
  })

  it('parses both alarms active simultaneously', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x03] // sensor2, bits 1 and 0 set
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out).toEqual({
      data: {
        messageType: 0x13,
        messageSubType: 0x02,
        sensorAlarms: [
          {
            alarmFlags: {
              sensorCommunicationError: true,
              sensorNotSupported: true,
            },
            sensor: 'sensor2',
            sensorId: 1,
          },
        ],
      },
    })
  })

  it('parses no alarms active', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x00] // sensor2, no alarms
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1,
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: false,
      },
    })
  })

  it('ignores RFU bits in sensor ID byte (bits 5-0)', () => {
    const bytes = [0x13, 0x02, 0x7F, 0x00, 0x01] // sensor ID 1 with RFU bits set
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1, // Should still be sensor 2 despite RFU bits
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: true,
      },
    })
  })

  it('ignores RFU bits in alarm type (bits 15-2)', () => {
    const bytes = [0x13, 0x02, 0x40, 0xFF, 0xFD] // high byte all set, low byte = 0xFD (bits 15-2 set, bit 0 set)
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1,
      alarmFlags: {
        sensorNotSupported: false, // bit 1 not set
        sensorCommunicationError: true, // bit 0 set
      },
    })
  })

  it('parses multiple sensor alarms in single message', () => {
    const bytes = [
      0x13,
      0x02, // header
      0x00,
      0x00,
      0x01, // sensor1, communication error
      0x40,
      0x00,
      0x02, // sensor2, not supported
      0x80,
      0x00,
      0x03, // sensor3, both alarms
    ]
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms).toHaveLength(3)
    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor1',
      sensorId: 0,
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: true,
      },
    })
    expect(out.data.sensorAlarms[1]).toEqual({
      sensor: 'sensor2',
      sensorId: 1,
      alarmFlags: {
        sensorNotSupported: true,
        sensorCommunicationError: false,
      },
    })
    expect(out.data.sensorAlarms[2]).toEqual({
      sensor: 'sensor3',
      sensorId: 2,
      alarmFlags: {
        sensorNotSupported: true,
        sensorCommunicationError: true,
      },
    })
  })

  it('parses all sensors with various alarm combinations', () => {
    const bytes = [
      0x13,
      0x02, // header
      0x00,
      0x00,
      0x00, // sensor1, no alarms
      0x40,
      0x00,
      0x01, // sensor2, communication error
      0x80,
      0x00,
      0x02, // sensor3, not supported
      0xC0,
      0x00,
      0x03, // sensor4, both alarms
    ]
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms).toHaveLength(4)
    expect(out.data.sensorAlarms[0]!.alarmFlags).toEqual({
      sensorNotSupported: false,
      sensorCommunicationError: false,
    })
    expect(out.data.sensorAlarms[1]!.alarmFlags).toEqual({
      sensorNotSupported: false,
      sensorCommunicationError: true,
    })
    expect(out.data.sensorAlarms[2]!.alarmFlags).toEqual({
      sensorNotSupported: true,
      sensorCommunicationError: false,
    })
    expect(out.data.sensorAlarms[3]!.alarmFlags).toEqual({
      sensorNotSupported: true,
      sensorCommunicationError: true,
    })
  })

  it('handles high byte values in alarm type correctly', () => {
    const bytes = [0x13, 0x02, 0x40, 0xAB, 0x02] // high byte 0xAB, low byte 0x02 (bit 1 set)
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1,
      alarmFlags: {
        sensorNotSupported: true, // bit 1 set in low byte
        sensorCommunicationError: false,
      },
    })
  })

  it('handles maximum 16-bit alarm values correctly', () => {
    const bytes = [0x13, 0x02, 0x40, 0xFF, 0xFF] // all bits set
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1,
      alarmFlags: {
        sensorNotSupported: true, // bit 1
        sensorCommunicationError: true, // bit 0
      },
    })
  })

  it('works with minimal sensor configuration', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x01] // sensor2 communication error
    const out = decodeSensorAlarmMessage(bytes, minimalConfig)

    expect(out.data.sensorAlarms[0]).toEqual({
      sensor: 'sensor2',
      sensorId: 1,
      alarmFlags: {
        sensorNotSupported: false,
        sensorCommunicationError: true,
      },
    })
  })

  // Error handling tests
  it('throws TypeError for invalid message type', () => {
    const bytes = [0x12, 0x02, 0x40, 0x00, 0x01]
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(TypeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Invalid sensor alarm message type: expected 0x13 but got 0x12')
  })

  it('throws TypeError for invalid sub message type', () => {
    const bytes = [0x13, 0x01, 0x40, 0x00, 0x01] // should be 0x02
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(TypeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Unsupported sensor alarm message subtype: 0x01. Allowed subtypes: 0x02')
  })

  it('throws TypeError for wrong sub message type (0x03)', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x01]
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(TypeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Unsupported sensor alarm message subtype: 0x03. Allowed subtypes: 0x02')
  })

  it('throws RangeError for incomplete sensor entry (header only)', () => {
    const bytes = [0x13, 0x02] // no sensor data
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Sensor alarm message too short. Expected at least 5 bytes but got 2')
  })

  it('throws RangeError for incomplete sensor entry (partial data)', () => {
    const bytes = [0x13, 0x02, 0x40] // only sensor ID, missing alarm type
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Sensor alarm message too short. Expected at least 5 bytes but got 3')
  })

  it('throws RangeError for incomplete sensor entry (missing high byte)', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00] // sensor ID + low byte, missing high byte
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Sensor alarm message too short. Expected at least 5 bytes but got 4')
  })

  it('throws RangeError for incomplete second sensor entry', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x01, 0x80] // complete first entry, incomplete second
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Not enough data left to finish reading sensor alarm entry. Expected 3 bytes but got 1. currentIndex 5')
  })

  it('throws TypeError for unconfigured sensor (sensor1 not in minimal config)', () => {
    const bytes = [0x13, 0x02, 0x00, 0x00, 0x01] // sensor1 alarm
    expect(() => decodeSensorAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeSensorAlarmMessage(bytes, minimalConfig)).toThrow('Sensor alarm for sensor1 is not supported by the device profile.')
  })

  it('throws TypeError for unconfigured sensor (sensor3 not in minimal config)', () => {
    const bytes = [0x13, 0x02, 0x80, 0x00, 0x01] // sensor3 alarm
    expect(() => decodeSensorAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeSensorAlarmMessage(bytes, minimalConfig)).toThrow('Sensor alarm for sensor3 is not supported by the device profile.')
  })

  it('throws TypeError for unconfigured sensor (sensor4 not in minimal config)', () => {
    const bytes = [0x13, 0x02, 0xC0, 0x00, 0x01] // sensor4 alarm
    expect(() => decodeSensorAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeSensorAlarmMessage(bytes, minimalConfig)).toThrow('Sensor alarm for sensor4 is not supported by the device profile.')
  })

  it('throws TypeError for empty data', () => {
    const bytes: number[] = []
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Sensor alarm message too short. Expected at least 5 bytes but got 0')
  })

  it('throws TypeError for header only', () => {
    const bytes = [0x13]
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeSensorAlarmMessage(bytes, testConfig)).toThrow('Sensor alarm message too short. Expected at least 5 bytes but got 1')
  })

  // Edge cases for bit manipulation
  it('correctly interprets sensor ID extraction from various bit patterns', () => {
    const testCases = [
      { sensorIdByte: 0x00, expectedSensorId: 0, expectedSensor: 'sensor1' }, // bits 7-6 = 00
      { sensorIdByte: 0x40, expectedSensorId: 1, expectedSensor: 'sensor2' }, // bits 7-6 = 01
      { sensorIdByte: 0x80, expectedSensorId: 2, expectedSensor: 'sensor3' }, // bits 7-6 = 10
      { sensorIdByte: 0xC0, expectedSensorId: 3, expectedSensor: 'sensor4' }, // bits 7-6 = 11
    ]

    testCases.forEach(({ sensorIdByte, expectedSensorId, expectedSensor }) => {
      const bytes = [0x13, 0x02, sensorIdByte, 0x00, 0x01]
      const out = decodeSensorAlarmMessage(bytes, testConfig)

      expect(out.data.sensorAlarms[0]!.sensorId).toBe(expectedSensorId)
      expect(out.data.sensorAlarms[0]!.sensor).toBe(expectedSensor)
    })
  })

  // Boundary value tests
  it('handles minimum valid message (one sensor, no alarms)', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x00]
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms).toHaveLength(1)
    expect(out.data.sensorAlarms[0]!.alarmFlags).toEqual({
      sensorNotSupported: false,
      sensorCommunicationError: false,
    })
  })

  it('handles maximum valid message (all sensors, all alarms)', () => {
    const bytes = [
      0x13,
      0x02, // header
      0x00,
      0x00,
      0x03, // sensor1, both alarms
      0x40,
      0x00,
      0x03, // sensor2, both alarms
      0x80,
      0x00,
      0x03, // sensor3, both alarms
      0xC0,
      0x00,
      0x03, // sensor4, both alarms
    ]
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out.data.sensorAlarms).toHaveLength(4)
    out.data.sensorAlarms.forEach((alarm) => {
      expect(alarm.alarmFlags).toEqual({
        sensorNotSupported: true,
        sensorCommunicationError: true,
      })
    })
  })

  // Output structure validation
  it('has consistent output structure', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x01]
    const out = decodeSensorAlarmMessage(bytes, testConfig)

    expect(out).toEqual({
      data: {
        messageType: 0x13,
        messageSubType: 0x02,
        sensorAlarms: [
          {
            sensor: 'sensor2',
            sensorId: 1,
            alarmFlags: {
              sensorNotSupported: false,
              sensorCommunicationError: true,
            },
          },
        ],
      },
    })
  })

  it('maintains type safety across different configurations', () => {
    const singleSensorConfig = {
      sensor1: {
        channel1: {
          start: 4,
          end: 20,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          channelName: 's1c1',
          alarmFlags: STANDARD_CHANNEL_ALARMS,
          registerConfig: emptyChannelRegisterConfig(),
          availableUnits: ['°C'],
          availableMeasurands: ['Temperature'],
        },
        alarmFlags: STANDARD_SENSOR_ALARMS,
        registerConfig: emptySensorRegisterConfig(),
      },
      alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
      registerConfig: completeCommunicationModuleRegisterConfig(),
    } as const satisfies TULIP3DeviceConfig
    const bytes = [0x13, 0x02, 0x00, 0x00, 0x01]
    const out = decodeSensorAlarmMessage(bytes, singleSensorConfig)

    expect(out.data.sensorAlarms[0].sensor).toBe('sensor1')
    expect(out.data.sensorAlarms[0].sensorId).toBe(0)
  })
})

describe('tulip3 channel alarm message decoding (0x13/0x03)', () => {
  // Test configuration with multiple sensors and channels
  const testConfig = {
    sensor1: {
      channel1: {
        start: 4,
        end: 20,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor1Channel1',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      channel2: {
        start: 0,
        end: 5,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor1Channel2',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    sensor2: {
      channel1: {
        start: 0,
        end: 10,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor2Channel1',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      channel2: {
        start: -10,
        end: 10,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor2Channel2',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      channel3: {
        start: 0,
        end: 100,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor2Channel3',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    sensor3: {
      channel1: {
        start: 0,
        end: 100,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor3Channel1',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    sensor4: {
      channel1: {
        start: 0,
        end: 1000,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor4Channel1',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
    registerConfig: completeCommunicationModuleRegisterConfig(),
  } as const satisfies TULIP3DeviceConfig

  // Minimal configuration with only sensor2/channel1
  const minimalConfig = {
    sensor2: {
      channel1: {
        start: 0,
        end: 10,
        measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        channelName: 'sensor1Channel1',
        alarmFlags: STANDARD_CHANNEL_ALARMS,
        registerConfig: emptyChannelRegisterConfig(),
        availableUnits: ['°C'],
        availableMeasurands: ['Temperature'],
      },
      alarmFlags: STANDARD_SENSOR_ALARMS,
      registerConfig: emptySensorRegisterConfig(),
    },
    alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
    registerConfig: completeCommunicationModuleRegisterConfig(),
  } as const satisfies TULIP3DeviceConfig

  it('parses the example from spec: sensor 2 channel 1 out of max physical sensor limit (0x13 03 40 00 20)', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x20]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor2',
          sensorId: 1,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor2Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: true,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: false,
            shortCondition: false,
          },
        },
      ],
    })
  })

  it('parses sensor 1 channel 1 short condition alarm (sensor ID 0, channel ID 0)', () => {
    const bytes = [0x13, 0x03, 0x00, 0x00, 0x01]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor1',
          sensorId: 0,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor1Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: false,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: false,
            shortCondition: true,
          },
        },
      ],
    })
  })

  it('parses sensor 1 channel 2 open condition alarm (sensor ID 0, channel ID 1)', () => {
    const bytes = [0x13, 0x03, 0x08, 0x00, 0x02]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor1',
          sensorId: 0,
          channel: 'channel2',
          channelId: 1,
          channelName: 'sensor1Channel2',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: false,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: true,
            shortCondition: false,
          },
        },
      ],
    })
  })

  it('parses sensor 2 channel 3 measurement range alarms (sensor ID 1, channel ID 2)', () => {
    const bytes = [0x13, 0x03, 0x50, 0x00, 0x0C]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor2',
          sensorId: 1,
          channel: 'channel3',
          channelId: 2,
          channelName: 'sensor2Channel3',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: false,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: true,
            outOfMinMeasurementRange: true,
            openCondition: false,
            shortCondition: false,
          },
        },
      ],
    })
  })

  it('parses sensor 3 channel 1 physical sensor limit alarms (sensor ID 2, channel ID 0)', () => {
    const bytes = [0x13, 0x03, 0x80, 0x00, 0x30]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor3',
          sensorId: 2,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor3Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: true,
            outOfMinPhysicalSensorLimit: true,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: false,
            shortCondition: false,
          },
        },
      ],
    })
  })

  it('parses sensor 4 channel 1 all alarms active (sensor ID 3, channel ID 0)', () => {
    const bytes = [0x13, 0x03, 0xC0, 0x00, 0x3F]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor4',
          sensorId: 3,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor4Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: true,
            outOfMinPhysicalSensorLimit: true,
            outOfMaxMeasurementRange: true,
            outOfMinMeasurementRange: true,
            openCondition: true,
            shortCondition: true,
          },
        },
      ],
    })
  })

  it('parses all alarms inactive', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x00]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor2',
          sensorId: 1,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor2Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: false,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: false,
            shortCondition: false,
          },
        },
      ],
    })
  })

  it('ignores RFU bits in sensor/channel ID byte (bits 2-0)', () => {
    // sensor 2, channel 1 with RFU bits set, only short condition alarm active
    const bytes = [0x13, 0x03, 0x47, 0x00, 0x01]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor2',
          sensorId: 1,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor2Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: false,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: false,
            shortCondition: true,
          },
        },
      ],
    })
  })

  it('ignores RFU bits in alarm type (bits 15-6)', () => {
    // Set all 16 bits including RFU bits 15-6, but only bits 5-0 should matter
    const bytes = [0x13, 0x03, 0x40, 0xFF, 0xFF]
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    // Should only consider bits 5-0, ignoring RFU bits
    expect(out.data.channelAlarms[0].alarmFlags).toEqual({
      outOfMaxPhysicalSensorLimit: true,
      outOfMinPhysicalSensorLimit: true,
      outOfMaxMeasurementRange: true,
      outOfMinMeasurementRange: true,
      openCondition: true,
      shortCondition: true,
    })
  })

  it('parses multiple channel alarms in single message', () => {
    const bytes = [
      0x13,
      0x03, // header
      0x00,
      0x00,
      0x01, // sensor 1, channel 1, short condition
      0x08,
      0x00,
      0x02, // sensor 1, channel 2, open condition
      0x40,
      0x00,
      0x20, // sensor 2, channel 1, out of max physical sensor limit
    ]
    const out = decodeChannelAlarmMessage(bytes, testConfig)
    expect(out.data).toEqual({
      messageType: 0x13,
      messageSubType: 0x03,
      channelAlarms: [
        {
          sensor: 'sensor1',
          sensorId: 0,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor1Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: false,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: false,
            shortCondition: true,
          },
        },
        {
          sensor: 'sensor1',
          sensorId: 0,
          channel: 'channel2',
          channelId: 1,
          channelName: 'sensor1Channel2',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: false,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: true,
            shortCondition: false,
          },
        },
        {
          sensor: 'sensor2',
          sensorId: 1,
          channel: 'channel1',
          channelId: 0,
          channelName: 'sensor2Channel1',
          alarmFlags: {
            outOfMaxPhysicalSensorLimit: true,
            outOfMinPhysicalSensorLimit: false,
            outOfMaxMeasurementRange: false,
            outOfMinMeasurementRange: false,
            openCondition: false,
            shortCondition: false,
          },
        },
      ],
    })
  })

  it('handles alternating alarm patterns', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x15] // sensor 2, channel 1, bits 4,2,0 set
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    expect(out.data.channelAlarms[0].alarmFlags).toEqual({
      outOfMaxPhysicalSensorLimit: false,
      outOfMinPhysicalSensorLimit: true,
      outOfMaxMeasurementRange: false,
      outOfMinMeasurementRange: true,
      openCondition: false,
      shortCondition: true,
    })
  })

  it('handles inverse alternating alarm patterns', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x2A] // sensor 2, channel 1, bits 5,3,1 set
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    expect(out.data.channelAlarms[0].alarmFlags).toEqual({
      outOfMaxPhysicalSensorLimit: true,
      outOfMinPhysicalSensorLimit: false,
      outOfMaxMeasurementRange: true,
      outOfMinMeasurementRange: false,
      openCondition: true,
      shortCondition: false,
    })
  })

  it('handles high byte values in alarm type correctly', () => {
    // Upper byte has some bits set, but only lower byte bits 5-0 matter for alarms
    const bytes = [0x13, 0x03, 0x40, 0xAB, 0x0C] // bits 3+2 set in lower byte
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    expect(out.data.channelAlarms[0].alarmFlags).toEqual({
      outOfMaxPhysicalSensorLimit: false,
      outOfMinPhysicalSensorLimit: false,
      outOfMaxMeasurementRange: true,
      outOfMinMeasurementRange: true,
      openCondition: false,
      shortCondition: false,
    })
  })

  it('handles maximum 16-bit alarm values correctly', () => {
    const bytes = [0x13, 0x03, 0x40, 0xFF, 0x00] // upper byte set, lower byte clear
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    // All alarms should be inactive since only bits 5-0 of the 16-bit value matter
    expect(out.data.channelAlarms[0].alarmFlags).toEqual({
      outOfMaxPhysicalSensorLimit: false,
      outOfMinPhysicalSensorLimit: false,
      outOfMaxMeasurementRange: false,
      outOfMinMeasurementRange: false,
      openCondition: false,
      shortCondition: false,
    })
  })

  it('works with minimal sensor configuration', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x20] // sensor 2, channel 1
    const out = decodeChannelAlarmMessage(bytes, minimalConfig)

    expect(out.data.channelAlarms).toHaveLength(1)
    expect(out.data.channelAlarms[0].sensor).toBe('sensor2')
    expect(out.data.channelAlarms[0].channel).toBe('channel1')
  })

  // Error handling tests
  it('throws TypeError for invalid message type', () => {
    const bytes = [0x12, 0x03, 0x40, 0x00, 0x20]
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Invalid channel alarm message type: expected 0x13 but got 0x12')
  })

  it('throws TypeError for invalid sub message type', () => {
    const bytes = [0x13, 0x01, 0x40, 0x00, 0x20]
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Unsupported channel alarm message subtype: 0x01. Allowed subtypes: 0x03')
  })

  it('throws TypeError for wrong sub message type (0x02)', () => {
    const bytes = [0x13, 0x02, 0x40, 0x00, 0x20]
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Unsupported channel alarm message subtype: 0x02. Allowed subtypes: 0x03')
  })

  it('throws RangeError for incomplete channel entry (header only)', () => {
    const bytes = [0x13, 0x03]
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Channel alarm message too short. Expected at least 5 bytes but got 2')
  })

  it('throws RangeError for incomplete channel entry (partial data)', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00] // missing last byte
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Channel alarm message too short. Expected at least 5 bytes but got 4')
  })

  it('throws RangeError for incomplete channel entry (missing high byte)', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00] // only header + sensor/channel + 1 alarm byte
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Channel alarm message too short. Expected at least 5 bytes but got 4')
  })

  it('throws RangeError for incomplete second channel entry', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x20, 0x08] // complete first entry, incomplete second
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Not enough data left to finish reading channel alarm entry. Expected 3 bytes but got 1. currentIndex 5')
  })

  it('throws TypeError for unconfigured sensor (sensor1 not in minimal config)', () => {
    const bytes = [0x13, 0x03, 0x00, 0x00, 0x01] // sensor 1, channel 1
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow('Channel alarm for sensor1 is not supported by the device profile.')
  })

  it('throws TypeError for unconfigured sensor (sensor3 not in minimal config)', () => {
    const bytes = [0x13, 0x03, 0x80, 0x00, 0x01] // sensor 3, channel 1
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow('Channel alarm for sensor3 is not supported by the device profile.')
  })

  it('throws TypeError for unconfigured sensor (sensor4 not in minimal config)', () => {
    const bytes = [0x13, 0x03, 0xC0, 0x00, 0x01] // sensor 4, channel 1
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow('Channel alarm for sensor4 is not supported by the device profile.')
  })

  it('throws TypeError for unconfigured channel (sensor2/channel2 not in minimal config)', () => {
    const bytes = [0x13, 0x03, 0x48, 0x00, 0x01] // sensor 2, channel 2
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow('Channel alarm for sensor2/channel2 is not supported by the device profile.')
  })

  it('throws TypeError for unconfigured channel (sensor2/channel3 not in minimal config)', () => {
    const bytes = [0x13, 0x03, 0x50, 0x00, 0x01] // sensor 2, channel 3
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow(TypeError)
    expect(() => decodeChannelAlarmMessage(bytes, minimalConfig)).toThrow('Channel alarm for sensor2/channel3 is not supported by the device profile.')
  })

  it('throws TypeError for empty data', () => {
    const bytes: number[] = []
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Channel alarm message too short. Expected at least 5 bytes but got 0')
  })

  it('throws TypeError for header only', () => {
    const bytes = [0x13]
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow(RangeError)
    expect(() => decodeChannelAlarmMessage(bytes, testConfig)).toThrow('Channel alarm message too short. Expected at least 5 bytes but got 1')
  })

  // Edge cases for bit manipulation
  it('correctly interprets sensor and channel ID extraction from various bit patterns', () => {
    // Test various sensor/channel combinations
    const testCases = [
      { byte: 0x00, expectedSensor: 'sensor1', expectedChannel: 'channel1', expectedSensorId: 0, expectedChannelId: 0, expectedChannelName: 'sensor1Channel1' },
      { byte: 0x08, expectedSensor: 'sensor1', expectedChannel: 'channel2', expectedSensorId: 0, expectedChannelId: 1, expectedChannelName: 'sensor1Channel2' },
      { byte: 0x40, expectedSensor: 'sensor2', expectedChannel: 'channel1', expectedSensorId: 1, expectedChannelId: 0, expectedChannelName: 'sensor2Channel1' },
      { byte: 0x50, expectedSensor: 'sensor2', expectedChannel: 'channel3', expectedSensorId: 1, expectedChannelId: 2, expectedChannelName: 'sensor2Channel3' },
      { byte: 0x80, expectedSensor: 'sensor3', expectedChannel: 'channel1', expectedSensorId: 2, expectedChannelId: 0, expectedChannelName: 'sensor3Channel1' },
      { byte: 0xC0, expectedSensor: 'sensor4', expectedChannel: 'channel1', expectedSensorId: 3, expectedChannelId: 0, expectedChannelName: 'sensor4Channel1' },
    ]

    testCases.forEach(({ byte, expectedSensor, expectedChannel, expectedSensorId, expectedChannelId, expectedChannelName }) => {
      const bytes = [0x13, 0x03, byte, 0x00, 0x01]
      const out = decodeChannelAlarmMessage(bytes, testConfig)

      expect(out.data.channelAlarms[0].sensor).toBe(expectedSensor)
      expect(out.data.channelAlarms[0].channel).toBe(expectedChannel)
      expect(out.data.channelAlarms[0].sensorId).toBe(expectedSensorId)
      expect(out.data.channelAlarms[0].channelId).toBe(expectedChannelId)
      expect(out.data.channelAlarms[0].channelName).toBe(expectedChannelName)
    })
  })

  // Boundary value tests
  it('handles minimum valid message (one channel, no alarms)', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x00] // sensor 2, channel 1, no alarms
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    expect(out.data.channelAlarms).toHaveLength(1)
    expect(out.data.channelAlarms[0].sensor).toBe('sensor2')
    expect(out.data.channelAlarms[0].channel).toBe('channel1')
    expect(Object.values(out.data.channelAlarms[0].alarmFlags).every(alarm => alarm === false)).toBe(true)
  })

  it('handles maximum valid message (all possible channels, all alarms)', () => {
    const bytes = [
      0x13,
      0x03, // header
      0x00,
      0x00,
      0x3F, // sensor 1, channel 1, all alarms
      0x08,
      0x00,
      0x3F, // sensor 1, channel 2, all alarms
      0x40,
      0x00,
      0x3F, // sensor 2, channel 1, all alarms
      0x48,
      0x00,
      0x3F, // sensor 2, channel 2, all alarms
      0x50,
      0x00,
      0x3F, // sensor 2, channel 3, all alarms
      0x80,
      0x00,
      0x3F, // sensor 3, channel 1, all alarms
      0xC0,
      0x00,
      0x3F, // sensor 4, channel 1, all alarms
    ]
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    expect(out.data.channelAlarms).toHaveLength(7)
    // Verify all alarms are active for each channel
    out.data.channelAlarms.forEach((alarm) => {
      expect(Object.values(alarm.alarmFlags).every(flag => flag === true)).toBe(true)
    })
  })

  // Output structure validation
  it('has consistent output structure', () => {
    const bytes = [0x13, 0x03, 0x40, 0x00, 0x20]
    const out = decodeChannelAlarmMessage(bytes, testConfig)

    expect(out).toEqual({
      data: {
        messageType: 0x13,
        messageSubType: 0x03,
        channelAlarms: [
          {
            sensor: 'sensor2',
            sensorId: 1,
            channel: 'channel1',
            channelName: 'sensor2Channel1',
            channelId: 0,
            alarmFlags: {
              outOfMaxPhysicalSensorLimit: true,
              outOfMinPhysicalSensorLimit: false,
              outOfMaxMeasurementRange: false,
              outOfMinMeasurementRange: false,
              openCondition: false,
              shortCondition: false,
            },
          },
        ],
      },
    })
  })

  it('maintains type safety across different configurations', () => {
    const singleChannelConfig = {
      sensor1: {
        channel1: {
          start: 4,
          end: 20,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          channelName: 'sensor1Channel1',
          alarmFlags: STANDARD_CHANNEL_ALARMS,
          registerConfig: emptyChannelRegisterConfig(),
          availableUnits: ['°C'],
          availableMeasurands: ['Temperature'],
        },
        alarmFlags: STANDARD_SENSOR_ALARMS,
        registerConfig: emptySensorRegisterConfig(),
      },
      alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
      registerConfig: completeCommunicationModuleRegisterConfig(),
    } as const satisfies TULIP3DeviceConfig
    const bytes = [0x13, 0x03, 0x00, 0x00, 0x01]
    const out = decodeChannelAlarmMessage(bytes, singleChannelConfig)

    expect(out.data.channelAlarms[0].sensor).toBe('sensor1')
    expect(out.data.channelAlarms[0].sensorId).toBe(0)
    expect(out.data.channelAlarms[0].channel).toBe('channel1')
    expect(out.data.channelAlarms[0].channelId).toBe(0)
    expect(out.data.channelAlarms[0].channelName).toBe('sensor1Channel1')
  })
})

describe('generic alarm flags system - custom flag configurations', () => {
  describe('communication module alarms with custom flags', () => {
    it('should work with custom flag names and positions', () => {
      const customCommFlags = {
        batteryLow: 1 << 15, // bit 15
        overheating: 1 << 10, // bit 10
        networkError: 1 << 5, // bit 5
        systemFault: 1 << 0, // bit 0
      } as const

      // Test with batteryLow active (bit 15 = 0x8000)
      const bytes1 = [0x13, 0x01, 0x80, 0x00]
      const out1 = decodeCommunicationModuleAlarmMessage(bytes1, { alarmFlags: customCommFlags, registerConfig: completeCommunicationModuleRegisterConfig() })

      expect(out1.data.communicationModuleAlarms.alarmFlags).toEqual({
        batteryLow: true,
        overheating: false,
        networkError: false,
        systemFault: false,
      })

      // Test with overheating active (bit 10 = 0x0400)
      const bytes2 = [0x13, 0x01, 0x04, 0x00]
      const out2 = decodeCommunicationModuleAlarmMessage(bytes2, { alarmFlags: customCommFlags, registerConfig: completeCommunicationModuleRegisterConfig() })

      expect(out2.data.communicationModuleAlarms.alarmFlags).toEqual({
        batteryLow: false,
        overheating: true,
        networkError: false,
        systemFault: false,
      })

      // Test with multiple flags active (bits 15, 5, 0 = 0x8021)
      const bytes3 = [0x13, 0x01, 0x80, 0x21]
      const out3 = decodeCommunicationModuleAlarmMessage(bytes3, { alarmFlags: customCommFlags, registerConfig: completeCommunicationModuleRegisterConfig() })

      expect(out3.data.communicationModuleAlarms.alarmFlags).toEqual({
        batteryLow: true,
        overheating: false,
        networkError: true,
        systemFault: true,
      })
    })

    it('should work with minimal custom flags', () => {
      const minimalFlags = {
        criticalError: 1 << 7, // bit 7
      } as const

      // Test with criticalError active (bit 7 = 0x0080)
      const bytes = [0x13, 0x01, 0x00, 0x80]
      const out = decodeCommunicationModuleAlarmMessage(bytes, { alarmFlags: minimalFlags, registerConfig: completeCommunicationModuleRegisterConfig() })

      expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
        criticalError: true,
      })

      // Test with no flags active
      const bytes2 = [0x13, 0x01, 0x00, 0x00]
      const out2 = decodeCommunicationModuleAlarmMessage(bytes2, { alarmFlags: minimalFlags, registerConfig: completeCommunicationModuleRegisterConfig() })

      expect(out2.data.communicationModuleAlarms.alarmFlags).toEqual({
        criticalError: false,
      })
    })

    it('should work with many custom flags', () => {
      const manyFlags = {
        flag0: 1 << 0,
        flag1: 1 << 1,
        flag2: 1 << 2,
        flag3: 1 << 3,
        flag4: 1 << 4,
        flag5: 1 << 5,
        flag6: 1 << 6,
        flag7: 1 << 7,
        flag8: 1 << 8,
        flag9: 1 << 9,
        flag10: 1 << 10,
        flag11: 1 << 11,
        flag12: 1 << 12,
        flag13: 1 << 13,
        flag14: 1 << 14,
        flag15: 1 << 15,
      } as const

      // Test with all flags active (0xFFFF)
      const bytes = [0x13, 0x01, 0xFF, 0xFF]
      const out = decodeCommunicationModuleAlarmMessage(bytes, { alarmFlags: manyFlags, registerConfig: completeCommunicationModuleRegisterConfig() })

      expect(out.data.communicationModuleAlarms.alarmFlags).toEqual({
        flag0: true,
        flag1: true,
        flag2: true,
        flag3: true,
        flag4: true,
        flag5: true,
        flag6: true,
        flag7: true,
        flag8: true,
        flag9: true,
        flag10: true,
        flag11: true,
        flag12: true,
        flag13: true,
        flag14: true,
        flag15: true,
      })
    })
  })

  describe('sensor alarms with custom flags', () => {
    it('should work with custom sensor alarm flags', () => {
      const customSensorFlags = {
        temperatureOutOfRange: 1 << 3, // bit 3
        calibrationExpired: 1 << 7, // bit 7
        signalWeak: 1 << 12, // bit 12
      } as const

      const sensorConfig = {
        sensor1: {
          channel1: {
            start: 4,
            end: 20,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500' as const],
            channelName: 'sensor1Channel1',
            alarmFlags: STANDARD_CHANNEL_ALARMS,
            registerConfig: emptyChannelRegisterConfig(),
            availableUnits: ['°C'],
            availableMeasurands: ['Temperature'],
          },
          alarmFlags: customSensorFlags,
          registerConfig: emptySensorRegisterConfig(),
        },
        sensor2: {
          channel1: {
            start: 0,
            end: 10,
            measurementTypes: ['uint16 - TULIP scale 2500 - 12500' as const],
            channelName: 'sensor2Channel1',
            alarmFlags: STANDARD_CHANNEL_ALARMS,
            registerConfig: emptyChannelRegisterConfig(),
            availableUnits: ['°C'],
            availableMeasurands: ['Temperature'],
          },
          alarmFlags: customSensorFlags,
          registerConfig: emptySensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: completeCommunicationModuleRegisterConfig(),
      } as const satisfies TULIP3DeviceConfig

      // Test with temperatureOutOfRange active for sensor1 (bit 3 = 0x0008)
      const bytes1 = [0x13, 0x02, 0x00, 0x00, 0x08]
      const out1 = decodeSensorAlarmMessage(bytes1, sensorConfig)

      expect(out1.data.sensorAlarms).toHaveLength(1)
      expect((out1.data.sensorAlarms as any)[0].sensor).toBe('sensor1')
      expect((out1.data.sensorAlarms as any)[0].alarmFlags).toEqual({
        temperatureOutOfRange: true,
        calibrationExpired: false,
        signalWeak: false,
      })

      // Test with multiple flags active for sensor2 (bits 7, 12 = 0x1080)
      const bytes2 = [0x13, 0x02, 0x40, 0x10, 0x80] // sensor2 = bits 7-6 = 01 = 0x40
      const out2 = decodeSensorAlarmMessage(bytes2, sensorConfig)

      expect(out2.data.sensorAlarms).toHaveLength(1)
      expect((out2.data.sensorAlarms as any)[0].sensor).toBe('sensor2')
      expect((out2.data.sensorAlarms as any)[0].alarmFlags).toEqual({
        temperatureOutOfRange: false,
        calibrationExpired: true,
        signalWeak: true,
      })
    })
  })

  describe('edge cases and bit position validation', () => {
    it('should handle all 16 bit positions correctly', () => {
      // Test each bit position individually for communication module alarms
      for (let bit = 0; bit < 16; bit++) {
        const customFlag = { [`bit${bit}`]: 1 << bit } as const
        const bitValue = 1 << bit
        const highByte = (bitValue >> 8) & 0xFF
        const lowByte = bitValue & 0xFF

        const bytes = [0x13, 0x01, highByte, lowByte]
        const out = decodeCommunicationModuleAlarmMessage(bytes, { alarmFlags: customFlag, registerConfig: completeCommunicationModuleRegisterConfig() })

        expect(out.data.communicationModuleAlarms.alarmFlags[`bit${bit}`]).toBe(true)
      }
    })

    it('should handle mixed bit positions without interference', () => {
      const mixedFlags = {
        lowBit: 1 << 1, // bit 1
        midBit: 1 << 8, // bit 8
        highBit: 1 << 14, // bit 14
      } as const

      // Test each flag individually
      const testCases = [
        { bytes: [0x13, 0x01, 0x00, 0x02], expected: { lowBit: true, midBit: false, highBit: false } }, // bit 1
        { bytes: [0x13, 0x01, 0x01, 0x00], expected: { lowBit: false, midBit: true, highBit: false } }, // bit 8
        { bytes: [0x13, 0x01, 0x40, 0x00], expected: { lowBit: false, midBit: false, highBit: true } }, // bit 14
        { bytes: [0x13, 0x01, 0x41, 0x02], expected: { lowBit: true, midBit: true, highBit: true } }, // all bits
      ]

      testCases.forEach(({ bytes, expected }) => {
        const out = decodeCommunicationModuleAlarmMessage(bytes, { alarmFlags: mixedFlags, registerConfig: completeCommunicationModuleRegisterConfig() })
        expect(out.data.communicationModuleAlarms.alarmFlags).toEqual(expected)
      })
    })

    it('should preserve type safety with custom flag names', () => {
      const typedFlags = {
        networkConnectivity: 1 << 0,
        powerSupplyStatus: 1 << 4,
        dataIntegrity: 1 << 8,
        systemHealth: 1 << 12,
      } as const

      const bytes = [0x13, 0x01, 0x11, 0x11] // bits 0, 4, 8, 12 set
      const out = decodeCommunicationModuleAlarmMessage(bytes, { alarmFlags: typedFlags, registerConfig: completeCommunicationModuleRegisterConfig() })

      // TypeScript should enforce these exact property names
      expect(out.data.communicationModuleAlarms.alarmFlags.networkConnectivity).toBe(true)
      expect(out.data.communicationModuleAlarms.alarmFlags.powerSupplyStatus).toBe(true)
      expect(out.data.communicationModuleAlarms.alarmFlags.dataIntegrity).toBe(true)
      expect(out.data.communicationModuleAlarms.alarmFlags.systemHealth).toBe(true)
    })
  })
})
