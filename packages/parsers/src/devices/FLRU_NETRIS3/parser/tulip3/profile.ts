import { FLRU_NETRIS3_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const flruCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const flruSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

const flruChannelAlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

const flruChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const flruChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const flruChannelRegisterConfig = {
  tulip3IdentificationRegisters: flruChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: flruChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const flruSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const flruSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
})

const flruCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const flruCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3FLRUDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: FLRU_NETRIS3_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: flruCommunicationModuleAlarmFlags,
      sensorAlarms: flruSensorAlarmFlags,
      sensorChannelAlarms: flruChannelAlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: flruCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: flruCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: flruCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: flruSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: flruSensorConfigurationRegisters,
          tulip3IdentificationRegisters: flruSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'level',
          start: 0,
          end: 1000,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          alarmFlags: flruChannelAlarmFlags,
          registerConfig: flruChannelRegisterConfig,
        },
      },
    },
  })
}
