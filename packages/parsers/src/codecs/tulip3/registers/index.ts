import type * as v from 'valibot'
import { set } from 'es-toolkit/compat'

// Re-export all parsing functions from parsing.ts
export * from './parsing'

export interface RegisterEntry<TData extends number[], TResult = any, TPath extends string = string> {
  path: TPath
  size: number
  parsing: (data: TData) => TResult
}

export interface CustomRegisterEntry<TData extends number[], TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>, TPath extends string = string> extends RegisterEntry<TData, v.InferOutput<TSchema>, TPath> {
  schema: TSchema
}

export interface RegisterGuard {
  type: 'guard'
  message: string
}

export type AnyRegisterLookup = Record<number, RegisterEntry<any, any, any> | RegisterGuard>

export type AnyCustomRegisterLookup = Record<number, CustomRegisterEntry<any, any>>

export function createRegisterEntry<TData extends number[], TResult, TPath extends string>(path: TPath, size: number, parsing: (data: TData) => TResult): RegisterEntry<TData, TResult, TPath> {
  return {
    path,
    size,
    parsing,
  }
}

export interface RegisterBlock {
  startRegisterAddress: number
  value: number[]
}

export interface ParseRegisterBlocksOptions {
  /**
   * Maximum allowed size for a single register in bytes (5-bit value, max 31)
   * @default 31
   */
  maxRegisterSize?: number
  /**
   * Starting position in the data array where register blocks begin. Useful when type and subtype are removed from the data array.
   * @default 2
   */
  startPosition?: number
}

/**
 * Parses register blocks from a number array according to TULIP3 protocol specification.
 *
 * Each register block consists of:
 * - 2 bytes addressing field: 11-bit start address (upper bits) + 5-bit length (lower bits)
 * - N bytes of register data (where N is specified in the length field)
 *
 * The addressing field format:
 * - Bit 15-5: Register start address (11 bits, max 2047/0x7FF)
 * - Bit 4-0: Number of bytes (5 bits, max 31)
 *
 * @param data - Array of bytes containing the register block data
 * @param options - Configuration options for parsing, default start position is 2 and max register size is 31 bytes
 * @returns Array of RegisterBlock objects
 * @throws Error if parsing fails
 *
 * @example
 * ```typescript
 * const data = [0x40, 0x04, 0x01, 0x02, 0x03, 0x04] // Address 0x200 (512), 4 bytes of data
 * const blocks = parseRegisterBlocks(data, { maxRegisterSize: 31 })
 * // Returns: [{ startRegisterAddress: 512, value: [1, 2, 3, 4] }]
 * ```
 */
export function parseRegisterBlocks(data: number[], options: ParseRegisterBlocksOptions = {}): RegisterBlock[] {
  const { startPosition = 2 } = options
  const registerBlocks: RegisterBlock[] = []
  let position = startPosition

  // Loop until the array is finished
  while (position < data.length) {
    // Need at least 2 bytes for addressing field
    if (position + 1 >= data.length) {
      const bytesRemaining = data.length - position
      throw new RangeError(
        `Incomplete register block at position ${position}: Found ${bytesRemaining} byte(s) but need 2 bytes for addressing field. `
        + `Data length: ${data.length}, Expected: addressing field (2 bytes) + register data. `
        + `This suggests the data stream is truncated or malformed.`,
      )
    }

    // Each block's header is 2 bytes long, containing address (upper 11 bits) and length (lower 5 bits)
    const addressingFieldHigh = data[position]!
    const addressingFieldLow = data[position + 1]!

    // Combine the two bytes to form the 16-bit addressing field
    const addressingField = (addressingFieldHigh << 8) | addressingFieldLow

    // Extract start address (upper 11 bits) and total length (lower 5 bits)
    const startAddress = addressingField >> 5
    const totalLength = addressingFieldLow & 0b00011111

    // Check if there are enough bytes left for the register value
    if (position + 2 + totalLength > data.length) {
      const bytesAvailable = data.length - position - 2
      throw new RangeError(
        `Incomplete register data for address 0x${startAddress.toString(16)} at position ${position}: `
        + `Need ${totalLength} bytes but only ${bytesAvailable} bytes available in data stream. `
        + `Total data length: ${data.length}, Current position: ${position}, `
        + `Required: 2 bytes (addressing) + ${totalLength} bytes (data) = ${2 + totalLength} bytes total. `
        + `This suggests the data stream was cut off or the register size field is incorrect.`,
      )
    }

    // Extract the register value
    const value = data.slice(position + 2, position + 2 + totalLength)

    registerBlocks.push({ startRegisterAddress: startAddress, value })

    // Move to the next block (2 bytes for addressing + totalLength bytes for value)
    position += 2 + totalLength
  }

  return registerBlocks
}

/**
 * Evaluates and parses register blocks using a lookup table to transform raw register data into structured objects.
 *
 * This function processes an array of register blocks, where each block contains a starting register address
 * and associated raw byte values. It uses the provided lookup table to find the appropriate parser for each
 * register address and applies the parsing function to transform the raw data into meaningful values.
 * The results are then assembled into a nested object structure based on the register paths.
 *
 * @template TRes - The expected return type, must extend Record<string, any>
 * @param lookup - A lookup table mapping register addresses to RegisterEntry objects containing parsing information
 * @param blocks - An array of RegisterBlock objects, each containing a startRegisterAddress and raw value array
 * @returns A structured object of type TRes with parsed register values
 * @throws ReferenceError if a register address is not found in the lookup table
 * @throws RangeError if there is insufficient data for a register
 * @throws Error if a parsing function throws an error (e.g., unknown enum value)
 *
 * @example
 * ```typescript
 * const lookup = {
 *   0x1000: createRegisterEntry('device.temperature', 2, intTuple2ToUInt16),
 *   0x1002: createRegisterEntry('device.name', 8, intArrayToASCII)
 * }
 *
 * const blocks = [
 *   { startRegisterAddress: 0x1000, value: [25, 0] },
 *   { startRegisterAddress: 0x1002, value: [72, 101, 108, 108, 111, 0, 0, 0] }
 * ]
 *
 * const result = evaluateRegisterBlocks(lookup, blocks)
 * // Returns: { device: { temperature: 25, name: "Hello" } }
 * ```
 */
export function evaluateRegisterBlocks<TRes extends Record<string, any> = Record<string, any>>(lookup: AnyRegisterLookup, blocks: RegisterBlock[]): TRes {
  const result: Record<string, any> = {}

  // Process each register block
  for (const block of blocks) {
    const { startRegisterAddress, value } = block

    let address = startRegisterAddress
    while (value.length > 0) {
      const registerEntry = lookup[address]
      // if there is no register entry then the message was not for this kind of configured device
      if (!registerEntry) {
        throw new ReferenceError(
          `Unknown register address 0x${address.toString(16)} in lookup table. `
          + `This indicates an invalid message sent from the device. `
          + `This register was expected during parsing of block starting at 0x${startRegisterAddress.toString(16)}. `
          + `This ${address === startRegisterAddress ? 'is the first register in the block' : 'is not the first register in the block'}. `
          + `Starting address: 0x${startRegisterAddress.toString(16)}. `
          + `Available addresses in lookup: [${Object.keys(lookup).map(k => `0x${Number(k).toString(16)}`).join(', ')}]. `,
        )
      }

      // Check if this is a register guard
      if ('type' in registerEntry && registerEntry.type === 'guard') {
        throw new RangeError(
          registerEntry.message,
        )
      }

      // Type narrow to RegisterEntry (guard check above ensures it's not a RegisterGuard)
      const entry = registerEntry as RegisterEntry<any, any, any>

      // now we take the amount of bytes that the register entry wants
      if (value.length < entry.size) {
        // if the value is not enough then we throw an error
        throw new RangeError(
          `Insufficient data for register 0x${address.toString(16)} (${entry.path}): `
          + `Expected ${entry.size} bytes but only ${value.length} bytes remaining in block. `
          + `Block started at address 0x${startRegisterAddress.toString(16)} with ${block.value.length} total bytes. `
          + `Current parsing position within block: ${block.value.length - value.length} bytes processed. `
          + `This suggests a mismatch between register definitions and actual data structure.`,
        )
      }
      // if the value is enough then we take the first entry.size bytes and remove them from the value
      const registerValue = value.slice(0, entry.size)
      value.splice(0, entry.size)
      // now we can set the address to the next register address
      address += entry.size
      // and we can set the value to the registerValue, catching any parsing errors
      try {
        set(result, entry.path, entry.parsing(registerValue))
      }
      catch (error) {
        const originalError = error instanceof Error ? error.message : String(error)
        throw new Error(
          `Failed to parse register 0x${(address - entry.size).toString(16)} (${entry.path}): ${originalError}. `
          + `Register data: [${registerValue.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}] `
          + `(${registerValue.length} bytes, expected ${entry.size} bytes). `
          + `Block started at address 0x${startRegisterAddress.toString(16)}. `
          + `This may indicate invalid data values or a parsing function error.`,
          { cause: error },
        )
      }
      // and we can continue with the next register entry
    }
  }

  return result as TRes
}
