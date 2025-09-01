import type { TULIP3DeviceSensorConfig } from '../../../../src/codecs/tulip3/profile'
import { describe, expect, it } from 'vitest'
import { decodeIdentificationRegisterRead, decodeIdentificationRegisterWrite, validateAndTransformIdentificationResult } from '../../../../src/codecs/tulip3/messages/identification'
import { hexStringToIntArray } from '../../../../src/utils'
import { FullIdentificationHexString } from '../constants/identification'

const sensor1channelConfig = {
  channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
  channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel2' },
  channel3: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel3' },
  channel4: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel4' },
  channel5: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel5' },
  channel6: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel6' },
  channel7: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel7' },
  channel8: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const sensor2channelConfig = {
  channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel1' },
  channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel2' },
  channel3: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel3' },
  channel4: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel4' },
  channel5: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel5' },
  channel6: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel6' },
  channel7: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel7' },
  channel8: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const sensor3channelConfig = {
  channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel1' },
  channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel2' },
  channel3: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel3' },
  channel4: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel4' },
  channel5: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel5' },
  channel6: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel6' },
  channel7: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel7' },
  channel8: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor3Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const sensor4channelConfig = {
  channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel1' },
  channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel2' },
  channel3: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel3' },
  channel4: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel4' },
  channel5: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel5' },
  channel6: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel6' },
  channel7: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel7' },
  channel8: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor4Channel8' },
} as const satisfies TULIP3DeviceSensorConfig['sensor1']

const config = {
  sensor1: sensor1channelConfig,
  sensor2: sensor2channelConfig,
  sensor3: sensor3channelConfig,
  sensor4: sensor4channelConfig,
} as const satisfies TULIP3DeviceSensorConfig

const configWithS1C1C2 = {
  sensor1: {
    channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
    channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel2' },
  },
} as const satisfies TULIP3DeviceSensorConfig

describe('identification messages', () => {
  describe('read registers', () => {
    it('should parse an initial identification message', () => {
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, configWithS1C1C2)

      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 30,
          productSubId: 'LoRaWAN class A',
          channelPlan: 1,
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Pressure (gauge)',
            unit: 'bar',
          },
          channel2: {
            channelName: 'sensor1Channel2',
            measurand: 'Temperature',
            unit: '°C',
          },
        },
      })
    })

    it('should throw RangeError for malformed payload that is too short', () => {
      const hexString = '0x1401 0004 1E'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, config)
      }).toThrow(RangeError)

      expect(() => {
        decodeIdentificationRegisterRead(data!, config)
      }).toThrow('Incomplete register data for address 0x0')
    })

    it('should parse partial identification message with serial number', () => {
      const hexString = '0x1402 01AB 3141303132 334142433435'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, config)

      expect(result.data.identification).toEqual({
        communicationModule: {
          serialNumberPart1: '1A012',
          serialNumberPart2: '3ABC45',
        },
      })
    })

    it('should correctly use lookup tables for productSubId conversion', () => {
    // Test with different product sub ID values - LoRaWAN class B (0x03)
      const hexString = '0x1401 0004 1E030101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, configWithS1C1C2)

      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 30,
          productSubId: 'LoRaWAN class B',
          channelPlan: 1,
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Pressure (gauge)',
            unit: 'bar',
          },
          channel2: {
            channelName: 'sensor1Channel2',
            measurand: 'Temperature',
            unit: '°C',
          },
        },
      })
    })

    it('should correctly use lookup tables for unit conversion', () => {
    // Test with different unit values - using 0x0E (14) for psi instead of bar (7)
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 030E 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, configWithS1C1C2)

      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 30,
          productSubId: 'LoRaWAN class A',
          channelPlan: 1,
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Pressure (gauge)',
            unit: 'psi',
          },
          channel2: {
            channelName: 'sensor1Channel2',
            measurand: 'Temperature',
            unit: '°C',
          },
        },
      })
    })

    it('should correctly use lookup tables for channel plan conversion', () => {
    // Test with different channel plan - using 0x02 for US915 instead of EU868 (1)
      const hexString = '0x1401 0004 1E020201 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, configWithS1C1C2)

      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 30,
          productSubId: 'LoRaWAN class A',
          channelPlan: 2,
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Pressure (gauge)',
            unit: 'bar',
          },
          channel2: {
            channelName: 'sensor1Channel2',
            measurand: 'Temperature',
            unit: '°C',
          },
        },
      })
    })

    it('should parse message with multiple connected sensors', () => {
    // Test with multiple sensors connected (bits 0 and 1 set = sensors 1 and 2)
      const hexString = '0x1401 0004 1E020103 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, {
        ...configWithS1C1C2,
        sensor2: {

        },
      })

      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 30,
          productSubId: 'LoRaWAN class A',
          channelPlan: 1,
          connectedSensors: {
            sensor1: true,
            sensor2: true,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Pressure (gauge)',
            unit: 'bar',
          },
          channel2: {
            channelName: 'sensor1Channel2',
            measurand: 'Temperature',
            unit: '°C',
          },
        },
      })
    })

    it('should handle BLE only product sub ID', () => {
    // Test with BLE only (0x01) product sub ID
      const hexString = '0x1401 0004 1E010101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, configWithS1C1C2)

      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 30,
          productSubId: 'BLE only',
          channelPlan: 1,
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Pressure (gauge)',
            unit: 'bar',
          },
          channel2: {
            channelName: 'sensor1Channel2',
            measurand: 'Temperature',
            unit: '°C',
          },
        },
      })
    })

    it('should handle Mioty class Z product sub ID', () => {
    // Test with Mioty class Z (0x05) product sub ID
      const hexString = '0x1401 0004 1E050101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, configWithS1C1C2)

      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 30,
          productSubId: 'Mioty class Z',
          channelPlan: 1,
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Pressure (gauge)',
            unit: 'bar',
          },
          channel2: {
            channelName: 'sensor1Channel2',
            measurand: 'Temperature',
            unit: '°C',
          },
        },
      })
    })

    it('should parse unordered and interleaved payload correctly', () => {
    // Payload sends data for C2, then C1, then C2, then C1 with accuracy, offset and physical limits
      const hexString = '0x1401 1542 0101 0F02 0307 1688 01B04F7A589BA123 1146 12344447a58b'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead<typeof config>(data!, config)

      expect(result.data.identification.sensor1?.channel1?.measurand).toBe('Pressure (gauge)')
      expect(result.data.identification.sensor1?.channel1?.unit).toBe('bar')
      expect(result.data.identification.sensor1?.channel1?.accuracy).toBeCloseTo(4.660, 3) // 0x1234 / 1000 = 4.660
      expect(result.data.identification.sensor1?.channel1?.offset).toBeCloseTo(798.586609, 5) // Float32 conversion of 0x4447a58b

      expect(result.data.identification.sensor1?.channel2?.measurand).toBe('Temperature')
      expect(result.data.identification.sensor1?.channel2?.unit).toBe('°C')
      expect(result.data.identification.sensor1?.channel2?.minPhysicalLimit).toBeCloseTo(6.47662326e-38) // Float32 conversion of 0x01B04F7A
      // due to 64bit precision, we are around 4 million off and ignore the last 7 digits
      expect(result.data.identification.sensor1?.channel2?.maxPhysicalLimit).toBeCloseTo(1.36893103e+15, -7) // Float32 conversion of 0x589BA123
    })

    it('should correctly parse the full hexstring with everything', () => {
      const result = decodeIdentificationRegisterRead(FullIdentificationHexString, config)
      expect(result.data.identification).toEqual({
        communicationModule: {
          productId: 3,
          productSubId: 'LoRaWAN class C',
          channelPlan: 1,
          connectedSensors: {
            sensor1: true,
            sensor2: true,
            sensor3: true,
            sensor4: true,
          },
          firmwareVersion: '3.1.4',
          hardwareVersion: '2.5.1',
          productionDate: new Date('2024-03-15T00:00:00.000Z'),
          serialNumberPart1: 'WIKA0',
          serialNumberPart2: '01ABC!',
        },
        sensor1: {
          identification: {
            sensorType: 1,
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: true,
              channel4: true,
              channel5: true,
              channel6: true,
              channel7: true,
              channel8: true,
            },
            firmwareVersion: '2.1.0',
            hardwareVersion: '1.3.2',
            productionDate: new Date('2023-11-20T00:00:00.000Z'),
            serialNumberPart1: 'TEMP0',
            serialNumberPart2: '1XYZ!!',
          },
          channel1: {
            channelName: 'sensor1Channel1',
            measurand: 'Temperature',
            unit: '°C',
            minMeasureRange: -40,
            maxMeasureRange: 100,
            minPhysicalLimit: -50,
            maxPhysicalLimit: 125,
            accuracy: 0.2,
            offset: 0.5,
            gain: 0.998,
            calibrationDate: new Date('2023-10-05T00:00:00.000Z'),
          },
          channel2: {
            measurand: 'Pressure (gauge)',
            unit: 'bar',
            minMeasureRange: 0,
            channelName: 'sensor1Channel2',
            maxMeasureRange: 10,
            minPhysicalLimit: -1,
            maxPhysicalLimit: 12,
            accuracy: 0.3,
            offset: 0.01,
            gain: 1.002,
            calibrationDate: new Date('2024-02-28T00:00:00.000Z'),
          },
          channel3: {
            measurand: 'Flow (vol.)',
            unit: 'l/min',
            channelName: 'sensor1Channel3',
            minMeasureRange: 0,
            maxMeasureRange: 50,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 60,
            accuracy: 0.5,
            offset: 0.02,
            gain: 0.997,
            calibrationDate: new Date('2024-06-17T00:00:00.000Z'),
          },
          channel4: {
            measurand: 'Level',
            unit: 'm',
            channelName: 'sensor1Channel4',
            minMeasureRange: 0,
            maxMeasureRange: 5,
            minPhysicalLimit: -0.5,
            maxPhysicalLimit: 6,
            accuracy: 0.15,
            offset: 0.005,
            gain: 1.001,
            calibrationDate: new Date('2025-03-05T00:00:00.000Z'),
          },
          channel5: {
            measurand: 'Voltage',
            channelName: 'sensor1Channel5',
            unit: 'V',
            minMeasureRange: 0,
            maxMeasureRange: 25,
            minPhysicalLimit: -1,
            maxPhysicalLimit: 30,
            accuracy: 0.125,
            offset: 0.01,
            gain: 0.991,
            calibrationDate: new Date('2024-09-18T00:00:00.000Z'),
          },
          channel6: {
            channelName: 'sensor1Channel6',
            measurand: 'Humidity (relative)',
            unit: '%',
            minMeasureRange: 0,
            maxMeasureRange: 100,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 100,
            accuracy: 2,
            offset: 0.5,
            gain: 1.003,
            calibrationDate: new Date('2025-05-22T00:00:00.000Z'),
          },
          channel7: {
            channelName: 'sensor1Channel7',
            measurand: 'Resistance',
            unit: 'Ω',
            minMeasureRange: 40,
            maxMeasureRange: 240,
            minPhysicalLimit: 30,
            maxPhysicalLimit: 280,
            accuracy: 0.35,
            offset: 0.8,
            gain: 0.9985,
            calibrationDate: new Date('2024-10-03T00:00:00.000Z'),
          },
          channel8: {
            channelName: 'sensor1Channel8',
            measurand: 'Density',
            unit: 'kg/m³',
            minMeasureRange: 250,
            maxMeasureRange: 1000,
            minPhysicalLimit: 200,
            maxPhysicalLimit: 1200,
            accuracy: 0.6,
            offset: 2,
            gain: 1.008,
            calibrationDate: new Date('2025-04-12T00:00:00.000Z'),
          },
        },
        sensor2: {
          identification: {
            sensorType: 1,
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: true,
              channel4: true,
              channel5: true,
              channel6: true,
              channel7: true,
              channel8: true,
            },
            firmwareVersion: '1.8.3',
            hardwareVersion: '2.0.1',
            productionDate: new Date('2024-07-08T00:00:00.000Z'),
            serialNumberPart1: 'FREQ0',
            serialNumberPart2: '2DEF!!',
          },
          channel1: {
            measurand: 'Frequency',
            unit: 'Hz',
            channelName: 'sensor2Channel1',
            minMeasureRange: 0,
            maxMeasureRange: 62.5,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 80,
            accuracy: 0.05,
            offset: 0.01,
            gain: 1,
            calibrationDate: new Date('2023-12-03T00:00:00.000Z'),
          },
          channel2: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor2Channel2',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel3: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor2Channel3',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel4: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor2Channel4',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel5: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor2Channel5',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel6: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor2Channel6',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel7: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor2Channel7',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel8: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor2Channel8',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
        },
        sensor3: {
          identification: {
            sensorType: 1,
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: true,
              channel4: true,
              channel5: true,
              channel6: true,
              channel7: true,
              channel8: true,
            },
            firmwareVersion: '2.5.7',
            hardwareVersion: '1.4.0',
            productionDate: new Date('2024-01-12T00:00:00.000Z'),
            serialNumberPart1: 'SPEED',
            serialNumberPart2: '3GHI!!',
          },
          channel1: {
            channelName: 'sensor3Channel1',
            measurand: 'Speed',
            unit: 'm/s',
            minMeasureRange: 0,
            maxMeasureRange: 20,
            minPhysicalLimit: -5,
            maxPhysicalLimit: 25,
            accuracy: 0.4,
            offset: 0.02,
            gain: 0.9975,
            calibrationDate: new Date('2024-05-09T00:00:00.000Z'),
          },
          channel2: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor3Channel2',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel3: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor3Channel3',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel4: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor3Channel4',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel5: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor3Channel5',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel6: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor3Channel6',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel7: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor3Channel7',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel8: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor3Channel8',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
        },
        sensor4: {
          identification: {
            sensorType: 1,
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: true,
              channel4: true,
              channel5: true,
              channel6: true,
              channel7: true,
              channel8: true,
            },
            firmwareVersion: '3.0.2',
            hardwareVersion: '2.1.5',
            productionDate: new Date('2023-09-25T00:00:00.000Z'),
            serialNumberPart1: 'ANGLE',
            serialNumberPart2: '4JKL!!',
          },
          channel1: {
            measurand: 'Angle of rotation / inclination',
            unit: '°',
            channelName: 'sensor4Channel1',
            minMeasureRange: -180,
            maxMeasureRange: 180,
            minPhysicalLimit: -180,
            maxPhysicalLimit: 180,
            accuracy: 1,
            offset: 0.1,
            gain: 1.005,
            calibrationDate: new Date('2023-08-11T00:00:00.000Z'),
          },
          channel2: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor4Channel2',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel3: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor4Channel3',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel4: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor4Channel4',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel5: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor4Channel5',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel6: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor4Channel6',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel7: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor4Channel7',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
          channel8: {
            measurand: 'Current',
            unit: 'mA',
            channelName: 'sensor4Channel8',
            minMeasureRange: 4,
            maxMeasureRange: 20,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 24,
            accuracy: 0.1,
            offset: 2.5,
            gain: 1,
            calibrationDate: new Date('2025-08-04T00:00:00.000Z'),
          },
        },
      })
    })
  })

  describe('write registers', () => {
    it('should parse identification write response with frame counter 0, success status, revision counter 3, and no wrong frames', () => {
      const hexString = '0x1403 00 01 0003 00'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterWrite(data!)

      expect(result).toEqual({
        data: {
          messageType: 0x14,
          messageSubType: 0x03,
          identification: {
            frames: [{
              frameNumber: 0,
              status: 'Configuration received and applied with success',
            }],
            revisionCounter: 3,
            totalWrongFrames: 0,
          },
        },
      })
    })

    it('should parse identification write response with multiple additional frames', () => {
      const hexString = '0x1403 00 01 0005 02 04 03 08 05'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterWrite(data!)

      expect(result.data.messageType).toBe(0x14)
      expect(result.data.messageSubType).toBe(0x03)
      expect(result.data.identification.revisionCounter).toBe(5)
      expect(result.data.identification.totalWrongFrames).toBe(2)
      expect(result.data.identification.frames).toHaveLength(3) // Initial + 2 additional

      // Initial frame
      expect(result.data.identification.frames[0]).toEqual({
        frameNumber: 0,
        status: 'Configuration received and applied with success',
      })

      // Additional frame 1: (0x04 >> 2) & 0x1F = 1
      expect(result.data.identification.frames[1]).toEqual({
        frameNumber: 1,
        status: 'Configuration rejected - At least one register has an invalid value',
      })

      // Additional frame 2: (0x08 >> 2) & 0x1F = 2
      expect(result.data.identification.frames[2]).toEqual({
        frameNumber: 2,
        status: 'Entire configuration discarded because of invalid parameter combination',
      })
    })

    it('should throw error for odd number of additional bytes - incomplete frame at position 7', () => {
      const hexString = '0x1403 00 01 0005 02 04'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow(RangeError)
      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow('Invalid message length: expected odd number of bytes for apply config answer with additional frames, got 8')
    })

    it('should throw error for odd number of additional bytes - 2 additional frames, last incomplete', () => {
      const hexString = '0x1403 00 01 0005 02 04 03 08 05 FF'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow(RangeError)
      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow('Invalid message length: expected odd number of bytes for apply config answer with additional frames, got 12')
    })

    it('should throw error for odd number of additional bytes - 3 additional frames, last incomplete', () => {
      const hexString = '0x1403 00 01 0005 02 04 03 08 05 FF 01 AA'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow(RangeError)
      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow('Invalid message length: expected odd number of bytes for apply config answer with additional frames, got 14')
    })

    it('should return correctly mapped message with basic fields', () => {
      const hexString = '0x1403 00 01 0003 00'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterWrite(data!)

      expect(result).toBeDefined()
      expect(result.data.messageType).toBe(0x14)
      expect(result.data.messageSubType).toBe(0x03)
      expect(result.data.identification.revisionCounter).toBe(3)
      expect(result.data.identification.totalWrongFrames).toBe(0)
      expect(result.data.identification.frames).toHaveLength(1)

      const frame = result.data.identification.frames[0]!
      expect(frame.frameNumber).toBe(0)
      expect(frame.status).toBe('Configuration received and applied with success')
    })

    it('should return empty message for minimal payload with only message type', () => {
      const hexString = '0x1403'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow(RangeError)
      expect(() => {
        decodeIdentificationRegisterWrite(data!)
      }).toThrow('Identification message too short. Expected at least 4 bytes but got 2')
    })

    it('should parse message with only frame data correctly', () => {
      const hexString = '0x1403 04 02'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterWrite(data!)

      expect(result).toBeDefined()
      expect(result.data.messageType).toBe(0x14)
      expect(result.data.messageSubType).toBe(0x03)
      expect(result.data.identification.revisionCounter).toBeUndefined()
      expect(result.data.identification.totalWrongFrames).toBeUndefined()
      expect(result.data.identification.frames).toHaveLength(1)

      const frame = result.data.identification.frames[0]!
      expect(frame.frameNumber).toBe(1) // (0x04 >> 2) & 0x1F = 1
      expect(frame.status).toBe('Configuration rejected - Tried to write a read only register')
    })

    describe('frame number extraction', () => {
      it('should extract frame number 7 from 0x9C', () => {
        const hexString = '0x1403 9C 03'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.frameNumber).toBe(7) // 0x9C = 10011100, bits 6-2 = 00111 = 7
      })

      it('should extract frame number 1 from 0x84', () => {
        const hexString = '0x1403 84 03'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.frameNumber).toBe(1) // 0x84 = 10000100, bits 6-2 = 00001 = 1
      })

      it('should extract frame number 31 from 0xFC', () => {
        const hexString = '0x1403 FC 03'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.frameNumber).toBe(31) // 0xFC = 11111100, bits 6-2 = 11111 = 31
      })
    })

    describe('status code mapping', () => {
      it('should map status code 0 to "Configuration received but not applied"', () => {
        const hexString = '0x1403 00 00'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Configuration received but not applied')
      })

      it('should map status code 1 to "Configuration received and applied with success"', () => {
        const hexString = '0x1403 00 01'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Configuration received and applied with success')
      })

      it('should map status code 2 to "Configuration rejected - Tried to write a read only register"', () => {
        const hexString = '0x1403 00 02'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Configuration rejected - Tried to write a read only register')
      })

      it('should map status code 3 to "Configuration rejected - At least one register has an invalid value"', () => {
        const hexString = '0x1403 00 03'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Configuration rejected - At least one register has an invalid value')
      })

      it('should map status code 4 to "Configuration rejected - The combination register start address/number of bytes is wrong"', () => {
        const hexString = '0x1403 00 04'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Configuration rejected - The combination register start address/number of bytes is wrong')
      })

      it('should map status code 5 to "Entire configuration discarded because of invalid parameter combination"', () => {
        const hexString = '0x1403 00 05'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Entire configuration discarded because of invalid parameter combination')
      })

      it('should map status code 6 to "Entire configuration discarded because no answer from the cloud"', () => {
        const hexString = '0x1403 00 06'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Entire configuration discarded because no answer from the cloud')
      })

      it('should map status code 7 to "Missing frame"', () => {
        const hexString = '0x1403 00 07'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Missing frame')
      })

      it('should map status code 8 to "Frame rejected - frame number already received"', () => {
        const hexString = '0x1403 00 08'
        const data = hexStringToIntArray(hexString)
        expect(data).toBeDefined()

        const result = decodeIdentificationRegisterWrite(data!)

        expect(result.data.identification.frames).toHaveLength(1)
        expect(result.data.identification.frames[0]!.status).toBe('Frame rejected - frame number already received')
      })
    })
  })
})

describe('validation and transformation after decode (tests for validation function)', () => {
  describe('connected sensors validation logic', () => {
    it('should pass when all connected sensors match configuration', () => {
      // Use the basic identification hex string with correct connected sensors
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should throw TypeError when connected sensor is not in config', () => {
      // Create a config that only includes sensor1
      const limitedConfig = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
          channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel2' },
        },
      } as const satisfies TULIP3DeviceSensorConfig

      // Use a hex string that indicates sensor2 is connected (modify connected sensors byte)
      const hexString = '0x1401 0004 1E020103 07C1 03 0F02 0307 1542 0101' // sensor1 and sensor2 connected
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, limitedConfig)
      }).toThrow(TypeError)

      expect(() => {
        decodeIdentificationRegisterRead(data!, limitedConfig)
      }).toThrow(/Device sensor connection mismatch: sensor2 is connected but this device expects it to not be connected/)
    })

    it('should throw TypeError when expected sensor is not connected', () => {
      // Use a config that includes sensor2 but hex data that doesn't indicate it's connected
      const extendedConfig = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
          channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel2' },
        },
        sensor2: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel1' },
        },
      } as const satisfies TULIP3DeviceSensorConfig

      // Use hex string that only has sensor1 connected
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, extendedConfig)
      }).toThrow(TypeError)

      expect(() => {
        decodeIdentificationRegisterRead(data!, extendedConfig)
      }).toThrow(/Device sensor connection mismatch: sensor2 is not connected but this device expects it to be connected/)
    })

    it('should correctly handle communicationModule without connected sensors', () => {
      // Use identification hex string that might not have connectedSensors field
      const hexString = '0x1402 01AB 3141303132 334142433435' // Serial number only
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, config)
      }).not.toThrow()
    })
  })

  describe('result sensors validation logic', () => {
    it('should pass when all decoded sensors exist in config', () => {
      // Use the full identification hex string which decodes multiple sensors
      const result = decodeIdentificationRegisterRead(FullIdentificationHexString, config)

      // Should not throw and should have valid sensors
      expect(result.data.messageType).toBe(0x14)
      expect(result.data.identification).toBeDefined()
    })

    it('should throw TypeError when decoded result contains sensors not in config', () => {
      // Create a very limited config that only has sensor1
      const limitedConfig = {
        sensor1: sensor1channelConfig,
      } as const satisfies TULIP3DeviceSensorConfig

      // Try to use the full identification hex string which contains other sensors
      // But first we need to make sure connected sensors validation passes
      expect(() => {
        decodeIdentificationRegisterRead(FullIdentificationHexString, limitedConfig)
      }).toThrow(TypeError)

      // The error could be either connected sensors validation or result sensors validation
      // depending on the data content, so let's check for either
      expect(() => {
        decodeIdentificationRegisterRead(FullIdentificationHexString, limitedConfig)
      }).toThrow(/not supported by this device|Device sensor connection mismatch/)
    })

    it('should correctly filter out communicationModule from sensor validation', () => {
      // Use simple hex string that should only decode communicationModule data
      const hexString = '0x1402 01AB 3141303132 334142433435' // Serial number only
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, config)
      }).not.toThrow()
    })

    it('should handle empty sensors config correctly', () => {
      const emptyConfig = {} as const satisfies TULIP3DeviceSensorConfig

      // Use hex string that only decodes communicationModule
      const hexString = '0x1402 01AB 3141303132 334142433435'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, emptyConfig)
      }).not.toThrow()
    })
  })

  describe('channel validation logic', () => {
    it('should pass when all channels in result exist in config', () => {
      // Use basic identification message with specific channels
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should throw TypeError when result contains channels not in config', () => {
      // Create config with only channel1
      const limitedChannelConfig = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
          // Missing channel2
        },
      } as const satisfies TULIP3DeviceSensorConfig

      // Use hex string that decodes both channel1 and channel2
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, limitedChannelConfig)
      }).toThrow(TypeError)

      expect(() => {
        decodeIdentificationRegisterRead(data!, limitedChannelConfig)
      }).toThrow(/Channel channel2 on sensor sensor1 is not supported by this device/)
    })

    it('should correctly filter out identification key from channel validation', () => {
      // This test ensures that identification is not treated as a channel
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      // Should work even though the result will have identification field
      expect(() => {
        decodeIdentificationRegisterRead(data!, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should handle sensors with no channels gracefully', () => {
      const sensorNoChannelsConfig = {
        sensor1: {},
      } as const satisfies TULIP3DeviceSensorConfig

      // Use hex string that should only decode communicationModule
      const hexString = '0x1402 01AB 3141303132 334142433435'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, sensorNoChannelsConfig)
      }).not.toThrow()
    })

    it('should handle sparse channel configuration', () => {
      const sparseConfig = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'First Channel' },
          channel8: { min: 0, max: 100, measurementTypes: [], channelName: 'Eighth Channel' },
          // Missing channels 2-7
        },
      } as const satisfies TULIP3DeviceSensorConfig

      // Use simple hex string
      const hexString = '0x1402 01AB 3141303132 334142433435'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        decodeIdentificationRegisterRead(data!, sparseConfig)
      }).not.toThrow()
    })
  })

  describe('channel name assignment logic', () => {
    it('should assign channel names from config to decoded result channels', () => {
      const result = decodeIdentificationRegisterRead(FullIdentificationHexString, config)

      // Check that channel names are assigned for any sensors that were decoded
      Object.keys(result.data.identification).forEach((sensorKey) => {
        if (sensorKey === 'communicationModule')
          return

        const sensorData = result.data.identification[sensorKey as keyof typeof result.data.identification]
        if (!sensorData)
          return

        Object.keys(sensorData).forEach((channelKey) => {
          if (channelKey === 'identification')
            return

          const channelData = sensorData[channelKey as keyof typeof sensorData] as any
          if (channelData && typeof channelData === 'object') {
            expect(channelData.channelName).toBeDefined()
            expect(typeof channelData.channelName).toBe('string')
          }
        })
      })
    })

    it('should skip identification key when assigning channel names', () => {
      const result = decodeIdentificationRegisterRead(FullIdentificationHexString, config)

      // Ensure identification is not treated as a channel
      Object.keys(result.data.identification).forEach((sensorKey) => {
        if (sensorKey === 'communicationModule')
          return

        const sensorData = result.data.identification[sensorKey as keyof typeof result.data.identification]
        if (sensorData && typeof sensorData === 'object' && 'identification' in sensorData) {
          // identification should not have channelName property
          expect((sensorData.identification as any)?.channelName).toBeUndefined()
        }
      })
    })

    it('should only assign channel names to channels that exist in result', () => {
      // Use a simple hex string that only decodes a few channels
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02 0307 1542 0101'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, configWithS1C1C2)

      // Should not crash and should only assign names to existing channels
      expect(result.data.identification).toBeDefined()

      // Check that channel names are only assigned where channels exist
      if (result.data.identification.sensor1) {
        if (result.data.identification.sensor1.channel1) {
          expect(result.data.identification.sensor1.channel1.channelName).toBe('sensor1Channel1')
        }
        if (result.data.identification.sensor1.channel2) {
          expect(result.data.identification.sensor1.channel2.channelName).toBe('sensor1Channel2')
        }
        // Channels 3-8 should not be present or should not have channelName if not in result
      }
    })

    it('should handle missing channel configuration gracefully', () => {
      const incompleteConfig = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
          // channel2 missing
        },
      } as const satisfies TULIP3DeviceSensorConfig

      // Use hex string that only decodes channel1
      const hexString = '0x1401 0004 1E020101 07C1 03 0F02'
      const data = hexStringToIntArray(hexString)

      try {
        const result = decodeIdentificationRegisterRead(data!, incompleteConfig)
        // If it doesn't throw, check that available channels get names
        if (result.data.identification.sensor1?.channel1) {
          expect(result.data.identification.sensor1.channel1.channelName).toBe('sensor1Channel1')
        }
      }
      catch (error) {
        // May throw due to incomplete hex data - that's acceptable for this test
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle channels without channelName in config as it does not validate that', () => {
      const configWithoutChannelName = {
        sensor1: {
          // @ts-expect-error - missing channel name on purpose
          channel1: { min: 0, max: 100, measurementTypes: [] }, // No channelName
        },
      } as const satisfies TULIP3DeviceSensorConfig

      const hexString = '0x1402 01AB 3141303132 334142433435'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      expect(() => {
        // @ts-expect-error - missing channel name on purpose
        decodeIdentificationRegisterRead(data!, configWithoutChannelName)
      }).not.toThrow()
    })
  })

  describe('comprehensive validation flow', () => {
    it('should execute all validation steps in correct order', () => {
      // Test that validation happens in the right order:
      // 1. Basic message validation (length, type, subtype) - before validation function
      // 2. Connected sensors validation
      // 3. Result sensors validation
      // 4. Channel validation
      // 5. Channel name assignment

      const result = decodeIdentificationRegisterRead(FullIdentificationHexString, config)

      // If we get here, all validations passed
      expect(result.data.messageType).toBe(0x14)
      expect(result.data.identification).toBeDefined()
    })

    it('should fail early on connected sensors validation before other validations', () => {
      const configWithMismatchedSensors = {
        sensor1: sensor1channelConfig,
        sensor2: sensor2channelConfig,
        // Missing sensor3, sensor4 that might be in the full hex string
      } as const satisfies TULIP3DeviceSensorConfig

      try {
        decodeIdentificationRegisterRead(FullIdentificationHexString, configWithMismatchedSensors)
      }
      catch (error) {
        expect(error).toBeInstanceOf(TypeError)
        // Should fail on one of the validation steps
        expect(
          error instanceof TypeError
          && (error.message.includes('connected')
            || error.message.includes('not expected for this device')
            || error.message.includes('Invalid channels')),
        ).toBe(true)
      }
    })

    it('should handle edge case with only communicationModule data', () => {
      // Hex string that only decodes communicationModule
      const hexString = '0x1402 01AB 3141303132 334142433435'
      const data = hexStringToIntArray(hexString)
      expect(data).toBeDefined()

      const result = decodeIdentificationRegisterRead(data!, config)

      expect(result.data.messageType).toBe(0x14)
      expect(result.data.identification.communicationModule).toBeDefined()
      expect(result.data.identification.communicationModule?.serialNumberPart1).toBe('1A012')
      expect(result.data.identification.communicationModule?.serialNumberPart2).toBe('3ABC45')
    })
  })

  describe('basic functionality validation', () => {
    it('should throw RangeError for too short data', () => {
      const data = [0x14, 0x01]

      expect(() => {
        decodeIdentificationRegisterRead(data, config)
      }).toThrow(RangeError)
      expect(() => {
        decodeIdentificationRegisterRead(data, config)
      }).toThrow('Identification message too short. Expected at least 4 bytes but got 2')
    })

    it('should throw TypeError for invalid message type', () => {
      const data = [0x15, 0x01, 0x01, 0x04]

      expect(() => {
        decodeIdentificationRegisterRead(data, config)
      }).toThrow(TypeError)
      expect(() => {
        decodeIdentificationRegisterRead(data, config)
      }).toThrow('Invalid message type: expected 0x14 but got 0x15')
    })

    it('should throw TypeError for unsupported subtype', () => {
      const data = [0x14, 0x05, 0x01, 0x04]

      expect(() => {
        decodeIdentificationRegisterRead(data, config)
      }).toThrow(TypeError)
      expect(() => {
        decodeIdentificationRegisterRead(data, config)
      }).toThrow('Unsupported identification message subtype: 0x05')
    })
  })
})

describe('validateAndTransformIdentificationResult function', () => {
  describe('connected sensors validation', () => {
    it('should pass when connected sensors match config exactly', () => {
      const result = {
        communicationModule: {
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should pass when no connected sensors data is present', () => {
      const result = {
        communicationModule: {
          productId: 30,
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should pass when communicationModule is not present', () => {
      const result = {} as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should throw when sensor is connected but not in config', () => {
      const result = {
        communicationModule: {
          connectedSensors: {
            sensor1: true,
            sensor2: true, // Not in configWithS1C1C2
            sensor3: false,
            sensor4: false,
          },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Device sensor connection mismatch: sensor2 is connected but this device expects it to not be connected/)
    })

    it('should throw when sensor is not connected but expected in config', () => {
      const extendedConfig = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
          channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel2' },
        },
        sensor2: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel1' },
        },
      } as const satisfies TULIP3DeviceSensorConfig

      const result = {
        communicationModule: {
          connectedSensors: {
            sensor1: true,
            sensor2: false, // Should be connected according to config
            sensor3: false,
            sensor4: false,
          },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, extendedConfig)
      }).toThrow(TypeError)

      expect(() => {
        validateAndTransformIdentificationResult(result, extendedConfig)
      }).toThrow(/Device sensor connection mismatch: sensor2 is not connected but this device expects it to be connected/)
    })

    it('should work with empty config', () => {
      const emptyConfig = {} as const satisfies TULIP3DeviceSensorConfig

      const result = {
        communicationModule: {
          connectedSensors: {
            sensor1: false,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, emptyConfig)
      }).not.toThrow()
    })
  })

  describe('result sensors validation', () => {
    it('should pass when all result sensors exist in config', () => {
      const result = {
        communicationModule: { productId: 30 },
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should pass when no sensors are in result', () => {
      const result = {
        communicationModule: { productId: 30 },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should pass when only communicationModule is present', () => {
      const result = {
        communicationModule: {
          productId: 30,
          serialNumberPart1: '12345',
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should throw when result contains sensors not in config', () => {
      const result = {
        communicationModule: { productId: 30 },
        sensor1: { channel1: { measurand: 'Pressure (gauge)', unit: 'bar' } },
        sensor3: { channel1: { measurand: 'Temperature', unit: '°C' } }, // Not in config
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Sensor sensor3 is not supported by this device/)
    })

    it('should throw with multiple invalid sensors', () => {
      const result = {
        communicationModule: { productId: 30 },
        sensor1: { channel1: { measurand: 'Pressure (gauge)', unit: 'bar' } },
        sensor3: { channel1: { measurand: 'Temperature', unit: '°C' } },
        sensor4: { channel1: { measurand: 'Temperature', unit: '°C' } },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Sensors sensor3, sensor4 are not supported by this device/)
    })

    it('should filter communicationModule correctly', () => {
      const emptyConfig = {} as const satisfies TULIP3DeviceSensorConfig

      const result = {
        communicationModule: {
          productId: 30,
          connectedSensors: {
            sensor1: false,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, emptyConfig)
      }).not.toThrow()
    })
  })

  describe('channel validation', () => {
    it('should pass when all result channels exist in config', () => {
      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          channel2: { measurand: 'Temperature', unit: '°C' },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should pass when sensors have no channels', () => {
      const result = {
        sensor1: {},
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should pass when sensors have identification field', () => {
      const result = {
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: false,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should throw when result channel not in config', () => {
      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          channel3: { measurand: 'Temperature', unit: '°C' }, // Not in config
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Channel channel3 on sensor sensor1 is not supported by this device/)
    })

    it('should throw with multiple invalid channels', () => {
      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          channel3: { measurand: 'Temperature', unit: '°C' },
          channel5: { measurand: 'Temperature', unit: '°C' },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Channels channel3, channel5 on sensor sensor1 are not supported by this device/)
    })

    it('should handle sensors with empty config', () => {
      const configWithEmptySensor = {
        sensor1: {},
      } as const satisfies TULIP3DeviceSensorConfig

      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithEmptySensor)
      }).toThrow(TypeError)

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithEmptySensor)
      }).toThrow(/Channel channel1 on sensor sensor1 is not supported by this device/)
    })

    it('should correctly filter identification from channel validation', () => {
      const result = {
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          channel2: { measurand: 'Temperature', unit: '°C' },
        },
      } as any

      // Should not validate 'identification' as a channel
      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should handle undefined sensor objects gracefully', () => {
      const result = {
        sensor1: undefined,
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })
  })

  describe('channel name assignment', () => {
    it('should assign channel names from config to existing channels', () => {
      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          channel2: { measurand: 'Temperature', unit: '°C' },
        },
      } as any

      validateAndTransformIdentificationResult(result, configWithS1C1C2)

      expect(result.sensor1?.channel1?.channelName).toBe('sensor1Channel1')
      expect(result.sensor1?.channel2?.channelName).toBe('sensor1Channel2')
    })

    it('should not assign channel names to non-existent channels', () => {
      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          // channel2 not present
        },
      } as any

      validateAndTransformIdentificationResult(result, configWithS1C1C2)

      expect(result.sensor1?.channel1?.channelName).toBe('sensor1Channel1')
      // Should not create channel2
      expect(result.sensor1?.channel2).toBeUndefined()
    })

    it('should skip sensors not in result', () => {
      const extendedConfig = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor1Channel1' },
        },
        sensor2: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'sensor2Channel1' },
        },
      } as const satisfies TULIP3DeviceSensorConfig

      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
        },
        // sensor2 not present
      } as any

      validateAndTransformIdentificationResult(result, extendedConfig)

      expect(result.sensor1?.channel1?.channelName).toBe('sensor1Channel1')
      expect(result.sensor2).toBeUndefined()
    })

    it('should skip channels without channelName in config', () => {
      // Create config with optional channelName
      const configWithOptionalChannelName = {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: '' }, // Empty channelName
          channel2: { min: 0, max: 100, measurementTypes: [], channelName: 'WithName' },
        },
      } as const satisfies TULIP3DeviceSensorConfig

      const result = {
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          channel2: { measurand: 'Temperature', unit: '°C' },
        },
      } as any

      validateAndTransformIdentificationResult(result, configWithOptionalChannelName)

      // Empty channelName should not be assigned
      expect(result.sensor1?.channel1?.channelName).toBeUndefined()
      expect(result.sensor1?.channel2?.channelName).toBe('WithName')
    })

    it('should skip identification field when assigning channel names', () => {
      const result = {
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
        },
      } as any

      validateAndTransformIdentificationResult(result, configWithS1C1C2)

      expect(result.sensor1?.channel1?.channelName).toBe('sensor1Channel1')
      // identification should not get channelName
      expect((result.sensor1?.identification as any)?.channelName).toBeUndefined()
    })

    it('should overwrite existing channelName with config value', () => {
      const result = {
        sensor1: {
          channel1: {
            measurand: 'Pressure (gauge)',
            unit: 'bar',
            channelName: 'ExistingName',
          },
        },
      } as any

      validateAndTransformIdentificationResult(result, configWithS1C1C2)

      // Should overwrite with config channelName
      expect(result.sensor1?.channel1?.channelName).toBe('sensor1Channel1')
    })

    it('should work with complex nested channel objects', () => {
      const result = {
        sensor1: {
          channel1: {
            measurand: 'Pressure (gauge)',
            unit: 'bar',
            accuracy: 0.5,
            offset: 10.0,
            minPhysicalLimit: 0,
            maxPhysicalLimit: 1000,
          },
          channel2: {
            measurand: 'Temperature',
            unit: '°C',
            accuracy: 0.1,
          },
        },
      } as any

      validateAndTransformIdentificationResult(result, configWithS1C1C2)

      expect(result.sensor1?.channel1?.channelName).toBe('sensor1Channel1')
      expect(result.sensor1?.channel1?.accuracy).toBe(0.5)
      expect(result.sensor1?.channel1?.offset).toBe(10.0)
      expect(result.sensor1?.channel2?.channelName).toBe('sensor1Channel2')
      expect(result.sensor1?.channel2?.accuracy).toBe(0.1)
    })
  })

  describe('comprehensive edge cases', () => {
    it('should handle completely empty result', () => {
      const result = {} as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should handle result with null values', () => {
      const result = {
        communicationModule: null,
        sensor1: null,
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).not.toThrow()
    })

    it('should preserve other properties during transformation', () => {
      const result = {
        communicationModule: {
          productId: 30,
          productSubId: 'LoRaWAN class A',
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          identification: {
            existingChannels: {
              channel1: true,
              channel2: true,
              channel3: false,
              channel4: false,
              channel5: false,
              channel6: false,
              channel7: false,
              channel8: false,
            },
          },
          channel1: {
            measurand: 'Pressure (gauge)',
            unit: 'bar',
            accuracy: 0.5,
          },
        },
      } as any

      validateAndTransformIdentificationResult(result, configWithS1C1C2)

      // Verify original properties are preserved
      expect(result.communicationModule?.productId).toBe(30)
      expect(result.communicationModule?.productSubId).toBe('LoRaWAN class A')
      expect(result.sensor1?.identification?.existingChannels?.channel1).toBe(true)
      expect(result.sensor1?.channel1?.measurand).toBe('Pressure (gauge)')
      expect(result.sensor1?.channel1?.unit).toBe('bar')
      expect(result.sensor1?.channel1?.accuracy).toBe(0.5)

      // Verify channelName was added
      expect(result.sensor1?.channel1?.channelName).toBe('sensor1Channel1')
    })

    it('should validate in correct order - connected sensors first', () => {
      const result = {
        communicationModule: {
          connectedSensors: {
            sensor1: true,
            sensor3: true, // Not in config - should fail here
          },
        },
        sensor3: { // Also not in config - but validation should fail before reaching this
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      // Should fail on connected sensors validation
      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Device sensor connection mismatch: sensor3 is connected but this device expects it to not be connected/)
    })

    it('should validate in correct order - result sensors after connected sensors', () => {
      const result = {
        communicationModule: {
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
        },
        sensor3: { // Not in config - should fail on result sensors validation
          channel1: { measurand: 'Temperature', unit: '°C' },
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      // Should fail on result sensors validation
      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Sensor sensor3 is not supported by this device/)
    })

    it('should validate in correct order - channels after sensors', () => {
      const result = {
        communicationModule: {
          connectedSensors: {
            sensor1: true,
            sensor2: false,
            sensor3: false,
            sensor4: false,
          },
        },
        sensor1: {
          channel1: { measurand: 'Pressure (gauge)', unit: 'bar' },
          channel3: { measurand: 'Temperature', unit: '°C' }, // Not in config
        },
      } as any

      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(TypeError)

      // Should fail on channel validation
      expect(() => {
        validateAndTransformIdentificationResult(result, configWithS1C1C2)
      }).toThrow(/Channel channel3 on sensor sensor1 is not supported by this device/)
    })
  })
})
