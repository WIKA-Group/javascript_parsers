/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createGenericUplinkOutputSchema } from './index'

// =============================================================================
// BASE TYPE SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for keep alive status byte when battery level computation is enabled.
 *
 * This is a bitfield where bits indicate device status:
 * - 7: Main powered (0 = battery powered, 1 = main powered)
 * - 6: Is able to compute battery level = true (battery level will be present)
 * - 5: CM restart since last keep alive message
 * - 4-0: RFU (Reserved for Future Use)
 *
 * @returns A Valibot object describing the status with ableToComputeBatteryLevel: true
 * @example
 * ```ts
 * const schema = createKeepAliveStatusWithBatterySchema()
 * const parsed = v.parse(schema, {
 *   mainPowered: true,
 *   ableToComputeBatteryLevel: true,
 *   hasCommunicationModuleRestarted: false
 * })
 * ```
 */
export function createKeepAliveStatusWithBatterySchema() {
  return v.object({
    mainPowered: v.boolean(), // bit 7
    ableToComputeBatteryLevel: v.literal(true), // bit 6
    hasCommunicationModuleRestarted: v.boolean(), // bit 5
  })
}

/**
 * Creates a validation schema for keep alive status byte when battery level computation is disabled.
 *
 * This is a bitfield where bits indicate device status:
 * - 7: Main powered (0 = battery powered, 1 = main powered)
 * - 6: Is able to compute battery level = false (battery level will not be present)
 * - 5: CM restart since last keep alive message
 * - 4-0: RFU (Reserved for Future Use)
 *
 * @returns A Valibot object describing the status with ableToComputeBatteryLevel: false
 * @example
 * ```ts
 * const schema = createKeepAliveStatusWithoutBatterySchema()
 * const parsed = v.parse(schema, {
 *   mainPowered: true,
 *   ableToComputeBatteryLevel: false,
 *   hasCommunicationModuleRestarted: false
 * })
 * ```
 */
export function createKeepAliveStatusWithoutBatterySchema() {
  return v.object({
    mainPowered: v.boolean(), // bit 7
    ableToComputeBatteryLevel: v.literal(false), // bit 6
    hasCommunicationModuleRestarted: v.boolean(), // bit 5
  })
}

/**
 * Creates a validation schema for keep alive data with battery level included.
 * Used when the device can compute battery level (bit 6 = 1).
 *
 * @returns A Valibot object schema for keep alive data with battery level
 * @example
 * ```ts
 * const schema = createKeepAliveDataWithBatterySchema()
 * const parsed = v.parse(schema, {
 *   status: { mainPowered: false, ableToComputeBatteryLevel: true, hasCommunicationModuleRestarted: false },
 *   revisionCounter: 12345,
 *   batteryLevel: 85
 * })
 * ```
 */
export function createKeepAliveDataWithBatterySchema() {
  return v.object({
    status: createKeepAliveStatusWithBatterySchema(),
    revisionCounter: v.number(),
    batteryLevel: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
  })
}

/**
 * Creates a validation schema for keep alive data without battery level.
 * Used when the device cannot compute battery level (bit 6 = 0).
 *
 * @returns A Valibot object schema for keep alive data without battery level
 * @example
 * ```ts
 * const schema = createKeepAliveDataWithoutBatterySchema()
 * const parsed = v.parse(schema, {
 *   status: { mainPowered: true, ableToComputeBatteryLevel: false, hasCommunicationModuleRestarted: false },
 *   revisionCounter: 12345,
 *   batteryLevel: undefined
 * })
 * ```
 */
export function createKeepAliveDataWithoutBatterySchema() {
  return v.object({
    status: createKeepAliveStatusWithoutBatterySchema(),
    revisionCounter: v.number(),
    batteryLevel: v.optional(v.undefined()),
  })
}

// =============================================================================
// KEEP ALIVE MESSAGE SCHEMA
// =============================================================================

/**
 * Creates a validation schema for keep alive message uplink output (message type 0x16, subtype 0x01).
 *
 * Behavior summary:
 * - Transmitted every 24 hours (not configurable)
 * - Always requires acknowledgement from the network server
 *
 * Payload:
 * - messageType: 0x16 (Periodic event)
 * - messageSubType: 0x01 (Keep alive message)
 * - status: Status byte with power, battery computation, and restart flags
 * - revisionCounter: 2-byte revision counter for local configuration changes
 * - batteryLevel: 1-byte battery level in % (present only if able to compute battery level)
 *
 * @returns A Valibot object schema for keep alive uplink output
 * @example
 * ```ts
 * const schema = createKeepAliveUplinkOutputSchema()
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x16,
 *     messageSubType: 0x01,
 *     status: {
 *       mainPowered: false,
 *       ableToComputeBatteryLevel: true,
 *       hasCommunicationModuleRestarted: false,
 *     },
 *     revisionCounter: 12345,
 *     batteryLevel: 85,
 *   },
 * })
 * ```
 */
export function createKeepAliveUplinkOutputSchema() {
  return createGenericUplinkOutputSchema({
    messageType: [0x16],
    messageSubType: [0x01],
    extension: {
      keepAliveData: v.union([
        createKeepAliveDataWithBatterySchema(),
        createKeepAliveDataWithoutBatterySchema(),
      ]),
    },
  })
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type KeepAliveStatusWithBattery = v.InferOutput<ReturnType<typeof createKeepAliveStatusWithBatterySchema>>
export type KeepAliveStatusWithoutBattery = v.InferOutput<ReturnType<typeof createKeepAliveStatusWithoutBatterySchema>>
export type KeepAliveMessageUplinkOutput = v.InferOutput<ReturnType<typeof createKeepAliveUplinkOutputSchema>>
