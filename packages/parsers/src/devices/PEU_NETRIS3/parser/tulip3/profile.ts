import { PEU_NETRIS3_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const peuCommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const peuSensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

// Channel 1 has both min and max physical limit alarms
const peuChannel1AlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

// Channel 2 only has max physical limit alarm (no min physical limit)
const peuChannel2AlarmFlags = pickAlarmFlags(createDefaultChannelAlarmFlags(), ['outOfMaxPhysicalSensorLimit'])

const peuChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const peuChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const peuChannelRegisterConfig = {
  tulip3IdentificationRegisters: peuChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: peuChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const peuSensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const peuSensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
})

const peuCommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const peuCommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3PEUDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: PEU_NETRIS3_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: peuCommunicationModuleAlarmFlags,
      sensorAlarms: peuSensorAlarmFlags,
      sensorChannelAlarms: peuChannel1AlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: peuCommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: peuCommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: peuCommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: peuSensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: peuSensorConfigurationRegisters,
          tulip3IdentificationRegisters: peuSensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'pressure',
          start: 0,
          end: 10,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          availableMeasurands: ['Pressure (gauge)', 'Pressure (absolute)'],
          availableUnits: ['psi', 'MPa', 'bar'],
          alarmFlags: peuChannel1AlarmFlags,
          registerConfig: peuChannelRegisterConfig,
        },
        channel2: {
          channelName: 'device temperature',
          start: -40,
          end: 60,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500', 'float - IEEE754'],
          availableMeasurands: ['Temperature'],
          availableUnits: ['°C', '°F', 'K'],
          adjustMeasurementRangeDisallowed: true,
          alarmFlags: peuChannel2AlarmFlags,
          registerConfig: peuChannelRegisterConfig,
        },
      },
    },
  })
}
