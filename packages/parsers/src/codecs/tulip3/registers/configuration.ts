import type { AnyRegisterLookup, RegisterEntry } from '.'
import type { Branded } from '../../../types'
import {
  createRegisterEntry,
  intTuple1ToBoolean,
  intTuple1ToInt8,
  intTuple1ToUInt8,
  intTuple2ToUInt16,
  intTuple4ToFloat32WithThreshold,
  intTuple4ToUInt32,
} from '.'
import {
  intTuple1ToProcessAlarmEnabled,
  intTuple1ToProtocolDataType,
  intTuple1ToSampleChannels,
} from './parsing'

/**
 * TULIP3 Configuration Registers Lookup Table
 *
 * Based on WIKA TULIP3 Protocol Specification
 *
 * Register address mapping:
 * - 0x000 - 0x029: CM configuration
 * - 0x02A - 0x046: Sensor 1 configuration
 * - 0x047 - 0x080: Channel 1 of sensor 1 configuration
 * - 0x081 - 0x0BA: Channel 2 of sensor 1 configuration
 * - ... (pattern continues for all channels and sensors)
 * - 0x7DE - 0x7FF: Product specific configuration
 *
 * Address calculations:
 * - Sensor n base address = 0x02A + (n-1) * 493
 * - Channel m of sensor n base address = 0x047 + (n-1) * 464 + n * 29 + (m-1) * 58
 */

// Helper functions to generate register addresses

/**
 * Calculate the base address for a specific sensor's configuration section
 * @param sensorNumber Sensor number (1-4)
 * @returns Base address for the sensor configuration section
 */
function getSensorConfigBaseAddress(sensorNumber: number): number {
  // First register address of Sensor n = First address of Sensor 1 + (n - 1) * 493(bytes)
  return 0x02A + (sensorNumber - 1) * 493
}

/**
 * Calculate the base address for a specific channel of a specific sensor in configuration
 * @param sensorNumber Sensor number (1-4)
 * @param channelNumber Channel number (1-8)
 * @returns Base address for the channel configuration section
 */
function getChannelConfigBaseAddress(sensorNumber: number, channelNumber: number): number {
  // First register address of Channel m of Sensor n = First address of Sensor 1 + (n - 1) * 464 + n * 29 + (m - 1) * 58
  return 0x02A + (sensorNumber - 1) * 464 + sensorNumber * 29 + (channelNumber - 1) * 58
}

export type ConfigurationBrand = 'configuration'

// branded type to have type safety that we can only use this lookup in Configuration messages
export type ConfigurationRegisterLookup = Branded<AnyRegisterLookup, ConfigurationBrand>

/**
 * Generate a complete configuration register lookup table for all sensors and channels
 * @returns Complete configuration register lookup table
 */
export function createConfigurationRegisterLookup(): ConfigurationRegisterLookup {
  const sensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const
  const channels = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

  const lookup: Record<number, RegisterEntry<any, any>> = {}

  // === CM Configuration (0x000 - 0x029) ===
  lookup[0x000] = createRegisterEntry('communicationModule.measuringPeriodAlarmOff', 4, intTuple4ToUInt32)
  lookup[0x004] = createRegisterEntry('communicationModule.measuringPeriodAlarmOn', 4, intTuple4ToUInt32)
  lookup[0x008] = createRegisterEntry('communicationModule.transmissionRateAlarmOff', 2, intTuple2ToUInt16)
  lookup[0x00A] = createRegisterEntry('communicationModule.transmissionRateAlarmOn', 2, intTuple2ToUInt16)
  lookup[0x00C] = createRegisterEntry('communicationModule.overVoltageThreshold', 2, intTuple2ToUInt16)
  lookup[0x00E] = createRegisterEntry('communicationModule.underVoltageThreshold', 2, intTuple2ToUInt16)
  lookup[0x010] = createRegisterEntry('communicationModule.overTemperatureCmChip', 1, intTuple1ToInt8)
  lookup[0x011] = createRegisterEntry('communicationModule.underTemperatureCmChip', 1, intTuple1ToInt8)
  lookup[0x012] = createRegisterEntry('communicationModule.downlinkAnswerTimeout', 1, intTuple1ToUInt8)
  lookup[0x013] = createRegisterEntry('communicationModule.fetchAdditionalDownlinkTimeInterval', 1, intTuple1ToUInt8)
  lookup[0x014] = createRegisterEntry('communicationModule.enableBleAdvertising', 1, intTuple1ToBoolean)
  // 0x015 - 0x029 RFU (21 bytes)

  // === Sensor Configuration (all sensors) ===
  sensors.forEach((sensorKey, index) => {
    const sensorNum = index + 1
    const baseAddr = getSensorConfigBaseAddress(sensorNum)

    lookup[baseAddr + 0x00] = createRegisterEntry(`${sensorKey}.configuration.samplingChannels`, 1, intTuple1ToSampleChannels)
    lookup[baseAddr + 0x01] = createRegisterEntry(`${sensorKey}.configuration.bootTime`, 2, intTuple2ToUInt16)
    lookup[baseAddr + 0x03] = createRegisterEntry(`${sensorKey}.configuration.communicationTimeout`, 2, intTuple2ToUInt16)
    lookup[baseAddr + 0x05] = createRegisterEntry(`${sensorKey}.configuration.communicationRetryCount`, 1, intTuple1ToUInt8)
    // 0x06 - 0x1C RFU (23 bytes)

    // === Channel Configuration (all channels for each sensor) ===
    channels.forEach((channelKey, channelIndex) => {
      const channelNum = channelIndex + 1
      const baseAddr = getChannelConfigBaseAddress(sensorNum, channelNum)

      lookup[baseAddr + 0x00] = createRegisterEntry(`${sensorKey}.${channelKey}.protocolDataType`, 1, intTuple1ToProtocolDataType)
      lookup[baseAddr + 0x01] = createRegisterEntry(`${sensorKey}.${channelKey}.processAlarmEnabled`, 1, intTuple1ToProcessAlarmEnabled)
      lookup[baseAddr + 0x02] = createRegisterEntry(`${sensorKey}.${channelKey}.processAlarmDeadBand`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x06] = createRegisterEntry(`${sensorKey}.${channelKey}.lowThresholdAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x0A] = createRegisterEntry(`${sensorKey}.${channelKey}.highThresholdAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x0E] = createRegisterEntry(`${sensorKey}.${channelKey}.fallingSlopeAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x12] = createRegisterEntry(`${sensorKey}.${channelKey}.risingSlopeAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x16] = createRegisterEntry(`${sensorKey}.${channelKey}.lowThresholdWithDelayAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x1A] = createRegisterEntry(`${sensorKey}.${channelKey}.lowThresholdWithDelayAlarmDelay`, 2, intTuple2ToUInt16)
      lookup[baseAddr + 0x1C] = createRegisterEntry(`${sensorKey}.${channelKey}.highThresholdWithDelayAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x20] = createRegisterEntry(`${sensorKey}.${channelKey}.highThresholdWithDelayAlarmDelay`, 2, intTuple2ToUInt16)
      // 0x23 - 0x39 RFU (24 bytes)
    })
  })

  // === Product Specific Configuration (0x7DE - 0x7FF) ===

  return lookup as ConfigurationRegisterLookup
}

// Export helper functions for external use
export { getChannelConfigBaseAddress, getSensorConfigBaseAddress }
