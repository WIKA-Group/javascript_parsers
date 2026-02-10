import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags } from '../../../../src/codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../src/codecs/tulip3/profile'

/**
 * Complete TULIP3 device profile with all registers, units, and features enabled.
 * Used for comprehensive testing of encoding/decoding functionality.
 */

const completeChannelIdentificationRegisters = defineChannelIdentificationRegisters({
  measurand: true,
  unit: true,
  minMeasureRange: true,
  maxMeasureRange: true,
  minPhysicalLimit: true,
  maxPhysicalLimit: true,
  accuracy: true,
  offset: true,
  gain: true,
  calibrationDate: true,
})

const completeChannelConfigurationRegisters = defineChannelConfigurationRegisters({
  protocolDataType: true,
  processAlarmEnabled: true,
  processAlarmDeadBand: true,
  lowThresholdAlarmValue: true,
  highThresholdAlarmValue: true,
  fallingSlopeAlarmValue: true,
  risingSlopeAlarmValue: true,
  lowThresholdWithDelayAlarmValue: true,
  lowThresholdWithDelayAlarmDelay: true,
  highThresholdWithDelayAlarmValue: true,
  highThresholdWithDelayAlarmDelay: true,
})

const completeChannelRegisterConfig = {
  tulip3IdentificationRegisters: completeChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: completeChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const completeSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const completeSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
  bootTime: true,
  communicationTimeout: true,
  communicationRetryCount: true,
})

const completeCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
  productId: true,
  productSubId: true,
  channelPlan: true,
  connectedSensors: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const completeCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  measuringPeriodAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOff: true,
  transmissionRateAlarmOn: true,
  overVoltageThreshold: true,
  underVoltageThreshold: true,
  overTemperatureCmChip: true,
  underTemperatureCmChip: true,
  downlinkAnswerTimeout: true,
  fetchAdditionalDownlinkTimeInterval: true,
  enableBleAdvertising: true,
})

const completeChannelAlarmFlags = createDefaultChannelAlarmFlags()
const completeSensorAlarmFlags = createDefaultSensorAlarmFlags()
const completeCommunicationModuleAlarmFlags = createDefaultCommunicationModuleAlarmFlags()

/**
 * Creates a complete TULIP3 device profile for testing
 */
export function createCompleteTULIP3Profile() {
  return defineTULIP3DeviceProfile({
    deviceName: 'Complete Test Device',
    sensorChannelConfig: {
      alarmFlags: completeCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: completeCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: completeCommunicationModuleIdentificationRegisters,
      },
      sensor1: {
        alarmFlags: completeSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: completeSensorConfigurationRegisters,
          tulip3IdentificationRegisters: completeSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'pressure',
          start: 0,
          end: 100,
          measurementTypes: [
            'float - IEEE754',
            'int 24 - Fixed-point s16.7 (Q16.7)',
            'int 16 - Fixed-point s10.5 (Q10.5)',
            'uint16 - TULIP scale 2500 - 12500',
          ],
          availableMeasurands: ['Pressure (gauge)', 'Temperature'],
          availableUnits: ['bar', 'mbar', 'Pa', 'kPa', 'MPa', 'psi', '°C', '°F'],
          alarmFlags: completeChannelAlarmFlags,
          registerConfig: completeChannelRegisterConfig,
        },
        channel2: {
          channelName: 'temperature',
          start: 0,
          end: 100,
          measurementTypes: [
            'float - IEEE754',
            'int 24 - Fixed-point s16.7 (Q16.7)',
            'int 16 - Fixed-point s10.5 (Q10.5)',
            'uint16 - TULIP scale 2500 - 12500',
          ],
          availableMeasurands: ['Pressure (gauge)', 'Temperature'],
          availableUnits: ['bar', 'mbar', 'Pa', 'kPa', 'MPa', 'psi', '°C', '°F'],
          alarmFlags: completeChannelAlarmFlags,
          registerConfig: completeChannelRegisterConfig,
        },
      },
    },
  })
}
