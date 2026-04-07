import { NETRISF_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const netrisfCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const netrisfSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

const netrisfChannelAlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

const netrisfChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const netrisfChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const netrisfChannelRegisterConfig = {
  tulip3IdentificationRegisters: netrisfChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: netrisfChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const netrisfSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const netrisfSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
})

const netrisfCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const netrisfCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  enableBleAdvertising: true,
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createdTULIP3NETRISFDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: NETRISF_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: netrisfCommunicationModuleAlarmFlags,
      sensorAlarms: netrisfSensorAlarmFlags,
      sensorChannelAlarms: netrisfChannelAlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: netrisfCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: netrisfCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: netrisfCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: netrisfSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: netrisfSensorConfigurationRegisters,
          tulip3IdentificationRegisters: netrisfSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'measurement',
          start: -312.5,
          end: 312.5,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          availableMeasurands: ['Force', 'Mass', 'Strain'],
          availableUnits: ['N', 'daN', 'kN', 'MN', 'kp', 'lbf', 'ozf', 'dyn', 'kg', 'g', 'mg', 'lb', 'µeps'],
          alarmFlags: netrisfChannelAlarmFlags,
          registerConfig: netrisfChannelRegisterConfig,
        },
        channel2: {
          channelName: 'device temperature',
          start: -45,
          end: 110,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          availableMeasurands: ['Temperature'],
          availableUnits: ['°C'],
          adjustMeasurementRangeDisallowed: true,
          alarmFlags: netrisfChannelAlarmFlags,
          registerConfig: netrisfChannelRegisterConfig,
        },
      },
    },
  })
}
