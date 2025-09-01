import type { ConfigurationWriteRegisterData } from '../../../schemas/tulip3/configuration'
import type { AnyRegisterLookup, ParseRegisterBlocksOptions } from '../registers'
import { configurationStatusLookup } from '../lookups'
import { evaluateRegisterBlocks, parseRegisterBlocks } from '../registers'

/**
 * Parses frame number and status from frame data bytes.
 *
 * @param frameNumberByte - Frame number byte (Bit 7=RFU, Bit 6-2=frame counter, Bit 1-0=RFU)
 * @param statusByte - Status code byte
 * @returns Parsed frame object with frame counter and status description
 * @throws {TypeError} If the status code is invalid/unknown
 */
function parseFrame(frameNumberByte: number, statusByte: number): Frame {
  // Extract frame counter from bits 6-2 of the frame number byte
  const frameNumber = (frameNumberByte >> 2) & 0b0001_1111 // Bits 6-2 (5 bits)

  // Look up status description from the status byte
  const status: typeof configurationStatusLookup[keyof typeof configurationStatusLookup] | undefined
    = configurationStatusLookup[statusByte as keyof typeof configurationStatusLookup]

  // Validate that the status code is recognized
  if (!status) {
    throw new TypeError(`Invalid status code: 0x${statusByte.toString(16).padStart(2, '0').toUpperCase()}`)
  }

  return { frameNumber, status }
}

/**
 * Frame information containing frame counter and configuration status.
 */
export interface Frame {
  /** Frame counter extracted from bits 6-2 of the frame number byte */
  frameNumber: number
  /** Human-readable status description */
  status: typeof configurationStatusLookup[keyof typeof configurationStatusLookup]
}

/**
 * Parses frame data structure from a write response message starting from position 2.
 * Handles basic responses (4 bytes), apply config answers (7 bytes), and extended responses with additional frames.
 *
 * @param data - Raw byte array containing the write response message data
 * @returns Parsed frame data object with frames, revision counter, and total wrong frames
 * @throws {RangeError} If message length is invalid for the expected format
 */
export function parseFrameData(data: number[]): ConfigurationWriteRegisterData {
  // Parse initial frame (bytes 2-3) - always present
  const { frameNumber, status } = parseFrame(data[2]!, data[3]!)

  const frameData: ConfigurationWriteRegisterData = {
    frames: [{ frameNumber, status }],
  }

  // Basic response - only mandatory fields present
  if (data.length === 4) {
    return frameData
  }

  // Apply config answer format validation
  // Must have at least 7 bytes for revision counter (2 bytes) + total wrong frames (1 byte)
  if (data.length > 4 && data.length < 7) {
    throw new RangeError(`Invalid message length: expected 7 bytes minimum for apply config answer, got ${data.length}`)
  }

  // Parse revision counter (bytes 4-5) - 16-bit big-endian
  frameData.revisionCounter = (data[4]! << 8) | data[5]!

  // Parse total wrong frames number (byte 6)
  frameData.totalWrongFrames = data[6]!

  // Complete apply config answer - only revision counter and total wrong frames
  if (data.length === 7) {
    return frameData
  }

  // Extended apply config answer with additional frame data
  // Additional frames come in pairs, so total length must be odd (7 + even number of additional bytes)
  if (data.length > 7 && data.length % 2 === 0) {
    throw new RangeError(`Invalid message length: expected odd number of bytes for apply config answer with additional frames, got ${data.length}`)
  }

  // Parse additional frame pairs starting from byte 7
  let position = 7
  while (position + 1 < data.length) {
    const additionalFrame = parseFrame(data[position]!, data[position + 1]!)
    frameData.frames.push(additionalFrame)
    position += 2
  }

  return frameData
}

/**
 * Decodes register fields from a data array according to TULIP3 protocol.
 * This function performs the same validation and parsing as decodeReadIdentificationRegisterMessage
 * but throws errors instead of returning error objects for higher-level error handling.
 *
 * @param data - Raw byte array containing the register message data
 * @param registerLookup - Pre-created register lookup for parsing
 * @param options - Optional parsing options, such as start position and maximum register size
 * @returns Decoded register fields object
 * @throws {Error} If message length is invalid, subtype is unsupported, or parsing fails
 * @throws {TypeError} If register blocks or evaluation fails
 * @throws {RangeError} If message format is invalid
 */
export function decodeRegisterRead<TOutput extends object = object>(
  data: number[],
  registerLookup: AnyRegisterLookup,
  options: ParseRegisterBlocksOptions = {},
): TOutput {
  const registerBlocksResult = parseRegisterBlocks(data, options)

  // Evaluate register blocks
  return evaluateRegisterBlocks<TOutput>(
    registerLookup,
    registerBlocksResult,
  )
}

/**
 * Export parseFrame function for use in other modules
 */
export { parseFrame }

/**
 * Reads the subtype from a message byte.
 * This function extracts the subtype bits (5-0) from the byte.
 * @param byte - The byte containing the subtype information.
 * @returns The extracted subtype value.
 */
export function readMessageSubtype(byte: number): number {
  return byte & 0b00111111 // Mask to get bits 5-0
}

/**
 * Options for validating TULIP3 message headers.
 */
export interface ValidateMessageHeaderOptions<TMessageType extends number, TMessageSubType extends number> {
  /** Expected message type (byte 0) */
  expectedMessageType: TMessageType[] | TMessageType
  /** Array of allowed subtypes for this message type */
  allowedSubTypes: readonly TMessageSubType[]
  /** Minimum required message length in bytes */
  minLength: number
  /** Optional: Message type name for better error messages (e.g., "Configuration", "Identification") */
  messageTypeName?: string
}

/**
 * Validates a TULIP3 message header and returns validated type information.
 * This utility function streamlines the validation of message length, type, and subtype
 * across all TULIP3 message decoders.
 *
 * @param data - Raw byte array containing the message data
 * @param options - Validation options specifying expected types and constraints
 * @returns Validated message header information
 * @throws {RangeError} If message length is invalid
 * @throws {TypeError} If message type or subtype is invalid
 *
 * @example
 * ```ts
 * // Validate configuration message header
 * const header = validateMessageHeader(data, {
 *   expectedMessageType: 0x15,
 *   allowedSubTypes: [0x01, 0x02, 0x03],
 *   minLength: 4,
 *   messageTypeName: "Configuration"
 * })
 * console.log(header.messageType, header.messageSubType)
 * ```
 */
export function validateMessageHeader<const TMessageType extends number, const TMessageSubType extends number>(
  data: number[],
  options: ValidateMessageHeaderOptions<TMessageType, TMessageSubType>,
): {
  messageType: TMessageType
  messageSubType: TMessageSubType
} {
  const { expectedMessageType, allowedSubTypes, minLength, messageTypeName } = options

  // Validate minimum message length
  if (data.length < minLength) {
    const messageDesc = messageTypeName ? `${messageTypeName} message` : 'Message'
    throw new RangeError(`${messageDesc} too short. Expected at least ${minLength} bytes but got ${data.length}`)
  }

  const expectedMessageTypes = Array.isArray(expectedMessageType) ? expectedMessageType : [expectedMessageType]

  // Validate message type
  const messageType = data[0]! as TMessageType
  if (!expectedMessageTypes.includes(messageType)) {
    const expectedHex = `0x${expectedMessageType.toString(16).padStart(2, '0').toUpperCase()}`
    const actualHex = `0x${messageType.toString(16).padStart(2, '0').toUpperCase()}`
    throw new TypeError(`Invalid message type: expected ${expectedHex} but got ${actualHex}`)
  }

  // Read and validate subtype
  const messageSubType = readMessageSubtype(data[1]!) as TMessageSubType
  if (!allowedSubTypes.includes(messageSubType)) {
    const subtypeHex = `0x${messageSubType.toString(16).padStart(2, '0').toUpperCase()}`
    const allowedHex = allowedSubTypes.map(st => `0x${st.toString(16).padStart(2, '0').toUpperCase()}`).join(', ')

    if (messageTypeName) {
      throw new TypeError(`Unsupported ${messageTypeName.toLowerCase()} message subtype: ${subtypeHex}. Allowed subtypes: ${allowedHex}`)
    }
    else {
      throw new TypeError(`Invalid message subtype: expected one of [${allowedHex}] but got ${subtypeHex}`)
    }
  }

  return {
    messageType,
    messageSubType,
  }
}
