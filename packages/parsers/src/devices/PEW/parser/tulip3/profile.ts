import { PEW_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const pewCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const pewSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

const pewChannelAlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

const pewChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const pewChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const pewChannelRegisterConfig = {
  tulip3IdentificationRegisters: pewChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: pewChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const pewSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const pewSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
})

const pewCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const pewCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  enableBleAdvertising: true,
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createdTULIP3PEWDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: PEW_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: pewCommunicationModuleAlarmFlags,
      sensorAlarms: pewSensorAlarmFlags,
      sensorChannelAlarms: pewChannelAlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: pewCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: pewCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: pewCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: pewSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: pewSensorConfigurationRegisters,
          tulip3IdentificationRegisters: pewSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'pressure',
          start: 0,
          end: 10,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          availableMeasurands: ['Pressure (gauge)', 'Pressure (absolute)'],
          availableUnits: ['psi', 'MPa', 'bar'],
          alarmFlags: pewChannelAlarmFlags,
          registerConfig: pewChannelRegisterConfig,
        },
        channel2: {
          channelName: 'device temperature',
          start: -45,
          end: 110,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          availableMeasurands: ['Temperature'],
          availableUnits: ['°C'],
          adjustMeasurementRangeDisallowed: true,
          alarmFlags: pewChannelAlarmFlags,
          registerConfig: pewChannelRegisterConfig,
        },
      },
    },
  })
}
