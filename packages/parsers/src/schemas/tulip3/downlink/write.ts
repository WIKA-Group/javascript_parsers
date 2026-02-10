/* eslint-disable ts/explicit-function-return-type */
import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../../../codecs/tulip3/profile'
import * as v from 'valibot'
import { createChannelUnitNameSchema, createProcessAlarmEnabledSchema, createProtocolDataTypeSchema, createSamplingChannelsSchema } from '../schemaUtils'

// =============================================================================
// TYPE DEFINITIONS FOR WRITE INPUT FIELDS (SCHEMA FIELD TYPES)
// =============================================================================

// Channel-level identification writable field schemas
export interface ChannelIdentificationWriteFieldSchemas<TConfig extends TULIP3ChannelConfig> {
  unit: v.OptionalSchema<ReturnType<typeof createChannelUnitNameSchema<TConfig>>, undefined>
  offset: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  gain: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
}

type EnabledChannelIdentificationWriteFields<TConfig extends TULIP3ChannelConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3IdentificationRegisters']
  as TConfig['registerConfig']['tulip3IdentificationRegisters'][K] extends true
    ? K extends keyof ChannelIdentificationWriteFieldSchemas<TConfig>
      ? K
      : never
    : never
  ]: K extends keyof ChannelIdentificationWriteFieldSchemas<TConfig>
    ? ChannelIdentificationWriteFieldSchemas<TConfig>[K]
    : never
}

// Channel-level configuration writable field schemas
export interface ChannelConfigurationWriteFieldSchemas<TConfig extends TULIP3ChannelConfig> {
  protocolDataType: v.OptionalSchema<ReturnType<typeof createProtocolDataTypeSchema<TConfig>>, undefined>
  processAlarmEnabled: v.OptionalSchema<ReturnType<typeof createProcessAlarmEnabledSchema>, undefined>
  processAlarmDeadBand: v.OptionalSchema<ReturnType<typeof createChannelRangeSpanValueSchema>, undefined>
  lowThresholdAlarmValue: v.OptionalSchema<ReturnType<typeof createChannelThresholdValueSchema>, undefined>
  highThresholdAlarmValue: v.OptionalSchema<ReturnType<typeof createChannelThresholdValueSchema>, undefined>
  fallingSlopeAlarmValue: v.OptionalSchema<ReturnType<typeof createChannelRangeSpanValueSchema>, undefined>
  risingSlopeAlarmValue: v.OptionalSchema<ReturnType<typeof createChannelRangeSpanValueSchema>, undefined>
  lowThresholdWithDelayAlarmValue: v.OptionalSchema<ReturnType<typeof createChannelThresholdValueSchema>, undefined>
  lowThresholdWithDelayAlarmDelay: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  highThresholdWithDelayAlarmValue: v.OptionalSchema<ReturnType<typeof createChannelThresholdValueSchema>, undefined>
  highThresholdWithDelayAlarmDelay: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
}

type EnabledChannelConfigurationWriteFields<TConfig extends TULIP3ChannelConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters']
  as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true
    ? K extends keyof ChannelConfigurationWriteFieldSchemas<TConfig>
      ? K
      : never
    : never
  ]: K extends keyof ChannelConfigurationWriteFieldSchemas<TConfig>
    ? ChannelConfigurationWriteFieldSchemas<TConfig>[K]
    : never
}

// Sensor-level configuration writable field schemas (no writable identification registers)
export interface SensorConfigurationWriteFieldSchemas<TConfig extends TULIP3SensorConfig> {
  samplingChannels: v.OptionalSchema<ReturnType<typeof createSamplingChannelsSchema<TConfig>>, undefined>
  bootTime: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  communicationTimeout: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  communicationRetryCount: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
}

type EnabledSensorConfigurationWriteFields<TConfig extends TULIP3SensorConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters']
  as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true
    ? K extends keyof SensorConfigurationWriteFieldSchemas<TConfig>
      ? K
      : never
    : never
  ]: K extends keyof SensorConfigurationWriteFieldSchemas<TConfig>
    ? SensorConfigurationWriteFieldSchemas<TConfig>[K]
    : never
}

// Communication Module-level configuration writable field schemas (no writable identification registers)
// Note: overVoltageThreshold and underVoltageThreshold are read-only, thus excluded here
export interface CommunicationModuleConfigurationWriteFieldSchemas {
  measuringPeriodAlarmOff: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  measuringPeriodAlarmOn: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  transmissionRateAlarmOff: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  transmissionRateAlarmOn: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  overTemperatureCmChip: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  underTemperatureCmChip: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  downlinkAnswerTimeout: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  fetchAdditionalDownlinkTimeInterval: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  enableBleAdvertising: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledCommunicationModuleConfigurationWriteFields<TConfig extends TULIP3DeviceConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters']
  as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true
    ? K extends keyof CommunicationModuleConfigurationWriteFieldSchemas
      ? K
      : never
    : never
  ]: K extends keyof CommunicationModuleConfigurationWriteFieldSchemas ? CommunicationModuleConfigurationWriteFieldSchemas[K] : never
}

// =============================================================================
// SCHEMA CREATION FUNCTIONS - CHANNEL LEVEL
// =============================================================================

/**
 * Creates a validation schema for channel threshold alarm values.
 * Values are validated against the channel's measurement range (min to max).
 * Used for: lowThresholdAlarmValue, highThresholdAlarmValue, etc.
 *
 * @param channelConfig - Channel configuration with start/end range
 * @returns A Valibot schema with range validation
 */
function createChannelThresholdValueSchema(channelConfig: TULIP3ChannelConfig) {
  return v.pipe(
    v.number(),
    v.minValue(channelConfig.start, `Value must be >= ${channelConfig.start}`),
    v.maxValue(channelConfig.end, `Value must be <= ${channelConfig.end}`),
  )
}

/**
 * Creates a validation schema for channel dead band and slope alarm values.
 * Values are validated from 0 to the range span (max - min).
 * Used for: processAlarmDeadBand, fallingSlopeAlarmValue, risingSlopeAlarmValue.
 *
 * @param channelConfig - Channel configuration with start/end range
 * @returns A Valibot schema with range span validation
 */
function createChannelRangeSpanValueSchema(channelConfig: TULIP3ChannelConfig) {
  const rangeSpan = channelConfig.end - channelConfig.start
  return v.pipe(
    v.number(),
    v.minValue(0, 'Value must be >= 0'),
    v.maxValue(rangeSpan, `Value must be <= ${rangeSpan} (range span)`),
  )
}

/**
 * Creates a validation schema for channel identification write input.
 * Only includes writable identification registers: unit, offset, gain.
 * Other identification registers are factory-set and read-only.
 *
 * @param config - Channel configuration with register flags and measurement range
 * @returns A Valibot object schema with writable identification fields
 */
function createChannelIdentificationWriteSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3IdentificationRegisters
  const schema: Record<string, any> = {}

  // Standard TULIP3 identification registers (writable ones only)
  if (flags.unit)
    schema.unit = v.optional(createChannelUnitNameSchema(config))
  if (flags.offset)
    schema.offset = v.optional(v.number())
  if (flags.gain)
    schema.gain = v.optional(v.number())

  // Device-specific custom identification registers
  const customFlags = config.registerConfig.channelSpecificIdentificationRegisters
  for (const key of Object.keys(customFlags)) {
    schema[key] = v.optional(v.number())
  }

  return v.object(schema as EnabledChannelIdentificationWriteFields<TConfig>)
}

/**
 * Creates a validation schema for channel configuration write input.
 * Uses actual typed values (physical units) for writable configuration registers.
 *
 * @param config - Channel configuration with register flags and measurement range
 * @returns A Valibot object schema with typed value fields
 */
function createChannelConfigurationWriteSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const thresholdValueSchema = createChannelThresholdValueSchema(config)
  const rangeSpanValueSchema = createChannelRangeSpanValueSchema(config)
  const schema: Record<string, any> = {}

  // Standard TULIP3 configuration registers
  if (flags.protocolDataType)
    schema.protocolDataType = v.optional(createProtocolDataTypeSchema(config))
  if (flags.processAlarmEnabled)
    schema.processAlarmEnabled = v.optional(createProcessAlarmEnabledSchema())
  if (flags.processAlarmDeadBand)
    schema.processAlarmDeadBand = v.optional(rangeSpanValueSchema)
  if (flags.lowThresholdAlarmValue)
    schema.lowThresholdAlarmValue = v.optional(thresholdValueSchema)
  if (flags.highThresholdAlarmValue)
    schema.highThresholdAlarmValue = v.optional(thresholdValueSchema)
  if (flags.fallingSlopeAlarmValue)
    schema.fallingSlopeAlarmValue = v.optional(rangeSpanValueSchema)
  if (flags.risingSlopeAlarmValue)
    schema.risingSlopeAlarmValue = v.optional(rangeSpanValueSchema)
  if (flags.lowThresholdWithDelayAlarmValue)
    schema.lowThresholdWithDelayAlarmValue = v.optional(thresholdValueSchema)
  if (flags.lowThresholdWithDelayAlarmDelay)
    schema.lowThresholdWithDelayAlarmDelay = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))
  if (flags.highThresholdWithDelayAlarmValue)
    schema.highThresholdWithDelayAlarmValue = v.optional(thresholdValueSchema)
  if (flags.highThresholdWithDelayAlarmDelay)
    schema.highThresholdWithDelayAlarmDelay = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))

  // Device-specific custom configuration registers
  const customFlags = config.registerConfig.channelSpecificConfigurationRegisters
  for (const key of Object.keys(customFlags)) {
    schema[key] = v.optional(v.number())
  }

  return v.object(schema as EnabledChannelConfigurationWriteFields<TConfig>)
}

/**
 * Creates a validation schema for channel write input (Single variant).
 * Allows EITHER identification OR configuration, but not both.
 *
 * @param config - Channel configuration with register flags and measurement range
 * @returns A Valibot union schema with identification OR configuration
 */
function createChannelWriteSingleSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  return v.union([
    v.object({ identification: createChannelIdentificationWriteSchema(config) }),
    v.object({ configuration: createChannelConfigurationWriteSchema(config) }),
  ])
}

/**
 * Creates a validation schema for channel write input (Multiple variant).
 * Allows both identification AND configuration fields.
 *
 * @param config - Channel configuration with register flags and measurement range
 * @returns A Valibot object schema with optional identification and configuration
 */
function createChannelWriteMultipleSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  return v.object({
    identification: v.optional(createChannelIdentificationWriteSchema(config)),
    configuration: v.optional(createChannelConfigurationWriteSchema(config)),
  })
}

// =============================================================================
// SCHEMA CREATION FUNCTIONS - SENSOR LEVEL
// =============================================================================

/**
 * Creates a validation schema for sensor configuration write input.
 * Uses actual typed values for writable configuration registers.
 * Note: All sensor identification registers are read-only.
 *
 * @param config - Sensor configuration with register flags
 * @returns A Valibot object schema with typed value fields
 */
function createSensorConfigurationWriteSchema<const TConfig extends TULIP3SensorConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  // Standard TULIP3 configuration registers
  if (flags.samplingChannels)
    schema.samplingChannels = v.optional(createSamplingChannelsSchema(config))
  if (flags.bootTime)
    schema.bootTime = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))
  if (flags.communicationTimeout)
    schema.communicationTimeout = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))
  if (flags.communicationRetryCount)
    schema.communicationRetryCount = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))

  // Device-specific custom configuration registers
  const customFlags = config.registerConfig.sensorSpecificConfigurationRegisters
  for (const key of Object.keys(customFlags)) {
    schema[key] = v.optional(v.number())
  }

  return v.object(schema as EnabledSensorConfigurationWriteFields<TConfig>)
}

// =============================================================================
// SCHEMA CREATION FUNCTIONS - COMMUNICATION MODULE LEVEL
// =============================================================================

/**
 * Creates a validation schema for communication module configuration write input.
 * Uses actual typed values for writable configuration registers.
 * Note: All CM identification registers are read-only.
 *
 * @param config - Device configuration with register flags
 * @returns A Valibot object schema with typed value fields
 */
function createCommunicationModuleConfigurationWriteSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  // Time intervals (seconds)
  if (flags.measuringPeriodAlarmOff)
    schema.measuringPeriodAlarmOff = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))
  if (flags.measuringPeriodAlarmOn)
    schema.measuringPeriodAlarmOn = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))
  if (flags.transmissionRateAlarmOff)
    schema.transmissionRateAlarmOff = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))
  if (flags.transmissionRateAlarmOn)
    schema.transmissionRateAlarmOn = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))

  // Temperature thresholds (degrees Celsius)
  if (flags.overTemperatureCmChip)
    schema.overTemperatureCmChip = v.optional(v.pipe(v.number(), v.integer(), v.minValue(-40), v.maxValue(85)))
  if (flags.underTemperatureCmChip)
    schema.underTemperatureCmChip = v.optional(v.pipe(v.number(), v.integer(), v.minValue(-40), v.maxValue(85)))

  // Timeouts (seconds)
  if (flags.downlinkAnswerTimeout)
    schema.downlinkAnswerTimeout = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))
  if (flags.fetchAdditionalDownlinkTimeInterval)
    schema.fetchAdditionalDownlinkTimeInterval = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)))

  // Boolean flags
  if (flags.enableBleAdvertising)
    schema.enableBleAdvertising = v.optional(v.boolean())

  return v.object(schema as EnabledCommunicationModuleConfigurationWriteFields<TConfig>)
}

// =============================================================================
// COMPOSITE SCHEMAS - SENSOR WITH CHANNELS
// =============================================================================

type MappedChannelsForSensorWriteSingle<TSensorConfig extends TULIP3SensorConfig> = {
  [K in keyof TSensorConfig as K extends `channel${number}` ? K : never]:
  TSensorConfig[K] extends TULIP3ChannelConfig
    ? v.OptionalSchema<ReturnType<typeof createChannelWriteSingleSchema<TSensorConfig[K]>>, undefined>
    : never
}

type MappedChannelsForSensorWriteMultiple<TSensorConfig extends TULIP3SensorConfig> = {
  [K in keyof TSensorConfig as K extends `channel${number}` ? K : never]:
  TSensorConfig[K] extends TULIP3ChannelConfig
    ? v.OptionalSchema<ReturnType<typeof createChannelWriteMultipleSchema<TSensorConfig[K]>>, undefined>
    : never
}

/**
 * Creates a validation schema for a sensor's write input (Single variant).
 * Allows only configuration at sensor level (no identification - read-only).
 * Channels use Single variant (identification OR configuration per channel).
 *
 * @param sensorConfig - Sensor configuration with channels
 * @returns A Valibot object schema with configuration and channels
 */
function createSensorWriteSingleSchema<const TConfig extends TULIP3SensorConfig>(sensorConfig: TConfig) {
  const channelsObj = Object.entries(sensorConfig).reduce((acc, [channelKey, channelConfig]) => {
    if (!channelKey.startsWith('channel'))
      return acc

    const channel = channelConfig as TULIP3ChannelConfig
    acc[channelKey as keyof typeof acc] = v.optional(createChannelWriteSingleSchema(channel)) as any

    return acc
  }, {} as MappedChannelsForSensorWriteSingle<TConfig>)

  return v.object({
    configuration: createSensorConfigurationWriteSchema(sensorConfig),
    ...channelsObj,
  } as const)
}

/**
 * Creates a validation schema for a sensor's write input (Multiple variant).
 * Allows configuration at sensor level (no identification - read-only).
 * Channels use Multiple variant (both identification and configuration per channel).
 *
 * @param sensorConfig - Sensor configuration with channels
 * @returns A Valibot object schema with optional configuration and channels
 */
function createSensorWriteMultipleSchema<const TConfig extends TULIP3SensorConfig>(sensorConfig: TConfig) {
  const channelsObj = Object.entries(sensorConfig).reduce((acc, [channelKey, channelConfig]) => {
    if (!channelKey.startsWith('channel'))
      return acc

    const channel = channelConfig as TULIP3ChannelConfig
    acc[channelKey as keyof typeof acc] = v.optional(createChannelWriteMultipleSchema(channel)) as any

    return acc
  }, {} as MappedChannelsForSensorWriteMultiple<TConfig>)

  return v.object({
    configuration: v.optional(createSensorConfigurationWriteSchema(sensorConfig)),
    ...channelsObj,
  } as const)
}

// =============================================================================
// TOP-LEVEL DATA SCHEMA
// =============================================================================

type MappedSensorsWriteInputSingle<TDeviceConfig extends TULIP3DeviceConfig> = {
  [K in keyof TDeviceConfig as K extends `sensor${number}` ? K : never]:
  TDeviceConfig[K] extends TULIP3SensorConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorWriteSingleSchema<TDeviceConfig[K]>>, undefined>
    : never
}

type MappedSensorsWriteInputMultiple<TDeviceConfig extends TULIP3DeviceConfig> = {
  [K in keyof TDeviceConfig as K extends `sensor${number}` ? K : never]:
  TDeviceConfig[K] extends TULIP3SensorConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorWriteMultipleSchema<TDeviceConfig[K]>>, undefined>
    : never
}

/**
 * Creates the main write input data schema for TULIP3 downlink (Single variant).
 * Allows only configuration at CM level (no identification - read-only).
 * Sensors follow Single variant pattern.
 * Used by encode() for single command encoding.
 *
 * @param config - Device configuration with all sensors and channels
 * @returns A Valibot schema for single-command write input structure
 */
function createWriteInputDataSingleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const sensorsObj = Object.entries(config).reduce((acc, [sensorKey, sensorConfig]) => {
    if (!sensorKey.startsWith('sensor'))
      return acc

    acc[sensorKey as keyof typeof acc] = v.optional(createSensorWriteSingleSchema(sensorConfig as TULIP3SensorConfig) as any) as any
    return acc
  }, {} as MappedSensorsWriteInputSingle<TConfig>)

  return v.object({
    communicationModule: v.optional(v.object({
      configuration: createCommunicationModuleConfigurationWriteSchema(config),
    })),
    ...sensorsObj,
  } as const)
}

/**
 * Creates the main write input data schema for TULIP3 downlink (Multiple variant).
 * Allows configuration at CM level (no identification - read-only).
 * Sensors follow Multiple variant pattern.
 * Used by encodeMultiple() for batch command encoding.
 *
 * @param config - Device configuration with all sensors and channels
 * @returns A Valibot schema for multiple-command write input structure
 */
function createWriteInputDataMultipleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const sensorsObj = Object.entries(config).reduce((acc, [sensorKey, sensorConfig]) => {
    if (!sensorKey.startsWith('sensor'))
      return acc

    acc[sensorKey as keyof typeof acc] = v.optional(createSensorWriteMultipleSchema(sensorConfig as TULIP3SensorConfig) as any) as any
    return acc
  }, {} as MappedSensorsWriteInputMultiple<TConfig>)

  return v.object({
    communicationModule: v.optional(v.object({
      configuration: v.optional(createCommunicationModuleConfigurationWriteSchema(config)),
    })),
    ...sensorsObj,
  } as const)
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Write input data type for single command encoding.
 * Includes all writable registers per TULIP3 spec:
 * - CM: Configuration only (all identification registers read-only)
 * - Sensor: Configuration only (all identification registers read-only)
 * - Channel: Identification (unit, offset, gain) + Configuration
 * Used by encode().
 */
export type WriteSingleInputData<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createWriteInputDataSingleSchema<TConfig>>>

/**
 * Write input data type for multiple command encoding.
 * Includes all writable registers per TULIP3 spec:
 * - CM: Configuration only (all identification registers read-only)
 * - Sensor: Configuration only (all identification registers read-only)
 * - Channel: Identification (unit, offset, gain) + Configuration
 * Used by encodeMultiple().
 */
export type WriteMultipleInputData<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createWriteInputDataMultipleSchema<TConfig>>>

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createWriteInputDataMultipleSchema,
  createWriteInputDataSingleSchema,
}
