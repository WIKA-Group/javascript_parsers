import type * as v from 'valibot'
import type { createDownlinkMetadataSchema } from '../../../schemas/tulip3/downlink'
import type { ReadMultipleInputData } from '../../../schemas/tulip3/downlink/read'
import type { WriteMultipleInputData } from '../../../schemas/tulip3/downlink/write'
import type { MultipleDownlinkOutput } from '../../../types'
import type { TULIP3DeviceConfig, TULIP3DeviceProfile } from '../profile'
import { MESSAGE_TYPE_CONFIGURATION, MESSAGE_TYPE_IDENTIFICATION, SUB_TYPE_READ, SUB_TYPE_WRITE, TULIP3_FPORT } from './constants'
import { encodeReadWriteFactory } from './encodeReadWrite'
import { assembleReadFrames, assembleWriteFrames } from './frameAssembly'
import { packCommands } from './utils'

type EncodePipelineMetadata = Required<v.InferOutput<ReturnType<typeof createDownlinkMetadataSchema>>>

/**
 * Complete read/write encoding pipeline for TULIP3 register operations.
 * Handles both identification and configuration sequences independently.
 *
 * Architecture:
 * - Identification and configuration are processed as completely independent sequences
 * - Each sequence starts frame counter at startingFrameCounter
 * - Each sequence has its own apply flag on the last frame (write mode only)
 * - Sequences cannot be mixed in the frame stream
 * - Output order: identification frames first, then configuration frames
 *
 * @param mode - 'read' or 'write' mode
 * @param input - Validated input data for read or write operation
 * @param profile - Device profile with configuration
 * @param metadata - Encoding metadata (byteLimit, startingFrameCounter, autoApplyConfig)
 * @returns MultipleDownlinkOutput with frames and fPort
 * @throws Error if no registers selected, frame count exceeds available slots, or frames exceed byte limit
 */
export function encodeReadWritePipeline<TDeviceConfig extends TULIP3DeviceConfig>(
  mode: 'read' | 'write',
  input: ReadMultipleInputData<TDeviceConfig> | WriteMultipleInputData<TDeviceConfig>,
  profile: TULIP3DeviceProfile<TDeviceConfig>,
  metadata: EncodePipelineMetadata,
): MultipleDownlinkOutput {
  const { byteLimit, startingFrameCounter, autoApplyConfig } = metadata

  // Get register commands from factory
  const registerCommands = encodeReadWriteFactory(profile)
  const { identification, configuration } = registerCommands(mode, input as any)

  const allFrames: number[][] = []

  // Calculate payload budget based on mode
  // Read: byteLimit - 2 (messageType + subMessageType per spec)
  // Write: byteLimit - 3 (messageType + subMessageType + applyByte per spec)
  const payloadBudget = mode === 'read'
    ? byteLimit - 2 // type + subType
    : byteLimit - 3 // type + subType + applyByte

  // ============================================================================
  // Process Identification Sequence (independent)
  // ============================================================================
  if (identification.length > 0) {
    const packets = packCommands(mode, identification as any, payloadBudget)

    // Validate frame count doesn't exceed available slots
    if (packets.length > 32 - startingFrameCounter) {
      throw new Error(
        `Identification sequence requires ${packets.length} frames but only ${32 - startingFrameCounter} slots available `
        + `(starting from frame ${startingFrameCounter}, max frame counter is 31). `
        + `Consider splitting into multiple encode() calls with smaller register sets, or start a new session without specifying startingFrameCounter.`,
      )
    }

    // Assemble frames based on mode
    const frames = mode === 'read'
      ? assembleReadFrames(MESSAGE_TYPE_IDENTIFICATION, SUB_TYPE_READ, packets)
      : assembleWriteFrames(MESSAGE_TYPE_IDENTIFICATION, SUB_TYPE_WRITE, packets, startingFrameCounter, autoApplyConfig)

    allFrames.push(...frames)
  }

  // ============================================================================
  // Process Configuration Sequence (independent)
  // ============================================================================
  if (configuration.length > 0) {
    const packets = packCommands(mode, configuration as any, payloadBudget)

    // Validate frame count doesn't exceed available slots
    if (packets.length > 32 - startingFrameCounter) {
      throw new Error(
        `Configuration sequence requires ${packets.length} frames but only ${32 - startingFrameCounter} slots available `
        + `(starting from frame ${startingFrameCounter}, max frame counter is 31). `
        + `Consider splitting into multiple encode() calls with smaller register sets, or start a new session without specifying startingFrameCounter.`,
      )
    }

    // Assemble frames based on mode
    const frames = mode === 'read'
      ? assembleReadFrames(MESSAGE_TYPE_CONFIGURATION, SUB_TYPE_READ, packets)
      : assembleWriteFrames(MESSAGE_TYPE_CONFIGURATION, SUB_TYPE_WRITE, packets, startingFrameCounter, autoApplyConfig)

    allFrames.push(...frames)
  }

  // ============================================================================
  // Validation
  // ============================================================================

  // Ensure at least one sequence was encoded
  if (allFrames.length === 0) {
    throw new Error('No registers selected for encoding')
  }

  // Validate all frames respect byte limit
  for (let i = 0; i < allFrames.length; i++) {
    const frame = allFrames[i]!
    if (frame.length > byteLimit) {
      throw new Error(`Frame ${i} size ${frame.length} exceeds limit of ${byteLimit} bytes`)
    }
  }

  return {
    fPort: TULIP3_FPORT,
    frames: allFrames,
  }
}
