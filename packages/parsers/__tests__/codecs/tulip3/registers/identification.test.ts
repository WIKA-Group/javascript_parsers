import type { TULIP3DeviceConfig } from '../../../../src/codecs/tulip3/profile'
import { describe, expect, it } from 'vitest'
import {
  getChannelIdAddress,
  getSensorIdAddress,
} from '../../../../src/codecs/addresses'
import { createIdentificationRegisterLookup } from '../../../../src/codecs/tulip3/registers/identification'
import {
  completeChannelRegisterConfig,
  completeSensorRegisterConfig,
  completeTULIP3DeviceConfig,
  createDefaultChannelAlarmFlags,
  createDefaultCommunicationModuleAlarmFlags,
  createDefaultSensorAlarmFlags,
} from '../presets'

describe('tULIP3 identification register generation', () => {
  describe('pEW device configuration Register generation', () => {
    it('should create register lookup with correct addresses for PEW configuration', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      // Check Communication Module registers (should always be present)
      expect(lookup[0x000]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[0x000]!.path).toBe('communicationModule.productId')
      expect(lookup[0x001]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[0x001]!.path).toBe('communicationModule.productSubId')
      expect(lookup[0x003]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[0x003]!.path).toBe('communicationModule.connectedSensors')

      // Check Sensor 1 registers
      const sensor1BaseAddr = 0x03C
      expect(lookup[sensor1BaseAddr + 0x00]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[sensor1BaseAddr + 0x00]!.path).toBe('sensor1.identification.sensorType')
      expect(lookup[sensor1BaseAddr + 0x02]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[sensor1BaseAddr + 0x02]!.path).toBe('sensor1.identification.existingChannels')
      expect(lookup[sensor1BaseAddr + 0x03]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[sensor1BaseAddr + 0x03]!.path).toBe('sensor1.identification.firmwareVersion')

      // Check Channel 1 registers
      const channel1BaseAddr = 0x78
      expect(lookup[channel1BaseAddr + 0x00]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel1BaseAddr + 0x00]!.path).toBe('sensor1.channel1.measurand')
      expect(lookup[channel1BaseAddr + 0x01]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel1BaseAddr + 0x01]!.path).toBe('sensor1.channel1.unit')
      expect(lookup[channel1BaseAddr + 0x02]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel1BaseAddr + 0x02]!.path).toBe('sensor1.channel1.minMeasureRange')

      // Check Channel 2 registers
      const channel2BaseAddr = 0xAA
      expect(lookup[channel2BaseAddr + 0x00]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel2BaseAddr + 0x00]!.path).toBe('sensor1.channel2.measurand')
      expect(lookup[channel2BaseAddr + 0x01]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel2BaseAddr + 0x01]!.path).toBe('sensor1.channel2.unit')
      expect(lookup[channel2BaseAddr + 0x02]).toBeDefined()
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel2BaseAddr + 0x02]!.path).toBe('sensor1.channel2.minMeasureRange')
    })

    it('should have registers for all sensors', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      // Check that all sensor registers are present
      const sensor1BaseAddr = getSensorIdAddress(1, 0) // 0x03C
      const sensor2BaseAddr = getSensorIdAddress(2, 0) // 0x03C + (2-1) * 460 = 0x200
      const sensor3BaseAddr = getSensorIdAddress(3, 0) // 0x03C + (3-1) * 460 = 0x3C4
      const sensor4BaseAddr = getSensorIdAddress(4, 0) // 0x03C + (4-1) * 460 = 0x588

      expect(lookup[sensor1BaseAddr]).toBeDefined()
      expect(lookup[sensor2BaseAddr]).toBeDefined()
      expect(lookup[sensor3BaseAddr]).toBeDefined()
      expect(lookup[sensor4BaseAddr]).toBeDefined()
    })

    it('should have registers for all channels of all sensors', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      // Check that all channels 1-8 of all sensors 1-4 are present
      for (let sensorNum = 1; sensorNum <= 4; sensorNum++) {
        for (let channelNum = 1; channelNum <= 8; channelNum++) {
          const channelBaseAddr = getChannelIdAddress(sensorNum, channelNum, 0)
          expect(lookup[channelBaseAddr]).toBeDefined()
          // @ts-expect-error - we assume its a registerEntry not a guard
          expect(lookup[channelBaseAddr]!.path).toBe(`sensor${sensorNum}.channel${channelNum}.measurand`)
        }
      }
    })

    it('should have correct register sizes and types', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      // Communication Module registers
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[0x000]!.size).toBe(1) // productId
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[0x004]!.size).toBe(3) // firmwareVersion
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[0x00D]!.size).toBe(5) // serialNumberPart1

      // Sensor registers
      const sensor1BaseAddr = 0x03C
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[sensor1BaseAddr + 0x00]!.size).toBe(2) // sensorType
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[sensor1BaseAddr + 0x02]!.size).toBe(1) // existingChannels
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[sensor1BaseAddr + 0x03]!.size).toBe(3) // firmwareVersion

      // Channel registers
      const channel1BaseAddr = 0x78
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel1BaseAddr + 0x00]!.size).toBe(1) // measurand
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel1BaseAddr + 0x02]!.size).toBe(4) // minMeasureRange (float32)
      // @ts-expect-error - we assume its a registerEntry not a guard
      expect(lookup[channel1BaseAddr + 0x12]!.size).toBe(2) // accuracy
    })

    it('should verify no overlapping address ranges', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())
      const addresses = Object.keys(lookup).map(Number).sort((a, b) => a - b)

      // Check that no two registers overlap
      for (let i = 0; i < addresses.length - 1; i++) {
        const currentAddr = addresses[i]!
        const nextAddr = addresses[i + 1]
        const currentRegister = lookup[currentAddr]!

        // Next register should start after current register ends
        // @ts-expect-error - we assume its a registerEntry not a guard
        expect(nextAddr).toBeGreaterThanOrEqual(currentAddr + currentRegister.size)
      }
    })

    it('should have RFU ranges empty but all sensors present', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      // RFU ranges that should be empty (these are protocol gaps)
      const rfuRanges = [
        { start: 0x018, end: 0x03B }, // CM RFU range
      ]

      rfuRanges.forEach(({ start, end }) => {
        for (let addr = start; addr <= end; addr++) {
          expect(lookup[addr], `Address ${addr.toString(16)} should be undefined`).toBeUndefined()
        }
      })

      // All sensors should now be present with registers
      const sensor1Range = { start: getSensorIdAddress(1, 0), end: getSensorIdAddress(1, 0) + 460 - 1 }
      const sensor2Range = { start: getSensorIdAddress(2, 0), end: getSensorIdAddress(2, 0) + 460 - 1 }
      const sensor3Range = { start: getSensorIdAddress(3, 0), end: getSensorIdAddress(3, 0) + 460 - 1 }
      const sensor4Range = { start: getSensorIdAddress(4, 0), end: getSensorIdAddress(4, 0) + 460 - 1 }

      // Check that each sensor has at least some registers defined
      ;[sensor1Range, sensor2Range, sensor3Range, sensor4Range].forEach(({ start }, index) => {
        const sensorNum = index + 1
        expect(lookup[start]).toBeDefined() // First register of each sensor should be present
        // @ts-expect-error - we assume its a registerEntry not a guard
        expect(lookup[start]!.path).toBe(`sensor${sensorNum}.identification.sensorType`)
      })
    })

    it('should generate lookup with all required CM registers', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      const requiredCMRegisters = [
        { addr: 0x000, path: 'communicationModule.productId', size: 1 },
        { addr: 0x001, path: 'communicationModule.productSubId', size: 1 },
        { addr: 0x002, path: 'communicationModule.channelPlan', size: 1 },
        { addr: 0x003, path: 'communicationModule.connectedSensors', size: 1 },
        { addr: 0x004, path: 'communicationModule.firmwareVersion', size: 3 },
        { addr: 0x007, path: 'communicationModule.hardwareVersion', size: 3 },
        { addr: 0x00A, path: 'communicationModule.productionDate', size: 3 },
        { addr: 0x00D, path: 'communicationModule.serialNumberPart1', size: 5 },
        { addr: 0x012, path: 'communicationModule.serialNumberPart2', size: 6 },
      ]

      requiredCMRegisters.forEach(({ addr, path, size }) => {
        expect(lookup[addr]).toBeDefined()
        // @ts-expect-error - we assume its a registerEntry not a guard
        expect(lookup[addr]!.path).toBe(path)
        // @ts-expect-error - we assume its a registerEntry not a guard
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should generate lookup with all required sensor registers', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())
      const sensor1BaseAddr = 0x03C

      const requiredSensorRegisters = [
        { offset: 0x00, path: 'sensor1.identification.sensorType', size: 2 },
        { offset: 0x02, path: 'sensor1.identification.existingChannels', size: 1 },
        { offset: 0x03, path: 'sensor1.identification.firmwareVersion', size: 3 },
        { offset: 0x06, path: 'sensor1.identification.hardwareVersion', size: 3 },
        { offset: 0x09, path: 'sensor1.identification.productionDate', size: 3 },
        { offset: 0x0C, path: 'sensor1.identification.serialNumberPart1', size: 5 },
        { offset: 0x11, path: 'sensor1.identification.serialNumberPart2', size: 6 },
      ]

      requiredSensorRegisters.forEach(({ offset, path, size }) => {
        const addr = sensor1BaseAddr + offset
        expect(lookup[addr]).toBeDefined()
        // @ts-expect-error - we assume its a registerEntry not a guard
        expect(lookup[addr]!.path).toBe(path)
        // @ts-expect-error - we assume its a registerEntry not a guard
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should generate lookup with all required channel registers', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      const channelOffsets = [
        { offset: 0x00, suffix: 'measurand', size: 1 },
        { offset: 0x01, suffix: 'unit', size: 1 },
        { offset: 0x02, suffix: 'minMeasureRange', size: 4 },
        { offset: 0x06, suffix: 'maxMeasureRange', size: 4 },
        { offset: 0x0A, suffix: 'minPhysicalLimit', size: 4 },
        { offset: 0x0E, suffix: 'maxPhysicalLimit', size: 4 },
        { offset: 0x12, suffix: 'accuracy', size: 2 },
        { offset: 0x14, suffix: 'offset', size: 4 },
        { offset: 0x18, suffix: 'gain', size: 4 },
        { offset: 0x1C, suffix: 'calibrationDate', size: 3 },
      ]

      // Test both channel 1 and channel 2
      ;[1, 2].forEach((channelNum) => {
        const channelBaseAddr = getChannelIdAddress(1, channelNum, 0)

        channelOffsets.forEach(({ offset, suffix, size }) => {
          const addr = channelBaseAddr + offset
          const expectedPath = `sensor1.channel${channelNum}.${suffix}`

          expect(lookup[addr]).toBeDefined()
          // @ts-expect-error - we assume its a registerEntry not a guard
          expect(lookup[addr]!.path).toBe(expectedPath)
          // @ts-expect-error - we assume its a registerEntry not a guard
          expect(lookup[addr]!.size).toBe(size)
        })
      })
    })
  })

  describe('address range validation', () => {
    it('should have no gaps in essential register blocks', () => {
      const lookup = createIdentificationRegisterLookup(completeTULIP3DeviceConfig())

      // CM block should be continuous (except RFU)
      const cmRegisters = [0x000, 0x001, 0x002, 0x003, 0x004, 0x007, 0x00A, 0x00D, 0x012]
      cmRegisters.forEach((addr) => {
        expect(lookup[addr]).toBeDefined()
      })

      // Sensor block should be continuous (except RFU)
      const sensor1BaseAddr = 0x03C
      const sensorOffsets = [0x00, 0x02, 0x03, 0x06, 0x09, 0x0C, 0x11]
      sensorOffsets.forEach((offset) => {
        expect(lookup[sensor1BaseAddr + offset]).toBeDefined()
      })

      // Channel blocks should be continuous (except RFU)
      const channelOffsets = [0x00, 0x01, 0x02, 0x06, 0x0A, 0x0E, 0x12, 0x14, 0x18, 0x1C];
      [1, 2].forEach((channelNum) => {
        const channelBaseAddr = getChannelIdAddress(1, channelNum, 0)
        channelOffsets.forEach((offset) => {
          expect(lookup[channelBaseAddr + offset]).toBeDefined()
        })
      })
    })
  })

  describe('register guards when flags are disabled', () => {
    it('should have register guards for CM registers when registerConfig flags are disabled', () => {
      const configWithDisabledCMFlags = completeTULIP3DeviceConfig()
      // @ts-expect-error - is readonly
      configWithDisabledCMFlags.registerConfig.tulip3IdentificationRegisters = {
        productId: false,
        productSubId: false,
        channelPlan: false,
        connectedSensors: false,
        firmwareVersion: false,
        hardwareVersion: false,
        productionDate: false,
        serialNumberPart1: false,
        serialNumberPart2: false,
      }

      const lookup = createIdentificationRegisterLookup(configWithDisabledCMFlags)

      // Verify register guards exist at CM register addresses
      expect(lookup[0x000]).toBeDefined()
      expect(lookup[0x000]).toHaveProperty('type', 'guard')
      expect(lookup[0x000]).toHaveProperty('message')

      expect(lookup[0x001]).toBeDefined()
      expect(lookup[0x001]).toHaveProperty('type', 'guard')

      expect(lookup[0x002]).toBeDefined()
      expect(lookup[0x002]).toHaveProperty('type', 'guard')

      expect(lookup[0x003]).toBeDefined()
      expect(lookup[0x003]).toHaveProperty('type', 'guard')

      expect(lookup[0x004]).toBeDefined()
      expect(lookup[0x004]).toHaveProperty('type', 'guard')
    })

    it('should have register guards for sensor registers when sensor registerConfig flags are disabled', () => {
      const configWithDisabledSensorFlags = completeTULIP3DeviceConfig()
      // @ts-expect-error - is readonly
      configWithDisabledSensorFlags.sensor1.registerConfig.tulip3IdentificationRegisters = {
        sensorType: false,
        existingChannels: false,
        firmwareVersion: false,
        hardwareVersion: false,
        productionDate: false,
        serialNumberPart1: false,
        serialNumberPart2: false,
      }

      const lookup = createIdentificationRegisterLookup(configWithDisabledSensorFlags)
      const sensor1BaseAddr = 0x03C

      // Verify register guards exist at sensor register addresses
      expect(lookup[sensor1BaseAddr + 0x00]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x00]).toHaveProperty('type', 'guard')

      expect(lookup[sensor1BaseAddr + 0x02]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x02]).toHaveProperty('type', 'guard')

      expect(lookup[sensor1BaseAddr + 0x03]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x03]).toHaveProperty('type', 'guard')

      expect(lookup[sensor1BaseAddr + 0x06]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x06]).toHaveProperty('type', 'guard')
    })

    it('should have register guards for channel registers when channel registerConfig flags are disabled', () => {
      const configWithDisabledChannelFlags = completeTULIP3DeviceConfig()
      // @ts-expect-error - is readonly
      configWithDisabledChannelFlags.sensor1.channel1.registerConfig.tulip3IdentificationRegisters = {
        measurand: false,
        unit: false,
        minMeasureRange: false,
        maxMeasureRange: false,
        minPhysicalLimit: false,
        maxPhysicalLimit: false,
        accuracy: false,
        offset: false,
        gain: false,
        calibrationDate: false,
      }

      const lookup = createIdentificationRegisterLookup(configWithDisabledChannelFlags)
      const channel1BaseAddr = getChannelIdAddress(1, 1, 0)

      // Verify register guards exist at channel register addresses
      expect(lookup[channel1BaseAddr + 0x00]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x00]).toHaveProperty('type', 'guard')

      expect(lookup[channel1BaseAddr + 0x01]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x01]).toHaveProperty('type', 'guard')

      expect(lookup[channel1BaseAddr + 0x02]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x02]).toHaveProperty('type', 'guard')

      expect(lookup[channel1BaseAddr + 0x06]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x06]).toHaveProperty('type', 'guard')
    })

    it('should have register entries when flags are enabled and guards when disabled', () => {
      // Test with some flags enabled and some disabled
      const mixedConfig: TULIP3DeviceConfig = {
        sensor1: {
          channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: completeSensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: {
          tulip3IdentificationRegisters: {
            productId: true,
            channelPlan: true,
            connectedSensors: true,
            firmwareVersion: true,
            hardwareVersion: true,
            productionDate: true,
            serialNumberPart1: true,
            serialNumberPart2: true,
          },
          tulip3ConfigurationRegisters: {},
        },
      }

      const lookup = createIdentificationRegisterLookup(mixedConfig)

      // productId should be a register entry (has path)
      expect(lookup[0x000]).toBeDefined()
      expect(lookup[0x000]).not.toHaveProperty('type', 'guard')
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x000]!.path).toBe('communicationModule.productId')

      // productSubId should be a guard
      expect(lookup[0x001]).toBeDefined()
      expect(lookup[0x001]).toHaveProperty('type', 'guard')
    })
  })
})
