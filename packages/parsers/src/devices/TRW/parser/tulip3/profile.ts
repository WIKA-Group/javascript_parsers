import { TRW_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const trwCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const trwSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError', 'sensorInternalError']), {
  sensorIdentificationError: 0b1000_0000_0000_0000,
})

const trwChannelAlarmFlags = createDefaultChannelAlarmFlags()

const trwChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const trwChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const trwChannelRegisterConfig = {
  tulip3IdentificationRegisters: trwChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: trwChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const trwSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const trwSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
  bootTime: true,
})

const trwCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const trwCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  enableBleAdvertising: true,
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3TRWDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: TRW_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: trwCommunicationModuleAlarmFlags,
      sensorAlarms: trwSensorAlarmFlags,
      sensorChannelAlarms: trwChannelAlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: trwCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: trwCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: trwCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: trwSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: trwSensorConfigurationRegisters,
          tulip3IdentificationRegisters: trwSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'temperature',
          start: 0, // placeholder; actual range comes from device config at runtime
          end: 10, // placeholder; actual range comes from device config at runtime
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          alarmFlags: trwChannelAlarmFlags,
          registerConfig: trwChannelRegisterConfig,
        },
      },
    },
  })
}
