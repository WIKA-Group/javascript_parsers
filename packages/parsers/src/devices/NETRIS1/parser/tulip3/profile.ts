import { NETRIS1_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const netris1CommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const netris1SensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError', 'sensorInternalError']), {
  sensorIdentificationError: 0b1000_0000_0000_0000,
})

const netris1ChannelAlarmFlags = createDefaultChannelAlarmFlags()

const netris1ChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const netris1ChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const netris1ChannelRegisterConfig = {
  tulip3IdentificationRegisters: netris1ChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: netris1ChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const netris1SensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const netris1SensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
  bootTime: true,
})

const netris1CommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const netris1CommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
  enableBleAdvertising: true,
  measuringPeriodAlarmOff: true,
  transmissionRateAlarmOff: true,
  measuringPeriodAlarmOn: true,
  transmissionRateAlarmOn: true,
  underVoltageThreshold: true,
})

// eslint-disable-next-line ts/explicit-function-return-type
export function createdTULIP3NETRIS1DeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: NETRIS1_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: netris1CommunicationModuleAlarmFlags,
      sensorAlarms: netris1SensorAlarmFlags,
      sensorChannelAlarms: netris1ChannelAlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: netris1CommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: netris1CommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: netris1CommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: netris1SensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: netris1SensorConfigurationRegisters,
          tulip3IdentificationRegisters: netris1SensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'measurement',
          start: 0, // placeholder; actual range comes from device config at runtime
          end: 10, // placeholder; actual range comes from device config at runtime
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
          availableMeasurands: ['Temperature', 'Current', 'Voltage', 'Resistance'],
          availableUnits: ['°C', '°F', 'V', 'mA', '%'],
          alarmFlags: netris1ChannelAlarmFlags,
          registerConfig: netris1ChannelRegisterConfig,
        },
      },
    },
  })
}
