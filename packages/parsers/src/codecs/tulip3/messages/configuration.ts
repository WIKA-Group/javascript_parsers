import type { ConfigurationReadRegisterData, ConfigurationReadRegistersResponseUplinkOutput, ConfigurationWriteRegistersResponseUplinkOutput } from '../../../schemas/tulip3/configuration'
import type { FullTULIP3DeviceSensorConfig, TULIP3ChannelConfig, TULIP3DeviceSensorConfig } from '../profile'
import type { ParseRegisterBlocksOptions } from '../registers'
import { decodeRegisterRead, parseFrameData, validateMessageHeader } from '.'
import { createConfigurationRegisterLookup } from '../registers/configuration'

/**
 * Validates and transforms configuration result against device sensor configuration.
 *
 * This function performs four main validation and transformation steps:
 * 1. Validates that all decoded sensors are expected by the device profile
 * 2. Validates that sampling channels match device configuration expectations
 * 3. Assigns channel names from device configuration to result channels
 *
 * @param result - The decoded configuration result containing sensor data (modified in place)
 * @param deviceConfig - The device sensor configuration to validate against
 * @throws {TypeError} If sensors are not expected by the device profile
 * @throws {TypeError} If sampling channels are enabled for sensors not in device configuration
 */
export function validateAndTransformConfigurationResult<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(
  result: ConfigurationReadRegisterData<TTULIP3DeviceSensorConfig>,
  deviceConfig: TTULIP3DeviceSensorConfig,
): void {
  // Step 1: Validate sensors against device configuration
  const validSensors = Object.keys(deviceConfig)
  const resultSensors = Object.keys(result).filter(key => key !== 'communicationModule')

  // Check if all result sensors are expected by the device profile
  if (!resultSensors.every(sensor => validSensors.includes(sensor))) {
    const unexpectedSensors = resultSensors.filter(sensor => !validSensors.includes(sensor))
    throw new TypeError(`Sensors [${unexpectedSensors.join(', ')}] are not expected for this device`)
  }

  // Step 2: Validate sampling channels configuration
  resultSensors.forEach((sensor) => {
    const configChannelsForSensor = Object.keys(deviceConfig[sensor as keyof typeof deviceConfig] || {})
    const sensorSampling = result[sensor as keyof typeof result]?.configuration?.samplingChannels as {
      [key: string]: boolean
    } | undefined

    if (!sensorSampling) {
      return
    }

    // Check that every channel that is NOT in the config needs to have sampling turned off
    // If not, throw an error
    const sensorsNotInConfig = Object.keys(sensorSampling || {}).filter(c => !configChannelsForSensor.includes(c))
    // Get the sensors that are not in config BUT have true value
    const sensorsWithWrongValues = sensorsNotInConfig.filter(c => sensorSampling[c as keyof typeof sensorSampling] === true)
    // If any sensor is not in config but has true value, throw an error
    if (sensorsWithWrongValues.length > 0) {
      throw new TypeError(`Sampling channels [${sensorsWithWrongValues.join(', ')}] for sensor '${sensor}' are not expected for this device`)
    }
  })

  // Step 3: Assign channel names from device configuration
  validSensors.forEach((s) => {
    const validChannelKeys = Object.keys(deviceConfig[s as keyof typeof deviceConfig] || {}).filter(key => key !== 'identification')
    validChannelKeys.forEach((c) => {
      const sensorConfig = deviceConfig[s as keyof typeof deviceConfig]
      const channelConfig = sensorConfig[c as keyof typeof sensorConfig] as any as TULIP3ChannelConfig
      const cName = channelConfig.channelName as string
      // Now set the channelName inside the result

      // @ts-expect-error - valid access
      if (result?.[s]?.[c]) {
        // @ts-expect-error - valid access
        result[s][c].channelName = cName
      }
    })
  })
}

/**
 * Decodes configuration fields from a data array according to TULIP3 protocol.
 * This function performs the same validation and parsing as decodeRegisterRead
 * but throws errors instead of returning error objects for higher-level error handling.
 *
 * @param data - Raw byte array containing the configuration message data
 * @param config - Configuration object for the device sensor
 * @param options - Optional parsing options, such as start position and maximum register size
 * @returns Decoded configuration fields object
 * @throws {Error} If message length is invalid, subtype is unsupported, or parsing fails
 * @throws {TypeError} If register blocks or evaluation fails
 * @throws {RangeError} If message format is invalid
 */
export function decodeConfigurationRegisterRead<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig = FullTULIP3DeviceSensorConfig>(
  data: number[],
  config: TTULIP3DeviceSensorConfig,
  options: ParseRegisterBlocksOptions = {},
): ConfigurationReadRegistersResponseUplinkOutput<TTULIP3DeviceSensorConfig> {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x15,
    allowedSubTypes: [0x01, 0x02],
    minLength: 4,
    messageTypeName: 'Configuration',
  })

  // Evaluate register blocks
  const res = decodeRegisterRead<ConfigurationReadRegisterData<TTULIP3DeviceSensorConfig>>(
    data,
    createConfigurationRegisterLookup(),
    options,
  )

  // Validate and transform the result
  validateAndTransformConfigurationResult(res, config)

  // Return successfully parsed message with correct subtype
  return {
    data: {
      messageType,
      messageSubType,
      configuration: res,
    },
  }
}

/**
 * Decodes a configuration write response message according to TULIP3 protocol.
 *
 * Message structure:
 * - Byte 0: Message type (must be 0x15 for Configuration)
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
 * @param data - Raw byte array containing the configuration write response (validated integer array)
 * @returns Decoded configuration write response object
 * @throws {RangeError} If message length is invalid or message/sub-message type is incorrect
 * @throws {TypeError} If message type, sub-message type, or status code is invalid
 */
export function decodeConfigurationRegisterWrite(data: number[]): ConfigurationWriteRegistersResponseUplinkOutput {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x15,
    allowedSubTypes: [0x03],
    minLength: 4,
    messageTypeName: 'Configuration',
  })

  // Parse frame data using shared function
  const frameData = parseFrameData(data)

  // Return the structured response
  return {
    data: {
      messageType,
      messageSubType,
      configuration: frameData,
    },
  }
}
