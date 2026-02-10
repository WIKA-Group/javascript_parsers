/* eslint-disable ts/explicit-function-return-type */
import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../../codecs/tulip3/profile'
import * as v from 'valibot'
import { createGenericUplinkOutputSchema, createWriteResponseDataSchema } from './_shared'
import { createProcessAlarmEnabledSchema, createProtocolDataTypeSchema, createSamplingChannelsSchema } from './schemaUtils'

// =============================================================================
// CONFIGURATION SCHEMAS
// =============================================================================

// Lookup type for communication module configuration fields - avoids deep conditional chains
interface CommunicationModuleConfigurationFieldSchemas {
  measuringPeriodAlarmOff: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  measuringPeriodAlarmOn: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  transmissionRateAlarmOff: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  transmissionRateAlarmOn: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  overVoltageThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  underVoltageThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  overTemperatureCmChip: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  underTemperatureCmChip: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  downlinkAnswerTimeout: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  fetchAdditionalDownlinkTimeInterval: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  enableBleAdvertising: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
}

type EnabledCommunicationModuleConfigurationFields<TConfig extends TULIP3DeviceConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters'] as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true ? K : never]: K extends keyof CommunicationModuleConfigurationFieldSchemas ? CommunicationModuleConfigurationFieldSchemas[K] : never
}

/**
 * Creates a validation schema for communication module configuration data.
 * Contains configuration parameters for the communication module.
 * Only includes fields that are enabled in the device configuration flags.
 *
 * @param config - Device sensor config object (keys are sensor names)
 * @returns A Valibot object schema for communication module configuration
 * @template TConfig - Type-safe device configuration
 * @example
 * ```typescript
 * const config = {
 *   sensor1: {},
 *   registerConfig: {
 *     tulip3ConfigurationRegisters: {
 *       measuringPeriodAlarmOff: true,
 *       transmissionRateAlarmOff: true
 *     }
 *   }
 * }
 * const schema = createCommunicationModuleConfigurationSchema(config)
 * const result = v.parse(schema, {
 *   measuringPeriodAlarmOff: 3600000,
 *   transmissionRateAlarmOff: 60
 * })
 * ```
 */
function createCommunicationModuleConfigurationSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  if (flags.measuringPeriodAlarmOff)
    schema.measuringPeriodAlarmOff = v.optional(v.number())
  if (flags.measuringPeriodAlarmOn)
    schema.measuringPeriodAlarmOn = v.optional(v.number())
  if (flags.transmissionRateAlarmOff)
    schema.transmissionRateAlarmOff = v.optional(v.number())
  if (flags.transmissionRateAlarmOn)
    schema.transmissionRateAlarmOn = v.optional(v.number())
  if (flags.overVoltageThreshold)
    schema.overVoltageThreshold = v.optional(v.number())
  if (flags.underVoltageThreshold)
    schema.underVoltageThreshold = v.optional(v.number())
  if (flags.overTemperatureCmChip)
    schema.overTemperatureCmChip = v.optional(v.number())
  if (flags.underTemperatureCmChip)
    schema.underTemperatureCmChip = v.optional(v.number())
  if (flags.downlinkAnswerTimeout)
    schema.downlinkAnswerTimeout = v.optional(v.number())
  if (flags.fetchAdditionalDownlinkTimeInterval)
    schema.fetchAdditionalDownlinkTimeInterval = v.optional(v.number())
  if (flags.enableBleAdvertising)
    schema.enableBleAdvertising = v.optional(v.boolean())

  return v.object(schema as EnabledCommunicationModuleConfigurationFields<TConfig>)
}

// Lookup type for sensor configuration fields - avoids deep conditional chains
interface SensorConfigurationFieldSchemas<TConfig extends TULIP3SensorConfig> {
  samplingChannels: v.OptionalSchema<ReturnType<typeof createSamplingChannelsSchema<TConfig>>, undefined>
  bootTime: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  communicationTimeout: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  communicationRetryCount: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
}

type EnabledSensorConfigurationFields<TConfig extends TULIP3SensorConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters'] as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true ? K : never]: K extends keyof SensorConfigurationFieldSchemas<TConfig> ? SensorConfigurationFieldSchemas<TConfig>[K] : never
}

/**
 * Creates a validation schema for sensor configuration data.
 * Contains configuration parameters for individual sensors.
 * Only includes fields that are enabled in the sensor configuration flags.
 *
 * @param config - Sensor channel config object (keys are channel names)
 * @returns A Valibot object schema for sensor configuration
 * @template TConfig - Type-safe sensor configuration
 * @example
 * ```typescript
 * const schema = createSensorConfigurationSchema(config)
 * const result = v.parse(schema, {
 *   samplingChannels: { channel1: true, channel2: true },
 *   bootTime: 5000,
 *   communicationTimeout: 30000
 * })
 * ```
 */
function createSensorConfigurationSchema<const TConfig extends TULIP3SensorConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  if (flags.samplingChannels)
    schema.samplingChannels = v.optional(createSamplingChannelsSchema(config))
  if (flags.bootTime)
    schema.bootTime = v.optional(v.number())
  if (flags.communicationTimeout)
    schema.communicationTimeout = v.optional(v.number())
  if (flags.communicationRetryCount)
    schema.communicationRetryCount = v.optional(v.number())

  return v.object(schema as EnabledSensorConfigurationFields<TConfig>)
}

// Lookup type for channel configuration fields - avoids deep conditional chains
interface ChannelConfigurationFieldSchemas<TChannelName extends string, TConfig extends TULIP3ChannelConfig> {
  protocolDataType: v.OptionalSchema<ReturnType<typeof createProtocolDataTypeSchema<TConfig>>, undefined>
  processAlarmEnabled: v.OptionalSchema<ReturnType<typeof createProcessAlarmEnabledSchema>, undefined>
  processAlarmDeadBand: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  lowThresholdAlarmValue: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  highThresholdAlarmValue: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  fallingSlopeAlarmValue: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  risingSlopeAlarmValue: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  lowThresholdWithDelayAlarmValue: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  lowThresholdWithDelayAlarmDelay: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  highThresholdWithDelayAlarmValue: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  highThresholdWithDelayAlarmDelay: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  channelName: v.LiteralSchema<TChannelName, undefined>
}

type EnabledChannelConfigurationFields<TConfig extends TULIP3ChannelConfig, TChannelName extends string> = {
  [K in keyof TConfig['registerConfig']['tulip3ConfigurationRegisters'] as TConfig['registerConfig']['tulip3ConfigurationRegisters'][K] extends true ? K : never]: K extends keyof ChannelConfigurationFieldSchemas<TChannelName, TConfig> ? ChannelConfigurationFieldSchemas<TChannelName, TConfig>[K] : never
} & { channelName: v.LiteralSchema<TChannelName, undefined> }

/**
 * Creates a validation schema for channel configuration data.
 * Defines the configuration parameters for a sensor channel.
 * Only includes fields that are enabled in the channel configuration flags.
 *
 * @param name - Channel name literal
 * @param config - Channel configuration with register flags
 * @returns A Valibot object schema for channel configuration
 * @template TChannelName - Type-safe channel name literal
 * @template TConfig - Type-safe channel configuration
 * @example
 * ```typescript
 * const schema = createChannelConfigurationSchema('channel1', config)
 * const result = v.parse(schema, {
 *   protocolDataType: "float - IEEE754",
 *   processAlarmEnabled: {
 *     lowThreshold: true,
 *     highThreshold: true
 *   },
 *   lowThresholdAlarmValue: -10.0,
 *   highThresholdAlarmValue: 50.0
 * })
 * ```
 */
function createChannelConfigurationSchema<TChannelName extends string, const TConfig extends TULIP3ChannelConfig>(name: TChannelName, config: TConfig) {
  const flags = config.registerConfig.tulip3ConfigurationRegisters
  const schema: Record<string, any> = {}

  if (flags.protocolDataType)
    schema.protocolDataType = v.optional(createProtocolDataTypeSchema(config))
  if (flags.processAlarmEnabled)
    schema.processAlarmEnabled = v.optional(createProcessAlarmEnabledSchema())
  if (flags.processAlarmDeadBand)
    schema.processAlarmDeadBand = v.optional(v.number())
  if (flags.lowThresholdAlarmValue)
    schema.lowThresholdAlarmValue = v.optional(v.number())
  if (flags.highThresholdAlarmValue)
    schema.highThresholdAlarmValue = v.optional(v.number())
  if (flags.fallingSlopeAlarmValue)
    schema.fallingSlopeAlarmValue = v.optional(v.number())
  if (flags.risingSlopeAlarmValue)
    schema.risingSlopeAlarmValue = v.optional(v.number())
  if (flags.lowThresholdWithDelayAlarmValue)
    schema.lowThresholdWithDelayAlarmValue = v.optional(v.number())
  if (flags.lowThresholdWithDelayAlarmDelay)
    schema.lowThresholdWithDelayAlarmDelay = v.optional(v.number())
  if (flags.highThresholdWithDelayAlarmValue)
    schema.highThresholdWithDelayAlarmValue = v.optional(v.number())
  if (flags.highThresholdWithDelayAlarmDelay)
    schema.highThresholdWithDelayAlarmDelay = v.optional(v.number())
  schema.channelName = v.literal(name) // Channel name always present

  return v.object(schema as EnabledChannelConfigurationFields<TConfig, TChannelName>)
}

/**
 * Creates a validation schema for a sensor with its associated channel configurations.
 * Combines sensor configuration with individual channel configurations.
 *
 * @param sensorChannelConfig - Configuration object defining which channels are available for this sensor
 * @returns A Valibot object schema combining sensor configuration and channel configurations
 * @template TTULIP3SensorConfig - Type-safe sensor channel configuration
 * @example
 * ```typescript
 * const config = { channel1: true, channel2: true }
 * const schema = createSensorWithChannelConfigurationsSchema(config)
 * const result = v.parse(schema, {
 *   configuration: {
 *     samplingChannels: { channel1: true, channel2: true },
 *     bootTime: 5000
 *   },
 *   channel1: {
 *     protocolDataType: "float - IEEE754",
 *     lowThresholdAlarmValue: -10.0
 *   },
 *   channel2: {
 *     protocolDataType: "float - IEEE754",
 *     highThresholdAlarmValue: 50.0
 *   }
 * })
 * ```
 */
function createSensorWithChannelConfigurationsSchema<const TTULIP3SensorConfig extends TULIP3SensorConfig>(sensorChannelConfig: TTULIP3SensorConfig) {
  const configurationObject = {
    configuration: v.optional(createSensorConfigurationSchema(sensorChannelConfig)),
  } as const

  type ChannelsObject = {
    [ChannelKey in keyof TTULIP3SensorConfig as ChannelKey extends `channel${number}` ? ChannelKey : never]:
    TTULIP3SensorConfig[ChannelKey] extends TULIP3ChannelConfig
      ? v.OptionalSchema<
        v.ObjectSchema<EnabledChannelConfigurationFields<TTULIP3SensorConfig[ChannelKey], TTULIP3SensorConfig[ChannelKey]['channelName']>, undefined>,
        undefined
      >
      : never
  }

  const channelsObj = Object.entries(sensorChannelConfig).reduce((acc, [channelKey, channel]: [string, TULIP3ChannelConfig]) => {
    // skip non-channel entries
    if (!channelKey.startsWith('channel')) {
      return acc
    }
    acc[channelKey as keyof ChannelsObject] = v.optional(createChannelConfigurationSchema(channel.channelName, channel)) as any
    return acc
  }, {} as ChannelsObject)

  return v.object({
    ...configurationObject,
    ...channelsObj,
  } as const)
}

// =============================================================================
// UPLINK MESSAGE SCHEMAS
// =============================================================================

type MappedSensorChannelConfig<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = {
  [K in keyof TTULIP3DeviceConfig as K extends `sensor${number}` ? K : never]: TTULIP3DeviceConfig[K] extends TULIP3SensorConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorWithChannelConfigurationsSchema<TTULIP3DeviceConfig[K]>>, undefined> : never
}

function createConfigurationReadRegisterDataSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  const communicationModuleObj = {
    communicationModule: v.optional(createCommunicationModuleConfigurationSchema(config)),
  }

  const sensorsObj = Object.entries(config).reduce((acc, [sensorKey, channelConfig]) => {
    // skip non-sensor entries
    if (!sensorKey.startsWith('sensor')) {
      return acc
    }
    // @ts-expect-error - wont bother to fix
    acc[sensorKey as keyof MappedSensorChannelConfig<TTULIP3DeviceConfig>] = v.optional(createSensorWithChannelConfigurationsSchema(channelConfig))
    return acc
  }, {} as MappedSensorChannelConfig<TTULIP3DeviceConfig>)

  return v.object({
    ...communicationModuleObj,
    ...sensorsObj,
  })
}

/**
 * Creates a validation schema for configuration message uplink output (read response).
 * This is the main schema creator for TULIP3 configuration read messages.
 *
 * @param config - Configuration object defining sensor-to-channel mappings
 * @returns A Valibot object schema for configuration message uplink output
 * @template TTULIP3DeviceConfig - Type-safe sensor channel configuration
 * @example
 * ```typescript
 * const config = {
 *   sensor1: { channel1: {}, channel2: {} },
 *   sensor2: { channel1: {}, channel2: {}, channel3: {} }
 * }
 * const schema = createConfigurationReadRegistersResponseUplinkOutputSchema(config)
 *
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x15,
 *     messageSubType: 0x01,
 *     configuration: {
 *       communicationModule: {
 *         measuringPeriodAlarmOff: 3600000,
 *         transmissionRateAlarmOff: 60
 *       },
 *       sensor1: {
 *         configuration: { samplingChannels: { channel1: true } },
 *         channel1: { protocolDataType: "float - IEEE754" }
 *       }
 *     }
 *   },
 *   warnings: ["Optional warning message"]
 * })
 * ```
 */
function createConfigurationReadRegistersResponseUplinkOutputSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  return createGenericUplinkOutputSchema({
    messageType: [0x15], // Configuration message type
    messageSubType: [0x01, 0x02], // Configuration message subtypes (read responses)
    extension: {
      configuration: createConfigurationReadRegisterDataSchema(config),
    },
  })
}

/**
 * Creates a validation schema for configuration write response uplink output.
 * This schema validates the response from configuration write operations.
 *
 * @returns A Valibot object schema for configuration write response uplink output
 * @example
 * ```typescript
 * const schema = createConfigurationWriteRegistersResponseUplinkOutputSchema()
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x15,
 *     messageSubType: 0x04,
 *     configuration: {
 *       revisionCounter: 123,
 *       totalWrongFrames: 0,
 *       frames: [
 *         { frameNumber: 1, status: "Configuration received and applied with success" }
 *       ]
 *     }
 *   }
 * })
 * ```
 */
function createConfigurationWriteRegistersResponseUplinkOutputSchema() {
  return createGenericUplinkOutputSchema({
    messageType: [0x15], // Configuration message type
    messageSubType: [0x03], // Configuration write response subtype
    extension: {
      configuration: createWriteResponseDataSchema(),
    },
  })
}

export type ConfigurationReadRegisterData<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createConfigurationReadRegisterDataSchema<TTULIP3DeviceConfig>>>
export type ConfigurationReadRegistersResponseUplinkOutput<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createConfigurationReadRegistersResponseUplinkOutputSchema<TTULIP3DeviceConfig>>>
export type ConfigurationWriteRegisterData = v.InferOutput<ReturnType<typeof createWriteResponseDataSchema>>
export type ConfigurationWriteRegistersResponseUplinkOutput = v.InferOutput<ReturnType<typeof createConfigurationWriteRegistersResponseUplinkOutputSchema>>

export {
  createConfigurationReadRegistersResponseUplinkOutputSchema,
  createConfigurationWriteRegistersResponseUplinkOutputSchema,
}
