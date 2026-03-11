import { NETRIS2_NAME } from '..'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags, defineAlarmFlags, pickAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineChannelConfigurationRegisters, defineChannelIdentificationRegisters, defineCommunicationModuleConfigurationRegisters, defineCommunicationModuleIdentificationRegisters, defineSensorConfigurationRegisters, defineSensorIdentificationRegisters, defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const netris2CommunicationModuleAlarmFlags = pickAlarmFlags(createDefaultCommunicationModuleAlarmFlags(), ['cmChipLowTemperature', 'cmChipHighTemperature', 'airTimeLimitation', 'memoryError', 'lowVoltage', 'highVoltage'])

const netris2SensorAlarmFlags = defineAlarmFlags(pickAlarmFlags(createDefaultSensorAlarmFlags(), ['sensorCommunicationError', 'sensorInternalError']), {
  sensorIdentificationError: 0b1000_0000_0000_0000,
})

const netris2ChannelAlarmFlags = createDefaultChannelAlarmFlags()

const netris2ChannelIdentificationRegisters = defineChannelIdentificationRegisters({
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

const netris2ChannelConfigurationRegisters = defineChannelConfigurationRegisters({
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

const netris2ChannelRegisterConfig = {
  tulip3IdentificationRegisters: netris2ChannelIdentificationRegisters,
  tulip3ConfigurationRegisters: netris2ChannelConfigurationRegisters,
  channelSpecificConfigurationRegisters: {},
  channelSpecificIdentificationRegisters: {},
}

const netris2SensorIdentificationRegisters = defineSensorIdentificationRegisters({
  sensorType: true,
  existingChannels: true,
  firmwareVersion: true,
  hardwareVersion: true,
  productionDate: true,
  serialNumberPart1: true,
  serialNumberPart2: true,
})

const netris2SensorConfigurationRegisters = defineSensorConfigurationRegisters({
  samplingChannels: true,
  bootTime: true,
  communicationTimeout: true,
  communicationRetryCount: true,
})

const netris2CommunicationModuleIdentificationRegisters = defineCommunicationModuleIdentificationRegisters({
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

const netris2CommunicationModuleConfigurationRegisters = defineCommunicationModuleConfigurationRegisters({
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

// eslint-disable-next-line ts/explicit-function-return-type
export function createdTULIP3NETRIS2DeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: NETRIS2_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: netris2CommunicationModuleAlarmFlags,
      sensorAlarms: netris2SensorAlarmFlags,
      sensorChannelAlarms: netris2ChannelAlarmFlags,
    },
    sensorChannelConfig: {
      alarmFlags: netris2CommunicationModuleAlarmFlags,
      registerConfig: {
        tulip3ConfigurationRegisters: netris2CommunicationModuleConfigurationRegisters,
        tulip3IdentificationRegisters: netris2CommunicationModuleIdentificationRegisters,
        communicationModuleSpecificConfigurationRegisters: {},
        communicationModuleSpecificIdentificationRegisters: {},
      },
      sensor1: {
        alarmFlags: netris2SensorAlarmFlags,
        registerConfig: {
          tulip3ConfigurationRegisters: netris2SensorConfigurationRegisters,
          tulip3IdentificationRegisters: netris2SensorIdentificationRegisters,
          sensorSpecificConfigurationRegisters: {},
          sensorSpecificIdentificationRegisters: {},
        },
        channel1: {
          channelName: 'Electrical current1',
          start: 4,
          end: 20,
          measurementTypes: ['float - IEEE754', 'uint16 - TULIP scale 2500 - 12500'],
          availableMeasurands: ['Current'],
          availableUnits: ['mA'],
          adjustMeasurementRangeDisallowed: true,
          alarmFlags: netris2ChannelAlarmFlags,
          registerConfig: netris2ChannelRegisterConfig,
        },
        channel2: {
          channelName: 'Electrical current2',
          start: 4,
          end: 20,
          measurementTypes: ['float - IEEE754', 'uint16 - TULIP scale 2500 - 12500'],
          availableMeasurands: ['Current'],
          availableUnits: ['mA'],
          adjustMeasurementRangeDisallowed: true,
          alarmFlags: netris2ChannelAlarmFlags,
          registerConfig: netris2ChannelRegisterConfig,
        },
      },
    },
  })
}
