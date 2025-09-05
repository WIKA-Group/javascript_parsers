import type { DeviceAlarmFlags, TULIP3ChannelConfig, TULIP3DeviceProfile, TULIP3DeviceSensorConfig } from '../../codecs/tulip3/profile'
import type { MinusOne } from '../../types'
/* eslint-disable ts/explicit-function-return-type */
import type { ConfigurationReadRegistersResponseUplinkOutput, ConfigurationWriteRegistersResponseUplinkOutput } from './configuration'
import type { DataMessageUplinkOutput } from './data'
import type { ChannelAlarmMessageUplinkOutput, CommunicationModuleAlarmMessageUplinkOutput, SensorAlarmMessageUplinkOutput } from './deviceAlarm'

import type { IdentificationReadRegistersResponseUplinkOutput, IdentificationWriteRegistersResponseUplinkOutput } from './identification'
import type { KeepAliveMessageUplinkOutput } from './keepAlive'
import type { ProcessAlarmMessageUplinkOutput } from './processAlarm'
import type { SpontaneousDownlinkAnswerUplinkOutput, SpontaneousFetchAdditionalDownlinkMessageUplinkOutput } from './spontaneous'
import * as v from 'valibot'
import { configurationStatusLookup } from '../../codecs/tulip3/lookups'
import { createConfigurationReadRegistersResponseUplinkOutputSchema, createConfigurationWriteRegistersResponseUplinkOutputSchema } from './configuration'
import { createDataMessageUplinkOutputSchema } from './data'
import { createChannelAlarmUplinkOutputSchema, createCommunicationModuleAlarmUplinkOutputSchema, createSensorAlarmUplinkOutputSchema } from './deviceAlarm'
import { createIdentificationReadRegistersResponseUplinkOutputSchema, createIdentificationWriteRegistersResponseUplinkOutputSchema } from './identification'
import { createKeepAliveUplinkOutputSchema } from './keepAlive'
import { createProcessAlarmUplinkOutputSchema } from './processAlarm'
import { createSpontaneousDownlinkAnswerUplinkOutputSchema, createSpontaneousFetchAdditionalDownlinkMessageSchema } from './spontaneous'

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for configuration status codes.
 * This is shared between identification and configuration schemas.
 *
 * @returns A Valibot picklist schema that validates against supported configuration status codes
 * @example
 * ```typescript
 * const schema = createConfigurationStatusSchema()
 * const result = v.parse(schema, "Configuration received and applied with success")
 * ```
 */
export function createConfigurationStatusSchema() {
  return v.picklist(Object.values(configurationStatusLookup) as (typeof configurationStatusLookup[keyof typeof configurationStatusLookup])[])
}

/**
 * Creates a validation schema for frame data used in write response messages.
 * Each frame contains a frame number and status code.
 *
 * @returns A Valibot object schema for frame data
 * @example
 * ```typescript
 * const schema = createFrameSchema()
 * const result = v.parse(schema, {
 *   frameNumber: 1,
 *   status: "Configuration received and applied with success"
 * })
 * ```
 */
export function createFrameSchema() {
  return v.object({
    frameNumber: v.number(),
    status: createConfigurationStatusSchema(),
  })
}

/**
 * Creates a validation schema for write response data containing frame information.
 * This schema is shared between identification and configuration write responses.
 *
 * @returns A Valibot object schema for write response data
 * @example
 * ```typescript
 * const schema = createWriteResponseDataSchema()
 * const result = v.parse(schema, {
 *   revisionCounter: 123,
 *   totalWrongFrames: 0,
 *   frames: [
 *     { frameNumber: 1, status: "Configuration received and applied with success" },
 *     { frameNumber: 2, status: "Configuration received and applied with success" }
 *   ]
 * })
 * ```
 */
export function createWriteResponseDataSchema() {
  return v.object({
    revisionCounter: v.optional(v.number()),
    totalWrongFrames: v.optional(v.number()),
    frames: v.tupleWithRest([createFrameSchema()], createFrameSchema()),
  })
}

/**
 * Creates a generic validation schema for uplink output messages.
 * This is an internal helper function used by other schema creators.
 *
 * @param i - Configuration object containing message types and extension schema
 * @param i.messageType - Array of valid message type values (non-empty)
 * @param i.messageSubType - Array of valid message subtype values (non-empty)
 * @param i.extension - Additional object properties to include in the data schema
 * @returns A Valibot object schema for uplink messages with optional warnings
 * @template TType - Type-safe array of message type numbers
 * @template TSubType - Type-safe array of message subtype numbers
 * @template TObjectExtension - Type-safe object entries for extensions
 * @internal
 */
export function createGenericUplinkOutputSchema<const TType extends [number, ...number[]], const TSubType extends [number, ...number[]], const TObjectExtension extends v.ObjectEntries>(i: {
  messageType: TType
  messageSubType: TSubType
  extension: TObjectExtension
}) {
  return v.object({
    data: v.object({
      messageType: v.picklist(i.messageType),
      messageSubType: v.picklist(i.messageSubType),
      ...i.extension,
    }),
    warnings: v.optional(v.array(v.string())),
  })
}

type ExtractMeasurementTypes<T> = T extends { measurementTypes: infer U }
  ? U extends readonly (string | number | bigint)[]
    ? U
    : never
  : never

// Helper type to get the channel config ensuring it exists
type GetChannelConfig<
  TConfig extends TULIP3DeviceSensorConfig,
  TSensor extends keyof TConfig,
  TChannel extends keyof NonNullable<TConfig[TSensor]>,
> = NonNullable<TConfig[TSensor]>[TChannel] extends TULIP3ChannelConfig
  ? NonNullable<TConfig[TSensor]>[TChannel]
  : never

type FullMappedMeasurementSchemas<
  TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig,
  TExtension extends v.ObjectEntries,
> = {
  [TSensor in keyof TTULIP3DeviceSensorConfig]: {
    [TChannel in keyof NonNullable<TTULIP3DeviceSensorConfig[TSensor]>]:
    NonNullable<TTULIP3DeviceSensorConfig[TSensor]>[TChannel] extends TULIP3ChannelConfig
      ? v.ObjectSchema<{
        sensor: v.LiteralSchema<TSensor, undefined>
        sensorId: TSensor extends `sensor${infer Id extends number}`
          ? v.LiteralSchema<MinusOne<Id>, undefined>
          : v.NumberSchema<undefined>
        channel: v.LiteralSchema<TChannel, undefined>
        channelId: TChannel extends `channel${infer Id extends number}`
          ? v.LiteralSchema<MinusOne<Id>, undefined>
          : v.NumberSchema<undefined>
        channelName: v.LiteralSchema<NonNullable<TTULIP3DeviceSensorConfig[TSensor]>[TChannel]['channelName'], undefined>
        sourceDataType: v.PicklistSchema<
          ExtractMeasurementTypes<GetChannelConfig<TTULIP3DeviceSensorConfig, TSensor, TChannel>>,
          undefined
        >
      } & TExtension, undefined>
      : never
  }[keyof NonNullable<TTULIP3DeviceSensorConfig[TSensor]>]
}[keyof TTULIP3DeviceSensorConfig][]

/**
 * Builds schemas for all sensor/channel combinations WITH the `sourceDataType` field.
 * Use this variant when you need to validate or emit the measurement's data type alongside
 * sensor/channel identifiers (e.g. data message measurement rows).
 *
 * The resulting array contains one Valibot object schema per sensor/channel pair with:
 * - sensor, sensorId, channel, channelId literals
 * - sourceDataType as a picklist taken from the channel's `measurementTypes`
 * - all entries provided via `extension` merged into the object
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @param extension - Additional object entries merged into every schema (e.g. value fields)
 * @returns Array of Valibot object schemas, one per sensor/channel
 * @see {@link createSensorChannelSchemaWithExtension} for the variant WITHOUT `sourceDataType`.
 * @example
 * ```ts
 * const config = { sensor1: { channel1: { measurementTypes: ["float - IEEE754", "integer"] } } } as const
 * const schemas = createFullSensorChannelSchemaWithExtension(config, { value: v.number() })
 * // Validate against the first schema as an example
 * const parsed = v.parse(schemas[0], {
 *   sensor: 'sensor1',
 *   sensorId: 0,
 *   channel: 'channel1',
 *   channelId: 0,
 *   sourceDataType: 'float - IEEE754',
 *   value: 23.5,
 * })
 * ```
 */
export function createFullSensorChannelSchemaWithExtension<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TEntries extends v.ObjectEntries>(config: TTULIP3DeviceSensorConfig, extension: TEntries) {
  // iterate over the config and create a schema for each sensor/channel combination with the extension

  const schemas: FullMappedMeasurementSchemas<TTULIP3DeviceSensorConfig, TEntries> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceSensorConfig)[]) {
    for (const channelKey of Object.keys(config[sensorKey] as any) as (keyof TTULIP3DeviceSensorConfig[typeof sensorKey])[]) {
      const sensorId = Number.parseInt((sensorKey as string).replace('sensor', '')) - 1
      const channelId = Number.parseInt((channelKey as string).replace('channel', '')) - 1
      const channelName = (config[sensorKey][channelKey] as TULIP3ChannelConfig).channelName
      schemas.push(
        v.object({
          sensor: v.literal(sensorKey),
          sensorId: v.literal(sensorId),
          channel: v.literal(channelKey),
          channelId: v.literal(channelId),
          channelName: v.literal(channelName),
          sourceDataType: v.picklist(
            Object.values((config[sensorKey][channelKey] as any).measurementTypes) as (string | number | bigint)[],
            undefined,
          ),
          ...extension,
        }) as FullMappedMeasurementSchemas<TTULIP3DeviceSensorConfig, TEntries>[number],
      )
    }
  }

  return schemas
}

type MappedMeasurementSchemas<
  TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig,
  TExtension extends v.ObjectEntries,
> = {
  [TSensor in keyof TTULIP3DeviceSensorConfig]: {
    [TChannel in keyof NonNullable<TTULIP3DeviceSensorConfig[TSensor]>]:
    NonNullable<TTULIP3DeviceSensorConfig[TSensor]>[TChannel] extends TULIP3ChannelConfig
      ? v.ObjectSchema<{
        sensor: v.LiteralSchema<TSensor, undefined>
        sensorId: TSensor extends `sensor${infer Id extends number}`
          ? v.LiteralSchema<MinusOne<Id>, undefined>
          : v.NumberSchema<undefined>
        channel: v.LiteralSchema<TChannel, undefined>
        channelId: TChannel extends `channel${infer Id extends number}`
          ? v.LiteralSchema<MinusOne<Id>, undefined>
          : v.NumberSchema<undefined>
        channelName: v.LiteralSchema<NonNullable<TTULIP3DeviceSensorConfig[TSensor]>[TChannel]['channelName'], undefined>
      } & TExtension, undefined>
      : never
  }[keyof NonNullable<TTULIP3DeviceSensorConfig[TSensor]>]
}[keyof TTULIP3DeviceSensorConfig][]

/**
 * Builds schemas for all sensor/channel combinations WITHOUT the `sourceDataType` field.
 * Use this variant when the data type is implicit or not required in the payload.
 *
 * The resulting array contains one Valibot object schema per sensor/channel pair with:
 * - sensor, sensorId, channel, channelId literals
 * - all entries provided via `extension` merged into the object
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @param extension - Additional object entries merged into every schema (e.g. value fields)
 * @returns Array of Valibot object schemas, one per sensor/channel
 * @see {@link createFullSensorChannelSchemaWithExtension} for the variant WITH `sourceDataType`.
 * @example
 * ```ts
 * const config = { sensor1: { channel1: {} } } as const
 * const schemas = createSensorChannelSchemaWithExtension(config, { value: v.number() })
 * const parsed = v.parse(schemas[0], {
 *   sensor: 'sensor1',
 *   sensorId: 0,
 *   channel: 'channel1',
 *   channelId: 0,
 *   channelName: '',
 *   value: 23.5,
 * })
 * ```
 */
export function createSensorChannelSchemaWithExtension<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TEntries extends v.ObjectEntries>(config: TTULIP3DeviceSensorConfig, extension: TEntries) {
  // iterate over the config and create a schema for each sensor/channel combination with the extension

  const schemas: MappedMeasurementSchemas<TTULIP3DeviceSensorConfig, TEntries> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceSensorConfig)[]) {
    for (const channelKey of Object.keys(config[sensorKey] as any) as (keyof TTULIP3DeviceSensorConfig[typeof sensorKey])[]) {
      const sensorId = Number.parseInt((sensorKey as string).replace('sensor', '')) - 1
      const channelId = Number.parseInt((channelKey as string).replace('channel', '')) - 1
      const channelName = (config[sensorKey][channelKey] as TULIP3ChannelConfig).channelName
      schemas.push(
        v.object({
          sensor: v.literal(sensorKey),
          sensorId: v.literal(sensorId),
          channel: v.literal(channelKey),
          channelId: v.literal(channelId),
          channelName: v.literal(channelName),
          ...extension,
        }) as MappedMeasurementSchemas<TTULIP3DeviceSensorConfig, TEntries>[number],
      )
    }
  }

  return schemas
}

type MappedSensorMeasurementSchemas<
  TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig,
  TExtension extends v.ObjectEntries,
> = {
  [TSensor in keyof TTULIP3DeviceSensorConfig]:
  v.ObjectSchema<{
    sensor: v.LiteralSchema<TSensor, undefined>
    sensorId: TSensor extends `sensor${infer Id extends number}`
      ? v.LiteralSchema<MinusOne<Id>, undefined>
      : v.NumberSchema<undefined>
  } & TExtension, undefined>
}[keyof TTULIP3DeviceSensorConfig][]

/**
 * Builds schemas for all sensors WITH the `sensorId` field.
 * Use this variant when you need to validate or emit the sensor's identifier alongside
 * other entries provided via `extension`.
 *
 * The resulting array contains one Valibot object schema per sensor with:
 * - sensor and sensorId literals
 * - all entries provided via `extension` merged into the object
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @param extension - Additional object entries merged into every schema (e.g. value fields)
 * @returns Array of Valibot object schemas, one per sensor
 * @see {@link createSensorChannelSchemaWithExtension} for the variant WITH `channel` and `channelId`.
 * @see {@link createFullSensorChannelSchemaWithExtension} for the variant WITH `channel`, `channelId` and `sourceDataType`.
 * @example
 * ```ts
 * const config = { sensor1: {}, sensor2: {} } as const
 * const schemas = createSensorMeasurementSchemaWithExtension(config, { value: v.number() })
 * const parsed = v.parse(schemas[0], {
 *   sensor: 'sensor1',
 *   sensorId: 0,
 *   value: 23.5,
 * })
 * ```
 */
export function createSensorMeasurementSchemaWithExtension<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TEntries extends v.ObjectEntries>(config: TTULIP3DeviceSensorConfig, extension: TEntries) {
  // iterate over the config and create a schema for each sensor/channel combination with the extension

  const schemas: MappedSensorMeasurementSchemas<TTULIP3DeviceSensorConfig, TEntries> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceSensorConfig)[]) {
    const sensorId = Number.parseInt((sensorKey as string).replace('sensor', '')) - 1
    schemas.push(
      v.object({
        sensor: v.literal(sensorKey),
        sensorId: v.literal(sensorId),
        ...extension,
      }) as MappedSensorMeasurementSchemas<TTULIP3DeviceSensorConfig, TEntries>[number],
    )
  }

  return schemas
}

export type TULIP3UplinkOutput<TDeviceProfile extends TULIP3DeviceProfile>
  = | DataMessageUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | ProcessAlarmMessageUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | CommunicationModuleAlarmMessageUplinkOutput<TDeviceProfile['deviceAlarmConfig']['communicationModuleAlarms']>
    | SensorAlarmMessageUplinkOutput<TDeviceProfile['sensorChannelConfig'], TDeviceProfile['deviceAlarmConfig']['sensorAlarms']>
    | ChannelAlarmMessageUplinkOutput<TDeviceProfile['sensorChannelConfig'], TDeviceProfile['deviceAlarmConfig']['sensorChannelAlarms']>
    | IdentificationReadRegistersResponseUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | IdentificationWriteRegistersResponseUplinkOutput
    | ConfigurationReadRegistersResponseUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | ConfigurationWriteRegistersResponseUplinkOutput
    | SpontaneousDownlinkAnswerUplinkOutput
    | SpontaneousFetchAdditionalDownlinkMessageUplinkOutput
    | KeepAliveMessageUplinkOutput

export function createTULIP3UplinkOutputSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TCMFlags extends DeviceAlarmFlags, TSensorFlags extends DeviceAlarmFlags, TChannelFlags extends DeviceAlarmFlags>(sensorChannelConfig: TTULIP3DeviceSensorConfig, communicationModuleAlarms: TCMFlags, sensorAlarms: TSensorFlags, sensorChannelAlarms: TChannelFlags) {
  return v.union([
    createDataMessageUplinkOutputSchema(sensorChannelConfig),
    createConfigurationReadRegistersResponseUplinkOutputSchema(sensorChannelConfig),
    createConfigurationWriteRegistersResponseUplinkOutputSchema(),
    createChannelAlarmUplinkOutputSchema(sensorChannelConfig, sensorChannelAlarms),
    createCommunicationModuleAlarmUplinkOutputSchema(communicationModuleAlarms),
    createSensorAlarmUplinkOutputSchema(sensorChannelConfig, sensorAlarms),
    createKeepAliveUplinkOutputSchema(),
    createProcessAlarmUplinkOutputSchema(sensorChannelConfig),
    createSpontaneousDownlinkAnswerUplinkOutputSchema(),
    createSpontaneousFetchAdditionalDownlinkMessageSchema(),
    createIdentificationReadRegistersResponseUplinkOutputSchema(sensorChannelConfig),
    createIdentificationWriteRegistersResponseUplinkOutputSchema(),
  ])
}
