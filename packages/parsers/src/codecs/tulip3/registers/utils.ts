import type { RegisterGuard } from '.'

/**
 * Creates a register guard that throws an error when accessed during decoding
 * @param type Type of data (e.g., 'Configuration', 'Identification')
 * @param address Register address in hexadecimal
 * @param registerName Name of the register
 * @param context Additional context (e.g., 'sensor 1', 'sensor 2 channel 3')
 * @returns RegisterGuard object
 */
export function createRegisterGuard(type: string, address: number, registerName: string, context: string): RegisterGuard {
  const hexAddress = `0x${address.toString(16).toUpperCase()}`
  return {
    type: 'guard',
    message: `${type} data could not be decoded as register ${hexAddress} for '${registerName}' on ${context} is not available for this device, but was included in the message from the device.`,
  }
}

/**
 * Creates a register guard for when the entire sensor or channel is missing from the device configuration
 * @param type Type of data (e.g., 'Configuration', 'Identification')
 * @param address Register address in hexadecimal
 * @param registerName Name of the register
 * @param context Additional context (e.g., 'sensor 1', 'sensor 2 channel 3')
 * @returns RegisterGuard object
 */
export function createMissingComponentRegisterGuard(type: string, address: number, registerName: string, context: string): RegisterGuard {
  const hexAddress = `0x${address.toString(16).toUpperCase()}`
  return {
    type: 'guard',
    message: `${type} data could not be decoded as register ${hexAddress} for '${registerName}' on ${context} is not available for this device because ${context} is not available on this device, but was included in the message from the device.`,
  }
}
