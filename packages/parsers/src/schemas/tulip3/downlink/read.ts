/* eslint-disable ts/explicit-function-return-type */
import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../../../codecs/tulip3/profile'
import * as v from 'valibot'

// =============================================================================
// TYPE DEFINITIONS FOR READ INPUT FIELDS (IDENTIFICATION)
// =============================================================================

export interface ChannelIdentificationReadFieldSchemas {
  measurand: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  unit: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  minMeasureRange: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  maxMeasureRange: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  minPhysicalLimit: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  maxPhysicalLimit: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  accuracy: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  offset: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  gain: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  calibrationDate: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledChannelIdentificationReadFields<TConfig extends TULIP3ChannelConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3IdentificationRegisters']
  as TConfig['registerConfig']['tulip3IdentificationRegisters'][K] extends true
    ? K extends keyof ChannelIdentificationReadFieldSchemas
      ? K
      : never
    : never
  ]: K extends keyof ChannelIdentificationReadFieldSchemas
    ? ChannelIdentificationReadFieldSchemas[K]
    : never
}

export interface SensorIdentificationReadFieldSchemas {
  sensorType: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  existingChannels: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  firmwareVersion: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  hardwareVersion: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  productionDate: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  serialNumberPart1: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  serialNumberPart2: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledSensorIdentificationReadFields<TConfig extends TULIP3SensorConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3IdentificationRegisters']
  as TConfig['registerConfig']['tulip3IdentificationRegisters'][K] extends true
    ? K extends keyof SensorIdentificationReadFieldSchemas
      ? K
      : never
    : never
  ]: K extends keyof SensorIdentificationReadFieldSchemas
    ? SensorIdentificationReadFieldSchemas[K]
    : never
}

export interface CommunicationModuleIdentificationReadFieldSchemas {
  productId: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  productSubId: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  channelPlan: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  connectedSensors: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  firmwareVersion: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  hardwareVersion: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  productionDate: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  serialNumberPart1: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  serialNumberPart2: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledCommunicationModuleIdentificationReadFields<TConfig extends TULIP3DeviceConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3IdentificationRegisters']
  as TConfig['registerConfig']['tulip3IdentificationRegisters'][K] extends true
    ? K extends keyof CommunicationModuleIdentificationReadFieldSchemas
      ? K
      : never
    : never
  ]: K extends keyof CommunicationModuleIdentificationReadFieldSchemas
    ? CommunicationModuleIdentificationReadFieldSchemas[K]
    : never
}

// =============================================================================
// TYPE DEFINITIONS FOR READ INPUT FIELDS (CONFIGURATION)
// =============================================================================

export interface ChannelConfigurationReadFieldSchemas {
  protocolDataType: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  processAlarmEnabled: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  processAlarmDeadBand: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  lowThresholdAlarmValue: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  highThresholdAlarmValue: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  fallingSlopeAlarmValue: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  risingSlopeAlarmValue: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  lowThresholdWithDelayAlarmValue: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  lowThresholdWithDelayAlarmDelay: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  highThresholdWithDelayAlarmValue: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  highThresholdWithDelayAlarmDelay: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledChannelConfigurationReadFields<TConfig extends TULIP3ChannelConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters']
  as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true
    ? K extends keyof ChannelConfigurationReadFieldSchemas
      ? K
      : never
    : never
  ]: K extends keyof ChannelConfigurationReadFieldSchemas
    ? ChannelConfigurationReadFieldSchemas[K]
    : never
}

export interface SensorConfigurationReadFieldSchemas {
  samplingChannels: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  bootTime: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  communicationTimeout: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  communicationRetryCount: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledSensorConfigurationReadFields<TConfig extends TULIP3SensorConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters']
  as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true
    ? K extends keyof SensorConfigurationReadFieldSchemas
      ? K
      : never
    : never
  ]: K extends keyof SensorConfigurationReadFieldSchemas
    ? SensorConfigurationReadFieldSchemas[K]
    : never
}

export interface CommunicationModuleConfigurationReadFieldSchemas {
  measuringPeriodAlarmOff: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  measuringPeriodAlarmOn: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  transmissionRateAlarmOff: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  transmissionRateAlarmOn: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  overVoltageThreshold: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  underVoltageThreshold: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  overTemperatureCmChip: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  underTemperatureCmChip: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  downlinkAnswerTimeout: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  fetchAdditionalDownlinkTimeInterval: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
  enableBleAdvertising: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledCommunicationModuleConfigurationReadFields<TConfig extends TULIP3DeviceConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters']
  as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true
    ? K extends keyof CommunicationModuleConfigurationReadFieldSchemas
      ? K
      : never
    : never
  ]: K extends keyof CommunicationModuleConfigurationReadFieldSchemas
    ? CommunicationModuleConfigurationReadFieldSchemas[K]
    : never
}

// =============================================================================
// SCHEMA CREATION FUNCTIONS - CHANNEL LEVEL
// =============================================================================

/**
 * Creates a validation schema for channel identification read input.
 * Uses boolean flags to indicate which registers to read.
 *
 * @param config - Channel configuration with register flags
 * @returns A Valibot object schema with optional boolean flags
 */
function createChannelIdentificationReadSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3IdentificationRegisters
  const schema: Record<string, any> = {}

  if (flags.measurand)
    schema.measurand = v.optional(v.boolean())
  if (flags.unit)
    schema.unit = v.optional(v.boolean())
  if (flags.minMeasureRange)
    schema.minMeasureRange = v.optional(v.boolean())
  if (flags.maxMeasureRange)
    schema.maxMeasureRange = v.optional(v.boolean())
  if (flags.minPhysicalLimit)
    schema.minPhysicalLimit = v.optional(v.boolean())
  if (flags.maxPhysicalLimit)
    schema.maxPhysicalLimit = v.optional(v.boolean())
  if (flags.accuracy)
    schema.accuracy = v.optional(v.boolean())
  if (flags.offset)
    schema.offset = v.optional(v.boolean())
  if (flags.gain)
    schema.gain = v.optional(v.boolean())
  if (flags.calibrationDate)
    schema.calibrationDate = v.optional(v.boolean())

  // Add channel-specific custom identification registers
  const customFlags = config.registerConfig.channelSpecificIdentificationRegisters
  for (const key of Object.keys(customFlags)) {
    schema[key] = v.optional(v.boolean())
  }

  return v.object(schema as EnabledChannelIdentificationReadFields<TConfig>)
}

/**
 * Creates a validation schema for channel configuration read input.
 * Uses boolean flags to indicate which registers to read.
 *
 * @param config - Channel configuration with register flags
 * @returns A Valibot object schema with optional boolean flags
 */
function createChannelConfigurationReadSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  if (flags.protocolDataType)
    schema.protocolDataType = v.optional(v.boolean())
  if (flags.processAlarmEnabled)
    schema.processAlarmEnabled = v.optional(v.boolean())
  if (flags.processAlarmDeadBand)
    schema.processAlarmDeadBand = v.optional(v.boolean())
  if (flags.lowThresholdAlarmValue)
    schema.lowThresholdAlarmValue = v.optional(v.boolean())
  if (flags.highThresholdAlarmValue)
    schema.highThresholdAlarmValue = v.optional(v.boolean())
  if (flags.fallingSlopeAlarmValue)
    schema.fallingSlopeAlarmValue = v.optional(v.boolean())
  if (flags.risingSlopeAlarmValue)
    schema.risingSlopeAlarmValue = v.optional(v.boolean())
  if (flags.lowThresholdWithDelayAlarmValue)
    schema.lowThresholdWithDelayAlarmValue = v.optional(v.boolean())
  if (flags.lowThresholdWithDelayAlarmDelay)
    schema.lowThresholdWithDelayAlarmDelay = v.optional(v.boolean())
  if (flags.highThresholdWithDelayAlarmValue)
    schema.highThresholdWithDelayAlarmValue = v.optional(v.boolean())
  if (flags.highThresholdWithDelayAlarmDelay)
    schema.highThresholdWithDelayAlarmDelay = v.optional(v.boolean())

  // Add channel-specific custom configuration registers
  const customFlags = config.registerConfig.channelSpecificConfigurationRegisters
  for (const key of Object.keys(customFlags)) {
    schema[key] = v.optional(v.boolean())
  }

  return v.object(schema as EnabledChannelConfigurationReadFields<TConfig>)
}

/**
 * Creates a validation schema for channel read input (Multiple variant).
 * Allows both identification AND configuration fields.
 *
 * @param config - Channel configuration with register flags
 * @returns A Valibot object schema with optional identification and configuration
 */
function createChannelReadMultipleSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  return v.object({
    identification: v.optional(createChannelIdentificationReadSchema(config)),
    configuration: v.optional(createChannelConfigurationReadSchema(config)),
  })
}

// =============================================================================
// SCHEMA CREATION FUNCTIONS - SENSOR LEVEL
// =============================================================================

/**
 * Creates a validation schema for sensor identification read input.
 * Uses boolean flags to indicate which registers to read.
 *
 * @param config - Sensor configuration with register flags
 * @returns A Valibot object schema with optional boolean flags
 */
function createSensorIdentificationReadSchema<const TConfig extends TULIP3SensorConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3IdentificationRegisters
  const schema: Record<string, any> = {}

  if (flags.sensorType)
    schema.sensorType = v.optional(v.boolean())
  if (flags.existingChannels)
    schema.existingChannels = v.optional(v.boolean())
  if (flags.firmwareVersion)
    schema.firmwareVersion = v.optional(v.boolean())
  if (flags.hardwareVersion)
    schema.hardwareVersion = v.optional(v.boolean())
  if (flags.productionDate)
    schema.productionDate = v.optional(v.boolean())
  if (flags.serialNumberPart1)
    schema.serialNumberPart1 = v.optional(v.boolean())
  if (flags.serialNumberPart2)
    schema.serialNumberPart2 = v.optional(v.boolean())

  // Add sensor-specific custom identification registers
  const customFlags = config.registerConfig.sensorSpecificIdentificationRegisters
  for (const key of Object.keys(customFlags)) {
    schema[key] = v.optional(v.boolean())
  }

  return v.object(schema as EnabledSensorIdentificationReadFields<TConfig>)
}

/**
 * Creates a validation schema for sensor configuration read input.
 * Uses boolean flags to indicate which registers to read.
 *
 * @param config - Sensor configuration with register flags
 * @returns A Valibot object schema with optional boolean flags
 */
function createSensorConfigurationReadSchema<const TConfig extends TULIP3SensorConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  if (flags.samplingChannels)
    schema.samplingChannels = v.optional(v.boolean())
  if (flags.bootTime)
    schema.bootTime = v.optional(v.boolean())
  if (flags.communicationTimeout)
    schema.communicationTimeout = v.optional(v.boolean())
  if (flags.communicationRetryCount)
    schema.communicationRetryCount = v.optional(v.boolean())

  // Add sensor-specific custom configuration registers
  const customFlags = config.registerConfig.sensorSpecificConfigurationRegisters
  for (const key of Object.keys(customFlags)) {
    schema[key] = v.optional(v.boolean())
  }

  return v.object(schema as EnabledSensorConfigurationReadFields<TConfig>)
}

// =============================================================================
// SCHEMA CREATION FUNCTIONS - COMMUNICATION MODULE LEVEL
// =============================================================================

/**
 * Creates a validation schema for communication module identification read input.
 * Uses boolean flags to indicate which registers to read.
 *
 * @param config - Device configuration with register flags
 * @returns A Valibot object schema with optional boolean flags
 */
function createCommunicationModuleIdentificationReadSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3IdentificationRegisters
  const schema: Record<string, any> = {}

  if (flags.productId)
    schema.productId = v.optional(v.boolean())
  if (flags.productSubId)
    schema.productSubId = v.optional(v.boolean())
  if (flags.channelPlan)
    schema.channelPlan = v.optional(v.boolean())
  if (flags.connectedSensors)
    schema.connectedSensors = v.optional(v.boolean())
  if (flags.firmwareVersion)
    schema.firmwareVersion = v.optional(v.boolean())
  if (flags.hardwareVersion)
    schema.hardwareVersion = v.optional(v.boolean())
  if (flags.productionDate)
    schema.productionDate = v.optional(v.boolean())
  if (flags.serialNumberPart1)
    schema.serialNumberPart1 = v.optional(v.boolean())
  if (flags.serialNumberPart2)
    schema.serialNumberPart2 = v.optional(v.boolean())

  return v.object(schema as EnabledCommunicationModuleIdentificationReadFields<TConfig>)
}

/**
 * Creates a validation schema for communication module configuration read input.
 * Uses boolean flags to indicate which registers to read.
 *
 * @param config - Device configuration with register flags
 * @returns A Valibot object schema with optional boolean flags
 */
function createCommunicationModuleConfigurationReadSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  if (flags.measuringPeriodAlarmOff)
    schema.measuringPeriodAlarmOff = v.optional(v.boolean())
  if (flags.measuringPeriodAlarmOn)
    schema.measuringPeriodAlarmOn = v.optional(v.boolean())
  if (flags.transmissionRateAlarmOff)
    schema.transmissionRateAlarmOff = v.optional(v.boolean())
  if (flags.transmissionRateAlarmOn)
    schema.transmissionRateAlarmOn = v.optional(v.boolean())
  if (flags.overVoltageThreshold)
    schema.overVoltageThreshold = v.optional(v.boolean())
  if (flags.underVoltageThreshold)
    schema.underVoltageThreshold = v.optional(v.boolean())
  if (flags.overTemperatureCmChip)
    schema.overTemperatureCmChip = v.optional(v.boolean())
  if (flags.underTemperatureCmChip)
    schema.underTemperatureCmChip = v.optional(v.boolean())
  if (flags.downlinkAnswerTimeout)
    schema.downlinkAnswerTimeout = v.optional(v.boolean())
  if (flags.fetchAdditionalDownlinkTimeInterval)
    schema.fetchAdditionalDownlinkTimeInterval = v.optional(v.boolean())
  if (flags.enableBleAdvertising)
    schema.enableBleAdvertising = v.optional(v.boolean())

  return v.object(schema as EnabledCommunicationModuleConfigurationReadFields<TConfig>)
}

// =============================================================================
// COMPOSITE SCHEMAS - SENSOR WITH CHANNELS
// =============================================================================

type MappedChannelsForSensorReadSingle<TSensorConfig extends TULIP3SensorConfig> = {
  [K in keyof TSensorConfig as K extends `channel${number}` ? K : never]:
  TSensorConfig[K] extends TULIP3ChannelConfig
    ? v.OptionalSchema<v.ObjectSchema<{ identification: ReturnType<typeof createChannelIdentificationReadSchema<TSensorConfig[K]>> }, undefined>, undefined>
    : never
}

type MappedChannelsForSensorReadSingleConfiguration<TSensorConfig extends TULIP3SensorConfig> = {
  [K in keyof TSensorConfig as K extends `channel${number}` ? K : never]:
  TSensorConfig[K] extends TULIP3ChannelConfig
    ? v.OptionalSchema<v.ObjectSchema<{ configuration: ReturnType<typeof createChannelConfigurationReadSchema<TSensorConfig[K]>> }, undefined>, undefined>
    : never
}

type MappedChannelsForSensorReadMultiple<TSensorConfig extends TULIP3SensorConfig> = {
  [K in keyof TSensorConfig as K extends `channel${number}` ? K : never]:
  TSensorConfig[K] extends TULIP3ChannelConfig
    ? v.OptionalSchema<ReturnType<typeof createChannelReadMultipleSchema<TSensorConfig[K]>>, undefined>
    : never
}

/**
 * Creates a validation schema for a sensor's read input (Single variant).
 * Allows EITHER identification OR configuration at sensor level, but not both.
 * Channels use Single variant (identification OR configuration per channel).
 *
 * @param sensorConfig - Sensor configuration with channels
 * @returns A Valibot union schema with identification OR configuration
 */
function createSensorReadSingleSchema<const TConfig extends TULIP3SensorConfig>(sensorConfig: TConfig) {
  // Single mode is intentionally branch-explicit for better type hints:
  // - identification branch accepts only identification-shaped channels
  // - configuration branch accepts only configuration-shaped channels
  // This still allows channel-only payloads without requiring dummy sensor-level objects.
  const channelsIdentificationObj = Object.entries(sensorConfig).reduce((acc, [channelKey, channelConfig]) => {
    if (!channelKey.startsWith('channel'))
      return acc

    const channel = channelConfig as TULIP3ChannelConfig
    acc[channelKey as keyof typeof acc] = v.optional(v.object({ identification: createChannelIdentificationReadSchema(channel) })) as any

    return acc
  }, {} as MappedChannelsForSensorReadSingle<TConfig>)

  const channelsConfigurationObj = Object.entries(sensorConfig).reduce((acc, [channelKey, channelConfig]) => {
    if (!channelKey.startsWith('channel'))
      return acc

    const channel = channelConfig as TULIP3ChannelConfig
    acc[channelKey as keyof typeof acc] = v.optional(v.object({ configuration: createChannelConfigurationReadSchema(channel) })) as any

    return acc
  }, {} as MappedChannelsForSensorReadSingleConfiguration<TConfig>)

  return v.union([
    v.object({
      identification: v.optional(createSensorIdentificationReadSchema(sensorConfig)),
      ...channelsIdentificationObj,
    } as const),
    v.object({
      configuration: v.optional(createSensorConfigurationReadSchema(sensorConfig)),
      ...channelsConfigurationObj,
    } as const),
  ])
}

/**
 * Creates a validation schema for a sensor's read input (Multiple variant).
 * Allows both identification AND configuration at sensor level.
 * Channels use Multiple variant (both identification and configuration per channel).
 *
 * @param sensorConfig - Sensor configuration with channels
 * @returns A Valibot object schema with optional identification and configuration
 */
function createSensorReadMultipleSchema<const TConfig extends TULIP3SensorConfig>(sensorConfig: TConfig) {
  const channelsObj = Object.entries(sensorConfig).reduce((acc, [channelKey, channelConfig]) => {
    if (!channelKey.startsWith('channel'))
      return acc

    const channel = channelConfig as TULIP3ChannelConfig
    acc[channelKey as keyof typeof acc] = v.optional(createChannelReadMultipleSchema(channel)) as any

    return acc
  }, {} as MappedChannelsForSensorReadMultiple<TConfig>)

  return v.object({
    identification: v.optional(createSensorIdentificationReadSchema(sensorConfig)),
    configuration: v.optional(createSensorConfigurationReadSchema(sensorConfig)),
    ...channelsObj,
  } as const)
}

// =============================================================================
// TOP-LEVEL DATA SCHEMA
// =============================================================================

type MappedSensorsReadInputSingle<TDeviceConfig extends TULIP3DeviceConfig> = {
  [K in keyof TDeviceConfig as K extends `sensor${number}` ? K : never]:
  TDeviceConfig[K] extends TULIP3SensorConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorReadSingleSchema<TDeviceConfig[K]>>, undefined>
    : never
}

type MappedSensorsReadInputMultiple<TDeviceConfig extends TULIP3DeviceConfig> = {
  [K in keyof TDeviceConfig as K extends `sensor${number}` ? K : never]:
  TDeviceConfig[K] extends TULIP3SensorConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorReadMultipleSchema<TDeviceConfig[K]>>, undefined>
    : never
}

/**
 * Creates the main read input data schema for TULIP3 downlink (Single variant).
 * Allows EITHER identification OR configuration at all levels.
 * Used by encode() for single command encoding.
 *
 * @param config - Device configuration with all sensors and channels
 * @returns A Valibot schema for single-command read input structure
 */
function createReadInputDataSingleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const sensorsObj = Object.entries(config).reduce((acc, [sensorKey, sensorConfig]) => {
    if (!sensorKey.startsWith('sensor'))
      return acc

    acc[sensorKey as keyof typeof acc] = v.optional(createSensorReadSingleSchema(sensorConfig as TULIP3SensorConfig) as any) as any
    return acc
  }, {} as MappedSensorsReadInputSingle<TConfig>)

  return v.object({
    communicationModule: v.optional(v.union([
      v.object({ identification: createCommunicationModuleIdentificationReadSchema(config) }),
      v.object({ configuration: createCommunicationModuleConfigurationReadSchema(config) }),
    ])),
    ...sensorsObj,
  } as const)
}

/**
 * Creates the main read input data schema for TULIP3 downlink (Multiple variant).
 * Allows both identification AND configuration at all levels.
 * Used by encodeMultiple() for batch command encoding.
 *
 * @param config - Device configuration with all sensors and channels
 * @returns A Valibot schema for multiple-command read input structure
 */
function createReadInputDataMultipleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const sensorsObj = Object.entries(config).reduce((acc, [sensorKey, sensorConfig]) => {
    if (!sensorKey.startsWith('sensor'))
      return acc

    acc[sensorKey as keyof typeof acc] = v.optional(createSensorReadMultipleSchema(sensorConfig as TULIP3SensorConfig) as any) as any
    return acc
  }, {} as MappedSensorsReadInputMultiple<TConfig>)

  return v.object({
    communicationModule: v.optional(v.object({
      identification: v.optional(createCommunicationModuleIdentificationReadSchema(config)),
      configuration: v.optional(createCommunicationModuleConfigurationReadSchema(config)),
    })),
    ...sensorsObj,
  } as const)
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Read input data type for single command encoding.
 * Enforces EITHER identification OR configuration at all levels.
 * Used by encode().
 */
export type ReadSingleInputData<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createReadInputDataSingleSchema<TConfig>>>

/**
 * Read input data type for multiple command encoding.
 * Allows both identification AND configuration at all levels.
 * Used by encodeMultiple().
 */
export type ReadMultipleInputData<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createReadInputDataMultipleSchema<TConfig>>>

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createReadInputDataMultipleSchema,
  createReadInputDataSingleSchema,
}
