import type { TULIP3ChannelConfig, TULIP3DeviceSensorConfig, TULIP3SensorChannelConfig } from '../../codecs/tulip3/profile'
/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import {
  measurandLookup,
  productSubIdLookup,
  unitsLookup,
} from '../../codecs/tulip3/lookups'
import { createGenericUplinkOutputSchema, createWriteResponseDataSchema } from './index'

// =============================================================================
// BASE TYPE SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for product sub-IDs.
 *
 * @returns A Valibot picklist schema that validates against known product sub-IDs
 * @example
 * ```typescript
 * const schema = createProductSubIdSchema()
 * const result = v.parse(schema, "PEW-1000")
 * ```
 */
export function createProductSubIdSchema() {
  return v.picklist(Object.values(productSubIdLookup) as (typeof productSubIdLookup[keyof typeof productSubIdLookup])[])
}

// The following functions are currently not used, as we had to get away from the lookup-based approach
// due to issues with the lookups. If needed in the future, these can be re-enabled and updated.
/*
// Creates a validation schema for LoRaWAN channel plans.
function _createLoRaWANChannelPlanSchema() {
  return v.picklist(Object.values(LoRaWANChannelPlanLookup) as (typeof LoRaWANChannelPlanLookup[keyof typeof LoRaWANChannelPlanLookup])[])
}

// Creates a validation schema for Mioty channel plans.
function _createMiotyChannelPlanSchema() {
  return v.picklist(Object.values(MiotyChannelPlanLookup) as (typeof MiotyChannelPlanLookup[keyof typeof MiotyChannelPlanLookup])[])
}
*/

/**
 * Creates a unified validation schema for channel plans.
 *
 * NOTE: The lookup-based approach for LoRaWAN and Mioty channel plans is currently not used
 * due to issues with the lookups. This schema now only allows non-negative integers.
 *
 * @returns A Valibot schema that validates a non-negative integer channel plan
 * @example
 * ```typescript
 * const schema = createChannelPlanSchema()
 * const result = v.parse(schema, 1) // Only non-negative integers are valid
 * ```
 */
export function createChannelPlanSchema() {
  // If subId are set, consider using a union of picklists for LoRaWAN and Mioty channel plans.
  return v.pipe(
    v.number(),
    v.minValue(0),
    v.integer(),
  )
}

/**
 * Creates a validation schema for measurands (physical quantities being measured).
 *
 * @returns A Valibot picklist schema that validates against supported measurands
 * @example
 * ```typescript
 * const schema = createMeasurandSchema()
 * const result = v.parse(schema, "temperature")
 * ```
 */
export function createMeasurandSchema() {
  return v.picklist(Object.values(measurandLookup) as (typeof measurandLookup[keyof typeof measurandLookup])[])
}

/**
 * Creates a validation schema for measurement units.
 *
 * @returns A Valibot picklist schema that validates against supported measurement units
 * @example
 * ```typescript
 * const schema = createUnitSchema()
 * const result = v.parse(schema, "°C")
 * ```
 */
export function createUnitSchema() {
  return v.picklist(Object.values(unitsLookup) as (typeof unitsLookup[keyof typeof unitsLookup])[])
}

// =============================================================================
// SENSOR AND CHANNEL SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for connected sensors configuration based on a config object.
 *
 * @param config - The device sensor config object (keys are sensor names)
 * @returns A Valibot object schema with boolean flags for each possible sensor
 * @example
 * ```typescript
 * const config = { sensor1: {}, sensor2: {} }
 * const schema = createConnectedSensorsSchema(config)
 * const result = v.parse(schema, { sensor1: true, sensor2: false, sensor3: false, sensor4: false })
 * ```
 */
export function createConnectedSensorsSchema<const TConfig extends TULIP3DeviceSensorConfig>(config: TConfig) {
  const allSensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const

  type ExistingSensors = {
    [K in (typeof allSensors)[number]]: keyof TConfig extends K ? v.LiteralSchema<true, undefined> : v.LiteralSchema<false, undefined>
  }

  const connectedSensorObject = allSensors.reduce((acc, sensor) => {
    acc[sensor] = (sensor in config ? v.literal(true) : v.literal(false)) as any
    return acc
  }, {} as ExistingSensors)
  return v.object(connectedSensorObject)
}

/**
 * Creates a validation schema for existing channels configuration based on a config object.
 *
 * @param config - The sensor channel config object (keys are channel names)
 * @returns A Valibot object schema with boolean flags for each possible channel
 * @example
 * ```typescript
 * const config = { channel1: true, channel2: true }
 * const schema = createExistingChannelsSchema(config)
 * const result = v.parse(schema, { channel1: true, channel2: true, channel3: false, channel4: false, channel5: false, channel6: false, channel7: false, channel8: false })
 * ```
 */
export function createExistingChannelsSchema<const TConfig extends TULIP3SensorChannelConfig>(config: TConfig) {
  const allChannels = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

  type ExistingChannels = {
    [K in (typeof allChannels)[number]]: keyof TConfig extends K ? v.LiteralSchema<true, undefined> : v.LiteralSchema<false, undefined>
  }

  const existingChannels = allChannels.reduce((acc, channel) => {
    acc[channel] = (channel in config ? v.literal(true) : v.literal(false)) as any
    return acc
  }, {} as ExistingChannels)

  return v.object(existingChannels)
}

// =============================================================================
// IDENTIFICATION SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for communication module identification data.
 * Contains hardware and software information about the communication module.
 *
 * @param config - Device sensor config object (keys are sensor names)
 * @returns A Valibot object schema for communication module identification
 * @template TSensors - Type-safe array of sensor names
 * @example
 * ```typescript
 * const schema = createCommunicationModuleIdentificationSchema(["sensor1", "sensor2"])
 * const result = v.parse(schema, {
 *   productId: 0x0B, // PEW-1000
 *   firmwareVersion: "1.2.3",
 *   connectedSensors: { sensor1: true }
 * })
 * ```
 */
export function createCommunicationModuleIdentificationSchema<const TConfig extends TULIP3DeviceSensorConfig>(config: TConfig) {
  return v.object({
    productId: v.optional(v.number()), // uint8, 0x0B = PEW-1000
    productSubId: v.optional(createProductSubIdSchema()),
    channelPlan: v.optional(createChannelPlanSchema()),
    connectedSensors: v.optional(createConnectedSensorsSchema(config)),
    firmwareVersion: v.optional(v.string()), // semver format: major.minor.patch
    hardwareVersion: v.optional(v.string()), // semver format: major.minor.patch
    productionDate: v.optional(v.date()), // ISO date format: YYYY-MM-DD
    serialNumberPart1: v.optional(v.string()), // ASCII characters, not null-terminated
    serialNumberPart2: v.optional(v.string()), // ASCII characters, not null-terminated
  })
}

/**
 * Creates a validation schema for sensor identification data.
 * Contains hardware and software information about individual sensors.
 *
 * @param config - Sensor channel config object (keys are channel names)
 * @returns A Valibot object schema for sensor identification
 * @template TChannels - Type-safe array of channel numbers
 * @example
 * ```typescript
 * const schema = createSensorIdentificationSchema([1, 2, 3])
 * const result = v.parse(schema, {
 *   sensorType: 0x0000,
 *   existingChannels: { channel1: true, channel2: true },
 *   firmwareVersion: "2.1.0"
 * })
 * ```
 */
export function createSensorIdentificationSchema<const TConfig extends TULIP3SensorChannelConfig>(config: TConfig) {
  return v.object({
    sensorType: v.optional(v.number()), // uint16, = 0x0000
    existingChannels: v.optional(createExistingChannelsSchema(config)), // bit flags for existing channels
    firmwareVersion: v.optional(v.string()), // semver format: major.minor.patch
    hardwareVersion: v.optional(v.string()), // semver format: major.minor.patch
    productionDate: v.optional(v.date()), // ISO date format: YYYY-MM-DD
    serialNumberPart1: v.optional(v.string()), // ASCII characters, not null-terminated
    serialNumberPart2: v.optional(v.string()), // ASCII characters, not null-terminated
  })
}

/**
 * Creates a validation schema for channel identification and configuration data.
 * Defines the measurement parameters and calibration information for a sensor channel.
 *
 * @returns A Valibot object schema for channel identification
 * @example
 * ```typescript
 * const schema = createChannelIdentificationSchema()
 * const result = v.parse(schema, {
 *   measurand: "temperature",
 *   unit: "°C",
 *   minMeasureRange: -40.0,
 *   maxMeasureRange: 125.0,
 *   accuracy: 500 // 0.5% expressed as 0.001%
 * })
 * ```
 */
export function createChannelIdentificationSchema<TChannelName extends string>(name: TChannelName) {
  return v.object({
    measurand: v.optional(createMeasurandSchema()),
    unit: v.optional(createUnitSchema()),
    minMeasureRange: v.optional(v.number()), // float, in channel physical unit
    maxMeasureRange: v.optional(v.number()), // float, in channel physical unit
    minPhysicalLimit: v.optional(v.number()), // float, in channel physical unit
    maxPhysicalLimit: v.optional(v.number()), // float, in channel physical unit
    accuracy: v.optional(v.number()), // uint16, expressed in 0.001%
    offset: v.optional(v.number()), // float, in channel physical unit
    gain: v.optional(v.number()), // float
    calibrationDate: v.optional(v.date()), // ISO date format: YYYY-MM-DD
    channelName: v.literal(name), // Channel name
  })
}

/**
 * Creates a validation schema for a sensor with its associated channels.
 * Combines sensor identification with individual channel configurations.
 *
 * @param sensorChannelConfig - Configuration object defining which channels are available for this sensor
 * @returns A Valibot object schema combining sensor identification and channel configurations
 * @template TTULIP3SensorChannelConfig - Type-safe sensor channel configuration
 * @example
 * ```typescript
 * const config = { channel1: true, channel2: true }
 * const schema = createSensorWithChannelsSchema(config)
 * const result = v.parse(schema, {
 *   identification: {
 *     sensorType: 0x0001,
 *     firmwareVersion: "1.0.0"
 *   },
 *   channel1: {
 *     measurand: "temperature",
 *     unit: "°C"
 *   },
 *   channel2: {
 *     measurand: "pressure",
 *     unit: "bar"
 *   }
 * })
 * ```
 */
export function createSensorWithChannelsSchema<const TTULIP3SensorChannelConfig extends TULIP3SensorChannelConfig>(sensorChannelConfig: TTULIP3SensorChannelConfig) {
  const channels = Object.keys(sensorChannelConfig) as Extract<(keyof TTULIP3SensorChannelConfig), string>[]

  const identificationObject = {
    identification: v.optional(createSensorIdentificationSchema(sensorChannelConfig)),
  } as const

  type ChannelsObject = {
    [ChannelKey in keyof TTULIP3SensorChannelConfig]:
    TTULIP3SensorChannelConfig[ChannelKey] extends { channelName: infer T extends string }
      ? v.OptionalSchema<
          ReturnType<typeof createChannelIdentificationSchema<T>>,
          undefined
        >
      : never
  }

  const channelsObj = channels.reduce((acc, channel) => {
    const c = sensorChannelConfig[channel as keyof typeof sensorChannelConfig] as TULIP3ChannelConfig
    // @ts-expect-error - wont bother to fix
    acc[channel as keyof TTULIP3SensorChannelConfig] = v.optional(createChannelIdentificationSchema(c.channelName))
    return acc
  }, {} as ChannelsObject)

  return v.object({
    ...identificationObject,
    ...channelsObj,
  } as const)
}

// =============================================================================
// UPLINK MESSAGE SCHEMAS
// =============================================================================

type MappedSensorChannelConfig<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = {
  [K in keyof TTULIP3DeviceSensorConfig]: TTULIP3DeviceSensorConfig[K] extends TULIP3SensorChannelConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorWithChannelsSchema<TTULIP3DeviceSensorConfig[K]>>, undefined> : never
}

function createIdentificationReadRegisterDataSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(config: TTULIP3DeviceSensorConfig) {
  const obj = Object.entries(config).reduce((acc, [sensorKey, channelConfig]) => {
    // @ts-expect-error - wont bother to fix
    acc[sensorKey as keyof MappedSensorChannelConfig<TTULIP3DeviceSensorConfig>] = v.optional(createSensorWithChannelsSchema(channelConfig))
    return acc
  }, {
    communicationModule: v.optional(createCommunicationModuleIdentificationSchema(config)),
  } as (MappedSensorChannelConfig<TTULIP3DeviceSensorConfig> & { communicationModule: v.OptionalSchema<ReturnType<typeof createCommunicationModuleIdentificationSchema<TTULIP3DeviceSensorConfig>>, undefined> }))

  return v.object(obj)
}

/**
 * Creates a validation schema for generic identification message uplink output.
 * This is the main schema creator for TULIP3 identification messages.
 *
 * @param config - Configuration object defining sensor-to-channel mappings
 * @returns A Valibot object schema for identification message uplink output
 * @template TKeepSensorChannelsConfig - Type-safe sensor channel configuration
 * @example
 * ```typescript
 * const config = {
 *   sensor1: [1, 2] as [number, ...number[]],
 *   sensor2: [1, 2, 3] as [number, ...number[]]
 * }
 * const schema = createGenericIdentificationMessageUplinkOutputSchema(config)
 *
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x14,
 *     messageSubType: 0x01,
 *     communicationModule: {
 *       productId: 0x0B,
 *       firmwareVersion: "1.2.3"
 *     },
 *     sensor1: {
 *       identification: { sensorType: 0x0001 },
 *       channel1: { measurand: "temperature", unit: "°C" },
 *       channel2: { measurand: "pressure", unit: "bar" }
 *     }
 *   },
 *   warnings: ["Optional warning message"]
 * })
 * ```
 */
export function createIdentificationReadRegistersResponseUplinkOutputSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(config: TTULIP3DeviceSensorConfig) {
  return createGenericUplinkOutputSchema({
    messageType: [0x14], // Identification message type
    messageSubType: [0x01, 0x02, 0x04], // Identification message subtype
    extension: {
      identification: createIdentificationReadRegisterDataSchema(config),
    },
  })
}

export function createIdentificationWriteRegistersResponseUplinkOutputSchema() {
  return createGenericUplinkOutputSchema({
    messageType: [0x14], // Identification message type
    messageSubType: [0x03], // Identification message subtype
    extension: {
      identification: createWriteResponseDataSchema(),
    },
  })
}

export type IdentificationReadRegisterData<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = v.InferOutput<ReturnType<typeof createIdentificationReadRegisterDataSchema<TTULIP3DeviceSensorConfig>>>
export type IdentificationReadRegistersResponseUplinkOutput<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = v.InferOutput<ReturnType<typeof createIdentificationReadRegistersResponseUplinkOutputSchema<TTULIP3DeviceSensorConfig>>>
export type IdentificationWriteRegistersResponseUplinkOutput = v.InferOutput<ReturnType<typeof createIdentificationWriteRegistersResponseUplinkOutputSchema>>
