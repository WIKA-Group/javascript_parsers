import type { TULIP3ChannelConfig, TULIP3SensorConfig } from '../../codecs/tulip3/profile'
import * as v from 'valibot'

/**
 * Creates a validation schema for protocol data types specific to a channel.
 * Uses the channel's measurementTypes to enforce only valid types for that channel.
 * This schema is shared across all TULIP3 schemas (uplink/downlink, read/write).
 *
 * @param config - Channel configuration with measurementTypes
 * @returns A Valibot picklist schema that validates against the channel's supported protocol data types
 * @example
 * ```typescript
 * const schema = createProtocolDataTypeSchema(channelConfig)
 * const result = v.parse(schema, "uint16 - TULIP scale 2500 - 12500")
 * ```
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function createProtocolDataTypeSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  return v.picklist(config.measurementTypes)
}

/**
 * Creates a validation schema for process alarm enabled flags.
 * This schema is shared across all TULIP3 schemas (uplink/downlink, read/write).
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
// eslint-disable-next-line ts/explicit-function-return-type
export function createProcessAlarmEnabledSchema() {
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

/**
 * Creates a validation schema for sampling channels configuration.
 * Generates channel properties in the format "channelN" where N is the channel number.
 * This schema is shared across all TULIP3 schemas (uplink/downlink, read/write).
 *
 * @param config - Configuration object for the sensor channels
 * @returns A Valibot object schema with boolean flags for each channel
 * @template TConfig - Type-safe sensor configuration
 * @example
 * ```typescript
 * const schema = createSamplingChannelsSchema(sensorConfig)
 * const result = v.parse(schema, { channel1: true, channel2: true, channel3: false })
 * ```
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function createSamplingChannelsSchema<const TConfig extends TULIP3SensorConfig>(config: TConfig) {
  type SampledChannels = {
    [K in keyof TConfig as K extends `channel${number}` ? K : never]: v.BooleanSchema<undefined>
  }

  const configuredChannels = Object.keys(config).filter(key => key.startsWith('channel'))

  const samplingChannels = configuredChannels.reduce((acc, channel) => {
    acc[channel as keyof typeof acc] = v.boolean()
    return acc
  }, {} as SampledChannels)

  return v.object(samplingChannels)
}

/**
 * Creates a validation schema for measurand names specific to a channel.
 * Uses the channel's availableMeasurands strings directly.
 * This schema is used for the 'measurand' field (string value) in uplink schemas and downlink write schemas.
 *
 * @param config - Channel configuration with availableMeasurands
 * @returns A Valibot picklist schema that validates against the channel's supported measurand names
 * @example
 * ```typescript
 * const schema = createChannelMeasurandNameSchema(channelConfig)
 * const result = v.parse(schema, "Temperature") // Valid if 'Temperature' is in availableMeasurands
 * ```
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function createChannelMeasurandNameSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  return v.picklist(config.availableMeasurands)
}

/**
 * Creates a validation schema for unit names specific to a channel.
 * Uses the channel's availableUnits strings directly.
 * This schema is used for the 'unit' field (string value) in uplink schemas and downlink write schemas.
 *
 * @param config - Channel configuration with availableUnits
 * @returns A Valibot picklist schema that validates against the channel's supported unit names
 * @example
 * ```typescript
 * const schema = createChannelUnitNameSchema(channelConfig)
 * const result = v.parse(schema, "bar") // Valid if 'bar' is in availableUnits
 * ```
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function createChannelUnitNameSchema<const TConfig extends TULIP3ChannelConfig>(config: TConfig) {
  return v.picklist(config.availableUnits)
}
