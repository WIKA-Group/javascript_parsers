/* eslint-disable ts/explicit-function-return-type */
import type { AlarmFlags, TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../../codecs/tulip3/profile'
import * as v from 'valibot'
import { createGenericUplinkOutputSchema } from './_shared'

// =============================================================================
// BASE TYPE SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for alarm flags.
 * Converts alarm flag bitfield configuration into boolean properties.
 */
function createGenericAlarmFlagsSchema<const TAlarmFlags extends AlarmFlags>(flags: TAlarmFlags) {
  const keys = Object.keys(flags) as (keyof TAlarmFlags)[]

  const obj = keys.reduce((acc, key) => {
    acc[key as keyof TAlarmFlags] = v.boolean()
    return acc
  }, {} as Record<keyof TAlarmFlags, v.BooleanSchema<undefined>>)

  return v.object(obj)
}

// =============================================================================
// DEVICE ALARM MESSAGE SCHEMA
// =============================================================================

/**
 * Creates validation schema for communication module alarm uplink (message 0x13/0x01).
 * Extracts alarm flags from the device config's root `alarmFlags` property.
 *
 * @param config - Device sensor configuration containing alarm flags
 * @returns Validation schema for communication module alarm messages
 */
function createCommunicationModuleAlarmUplinkOutputSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  const alarmFlags = config.alarmFlags
  return createGenericUplinkOutputSchema({
    messageType: [0x13],
    messageSubType: [0x01],
    extension: {
      communicationModuleAlarms: v.object({
        alarmFlags: createGenericAlarmFlagsSchema(alarmFlags),
      }),
    },
  })
}

// =============================================================================
// SENSOR ALARM MEASUREMENT SCHEMA
// =============================================================================

type MappedSensorAlarmSchemaEntries<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = {
  [TSensor in Extract<keyof TTULIP3DeviceConfig, `sensor${number}`>]:
  v.ObjectSchema<{
    sensor: v.LiteralSchema<TSensor, undefined>
    sensorId: v.NumberSchema<undefined>
    /* Force to v.NumberSchema to avoid maximum call stack exceeded.
       These conditional types were disabled due to TypeScript's limitations with deeply nested
       generic type inference causing stack overflow during declaration emit.
       TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
       which should handle complex type instantiation more efficiently.
       TSensor extends `sensor${infer Id extends number}`
        ? v.LiteralSchema<MinusOne<Id>, undefined>
        : v.NumberSchema<undefined> */
    alarmFlags: TTULIP3DeviceConfig[TSensor] extends { alarmFlags: infer TFlags extends AlarmFlags }
      ? ReturnType<typeof createGenericAlarmFlagsSchema<TFlags>>
      : never
  }, undefined>
}[Extract<keyof TTULIP3DeviceConfig, `sensor${number}`>][]

/**
 * Creates validation schema for sensor alarm entries (without channel details).
 * Each sensor entry includes sensor ID and alarm flags as booleans.
 *
 * @param config - Device sensor configuration with sensor alarm flags
 * @returns Union schema for sensor alarm entries
 */
function createSensorAlarmSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  const schemas: MappedSensorAlarmSchemaEntries<TTULIP3DeviceConfig> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceConfig)[]) {
    // if it does not start with 'sensor', skip
    if (!sensorKey.toString().startsWith('sensor')) {
      continue
    }
    const sensorId = Number.parseInt((sensorKey as string).replace('sensor', '')) - 1
    const alarmFlags = (config[sensorKey]! as any as TULIP3SensorConfig).alarmFlags
    schemas.push(
      v.object({
        sensor: v.literal(sensorKey),
        sensorId: v.literal(sensorId),
        alarmFlags: createGenericAlarmFlagsSchema(alarmFlags),
      }) as any as MappedSensorAlarmSchemaEntries<TTULIP3DeviceConfig>[number],
    )
  }

  const u = v.union(schemas)

  return v.tupleWithRest([u], u)
}

/**
 * Creates validation schema for sensor alarm uplink (message 0x13/0x02).
 * Validates array of sensor alarm entries with alarm flags.
 *
 * @param config - Device sensor configuration with sensor alarm flags
 * @returns Validation schema for sensor alarm messages
 */
function createSensorAlarmUplinkOutputSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  return createGenericUplinkOutputSchema({
    messageType: [0x13],
    messageSubType: [0x02],
    extension: {
      sensorAlarms: createSensorAlarmSchema(config),
    },
  })
}

// =============================================================================
// CHANNEL ALARM MEASUREMENT SCHEMA
// =============================================================================

type MappedChannelAlarmSchemaEntries<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = {
  [TSensor in Extract<keyof TTULIP3DeviceConfig, `sensor${number}`>]: TTULIP3DeviceConfig[TSensor] extends TULIP3SensorConfig
    ? {
        [TChannel in Extract<keyof TTULIP3DeviceConfig[TSensor], `channel${number}`>]:
        TTULIP3DeviceConfig[TSensor][TChannel] extends { alarmFlags: infer TFlags extends AlarmFlags }
          ? v.ObjectSchema<{
            sensor: v.LiteralSchema<TSensor, undefined>
            sensorId: v.NumberSchema<undefined>
            /* Force to v.NumberSchema to avoid maximum call stack exceeded.
               These conditional types were disabled due to TypeScript's limitations with deeply nested
               generic type inference causing stack overflow during declaration emit.
               TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
               which should handle complex type instantiation more efficiently.
               TSensor extends `sensor${infer Id extends number}`
                ? v.LiteralSchema<MinusOne<Id>, undefined>
                : v.NumberSchema<undefined> */
            channel: v.LiteralSchema<TChannel, undefined>
            channelId: v.NumberSchema<undefined>
            /* Force to v.NumberSchema to avoid maximum call stack exceeded.
               These conditional types were disabled due to TypeScript's limitations with deeply nested
               generic type inference causing stack overflow during declaration emit.
               TODO: Can be re-enabled when TypeScript 7 with tsgo (Go rewrite) is available,
               which should handle complex type instantiation more efficiently.
               TChannel extends `channel${infer Id extends number}`
                ? v.LiteralSchema<MinusOne<Id>, undefined>
                : v.NumberSchema<undefined> */
            channelName: TTULIP3DeviceConfig[TSensor][TChannel] extends { channelName: infer TName extends string }
              ? v.LiteralSchema<TName, undefined>
              : v.StringSchema<undefined>
            alarmFlags: ReturnType<typeof createGenericAlarmFlagsSchema<TFlags>>
          }, undefined>
          : never
      }[Extract<keyof TTULIP3DeviceConfig[TSensor], `channel${number}`>]
    : never
}[Extract<keyof TTULIP3DeviceConfig, `sensor${number}`>][]

/**
 * Creates validation schema for channel alarm entries.
 * Each entry includes sensor ID, channel ID, channel name, and alarm flags as booleans.
 *
 * @param config - Device sensor configuration with channel alarm flags
 * @returns Union schema for channel alarm entries
 */
function createChannelAlarmSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  const schemas: MappedChannelAlarmSchemaEntries<TTULIP3DeviceConfig> = []

  for (const sensorKey of Object.keys(config) as (keyof TTULIP3DeviceConfig)[]) {
    // if it does not start with 'sensor', skip
    if (!sensorKey.toString().startsWith('sensor')) {
      continue
    }

    const sensorConfig = config[sensorKey]! as any as TULIP3SensorConfig

    for (const channelKey of Object.keys(sensorConfig) as (keyof typeof sensorConfig)[]) {
      // if it does not start with 'channel', skip
      if (!channelKey.toString().startsWith('channel')) {
        continue
      }

      const sensorId = Number.parseInt((sensorKey as string).replace('sensor', '')) - 1
      const channelId = Number.parseInt((channelKey as string).replace('channel', '')) - 1
      const channelConfig = sensorConfig[channelKey]! as TULIP3ChannelConfig
      const channelName = channelConfig.channelName
      const alarmFlags = channelConfig.alarmFlags

      schemas.push(
        v.object({
          sensor: v.literal(sensorKey),
          sensorId: v.literal(sensorId),
          channel: v.literal(channelKey),
          channelId: v.literal(channelId),
          channelName: v.literal(channelName),
          alarmFlags: createGenericAlarmFlagsSchema(alarmFlags),
        }) as any as MappedChannelAlarmSchemaEntries<TTULIP3DeviceConfig>[number],
      )
    }
  }

  const u = v.union(schemas)

  return v.tupleWithRest([u], u)
}

/**
 * Creates validation schema for channel alarm uplink (message 0x13/0x03).
 * Validates array of channel alarm entries with alarm flags per channel.
 *
 * @param config - Device sensor configuration with channel alarm flags
 * @returns Validation schema for channel alarm messages
 */
function createChannelAlarmUplinkOutputSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  return createGenericUplinkOutputSchema({
    messageType: [0x13],
    messageSubType: [0x03],
    extension: {
      channelAlarms: createChannelAlarmSchema(config),
    },
  })
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CommunicationModuleAlarmType<TAlarmFlags extends AlarmFlags> = v.InferOutput<ReturnType<typeof createGenericAlarmFlagsSchema<TAlarmFlags>>>
export type CommunicationModuleAlarmMessageUplinkOutput<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createCommunicationModuleAlarmUplinkOutputSchema<TTULIP3DeviceConfig>>>
export type CommunicationModuleAlarmData<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = CommunicationModuleAlarmMessageUplinkOutput<TTULIP3DeviceConfig>['data']['communicationModuleAlarms']

export type SensorAlarmEntry<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<MappedSensorAlarmSchemaEntries<TTULIP3DeviceConfig>[number]>
export type SensorAlarmMessageUplinkOutput<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createSensorAlarmUplinkOutputSchema<TTULIP3DeviceConfig>>>
export type SensorAlarmData<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = SensorAlarmMessageUplinkOutput<TTULIP3DeviceConfig>['data']['sensorAlarms']

export type ChannelAlarmEntry<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<MappedChannelAlarmSchemaEntries<TTULIP3DeviceConfig>[number]>
export type ChannelAlarmMessageUplinkOutput<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createChannelAlarmUplinkOutputSchema<TTULIP3DeviceConfig>>>
export type ChannelAlarmData<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = ChannelAlarmMessageUplinkOutput<TTULIP3DeviceConfig>['data']['channelAlarms']

export {
  createChannelAlarmUplinkOutputSchema,
  createCommunicationModuleAlarmUplinkOutputSchema,
  createSensorAlarmUplinkOutputSchema,
}
