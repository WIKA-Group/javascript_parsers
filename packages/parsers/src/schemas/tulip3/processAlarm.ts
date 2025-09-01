/* eslint-disable ts/explicit-function-return-type */
import type { TULIP3DeviceSensorConfig } from '../../codecs/tulip3/profile'
import * as v from 'valibot'
import { createGenericUplinkOutputSchema, createSensorChannelSchemaWithExtension } from './index'

// =============================================================================
// BASE TYPE SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for process alarm type byte.
 *
 * This is a bitfield where bits indicate which alarms are active:
 * - 7: Low threshold alarm
 * - 6: High threshold alarm
 * - 5: Falling slope alarm
 * - 4: Rising slope alarm
 * - 3: Low threshold with delay alarm
 * - 2: High threshold with delay alarm
 * - 1-0: RFU
 *
 * @returns A Valibot object describing the alarms as booleans
 * @example
 * ```ts
 * const schema = createProcessAlarmTypeSchema()
 * const parsed = v.parse(schema, { lowThreshold: true, highThreshold: false, fallingSlope: false, risingSlope: false, lowThresholdWithDelay: false, highThresholdWithDelay: false })
 * ```
 */
export function createProcessAlarmTypeSchema() {
  // Represent the bitfield as explicit booleans in the parsed structure
  return v.object({
    lowThreshold: v.boolean(), // bit 7
    highThreshold: v.boolean(), // bit 6
    fallingSlope: v.boolean(), // bit 5
    risingSlope: v.boolean(), // bit 4
    lowThresholdWithDelay: v.boolean(), // bit 3
    highThresholdWithDelay: v.boolean(), // bit 2
  })
}

// =============================================================================
// PROCESS ALARM MEASUREMENT SCHEMA
// =============================================================================

/**
 * Creates a validation schema for process alarm entries per sensor/channel WITHOUT `sourceDataType`.
 * Each entry includes sensor/channel identification and the alarm bitfield expanded into booleans.
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @returns Array of Valibot object schemas, one per sensor/channel
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 * @see {@link createFullSensorChannelSchemaWithExtension} for the variant WITH `sourceDataType`.
 */
export function createProcessAlarmEntrySchemas<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(config: TTULIP3DeviceSensorConfig) {
  return createSensorChannelSchemaWithExtension(config, {
    alarmFlags: createProcessAlarmTypeSchema(),
  })
}

// =============================================================================
// PROCESS ALARM MESSAGE SCHEMA
// =============================================================================

/**
 * Creates a validation schema for process alarm message uplink output (message type 0x12, subtype 0x01).
 *
 * Behavior summary:
 * - Sent when a process alarm on a channel appears or turns off; affected channels included
 * - Sent on cloud request  for all or selected channels
 * - Disabled alarms are also reported with false=0
 * - Requires acknowledgement by the network server
 *
 * Payload:
 * - messageType: 0x12
 * - messageSubType: 0x01
 * - alarms: array of sensor/channel entries with alarm bitfields
 *
 * @param config - Device sensor configuration mapping sensors to channels
 * @returns A Valibot object schema for process alarm uplink output
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 * @example
 * ```ts
 * const config = { sensor1: { channel1: {} } } as const
 * const schema = createProcessAlarmUplinkOutputSchema(config)
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x12,
 *     messageSubType: 0x01,
 *     processAlarms: [
 *       {
 *         sensor: 'sensor1', sensorId: 0,
 *         channel: 'channel1', channelId: 0,
 *         alarmFlags: {
 *           lowThreshold: true,
 *           highThreshold: false,
 *           fallingSlope: false,
 *           risingSlope: false,
 *           lowThresholdWithDelay: false,
 *           highThresholdWithDelay: false,
 *         },
 *       },
 *     ],
 *   },
 * })
 * ```
 */
export function createProcessAlarmUplinkOutputSchema<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(config: TTULIP3DeviceSensorConfig) {
  return createGenericUplinkOutputSchema({
    messageType: [0x12],
    messageSubType: [0x01],
    extension: {
      processAlarms: v.tupleWithRest([v.union(createProcessAlarmEntrySchemas(config))], v.union(createProcessAlarmEntrySchemas(config))),
    },
  })
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ProcessAlarmEntry<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = v.InferOutput<ReturnType<typeof createProcessAlarmEntrySchemas<TTULIP3DeviceSensorConfig>>[number]>
export type ProcessAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = v.InferOutput<ReturnType<typeof createProcessAlarmUplinkOutputSchema<TTULIP3DeviceSensorConfig>>>
export type ProcessAlarmData<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = ProcessAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig>['data']['processAlarms']
