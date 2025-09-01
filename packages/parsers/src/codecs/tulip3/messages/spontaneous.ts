import type { AllowedTULIP3TypeSubTypeCombination, SpontaneousDownlinkAnswerUplinkOutput, SpontaneousFetchAdditionalDownlinkMessageUplinkOutput } from '../../../schemas/tulip3/spontaneous'
import { readMessageSubtype, validateMessageHeader } from '.'
import { spontaneousStatusLookup } from '../lookups'

export const allowedTypeSubTypeCombinations = {
  0x01: [0x01, 0x02],
  0x02: [0x01, 0x02],
  0x03: [0x01, 0x02, 0x03],
  0x04: [0x01],
  0x05: [0x01],
} as const

/**
 * Decodes a TULIP3 spontaneous downlink answer message (0x17/0x01).
 *
 * - Sent from the CM to the cloud upon receipt of a downlink command
 * - Always requires acknowledgement from network server
 * - Payload contains header of answered downlink, status, and optional device error code
 *
 * @param data Raw message bytes to decode
 * @returns Decoded spontaneous downlink answer message following the schema
 * @throws {TypeError} If message type or subtype is invalid
 * @throws {RangeError} If payload is too short for required fields
 *
 * @example
 * // Example: 0x17 01 03 03 00 00
 * const result = decodeSpontaneousGenericDownlinkAnswerMessage([0x17, 0x01, 0x03, 0x03, 0x00])
 * console.log(result.data.answeredDownlink) // { type: 0x03, subType: 0x03 }
 * console.log(result.data.status) // 'Success'
 */
export function decodeSpontaneousGenericDownlinkAnswerMessage(data: number[]): SpontaneousDownlinkAnswerUplinkOutput {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x17,
    allowedSubTypes: [0x01],
    minLength: 5,
    messageTypeName: 'Spontaneous downlink answer',
  })

  // Parse answered downlink header (bytes 2-3)
  const type = data[2]!
  const subType = readMessageSubtype(data[3]!)
  const answeredDownlink = { type, subType } as AllowedTULIP3TypeSubTypeCombination

  const validCombination = allowedTypeSubTypeCombinations[type as keyof typeof allowedTypeSubTypeCombinations]?.includes(subType as any)
  if (!validCombination) {
    throw new TypeError(`Answered downlink can not have a combination of type: ${type} and subType: ${subType}`)
  }

  // Parse status (byte 4)
  const statusByte = data[4]!
  const statusString = spontaneousStatusLookup[statusByte as keyof typeof spontaneousStatusLookup] as typeof spontaneousStatusLookup[keyof typeof spontaneousStatusLookup] | undefined

  if (!statusString) {
    throw new TypeError(`Invalid status byte: ${statusByte}`)
  }

  // Parse device error code (byte 5, only present if status is Device error)
  let deviceErrorCode: number | undefined
  if (statusByte === 4) {
    if (data.length < 6) {
      throw new RangeError('Device error code missing for Device error status (expected 6 bytes)')
    }
    deviceErrorCode = data[5]!
  }
  else if (data.length > 5) {
    throw new RangeError(`Spontaneous downlink answer message has unexpected extra bytes. Expected 5 bytes for status ${statusString} but got ${data.length}`)
  }

  // Build the result according to the schema
  if (deviceErrorCode === undefined) {
    return {
      data: {
        messageType,
        messageSubType,
        spontaneousDownlinkAnswer: {
          answeredDownlink,
          status: statusString,
        } as any,
      },
    }
  }
  else {
    return {
      data: {
        messageType,
        messageSubType,
        spontaneousDownlinkAnswer: {
          answeredDownlink,
          status: statusString,
          deviceErrorCode,
        },
      },
    }
  }
}

export function decodeSpontaneousFetchAdditionalDownlinkMessageMessage(data: number[]): SpontaneousFetchAdditionalDownlinkMessageUplinkOutput {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x17,
    allowedSubTypes: [0x02],
    minLength: 2,
    messageTypeName: 'Spontaneous fetch additional downlink',
  })

  // Validate exact length for this message type
  if (data.length !== 2) {
    throw new RangeError(`Spontaneous fetch additional downlink message has invalid length. Expected 2 bytes but got ${data.length}`)
  }

  // Build the result according to the schema
  return {
    data: {
      messageType,
      messageSubType,
    },
  }
}
