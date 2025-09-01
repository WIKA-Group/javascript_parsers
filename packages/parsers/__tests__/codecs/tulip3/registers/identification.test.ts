import { describe, expect, it } from 'vitest'
import {
  createIdentificationRegisterLookup,
  getChannelBaseAddress,
  getSensorBaseAddress,
} from '../../../../src/codecs/tulip3/registers/identification'

describe('tULIP3 identification register generation', () => {
  describe('pEW device configuration Register generation', () => {
    it('should generate correct base addresses for sensor 1', () => {
      const sensor1BaseAddress = getSensorBaseAddress(1)
      expect(sensor1BaseAddress).toBe(0x03C) // 0x03C + (1-1) * 460 = 0x03C
    })

    it('should generate correct base addresses for channels', () => {
      const channel1BaseAddress = getChannelBaseAddress(1, 1)
      const channel2BaseAddress = getChannelBaseAddress(1, 2)

      // Channel 1 of sensor 1: 0x03C + (1-1) * 400 + 1 * 60 + (1-1) * 50 = 0x03C + 0 + 60 + 0 = 0x78
      expect(channel1BaseAddress).toBe(0x78)

      // Channel 2 of sensor 1: 0x03C + (1-1) * 400 + 1 * 60 + (2-1) * 50 = 0x03C + 0 + 60 + 50 = 0xAA
      expect(channel2BaseAddress).toBe(0xAA)
    })

    it('should create register lookup with correct addresses for PEW configuration', () => {
      const lookup = createIdentificationRegisterLookup()

      // Check Communication Module registers (should always be present)
      expect(lookup[0x000]).toBeDefined()
      expect(lookup[0x000]!.path).toBe('communicationModule.productId')
      expect(lookup[0x001]).toBeDefined()
      expect(lookup[0x001]!.path).toBe('communicationModule.productSubId')
      expect(lookup[0x003]).toBeDefined()
      expect(lookup[0x003]!.path).toBe('communicationModule.connectedSensors')

      // Check Sensor 1 registers
      const sensor1BaseAddr = 0x03C
      expect(lookup[sensor1BaseAddr + 0x00]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x00]!.path).toBe('sensor1.identification.sensorType')
      expect(lookup[sensor1BaseAddr + 0x02]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x02]!.path).toBe('sensor1.identification.existingChannels')
      expect(lookup[sensor1BaseAddr + 0x03]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x03]!.path).toBe('sensor1.identification.firmwareVersion')

      // Check Channel 1 registers
      const channel1BaseAddr = 0x78
      expect(lookup[channel1BaseAddr + 0x00]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x00]!.path).toBe('sensor1.channel1.measurand')
      expect(lookup[channel1BaseAddr + 0x01]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x01]!.path).toBe('sensor1.channel1.unit')
      expect(lookup[channel1BaseAddr + 0x02]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x02]!.path).toBe('sensor1.channel1.minMeasureRange')

      // Check Channel 2 registers
      const channel2BaseAddr = 0xAA
      expect(lookup[channel2BaseAddr + 0x00]).toBeDefined()
      expect(lookup[channel2BaseAddr + 0x00]!.path).toBe('sensor1.channel2.measurand')
      expect(lookup[channel2BaseAddr + 0x01]).toBeDefined()
      expect(lookup[channel2BaseAddr + 0x01]!.path).toBe('sensor1.channel2.unit')
      expect(lookup[channel2BaseAddr + 0x02]).toBeDefined()
      expect(lookup[channel2BaseAddr + 0x02]!.path).toBe('sensor1.channel2.minMeasureRange')
    })

    it('should have registers for all sensors', () => {
      const lookup = createIdentificationRegisterLookup()

      // Check that all sensor registers are present
      const sensor1BaseAddr = getSensorBaseAddress(1) // 0x03C
      const sensor2BaseAddr = getSensorBaseAddress(2) // 0x03C + (2-1) * 460 = 0x200
      const sensor3BaseAddr = getSensorBaseAddress(3) // 0x03C + (3-1) * 460 = 0x3C4
      const sensor4BaseAddr = getSensorBaseAddress(4) // 0x03C + (4-1) * 460 = 0x588

      expect(lookup[sensor1BaseAddr]).toBeDefined()
      expect(lookup[sensor2BaseAddr]).toBeDefined()
      expect(lookup[sensor3BaseAddr]).toBeDefined()
      expect(lookup[sensor4BaseAddr]).toBeDefined()
    })

    it('should have registers for all channels of all sensors', () => {
      const lookup = createIdentificationRegisterLookup()

      // Check that all channels 1-8 of all sensors 1-4 are present
      for (let sensorNum = 1; sensorNum <= 4; sensorNum++) {
        for (let channelNum = 1; channelNum <= 8; channelNum++) {
          const channelBaseAddr = getChannelBaseAddress(sensorNum, channelNum)
          expect(lookup[channelBaseAddr]).toBeDefined()
          expect(lookup[channelBaseAddr]!.path).toBe(`sensor${sensorNum}.channel${channelNum}.measurand`)
        }
      }
    })

    it('should have correct register sizes and types', () => {
      const lookup = createIdentificationRegisterLookup()

      // Communication Module registers
      expect(lookup[0x000]!.size).toBe(1) // productId
      expect(lookup[0x004]!.size).toBe(3) // firmwareVersion
      expect(lookup[0x00D]!.size).toBe(5) // serialNumberPart1

      // Sensor registers
      const sensor1BaseAddr = 0x03C
      expect(lookup[sensor1BaseAddr + 0x00]!.size).toBe(2) // sensorType
      expect(lookup[sensor1BaseAddr + 0x02]!.size).toBe(1) // existingChannels
      expect(lookup[sensor1BaseAddr + 0x03]!.size).toBe(3) // firmwareVersion

      // Channel registers
      const channel1BaseAddr = 0x78
      expect(lookup[channel1BaseAddr + 0x00]!.size).toBe(1) // measurand
      expect(lookup[channel1BaseAddr + 0x02]!.size).toBe(4) // minMeasureRange (float32)
      expect(lookup[channel1BaseAddr + 0x12]!.size).toBe(2) // accuracy
    })

    it('should verify no overlapping address ranges', () => {
      const lookup = createIdentificationRegisterLookup()
      const addresses = Object.keys(lookup).map(Number).sort((a, b) => a - b)

      // Check that no two registers overlap
      for (let i = 0; i < addresses.length - 1; i++) {
        const currentAddr = addresses[i]!
        const nextAddr = addresses[i + 1]
        const currentRegister = lookup[currentAddr]!

        // Next register should start after current register ends
        expect(nextAddr).toBeGreaterThanOrEqual(currentAddr + currentRegister.size)
      }
    })

    it('should have RFU ranges empty but all sensors present', () => {
      const lookup = createIdentificationRegisterLookup()

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
      const sensor1Range = { start: getSensorBaseAddress(1), end: getSensorBaseAddress(1) + 460 - 1 }
      const sensor2Range = { start: getSensorBaseAddress(2), end: getSensorBaseAddress(2) + 460 - 1 }
      const sensor3Range = { start: getSensorBaseAddress(3), end: getSensorBaseAddress(3) + 460 - 1 }
      const sensor4Range = { start: getSensorBaseAddress(4), end: getSensorBaseAddress(4) + 460 - 1 }

      // Check that each sensor has at least some registers defined
      ;[sensor1Range, sensor2Range, sensor3Range, sensor4Range].forEach(({ start }, index) => {
        const sensorNum = index + 1
        expect(lookup[start]).toBeDefined() // First register of each sensor should be present
        expect(lookup[start]!.path).toBe(`sensor${sensorNum}.identification.sensorType`)
      })
    })

    it('should verify address calculations are correct', () => {
      // Test sensor address formula: 0x03C + (n-1) * 460
      const sensor1Base = getSensorBaseAddress(1)
      const sensor2Base = getSensorBaseAddress(2)
      const sensor3Base = getSensorBaseAddress(3)

      expect(sensor1Base).toBe(0x03C + 0 * 460) // 0x03C
      expect(sensor2Base).toBe(0x03C + 1 * 460) // 0x200
      expect(sensor3Base).toBe(0x03C + 2 * 460) // 0x3C4

      // Verify spacing between sensors is 460 bytes
      expect(sensor2Base - sensor1Base).toBe(460)
      expect(sensor3Base - sensor2Base).toBe(460)

      // Test channel address formula: 0x03C + (n-1) * 400 + n * 60 + (m-1) * 50
      const sensor1Channel1 = getChannelBaseAddress(1, 1)
      const sensor1Channel2 = getChannelBaseAddress(1, 2)
      const sensor1Channel3 = getChannelBaseAddress(1, 3)

      expect(sensor1Channel1).toBe(0x03C + 0 * 400 + 1 * 60 + 0 * 50) // 0x78
      expect(sensor1Channel2).toBe(0x03C + 0 * 400 + 1 * 60 + 1 * 50) // 0xAA
      expect(sensor1Channel3).toBe(0x03C + 0 * 400 + 1 * 60 + 2 * 50) // 0xDC

      // Verify spacing between channels is 50 bytes
      expect(sensor1Channel2 - sensor1Channel1).toBe(50)
      expect(sensor1Channel3 - sensor1Channel2).toBe(50)
    })

    it('should generate lookup with all required CM registers', () => {
      const lookup = createIdentificationRegisterLookup()

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
        expect(lookup[addr]!.path).toBe(path)
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should generate lookup with all required sensor registers', () => {
      const lookup = createIdentificationRegisterLookup()
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
        expect(lookup[addr]!.path).toBe(path)
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should generate lookup with all required channel registers', () => {
      const lookup = createIdentificationRegisterLookup()

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
        const channelBaseAddr = getChannelBaseAddress(1, channelNum)

        channelOffsets.forEach(({ offset, suffix, size }) => {
          const addr = channelBaseAddr + offset
          const expectedPath = `sensor1.channel${channelNum}.${suffix}`

          expect(lookup[addr]).toBeDefined()
          expect(lookup[addr]!.path).toBe(expectedPath)
          expect(lookup[addr]!.size).toBe(size)
        })
      })
    })
  })

  describe('address range validation', () => {
    it('should have no gaps in essential register blocks', () => {
      const lookup = createIdentificationRegisterLookup()

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
        const channelBaseAddr = getChannelBaseAddress(1, channelNum)
        channelOffsets.forEach((offset) => {
          expect(lookup[channelBaseAddr + offset]).toBeDefined()
        })
      })
    })
  })
})
