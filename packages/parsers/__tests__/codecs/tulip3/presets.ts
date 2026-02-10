import type { ChannelRegisterConfig, CommunicationModuleRegisterConfig, SensorRegisterConfig, TULIP3DeviceConfig } from '../../../src/codecs/tulip3/profile'
import { createDefaultChannelAlarmFlags, createDefaultCommunicationModuleAlarmFlags, createDefaultSensorAlarmFlags } from '../../../src/codecs/tulip3/messages/deviceAlarm'

export function emptySensorRegisterConfig(): SensorRegisterConfig {
  return {
    sensorSpecificConfigurationRegisters: {},
    sensorSpecificIdentificationRegisters: {},
    tulip3ConfigurationRegisters: {},
    tulip3IdentificationRegisters: {},
  }
}

export function emptyChannelRegisterConfig(): ChannelRegisterConfig {
  return {
    channelSpecificConfigurationRegisters: {},
    channelSpecificIdentificationRegisters: {},
    tulip3ConfigurationRegisters: {},
    tulip3IdentificationRegisters: {},
  }
}

export function emptyCommunicationModuleRegisterConfig(): CommunicationModuleRegisterConfig {
  return {
    tulip3ConfigurationRegisters: {},
    tulip3IdentificationRegisters: {},
  }
}

export function completeCommunicationModuleRegisterConfig() {
  return {
    tulip3ConfigurationRegisters: {
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
    },
    tulip3IdentificationRegisters: {
      productId: true,
      productSubId: true,
      channelPlan: true,
      connectedSensors: true,
      firmwareVersion: true,
      hardwareVersion: true,
      productionDate: true,
      serialNumberPart1: true,
      serialNumberPart2: true,
    },
  } as const satisfies CommunicationModuleRegisterConfig
}

export function completeSensorRegisterConfig() {
  return {
    tulip3IdentificationRegisters: {
      sensorType: true,
      existingChannels: true,
      firmwareVersion: true,
      hardwareVersion: true,
      productionDate: true,
      serialNumberPart1: true,
      serialNumberPart2: true,
    },
    tulip3ConfigurationRegisters: {
      samplingChannels: true,
      bootTime: true,
      communicationTimeout: true,
      communicationRetryCount: true,
    },
    sensorSpecificIdentificationRegisters: {},
    sensorSpecificConfigurationRegisters: {},
  } as const satisfies SensorRegisterConfig
}

export function completeChannelRegisterConfig() {
  return {
    tulip3IdentificationRegisters: {
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
    },
    tulip3ConfigurationRegisters: {
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
    },
    channelSpecificIdentificationRegisters: {},
    channelSpecificConfigurationRegisters: {},
  } as const satisfies ChannelRegisterConfig
}

export function completeTULIP3DeviceConfig() {
  return {
    sensor1: {
      channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel2', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel3', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel4', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel5', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel6', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel7', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel8', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      alarmFlags: createDefaultSensorAlarmFlags(),
      registerConfig: completeSensorRegisterConfig(),
    },
    sensor2: {
      channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel1', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel2', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel3', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel4', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel5', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel6', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel7', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor2Channel8', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      alarmFlags: createDefaultSensorAlarmFlags(),
      registerConfig: completeSensorRegisterConfig(),
    },
    sensor3: {
      channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel1', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel2', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel3', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel4', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel5', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel6', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel7', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor3Channel8', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      alarmFlags: createDefaultSensorAlarmFlags(),
      registerConfig: completeSensorRegisterConfig(),
    },
    sensor4: {
      channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel1', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel2: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel2', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel3: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel3', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel4: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel4', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel5: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel5', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel6: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel6', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel7: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel7', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      channel8: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor4Channel8', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
      alarmFlags: createDefaultSensorAlarmFlags(),
      registerConfig: completeSensorRegisterConfig(),
    },
    alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
    registerConfig: completeCommunicationModuleRegisterConfig(),
  } as const satisfies TULIP3DeviceConfig
}

export {
  createDefaultChannelAlarmFlags,
  createDefaultCommunicationModuleAlarmFlags,
  createDefaultSensorAlarmFlags,
}
