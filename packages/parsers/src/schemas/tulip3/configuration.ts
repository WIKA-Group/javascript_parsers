/* eslint-disable ts/explicit-function-return-type */
import type { TULIP3ChannelConfig, TULIP3DeviceSensorConfig, TULIP3SensorChannelConfig } from '../../codecs/tulip3/profile'
import * as v from 'valibot'
import { protocolDataTypeLookup } from '../../codecs/tulip3/lookups'
import { createGenericUplinkOutputSchema, createWriteResponseDataSchema } from './index'

// =============================================================================
// BASE TYPE SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for protocol data types.
 *
 * @returns A Valibot picklist schema that validates against supported protocol data types
 * @example
 * ```typescript
 * const schema = createProtocolDataTypeSchema()
 * const result = v.parse(schema, "float - IEEE754")
 * ```
 */
function createProtocolDataTypeSchema() {
  return v.picklist(Object.values(protocolDataTypeLookup) as (typeof protocolDataTypeLookup[keyof typeof protocolDataTypeLookup])[])
}

// =============================================================================
// SENSOR AND CHANNEL SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for sampling channels configuration.
 * Generates channel properties in the format "channelN" where N is the channel number.
 *
 * @param config - Configuration object for the sensor channels
 * @returns A Valibot object schema with optional boolean flags for each channel
 * @template TChannels - Type-safe array of channel numbers
 * @example
 * ```typescript
 * const schema = createSamplingChannelsSchema([1, 2, 3])
 * const result = v.parse(schema, { channel1: true, channel2: true, channel3: false })
 * ```
 */
function createSamplingChannelsSchema<const TConfig extends TULIP3SensorChannelConfig>(config: TConfig) {
  const allChannels = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

  type SampledChannels = {
    [K in (typeof allChannels)[number]]: keyof TConfig extends K ? v.BooleanSchema<undefined> : v.LiteralSchema<false, undefined>
  }

  const samplingChannels = allChannels.reduce((acc, channel) => {
    acc[channel] = (channel in config ? v.boolean() : v.literal(false)) as any
    return acc
  }, {} as SampledChannels)

  return v.object(samplingChannels)
}

/**
 * Creates a validation schema for process alarm enabled flags.
 *
 * @returns A Valibot object schema with boolean flags for each alarm type
 * @example
 * ```typescript
 * const schema = createProcessAlarmEnabledSchema()
 * const result = v.parse(schema, {
 *   lowThreshold: true,
 *   highThreshold: false,
 *   fallingSlope: true
 * })
 * ```
 */
function createProcessAlarmEnabledSchema() {
  return v.object({
    lowThreshold: v.optional(v.boolean()), // Bit 7
    highThreshold: v.optional(v.boolean()), // Bit 6
    fallingSlope: v.optional(v.boolean()), // Bit 5
    risingSlope: v.optional(v.boolean()), // Bit 4
    lowThresholdWithDelay: v.optional(v.boolean()), // Bit 3
    highThresholdWithDelay: v.optional(v.boolean()), // Bit 2
    // Bit 1 and 0 are RFU (Reserved for Future Use)
  })
}

// =============================================================================
// CONFIGURATION SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for communication module configuration data.
 * Contains configuration parameters for the communication module.
 *
 * @returns A Valibot object schema for communication module configuration
 * @example
 * ```typescript
 * const schema = createCommunicationModuleConfigurationSchema()
 * const result = v.parse(schema, {
 *   measuringPeriodAlarmOff: 3600000, // 1 hour in milliseconds
 *   transmissionRateAlarmOff: 60,
 *   overVoltageThreshold: 3600
 * })
 * ```
 */
function createCommunicationModuleConfigurationSchema() {
  return v.object({
    measuringPeriodAlarmOff: v.optional(v.number()), // uint32, in milliseconds
    measuringPeriodAlarmOn: v.optional(v.number()), // uint32, in milliseconds
    transmissionRateAlarmOff: v.optional(v.number()), // uint16, in seconds
    transmissionRateAlarmOn: v.optional(v.number()), // uint16, in seconds
    overVoltageThreshold: v.optional(v.number()), // uint16, in mV
    underVoltageThreshold: v.optional(v.number()), // uint16, in mV
    overTemperatureCmChip: v.optional(v.number()), // int8, in °C
    underTemperatureCmChip: v.optional(v.number()), // int8, in °C
    downlinkAnswerTimeout: v.optional(v.number()), // uint8, in seconds
    fetchAdditionalDownlinkTimeInterval: v.optional(v.number()), // uint8, in seconds
    enableBleAdvertising: v.optional(v.boolean()), // bool
  })
}

/**
 * Creates a validation schema for sensor configuration data.
 * Contains configuration parameters for individual sensors.
 *
 * @param config - Configuration object for the sensor channels
 * @returns A Valibot object schema for sensor configuration
 * @template TChannels - Type-safe array of channel numbers
 * @example
 * ```typescript
 * const schema = createSensorConfigurationSchema([1, 2, 3])
 * const result = v.parse(schema, {
 *   samplingChannels: { channel1: true, channel2: true },
 *   bootTime: 5000,
 *   communicationTimeout: 30000
 * })
 * ```
 */
function createSensorConfigurationSchema<const TConfig extends TULIP3SensorChannelConfig>(config: TConfig) {
  return v.object({
    samplingChannels: v.optional(createSamplingChannelsSchema(config)), // bit flags for sampling channels
    bootTime: v.optional(v.number()), // uint16, in milliseconds
    communicationTimeout: v.optional(v.number()), // uint16, in milliseconds
    communicationRetryCount: v.optional(v.number()), // uint8, number of retries
  })
}

/**
 * Creates a validation schema for channel configuration data.
 * Defines the configuration parameters for a sensor channel.
 *
 * @returns A Valibot object schema for channel configuration
 * @example
 * ```typescript
 * const schema = createChannelConfigurationSchema()
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
function createChannelConfigurationSchema<TName extends string>(name: TName) {
  return v.object({
    channelName: v.literal(name), // channel name
    protocolDataType: v.optional(createProtocolDataTypeSchema()), // protocol data type enum
    processAlarmEnabled: v.optional(createProcessAlarmEnabledSchema()), // bit flags for alarm types
    processAlarmDeadBand: v.optional(v.number()), // float, in channel physical unit
    lowThresholdAlarmValue: v.optional(v.number()), // float, in channel physical unit
    highThresholdAlarmValue: v.optional(v.number()), // float, in channel physical unit
    fallingSlopeAlarmValue: v.optional(v.number()), // float, in channel physical unit
    risingSlopeAlarmValue: v.optional(v.number()), // float, in channel physical unit
    lowThresholdWithDelayAlarmValue: v.optional(v.number()), // float, in channel physical unit
    lowThresholdWithDelayAlarmDelay: v.optional(v.number()), // uint16, in seconds
    highThresholdWithDelayAlarmValue: v.optional(v.number()), // float, in channel physical unit
    highThresholdWithDelayAlarmDelay: v.optional(v.number()), // uint16, in seconds
  })
}

/**
 * Creates a validation schema for a sensor with its associated channel configurations.
 * Combines sensor configuration with individual channel configurations.
 *
 * @param sensorChannelConfig - Configuration object defining which channels are available for this sensor
 * @returns A Valibot object schema combining sensor configuration and channel configurations
 * @template TTULIP3SensorChannelConfig - Type-safe sensor channel configuration
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
function createSensorWithChannelConfigurationsSchema<const TTULIP3SensorChannelConfig extends TULIP3SensorChannelConfig>(sensorChannelConfig: TTULIP3SensorChannelConfig) {
  const sensorWithChannelConfigurationsObject = {
    configuration: v.optional(createSensorConfigurationSchema(sensorChannelConfig)),
  } as const

  type MappedChannelsObject = {
    [K in keyof TTULIP3SensorChannelConfig]: TTULIP3SensorChannelConfig[K] extends { channelName: infer TName extends string }
      ? v.OptionalSchema<ReturnType<typeof createChannelConfigurationSchema<TName>>, undefined> : never
  }

  const channelsObj = Object.entries(sensorChannelConfig).reduce((acc, [channelKey, channel]: [string, TULIP3ChannelConfig]) => {
    acc[channelKey as keyof TTULIP3SensorChannelConfig] = v.optional(createChannelConfigurationSchema(channel.channelName)) as any
    return acc
  }, {} as MappedChannelsObject)

  return v.object({
    ...sensorWithChannelConfigurationsObject,
    ...channelsObj,
  } as const)
}

// =============================================================================
// UPLINK MESSAGE SCHEMAS
// =============================================================================

type MappedSensorChannelConfig<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = {
  [K in keyof TTULIP3DeviceSensorConfig]: TTULIP3DeviceSensorConfig[K] extends TULIP3SensorChannelConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorWithChannelConfigurationsSchema<TTULIP3DeviceSensorConfig[K]>>, undefined> : never
}

function createConfigurationReadRegisterDataSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(config: TTULIP3DeviceSensorConfig) {
  const obj = Object.entries(config).reduce((acc, [sensorKey, channelConfig]) => {
    // @ts-expect-error - wont bother to fix
    acc[sensorKey as keyof MappedSensorChannelConfig<TTULIP3DeviceSensorConfig>] = v.optional(createSensorWithChannelConfigurationsSchema(channelConfig))
    return acc
  }, {
    communicationModule: v.optional(createCommunicationModuleConfigurationSchema()),
  } as (MappedSensorChannelConfig<TTULIP3DeviceSensorConfig> & { communicationModule: v.OptionalSchema<ReturnType<typeof createCommunicationModuleConfigurationSchema>, undefined> }))

  return v.object(obj)
}

/**
 * Creates a validation schema for configuration message uplink output (read response).
 * This is the main schema creator for TULIP3 configuration read messages.
 *
 * @param config - Configuration object defining sensor-to-channel mappings
 * @returns A Valibot object schema for configuration message uplink output
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor channel configuration
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
function createConfigurationReadRegistersResponseUplinkOutputSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(config: TTULIP3DeviceSensorConfig) {
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

export type ConfigurationReadRegisterData<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = v.InferOutput<ReturnType<typeof createConfigurationReadRegisterDataSchema<TTULIP3DeviceSensorConfig>>>
export type ConfigurationReadRegistersResponseUplinkOutput<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = v.InferOutput<ReturnType<typeof createConfigurationReadRegistersResponseUplinkOutputSchema<TTULIP3DeviceSensorConfig>>>
export type ConfigurationWriteRegisterData = v.InferOutput<ReturnType<typeof createWriteResponseDataSchema>>
export type ConfigurationWriteRegistersResponseUplinkOutput = v.InferOutput<ReturnType<typeof createConfigurationWriteRegistersResponseUplinkOutputSchema>>

export {
  createConfigurationReadRegistersResponseUplinkOutputSchema,
  createConfigurationWriteRegistersResponseUplinkOutputSchema,
}
