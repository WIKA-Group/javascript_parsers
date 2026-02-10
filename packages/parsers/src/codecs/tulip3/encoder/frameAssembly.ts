/**
 * Frame assembly functions for TULIP3 downlink encoding.
 * Handles the construction of complete frames with proper headers for read and write operations.
 */

/**
 * Assembles read frames by prepending message type and sub-type headers.
 * Read frames do NOT include the apply/frame-number byte.
 *
 * Frame structure: [messageType, subMessageType, ...payload]
 *
 * @param messageType - Message type byte (0x01 for identification, 0x02 for configuration)
 * @param subMessageType - Sub-message type byte (0x01 for read)
 * @param packets - Array of payload packets from packCommands()
 * @returns Array of complete read frames
 */
export function assembleReadFrames(
  messageType: number,
  subMessageType: number,
  packets: number[][],
): number[][] {
  return packets.map((payload) => {
    return [messageType, subMessageType, ...payload]
  })
}

/**
 * Assembles write frames by prepending message type, sub-type, and apply/frame-number byte.
 * Write frames ALWAYS include the apply/frame-number byte.
 *
 * Frame structure: [messageType, subMessageType, applyByte, ...payload]
 *
 * Apply byte bit layout:
 * - Bit 7: Apply-config flag (set only on last frame if autoApply is true)
 * - Bits 6-2: Frame counter (0-31, 5 bits)
 * - Bits 1-0: RFU (Reserved for Future Use, always 0)
 *
 * Note: Apply-only frames (frames with just messageType+subMessageType+applyByte and no
 * register payload) are not currently supported by this implementation.
 *
 * @param messageType - Message type byte (0x01 for identification, 0x02 for configuration)
 * @param subMessageType - Sub-message type byte (0x02 for write)
 * @param packets - Array of payload packets from packCommands()
 * @param startingCounter - Starting frame counter (0-31)
 * @param autoApply - Whether to set apply-config bit (bit 7) on last frame
 * @returns Array of complete write frames
 */
export function assembleWriteFrames(
  messageType: number,
  subMessageType: number,
  packets: number[][],
  startingCounter: number,
  autoApply: boolean,
): number[][] {
  return packets.map((payload, index) => {
    const frameCounter = startingCounter + index

    // Encode frame counter in bits 6-2
    let applyByte = (frameCounter << 2) & 0b01111100

    // Set apply-config bit (bit 7) on last frame if autoApply is true
    const isLastFrame = index === packets.length - 1
    if (autoApply && isLastFrame) {
      applyByte |= 0b10000000
    }

    return [messageType, subMessageType, applyByte, ...payload]
  })
}
