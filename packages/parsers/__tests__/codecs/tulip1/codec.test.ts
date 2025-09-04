import { describe, expect, it } from 'vitest'
import { defineTULIP1Codec } from '../../../src/codecs/tulip1'

describe('defineTULIP1Codec (non-decode methods)', () => {
  const handlers: any = {}
  for (let i = 0x00; i <= 0x09; ++i) {
    // handlers return a shape including the rounding value so tests can assert it changed
    handlers[i] = ((input: any, options: any) => ({ prefix: i, rounding: options.roundingDecimals })) as any
  }

  const channels = [
    { name: 'ch1', start: 0, end: 100, channelId: 0 },
    { name: 'ch2', start: 10, end: 200, channelId: 1 },
  ]

  const codec = defineTULIP1Codec({
    deviceName: 'TestDevice',
    channels,
    roundingDecimals: 2,
    handlers,
    encodeHandler: () => [0x00],
  })

  it('should have the correct name', () => {
    expect(codec.name).toBe('TestDeviceTULIP1')
  })

  it('canTryDecode returns true for valid prefixes', () => {
    for (let prefix = 0x00; prefix <= 0x09; ++prefix) {
      expect(codec.canTryDecode({ bytes: [prefix, 0x00] })).toBe(true)
    }
  })

  it('canTryDecode returns false for invalid prefix or empty bytes', () => {
    expect(codec.canTryDecode({ bytes: [0x0A] })).toBe(false)
    expect(codec.canTryDecode({ bytes: [] })).toBe(false)
  })

  it('getChannels returns all channels with correct info', () => {
    const channels = codec.getChannels()
    expect(channels).toEqual([
      { name: 'ch1', start: 0, end: 100 },
      { name: 'ch2', start: 10, end: 200 },
    ])
  })

  it('adjustMeasuringRange updates the correct channel', () => {
    codec.adjustMeasuringRange('ch2', { start: 20, end: 300 })
    const channels = codec.getChannels()
    expect(channels.find((c: any) => c.name === 'ch2')).toMatchObject({ start: 20, end: 300 })
  })

  it('adjustRoundingDecimals updates rounding passed to handlers', () => {
    // call decode to read current roundingDecimals
    expect((codec.decode as any)({ bytes: [0x00] })).toMatchObject({ rounding: 2 })
    codec.adjustRoundingDecimals(5)
    expect((codec.decode as any)({ bytes: [0x00] })).toMatchObject({ rounding: 5 })
  })

  it('encode is the encode handler provided', () => {
    const out = codec.encode()
    expect(out).toEqual([0x00])
  })
})

describe('defineTULIP1Codec (decoding + validations)', () => {
  it('decode throws when no handler for first byte', () => {
    const codec = defineTULIP1Codec({
      deviceName: 'D',
      channels: [{ name: 'c', start: 0, end: 1, channelId: 0 }],
      handlers: { 0x00: (() => ({})) as any },
      encodeHandler: () => [],
    })

    expect(() => (codec.decode as any)({ bytes: [0x01] })).toThrow(/No handler registered/)
  })

  it('throws when channel names are duplicated', () => {
    const options = () =>
      defineTULIP1Codec({
        deviceName: 'Dup',
        channels: [
          { name: 'dup', start: 0, end: 10, channelId: 0 },
          { name: 'dup', start: 0, end: 5, channelId: 1 },
        ],
        handlers: {},
        encodeHandler: () => [],
      })

    expect(options).toThrow(/Duplicate channel name found: dup/)
  })

  it('throws when channel ranges are invalid', () => {
    const options = () =>
      defineTULIP1Codec({
        deviceName: 'BadRange',
        channels: [{ name: 'bad', start: 10, end: 10, channelId: 0 }],
        handlers: {},
        encodeHandler: () => [],
      })

    expect(options).toThrow()
  })
})
