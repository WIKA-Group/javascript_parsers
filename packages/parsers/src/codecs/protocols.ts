/**
 * TULIP2 protocol identifier.
 * Used for legacy devices with basic message handling (0x00-0x09 message types).
 */
export const TULIP2_PROTOCOL = 'TULIP2' as const

/**
 * TULIP3 protocol identifier.
 * Used for advanced devices with comprehensive sensor support (0x10-0x17 message types).
 */
export const TULIP3_PROTOCOL = 'TULIP3' as const

/**
 * Union type of all supported protocol identifiers.
 */
export type Protocol = typeof TULIP2_PROTOCOL | typeof TULIP3_PROTOCOL
