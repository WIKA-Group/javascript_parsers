import type { TULIP3ChannelConfig, TULIP3DeviceConfig } from '../profile'

/**
 * Common validation utilities for TULIP3 message validation and transformation.
 */

/**
 * Assigns channel names from device configuration to result channels.
 *
 * @param validSensors - Array of valid sensor keys from device configuration
 * @param result - The decoded result object (modified in place)
 * @param deviceConfig - The device sensor configuration
 * @param excludeKey - Key to exclude when getting channel keys (e.g., 'configuration', 'identification')
 */
export function assignChannelNames<TResult extends Record<string, any>, TDeviceConfig extends TULIP3DeviceConfig>(
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
