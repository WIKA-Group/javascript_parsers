import { beforeEach, describe, expect, it } from 'vitest'
import { defineTULIP3Codec } from '../../../src/codecs/tulip3/codec'
import { defineTULIP3DeviceProfile } from '../../../src/codecs/tulip3/profile'

const deviceProfile = defineTULIP3DeviceProfile({
  deviceName: 'TestDevice',
  roundingDecimals: 2,
  sensorChannelConfig: {
    sensor1: {
      channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'ch1' },
      channel2: { min: 10, max: 200, measurementTypes: [], channelName: 'ch2' },
    },
    sensor2: {
      channel1: { min: -50, max: 50, measurementTypes: [], channelName: 'ch3' },
    },
  },
  deviceAlarmConfig: {
    communicationModuleAlarms: { comms: 1 },
    sensorAlarms: { sensor: 2 },
    sensorChannelAlarms: { channel: 4 },
  },
  configurationMessageMaxRegisterSize: 16,
})

describe('defineTULIP3Codec (non-decode methods)', () => {
  let codec: ReturnType<typeof defineTULIP3Codec<typeof deviceProfile>>

  beforeEach(() => {
    codec = defineTULIP3Codec(deviceProfile)
  })

  it('should have the correct name', () => {
    expect(codec.name).toBe('TestDeviceTULIP3Codec')
  })

  it('canTryDecode returns true for valid prefix', () => {
    for (let prefix = 0x10; prefix <= 0x17; ++prefix) {
      expect(codec.canTryDecode({ bytes: [prefix, 0x00] })).toBe(true)
    }
  })

  it('canTryDecode returns false for invalid prefix', () => {
    expect(codec.canTryDecode({ bytes: [0x09] })).toBe(false)
    expect(codec.canTryDecode({ bytes: [] })).toBe(false)
  })

  it('getChannels returns all channels with correct info', () => {
    const channels = codec.getChannels()
    expect(channels).toEqual([
      { name: 'ch1', start: 0, end: 100 },
      { name: 'ch2', start: 10, end: 200 },
      { name: 'ch3', start: -50, end: 50 },
    ])
  })

  it('adjustMeasuringRange updates the correct channel', () => {
    codec.adjustMeasuringRange('ch2', { start: 20, end: 300 })
    const channels = codec.getChannels()
    expect(channels.find(c => c.name === 'ch2')).toMatchObject({ start: 20, end: 300 })
  })

  it('adjustRoundingDecimals updates roundingDecimals', () => {
    // This is an internal effect, but we can check that getChannels etc still work
    codec.adjustRoundingDecimals(5)
    expect(codec.getChannels().length).toBe(3)
  })
})

describe('defineTULIP3Codec (validations)', () => {
  it('throws when channel ranges are invalid (start >= end)', () => {
    const badProfile = defineTULIP3DeviceProfile({
      deviceName: 'BadDevice',
      roundingDecimals: 2,
      sensorChannelConfig: {
        sensor1: {
          channel1: { min: 10, max: 10, measurementTypes: [], channelName: 'bch1' },
        },
      },
      deviceAlarmConfig: {
        communicationModuleAlarms: { comms: 1 },
        sensorAlarms: { sensor: 2 },
        sensorChannelAlarms: { channel: 4 },
      },
      configurationMessageMaxRegisterSize: 16,
    })

    expect(() => defineTULIP3Codec(badProfile)).toThrow(/Invalid channel range/)
  })

  it('throws when duplicate channel names are present', () => {
    const badProfile = defineTULIP3DeviceProfile({
      deviceName: 'BadDevice2',
      roundingDecimals: 2,
      sensorChannelConfig: {
        sensor1: {
          channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'dup' },
        },
        sensor2: {
          channel1: { min: 0, max: 50, measurementTypes: [], channelName: 'dup' },
        },
      },
      deviceAlarmConfig: {
        communicationModuleAlarms: { comms: 1 },
        sensorAlarms: { sensor: 2 },
        sensorChannelAlarms: { channel: 4 },
      },
      configurationMessageMaxRegisterSize: 16,
    })

    expect(() => defineTULIP3Codec(badProfile)).toThrow(/Duplicate channel name/)
  })

  it('allows adjustMeasuringRange to set ranges (no re-validation at runtime)', () => {
    const goodProfile = defineTULIP3DeviceProfile({
      deviceName: 'GoodDevice',
      roundingDecimals: 2,
      sensorChannelConfig: {
        sensor1: { channel1: { min: 0, max: 100, measurementTypes: [], channelName: 'chA' } },
      },
      deviceAlarmConfig: {
        communicationModuleAlarms: { comms: 1 },
        sensorAlarms: { sensor: 2 },
        sensorChannelAlarms: { channel: 4 },
      },
      configurationMessageMaxRegisterSize: 16,
    })

    const codec = defineTULIP3Codec(goodProfile)
    // set an invalid range via adjustMeasuringRange; codec does not re-run validations here
    codec.adjustMeasuringRange('chA', { start: 200, end: 100 })
    const ch = codec.getChannels().find(c => c.name === 'chA')
    expect(ch).toMatchObject({ start: 200, end: 100 })
  })
})
