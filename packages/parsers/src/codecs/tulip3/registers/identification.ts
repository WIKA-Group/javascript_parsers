import type { AnyRegisterLookup } from '.'
import type { Branded } from '../../../types'
import type { TULIP3DeviceConfig } from '../profile'
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
import { getChannelIdAddress, getSensorIdAddress } from '../../addresses'
import { createMissingComponentRegisterGuard, createRegisterGuard } from './utils'

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

export type IdentificationBrand = 'identification'

// branded type to have type safety that we can only use this lookup in identification messages
export type IdentificationRegisterLookup = Branded<AnyRegisterLookup, IdentificationBrand>

/**
 * Generate a complete identification register lookup table for all sensors and channels
 * @param deviceConfig Device configuration containing TULIP3 sensor/channel structure and register flags
 * @returns Complete identification register lookup table
 */
export function createIdentificationRegisterLookup<TTULIP3DeviceConfig extends TULIP3DeviceConfig>(deviceConfig: TTULIP3DeviceConfig): IdentificationRegisterLookup {
  const sensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const
  const channels = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

  const lookup: AnyRegisterLookup = {}

  const cmFlags = deviceConfig.registerConfig.tulip3IdentificationRegisters

  // === CM Information (0x000 - 0x03B) ===
  if (cmFlags.productId) {
    lookup[0x000] = createRegisterEntry('communicationModule.productId', 1, intTuple1ToUInt8)
  }
  else {
    lookup[0x000] = createRegisterGuard('Identification', 0x000, 'productId', 'communication module')
  }

  if (cmFlags.productSubId) {
    lookup[0x001] = createRegisterEntry('communicationModule.productSubId', 1, intTuple1ToProductSubId)
  }
  else {
    lookup[0x001] = createRegisterGuard('Identification', 0x001, 'productSubId', 'communication module')
  }

  if (cmFlags.channelPlan) {
    lookup[0x002] = createRegisterEntry('communicationModule.channelPlan', 1, intTuple1ToChannelPlan)
  }
  else {
    lookup[0x002] = createRegisterGuard('Identification', 0x002, 'channelPlan', 'communication module')
  }

  if (cmFlags.connectedSensors) {
    lookup[0x003] = createRegisterEntry('communicationModule.connectedSensors', 1, intTuple1ToConnectedSensors)
  }
  else {
    lookup[0x003] = createRegisterGuard('Identification', 0x003, 'connectedSensors', 'communication module')
  }

  if (cmFlags.firmwareVersion) {
    lookup[0x004] = createRegisterEntry('communicationModule.firmwareVersion', 3, intTuple3ToSemVer)
  }
  else {
    lookup[0x004] = createRegisterGuard('Identification', 0x004, 'firmwareVersion', 'communication module')
  }

  if (cmFlags.hardwareVersion) {
    lookup[0x007] = createRegisterEntry('communicationModule.hardwareVersion', 3, intTuple3ToSemVer)
  }
  else {
    lookup[0x007] = createRegisterGuard('Identification', 0x007, 'hardwareVersion', 'communication module')
  }

  if (cmFlags.productionDate) {
    lookup[0x00A] = createRegisterEntry('communicationModule.productionDate', 3, intTuple3ToDate)
  }
  else {
    lookup[0x00A] = createRegisterGuard('Identification', 0x00A, 'productionDate', 'communication module')
  }

  if (cmFlags.serialNumberPart1) {
    lookup[0x00D] = createRegisterEntry('communicationModule.serialNumberPart1', 5, intArrayToASCII)
  }
  else {
    lookup[0x00D] = createRegisterGuard('Identification', 0x00D, 'serialNumberPart1', 'communication module')
  }

  if (cmFlags.serialNumberPart2) {
    lookup[0x012] = createRegisterEntry('communicationModule.serialNumberPart2', 6, intArrayToASCII)
  }
  else {
    lookup[0x012] = createRegisterGuard('Identification', 0x012, 'serialNumberPart2', 'communication module')
  }
  // 0x018 - 0x03B RFU (36 bytes)

  // === Sensor Information (all sensors) ===
  sensors.forEach((sensorKey, index) => {
    const sensorNum = index + 1
    const sensorConfig = deviceConfig[sensorKey]
    const sensorIdBase = getSensorIdAddress(sensorNum, 0)

    // If sensor doesn't exist in device config, create guards for all its registers
    if (!sensorConfig) {
      const sensorContext = `sensor ${sensorNum}`
      lookup[sensorIdBase + 0x00] = createMissingComponentRegisterGuard('Identification', sensorIdBase + 0x00, 'sensorType', sensorContext)
      lookup[sensorIdBase + 0x02] = createMissingComponentRegisterGuard('Identification', sensorIdBase + 0x02, 'existingChannels', sensorContext)
      lookup[sensorIdBase + 0x03] = createMissingComponentRegisterGuard('Identification', sensorIdBase + 0x03, 'firmwareVersion', sensorContext)
      lookup[sensorIdBase + 0x06] = createMissingComponentRegisterGuard('Identification', sensorIdBase + 0x06, 'hardwareVersion', sensorContext)
      lookup[sensorIdBase + 0x09] = createMissingComponentRegisterGuard('Identification', sensorIdBase + 0x09, 'productionDate', sensorContext)
      lookup[sensorIdBase + 0x0C] = createMissingComponentRegisterGuard('Identification', sensorIdBase + 0x0C, 'serialNumberPart1', sensorContext)
      lookup[sensorIdBase + 0x11] = createMissingComponentRegisterGuard('Identification', sensorIdBase + 0x11, 'serialNumberPart2', sensorContext)
      return
    }

    const sensorFlags = sensorConfig.registerConfig.tulip3IdentificationRegisters
    const sensorContext = `sensor ${sensorNum}`

    if (sensorFlags.sensorType) {
      lookup[sensorIdBase + 0x00] = createRegisterEntry(`${sensorKey}.identification.sensorType`, 2, intTuple2ToUInt16)
    }
    else {
      lookup[sensorIdBase + 0x00] = createRegisterGuard('Identification', sensorIdBase + 0x00, 'sensorType', sensorContext)
    }
    // + 2
    if (sensorFlags.existingChannels) {
      lookup[sensorIdBase + 0x02] = createRegisterEntry(`${sensorKey}.identification.existingChannels`, 1, intTuple1ToExistingChannels)
    }
    else {
      lookup[sensorIdBase + 0x02] = createRegisterGuard('Identification', sensorIdBase + 0x02, 'existingChannels', sensorContext)
    }
    // + 1
    if (sensorFlags.firmwareVersion) {
      lookup[sensorIdBase + 0x03] = createRegisterEntry(`${sensorKey}.identification.firmwareVersion`, 3, intTuple3ToSemVer)
    }
    else {
      lookup[sensorIdBase + 0x03] = createRegisterGuard('Identification', sensorIdBase + 0x03, 'firmwareVersion', sensorContext)
    }
    // + 3
    if (sensorFlags.hardwareVersion) {
      lookup[sensorIdBase + 0x06] = createRegisterEntry(`${sensorKey}.identification.hardwareVersion`, 3, intTuple3ToSemVer)
    }
    else {
      lookup[sensorIdBase + 0x06] = createRegisterGuard('Identification', sensorIdBase + 0x06, 'hardwareVersion', sensorContext)
    }
    // + 3
    if (sensorFlags.productionDate) {
      lookup[sensorIdBase + 0x09] = createRegisterEntry(`${sensorKey}.identification.productionDate`, 3, intTuple3ToDate)
    }
    else {
      lookup[sensorIdBase + 0x09] = createRegisterGuard('Identification', sensorIdBase + 0x09, 'productionDate', sensorContext)
    }
    // + 3
    if (sensorFlags.serialNumberPart1) {
      lookup[sensorIdBase + 0x0C] = createRegisterEntry(`${sensorKey}.identification.serialNumberPart1`, 5, intArrayToASCII)
    }
    else {
      lookup[sensorIdBase + 0x0C] = createRegisterGuard('Identification', sensorIdBase + 0x0C, 'serialNumberPart1', sensorContext)
    }
    // + 5
    if (sensorFlags.serialNumberPart2) {
      lookup[sensorIdBase + 0x11] = createRegisterEntry(`${sensorKey}.identification.serialNumberPart2`, 6, intArrayToASCII)
    }
    else {
      lookup[sensorIdBase + 0x11] = createRegisterGuard('Identification', sensorIdBase + 0x11, 'serialNumberPart2', sensorContext)
    }
    // + 6
    // 0x17 - 0x3B RFU (37 bytes)

    // === Channel Information (all channels for each sensor) ===
    channels.forEach((channelKey, channelIndex) => {
      const channelNum = channelIndex + 1
      const channelConfig = sensorConfig[channelKey]
      const channelIdBase = getChannelIdAddress(sensorNum, channelNum, 0)

      // If channel doesn't exist in device config, create guards for all its registers
      if (!channelConfig) {
        const channelContext = `sensor ${sensorNum} channel ${channelNum}`
        lookup[channelIdBase + 0x00] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x00, 'measurand', channelContext)
        lookup[channelIdBase + 0x01] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x01, 'unit', channelContext)
        lookup[channelIdBase + 0x02] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x02, 'minMeasureRange', channelContext)
        lookup[channelIdBase + 0x06] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x06, 'maxMeasureRange', channelContext)
        lookup[channelIdBase + 0x0A] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x0A, 'minPhysicalLimit', channelContext)
        lookup[channelIdBase + 0x0E] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x0E, 'maxPhysicalLimit', channelContext)
        lookup[channelIdBase + 0x12] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x12, 'accuracy', channelContext)
        lookup[channelIdBase + 0x14] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x14, 'offset', channelContext)
        lookup[channelIdBase + 0x18] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x18, 'gain', channelContext)
        lookup[channelIdBase + 0x1C] = createMissingComponentRegisterGuard('Identification', channelIdBase + 0x1C, 'calibrationDate', channelContext)
        return
      }

      const channelFlags = channelConfig.registerConfig.tulip3IdentificationRegisters
      const channelContext = `sensor ${sensorNum} channel ${channelNum}`

      if (channelFlags.measurand) {
        lookup[channelIdBase + 0x00] = createRegisterEntry(`${sensorKey}.channel${channelNum}.measurand`, 1, intTuple1ToMeasurand)
      }
      else {
        lookup[channelIdBase + 0x00] = createRegisterGuard('Identification', channelIdBase + 0x00, 'measurand', channelContext)
      }

      if (channelFlags.unit) {
        lookup[channelIdBase + 0x01] = createRegisterEntry(`${sensorKey}.channel${channelNum}.unit`, 1, intTuple1ToUnit)
      }
      else {
        lookup[channelIdBase + 0x01] = createRegisterGuard('Identification', channelIdBase + 0x01, 'unit', channelContext)
      }

      if (channelFlags.minMeasureRange) {
        lookup[channelIdBase + 0x02] = createRegisterEntry(`${sensorKey}.channel${channelNum}.minMeasureRange`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[channelIdBase + 0x02] = createRegisterGuard('Identification', channelIdBase + 0x02, 'minMeasureRange', channelContext)
      }

      if (channelFlags.maxMeasureRange) {
        lookup[channelIdBase + 0x06] = createRegisterEntry(`${sensorKey}.channel${channelNum}.maxMeasureRange`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[channelIdBase + 0x06] = createRegisterGuard('Identification', channelIdBase + 0x06, 'maxMeasureRange', channelContext)
      }

      if (channelFlags.minPhysicalLimit) {
        lookup[channelIdBase + 0x0A] = createRegisterEntry(`${sensorKey}.channel${channelNum}.minPhysicalLimit`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[channelIdBase + 0x0A] = createRegisterGuard('Identification', channelIdBase + 0x0A, 'minPhysicalLimit', channelContext)
      }

      if (channelFlags.maxPhysicalLimit) {
        lookup[channelIdBase + 0x0E] = createRegisterEntry(`${sensorKey}.channel${channelNum}.maxPhysicalLimit`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[channelIdBase + 0x0E] = createRegisterGuard('Identification', channelIdBase + 0x0E, 'maxPhysicalLimit', channelContext)
      }

      if (channelFlags.accuracy) {
        lookup[channelIdBase + 0x12] = createRegisterEntry(`${sensorKey}.channel${channelNum}.accuracy`, 2, intTuple2ToAccuracyPercent)
      }
      else {
        lookup[channelIdBase + 0x12] = createRegisterGuard('Identification', channelIdBase + 0x12, 'accuracy', channelContext)
      }

      if (channelFlags.offset) {
        lookup[channelIdBase + 0x14] = createRegisterEntry(`${sensorKey}.channel${channelNum}.offset`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[channelIdBase + 0x14] = createRegisterGuard('Identification', channelIdBase + 0x14, 'offset', channelContext)
      }

      if (channelFlags.gain) {
        lookup[channelIdBase + 0x18] = createRegisterEntry(`${sensorKey}.channel${channelNum}.gain`, 4, intTuple4ToFloat32WithThreshold)
      }
      else {
        lookup[channelIdBase + 0x18] = createRegisterGuard('Identification', channelIdBase + 0x18, 'gain', channelContext)
      }

      if (channelFlags.calibrationDate) {
        lookup[channelIdBase + 0x1C] = createRegisterEntry(`${sensorKey}.channel${channelNum}.calibrationDate`, 3, intTuple3ToDate)
      }
      else {
        lookup[channelIdBase + 0x1C] = createRegisterGuard('Identification', channelIdBase + 0x1C, 'calibrationDate', channelContext)
      }
      // 0x1F - 0x31 RFU (19 bytes)
    })
  })

  // === Product Specific Information (0x76C - 0x7FF) ===
  // lookup[0x76C] = createRegisterEntry('Product specific information', 148, intArrayToASCII)

  return lookup as IdentificationRegisterLookup
}
