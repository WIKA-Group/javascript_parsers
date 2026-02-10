/**
 * Shared constants for TULIP3 downlink encoding.
 */

// =============================================================================
// MESSAGE TYPE CONSTANTS
// =============================================================================

/** TULIP3 Identification message type */
export const MESSAGE_TYPE_IDENTIFICATION = 0x01

/** TULIP3 Configuration message type */
export const MESSAGE_TYPE_CONFIGURATION = 0x02

/** TULIP3 Generic command message type */
export const MESSAGE_TYPE_GENERIC_COMMAND = 0x03

/** TULIP3 Generic request message type */
export const MESSAGE_TYPE_GENERIC_REQUEST = 0x04

// =============================================================================
// SUB-MESSAGE TYPE CONSTANTS
// =============================================================================

/** Read operation sub-type */
export const SUB_TYPE_READ = 0x01

/** Write operation sub-type */
export const SUB_TYPE_WRITE = 0x02

/** Force close session sub-type */
export const SUB_TYPE_FORCE_CLOSE_SESSION = 0x01

/** Restore default configuration sub-type */
export const SUB_TYPE_RESTORE_DEFAULT_CONFIG = 0x02

/** New battery inserted sub-type */
export const SUB_TYPE_NEW_BATTERY_INSERTED = 0x03

/** Get alarm status sub-type */
export const SUB_TYPE_GET_ALARM_STATUS = 0x01

// =============================================================================
// PROTOCOL CONSTANTS
// =============================================================================

/** TULIP3 protocol standard fPort */
export const TULIP3_FPORT = 1
