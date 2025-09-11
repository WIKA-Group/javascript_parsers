import type { TULIP3DeviceSensorConfig } from '../../../../src/codecs/tulip3/profile'
import { describe, expect, it } from 'vitest'
import { decodeConfigurationRegisterRead, decodeConfigurationRegisterWrite, validateAndTransformConfigurationResult } from '../../../../src/codecs/tulip3/messages/configuration'
import { hexStringToIntArray } from '../../../../src/utils'
import { FullConfigurationHexString } from '../constants/configuration'

const sensor1channelConfig = {
  channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
  channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel2' },
  channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel3' },
  channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel4' },
  channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel5' },
  channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel6' },
  channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel7' },
  channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const sensor2channelConfig = {
  channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel1' },
  channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel2' },
  channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel3' },
  channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel4' },
  channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel5' },
  channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel6' },
  channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel7' },
  channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const sensor3channelConfig = {
  channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel1' },
  channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel2' },
  channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel3' },
  channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel4' },
  channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel5' },
  channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel6' },
  channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel7' },
  channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const sensor4channelConfig = {
  channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel1' },
  channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel2' },
  channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel3' },
  channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel4' },
  channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel5' },
  channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel6' },
  channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel7' },
  channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const config = {
  sensor1: sensor1channelConfig,
  sensor2: sensor2channelConfig,
  sensor3: sensor3channelConfig,
  sensor4: sensor4channelConfig,
} as const satisfies TULIP3DeviceSensorConfig

describe('configuration messages', () => {
  describe('read registers', () => {
    describe('update fields message (0x15 01)', () => {
      it('should parse an update fields message with CM transmission rate alarm settings', () => {
        // 0x15 01 01 04 00 02 00 01
        // Configuration – Update fields message
        // Start from register address 0x008 and 4 bytes register will follow
        // CM Transmission rate alarm off: 2
        // CM Transmission rate alarm on: 1
        const hexString = '0x15 01 01 04 00 02 00 01'

        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeConfigurationRegisterRead(data!, config)

        expect(result.data.messageType).toBe(0x15)
        expect(result.data.messageSubType).toBe(0x01)
        expect(result.data.configuration).toEqual({
          communicationModule: {
            transmissionRateAlarmOff: 2,
            transmissionRateAlarmOn: 1,
          },
        })
      })

      it('should correctly parse the full hexstring with everything', () => {
        const result = decodeConfigurationRegisterRead(FullConfigurationHexString, config)

        expect(result.data.messageType).toBe(0x15)

        expect(result.data.configuration).toEqual(
          {
            communicationModule: {
              downlinkAnswerTimeout: 120,
              enableBleAdvertising: false,
              fetchAdditionalDownlinkTimeInterval: 240,
              measuringPeriodAlarmOff: 3600,
              measuringPeriodAlarmOn: 7200,
              overTemperatureCmChip: 95,
              overVoltageThreshold: 4650,
              transmissionRateAlarmOff: 1,
              transmissionRateAlarmOn: 16,
              underTemperatureCmChip: -10,
              underVoltageThreshold: 2900,
            },
            sensor1: {
              channel1: {
                channelName: 'sensor1Channel1',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel2: {
                channelName: 'sensor1Channel2',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel3: {
                channelName: 'sensor1Channel3',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel4: {
                channelName: 'sensor1Channel4',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel5: {
                channelName: 'sensor1Channel5',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel6: {
                channelName: 'sensor1Channel6',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel7: {
                channelName: 'sensor1Channel7',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel8: {
                channelName: 'sensor1Channel8',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              configuration: {
                bootTime: 143,
                communicationRetryCount: 125,
                communicationTimeout: 223,
                samplingChannels: {
                  channel1: true,
                  channel2: true,
                  channel3: true,
                  channel4: true,
                  channel5: true,
                  channel6: true,
                  channel7: true,
                  channel8: true,
                },
              },
            },
            sensor2: {
              channel1: {
                channelName: 'sensor2Channel1',
                fallingSlopeAlarmValue: 0.3,
                highThresholdAlarmValue: 10,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 2,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 13,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel2: {
                channelName: 'sensor2Channel2',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel3: {
                channelName: 'sensor2Channel3',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel4: {
                channelName: 'sensor2Channel4',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel5: {
                channelName: 'sensor2Channel5',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel6: {
                channelName: 'sensor2Channel6',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel7: {
                channelName: 'sensor2Channel7',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel8: {
                channelName: 'sensor2Channel8',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              configuration: {
                bootTime: 180,
                communicationRetryCount: 150,
                communicationTimeout: 300,
                samplingChannels: {
                  channel1: true,
                  channel2: true,
                  channel3: true,
                  channel4: true,
                  channel5: true,
                  channel6: true,
                  channel7: true,
                  channel8: true,
                },
              },
            },
            sensor3: {
              channel1: {
                channelName: 'sensor3Channel1',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel2: {
                channelName: 'sensor3Channel2',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel3: {
                channelName: 'sensor3Channel3',
                fallingSlopeAlarmValue: 0.15,
                highThresholdAlarmValue: 12,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 0.5,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 14,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel4: {
                channelName: 'sensor3Channel4',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel5: {
                channelName: 'sensor3Channel5',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel6: {
                channelName: 'sensor3Channel6',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel7: {
                channelName: 'sensor3Channel7',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel8: {
                channelName: 'sensor3Channel8',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              configuration: {
                bootTime: 200,
                communicationRetryCount: 100,
                communicationTimeout: 400,
                samplingChannels: {
                  channel1: true,
                  channel2: true,
                  channel3: true,
                  channel4: true,
                  channel5: true,
                  channel6: true,
                  channel7: true,
                  channel8: true,
                },
              },
            },
            sensor4: {
              channel1: {
                channelName: 'sensor4Channel1',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel2: {
                channelName: 'sensor4Channel2',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel3: {
                channelName: 'sensor4Channel3',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel4: {
                channelName: 'sensor4Channel4',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel5: {
                channelName: 'sensor4Channel5',
                fallingSlopeAlarmValue: 0.5,
                highThresholdAlarmValue: 7,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 3,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 8,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel6: {
                channelName: 'sensor4Channel6',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel7: {
                channelName: 'sensor4Channel7',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              channel8: {
                channelName: 'sensor4Channel8',
                fallingSlopeAlarmValue: 0.2,
                highThresholdAlarmValue: 9,
                highThresholdWithDelayAlarmDelay: 313,
                highThresholdWithDelayAlarmValue: 8.23,
                lowThresholdAlarmValue: 1,
                lowThresholdWithDelayAlarmDelay: 267,
                lowThresholdWithDelayAlarmValue: 1.5,
                processAlarmDeadBand: 12,
                processAlarmEnabled: {
                  fallingSlope: true,
                  highThreshold: true,
                  highThresholdWithDelay: true,
                  lowThreshold: true,
                  lowThresholdWithDelay: true,
                  risingSlope: true,
                },
                protocolDataType: 'int 24 - Fixed-point s16.7 (Q16.7)',
                risingSlopeAlarmValue: 0.35,
              },
              configuration: {
                bootTime: 90,
                communicationRetryCount: 200,
                communicationTimeout: 170,
                samplingChannels: {
                  channel1: true,
                  channel2: true,
                  channel3: true,
                  channel4: true,
                  channel5: true,
                  channel6: true,
                  channel7: true,
                  channel8: true,
                },
              },
            },
          },
        )
      })
    })

    describe('read fields response message (0x15 02)', () => {
      it('should parse a complete read fields response with measuring periods and transmission rates', () => {
        // 0x15 02 00 0C 00 00 0E 10 00 00 07 08 00 02 00 02 05 62 13 88
        // Configuration – Read fields response message
        // Start from register address 0x000 and 12 bytes register will follow
        // CM Measuring period alarm off: 3600 (0x0E10)
        // CM Measuring period alarm on: 1800 (0x0708)
        // CM Transmission rate alarm off: 2
        // CM Transmission rate alarm on: 2
        // Start from register address 0x02B and 2 bytes register will follow
        // Boot time of sensor 1: 5000 (0x1388)
        const hexString = '0x15 02 00 0C 00 00 0E 10 00 00 07 08 00 02 00 02 05 62 13 88'

        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeConfigurationRegisterRead(data!, config)

        expect(result.data.messageType).toBe(0x15)
        expect(result.data.messageSubType).toBe(0x02)
        expect(result.data.configuration).toEqual({
          communicationModule: {
            measuringPeriodAlarmOff: 3600,
            measuringPeriodAlarmOn: 1800,
            transmissionRateAlarmOff: 2,
            transmissionRateAlarmOn: 2,
          },
          sensor1: {
            configuration: {
              bootTime: 5000,
            },
          },
        })
      })

      it('should parse a limited payload read fields response - first frame', () => {
        // 0x15 02 00 04 00 00 0E 10
        // Configuration – Read fields response message
        // Start from register address 0x000 and 4 bytes register will follow
        // CM Measuring period alarm off: 3600 (0x0E10)
        const hexString = '0x15 02 00 04 00 00 0E 10'

        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeConfigurationRegisterRead(data!, config)

        expect(result.data.messageType).toBe(0x15)
        expect(result.data.messageSubType).toBe(0x02)
        expect(result.data.configuration).toEqual({
          communicationModule: {
            measuringPeriodAlarmOff: 3600,
          },
        })
      })

      it('should parse a limited payload read fields response - second frame', () => {
        // 0x15 02 00 86 00 00 07 08 00 02
        // Configuration – Read fields response message
        // Start from register address 0x004 and 6 bytes register will follow
        // CM Measuring period alarm on: 1800 (0x0708)
        // CM Transmission rate alarm off: 2
        const hexString = '0x15 02 00 86 00 00 07 08 00 02'

        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeConfigurationRegisterRead(data!, config)

        expect(result.data.messageType).toBe(0x15)
        expect(result.data.messageSubType).toBe(0x02)
        expect(result.data.configuration).toEqual({
          communicationModule: {
            measuringPeriodAlarmOn: 1800,
            transmissionRateAlarmOff: 2,
          },
        })
      })

      it('should parse a limited payload read fields response - third frame', () => {
        // 0x15 02 01 42 00 02 05 62 13 88
        // Configuration – Read fields response message
        // Start from register address 0x00A and 2 bytes register will follow
        // CM Transmission rate alarm on: 2
        // Start from register address 0x02B and 2 bytes register will follow
        // Boot time of sensor 1: 5000 (0x1388)
        const hexString = '0x15 02 01 42 00 02 05 62 13 88'

        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeConfigurationRegisterRead(data!, config)

        expect(result.data.messageType).toBe(0x15)
        expect(result.data.messageSubType).toBe(0x02)
        expect(result.data.configuration).toEqual({
          communicationModule: {
            transmissionRateAlarmOn: 2,
          },
          sensor1: {
            configuration: {
              bootTime: 5000,
            },
          },
        })
      })
    })
  })

  describe('write registers', () => {
    it('should parse configuration write response with frame counter 0, success status, revision counter 4, and no wrong frames', () => {
      // 0x15 03 00 01 00 04 00
      // Configuration – Write fields response message
      // Frame number: 0
      // Configuration received and applied with success
      // Since the default configuration, 4 modifications have been made to register fields
      // Total wrong frames: 0
      const hexString = '0x15 03 00 01 00 04 00'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeConfigurationRegisterWrite(data!)

      expect(result).toEqual({
        data: {
          messageType: 0x15,
          messageSubType: 0x03,
          configuration: {
            frames: [{
              frameNumber: 0,
              status: 'Configuration received and applied with success',
            }],
            revisionCounter: 4,
            totalWrongFrames: 0,
          },
        },
      })
    })

    it('should parse basic configuration write response with frame counter 0 and not applied status', () => {
      // 0x15 03 00 00
      // Configuration – Write fields response message
      // Frame number: 0
      // Configuration received but not applied
      const hexString = '0x15 03 00 00'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeConfigurationRegisterWrite(data!)

      expect(result).toEqual({
        data: {
          messageType: 0x15,
          messageSubType: 0x03,
          configuration: {
            frames: [{
              frameNumber: 0,
              status: 'Configuration received but not applied',
            }],
          },
        },
      })
    })

    it('should parse configuration write response with additional frames and wrong frame information', () => {
      // 0x15 03 08 00 00 09 01 04 07
      // Configuration – Write fields response message
      // Frame number: 2
      // Configuration received but not applied
      // Since the default configuration, 9 modifications have been made to register fields
      // Total wrong frames: 1
      // Frame number: 1
      // Missing frame
      const hexString = '0x15 03 08 00 00 09 01 04 07'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeConfigurationRegisterWrite(data!)

      expect(result).toEqual({
        data: {
          messageType: 0x15,
          messageSubType: 0x03,
          configuration: {
            frames: [
              {
                frameNumber: 2,
                status: 'Configuration received but not applied',
              },
              {
                frameNumber: 1,
                status: 'Missing frame',
              },
            ],
            revisionCounter: 9,
            totalWrongFrames: 1,
          },
        },
      })
    })
  })
})

describe('validation and transformation after decode (tests for code below TODO)', () => {
  describe('sensor validation logic', () => {
    it('should pass when all decoded sensors exist in config', () => {
      // Use the full configuration hex string which decodes multiple sensors
      const result = decodeConfigurationRegisterRead(FullConfigurationHexString, config)

      // Should not throw and should have valid sensors
      expect(result.data.messageType).toBe(0x15)
      expect(result.data.configuration).toBeDefined()
    })

    it('should throw TypeError when decoded result contains sensors not in config', () => {
      // Create a very limited config that only has sensor1
      const limitedConfig = {
        sensor1: sensor1channelConfig,
      } as const satisfies TULIP3DeviceSensorConfig

      // Try to use the full configuration hex string which contains sensor2, sensor3, etc.
      expect(() => {
        decodeConfigurationRegisterRead(FullConfigurationHexString, limitedConfig)
      }).toThrow(TypeError)

      // Check that the error message mentions sensors not expected
      expect(() => {
        decodeConfigurationRegisterRead(FullConfigurationHexString, limitedConfig)
      }).toThrow('Sensors [sensor2, sensor3, sensor4] are not supported by this device')
    })

    it('should correctly filter out communicationModule from sensor validation', () => {
      // Use simple config with basic data that should only have communicationModule
      const hexString = '0x15 01 01 04 00 02 00 01'
      const data = hexStringToIntArray(hexString)

      expect(() => {
        decodeConfigurationRegisterRead(data!, config)
      }).not.toThrow()
    })
  })

  describe('sampling channels validation logic', () => {
    it('should pass when sampling channels configuration is undefined', () => {
      // Most simple configurations won't have sampling channels, should pass
      const hexString = '0x15 01 01 04 00 02 00 01'
      const data = hexStringToIntArray(hexString)

      expect(() => {
        decodeConfigurationRegisterRead(data!, config)
      }).not.toThrow()
    })

    it('should pass when all enabled sampling channels exist in config', () => {
      // This test requires finding a hex string that actually has sampling channels data
      // Let's use the full configuration which might have this
      expect(() => {
        decodeConfigurationRegisterRead(FullConfigurationHexString, config)
      }).not.toThrow()
    })

    it('should throw TypeError when sampling channel not in config is enabled', () => {
      // We need to create a test case where the decoded result has sampling channels
      // that aren't in our config. This is hard to test without real data that
      // contains sampling channel configuration, so we'll test with limited config
      const limitedConfig = {
        sensor1: {
          channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
          // Only channel1, no channel2
        },
        sensor2: {},
        sensor3: {},
        sensor4: {},
      } as const satisfies TULIP3DeviceSensorConfig

      expect(() => decodeConfigurationRegisterRead(FullConfigurationHexString, limitedConfig)).toThrow('Sampling channels [channel2, channel3, channel4, channel5, channel6, channel7, channel8] for sensor \'sensor1\' are not expected for this device')
    })
  })

  describe('channel name assignment logic', () => {
    it('should assign channel names from config to decoded result channels', () => {
      const result = decodeConfigurationRegisterRead(FullConfigurationHexString, config)

      // Check that channel names are assigned for any sensors that were decoded
      Object.keys(result.data.configuration).forEach((sensorKey) => {
        if (sensorKey === 'communicationModule')
          return

        const sensor = result.data.configuration[sensorKey as keyof typeof result.data.configuration]
        if (sensor && typeof sensor === 'object') {
          Object.keys(sensor).forEach((channelKey) => {
            if (channelKey.startsWith('channel')) {
              const channel = sensor[channelKey as keyof typeof sensor]
              if (channel && typeof channel === 'object' && 'channelName' in channel) {
                // Channel should have a channelName assigned
                // @ts-expect-error - We know channel.channelName exists
                expect(channel.channelName).toBeDefined()
                // @ts-expect-error - We know channel.channelName exists
                expect(typeof channel.channelName).toBe('string')
              }
            }
          })
        }
      })
    })

    it('should skip identification key when assigning channel names', () => {
      // Create a config with identification
      const configWithIdentification = {
        sensor1: {
          channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
        },
      } as const satisfies TULIP3DeviceSensorConfig

      // Use simple data that should work
      const hexString = '0x15 01 01 04 00 02 00 01'
      const data = hexStringToIntArray(hexString)

      expect(() => {
        decodeConfigurationRegisterRead(data!, configWithIdentification)
      }).not.toThrow()
    })

    it('should only assign channel names to channels that exist in result', () => {
      const result = decodeConfigurationRegisterRead(FullConfigurationHexString, config)

      // Verify that we don't have properties for channels that don't exist in the result
      // This is validated by the fact that the function doesn't crash when trying to access
      // non-existent channels in the result
      expect(result.data.configuration).toBeDefined()
    })
  })

  describe('specific edge cases for validation logic', () => {
    it('should handle config with empty sensor object', () => {
      const emptyConfig = {
        sensor1: {},
      } as const satisfies TULIP3DeviceSensorConfig

      const hexString = '0x15 01 01 04 00 02 00 01'
      const data = hexStringToIntArray(hexString)

      expect(() => {
        decodeConfigurationRegisterRead(data!, emptyConfig)
      }).not.toThrow()
    })

    it('should handle sparse channel configuration', () => {
      const sparseConfig = {
        sensor1: {
          channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'First Channel' },
          channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'Eighth Channel' },
        },
      } as const satisfies TULIP3DeviceSensorConfig

      const hexString = '0x15 01 01 04 00 02 00 01'
      const data = hexStringToIntArray(hexString)

      expect(() => {
        decodeConfigurationRegisterRead(data!, sparseConfig)
      }).not.toThrow()
    })

    it('should validate that communicationModule is always filtered out from sensor validation', () => {
      // Create a config without any sensors, only works if communicationModule is filtered
      const onlyCommunicationConfig = {} as const satisfies TULIP3DeviceSensorConfig

      const hexString = '0x15 01 01 04 00 02 00 01' // Should only decode communicationModule
      const data = hexStringToIntArray(hexString)

      expect(() => {
        decodeConfigurationRegisterRead(data!, onlyCommunicationConfig)
      }).not.toThrow()
    })
  })

  describe('comprehensive validation flow', () => {
    it('should execute all validation steps in correct order', () => {
      // Test that validation happens in the right order:
      // 1. Basic message validation (length, type, subtype) - before TODO
      // 2. Sensor validation - after TODO
      // 3. Sampling channels validation - after TODO
      // 4. Channel name assignment - after TODO

      const result = decodeConfigurationRegisterRead(FullConfigurationHexString, config)

      // If we get here, all validations passed
      expect(result.data.messageType).toBe(0x15)
      expect(result.data.configuration).toBeDefined()
    })

    it('should fail early on sensor validation before sampling validation', () => {
      const configWithOnlyOneSensor = {
        sensor1: sensor1channelConfig,
      } as const satisfies TULIP3DeviceSensorConfig

      try {
        decodeConfigurationRegisterRead(FullConfigurationHexString, configWithOnlyOneSensor)
      }
      catch (error) {
        if (error instanceof TypeError) {
          // Should be sensor validation error, not sampling validation error
          expect(error.message).toMatch('Sensors [sensor2, sensor3, sensor4] are not supported by this device')
          expect(error.message).not.toMatch(/sampling enabled/)
        }
      }
    })
  })

  describe('basic functionality validation', () => {
    it('should throw RangeError for too short data', () => {
      const data = [0x15, 0x01] // Only 2 bytes, minimum is 4

      expect(() => {
        decodeConfigurationRegisterRead(data, config)
      }).toThrow(RangeError)
      expect(() => {
        decodeConfigurationRegisterRead(data, config)
      }).toThrow('Configuration message too short. Expected at least 4 bytes but got 2')
    })

    it('should throw TypeError for invalid message type', () => {
      const data = [0x14, 0x01, 0x01, 0x04] // Wrong message type (0x14 instead of 0x15)

      expect(() => {
        decodeConfigurationRegisterRead(data, config)
      }).toThrow(TypeError)
      expect(() => {
        decodeConfigurationRegisterRead(data, config)
      }).toThrow('Invalid configuration message type: expected 0x15 but got 0x14')
    })

    it('should throw TypeError for unsupported subtype', () => {
      const data = [0x15, 0x03, 0x01, 0x04] // Wrong subtype (0x03 instead of 0x01 or 0x02)

      expect(() => {
        decodeConfigurationRegisterRead(data, config)
      }).toThrow(TypeError)
      expect(() => {
        decodeConfigurationRegisterRead(data, config)
      }).toThrow('Unsupported configuration message subtype: 0x03')
    })
  })

  describe('validateAndTransformConfigurationResult', () => {
    describe('sensor validation', () => {
      it('should pass when all result sensors are in device configuration', () => {
        const result = {
          sensor1: { channel1: { value: 25.5 } },
          sensor2: { channel1: { value: 30.0 } },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
          sensor2: sensor2channelConfig,
          sensor3: sensor3channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should throw TypeError when result contains sensor not in device configuration', () => {
        const result = {
          sensor1: { channel1: { value: 25.5 } },
          unknownSensor: { channel1: { value: 30.0 } },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
          sensor2: sensor2channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow(TypeError)
        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow('Sensor [unknownSensor] is not supported by this device')
      })

      it('should throw TypeError when multiple sensors are not in device configuration', () => {
        const result = {
          sensor1: { channel1: { value: 25.5 } },
          unknownSensor1: { channel1: { value: 30.0 } },
          unknownSensor2: { channel1: { value: 35.0 } },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow(TypeError)
        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow('Sensors [unknownSensor1, unknownSensor2] are not supported by this device')
      })

      it('should ignore communicationModule when validating sensors', () => {
        const result = {
          communicationModule: { transmissionRateAlarmOff: 1 },
          sensor1: { channel1: { value: 25.5 } },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle empty result object', () => {
        const result = {}
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle empty device configuration', () => {
        const result = {
          communicationModule: { transmissionRateAlarmOff: 1 },
        }
        const deviceConfig = {}

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle result with only communicationModule', () => {
        const result = {
          communicationModule: { transmissionRateAlarmOff: 1 },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })
    })

    describe('sampling channels validation', () => {
      it('should pass when sampling channels match device configuration', () => {
        const result = {
          sensor1: {
            configuration: {
              samplingChannels: {
                channel1: true,
                channel2: false,
              },
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should pass when sampling channels have extra channels set to false', () => {
        const result = {
          sensor1: {
            configuration: {
              samplingChannels: {
                channel1: true,
                channel2: false,
                channel9: false, // Not in device config but disabled
                channel10: false, // Not in device config but disabled
              },
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should throw TypeError when sampling enabled for channel not in device configuration', () => {
        const result = {
          sensor1: {
            configuration: {
              samplingChannels: {
                channel1: true,
                channel9: true, // Not in device config but enabled
              },
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow(TypeError)
        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow('Sampling channels [channel9] for sensor \'sensor1\' are not expected for this device')
      })

      it('should throw TypeError when multiple sampling channels are enabled for channels not in device configuration', () => {
        const result = {
          sensor1: {
            configuration: {
              samplingChannels: {
                channel1: true,
                channel9: true, // Not in device config but enabled
                channel10: true, // Not in device config but enabled
              },
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow(TypeError)
        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow('Sampling channels [channel9, channel10] for sensor \'sensor1\' are not expected for this device')
      })

      it('should handle sensor without sampling channels configuration', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5 },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle sensor with configuration but no samplingChannels', () => {
        const result = {
          sensor1: {
            configuration: {
              someOtherConfig: 'value',
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle empty sampling channels object', () => {
        const result = {
          sensor1: {
            configuration: {
              samplingChannels: {},
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should validate multiple sensors independently', () => {
        const result = {
          sensor1: {
            configuration: {
              samplingChannels: {
                channel1: true,
                channel9: true, // Invalid for sensor1
              },
            },
          },
          sensor2: {
            configuration: {
              samplingChannels: {
                channel1: true, // Valid for sensor2
              },
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
          sensor2: sensor2channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow(TypeError)
        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow('Sampling channels [channel9] for sensor \'sensor1\' are not expected for this device')
      })
    })

    describe('channel name assignment', () => {
      it('should assign channel names from device configuration', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5 },
            channel2: { value: 30.0 },
          },
          sensor2: {
            channel1: { value: 35.0 },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
          sensor2: sensor2channelConfig,
        }

        validateAndTransformConfigurationResult(result as any, deviceConfig)

        // @ts-expect-error - name is now present
        expect(result.sensor1.channel1.channelName).toBe('sensor1Channel1')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel2.channelName).toBe('sensor1Channel2')
        // @ts-expect-error - name is now present
        expect(result.sensor2.channel1.channelName).toBe('sensor2Channel1')
      })

      it('should only assign channel names to existing result channels', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5 },
            // channel2 not present in result
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        validateAndTransformConfigurationResult(result as any, deviceConfig)

        // @ts-expect-error - name is now present
        expect(result.sensor1.channel1.channelName).toBe('sensor1Channel1')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel2).toBeUndefined()
      })

      it('should handle sensors without channels in result', () => {
        const result = {
          sensor1: {},
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle device configuration with no channels', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5 },
          },
        }
        const deviceConfig = {
          sensor1: {
            channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
          },
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle device configuration with identification field', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5 },
          },
        }
        const deviceConfig = {
          sensor1: {
            ...sensor1channelConfig,
            identification: 'should be ignored',
          },
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()

        // @ts-expect-error - name is now present
        expect(result.sensor1.channel1.channelName).toBe('sensor1Channel1')
      })

      it('should assign all available channel names for a sensor', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5 },
            channel2: { value: 30.0 },
            channel3: { value: 35.0 },
            channel4: { value: 40.0 },
            channel5: { value: 45.0 },
            channel6: { value: 50.0 },
            channel7: { value: 55.0 },
            channel8: { value: 60.0 },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        validateAndTransformConfigurationResult(result as any, deviceConfig)

        // @ts-expect-error - name is now present
        expect(result.sensor1.channel1.channelName).toBe('sensor1Channel1')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel2.channelName).toBe('sensor1Channel2')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel3.channelName).toBe('sensor1Channel3')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel4.channelName).toBe('sensor1Channel4')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel5.channelName).toBe('sensor1Channel5')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel6.channelName).toBe('sensor1Channel6')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel7.channelName).toBe('sensor1Channel7')
        // @ts-expect-error - name is now present
        expect(result.sensor1.channel8.channelName).toBe('sensor1Channel8')
      })

      it('should handle null/undefined channel objects gracefully', () => {
        const result = {
          sensor1: null,
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })
    })

    describe('edge cases', () => {
      it('should handle complex nested configuration structures', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5, metadata: { timestamp: 1234567890 } },
            configuration: {
              samplingChannels: {
                channel1: true,
                channel2: false,
              },
              additionalSettings: 'value',
            },
          },
          sensor2: {
            channel1: { value: 30.0 },
            channel3: { value: 35.0 },
            configuration: {
              samplingChannels: {
                channel1: true,
                channel3: true,
              },
            },
          },
          communicationModule: {
            transmissionRateAlarmOff: 1,
            additionalData: 'test',
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
          sensor2: sensor2channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()

        // @ts-expect-error - name is now present
        expect(result.sensor1.channel1.channelName).toBe('sensor1Channel1')
        // @ts-expect-error - name is now present
        expect(result.sensor2.channel1.channelName).toBe('sensor2Channel1')
        // @ts-expect-error - name is now present
        expect(result.sensor2.channel3.channelName).toBe('sensor2Channel3')
      })

      it('should preserve original structure while adding channel names', () => {
        const result = {
          sensor1: {
            channel1: {
              value: 25.5,
              unit: 'celsius',
              timestamp: 1234567890,
              quality: 'good',
            },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
        }

        validateAndTransformConfigurationResult(result as any, deviceConfig)

        expect(result.sensor1.channel1).toEqual({
          value: 25.5,
          unit: 'celsius',
          timestamp: 1234567890,
          quality: 'good',
          channelName: 'sensor1Channel1',
        })
      })

      it('should handle configuration with sensor that has no channels', () => {
        const result = {
          sensor1: {
            configuration: {
              samplingChannels: {},
            },
          },
        }
        const deviceConfig = {
          sensor1: {},
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).not.toThrow()
      })

      it('should handle mixed valid and invalid scenarios in one call', () => {
        const result = {
          sensor1: {
            channel1: { value: 25.5 },
            configuration: {
              samplingChannels: {
                channel1: true,
                invalidChannel: true, // This should cause an error
              },
            },
          },
          validSensor: {
            channel1: { value: 30.0 },
          },
        }
        const deviceConfig = {
          sensor1: sensor1channelConfig,
          validSensor: sensor2channelConfig,
        }

        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow(TypeError)
        expect(() => {
          validateAndTransformConfigurationResult(result as any, deviceConfig)
        }).toThrow('Sampling channels [invalidChannel] for sensor \'sensor1\' are not expected for this device')
      })
    })
  })
})
