import type { TULIP3DeviceConfig } from '../../../codecs/tulip3/profile'
import type { ReadSingleInputData } from './read'
import type { WriteSingleInputData } from './write'
import * as v from 'valibot'
import { createGetAlarmStatusSchema } from './generic'
import { createReadInputDataMultipleSchema, createReadInputDataSingleSchema } from './read'
import { createWriteInputDataMultipleSchema, createWriteInputDataSingleSchema } from './write'

// =============================================================================
// METADATA SCHEMA
// Common metadata for all downlink messages
// =============================================================================

/**
 * Metadata schema for TULIP3 downlink messages.
 * Contains configuration for frame assembly and encoding behavior.
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function createDownlinkMetadataSchema() {
  return v.object({
    /**
     * Maximum byte size per downlink frame (including headers).
     * Minimum 11 bytes (LoRaWAN requirement). Default: 51 bytes.
     */
    byteLimit: v.optional(v.pipe(
      v.number(),
      v.integer(),
      v.minValue(11),
    )),
    /**
     * Starting frame counter for multi-frame messages.
     * Range: 0-31 (5-bit counter in frame number byte, bits 6-2).
     * Default: 0.
     */
    startingFrameCounter: v.optional(v.pipe(
      v.number(),
      v.integer(),
      v.minValue(0),
      v.maxValue(31),
    )),
    /**
     * Automatically set apply-config bit (bit 7) on last frame of write sequences.
     * Set to false if sending partial configuration that will be applied later.
     * Default: true for write modes.
     */
    autoApplyConfig: v.optional(v.boolean()),
  })
}

// =============================================================================
// ACTION-SPECIFIC SCHEMAS
// Each downlink action has its own schema with discriminator field
// =============================================================================

/**
 * Read registers action (Multiple variant)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createReadRegistersActionMultipleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.object({
    action: v.literal('readRegisters'),
    metadata: v.optional(createDownlinkMetadataSchema()),
    input: createReadInputDataMultipleSchema(config),
  })
}

/**
 * Read registers action (Single variant)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createReadRegistersActionSingleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.object({
    action: v.literal('readRegisters'),
    metadata: v.optional(createDownlinkMetadataSchema()),
    input: createReadInputDataSingleSchema(config),
  })
}

/**
 * Write registers action (Multiple variant)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createWriteRegistersActionMultipleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.object({
    action: v.literal('writeRegisters'),
    metadata: v.optional(createDownlinkMetadataSchema()),
    input: createWriteInputDataMultipleSchema(config),
  })
}

/**
 * Write registers action (Single variant)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createWriteRegistersActionSingleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.object({
    action: v.literal('writeRegisters'),
    metadata: v.optional(createDownlinkMetadataSchema()),
    input: createWriteInputDataSingleSchema(config),
  })
}

/**
 * Force close session action (0x03 0x01)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createForceCloseSessionActionSchema() {
  return v.object({
    action: v.literal('forceCloseSession'),
    metadata: v.optional(createDownlinkMetadataSchema()),
  })
}

/**
 * Restore default configuration action (0x03 0x02)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createRestoreDefaultConfigurationActionSchema() {
  return v.object({
    action: v.literal('restoreDefaultConfiguration'),
    metadata: v.optional(createDownlinkMetadataSchema()),
  })
}

/**
 * New battery inserted action (0x03 0x03)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createNewBatteryInsertedActionSchema() {
  return v.object({
    action: v.literal('newBatteryInserted'),
    metadata: v.optional(createDownlinkMetadataSchema()),
  })
}

/**
 * Get alarm status action (0x04 0x01)
 */
// eslint-disable-next-line ts/explicit-function-return-type
function createGetAlarmStatusActionSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.object({
    action: v.literal('getAlarmStatus'),
    metadata: v.optional(createDownlinkMetadataSchema()),
    input: createGetAlarmStatusSchema(config),
  })
}

// =============================================================================
// MAIN DOWNLINK SCHEMA FACTORIES
// Discriminated union of all possible downlink actions
// =============================================================================

/**
 * Creates the TULIP3 downlink schema for single encode() (Single variant).
 * - readRegisters/writeRegisters use Single schemas (identification OR configuration)
 * - Generic actions remain the same
 *
 * Actions:
 * - readRegisters: Read identification OR configuration registers (not both)
 * - writeRegisters: Write identification OR configuration registers (not both)
 * - forceCloseSession: Abort current downlink session (0x03 0x01)
 * - restoreDefaultConfiguration: Reset to factory defaults (0x03 0x02)
 * - newBatteryInserted: Reset battery level indicator (0x03 0x03)
 * - getAlarmStatus: Request alarm status (0x04 0x01)
 *
 * @param config - Device configuration for profile-aware validation
 * @returns Discriminated union schema for single-frame downlink actions
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3DownlinkSingleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.variant('action', [
    createReadRegistersActionSingleSchema(config),
    createWriteRegistersActionSingleSchema(config),
    createForceCloseSessionActionSchema(),
    createRestoreDefaultConfigurationActionSchema(),
    createNewBatteryInsertedActionSchema(),
    createGetAlarmStatusActionSchema(config),
  ])
}

/**
 * Creates the TULIP3 downlink schema for encodeMultiple() (Multiple variant).
 * - readRegisters/writeRegisters use Multiple schemas (allows both identification AND configuration)
 * - Generic actions remain the same
 *
 * Actions:
 * - readRegisters: Read identification and/or configuration registers
 * - writeRegisters: Write identification and/or configuration registers
 * - forceCloseSession: Abort current downlink session (0x03 0x01)
 * - restoreDefaultConfiguration: Reset to factory defaults (0x03 0x02)
 * - newBatteryInserted: Reset battery level indicator (0x03 0x03)
 * - getAlarmStatus: Request alarm status (0x04 0x01)
 *
 * @param config - Device configuration for profile-aware validation
 * @returns Discriminated union schema for multi-frame downlink actions
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3DownlinkMultipleSchema<const TConfig extends TULIP3DeviceConfig>(config: TConfig) {
  return v.variant('action', [
    createReadRegistersActionMultipleSchema(config),
    createWriteRegistersActionMultipleSchema(config),
    createForceCloseSessionActionSchema(),
    createRestoreDefaultConfigurationActionSchema(),
    createNewBatteryInsertedActionSchema(),
    createGetAlarmStatusActionSchema(config),
  ])
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Input-only types (without action/metadata wrapper)
export type {
  ForceCloseSessionInput,
  GetAlarmStatusInput,
  NewBatteryInsertedInput,
  RestoreDefaultConfigurationInput,
} from './generic'
export type { ReadMultipleInputData, ReadSingleInputData } from './read'
export type { WriteMultipleInputData, WriteSingleInputData } from './write'

// Complete action types (with action/metadata wrapper) - Multiple variant
export type ReadRegistersAction<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createReadRegistersActionMultipleSchema<TConfig>>>

export type WriteRegistersAction<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createWriteRegistersActionMultipleSchema<TConfig>>>

export type ForceCloseSessionAction
  = v.InferOutput<ReturnType<typeof createForceCloseSessionActionSchema>>

export type RestoreDefaultConfigurationAction
  = v.InferOutput<ReturnType<typeof createRestoreDefaultConfigurationActionSchema>>

export type NewBatteryInsertedAction
  = v.InferOutput<ReturnType<typeof createNewBatteryInsertedActionSchema>>

export type GetAlarmStatusAction<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createGetAlarmStatusActionSchema<TConfig>>>

// Union of all downlink actions (Multiple variant - legacy/default)
export type TULIP3DownlinkAction<TConfig extends TULIP3DeviceConfig>
  = | ReadRegistersAction<TConfig>
    | WriteRegistersAction<TConfig>
    | ForceCloseSessionAction
    | RestoreDefaultConfigurationAction
    | NewBatteryInsertedAction
    | GetAlarmStatusAction<TConfig>

// =============================================================================
// SCHEMA-DERIVED TYPES
// Types inferred directly from schema factories
// =============================================================================

/**
 * Type inferred from Single schema factory.
 * For use with encode() function.
 */
export type TULIP3DownlinkInputSingle<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createTULIP3DownlinkSingleSchema<TConfig>>>

/**
 * Type inferred from Multiple schema factory.
 * For use with encodeMultiple() function.
 */
export type TULIP3DownlinkInputMultiple<TConfig extends TULIP3DeviceConfig>
  = v.InferOutput<ReturnType<typeof createTULIP3DownlinkMultipleSchema<TConfig>>>

// =============================================================================
// SINGLE-ENCODE ACTION TYPES
// Types for encode() that enforce single-frame constraints (identification OR configuration)
// =============================================================================

/**
 * Read registers action for single encode (identification-only OR configuration-only).
 * Uses ReadSingleInputData which enforces the constraint that both cannot be present.
 */
export interface ReadRegistersActionSingle<TConfig extends TULIP3DeviceConfig> {
  action: 'readRegisters'
  metadata?: v.InferOutput<ReturnType<typeof createDownlinkMetadataSchema>>
  input: ReadSingleInputData<TConfig>
}

/**
 * Write registers action for single encode (identification-only OR configuration-only).
 * Uses WriteSingleInputData which enforces the constraint that both cannot be present.
 */
export interface WriteRegistersActionSingle<TConfig extends TULIP3DeviceConfig> {
  action: 'writeRegisters'
  metadata?: v.InferOutput<ReturnType<typeof createDownlinkMetadataSchema>>
  input: WriteSingleInputData<TConfig>
}

// =============================================================================
// ACTION UNION TYPES FOR encode() AND encodeMultiple()
// =============================================================================

/**
 * Union of all downlink actions for single encode() function.
 * - readRegisters/writeRegisters use Single variants (identification-only OR configuration-only)
 * - Generic actions (forceCloseSession, etc.) appear here as they work the same for single/multiple
 * - getAlarmStatus appears here (small enough to always be single frame)
 *
 * Note: Protocol discrimination is handled at the codec/parser layer via the codec's protocol field.
 * These action types do not include a protocol field - that is added by the parser when routing to codecs.
 */
export type TULIP3DownlinkActionSingle<TConfig extends TULIP3DeviceConfig>
  = | ReadRegistersActionSingle<TConfig>
    | WriteRegistersActionSingle<TConfig>
    | ForceCloseSessionAction
    | RestoreDefaultConfigurationAction
    | NewBatteryInsertedAction
    | GetAlarmStatusAction<TConfig>

/**
 * Union of all downlink actions for encodeMultiple() function.
 * - readRegisters/writeRegisters use Multiple variants (allows both identification AND configuration)
 * - Generic actions (forceCloseSession, etc.) appear here as they work the same for single/multiple
 * - getAlarmStatus appears here (small enough to always be single frame)
 *
 * Note: Protocol discrimination is handled at the codec/parser layer via the codec's protocol field.
 * These action types do not include a protocol field - that is added by the parser when routing to codecs.
 */
export type TULIP3DownlinkActionMultiple<TConfig extends TULIP3DeviceConfig>
  = | ReadRegistersAction<TConfig>
    | WriteRegistersAction<TConfig>
    | ForceCloseSessionAction
    | RestoreDefaultConfigurationAction
    | NewBatteryInsertedAction
    | GetAlarmStatusAction<TConfig>
