/**
 * TULIP3 Addressing Field Utilities
 *
 * The addressing field is a 16-bit (2-byte) header used in TULIP3 register blocks.
 * Format:
 * - Bits 15-5: Register start address (11 bits, max 2047/0x7FF)
 * - Bits 4-0: Number of bytes/size (5 bits, max 31)
 */

/** Maximum address value (11 bits) */
export const MAX_ADDRESS = 0x7FF // 2047

/** Maximum size value (5 bits) */
export const MAX_SIZE = 0x1F // 31

/**
 * Encodes an address and size into a 2-byte addressing field.
 *
 * @param address - 11-bit register address (0-2047)
 * @param size - 5-bit size/length (0-31)
 * @returns Tuple of [highByte, lowByte]
 * @throws RangeError if address or size is out of valid range
 *
 * @example
 * ```typescript
 * const [high, low] = encodeAddressingField(512, 4)
 * // Returns: [0x40, 0x04] for address 0x200, size 4
 * ```
 */
export function encodeAddressingField(address: number, size: number): [number, number] {
  if (address < 0 || address > MAX_ADDRESS) {
    throw new RangeError(
      `Address ${address} is out of range. Must be between 0 and ${MAX_ADDRESS} (11 bits).`,
    )
  }
  if (size < 0 || size > MAX_SIZE) {
    throw new RangeError(
      `Size ${size} is out of range. Must be between 0 and ${MAX_SIZE} (5 bits).`,
    )
  }

  const addressingField = (address << 5) | (size & 0b11111)
  return [addressingField >> 8, addressingField & 0xFF]
}

/**
 * Decodes a 2-byte addressing field into address and size.
 *
 * @param high - High byte of the addressing field
 * @param low - Low byte of the addressing field
 * @returns Object with address and size properties
 *
 * @example
 * ```typescript
 * const { address, size } = decodeAddressingField(0x40, 0x04)
 * // Returns: { address: 512, size: 4 }
 * ```
 */
export function decodeAddressingField(high: number, low: number): { address: number, size: number } {
  const addressingField = (high << 8) | low
  return {
    address: addressingField >> 5,
    size: low & 0b11111,
  }
}
