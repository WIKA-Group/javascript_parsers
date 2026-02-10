import type { BaseSchema } from 'valibot'
import type { TULIP3DownlinkAction, TULIP3DownlinkActionMultiple } from '../../../schemas/tulip3/downlink'
import type { MultipleDownlinkOutput } from '../../../types'
import type { TULIP3DeviceConfig, TULIP3DeviceProfile } from '../profile'
import * as v from 'valibot'
import { createTULIP3DownlinkMultipleSchema } from '../../../schemas/tulip3/downlink'
import { encodeForceCloseSessionComplete, encodeGetAlarmStatusComplete, encodeNewBatteryInsertedComplete, encodeRestoreDefaultConfigurationComplete } from './encodeGeneric'
import { encodeReadWritePipeline } from './encodeReadWritePipeline'

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_BYTE_LIMIT = 51

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Formats an error into MultipleDownlinkOutput failure.
 *
 * @param message - Error message
 * @returns MultipleDownlinkOutput with errors array
 */
function formatMultipleError(message: string): MultipleDownlinkOutput {
  return {
    errors: [message],
  }
}

// =============================================================================
// ENCODER FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates a multiple-frame encoder function for TULIP3 downlink messages.
 * Uses lazy schema initialization and caching for performance.
 * Supports multi-frame sequences with automatic frame numbering and apply-config handling.
 *
 * @param profile - Device profile with configuration
 * @returns Encoder function that takes input and returns MultipleDownlinkOutput
 */
export function createMultipleEncoderFactory<TDeviceConfig extends TULIP3DeviceConfig>(
  profile: TULIP3DeviceProfile<TDeviceConfig>,
): (input: TULIP3DownlinkActionMultiple<TDeviceConfig>) => MultipleDownlinkOutput {
  // Lazy schema caching
  let schema: BaseSchema<unknown, TULIP3DownlinkAction<TDeviceConfig>, any> | undefined

  return (input: TULIP3DownlinkActionMultiple<TDeviceConfig>): MultipleDownlinkOutput => {
    try {
      // Create schema on first call
      if (!schema) {
        schema = createTULIP3DownlinkMultipleSchema(profile.sensorChannelConfig)
      }

      // Validate input
      const result = v.safeParse(schema, input)
      if (!result.success) {
        return formatMultipleError(`Validation failed:\n${v.summarize(result.issues)}`)
      }

      const validatedInput = result.output

      // Extract metadata with defaults
      const byteLimit = validatedInput.metadata?.byteLimit ?? DEFAULT_BYTE_LIMIT
      const startingFrameCounter = validatedInput.metadata?.startingFrameCounter ?? 0
      const autoApplyConfig = validatedInput.metadata?.autoApplyConfig ?? true

      // Route by action
      switch (validatedInput.action) {
        case 'forceCloseSession':
          return encodeForceCloseSessionComplete({ byteLimit })

        case 'restoreDefaultConfiguration':
          return encodeRestoreDefaultConfigurationComplete({ byteLimit })

        case 'newBatteryInserted':
          return encodeNewBatteryInsertedComplete({ byteLimit })

        case 'getAlarmStatus':
          return encodeGetAlarmStatusComplete(
            validatedInput.input,
            profile.sensorChannelConfig,
            { byteLimit },
          )

        case 'readRegisters':
        case 'writeRegisters': {
          const mode = validatedInput.action === 'readRegisters' ? 'read' : 'write'
          return encodeReadWritePipeline(
            mode,
            validatedInput.input as any,
            profile,
            { byteLimit, startingFrameCounter, autoApplyConfig },
          )
        }

        default: {
          // Exhaustive check
          const _exhaustive: never = validatedInput
          throw new Error(`Unknown action: ${(_exhaustive as any).action}`)
        }
      }
    }
    catch (error) {
      return formatMultipleError(error instanceof Error ? error.message : String(error))
    }
  }
}
