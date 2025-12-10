import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../../codecs/tulip3/profile'
/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import {
  measurandLookup,
  productSubIdLookup,
  unitsLookup,
} from '../../codecs/tulip3/lookups'
import { createGenericUplinkOutputSchema, createWriteResponseDataSchema } from './_shared'

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
function createProductSubIdSchema() {
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
function createChannelPlanSchema() {
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
function createMeasurandSchema() {
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
function createUnitSchema() {
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
function createConnectedSensorsSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
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
function createExistingChannelsSchema<const TConfig extends TULIP3SensorConfig>(config: TConfig) {
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

// Lookup type for communication module identification fields - avoids deep conditional chains
export interface CommunicationModuleIdentificationFieldSchemas<TConfig extends TULIP3DeviceConfig> {
  productId: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  productSubId: v.OptionalSchema<ReturnType<typeof createProductSubIdSchema>, undefined>
  channelPlan: v.OptionalSchema<ReturnType<typeof createChannelPlanSchema>, undefined>
  connectedSensors: v.OptionalSchema<ReturnType<typeof createConnectedSensorsSchema<TConfig>>, undefined>
  firmwareVersion: v.OptionalSchema<v.StringSchema<undefined>, undefined>
  hardwareVersion: v.OptionalSchema<v.StringSchema<undefined>, undefined>
  productionDate: v.OptionalSchema<v.SchemaWithPipe<[v.StringSchema<undefined>, v.IsoDateAction<string, undefined>]>, undefined>
  serialNumberPart1: v.OptionalSchema<v.StringSchema<undefined>, undefined>
  serialNumberPart2: v.OptionalSchema<v.StringSchema<undefined>, undefined>
}

type EnabledCommunicationModuleIdentificationFields<TConfig extends TULIP3DeviceConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3IdentificationRegisters'] as TConfig['registerConfig']['tulip3IdentificationRegisters'][K] extends true ? K : never]: K extends keyof CommunicationModuleIdentificationFieldSchemas<TConfig> ? CommunicationModuleIdentificationFieldSchemas<TConfig>[K] : never
}

/**
 * Creates a validation schema for communication module identification data.
 * Contains hardware and software information about the communication module.
 * Only includes fields that are enabled in the device configuration flags.
 *
 * @param config - Device sensor config object (keys are sensor names)
 * @returns A Valibot object schema for communication module identification
 * @template TConfig - Type-safe device configuration
 * @example
 * ```typescript
 * const config = {
 *   sensor1: {},
 *   registerConfig: {
 *     tulip3IdentificationRegisters: {
 *       productId: true,
 *       firmwareVersion: true
 *     }
 *   }
 * }
 * const schema = createCommunicationModuleIdentificationSchema(config)
 * const result = v.parse(schema, {
 *   productId: 0x0B, // PEW-1000
 *   firmwareVersion: "1.2.3"
 * })
 * ```
 */
function createCommunicationModuleIdentificationSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3IdentificationRegisters
  const schema: Record<string, any> = {}

  if (flags.productId)
    schema.productId = v.optional(v.number())
  if (flags.productSubId)
    schema.productSubId = v.optional(createProductSubIdSchema())
  if (flags.channelPlan)
    schema.channelPlan = v.optional(createChannelPlanSchema())
  if (flags.connectedSensors)
    schema.connectedSensors = v.optional(createConnectedSensorsSchema(config))
  if (flags.firmwareVersion)
    schema.firmwareVersion = v.optional(v.string())
  if (flags.hardwareVersion)
    schema.hardwareVersion = v.optional(v.string())
  if (flags.productionDate)
    schema.productionDate = v.optional(v.pipe(v.string(), v.isoDate()))
  if (flags.serialNumberPart1)
    schema.serialNumberPart1 = v.optional(v.string())
  if (flags.serialNumberPart2)
    schema.serialNumberPart2 = v.optional(v.string())

  return v.object(schema as EnabledCommunicationModuleIdentificationFields<TConfig>)
}

// Lookup type for sensor identification fields - avoids deep conditional chains
export interface SensorIdentificationFieldSchemas<TConfig extends TULIP3SensorConfig> {
  sensorType: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  existingChannels: v.OptionalSchema<ReturnType<typeof createExistingChannelsSchema<TConfig>>, undefined>
  firmwareVersion: v.OptionalSchema<v.StringSchema<undefined>, undefined>
  hardwareVersion: v.OptionalSchema<v.StringSchema<undefined>, undefined>
  productionDate: v.OptionalSchema<v.SchemaWithPipe<[v.StringSchema<undefined>, v.IsoDateAction<string, undefined>]>, undefined>
  serialNumberPart1: v.OptionalSchema<v.StringSchema<undefined>, undefined>
  serialNumberPart2: v.OptionalSchema<v.StringSchema<undefined>, undefined>
}

type EnabledSensorIdentificationFields<TConfig extends TULIP3SensorConfig> = {
  [K in keyof TConfig['registerConfig']['tulip3IdentificationRegisters'] as TConfig['registerConfig']['tulip3IdentificationRegisters'][K] extends true ? K : never]: K extends keyof SensorIdentificationFieldSchemas<TConfig> ? SensorIdentificationFieldSchemas<TConfig>[K] : never
}

/**
 * Creates a validation schema for sensor identification data.
 * Contains hardware and software information about individual sensors.
 * Only includes fields that are enabled in the sensor configuration flags.
 *
 * @param config - Sensor channel config object (keys are channel names)
 * @returns A Valibot object schema for sensor identification
 * @template TConfig - Type-safe sensor configuration
 * @example
 * ```typescript
 * const schema = createSensorIdentificationSchema(config)
 * const result = v.parse(schema, {
 *   sensorType: 0x0000,
 *   existingChannels: { channel1: true, channel2: true },
 *   firmwareVersion: "2.1.0"
 * })
 * ```
 */
function createSensorIdentificationSchema<const TConfig extends TULIP3SensorConfig>(config: TConfig) {
  const flags = config.registerConfig.tulip3IdentificationRegisters
  const schema: Record<string, any> = {}

  if (flags.sensorType)
    schema.sensorType = v.optional(v.number())
  if (flags.existingChannels)
    schema.existingChannels = v.optional(createExistingChannelsSchema(config))
  if (flags.firmwareVersion)
    schema.firmwareVersion = v.optional(v.string())
  if (flags.hardwareVersion)
    schema.hardwareVersion = v.optional(v.string())
  if (flags.productionDate)
    schema.productionDate = v.optional(v.pipe(v.string(), v.isoDate()))
  if (flags.serialNumberPart1)
    schema.serialNumberPart1 = v.optional(v.string())
  if (flags.serialNumberPart2)
    schema.serialNumberPart2 = v.optional(v.string())

  return v.object(schema as EnabledSensorIdentificationFields<TConfig>)
}

// Lookup type for channel identification fields - avoids deep conditional chains
export interface ChannelIdentificationFieldSchemas<TChannelName extends string> {
  measurand: v.OptionalSchema<ReturnType<typeof createMeasurandSchema>, undefined>
  unit: v.OptionalSchema<ReturnType<typeof createUnitSchema>, undefined>
  minMeasureRange: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  maxMeasureRange: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  minPhysicalLimit: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  maxPhysicalLimit: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  accuracy: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  offset: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  gain: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  calibrationDate: v.OptionalSchema<v.SchemaWithPipe<[v.StringSchema<undefined>, v.IsoDateAction<string, undefined>]>, undefined>
  channelName: v.LiteralSchema<TChannelName, undefined>
}

type EnabledChannelIdentificationFields<TConfig extends TULIP3ChannelConfig, TChannelName extends string> = {
  [K in keyof TConfig['registerConfig']['tulip3IdentificationRegisters'] as TConfig['registerConfig']['tulip3IdentificationRegisters'][K] extends true ? K : never]: K extends keyof ChannelIdentificationFieldSchemas<TChannelName> ? ChannelIdentificationFieldSchemas<TChannelName>[K] : never
} & { channelName: v.LiteralSchema<TChannelName, undefined> }

/**
 * Creates a validation schema for channel identification and configuration data.
 * Defines the measurement parameters and calibration information for a sensor channel.
 * Only includes fields that are enabled in the channel configuration flags.
 *
 * @param name - Channel name literal
 * @param config - Channel configuration with register flags
 * @returns A Valibot object schema for channel identification
 * @template TChannelName - Type-safe channel name literal
 * @template TConfig - Type-safe channel configuration
 * @example
 * ```typescript
 * const schema = createChannelIdentificationSchema('channel1', config)
 * const result = v.parse(schema, {
 *   measurand: "temperature",
 *   unit: "°C",
 *   minMeasureRange: -40.0,
 *   maxMeasureRange: 125.0,
 *   accuracy: 500 // 0.5% expressed as 0.001%
 * })
 * ```
 */
function createChannelIdentificationSchema<TChannelName extends string, const TConfig extends TULIP3ChannelConfig>(name: TChannelName, config: TConfig) {
  const flags = config.registerConfig.tulip3IdentificationRegisters
  const schema: Record<string, any> = {}

  if (flags.measurand)
    schema.measurand = v.optional(createMeasurandSchema())
  if (flags.unit)
    schema.unit = v.optional(createUnitSchema())
  if (flags.minMeasureRange)
    schema.minMeasureRange = v.optional(v.number())
  if (flags.maxMeasureRange)
    schema.maxMeasureRange = v.optional(v.number())
  if (flags.minPhysicalLimit)
    schema.minPhysicalLimit = v.optional(v.number())
  if (flags.maxPhysicalLimit)
    schema.maxPhysicalLimit = v.optional(v.number())
  if (flags.accuracy)
    schema.accuracy = v.optional(v.number())
  if (flags.offset)
    schema.offset = v.optional(v.number())
  if (flags.gain)
    schema.gain = v.optional(v.number())
  if (flags.calibrationDate)
    schema.calibrationDate = v.optional(v.pipe(v.string(), v.isoDate()))
  schema.channelName = v.literal(name) // Channel name always present

  return v.object(schema as EnabledChannelIdentificationFields<TConfig, TChannelName>)
}

/**
 * Creates a validation schema for a sensor with its associated channels.
 * Combines sensor identification with individual channel configurations.
 *
 * @param sensorChannelConfig - Configuration object defining which channels are available for this sensor
 * @returns A Valibot object schema combining sensor identification and channel configurations
 * @template TTULIP3SensorConfig - Type-safe sensor channel configuration
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
function createSensorWithChannelsSchema<const TTULIP3SensorConfig extends TULIP3SensorConfig>(sensorChannelConfig: TTULIP3SensorConfig) {
  // skip the keys that don't start with 'channel'
  const channels = Object.keys(sensorChannelConfig).filter(key => key.startsWith('channel')) as Extract<(keyof TTULIP3SensorConfig), string>[]

  const identificationObject = {
    identification: v.optional(createSensorIdentificationSchema(sensorChannelConfig)),
  } as const

  type ChannelsObject = {
    [ChannelKey in keyof TTULIP3SensorConfig as ChannelKey extends `channel${number}` ? ChannelKey : never]:
    TTULIP3SensorConfig[ChannelKey] extends TULIP3ChannelConfig
      ? v.OptionalSchema<
        v.ObjectSchema<EnabledChannelIdentificationFields<TTULIP3SensorConfig[ChannelKey], TTULIP3SensorConfig[ChannelKey]['channelName']>, undefined>,
        undefined
      >
      : never
  }

  const channelsObj = channels.reduce((acc, channel) => {
    const c = sensorChannelConfig[channel as keyof typeof sensorChannelConfig] as TULIP3ChannelConfig
    // @ts-expect-error - wont bother to fix, type is correct
    acc[channel as keyof typeof acc] = v.optional(createChannelIdentificationSchema(c.channelName, c))
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

type MappedSensorChannelConfig<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = {
  [K in keyof TTULIP3DeviceConfig as K extends `sensor${number}` ? K : never]: TTULIP3DeviceConfig[K] extends TULIP3SensorConfig
    ? v.OptionalSchema<ReturnType<typeof createSensorWithChannelsSchema<TTULIP3DeviceConfig[K]>>, undefined> : never
}

function createIdentificationReadRegisterDataSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  const obj = Object.entries(config).reduce((acc, [sensorKey, channelConfig]) => {
    // skip non-sensor entries
    if (!sensorKey.startsWith('sensor')) {
      return acc
    }
    // @ts-expect-error - wont bother to fix
    acc[sensorKey as keyof MappedSensorChannelConfig<TTULIP3DeviceConfig>] = v.optional(createSensorWithChannelsSchema(channelConfig))
    return acc
  }, {
    communicationModule: v.optional(createCommunicationModuleIdentificationSchema(config)),
  } as (MappedSensorChannelConfig<TTULIP3DeviceConfig> & { communicationModule: v.OptionalSchema<ReturnType<typeof createCommunicationModuleIdentificationSchema<TTULIP3DeviceConfig>>, undefined> }))

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
function createIdentificationReadRegistersResponseUplinkOutputSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  return createGenericUplinkOutputSchema({
    messageType: [0x14], // Identification message type
    messageSubType: [0x01, 0x02, 0x04], // Identification message subtype
    extension: {
      identification: createIdentificationReadRegisterDataSchema(config),
    },
  })
}

function createIdentificationWriteRegistersResponseUplinkOutputSchema() {
  return createGenericUplinkOutputSchema({
    messageType: [0x14], // Identification message type
    messageSubType: [0x03], // Identification message subtype
    extension: {
      identification: createWriteResponseDataSchema(),
    },
  })
}

export type IdentificationReadRegisterData<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createIdentificationReadRegisterDataSchema<TTULIP3DeviceConfig>>>
export type IdentificationReadRegistersResponseUplinkOutput<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createIdentificationReadRegistersResponseUplinkOutputSchema<TTULIP3DeviceConfig>>>
export type IdentificationWriteRegistersResponseUplinkOutput = v.InferOutput<ReturnType<typeof createIdentificationWriteRegistersResponseUplinkOutputSchema>>

export {
  createIdentificationReadRegistersResponseUplinkOutputSchema,
  createIdentificationWriteRegistersResponseUplinkOutputSchema,
}
