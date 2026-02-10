import { ffd } from '../../../utils/encoding/ffd'
import { encodeAddressingField, MAX_SIZE } from '../addressingField'

export interface ReadRegisterCommand {
  address: number // 11-bit register address
  size: number // number of bytes the value has, must be 5 bits to get 16 bits with 11-bit address space
}
export interface WriteRegisterCommand extends ReadRegisterCommand {
  value: number[] // array of bytes to write length must match size
}

export type RegisterCommand = ReadRegisterCommand | WriteRegisterCommand

/** Header size in bytes (11-bit address + 5-bit size = 16 bits = 2 bytes) */
export const HEADER_SIZE = 2

/**
 * Validates an array of register commands.
 *
 * @param mode - 'read' or 'write' mode
 * @param commands - Array of commands to validate
 * @throws Error if duplicate address found
 * @throws Error if write mode and size !== value.length
 */
export function validateCommands(mode: 'read' | 'write', commands: (ReadRegisterCommand | WriteRegisterCommand)[]): void {
  const seenAddresses = new Set<number>()

  for (const command of commands) {
    if (seenAddresses.has(command.address)) {
      throw new Error(`Duplicate command for address ${command.address}. Each address can only appear once.`)
    }
    seenAddresses.add(command.address)

    if (mode === 'write') {
      const writeCommand = command as WriteRegisterCommand
      if (writeCommand.size !== writeCommand.value.length) {
        throw new Error(
          `Size mismatch for address ${command.address}: size is ${command.size} but value has ${writeCommand.value.length} bytes.`,
        )
      }
    }
  }
}

/**
 * Consolidated block of contiguous register commands.
 */
export interface ConsolidatedBlock {
  address: number
  size: number
  value?: number[] // Only present in write mode
}

export function consolidateCommands(
  mode: 'read',
  commands: ReadRegisterCommand[],
): ReadRegisterCommand[]
export function consolidateCommands(
  mode: 'write',
  commands: WriteRegisterCommand[],
  maxDataSize?: number,
): WriteRegisterCommand[]
/**
 * Consolidates contiguous register commands into blocks.
 * Commands are sorted by address, then merged if contiguous and within size limits.
 *
 * For READ mode: consolidation is only limited by MAX_SIZE (31) since wireSize is always 2 bytes.
 * For WRITE mode: consolidation is limited by maxDataSize since wireSize = 2 + data.
 *
 * @param mode - 'read' or 'write' mode
 * @param commands - Array of commands to consolidate
 * @param maxDataSize - Maximum data size per block for WRITE mode (default: 31). Ignored for READ mode.
 * @returns Array of consolidated blocks
 */
export function consolidateCommands(
  mode: 'read' | 'write',
  commands: (ReadRegisterCommand | WriteRegisterCommand)[],
  maxDataSize: number = MAX_SIZE,
): ConsolidatedBlock[] {
  if (commands.length === 0) {
    return []
  }

  // For READ mode: wireSize is always 2 bytes, so we can consolidate up to MAX_SIZE (31)
  // For WRITE mode: wireSize = 2 + data, so we must respect maxDataSize from payload constraints
  const effectiveMaxDataSize = mode === 'read' ? MAX_SIZE : Math.min(maxDataSize, MAX_SIZE)

  // Sort commands by address
  const sorted = [...commands].sort((a, b) => a.address - b.address)

  const blocks: ConsolidatedBlock[] = []
  let currentBlock: ConsolidatedBlock = {
    address: sorted[0]!.address,
    size: sorted[0]!.size,
    ...(mode === 'write' ? { value: [...(sorted[0] as WriteRegisterCommand).value] } : {}),
  }

  for (let i = 1; i < sorted.length; i++) {
    const command = sorted[i]!
    const isContiguous = currentBlock.address + currentBlock.size === command.address
    const wouldFit = currentBlock.size + command.size <= effectiveMaxDataSize

    if (isContiguous && wouldFit) {
      // Append to current block
      currentBlock.size += command.size
      if (mode === 'write') {
        currentBlock.value!.push(...(command as WriteRegisterCommand).value)
      }
    }
    else {
      // Finalize current block and start new one
      blocks.push(currentBlock)
      currentBlock = {
        address: command.address,
        size: command.size,
        ...(mode === 'write' ? { value: [...(command as WriteRegisterCommand).value] } : {}),
      }
    }
  }

  // Don't forget the last block
  blocks.push(currentBlock)

  return blocks
}

/**
 * Converts a consolidated block to wire format bytes.
 *
 * @param mode - 'read' or 'write' mode
 * @param block - Block to convert
 * @returns Byte array: [headerHigh, headerLow] for read, [headerHigh, headerLow, ...value] for write
 */
export function blockToBytes(mode: 'read' | 'write', block: ConsolidatedBlock): number[] {
  const header = encodeAddressingField(block.address, block.size)

  if (mode === 'read') {
    return [...header]
  }
  else {
    return [...header, ...block.value!]
  }
}

/**
 * Converts an array of blocks to wire format packets.
 *
 * @param mode - 'read' or 'write' mode
 * @param blocks - Array of blocks to convert
 * @returns Array of byte arrays (packets)
 */
export function blocksToPackets(mode: 'read' | 'write', blocks: ConsolidatedBlock[]): number[][] {
  return blocks.map(block => blockToBytes(mode, block))
}

/**
 * Main entry point: validates, consolidates, and packs commands into optimized entries.
 *
 * @param mode - 'read' or 'write' mode
 * @param commands - Array of register commands
 * @param payloadSize - Maximum payload size per entry
 * @returns Array of entries (byte arrays), optimized using FFD bin packing
 *
 * @example
 * ```typescript
 * const commands: WriteRegisterCommand[] = [
 *   { address: 0, size: 4, value: [1, 2, 3, 4] },
 *   { address: 4, size: 4, value: [5, 6, 7, 8] },
 *   { address: 100, size: 2, value: [9, 10] },
 * ]
 * const entries = packCommands('write', commands, 50)
 * // Commands at 0 and 4 are consolidated into one block
 * // Then packed into entries using FFD algorithm
 * ```
 */
export function packCommands(
  mode: 'read' | 'write',
  commands: (ReadRegisterCommand | WriteRegisterCommand)[],
  payloadSize: number,
): number[][] {
  if (commands.length === 0) {
    return []
  }

  // Validate all commands first
  validateCommands(mode, commands)

  // Calculate max data size per block
  // For READ mode: wireSize is always 2 bytes (header only), so we can consolidate up to MAX_SIZE (31)
  // For WRITE mode: wireSize is header + data, so max data must fit in payload
  const maxDataSize = mode === 'read'
    ? MAX_SIZE
    : Math.min(MAX_SIZE, payloadSize - HEADER_SIZE)

  if (mode === 'write' && maxDataSize <= 0) {
    throw new Error(`Payload size ${payloadSize} is too small. Must be at least ${HEADER_SIZE + 1} bytes.`)
  }

  if (mode === 'read' && payloadSize < HEADER_SIZE) {
    throw new Error(`Payload size ${payloadSize} is too small. Must be at least ${HEADER_SIZE} bytes.`)
  }

  // Consolidate contiguous commands into blocks
  let blocks: ConsolidatedBlock[]
  if (mode === 'write') {
    blocks = consolidateCommands(mode, commands as WriteRegisterCommand[], maxDataSize)
  }
  else {
    blocks = consolidateCommands(mode, commands as ReadRegisterCommand[])
  }

  // Convert blocks to wire format packets
  const packets = blocksToPackets(mode, blocks)

  // Use FFD bin packing to optimize entry usage
  // TODO: Future optimization: split blocks to fill remaining entry gaps,
  // reducing total entry count at cost of 2-byte header overhead per split.
  // This would help when e.g. 3 entries have small gaps that could be filled
  // by splitting a block from a 4th entry, eliminating that entry entirely.
  return ffd(packets, payloadSize)
}
