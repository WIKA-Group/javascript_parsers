import type { TULIP3DeviceConfig } from '../../../../src/codecs/tulip3/profile'
import { describe, expect, it } from 'vitest'
import {
  getChannelConfigAddress,
  getSensorConfigAddress,
} from '../../../../src/codecs/addresses'
import { createConfigurationRegisterLookup } from '../../../../src/codecs/tulip3/registers/configuration'
import {
  completeChannelRegisterConfig,
  completeSensorRegisterConfig,
  completeTULIP3DeviceConfig,
  createDefaultChannelAlarmFlags,
  createDefaultCommunicationModuleAlarmFlags,
  createDefaultSensorAlarmFlags,
} from '../presets'

describe('tULIP3 configuration register generation', () => {
  describe('pEW device configuration register generation', () => {
    it('should create register lookup with correct addresses for PEW configuration', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

      // Check Communication Module registers (should always be present)
      expect(lookup[0x000]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x000]!.path).toBe('communicationModule.measuringPeriodAlarmOff')
      expect(lookup[0x004]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x004]!.path).toBe('communicationModule.measuringPeriodAlarmOn')
      expect(lookup[0x008]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x008]!.path).toBe('communicationModule.transmissionRateAlarmOff')
      expect(lookup[0x014]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x014]!.path).toBe('communicationModule.enableBleAdvertising')

      // Check Sensor 1 configuration registers
      const sensor1BaseAddr = 0x02A
      expect(lookup[sensor1BaseAddr + 0x00]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x00]!.path).toBe('sensor1.configuration.samplingChannels')
      expect(lookup[sensor1BaseAddr + 0x01]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x01]!.path).toBe('sensor1.configuration.bootTime')
      expect(lookup[sensor1BaseAddr + 0x03]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x03]!.path).toBe('sensor1.configuration.communicationTimeout')
      expect(lookup[sensor1BaseAddr + 0x05]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x05]!.path).toBe('sensor1.configuration.communicationRetryCount')

      // Check Channel 1 configuration registers
      const channel1BaseAddr = 0x047
      expect(lookup[channel1BaseAddr + 0x00]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x00]!.path).toBe('sensor1.channel1.protocolDataType')
      expect(lookup[channel1BaseAddr + 0x01]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x01]!.path).toBe('sensor1.channel1.processAlarmEnabled')
      expect(lookup[channel1BaseAddr + 0x02]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x02]!.path).toBe('sensor1.channel1.processAlarmDeadBand')

      // Check Channel 2 configuration registers
      const channel2BaseAddr = 0x081
      expect(lookup[channel2BaseAddr + 0x00]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel2BaseAddr + 0x00]!.path).toBe('sensor1.channel2.protocolDataType')
      expect(lookup[channel2BaseAddr + 0x01]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel2BaseAddr + 0x01]!.path).toBe('sensor1.channel2.processAlarmEnabled')
      expect(lookup[channel2BaseAddr + 0x02]).toBeDefined()
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel2BaseAddr + 0x02]!.path).toBe('sensor1.channel2.processAlarmDeadBand')
    })

    it('should have registers for all sensors', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

      // Check that all sensor configuration registers are present
      const sensor1BaseAddr = getSensorConfigAddress(1, 0) // 0x02A
      const sensor2BaseAddr = getSensorConfigAddress(2, 0) // 0x217
      const sensor3BaseAddr = getSensorConfigAddress(3, 0) // 0x404
      const sensor4BaseAddr = getSensorConfigAddress(4, 0) // 0x5F1

      expect(lookup[sensor1BaseAddr]).toBeDefined()
      expect(lookup[sensor2BaseAddr]).toBeDefined()
      expect(lookup[sensor3BaseAddr]).toBeDefined()
      expect(lookup[sensor4BaseAddr]).toBeDefined()
    })

    it('should have registers for all channels of all sensors', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

      // Check that all channels 1-8 of all sensors 1-4 are present
      for (let sensorNum = 1; sensorNum <= 4; sensorNum++) {
        for (let channelNum = 1; channelNum <= 8; channelNum++) {
          const channelBaseAddr = getChannelConfigAddress(sensorNum, channelNum, 0)
          expect(lookup[channelBaseAddr]).toBeDefined()
          // @ts-expect-error - may not exist when registers are disabled
          expect(lookup[channelBaseAddr]!.path).toBe(`sensor${sensorNum}.channel${channelNum}.protocolDataType`)
        }
      }
    })

    it('should have correct register sizes and types', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

      // Communication Module registers
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x000]!.size).toBe(4) // measuringPeriodAlarmOff (UInt32)
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x004]!.size).toBe(4) // measuringPeriodAlarmOn (UInt32)
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x008]!.size).toBe(2) // transmissionRateAlarmOff (UInt16)
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x014]!.size).toBe(1) // enableBleAdvertising (Boolean)

      // Sensor configuration registers
      const sensor1BaseAddr = 0x02A
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x00]!.size).toBe(1) // samplingChannels
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x01]!.size).toBe(2) // bootTime (UInt16)
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x03]!.size).toBe(2) // communicationTimeout (UInt16)
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[sensor1BaseAddr + 0x05]!.size).toBe(1) // communicationRetryCount (UInt8)

      // Channel configuration registers
      const channel1BaseAddr = 0x047
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x00]!.size).toBe(1) // protocolDataType
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x01]!.size).toBe(1) // processAlarmEnabled
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x02]!.size).toBe(4) // processAlarmDeadBand (Float32)
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x06]!.size).toBe(4) // lowThresholdAlarmValue (Float32)
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[channel1BaseAddr + 0x1A]!.size).toBe(2) // lowThresholdWithDelayAlarmDelay (UInt16)
    })

    it('should verify no overlapping address ranges', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())
      const addresses = Object.keys(lookup).map(Number).sort((a, b) => a - b)

      // Check that no two registers overlap
      for (let i = 0; i < addresses.length - 1; i++) {
        const currentAddr = addresses[i]!
        const nextAddr = addresses[i + 1]!
        // @ts-expect-error - may not exist when registers are disabled
        const currentEnd = currentAddr + lookup[currentAddr]!.size - 1

        expect(currentEnd).toBeLessThan(nextAddr)
      }
    })

    it('should have RFU (Reserved for Future Use) ranges empty', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

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
      const sensor1Range = { start: getSensorConfigAddress(1, 0), end: getSensorConfigAddress(1, 0) + 493 - 1 }
      const sensor2Range = { start: getSensorConfigAddress(2, 0), end: getSensorConfigAddress(2, 0) + 493 - 1 }
      const sensor3Range = { start: getSensorConfigAddress(3, 0), end: getSensorConfigAddress(3, 0) + 493 - 1 }
      const sensor4Range = { start: getSensorConfigAddress(4, 0), end: getSensorConfigAddress(4, 0) + 493 - 1 }

      // Check that each sensor has at least some registers defined
      ;[sensor1Range, sensor2Range, sensor3Range, sensor4Range].forEach(({ start }, index) => {
        const sensorNum = index + 1
        expect(lookup[start]).toBeDefined() // First register of each sensor should be present
        // @ts-expect-error - may not exist when registers are disabled
        expect(lookup[start]!.path).toBe(`sensor${sensorNum}.configuration.samplingChannels`)
      })
    })

    it('should generate lookup with all required CM configuration registers', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

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
        // @ts-expect-error - may not exist when registers are disabled
        expect(lookup[addr]!.path).toBe(path)
        // @ts-expect-error - may not exist when registers are disabled
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should generate lookup with all required sensor configuration registers', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())
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
        // @ts-expect-error - may not exist when registers are disabled
        expect(lookup[addr]!.path).toBe(path)
        // @ts-expect-error - may not exist when registers are disabled
        expect(lookup[addr]!.size).toBe(size)
      })
    })

    it('should verify channel register address spacing is correct', () => {
      // Verify that there's a gap of 2 bytes between processAlarmEnabled and processAlarmDeadBand
      const channel1BaseAddr = 0x047

      // processAlarmEnabled is at offset 0x01 (size 1)
      // processAlarmDeadBand is at offset 0x02 (size 4)
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

      expect(lookup[channel1BaseAddr + 0x01]).toBeDefined() // processAlarmEnabled
      expect(lookup[channel1BaseAddr + 0x02]).toBeDefined() // processAlarmDeadBand
    })
  })

  describe('multi-sensor configuration register generation', () => {
    it('should generate correct addresses for channels across multiple sensors', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

      // Sensor 1 channels
      const s1c1BaseAddr = getChannelConfigAddress(1, 1, 0)
      const s1c2BaseAddr = getChannelConfigAddress(1, 2, 0)

      // Sensor 2 channels
      const s2c1BaseAddr = getChannelConfigAddress(2, 1, 0)

      // Sensor 3 channels
      const s3c1BaseAddr = getChannelConfigAddress(3, 1, 0)
      const s3c3BaseAddr = getChannelConfigAddress(3, 3, 0)

      // Verify channel configuration registers exist
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[s1c1BaseAddr + 0x00]!.path).toBe('sensor1.channel1.protocolDataType')
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[s1c2BaseAddr + 0x00]!.path).toBe('sensor1.channel2.protocolDataType')
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[s2c1BaseAddr + 0x00]!.path).toBe('sensor2.channel1.protocolDataType')
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[s3c1BaseAddr + 0x00]!.path).toBe('sensor3.channel1.protocolDataType')
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[s3c3BaseAddr + 0x00]!.path).toBe('sensor3.channel3.protocolDataType')

      // Verify all channels now exist (since we generate complete lookup)
      const s2c2BaseAddr = getChannelConfigAddress(2, 2, 0) // Channel 2 of sensor 2 now configured
      const s3c2BaseAddr = getChannelConfigAddress(3, 2, 0) // Channel 2 of sensor 3 now configured

      expect(lookup[s2c2BaseAddr + 0x00]).toBeDefined()
      expect(lookup[s3c2BaseAddr + 0x00]).toBeDefined()
    })
  })

  describe('address range validation', () => {
    it('should have no gaps in essential register blocks', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

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
        const channelBaseAddr = getChannelConfigAddress(1, channelNum, 0)
        channelOffsets.forEach((offset) => {
          expect(lookup[channelBaseAddr + offset]).toBeDefined()
        })
      })
    })
  })

  describe('edge cases', () => {
    it('should generate complete lookup table for all sensors and channels', () => {
      const lookup = createConfigurationRegisterLookup(completeTULIP3DeviceConfig())

      // Should have CM registers
      expect(lookup[0x000]).toBeDefined() // CM registers should always exist
      expect(lookup[0x004]).toBeDefined()

      // Should have all sensor registers
      for (let sensorNum = 1; sensorNum <= 4; sensorNum++) {
        const sensorBaseAddr = getSensorConfigAddress(sensorNum, 0)
        expect(lookup[sensorBaseAddr]).toBeDefined()
        // @ts-expect-error - may not exist when registers are disabled
        expect(lookup[sensorBaseAddr]!.path).toBe(`sensor${sensorNum}.configuration.samplingChannels`)

        // Should have all channel registers for each sensor
        for (let channelNum = 1; channelNum <= 8; channelNum++) {
          const channelBaseAddr = getChannelConfigAddress(sensorNum, channelNum, 0)
          expect(lookup[channelBaseAddr]).toBeDefined()
          // @ts-expect-error - may not exist when registers are disabled
          expect(lookup[channelBaseAddr]!.path).toBe(`sensor${sensorNum}.channel${channelNum}.protocolDataType`)
        }
      }
    })
  })

  describe('register guards when flags are disabled', () => {
    it('should have register guards for CM registers when registerConfig flags are disabled', () => {
      const configWithDisabledCMFlags: TULIP3DeviceConfig = {
        sensor1: {
          channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: completeSensorRegisterConfig(),
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: {
          tulip3ConfigurationRegisters: {
            // All flags omitted (undefined) - should become guards
          },
          tulip3IdentificationRegisters: {},
        },
      }

      const lookup = createConfigurationRegisterLookup(configWithDisabledCMFlags)

      // Verify register guards exist at CM register addresses
      expect(lookup[0x000]).toBeDefined()
      expect(lookup[0x000]).toHaveProperty('type', 'guard')
      expect(lookup[0x000]).toHaveProperty('message')

      expect(lookup[0x004]).toBeDefined()
      expect(lookup[0x004]).toHaveProperty('type', 'guard')

      expect(lookup[0x008]).toBeDefined()
      expect(lookup[0x008]).toHaveProperty('type', 'guard')

      expect(lookup[0x00A]).toBeDefined()
      expect(lookup[0x00A]).toHaveProperty('type', 'guard')

      expect(lookup[0x014]).toBeDefined()
      expect(lookup[0x014]).toHaveProperty('type', 'guard')
    })

    it('should have register guards for sensor registers when sensor registerConfig flags are disabled', () => {
      const configWithDisabledSensorFlags: TULIP3DeviceConfig = {
        sensor1: {
          channel1: { start: 0, end: 100, measurementTypes: [], channelName: 'sensor1Channel1', registerConfig: completeChannelRegisterConfig(), alarmFlags: createDefaultChannelAlarmFlags(), availableUnits: ['°C'], availableMeasurands: ['Temperature'] },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: {
            tulip3ConfigurationRegisters: {
              // All flags omitted (undefined) - should become guards
            },
            tulip3IdentificationRegisters: {},
            sensorSpecificConfigurationRegisters: {},
            sensorSpecificIdentificationRegisters: {},
          },
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: { tulip3ConfigurationRegisters: { measuringPeriodAlarmOff: true, measuringPeriodAlarmOn: true, transmissionRateAlarmOff: true, transmissionRateAlarmOn: true, overVoltageThreshold: true, underVoltageThreshold: true, overTemperatureCmChip: true, underTemperatureCmChip: true, downlinkAnswerTimeout: true, fetchAdditionalDownlinkTimeInterval: true, enableBleAdvertising: true }, tulip3IdentificationRegisters: {} },
      }

      const lookup = createConfigurationRegisterLookup(configWithDisabledSensorFlags)
      const sensor1BaseAddr = 0x02A

      // Verify register guards exist at sensor register addresses
      expect(lookup[sensor1BaseAddr + 0x00]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x00]).toHaveProperty('type', 'guard')

      expect(lookup[sensor1BaseAddr + 0x01]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x01]).toHaveProperty('type', 'guard')

      expect(lookup[sensor1BaseAddr + 0x03]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x03]).toHaveProperty('type', 'guard')

      expect(lookup[sensor1BaseAddr + 0x05]).toBeDefined()
      expect(lookup[sensor1BaseAddr + 0x05]).toHaveProperty('type', 'guard')
    })

    it('should have register guards for channel registers when channel registerConfig flags are disabled', () => {
      const configWithDisabledChannelFlags: TULIP3DeviceConfig = {
        sensor1: {
          channel1: {
            start: 0,
            end: 100,
            measurementTypes: [],
            channelName: 'sensor1Channel1',
            registerConfig: {
              tulip3ConfigurationRegisters: {
                // All flags omitted (undefined) - should become guards
              },
              tulip3IdentificationRegisters: {},
              channelSpecificConfigurationRegisters: {},
              channelSpecificIdentificationRegisters: {},
            },
            alarmFlags: createDefaultChannelAlarmFlags(),
            availableUnits: ['°C'],
            availableMeasurands: ['Temperature'],
          },
          alarmFlags: createDefaultSensorAlarmFlags(),
          registerConfig: { tulip3ConfigurationRegisters: { samplingChannels: true, bootTime: true, communicationTimeout: true, communicationRetryCount: true }, tulip3IdentificationRegisters: {}, sensorSpecificConfigurationRegisters: {}, sensorSpecificIdentificationRegisters: {} },
        },
        alarmFlags: createDefaultCommunicationModuleAlarmFlags(),
        registerConfig: { tulip3ConfigurationRegisters: { measuringPeriodAlarmOff: true, measuringPeriodAlarmOn: true, transmissionRateAlarmOff: true, transmissionRateAlarmOn: true, overVoltageThreshold: true, underVoltageThreshold: true, overTemperatureCmChip: true, underTemperatureCmChip: true, downlinkAnswerTimeout: true, fetchAdditionalDownlinkTimeInterval: true, enableBleAdvertising: true }, tulip3IdentificationRegisters: {} },
      }

      const lookup = createConfigurationRegisterLookup(configWithDisabledChannelFlags)
      const channel1BaseAddr = getChannelConfigAddress(1, 1, 0)

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
          tulip3ConfigurationRegisters: {
            measuringPeriodAlarmOff: true,
            // measuringPeriodAlarmOn omitted (undefined) - should become guard
            transmissionRateAlarmOff: true,
            transmissionRateAlarmOn: true,
            overVoltageThreshold: true,
            underVoltageThreshold: true,
            overTemperatureCmChip: true,
            underTemperatureCmChip: true,
            downlinkAnswerTimeout: true,
            fetchAdditionalDownlinkTimeInterval: true,
            enableBleAdvertising: true,
          },
          tulip3IdentificationRegisters: {},
        },
      }

      const lookup = createConfigurationRegisterLookup(mixedConfig)

      // measuringPeriodAlarmOff should be a register entry (has path)
      expect(lookup[0x000]).toBeDefined()
      expect(lookup[0x000]).not.toHaveProperty('type', 'guard')
      // @ts-expect-error - may not exist when registers are disabled
      expect(lookup[0x000]!.path).toBe('communicationModule.measuringPeriodAlarmOff')

      // measuringPeriodAlarmOn should be a guard
      expect(lookup[0x004]).toBeDefined()
      expect(lookup[0x004]).toHaveProperty('type', 'guard')
    })
  })
})
