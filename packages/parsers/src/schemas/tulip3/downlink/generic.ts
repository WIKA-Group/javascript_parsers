import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../../../codecs/tulip3/profile'
import * as v from 'valibot'

// =============================================================================
// GENERIC COMMAND SCHEMAS (0x03)
// These are straightforward messages with no payload beyond message type
// =============================================================================

/**
 * Force close session message (0x03 0x01)
 *
 * Aborts current downlink process and closes the session.
 * In case of configuration, clears previous exchange of frames of current
 * downlink session if several write configuration messages were exchanged
 * but not applied.
 *
 * Answer: Generic downlink answer message
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createForceCloseSessionSchema() {
  return v.object({})
}

/**
 * Restore default configuration message (0x03 0x02)
 *
 * Replaces user configuration with factory default configuration.
 * Can be used as solution if memory error occurs.
 *
 * Answer: Generic downlink answer message
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createRestoreDefaultConfigurationSchema() {
  return v.object({})
}

/**
 * New battery inserted message (0x03 0x03)
 *
 * Informs CM that battery has been replaced.
 * Resets battery level indicator reported in keep alive message.
 *
 * Answer: Generic downlink answer message
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createNewBatteryInsertedSchema() {
  return v.object({})
}

// =============================================================================
// GENERIC REQUEST SCHEMAS (0x04)
// Profile-dependent request messages
// =============================================================================

/**
 * Mapped type for channel targets within a sensor.
 * Creates optional boolean flags for each channel in the sensor.
 */
type MappedChannelTargets<TSensorConfig extends TULIP3SensorConfig> = {
  [K in keyof TSensorConfig as K extends `channel${number}` ? K : never]:
  TSensorConfig[K] extends TULIP3ChannelConfig
    ? v.OptionalSchema<v.BooleanSchema<undefined>, undefined>
    : never
}

/**
 * Mapped type for sensor targets in the device.
 * Creates optional objects for each sensor containing their channel targets.
 */
export type MappedSensorTargets<TDeviceConfig extends TULIP3DeviceConfig> = {
  [K in keyof TDeviceConfig as K extends `sensor${number}` ? K : never]:
  TDeviceConfig[K] extends TULIP3SensorConfig
    ? v.OptionalSchema<v.ObjectSchema<MappedChannelTargets<TDeviceConfig[K]>, undefined>, undefined>
    : never
}

/**
 * Creates a schema for sensor/channel targets based on device profile.
 * Provides type-safe autocomplete for available sensors and channels.
 *
 * @param config - Device configuration
 * @returns Schema for targets object with sensor/channel structure
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createTargetsSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  const sensorsObj = Object.entries(config).reduce((acc, [sensorKey, sensorConfig]) => {
    if (!sensorKey.startsWith('sensor'))
      return acc

    const sensor = sensorConfig as TULIP3SensorConfig
    const channelsObj = Object.entries(sensor).reduce((channelAcc, [channelKey]) => {
      if (!channelKey.startsWith('channel'))
        return channelAcc

      channelAcc[channelKey as keyof typeof channelAcc] = v.optional(v.boolean()) as any
      return channelAcc
    }, {} as MappedChannelTargets<typeof sensor>)

    acc[sensorKey as keyof typeof acc] = v.optional(v.object(channelsObj as any)) as any
    return acc
  }, {} as MappedSensorTargets<TConfig>)

  return v.object(sensorsObj as MappedSensorTargets<TConfig>)
}

/**
 * Get alarm status message (0x04 0x01)
 *
 * Requests current alarm status of selected alarm types and optionally
 * specific sensors/channels.
 *
 * Responses (depending on requested alarms):
 * - Process alarm status: Process alarm message
 * - CM alarm status: CM alarm message
 * - Sensor alarm status: Sensor alarm message
 * - Channel alarm status: Channel alarm message
 * - Error: Generic downlink answer message
 *
 * If multiple alarm types requested, CM replies each status independently.
 * If targets not specified, returns status for all connected sensors/channels.
 *
 * Note: Disabled (not sampled) channels report inactive alarm status (false).
 * Process alarms of disabled channels also report inactive status.
 *
 * @param config - Device configuration (for profile-aware validation)
 * @returns Schema for get alarm status input
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createGetAlarmStatusSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.object({
    /** Request process alarm status */
    processAlarmRequested: v.optional(v.boolean()),
    /** Request CM alarm status */
    cmAlarmRequested: v.optional(v.boolean()),
    /** Request sensor alarm status */
    sensorAlarmRequested: v.optional(v.boolean()),
    /** Request channel alarm status */
    channelAlarmRequested: v.optional(v.boolean()),
    /**
     * Optional sensor/channel targets using profile-aware structure.
     * If omitted, all existing sensors and channels will be queried.
     *
     * Example:
     * ```typescript
     * targets: {
     *   sensor1: {
     *     channel1: true,
     *     channel2: true
     *   },
     *   sensor2: {
     *     channel1: true
     *   }
     * }
     * ```
     */
    targets: v.optional(createTargetsSchema(config)),
  })
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ForceCloseSessionInput = v.InferOutput<ReturnType<typeof createForceCloseSessionSchema>>
export type RestoreDefaultConfigurationInput = v.InferOutput<ReturnType<typeof createRestoreDefaultConfigurationSchema>>
export type NewBatteryInsertedInput = v.InferOutput<ReturnType<typeof createNewBatteryInsertedSchema>>
export type GetAlarmStatusInput<TConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createGetAlarmStatusSchema<TConfig>>>

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createForceCloseSessionSchema,
  createGetAlarmStatusSchema,
  createNewBatteryInsertedSchema,
  createRestoreDefaultConfigurationSchema,
}
