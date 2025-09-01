import type { KeepAliveMessageUplinkOutput } from '../../../schemas/tulip3/keepAlive'
import { validateMessageHeader } from '.'

/**
 * Decodes a TULIP3 keep alive message (0x16/0x01).
 *
 * - Message transmitted every 24 hours (not configurable)
 * - Always requires acknowledgement from network server
 * - Payload contains status byte, revision counter, and optional battery level
 *
 * @param data Raw message bytes to decode
 * @returns Decoded keep alive message following the schema
 * @throws {TypeError} If message type or subtype is invalid
 * @throws {RangeError} If payload is too short for required fields
 *
 * @example
 * ```ts
 * // Example from spec: 0x16 01 60 00 02 64
 * const result = decodeKeepAliveMessage([0x16, 0x01, 0x60, 0x00, 0x02, 0x64])
 * console.log(result.data.status.mainPowered) // false (battery powered)
 * console.log(result.data.status.ableToComputeBatteryLevel) // true
 * console.log(result.data.revisionCounter) // 2
 * console.log(result.data.batteryLevel) // 100
 * ```
 */
export function decodeKeepAliveMessage(data: number[]): KeepAliveMessageUplinkOutput {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x16,
    allowedSubTypes: [0x01],
    minLength: 5,
    messageTypeName: 'Keep alive',
  })

  // Parse status byte (byte 2)
  const statusByte = data[2]!
  const mainPowered = Boolean(statusByte & 0b1000_0000) // bit 7
  const ableToComputeBatteryLevel = Boolean(statusByte & 0b0100_0000) // bit 6
  const hasCommunicationModuleRestarted = Boolean(statusByte & 0b0010_0000) // bit 5
  // bits 4-0 are RFU (Reserved for Future Use)

  const revisionCounter = (data[3]! << 8) | data[4]!

  // Parse battery level (byte 5, optional based on bit 6 of status)
  let batteryLevel: number | undefined

  if (ableToComputeBatteryLevel) {
    if (data.length < 6) {
      throw new RangeError(`Keep alive message missing battery level. Expected 6 bytes when battery level computation is enabled but got ${data.length}`)
    }
    batteryLevel = data[5]!

    // Validate battery level is in valid range (0-100%)
    if (batteryLevel < 0 || batteryLevel > 100) {
      throw new RangeError(`Invalid battery level: ${batteryLevel}%. Must be between 0 and 100`)
    }
  }
  else {
    // When battery level computation is disabled, byte 5 should not be present
    if (data.length > 5) {
      throw new RangeError(`Keep alive message has unexpected extra bytes. Expected 5 bytes when battery level computation is disabled but got ${data.length}`)
    }
    batteryLevel = undefined
  }

  // Build the result according to the schema
  if (ableToComputeBatteryLevel) {
    return {
      data: {
        messageType,
        messageSubType,
        keepAliveData: {
          status: {
            mainPowered,
            ableToComputeBatteryLevel: true,
            hasCommunicationModuleRestarted,
          },
          revisionCounter,
          batteryLevel: batteryLevel!,
        },
      },
    }
  }
  else {
    return {
      data: {
        messageType,
        messageSubType,
        keepAliveData: {
          status: {
            mainPowered,
            ableToComputeBatteryLevel: false,
            hasCommunicationModuleRestarted,
          },
          revisionCounter,
        },
      },
    }
  }
}
