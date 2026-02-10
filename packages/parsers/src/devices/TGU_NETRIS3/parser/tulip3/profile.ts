import { TGU_NETRIS3_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const tguCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const tguSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

// Channel 1 has both min and max physical limit alarms
const tguChannel1AlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

// Channel 2 only has max physical limit alarm (no min physical limit)
const tguChannel2AlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit'])

const tguChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const tguChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const tguChannelRegisterConfig = {
  tulip3IdentificationRegisters: tguChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: tguChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const tguSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const tguSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
})

const tguCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const tguCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3TGUDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: TGU_NETRIS3_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: tguCommunicationModuleAlarmFlags,
      sensorAlarms: tguSensorAlarmFlags,
      sensorChannelAlarms: tguChannel1AlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: tguCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: tguCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: tguCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: tguSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: tguSensorConfigurationRegisters,
          tulip3IdentificationRegisters: tguSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'temperature',
          start: 0,
          end: 100,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          availableMeasurands: ['Temperature'],
          availableUnits: ['°C', '°F', 'K'],
          alarmFlags: tguChannel1AlarmFlags,
          registerConfig: tguChannelRegisterConfig,
        },
        channel2: {
          channelName: 'device temperature',
          start: -40,
          end: 60,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          availableMeasurands: ['Temperature'],
          availableUnits: ['°C', '°F', 'K'],
          adjustMeasurementRangeDisallowed: true,
          alarmFlags: tguChannel2AlarmFlags,
          registerConfig: tguChannelRegisterConfig,
        },
      },
    },
  })
}
