import { TRU_NETRIS3_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const truCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const truSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

const truChannelAlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

const truChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const truChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const truChannelRegisterConfig = {
  tulip3IdentificationRegisters: truChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: truChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const truSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const truSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
})

const truCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const truCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3TRUDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: TRU_NETRIS3_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: truCommunicationModuleAlarmFlags,
      sensorAlarms: truSensorAlarmFlags,
      sensorChannelAlarms: truChannelAlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: truCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: truCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: truCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: truSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: truSensorConfigurationRegisters,
          tulip3IdentificationRegisters: truSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'temperature',
          start: 0,
          end: 600,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          availableMeasurands: ['Temperature'],
          availableUnits: ['°C', '°F', 'K'],
          alarmFlags: truChannelAlarmFlags,
          registerConfig: truChannelRegisterConfig,
        },
      },
    },
  })
}
