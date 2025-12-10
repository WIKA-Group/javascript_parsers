import type { IdentificationReadRegisterData, IdentificationWriteRegistersResponseUplinkOutput } from '../../../schemas/tulip3/identification'
import type { TULIP3DeviceConfig } from '../profile'
import type { ParseRegisterBlocksOptions } from '../registers'
import type { IdentificationRegisterLookup } from '../registers/identification'
import { decodeRegisterRead, parseFrameData, validateMessageHeader } from '.'
import { createIdentificationRegisterLookup } from '../registers/identification'
import { assignChannelNames } from './shared-validation'

/**
 * Validates and transforms the decoded identification result against the provided configuration.
 * This function ensures that:
 * 1. Connected sensors match the configuration
 * 2. Result sensors are expected for the device
 * 3. Channel configurations are valid
 * 4. Channel names are assigned from configuration
 *
 * @param result - The decoded identification result to validate and transform
 * @param config - Device sensor configuration for validation
 * @throws {TypeError} If validation fails (invalid sensors, channels, or connections)
 */
export function validateAndTransformIdentificationResult<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(
  result: IdentificationReadRegisterData<TTULIP3DeviceConfig>,
  config: TTULIP3DeviceConfig,
): void {
  const validSensors = Object.keys(config).filter(k => k.startsWith('sensor'))

  // Step 1: Validate connected sensors match configuration (identification-specific)
  if (result && result?.communicationModule && 'connectedSensors' in result.communicationModule) {
    Object.entries(result!.communicationModule!.connectedSensors as object).forEach(([sensor, isConnectedInResult]) => {
      const shouldBeConnected = validSensors.includes(sensor)

      if (isConnectedInResult !== shouldBeConnected) {
        throw new TypeError(
          `Device sensor connection mismatch: ${sensor} is ${isConnectedInResult ? 'connected' : 'not connected'} `
          + `but this device expects it to ${shouldBeConnected ? 'be connected' : 'not be connected'}`,
        )
      }
    })
  }

  // Step 4: Assign channel names from configuration (shared logic)
  assignChannelNames(validSensors, result, config, 'identification')
}

/**
 * Factory function that creates a decoder for identification register read messages.
 * The register lookup is created once when the factory is called and reused for all subsequent decodes.
 *
 * @param config - Device sensor configuration for parsing
 * @returns A decoder function that processes identification messages
 *
 * @example
 * ```typescript
 * const decoder = createDecodeIdentificationRegisterRead(deviceConfig);
 * const result = decoder(data, { maxRegisterSize: 64 });
 * ```
 */
export function createDecodeIdentificationRegisterRead<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  let registersLookup: IdentificationRegisterLookup | null = null

  return (data: number[], options: ParseRegisterBlocksOptions = {}) => {
    // Lazy initialization of register lookup
    if (!registersLookup) {
      registersLookup = createIdentificationRegisterLookup(config)
    }

    // Validate message header
    const { messageType, messageSubType } = validateMessageHeader(data, {
      expectedMessageType: 0x14,
      allowedSubTypes: [0x01, 0x02, 0x04],
      minLength: 4,
      messageTypeName: 'Identification',
    })

    // Evaluate register blocks
    const res = decodeRegisterRead<IdentificationReadRegisterData<TTULIP3DeviceConfig>>(
      data,
      registersLookup,
      options,
    )

    // Validate and transform the decoded result
    validateAndTransformIdentificationResult(res, config)

    // Return successfully parsed message
    return {
      data: {
        messageType,
        messageSubType,
        identification: res,
      },
    }
  }
}

/**
 * Decodes an identification write response message according to TULIP3 protocol.
 *
 * Message structure:
 * - Byte 0: Message type (must be 0x14 for Identification)
 * - Byte 1: Sub message type (must be 0x03 for Write fields response)
 * - Byte 2: Frame number (Bit 7=RFU, Bit 6-2=frame counter, Bit 1-0=RFU)
 * - Byte 3: Status code
 * - Byte 4-5: Revision counter (present only for apply config answer, 16-bit big-endian)
 * - Byte 6: Total wrong frames number (present only for apply config answer)
 * - Byte 7+: Additional frame pairs (frame number + status, present only for apply config answer)
 *
 * Valid message lengths:
 * - 4 bytes: Basic response (minimum required fields)
 * - 7 bytes: Apply config answer with revision counter and total wrong frames
 * - 9+ bytes: Apply config answer with additional frame data (must be odd length)
 *
 * Status codes (from configurationStatusLookup):
 * - 0: Configuration received but not applied
 * - 1: Configuration received and applied with success
 * - 2: Configuration rejected – Tried to write a read only register
 * - 3: Configuration rejected – At least one register has an invalid value
 * - 4: Configuration rejected – The combination register start address/number of bytes is wrong
 * - 5: Entire configuration discarded because of invalid parameter combination
 * - 6: Entire configuration discarded because no answer from the cloud
 * - 7: Missing frame
 * - 8: Frame rejected – frame number already received
 * - 9-255: RFU (Reserved for Future Use)
 *
 * @param data - Raw byte array containing the identification write response (validated integer array)
 * @returns Decoded identification write response object
 * @throws {RangeError} If message length is invalid or message/sub-message type is incorrect
 * @throws {TypeError} If message type, sub-message type, or status code is invalid
 */
export function decodeIdentificationRegisterWrite(data: number[]): IdentificationWriteRegistersResponseUplinkOutput {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x14,
    allowedSubTypes: [0x03],
    minLength: 4,
    messageTypeName: 'Identification',
  })

  // Parse frame data using shared function
  const frameData = parseFrameData(data)

  // Return the structured response
  return {
    data: {
      messageType,
      messageSubType,
      identification: frameData,
    },
  }
}
