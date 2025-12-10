/* eslint-disable ts/explicit-function-return-type */
import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3DeviceProfile } from '../../codecs/tulip3/profile'
import type { ConfigurationReadRegistersResponseUplinkOutput, ConfigurationWriteRegistersResponseUplinkOutput } from './configuration'
import type { DataMessageUplinkOutput } from './data'
import type { ChannelAlarmMessageUplinkOutput, CommunicationModuleAlarmMessageUplinkOutput, SensorAlarmMessageUplinkOutput } from './deviceAlarm'

import type { IdentificationReadRegistersResponseUplinkOutput, IdentificationWriteRegistersResponseUplinkOutput } from './identification'
import type { KeepAliveMessageUplinkOutput } from './keepAlive'
import type { ProcessAlarmMessageUplinkOutput } from './processAlarm'
import type { SpontaneousDownlinkAnswerUplinkOutput, SpontaneousFetchAdditionalDownlinkMessageUplinkOutput } from './spontaneous'
import * as v from 'valibot'
import { createConfigurationReadRegistersResponseUplinkOutputSchema, createConfigurationWriteRegistersResponseUplinkOutputSchema } from './configuration'
import { createDataMessageUplinkOutputSchema } from './data'
import { createChannelAlarmUplinkOutputSchema, createCommunicationModuleAlarmUplinkOutputSchema, createSensorAlarmUplinkOutputSchema } from './deviceAlarm'
import { createIdentificationReadRegistersResponseUplinkOutputSchema, createIdentificationWriteRegistersResponseUplinkOutputSchema } from './identification'
import { createKeepAliveUplinkOutputSchema } from './keepAlive'
import { createProcessAlarmUplinkOutputSchema } from './processAlarm'
import { createSpontaneousDownlinkAnswerUplinkOutputSchema, createSpontaneousFetchAdditionalDownlinkMessageSchema } from './spontaneous'
// Re-export shared functions to maintain API compatibility
export { createConfigurationStatusSchema, createFrameSchema, createGenericUplinkOutputSchema, createWriteResponseDataSchema } from './_shared'

type ExtractMeasurementTypes<T> = T extends { measurementTypes: infer U }
  ? U extends readonly (string | number | bigint)[]
    ? U
    : never
  : never

// Helper type to get the channel config ensuring it exists
type GetChannelConfig<
  TConfig extends TULIP3DeviceConfig,
  TSensor extends keyof TConfig,
  TChannel extends keyof NonNullable<TConfig[TSensor]>,
> = NonNullable<TConfig[TSensor]>[TChannel] extends TULIP3ChannelConfig
  ? NonNullable<TConfig[TSensor]>[TChannel]
  : never

type FullMappedMeasurementSchemas<
  TTULIP3DeviceConfig extends TULIP3DeviceConfig,
  TExtension extends v.ObjectEntries,
> = {
  [TSensor in keyof TTULIP3DeviceConfig]: {
    [TChannel in keyof NonNullable<TTULIP3DeviceConfig[TSensor]>]:
    NonNullable<TTULIP3DeviceConfig[TSensor]>[TChannel] extends TULIP3ChannelConfig
      ? v.ObjectSchema<{
        sensor: v.LiteralSchema<TSensor, undefined>
        // Force to v.NumberSchema to avoid maximum call stack exceeded.
        // These conditional types were disabled due to TypeScript's limitations with deeply nested
        // generic type inference causing stack overflow during declaration emit.
        // TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
        // which should handle complex type instantiation more efficiently.
        // TSensor extends `sensor${infer Id extends number}`
        //   ? v.LiteralSchema<MinusOne<Id>, undefined>
        //   : v.NumberSchema<undefined>
        sensorId: v.NumberSchema<undefined>
        channel: v.LiteralSchema<TChannel, undefined>
        // Force to v.NumberSchema to avoid maximum call stack exceeded.
        // These conditional types were disabled due to TypeScript's limitations with deeply nested
        // generic type inference causing stack overflow during declaration emit.
        // TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
        // which should handle complex type instantiation more efficiently.
        // TSensor extends `sensor${infer Id extends number}`
        //   ? v.LiteralSchema<MinusOne<Id>, undefined>
        //   : v.NumberSchema<undefined>
        channelId: v.NumberSchema<undefined>
        channelName: v.LiteralSchema<NonNullable<TTULIP3DeviceConfig[TSensor]>[TChannel]['channelName'], undefined>
        sourceDataType: v.PicklistSchema<
          ExtractMeasurementTypes<GetChannelConfig<TTULIP3DeviceConfig, TSensor, TChannel>>,
          undefined
        >
      } & TExtension, undefined>
      : never
  }[keyof NonNullable<TTULIP3DeviceConfig[TSensor]>]
}[keyof TTULIP3DeviceConfig][]

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
export function createFullSensorChannelSchemaWithExtension<const TTULIP3DeviceConfig extends TULIP3DeviceConfig, const TEntries extends v.ObjectEntries>(config: TTULIP3DeviceConfig, extension: TEntries) {
  // iterate over the config and create a schema for each sensor/channel combination with the extension

  const schemas: FullMappedMeasurementSchemas<TTULIP3DeviceConfig, TEntries> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceConfig)[]) {
    // skip if key does not start with 'sensor'
    if (!sensorKey.toString().startsWith('sensor')) {
      continue
    }
    for (const channelKey of Object.keys(config[sensorKey] as any) as (keyof TTULIP3DeviceConfig[typeof sensorKey])[]) {
      // skip if key does not start with 'channel'
      if (!channelKey.toString().startsWith('channel')) {
        continue
      }

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
        }) as unknown as FullMappedMeasurementSchemas<TTULIP3DeviceConfig, TEntries>[number],
      )
    }
  }

  return schemas
}

type MappedMeasurementSchemas<
  TTULIP3DeviceConfig extends TULIP3DeviceConfig,
  TExtension extends v.ObjectEntries,
> = {
  [TSensor in keyof TTULIP3DeviceConfig]: {
    [TChannel in keyof NonNullable<TTULIP3DeviceConfig[TSensor]>]:
    NonNullable<TTULIP3DeviceConfig[TSensor]>[TChannel] extends TULIP3ChannelConfig
      ? v.ObjectSchema<{
        sensor: v.LiteralSchema<TSensor, undefined>
        // Force to v.NumberSchema to avoid maximum call stack exceeded.
        // These conditional types were disabled due to TypeScript's limitations with deeply nested
        // generic type inference causing stack overflow during declaration emit.
        // TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
        // which should handle complex type instantiation more efficiently.
        // TSensor extends `sensor${infer Id extends number}`
        //   ? v.LiteralSchema<MinusOne<Id>, undefined>
        //   : v.NumberSchema<undefined>
        sensorId: v.NumberSchema<undefined>
        channel: v.LiteralSchema<TChannel, undefined>
        // Force to v.NumberSchema to avoid maximum call stack exceeded.
        // These conditional types were disabled due to TypeScript's limitations with deeply nested
        // generic type inference causing stack overflow during declaration emit.
        // TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
        // which should handle complex type instantiation more efficiently.
        // TChannel extends `channel${infer Id extends number}`
        //   ? v.LiteralSchema<MinusOne<Id>, undefined>
        //   : v.NumberSchema<undefined>
        channelId: v.NumberSchema<undefined>
        channelName: v.LiteralSchema<NonNullable<TTULIP3DeviceConfig[TSensor]>[TChannel]['channelName'], undefined>
      } & TExtension, undefined>
      : never
  }[keyof NonNullable<TTULIP3DeviceConfig[TSensor]>]
}[keyof TTULIP3DeviceConfig][]

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
export function createSensorChannelSchemaWithExtension<const TTULIP3DeviceConfig extends TULIP3DeviceConfig, const TEntries extends v.ObjectEntries>(config: TTULIP3DeviceConfig, extension: TEntries) {
  // iterate over the config and create a schema for each sensor/channel combination with the extension

  const schemas: MappedMeasurementSchemas<TTULIP3DeviceConfig, TEntries> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceConfig)[]) {
    for (const channelKey of Object.keys(config[sensorKey] as any) as (keyof TTULIP3DeviceConfig[typeof sensorKey])[]) {
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
        }) as unknown as MappedMeasurementSchemas<TTULIP3DeviceConfig, TEntries>[number],
      )
    }
  }

  return schemas
}

type MappedSensorMeasurementSchemas<
  TTULIP3DeviceConfig extends TULIP3DeviceConfig,
  TExtension extends v.ObjectEntries,
> = {
  [TSensor in keyof TTULIP3DeviceConfig]:
  v.ObjectSchema<{
    sensor: v.LiteralSchema<TSensor, undefined>
    // Force to v.NumberSchema to avoid maximum call stack exceeded.
    // These conditional types were disabled due to TypeScript's limitations with deeply nested
    // generic type inference causing stack overflow during declaration emit.
    // TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
    // which should handle complex type instantiation more efficiently.
    // TSensor extends `sensor${infer Id extends number}`
    //   ? v.LiteralSchema<MinusOne<Id>, undefined>
    //   : v.NumberSchema<undefined>
    sensorId: v.NumberSchema<undefined>
  } & TExtension, undefined>
}[keyof TTULIP3DeviceConfig][]

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
export function createSensorMeasurementSchemaWithExtension<const TTULIP3DeviceConfig extends TULIP3DeviceConfig, const TEntries extends v.ObjectEntries>(config: TTULIP3DeviceConfig, extension: TEntries) {
  // iterate over the config and create a schema for each sensor/channel combination with the extension

  const schemas: MappedSensorMeasurementSchemas<TTULIP3DeviceConfig, TEntries> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceConfig)[]) {
    const sensorId = Number.parseInt((sensorKey as string).replace('sensor', '')) - 1
    schemas.push(
      v.object({
        sensor: v.literal(sensorKey),
        sensorId: v.literal(sensorId),
        ...extension,
      }) as any as MappedSensorMeasurementSchemas<TTULIP3DeviceConfig, TEntries>[number],
    )
  }

  return schemas
}

/**
 * INTERNAL USE ONLY\
 * Has to be cast to any as this ONLY creates the schemas for use in the uplink.schema.json file
 * If not cast, typescript will throw "RangeError: Maximum call stack size exceeded" due to the complexity of the types involved.
 * The type below should be used and kept in sync with the schema generated here.
 * @internal
 */
export function createTULIP3UplinkOutputSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(sensorChannelConfig: TTULIP3DeviceConfig): any {
  return v.union([
    createDataMessageUplinkOutputSchema(sensorChannelConfig),
    createConfigurationReadRegistersResponseUplinkOutputSchema(sensorChannelConfig),
    createConfigurationWriteRegistersResponseUplinkOutputSchema(),
    createChannelAlarmUplinkOutputSchema(sensorChannelConfig),
    createCommunicationModuleAlarmUplinkOutputSchema(sensorChannelConfig),
    createSensorAlarmUplinkOutputSchema(sensorChannelConfig),
    createKeepAliveUplinkOutputSchema(),
    createProcessAlarmUplinkOutputSchema(sensorChannelConfig),
    createSpontaneousDownlinkAnswerUplinkOutputSchema(),
    createSpontaneousFetchAdditionalDownlinkMessageSchema(),
    createIdentificationReadRegistersResponseUplinkOutputSchema(sensorChannelConfig),
    createIdentificationWriteRegistersResponseUplinkOutputSchema(),
  ])
}

export type TULIP3UplinkOutput<TDeviceProfile extends TULIP3DeviceProfile>
  = | DataMessageUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | ProcessAlarmMessageUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | CommunicationModuleAlarmMessageUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | SensorAlarmMessageUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | ChannelAlarmMessageUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | IdentificationReadRegistersResponseUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | IdentificationWriteRegistersResponseUplinkOutput
    | ConfigurationReadRegistersResponseUplinkOutput<TDeviceProfile['sensorChannelConfig']>
    | ConfigurationWriteRegistersResponseUplinkOutput
    | SpontaneousDownlinkAnswerUplinkOutput
    | SpontaneousFetchAdditionalDownlinkMessageUplinkOutput
    | KeepAliveMessageUplinkOutput
