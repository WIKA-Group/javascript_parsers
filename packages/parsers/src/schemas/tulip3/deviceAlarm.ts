/* eslint-disable ts/explicit-function-return-type */
import type { DeviceAlarmFlags, TULIP3DeviceSensorConfig } from '../../codecs/tulip3/profile'
import * as v from 'valibot'
import { createSensorChannelSchemaWithExtension, createSensorMeasurementSchemaWithExtension } from '.'
import { createGenericUplinkOutputSchema } from './_shared'

// =============================================================================
// BASE TYPE SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for communication module alarm flags bitfield.
 *
 * Bit mapping (MSB=15, LSB=0) for the `alarmFlags` object:
 * - 15-7: RFU
 * - 6: High voltage
 * - 5: Low voltage
 * - 4: Memory error
 * - 3: Air time limitation
 * - 2: CM chip high temperature
 * - 1: CM chip low temperature
 * - 0: Local user access denied
 *
 * @returns A Valibot object schema containing an `alarmFlags` property with booleans
 */
function createGenericAlarmFlagsSchema<const TDeviceAlarmFlags extends DeviceAlarmFlags>(flags: TDeviceAlarmFlags) {
  const keys = Object.keys(flags) as (keyof DeviceAlarmFlags)[]

  const obj = keys.reduce((acc, key) => {
    acc[key as keyof TDeviceAlarmFlags] = v.boolean()
    return acc
  }, {} as Record<keyof TDeviceAlarmFlags, v.BooleanSchema<undefined>>)

  return v.object(obj)
}

// =============================================================================
// DEVICE ALARM MESSAGE SCHEMA
// =============================================================================

/**
 * Creates a validation schema for device alarm uplink output (message type 0x13, subtype 0x01).
 *
 * Behavior summary:
 * - Sent when a communication module alarm appears or turns off
 * - Sent on cloud request
 * - Alarms are always enabled
 * - Requires acknowledgement by the network server
 *
 * Payload:
 * - messageType: 0x13
 * - messageSubType: 0x01
 * - communicationModuleAlarms: object with `alarmFlags` bitfield expanded into booleans
 *
 * @returns A Valibot object schema for device alarm uplink output with `communicationModuleAlarms`
 * @example
 * ```ts
 * const schema = createDeviceAlarmUplinkOutputSchema()
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x13,
 *     messageSubType: 0x01,
 *     communicationModuleAlarms: {
 *       alarmFlags: {
 *         highVoltage: false,
 *         lowVoltage: false,
 *         memoryError: false,
 *         airTimeLimitation: false,
 *         chipHighTemperature: false,
 *         chipLowTemperature: false,
 *         localUserAccessDenied: false,
 *       },
 *     },
 *   },
 * })
 * ```
 */
function createCommunicationModuleAlarmUplinkOutputSchema<const TDeviceAlarmFlags extends DeviceAlarmFlags>(flags: TDeviceAlarmFlags) {
  return createGenericUplinkOutputSchema({
    messageType: [0x13],
    messageSubType: [0x01],
    extension: {
      communicationModuleAlarms: v.object({
        alarmFlags: createGenericAlarmFlagsSchema(flags),
      }),
    },
  })
}

// =============================================================================
// SENSOR ALARM MEASUREMENT SCHEMA
// =============================================================================

/**
 * Creates a validation schema for sensor alarm entries per sensor WITHOUT channels.
 * Each entry includes sensor identification and the alarm bitfield expanded into booleans.
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @returns Array of Valibot object schemas, one per sensor
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 */
function createSensorAlarmEntrySchemas<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TDeviceAlarmFlags extends DeviceAlarmFlags>(config: TTULIP3DeviceSensorConfig, flags: TDeviceAlarmFlags) {
  return createSensorMeasurementSchemaWithExtension(config, {
    alarmFlags: createGenericAlarmFlagsSchema(flags),
  })
}

/**
 * Creates a validation schema for sensor alarm message uplink output (message type 0x13, subtype 0x02).
 *
 * Behavior summary:
 * - Sent when a sensor alarm appears or turns off; affected sensors included
 * - Sent on cloud request  for all or selected sensors
 * - Sensor alarms are always enabled and cannot be configured by the end-user
 * - Requires acknowledgement by the network server
 *
 * Payload:
 * - messageType: 0x13
 * - messageSubType: 0x02
 * - sensorAlarms: array of sensor entries with alarm bitfields
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @param flags - Device alarm flags configuration
 * @returns A Valibot object schema for sensor alarm uplink output
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 * @template TDeviceAlarmFlags - Type-safe alarm flags configuration
 * @example
 * ```ts
 * const config = { sensor1: { channel1: {} }, sensor2: { channel1: {} } } as const
 * const flags = { sensorNotSupported: 1, sensorCommunicationError: 0 } as const
 * const schema = createSensorAlarmUplinkOutputSchema(config, flags)
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x13,
 *     messageSubType: 0x02,
 *     sensorAlarms: [
 *       {
 *         sensor: 'sensor1',
 *         sensorId: 0,
 *         alarmFlags: {
 *           sensorNotSupported: false,
 *           sensorCommunicationError: true,
 *         },
 *       },
 *     ],
 *   },
 * })
 * ```
 */
function createSensorAlarmUplinkOutputSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TDeviceAlarmFlags extends DeviceAlarmFlags>(config: TTULIP3DeviceSensorConfig, flags: TDeviceAlarmFlags) {
  return createGenericUplinkOutputSchema({
    messageType: [0x13],
    messageSubType: [0x02],
    extension: {
      sensorAlarms: v.tupleWithRest([v.union(createSensorAlarmEntrySchemas(config, flags))], v.union(createSensorAlarmEntrySchemas(config, flags))),
    },
  })
}

// =============================================================================
// CHANNEL ALARM MEASUREMENT SCHEMA
// =============================================================================

/**
 * Creates a validation schema for channel alarm entries per sensor/channel combination.
 * Each entry includes sensor/channel identification and the alarm bitfield expanded into booleans.
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @returns Array of Valibot object schemas, one per sensor/channel
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 */
function createChannelAlarmEntrySchemas<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TDeviceAlarmFlags extends DeviceAlarmFlags>(config: TTULIP3DeviceSensorConfig, flags: TDeviceAlarmFlags) {
  return createSensorChannelSchemaWithExtension(config, {
    alarmFlags: createGenericAlarmFlagsSchema(flags),
  })
}

/**
 * Creates a validation schema for channel alarm message uplink output (message type 0x13, subtype 0x03).
 *
 * Behavior summary:
 * - Sent when a channel alarm appears or turns off; affected channels included
 * - Sent on cloud request  for all or selected channels
 * - Channel alarms are always enabled and cannot be configured by the end-user
 * - Disabled (not sampled) channels are also shown as inactive (false=0)
 * - Requires acknowledgement by the network server
 *
 * Payload:
 * - messageType: 0x13
 * - messageSubType: 0x03
 * - channelAlarms: array of sensor/channel entries with alarm bitfields
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @param flags - Device alarm flags configuration
 * @returns A Valibot object schema for channel alarm uplink output
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 * @template TDeviceAlarmFlags - Type-safe alarm flags configuration
 * @example
 * ```ts
 * const config = { sensor1: { channel1: {} }, sensor2: { channel1: {} } } as const
 * const flags = { outOfMaxPhysicalSensorLimit: 5, outOfMinPhysicalSensorLimit: 4, outOfMaxMeasurementRange: 3, outOfMinMeasurementRange: 2, openCondition: 1, shortCondition: 0 } as const
 * const schema = createChannelAlarmUplinkOutputSchema(config, flags)
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x13,
 *     messageSubType: 0x03,
 *     channelAlarms: [
 *       {
 *         sensor: 'sensor1',
 *         sensorId: 0,
 *         channel: 'channel1',
 *         channelId: 0,
 *         channelName: "temperature",
 *         alarmFlags: {
 *           outOfMaxPhysicalSensorLimit: false,
 *           outOfMinPhysicalSensorLimit: false,
 *           outOfMaxMeasurementRange: false,
 *           outOfMinMeasurementRange: false,
 *           openCondition: false,
 *           shortCondition: true,
 *         },
 *       },
 *     ],
 *   },
 * })
 * ```
 */
function createChannelAlarmUplinkOutputSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TDeviceAlarmFlags extends DeviceAlarmFlags>(config: TTULIP3DeviceSensorConfig, flags: TDeviceAlarmFlags) {
  return createGenericUplinkOutputSchema({
    messageType: [0x13],
    messageSubType: [0x03],
    extension: {
      channelAlarms: v.tupleWithRest([v.union(createChannelAlarmEntrySchemas(config, flags))], v.union(createChannelAlarmEntrySchemas(config, flags))),
    },
  })
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CommunicationModuleAlarmType<TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createGenericAlarmFlagsSchema<TDeviceAlarmFlags>>>
export type CommunicationModuleAlarmMessageUplinkOutput<TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createCommunicationModuleAlarmUplinkOutputSchema<TDeviceAlarmFlags>>>
export type CommunicationModuleAlarmData<TDeviceAlarmFlags extends DeviceAlarmFlags> = CommunicationModuleAlarmMessageUplinkOutput<TDeviceAlarmFlags>['data']['communicationModuleAlarms']

export type SensorAlarmType<TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createGenericAlarmFlagsSchema<TDeviceAlarmFlags>>>
export type SensorAlarmEntry<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createSensorAlarmEntrySchemas<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>>[number]>
export type SensorAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createSensorAlarmUplinkOutputSchema<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>>>
export type SensorAlarmData<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, TDeviceAlarmFlags extends DeviceAlarmFlags> = SensorAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>['data']['sensorAlarms']

export type ChannelAlarmType<TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createGenericAlarmFlagsSchema<TDeviceAlarmFlags>>>
export type ChannelAlarmEntry<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createChannelAlarmEntrySchemas<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>>[number]>
export type ChannelAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, TDeviceAlarmFlags extends DeviceAlarmFlags> = v.InferOutput<ReturnType<typeof createChannelAlarmUplinkOutputSchema<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>>>
export type ChannelAlarmData<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, TDeviceAlarmFlags extends DeviceAlarmFlags> = ChannelAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>['data']['channelAlarms']

export {
  createChannelAlarmUplinkOutputSchema,
  createCommunicationModuleAlarmUplinkOutputSchema,
  createSensorAlarmUplinkOutputSchema,
}
