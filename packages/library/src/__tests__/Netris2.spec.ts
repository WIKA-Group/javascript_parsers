import type { NETRIS2DownlinkInput } from '../wrappers/NETRIS2'
import { describe, expect, it } from 'vitest'
import { NETRIS2Parser } from '../wrappers/NETRIS2'

describe('nETRIS2 Parser', () => {
  const parser = NETRIS2Parser()

  it('should encode resetToFactory action', () => {
    const input: NETRIS2DownlinkInput = { deviceAction: 'resetToFactory' }
    const result = parser.encodeDownlink(input)
    expect(result).toEqual([[0x00, 0x01]])
  })

  it('should encode resetBatteryIndicator action', () => {
    const input: NETRIS2DownlinkInput = { deviceAction: 'resetBatteryIndicator' }
    const result = parser.encodeDownlink(input)
    expect(result).toEqual([[
      0x01,
      0x05,
    ]])
  })

  it('should encode downlinkConfiguration with enabled channels', () => {
    const input: NETRIS2DownlinkInput = {
      deviceAction: 'downlinkConfiguration',
      configurationId: 0x06,
      configuration: {
        channel0: true,
        channel1: true,
      },
    }
    const result = parser.encodeDownlink(input)
    expect(result).toEqual([[
      0x06,
      0x20,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x20,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
    ]])
  })

  it('should encode downlinkConfiguration with disabled channels', () => {
    const input: NETRIS2DownlinkInput = {
      deviceAction: 'downlinkConfiguration',
      configuration: {
        channel1: false,
      },
    }
    const result = parser.encodeDownlink(input)
    expect(result).toEqual([[
      0x01,
      0x11,
      0x02,
    ]])
  })

  it('should encode downlinkConfiguration with configured channels', () => {
    const input: NETRIS2DownlinkInput = {
      deviceAction: 'downlinkConfiguration',
      configuration: {
        channel0: {
          deadBand: 20,
          measureOffset: 2,
          startUpTime: 10,
          alarms: {},
        },
        channel1: {

          deadBand: 15,
          alarms: {
            fallingSlope: 20,
            highThreshold: 1,
            lowThresholdWithDelay: {
              delay: 20,
              value: 50,
            },
            lowThreshold: 10,
            risingSlope: 22,
            highThresholdWithDelay: {
              delay: 20,
              value: 40,
            },
          },
        },

      },
    }
    const result = parser.encodeDownlink(input)
    expect(result).toEqual([[1, 32, 0, 0, 7, 208, 0, 32, 0, 1, 5, 220, 252, 13, 172, 10, 40, 7, 208, 8, 152, 29, 76, 0, 20, 25, 100, 0, 20, 48, 1, 0, 200, 96, 1, 0, 100]])
  })

  it('should throw an error for unknown device action', () => {
    const input: NETRIS2DownlinkInput = { deviceAction: 'unknownAction' as any }
    expect(() => parser.encodeDownlink(input)).toThrow('Unknown device action: unknownAction')
  })

  it('should split the downlink frames into multiple frames, increment and roll over the configurationId if multiple frames are present', () => {
    const input: NETRIS2DownlinkInput = {
      configurationId: 31,
      deviceAction: 'downlinkConfiguration',
      configuration: {
        mainConfiguration: {
          measuringRateWhenAlarm: 600,
          publicationFactorWhenAlarm: 12,
          measuringRateWhenNoAlarm: 3600,
          publicationFactorWhenNoAlarm: 2,
        },
        channel0: {
          measureOffset: 1,
          startUpTime: 3,
          deadBand: 15,
          alarms: {
            fallingSlope: 20,
            highThreshold: 1,
            lowThresholdWithDelay: {
              delay: 20,
              value: 50,
            },
            lowThreshold: 10,
            risingSlope: 22,
            highThresholdWithDelay: {
              delay: 20,
              value: 40,
            },
          },
        },
        channel1: {
          deadBand: 15,
          measureOffset: 0,
          startUpTime: 13.2,
          alarms: {
            fallingSlope: 20,
            highThreshold: 1,
            lowThresholdWithDelay: {
              delay: 20,
              value: 50,
            },
            lowThreshold: 10,
            risingSlope: 22,
            highThresholdWithDelay: {
              delay: 20,
              value: 40,
            },
          },
        },

      },
    }
    const result = parser.encodeDownlink(input)
    expect(result.length).toEqual(2)
    const mainConfigBytes = 13
    const disabledChannelBytes = 0 // here because none are disabled
    const configurationBytesChannel0 = 22
    const configurationBytesChannel1 = 22
    const offsetBytes = 6
    const startUpBytes = 6

    // add 2 as there will be 2 frames
    const configurationIds = 2

    const fullLength = mainConfigBytes + disabledChannelBytes + configurationBytesChannel0 + configurationBytesChannel1 + offsetBytes + startUpBytes + configurationIds

    expect(result[0]!.length + result[1]!.length).toEqual(fullLength)
    expect(result[0]![0]).toEqual(31)
    expect(result[1]![0]).toEqual(1)
  })
})
