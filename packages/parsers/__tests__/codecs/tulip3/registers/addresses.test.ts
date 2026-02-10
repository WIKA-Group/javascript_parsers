import { describe, expect, it } from 'vitest'
import {
  getChannelConfigAddress,
  getChannelIdAddress,
  getSensorConfigAddress,
  getSensorIdAddress,
} from '../../../../src/codecs/addresses'

describe('tULIP3 register address calculations', () => {
  describe('identification register addresses', () => {
    describe('sensor identification addresses', () => {
      it('should calculate correct base address for sensor 1', () => {
        const sensor1BaseAddress = getSensorIdAddress(1, 0)
        expect(sensor1BaseAddress).toBe(0x03C) // 0x03C + (1-1) * 460 = 0x03C
      })

      it('should calculate correct base addresses for all sensors', () => {
        const sensor1Base = getSensorIdAddress(1, 0)
        const sensor2Base = getSensorIdAddress(2, 0)
        const sensor3Base = getSensorIdAddress(3, 0)
        const sensor4Base = getSensorIdAddress(4, 0)

        expect(sensor1Base).toBe(0x03C + 0 * 460) // 0x03C
        expect(sensor2Base).toBe(0x03C + 1 * 460) // 0x200
        expect(sensor3Base).toBe(0x03C + 2 * 460) // 0x3C4
        expect(sensor4Base).toBe(0x03C + 3 * 460) // 0x588

        // Verify spacing between sensors is 460 bytes
        expect(sensor2Base - sensor1Base).toBe(460)
        expect(sensor3Base - sensor2Base).toBe(460)
        expect(sensor4Base - sensor3Base).toBe(460)
      })
    })

    describe('channel identification addresses', () => {
      it('should calculate correct base addresses for channels', () => {
        const channel1BaseAddress = getChannelIdAddress(1, 1, 0)
        const channel2BaseAddress = getChannelIdAddress(1, 2, 0)

        // Channel 1 of sensor 1: 0x03C + (1-1) * 400 + 1 * 60 + (1-1) * 50 = 0x03C + 0 + 60 + 0 = 0x78
        expect(channel1BaseAddress).toBe(0x78)

        // Channel 2 of sensor 1: 0x03C + (1-1) * 400 + 1 * 60 + (2-1) * 50 = 0x03C + 0 + 60 + 50 = 0xAA
        expect(channel2BaseAddress).toBe(0xAA)

        // Verify spacing between channels is 50 bytes
        expect(channel2BaseAddress - channel1BaseAddress).toBe(50)
      })

      it('should verify channel address formula is correct for multiple channels', () => {
        // Test channel address formula: 0x03C + (n-1) * 400 + n * 60 + (m-1) * 50
        const sensor1Channel1 = getChannelIdAddress(1, 1, 0)
        const sensor1Channel2 = getChannelIdAddress(1, 2, 0)
        const sensor1Channel3 = getChannelIdAddress(1, 3, 0)
        const sensor1Channel8 = getChannelIdAddress(1, 8, 0)

        expect(sensor1Channel1).toBe(0x03C + 0 * 400 + 1 * 60 + 0 * 50) // 0x78
        expect(sensor1Channel2).toBe(0x03C + 0 * 400 + 1 * 60 + 1 * 50) // 0xAA
        expect(sensor1Channel3).toBe(0x03C + 0 * 400 + 1 * 60 + 2 * 50) // 0xDC
        expect(sensor1Channel8).toBe(0x03C + 0 * 400 + 1 * 60 + 7 * 50) // 0x192

        // Verify spacing between channels is 50 bytes
        expect(sensor1Channel2 - sensor1Channel1).toBe(50)
        expect(sensor1Channel3 - sensor1Channel2).toBe(50)
      })

      it('should calculate correct addresses for channels across multiple sensors', () => {
        // Sensor 1 channels
        const s1c1 = getChannelIdAddress(1, 1, 0)
        const s1c2 = getChannelIdAddress(1, 2, 0)

        // Sensor 2 channels
        const s2c1 = getChannelIdAddress(2, 1, 0)
        const s2c2 = getChannelIdAddress(2, 2, 0)

        // Sensor 3 channels
        const s3c1 = getChannelIdAddress(3, 1, 0)

        // Verify formulas
        expect(s1c1).toBe(0x03C + 0 * 400 + 1 * 60 + 0 * 50)
        expect(s1c2).toBe(0x03C + 0 * 400 + 1 * 60 + 1 * 50)
        expect(s2c1).toBe(0x03C + 1 * 400 + 2 * 60 + 0 * 50)
        expect(s2c2).toBe(0x03C + 1 * 400 + 2 * 60 + 1 * 50)
        expect(s3c1).toBe(0x03C + 2 * 400 + 3 * 60 + 0 * 50)

        // Verify channel spacing within same sensor
        expect(s1c2 - s1c1).toBe(50)
        expect(s2c2 - s2c1).toBe(50)
      })
    })
  })

  describe('configuration register addresses', () => {
    describe('sensor configuration addresses', () => {
      it('should calculate correct base address for sensor 1 configuration', () => {
        const sensor1BaseAddress = getSensorConfigAddress(1, 0)
        expect(sensor1BaseAddress).toBe(0x02A) // 0x02A + (1-1) * 493 = 0x02A
      })

      it('should calculate correct base addresses for all sensor configurations', () => {
        const sensor1BaseAddress = getSensorConfigAddress(1, 0)
        const sensor2BaseAddress = getSensorConfigAddress(2, 0)
        const sensor3BaseAddress = getSensorConfigAddress(3, 0)
        const sensor4BaseAddress = getSensorConfigAddress(4, 0)

        expect(sensor1BaseAddress).toBe(0x02A) // 0x02A + (1-1) * 493 = 0x02A
        expect(sensor2BaseAddress).toBe(0x217) // 0x02A + (2-1) * 493 = 0x02A + 493 = 0x217
        expect(sensor3BaseAddress).toBe(0x404) // 0x02A + (3-1) * 493 = 0x02A + 986 = 0x404
        expect(sensor4BaseAddress).toBe(0x5F1) // 0x02A + (4-1) * 493 = 0x02A + 1479 = 0x5F1

        // Verify spacing between sensors is 493 bytes
        expect(sensor2BaseAddress - sensor1BaseAddress).toBe(493)
        expect(sensor3BaseAddress - sensor2BaseAddress).toBe(493)
        expect(sensor4BaseAddress - sensor3BaseAddress).toBe(493)
      })
    })

    describe('channel configuration addresses', () => {
      it('should calculate correct base addresses for channel configuration', () => {
        const channel1BaseAddress = getChannelConfigAddress(1, 1, 0)
        const channel2BaseAddress = getChannelConfigAddress(1, 2, 0)

        // Channel 1 of sensor 1: 0x02A + (1-1) * 464 + 1 * 29 + (1-1) * 58 = 0x02A + 0 + 29 + 0 = 0x047
        expect(channel1BaseAddress).toBe(0x047)

        // Channel 2 of sensor 1: 0x02A + (1-1) * 464 + 1 * 29 + (2-1) * 58 = 0x02A + 0 + 29 + 58 = 0x081
        expect(channel2BaseAddress).toBe(0x081)

        // Verify spacing between channels is 58 bytes
        expect(channel2BaseAddress - channel1BaseAddress).toBe(58)
      })

      it('should verify channel address formula is correct for multiple channels', () => {
        // Test the formula: 0x02A + (n-1) * 464 + n * 29 + (m-1) * 58
        const sensor1Channel1 = getChannelConfigAddress(1, 1, 0)
        const sensor1Channel2 = getChannelConfigAddress(1, 2, 0)
        const sensor1Channel3 = getChannelConfigAddress(1, 3, 0)
        const sensor1Channel8 = getChannelConfigAddress(1, 8, 0)

        expect(sensor1Channel1).toBe(0x02A + 0 * 464 + 1 * 29 + 0 * 58) // 0x047
        expect(sensor1Channel2).toBe(0x02A + 0 * 464 + 1 * 29 + 1 * 58) // 0x081
        expect(sensor1Channel3).toBe(0x02A + 0 * 464 + 1 * 29 + 2 * 58) // 0x0BB
        expect(sensor1Channel8).toBe(0x02A + 0 * 464 + 1 * 29 + 7 * 58) // 0x1ED

        // Verify spacing between channels is 58 bytes
        expect(sensor1Channel2 - sensor1Channel1).toBe(58)
        expect(sensor1Channel3 - sensor1Channel2).toBe(58)
      })

      it('should calculate correct addresses for channels across multiple sensors', () => {
        // Sensor 1 channels
        const s1c1 = getChannelConfigAddress(1, 1, 0)
        const s1c2 = getChannelConfigAddress(1, 2, 0)

        // Sensor 2 channels
        const s2c1 = getChannelConfigAddress(2, 1, 0)
        const s2c2 = getChannelConfigAddress(2, 2, 0)

        // Sensor 3 channels
        const s3c1 = getChannelConfigAddress(3, 1, 0)
        const s3c3 = getChannelConfigAddress(3, 3, 0)

        // Verify formulas
        expect(s1c1).toBe(0x02A + 0 * 464 + 1 * 29 + 0 * 58)
        expect(s1c2).toBe(0x02A + 0 * 464 + 1 * 29 + 1 * 58)
        expect(s2c1).toBe(0x02A + 1 * 464 + 2 * 29 + 0 * 58)
        expect(s2c2).toBe(0x02A + 1 * 464 + 2 * 29 + 1 * 58)
        expect(s3c1).toBe(0x02A + 2 * 464 + 3 * 29 + 0 * 58)
        expect(s3c3).toBe(0x02A + 2 * 464 + 3 * 29 + 2 * 58)

        // Verify channel spacing within same sensor
        expect(s1c2 - s1c1).toBe(58)
        expect(s2c2 - s2c1).toBe(58)
      })
    })
  })
})
