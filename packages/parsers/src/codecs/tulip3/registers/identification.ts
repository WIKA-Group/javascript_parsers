import type { AnyRegisterLookup, RegisterEntry } from '.'
import type { Branded } from '../../../types'
import {
  createRegisterEntry,
  intArrayToASCII,
  intTuple1ToChannelPlan,
  intTuple1ToConnectedSensors,
  intTuple1ToExistingChannels,
  intTuple1ToMeasurand,
  intTuple1ToProductSubId,
  intTuple1ToUInt8,
  intTuple1ToUnit,
  intTuple2ToAccuracyPercent,
  intTuple2ToUInt16,
  intTuple3ToDate,
  intTuple3ToSemVer,
  intTuple4ToFloat32WithThreshold,
} from '.'

/**
 * TULIP3 Identification Registers Lookup Table
 *
 * Based on WIKA TULIP3 Protocol Specification
 *
 * Register address mapping:
 * - 0x000 - 0x03B: CM information
 * - 0x03C - 0x077: Sensor 1 information (and similar ranges for sensors 2-4)
 * - 0x078 - 0x0A9: Channel 1 of sensor 1 information (and similar ranges for other channels)
 * - 0x76C - 0x7FF: Product specific information
 *
 * Address calculations:
 * - Sensor n base address = 0x03C + (n-1) * 460
 * - Channel m of sensor n base address = 0x03C + (n-1) * 400 + n * 60 + (m-1) * 50
 */

// Helper functions to generate register addresses
/**
 * Calculate the base address for a specific sensor's information section
 * @param sensorNumber Sensor number (1-4)
 * @returns Base address for the sensor information section
 */
function getSensorBaseAddress(sensorNumber: number): number {
  // First register address of Sensor n = First address of Sensor 1 + (n - 1) * 460(bytes)
  return 0x03C + (sensorNumber - 1) * 460
}

/**
 * Calculate the base address for a specific channel of a specific sensor
 * @param sensorNumber Sensor number (1-4)
 * @param channelNumber Channel number (1-8)
 * @returns Base address for the channel information section
 */
function getChannelBaseAddress(sensorNumber: number, channelNumber: number): number {
  // First address of Sensor 1 + (n - 1) * 400(bytes) + n * 60(bytes) + (m - 1) * 50(bytes)
  return 0x03C + (sensorNumber - 1) * 400 + sensorNumber * 60 + (channelNumber - 1) * 50
}

export type IdentificationBrand = 'identification'

// branded type to have type safety that we can only use this lookup in identification messages
export type IdentificationRegisterLookup = Branded<AnyRegisterLookup, IdentificationBrand>

/**
 * Generate a complete identification register lookup table for all sensors and channels
 * @returns Complete identification register lookup table
 */
export function createIdentificationRegisterLookup(): IdentificationRegisterLookup {
  const sensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const
  const channels = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

  const lookup: Record<number, RegisterEntry<any, any>> = {}

  // === CM Information (0x000 - 0x03B) ===
  lookup[0x000] = createRegisterEntry('communicationModule.productId', 1, intTuple1ToUInt8)
  lookup[0x001] = createRegisterEntry('communicationModule.productSubId', 1, intTuple1ToProductSubId)
  lookup[0x002] = createRegisterEntry('communicationModule.channelPlan', 1, intTuple1ToChannelPlan)
  lookup[0x003] = createRegisterEntry('communicationModule.connectedSensors', 1, intTuple1ToConnectedSensors)
  lookup[0x004] = createRegisterEntry('communicationModule.firmwareVersion', 3, intTuple3ToSemVer)
  lookup[0x007] = createRegisterEntry('communicationModule.hardwareVersion', 3, intTuple3ToSemVer)
  lookup[0x00A] = createRegisterEntry('communicationModule.productionDate', 3, intTuple3ToDate)
  lookup[0x00D] = createRegisterEntry('communicationModule.serialNumberPart1', 5, intArrayToASCII)
  lookup[0x012] = createRegisterEntry('communicationModule.serialNumberPart2', 6, intArrayToASCII)
  // 0x018 - 0x03B RFU (36 bytes)

  // === Sensor Information (all sensors) ===
  sensors.forEach((sensorKey, index) => {
    const sensorNum = index + 1
    const baseAddr = getSensorBaseAddress(sensorNum)

    lookup[baseAddr + 0x00] = createRegisterEntry(`${sensorKey}.identification.sensorType`, 2, intTuple2ToUInt16)
    // + 2
    lookup[baseAddr + 0x02] = createRegisterEntry(`${sensorKey}.identification.existingChannels`, 1, intTuple1ToExistingChannels)
    // + 1
    lookup[baseAddr + 0x03] = createRegisterEntry(`${sensorKey}.identification.firmwareVersion`, 3, intTuple3ToSemVer)
    // + 3
    lookup[baseAddr + 0x06] = createRegisterEntry(`${sensorKey}.identification.hardwareVersion`, 3, intTuple3ToSemVer)
    // + 3
    lookup[baseAddr + 0x09] = createRegisterEntry(`${sensorKey}.identification.productionDate`, 3, intTuple3ToDate)
    // + 3
    lookup[baseAddr + 0x0C] = createRegisterEntry(`${sensorKey}.identification.serialNumberPart1`, 5, intArrayToASCII)
    // + 5
    lookup[baseAddr + 0x11] = createRegisterEntry(`${sensorKey}.identification.serialNumberPart2`, 6, intArrayToASCII)
    // + 6
    // 0x17 - 0x3B RFU (37 bytes)

    // === Channel Information (all channels for each sensor) ===
    channels.forEach((channelKey, channelIndex) => {
      const channelNum = channelIndex + 1
      const baseAddr = getChannelBaseAddress(sensorNum, channelNum)

      lookup[baseAddr + 0x00] = createRegisterEntry(`${sensorKey}.channel${channelNum}.measurand`, 1, intTuple1ToMeasurand)
      lookup[baseAddr + 0x01] = createRegisterEntry(`${sensorKey}.channel${channelNum}.unit`, 1, intTuple1ToUnit)
      lookup[baseAddr + 0x02] = createRegisterEntry(`${sensorKey}.channel${channelNum}.minMeasureRange`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x06] = createRegisterEntry(`${sensorKey}.channel${channelNum}.maxMeasureRange`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x0A] = createRegisterEntry(`${sensorKey}.channel${channelNum}.minPhysicalLimit`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x0E] = createRegisterEntry(`${sensorKey}.channel${channelNum}.maxPhysicalLimit`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x12] = createRegisterEntry(`${sensorKey}.channel${channelNum}.accuracy`, 2, intTuple2ToAccuracyPercent)
      lookup[baseAddr + 0x14] = createRegisterEntry(`${sensorKey}.channel${channelNum}.offset`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x18] = createRegisterEntry(`${sensorKey}.channel${channelNum}.gain`, 4, intTuple4ToFloat32WithThreshold)
      lookup[baseAddr + 0x1C] = createRegisterEntry(`${sensorKey}.channel${channelNum}.calibrationDate`, 3, intTuple3ToDate)
      // 0x1F - 0x31 RFU (19 bytes)
    })
  })

  // === Product Specific Information (0x76C - 0x7FF) ===
  // lookup[0x76C] = createRegisterEntry('Product specific information', 148, intArrayToASCII)

  return lookup as IdentificationRegisterLookup
}

// Export helper functions for external use
export { getChannelBaseAddress, getSensorBaseAddress }
