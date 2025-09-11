import type { TULIP3ChannelConfig, TULIP3DeviceSensorConfig } from '../profile'

/**
 * Common validation utilities for TULIP3 message validation and transformation.
 */

/**
 * Validates that all result sensors are expected by the device configuration.
 *
 * @param resultSensors - Array of sensor keys from the decode result
 * @param validSensors - Array of sensor keys from the device configuration
 * @throws {TypeError} If any result sensor is not in the device configuration
 */
export function validateResultSensors(resultSensors: string[], validSensors: string[]): void {
  if (!resultSensors.every(sensor => validSensors.includes(sensor))) {
    const invalidSensors = resultSensors.filter(sensor => !validSensors.includes(sensor))
    const sensorText = invalidSensors.length === 1 ? 'Sensor' : 'Sensors'
    throw new TypeError(
      `${sensorText} [${invalidSensors.join(', ')}] ${invalidSensors.length === 1 ? 'is' : 'are'} not supported by this device`,
    )
  }
}

/**
 * Validates channel configurations for sensors.
 *
 * @param resultSensors - Array of sensor keys from the decode result
 * @param result - The decoded result object
 * @param deviceConfig - The device sensor configuration
 * @param excludeKey - Key to exclude when getting channel keys (e.g., 'configuration', 'identification')
 * @throws {TypeError} If any channel is not supported by the device configuration
 */
export function validateSensorChannels<TResult extends Record<string, any>, TDeviceConfig extends TULIP3DeviceSensorConfig>(
  resultSensors: string[],
  result: TResult,
  deviceConfig: TDeviceConfig,
  excludeKey: string,
): void {
  for (const sensor of resultSensors) {
    const resultChannelKeys = Object.keys(result[sensor as keyof typeof result] || {})
      .filter(key => key !== excludeKey)
    const validChannelKeys = Object.keys(deviceConfig[sensor as keyof typeof deviceConfig] || {})
      .filter(key => key !== excludeKey)

    const invalidChannels = resultChannelKeys.filter(channel => !validChannelKeys.includes(channel))
    if (invalidChannels.length > 0) {
      const channelText = invalidChannels.length === 1 ? 'Channel' : 'Channels'
      throw new TypeError(
        `${channelText} ${invalidChannels.join(', ')} on sensor ${sensor} ${invalidChannels.length === 1 ? 'is' : 'are'} not supported by this device`,
      )
    }
  }
}

/**
 * Assigns channel names from device configuration to result channels.
 *
 * @param validSensors - Array of valid sensor keys from device configuration
 * @param result - The decoded result object (modified in place)
 * @param deviceConfig - The device sensor configuration
 * @param excludeKey - Key to exclude when getting channel keys (e.g., 'configuration', 'identification')
 */
export function assignChannelNames<TResult extends Record<string, any>, TDeviceConfig extends TULIP3DeviceSensorConfig>(
  validSensors: string[],
  result: TResult,
  deviceConfig: TDeviceConfig,
  excludeKey: string,
): void {
  validSensors.forEach((sensorKey) => {
    const sensorConfig = deviceConfig[sensorKey as keyof typeof deviceConfig]
    if (!sensorConfig)
      return

    const validChannelKeys = Object.keys(sensorConfig).filter(key => key !== excludeKey)

    validChannelKeys.forEach((channelKey) => {
      const channelConfig = sensorConfig[channelKey as keyof typeof sensorConfig] as any as TULIP3ChannelConfig
      const channelName = channelConfig?.channelName as string | undefined

      if (channelName) {
        if (result?.[sensorKey]?.[channelKey]) {
          result[sensorKey][channelKey].channelName = channelName
        }
      }
    })
  })
}
