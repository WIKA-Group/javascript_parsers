import { PGU_NETRIS3_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const pguCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const pguSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

// Channel 1 has both min and max physical limit alarms
const pguChannel1AlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

// Channel 2 only has max physical limit alarm (no min physical limit)
const pguChannel2AlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit'])

const pguChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const pguChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const pguChannelRegisterConfig = {
  tulip3IdentificationRegisters: pguChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: pguChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const pguSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const pguSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
})

const pguCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const pguCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3PGUDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: PGU_NETRIS3_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: pguCommunicationModuleAlarmFlags,
      sensorAlarms: pguSensorAlarmFlags,
      sensorChannelAlarms: pguChannel1AlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: pguCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: pguCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: pguCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: pguSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: pguSensorConfigurationRegisters,
          tulip3IdentificationRegisters: pguSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'pressure',
          start: 0,
          end: 10,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          alarmFlags: pguChannel1AlarmFlags,
          registerConfig: pguChannelRegisterConfig,
        },
        channel2: {
          channelName: 'device temperature',
          start: -40,
          end: 60,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          adjustMeasurementRangeDisallowed: true,
          alarmFlags: pguChannel2AlarmFlags,
          registerConfig: pguChannelRegisterConfig,
        },
      },
    },
  })
}
