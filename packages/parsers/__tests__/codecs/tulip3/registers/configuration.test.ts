import { describe, expect, it } from 'vitest'
import {
  createConfigurationRegisterLookup,
  getChannelConfigBaseAddress,
  getSensorConfigBaseAddress,
} from '../../../../src/codecs/tulip3/registers/configuration'

describe('tULIP3 configuration register generation', () => {
  describe('pEW device configuration register generation', () => {
    it('should generate correct base addresses for sensor 1 configuration', () => {
      const sensor1BaseAddress = getSensorConfigBaseAddress(1)
      expect(sensor1BaseAddress).toBe(0x02A) // 0x02A + (1-1) * 493 = 0x02A
    })

    it('should generate correct base addresses for sensor configuration across multiple sensors', () => {
      const sensor1BaseAddress = getSensorConfigBaseAddress(1)
      const sensor2BaseAddress = getSensorConfigBaseAddress(2)
      const sensor3BaseAddress = getSensorConfigBaseAddress(3)
      const sensor4BaseAddress = getSensorConfigBaseAddress(4)

      expect(sensor1BaseAddress).toBe(0x02A) // 0x02A + (1-1) * 493 = 0x02A
      expect(sensor2BaseAddress).toBe(0x217) // 0x02A + (2-1) * 493 = 0x02A + 493 = 0x217
      expect(sensor3BaseAddress).toBe(0x404) // 0x02A + (3-1) * 493 = 0x02A + 986 = 0x404
      expect(sensor4BaseAddress).toBe(0x5F1) // 0x02A + (4-1) * 493 = 0x02A + 1479 = 0x5F1

      // Verify spacing between sensors is 493 bytes
      expect(sensor2BaseAddress - sensor1BaseAddress).toBe(493)
      expect(sensor3BaseAddress - sensor2BaseAddress).toBe(493)
      expect(sensor4BaseAddress - sensor3BaseAddress).toBe(493)
    })

    it('should generate correct base addresses for channel configuration', () => {
      const channel1BaseAddress = getChannelConfigBaseAddress(1, 1)
      const channel2BaseAddress = getChannelConfigBaseAddress(1, 2)

      // Channel 1 of sensor 1: 0x02A + (1-1) * 464 + 1 * 29 + (1-1) * 58 = 0x02A + 0 + 29 + 0 = 0x047
      expect(channel1BaseAddress).toBe(0x047)

      // Channel 2 of sensor 1: 0x02A + (1-1) * 464 + 1 * 29 + (2-1) * 58 = 0x02A + 0 + 29 + 58 = 0x081
      expect(channel2BaseAddress).toBe(0x081)

      // Verify spacing between channels is 58 bytes
      expect(channel2BaseAddress - channel1BaseAddress).toBe(58)
    })

    it('should verify channel address calculations are correct for multiple channels', () => {
      // Test the formula: 0x02A + (n-1) * 464 + n * 29 + (m-1) * 58
      const sensor1Channel1 = getChannelConfigBaseAddress(1, 1)
      const sensor1Channel2 = getChannelConfigBaseAddress(1, 2)
      const sensor1Channel3 = getChannelConfigBaseAddress(1, 3)
      const sensor1Channel8 = getChannelConfigBaseAddress(1, 8)

      expect(sensor1Channel1).toBe(0x02A + 0 * 464 + 1 * 29 + 0 * 58) // 0x047
      expect(sensor1Channel2).toBe(0x02A + 0 * 464 + 1 * 29 + 1 * 58) // 0x081
      expect(sensor1Channel3).toBe(0x02A + 0 * 464 + 1 * 29 + 2 * 58) // 0x0BB
      expect(sensor1Channel8).toBe(0x02A + 0 * 464 + 1 * 29 + 7 * 58) // 0x1ED

      // Verify spacing between channels is 58 bytes
      expect(sensor1Channel2 - sensor1Channel1).toBe(58)
      expect(sensor1Channel3 - sensor1Channel2).toBe(58)
    })

    it('should create register lookup with correct addresses for PEW configuration', () => {
      const lookup = createConfigurationRegisterLookup()

      // Check Communication Module registers (should always be present)
      expect(lookup[0x000]).toBeDefined()
      expect(lookup[0x000]!.path).toBe('communicationModule.measuringPeriodAlarmOff')
      expect(lookup[0x004]).toBeDefined()
      expect(lookup[0x004]!.path).toBe('communicationModule.measuringPeriodAlarmOn')
      expect(lookup[0x008]).toBeDefined()
      expect(lookup[0x008]!.path).toBe('communicationModule.transmissionRateAlarmOff')
      expect(lookup[0x014]).toBeDefined()
      expect(lookup[0x014]!.path).toBe('communicationModule.enableBleAdvertising')

      // Check Sensor 1 configuration registers
      const sensor1BaseAddr = 0x02A
      expect(lookup[sensor1BaseAddr + 0x00]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x00]!.path).toBe('sensor1.configuration.samplingChannels')
      expect(lookup[sensor1BaseAddr + 0x01]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x01]!.path).toBe('sensor1.configuration.bootTime')
      expect(lookup[sensor1BaseAddr + 0x03]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x03]!.path).toBe('sensor1.configuration.communicationTimeout')
      expect(lookup[sensor1BaseAddr + 0x05]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x05]!.path).toBe('sensor1.configuration.communicationRetryCount')

      // Check Channel 1 configuration registers
      const channel1BaseAddr = 0x047
      expect(lookup[channel1BaseAddr + 0x00]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x00]!.path).toBe('sensor1.channel1.protocolDataType')
      expect(lookup[channel1BaseAddr + 0x01]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x01]!.path).toBe('sensor1.channel1.processAlarmEnabled')
      expect(lookup[channel1BaseAddr + 0x02]).toBeDefined()
      expect(lookup[channel1BaseAddr + 0x02]!.path).toBe('sensor1.channel1.processAlarmDeadBand')

      // Check Channel 2 configuration registers
      const channel2BaseAddr = 0x081
      expect(lookup[channel2BaseAddr + 0x00]).toBeDefined()
      expect(lookup[channel2BaseAddr + 0x00]!.path).toBe('sensor1.channel2.protocolDataType')
      expect(lookup[channel2BaseAddr + 0x01]).toBeDefined()
      expect(lookup[channel2BaseAddr + 0x01]!.path).toBe('sensor1.channel2.processAlarmEnabled')
      expect(lookup[channel2BaseAddr + 0x02]).toBeDefined()
      expect(lookup[channel2BaseAddr + 0x02]!.path).toBe('sensor1.channel2.processAlarmDeadBand')
    })

    it('should have registers for all sensors', () => {
      const lookup = createConfigurationRegisterLookup()

      // Check that all sensor configuration registers are present
      const sensor1BaseAddr = getSensorConfigBaseAddress(1) // 0x02A
      const sensor2BaseAddr = getSensorConfigBaseAddress(2) // 0x219
      const sensor3BaseAddr = getSensorConfigBaseAddress(3) // 0x408
      const sensor4BaseAddr = getSensorConfigBaseAddress(4) // 0x5F7

      expect(lookup[sensor1BaseAddr]).toBeDefined()
      expect(lookup[sensor2BaseAddr]).toBeDefined()
      expect(lookup[sensor3BaseAddr]).toBeDefined()
      expect(lookup[sensor4BaseAddr]).toBeDefined()
    })

    it('should have registers for all channels of all sensors', () => {
      const lookup = createConfigurationRegisterLookup()

      // Check that all channels 1-8 of all sensors 1-4 are present
      for (let sensorNum = 1; sensorNum <= 4; sensorNum++) {
        for (let channelNum = 1; channelNum <= 8; channelNum++) {
          const channelBaseAddr = getChannelConfigBaseAddress(sensorNum, channelNum)
          expect(lookup[channelBaseAddr]).toBeDefined()
          expect(lookup[channelBaseAddr]!.path).toBe(`sensor${sensorNum}.channel${channelNum}.protocolDataType`)
        }
      }
    })

    it('should have correct register sizes and types', () => {
      const lookup = createConfigurationRegisterLookup()

      // Communication Module registers
      expect(lookup[0x000]!.size).toBe(4) // measuringPeriodAlarmOff (UInt32)
      expect(lookup[0x004]!.size).toBe(4) // measuringPeriodAlarmOn (UInt32)
      expect(lookup[0x008]!.size).toBe(2) // transmissionRateAlarmOff (UInt16)
      expect(lookup[0x014]!.size).toBe(1) // enableBleAdvertising (Boolean)

      // Sensor configuration registers
      const sensor1BaseAddr = 0x02A
      expect(lookup[sensor1BaseAddr + 0x00]!.size).toBe(1) // samplingChannels
      expect(lookup[sensor1BaseAddr + 0x01]!.size).toBe(2) // bootTime (UInt16)
      expect(lookup[sensor1BaseAddr + 0x03]!.size).toBe(2) // communicationTimeout (UInt16)
      expect(lookup[sensor1BaseAddr + 0x05]!.size).toBe(1) // communicationRetryCount (UInt8)

      // Channel configuration registers
      const channel1BaseAddr = 0x047
      expect(lookup[channel1BaseAddr + 0x00]!.size).toBe(1) // protocolDataType
      expect(lookup[channel1BaseAddr + 0x01]!.size).toBe(1) // processAlarmEnabled
      expect(lookup[channel1BaseAddr + 0x02]!.size).toBe(4) // processAlarmDeadBand (Float32)
      expect(lookup[channel1BaseAddr + 0x06]!.size).toBe(4) // lowThresholdAlarmValue (Float32)
      expect(lookup[channel1BaseAddr + 0x1A]!.size).toBe(2) // lowThresholdWithDelayAlarmDelay (UInt16)
    })

    it('should verify no overlapping address ranges', () => {
      const lookup = createConfigurationRegisterLookup()
      const addresses = Object.keys(lookup).map(Number).sort((a, b) => a - b)

      // Check that no two registers overlap
      for (let i = 0; i < addresses.length - 1; i++) {
        const currentAddr = addresses[i]!
        const nextAddr = addresses[i + 1]!
        const currentRegister = lookup[currentAddr]!
        const currentEnd = currentAddr + currentRegister.size - 1

        expect(currentEnd).toBeLessThan(nextAddr)
      }
    })

    it('should have RFU (Reserved for Future Use) ranges empty', () => {
      const lookup = createConfigurationRegisterLookup()

      // RFU ranges that should be empty (these are gaps in the protocol specification)
      const rfuRanges = [
        { start: 0x015, end: 0x029 }, // CM RFU
      ]

      rfuRanges.forEach(({ start, end }) => {
        for (let addr = start; addr <= end; addr++) {
          expect(lookup[addr]).toBeUndefined()
        }
      })

      // All sensors should now be present with registers
      const sensor1Range = { start: getSensorConfigBaseAddress(1), end: getSensorConfigBaseAddress(1) + 493 - 1 }
      const sensor2Range = { start: getSensorConfigBaseAddress(2), end: getSensorConfigBaseAddress(2) + 493 - 1 }
      const sensor3Range = { start: getSensorConfigBaseAddress(3), end: getSensorConfigBaseAddress(3) + 493 - 1 }
      const sensor4Range = { start: getSensorConfigBaseAddress(4), end: getSensorConfigBaseAddress(4) + 493 - 1 }

      // Check that each sensor has at least some registers defined
      ;[sensor1Range, sensor2Range, sensor3Range, sensor4Range].forEach(({ start }, index) => {
        const sensorNum = index + 1
        expect(lookup[start]).toBeDefined() // First register of each sensor should be present
        expect(lookup[start]!.path).toBe(`sensor${sensorNum}.configuration.samplingChannels`)
      })
    })

    it('should generate lookup with all required CM configuration registers', () => {
      const lookup = createConfigurationRegisterLookup()

      const requiredCMRegisters = [
        { addr: 0x000, path: 'communicationModule.measuringPeriodAlarmOff', size: 4 },
        { addr: 0x004, path: 'communicationModule.measuringPeriodAlarmOn', size: 4 },
        { addr: 0x008, path: 'communicationModule.transmissionRateAlarmOff', size: 2 },
        { addr: 0x00A, path: 'communicationModule.transmissionRateAlarmOn', size: 2 },
        { addr: 0x00C, path: 'communicationModule.overVoltageThreshold', size: 2 },
        { addr: 0x00E, path: 'communicationModule.underVoltageThreshold', size: 2 },
        { addr: 0x010, path: 'communicationModule.overTemperatureCmChip', size: 1 },
        { addr: 0x011, path: 'communicationModule.underTemperatureCmChip', size: 1 },
        { addr: 0x012, path: 'communicationModule.downlinkAnswerTimeout', size: 1 },
        { addr: 0x013, path: 'communicationModule.fetchAdditionalDownlinkTimeInterval', size: 1 },
        { addr: 0x014, path: 'communicationModule.enableBleAdvertising', size: 1 },
      ]

      requiredCMRegisters.forEach(({ addr, path, size }) => {
        expect(lookup[addr]).toBeDefined()
        expect(lookup[addr]!.path).toBe(path)
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should generate lookup with all required sensor configuration registers', () => {
      const lookup = createConfigurationRegisterLookup()
      const sensor1BaseAddr = 0x02A

      const requiredSensorRegisters = [
        { offset: 0x00, path: 'sensor1.configuration.samplingChannels', size: 1 },
        { offset: 0x01, path: 'sensor1.configuration.bootTime', size: 2 },
        { offset: 0x03, path: 'sensor1.configuration.communicationTimeout', size: 2 },
        { offset: 0x05, path: 'sensor1.configuration.communicationRetryCount', size: 1 },
      ]

      requiredSensorRegisters.forEach(({ offset, path, size }) => {
        const addr = sensor1BaseAddr + offset
        expect(lookup[addr]).toBeDefined()
        expect(lookup[addr]!.path).toBe(path)
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should verify channel register address spacing is correct', () => {
      // Verify that there's a gap of 2 bytes between processAlarmEnabled and processAlarmDeadBand
      const channel1BaseAddr = 0x047

      // processAlarmEnabled is at offset 0x01 (size 1)
      // processAlarmDeadBand is at offset 0x02 (size 4)
      const lookup = createConfigurationRegisterLookup()

      expect(lookup[channel1BaseAddr + 0x01]).toBeDefined() // processAlarmEnabled
      expect(lookup[channel1BaseAddr + 0x02]).toBeDefined() // processAlarmDeadBand
    })
  })

  describe('multi-sensor configuration register generation', () => {
    it('should generate correct addresses for channels across multiple sensors', () => {
      const lookup = createConfigurationRegisterLookup()

      // Sensor 1 channels
      const s1c1BaseAddr = getChannelConfigBaseAddress(1, 1)
      const s1c2BaseAddr = getChannelConfigBaseAddress(1, 2)

      // Sensor 2 channels
      const s2c1BaseAddr = getChannelConfigBaseAddress(2, 1)

      // Sensor 3 channels
      const s3c1BaseAddr = getChannelConfigBaseAddress(3, 1)
      const s3c3BaseAddr = getChannelConfigBaseAddress(3, 3)

      // Verify channel configuration registers exist
      expect(lookup[s1c1BaseAddr + 0x00]!.path).toBe('sensor1.channel1.protocolDataType')
      expect(lookup[s1c2BaseAddr + 0x00]!.path).toBe('sensor1.channel2.protocolDataType')
      expect(lookup[s2c1BaseAddr + 0x00]!.path).toBe('sensor2.channel1.protocolDataType')
      expect(lookup[s3c1BaseAddr + 0x00]!.path).toBe('sensor3.channel1.protocolDataType')
      expect(lookup[s3c3BaseAddr + 0x00]!.path).toBe('sensor3.channel3.protocolDataType')

      // Verify all channels now exist (since we generate complete lookup)
      const s2c2BaseAddr = getChannelConfigBaseAddress(2, 2) // Channel 2 of sensor 2 now configured
      const s3c2BaseAddr = getChannelConfigBaseAddress(3, 2) // Channel 2 of sensor 3 now configured

      expect(lookup[s2c2BaseAddr + 0x00]).toBeDefined()
      expect(lookup[s3c2BaseAddr + 0x00]).toBeDefined()
    })
  })

  describe('address range validation', () => {
    it('should have no gaps in essential register blocks', () => {
      const lookup = createConfigurationRegisterLookup()

      // CM block should be continuous (except RFU)
      const cmRegisters = [0x000, 0x004, 0x008, 0x00A, 0x00C, 0x00E, 0x010, 0x011, 0x012, 0x013, 0x014]
      cmRegisters.forEach((addr) => {
        expect(lookup[addr]).toBeDefined()
      })

      // Sensor block should be continuous (except RFU)
      const sensor1BaseAddr = 0x02A
      const sensorOffsets = [0x00, 0x01, 0x03, 0x05]
      sensorOffsets.forEach((offset) => {
        expect(lookup[sensor1BaseAddr + offset]).toBeDefined()
      })

      // Channel blocks should be continuous (except RFU and gaps)
      const channelOffsets = [0x00, 0x01, 0x02, 0x06, 0x0A, 0x0E, 0x12, 0x16, 0x1A, 0x1C, 0x20]
      ;[1, 2].forEach((channelNum) => {
        const channelBaseAddr = getChannelConfigBaseAddress(1, channelNum)
        channelOffsets.forEach((offset) => {
          expect(lookup[channelBaseAddr + offset]).toBeDefined()
        })
      })
    })
  })

  describe('edge cases', () => {
    it('should generate complete lookup table for all sensors and channels', () => {
      const lookup = createConfigurationRegisterLookup()

      // Should have CM registers
      expect(lookup[0x000]).toBeDefined() // CM registers should always exist
      expect(lookup[0x004]).toBeDefined()

      // Should have all sensor registers
      for (let sensorNum = 1; sensorNum <= 4; sensorNum++) {
        const sensorBaseAddr = getSensorConfigBaseAddress(sensorNum)
        expect(lookup[sensorBaseAddr]).toBeDefined()
        expect(lookup[sensorBaseAddr]!.path).toBe(`sensor${sensorNum}.configuration.samplingChannels`)

        // Should have all channel registers for each sensor
        for (let channelNum = 1; channelNum <= 8; channelNum++) {
          const channelBaseAddr = getChannelConfigBaseAddress(sensorNum, channelNum)
          expect(lookup[channelBaseAddr]).toBeDefined()
          expect(lookup[channelBaseAddr]!.path).toBe(`sensor${sensorNum}.channel${channelNum}.protocolDataType`)
        }
      }
    })
  })
})
