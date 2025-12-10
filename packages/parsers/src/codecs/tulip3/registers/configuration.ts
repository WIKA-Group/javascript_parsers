import type { AnyRegisterLookup } from '.'
import type { Branded } from '../../../types'
import type { TULIP3DeviceConfig } from '../profile'
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
import { createMissingComponentRegisterGuard, createRegisterGuard } from './utils'

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
 * @param deviceConfig Device configuration containing TULIP3 sensor/channel structure and register flags
 * @returns Complete configuration register lookup table
 */
export function createConfigurationRegisterLookup<TTULIP3DeviceConfig extends TULIP3DeviceConfig>(deviceConfig: TTULIP3DeviceConfig): ConfigurationRegisterLookup {
  const sensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const
  const channels = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

  const lookup: AnyRegisterLookup = {}

  const cmFlags = deviceConfig.registerConfig.tulip3ConfigurationRegisters

  // === CM Configuration (0x000 - 0x029) ===
  if (cmFlags.measuringPeriodAlarmOff) {
    lookup[0x000] = createRegisterEntry('communicationModule.measuringPeriodAlarmOff', 4, intTuple4ToUInt32)
  }
  else {
    lookup[0x000] = createRegisterGuard('Configuration', 0x000, 'measuringPeriodAlarmOff', 'communication module')
  }

  if (cmFlags.measuringPeriodAlarmOn) {
    lookup[0x004] = createRegisterEntry('communicationModule.measuringPeriodAlarmOn', 4, intTuple4ToUInt32)
  }
  else {
    lookup[0x004] = createRegisterGuard('Configuration', 0x004, 'measuringPeriodAlarmOn', 'communication module')
  }

  if (cmFlags.transmissionRateAlarmOff) {
    lookup[0x008] = createRegisterEntry('communicationModule.transmissionRateAlarmOff', 2, intTuple2ToUInt16)
  }
  else {
    lookup[0x008] = createRegisterGuard('Configuration', 0x008, 'transmissionRateAlarmOff', 'communication module')
  }

  if (cmFlags.transmissionRateAlarmOn) {
    lookup[0x00A] = createRegisterEntry('communicationModule.transmissionRateAlarmOn', 2, intTuple2ToUInt16)
  }
  else {
    lookup[0x00A] = createRegisterGuard('Configuration', 0x00A, 'transmissionRateAlarmOn', 'communication module')
  }

  if (cmFlags.overVoltageThreshold) {
    lookup[0x00C] = createRegisterEntry('communicationModule.overVoltageThreshold', 2, intTuple2ToUInt16)
  }
  else {
    lookup[0x00C] = createRegisterGuard('Configuration', 0x00C, 'overVoltageThreshold', 'communication module')
  }

  if (cmFlags.underVoltageThreshold) {
    lookup[0x00E] = createRegisterEntry('communicationModule.underVoltageThreshold', 2, intTuple2ToUInt16)
  }
  else {
    lookup[0x00E] = createRegisterGuard('Configuration', 0x00E, 'underVoltageThreshold', 'communication module')
  }

  if (cmFlags.overTemperatureCmChip) {
    lookup[0x010] = createRegisterEntry('communicationModule.overTemperatureCmChip', 1, intTuple1ToInt8)
  }
  else {
    lookup[0x010] = createRegisterGuard('Configuration', 0x010, 'overTemperatureCmChip', 'communication module')
  }

  if (cmFlags.underTemperatureCmChip) {
    lookup[0x011] = createRegisterEntry('communicationModule.underTemperatureCmChip', 1, intTuple1ToInt8)
  }
  else {
    lookup[0x011] = createRegisterGuard('Configuration', 0x011, 'underTemperatureCmChip', 'communication module')
  }

  if (cmFlags.downlinkAnswerTimeout) {
    lookup[0x012] = createRegisterEntry('communicationModule.downlinkAnswerTimeout', 1, intTuple1ToUInt8)
  }
  else {
    lookup[0x012] = createRegisterGuard('Configuration', 0x012, 'downlinkAnswerTimeout', 'communication module')
  }

  if (cmFlags.fetchAdditionalDownlinkTimeInterval) {
    lookup[0x013] = createRegisterEntry('communicationModule.fetchAdditionalDownlinkTimeInterval', 1, intTuple1ToUInt8)
  }
  else {
    lookup[0x013] = createRegisterGuard('Configuration', 0x013, 'fetchAdditionalDownlinkTimeInterval', 'communication module')
  }

  if (cmFlags.enableBleAdvertising) {
    lookup[0x014] = createRegisterEntry('communicationModule.enableBleAdvertising', 1, intTuple1ToBoolean)
  }
  else {
    lookup[0x014] = createRegisterGuard('Configuration', 0x014, 'enableBleAdvertising', 'communication module')
  }
  // 0x015 - 0x029 RFU (21 bytes)

  // === Sensor Configuration (all sensors) ===
  sensors.forEach((sensorKey, index) => {
    const sensorNum = index + 1
    const baseAddr = getSensorConfigBaseAddress(sensorNum)
    const sensorConfig = deviceConfig[sensorKey]

    // If sensor doesn't exist in device config, create guards for all its registers
    if (!sensorConfig) {
      const sensorContext = `sensor ${sensorNum}`
      lookup[baseAddr + 0x00] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x00, 'samplingChannels', sensorContext)
      lookup[baseAddr + 0x01] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x01, 'bootTime', sensorContext)
      lookup[baseAddr + 0x03] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x03, 'communicationTimeout', sensorContext)
      lookup[baseAddr + 0x05] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x05, 'communicationRetryCount', sensorContext)
      return
    }

    const sensorFlags = sensorConfig.registerConfig.tulip3ConfigurationRegisters
    const sensorContext = `sensor ${sensorNum}`

    if (sensorFlags.samplingChannels) {
      lookup[baseAddr + 0x00] = createRegisterEntry(`${sensorKey}.configuration.samplingChannels`, 1, intTuple1ToSampleChannels)
    }
    else {
      lookup[baseAddr + 0x00] = createRegisterGuard('Configuration', baseAddr + 0x00, 'samplingChannels', sensorContext)
    }

    if (sensorFlags.bootTime) {
      lookup[baseAddr + 0x01] = createRegisterEntry(`${sensorKey}.configuration.bootTime`, 2, intTuple2ToUInt16)
    }
    else {
      lookup[baseAddr + 0x01] = createRegisterGuard('Configuration', baseAddr + 0x01, 'bootTime', sensorContext)
    }

    if (sensorFlags.communicationTimeout) {
      lookup[baseAddr + 0x03] = createRegisterEntry(`${sensorKey}.configuration.communicationTimeout`, 2, intTuple2ToUInt16)
    }
    else {
      lookup[baseAddr + 0x03] = createRegisterGuard('Configuration', baseAddr + 0x03, 'communicationTimeout', sensorContext)
    }

    if (sensorFlags.communicationRetryCount) {
      lookup[baseAddr + 0x05] = createRegisterEntry(`${sensorKey}.configuration.communicationRetryCount`, 1, intTuple1ToUInt8)
    }
    else {
      lookup[baseAddr + 0x05] = createRegisterGuard('Configuration', baseAddr + 0x05, 'communicationRetryCount', sensorContext)
    }
    // 0x06 - 0x1C RFU (23 bytes)

    // === Channel Configuration (all channels for each sensor) ===
    channels.forEach((channelKey, channelIndex) => {
      const channelNum = channelIndex + 1
      const baseAddr = getChannelConfigBaseAddress(sensorNum, channelNum)
      const channelConfig = sensorConfig[channelKey]

      // If channel doesn't exist in device config, create guards for all its registers
      if (!channelConfig) {
        const channelContext = `sensor ${sensorNum} channel ${channelNum}`
        lookup[baseAddr + 0x00] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x00, 'protocolDataType', channelContext)
        lookup[baseAddr + 0x01] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x01, 'processAlarmEnabled', channelContext)
        lookup[baseAddr + 0x02] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x02, 'processAlarmDeadBand', channelContext)
        lookup[baseAddr + 0x06] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x06, 'lowThresholdAlarmValue', channelContext)
        lookup[baseAddr + 0x0A] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x0A, 'highThresholdAlarmValue', channelContext)
        lookup[baseAddr + 0x0E] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x0E, 'fallingSlopeAlarmValue', channelContext)
        lookup[baseAddr + 0x12] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x12, 'risingSlopeAlarmValue', channelContext)
        lookup[baseAddr + 0x16] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x16, 'lowThresholdWithDelayAlarmValue', channelContext)
        lookup[baseAddr + 0x1A] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x1A, 'lowThresholdWithDelayAlarmDelay', channelContext)
        lookup[baseAddr + 0x1C] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x1C, 'highThresholdWithDelayAlarmValue', channelContext)
        lookup[baseAddr + 0x20] = createMissingComponentRegisterGuard('Configuration', baseAddr + 0x20, 'highThresholdWithDelayAlarmDelay', channelContext)
        return
      }

      const channelFlags = channelConfig.registerConfig.tulip3ConfigurationRegisters
      const channelContext = `sensor ${sensorNum} channel ${channelNum}`

      if (channelFlags.protocolDataType) {
        lookup[baseAddr + 0x00] = createRegisterEntry(`${sensorKey}.${channelKey}.protocolDataType`, 1, intTuple1ToProtocolDataType)
      }
      else {
        lookup[baseAddr + 0x00] = createRegisterGuard('Configuration', baseAddr + 0x00, 'protocolDataType', channelContext)
      }

      if (channelFlags.processAlarmEnabled) {
        lookup[baseAddr + 0x01] = createRegisterEntry(`${sensorKey}.${channelKey}.processAlarmEnabled`, 1, intTuple1ToProcessAlarmEnabled)
      }
      else {
        lookup[baseAddr + 0x01] = createRegisterGuard('Configuration', baseAddr + 0x01, 'processAlarmEnabled', channelContext)
      }

      if (channelFlags.processAlarmDeadBand) {
        lookup[baseAddr + 0x02] = createRegisterEntry(`${sensorKey}.${channelKey}.processAlarmDeadBand`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[baseAddr + 0x02] = createRegisterGuard('Configuration', baseAddr + 0x02, 'processAlarmDeadBand', channelContext)
      }

      if (channelFlags.lowThresholdAlarmValue) {
        lookup[baseAddr + 0x06] = createRegisterEntry(`${sensorKey}.${channelKey}.lowThresholdAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[baseAddr + 0x06] = createRegisterGuard('Configuration', baseAddr + 0x06, 'lowThresholdAlarmValue', channelContext)
      }

      if (channelFlags.highThresholdAlarmValue) {
        lookup[baseAddr + 0x0A] = createRegisterEntry(`${sensorKey}.${channelKey}.highThresholdAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[baseAddr + 0x0A] = createRegisterGuard('Configuration', baseAddr + 0x0A, 'highThresholdAlarmValue', channelContext)
      }

      if (channelFlags.fallingSlopeAlarmValue) {
        lookup[baseAddr + 0x0E] = createRegisterEntry(`${sensorKey}.${channelKey}.fallingSlopeAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[baseAddr + 0x0E] = createRegisterGuard('Configuration', baseAddr + 0x0E, 'fallingSlopeAlarmValue', channelContext)
      }

      if (channelFlags.risingSlopeAlarmValue) {
        lookup[baseAddr + 0x12] = createRegisterEntry(`${sensorKey}.${channelKey}.risingSlopeAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[baseAddr + 0x12] = createRegisterGuard('Configuration', baseAddr + 0x12, 'risingSlopeAlarmValue', channelContext)
      }

      if (channelFlags.lowThresholdWithDelayAlarmValue) {
        lookup[baseAddr + 0x16] = createRegisterEntry(`${sensorKey}.${channelKey}.lowThresholdWithDelayAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[baseAddr + 0x16] = createRegisterGuard('Configuration', baseAddr + 0x16, 'lowThresholdWithDelayAlarmValue', channelContext)
      }

      if (channelFlags.lowThresholdWithDelayAlarmDelay) {
        lookup[baseAddr + 0x1A] = createRegisterEntry(`${sensorKey}.${channelKey}.lowThresholdWithDelayAlarmDelay`, 2, intTuple2ToUInt16)
      }
      else {
        lookup[baseAddr + 0x1A] = createRegisterGuard('Configuration', baseAddr + 0x1A, 'lowThresholdWithDelayAlarmDelay', channelContext)
      }

      if (channelFlags.highThresholdWithDelayAlarmValue) {
        lookup[baseAddr + 0x1C] = createRegisterEntry(`${sensorKey}.${channelKey}.highThresholdWithDelayAlarmValue`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[baseAddr + 0x1C] = createRegisterGuard('Configuration', baseAddr + 0x1C, 'highThresholdWithDelayAlarmValue', channelContext)
      }

      if (channelFlags.highThresholdWithDelayAlarmDelay) {
        lookup[baseAddr + 0x20] = createRegisterEntry(`${sensorKey}.${channelKey}.highThresholdWithDelayAlarmDelay`, 2, intTuple2ToUInt16)
      }
      else {
        lookup[baseAddr + 0x20] = createRegisterGuard('Configuration', baseAddr + 0x20, 'highThresholdWithDelayAlarmDelay', channelContext)
      }
      // 0x23 - 0x39 RFU (24 bytes)
    })
  })

  // === Product Specific Configuration (0x7DE - 0x7FF) ===

  return lookup as ConfigurationRegisterLookup
}

// Export helper functions for external use
export { getChannelConfigBaseAddress, getSensorConfigBaseAddress }
