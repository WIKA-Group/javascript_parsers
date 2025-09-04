import { describe, expect, it, vi } from 'vitest'
import { defineParser } from '../src/parser'

// MockCodec for parser tests
class MockCodec {
  name: string
  private _channels: any[]
  private _decodeResult: any
  private _encodeResult: any
  private _canTryDecode: ((input: any) => boolean) | boolean
  public adjustMeasuringRange = vi.fn()
  public adjustRoundingDecimals = vi.fn()
  constructor({
    name,
    channels,
    decodeResult,
    encodeResult,
    canTryDecode = true,
  }: {
    name: string
    channels: any[]
    decodeResult?: any
    encodeResult?: any
    canTryDecode?: ((input: any) => boolean) | boolean
  }) {
    this.name = name
    this._channels = channels
    this._decodeResult = decodeResult ?? { data: name }
    this._encodeResult = encodeResult ?? [1, 2, 3]
    this._canTryDecode = canTryDecode
  }

  getChannels() {
    return this._channels
  }

  canTryDecode(input: any) {
    if (typeof this._canTryDecode === 'function')
      return this._canTryDecode(input)
    return this._canTryDecode
  }

  decode(_input: any) {
    return this._decodeResult
  }

  encode(_input: any) {
    return this._encodeResult
  }
}

describe('defineParser', () => {
  const validChannels = [
    { name: 'A', start: 0, end: 2 },
    { name: 'B', start: 2, end: 4 },
  ]

  it('should create a parser and decodeUplink with a matching codec', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    const result = parser.decodeUplink({ bytes: [1, 2], fPort: 1 })
    expect(result).toEqual({ data: 'codec1' })
  })

  it('should throw error if no codec matches in decodeUplink', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels, canTryDecode: false })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    const result = parser.decodeUplink({ bytes: [1, 2], fPort: 1 })
    expect(result.errors![0]).toMatch(/No codec matched/)
  })

  it('should throw error if multiple codecs match and throwOnMultipleDecode is true', () => {
    const codec1 = new MockCodec({ name: 'codec1', channels: validChannels, canTryDecode: () => true })
    const codec2 = new MockCodec({ name: 'codec2', channels: validChannels, canTryDecode: () => true })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec1, codec2], throwOnMultipleDecode: true })
    const result = parser.decodeUplink({ bytes: [1, 2], fPort: 1 })
    expect(result.errors![0]).toMatch(/Multiple codecs matched/)
  })

  it('should return first matching codec if throwOnMultipleDecode is false', () => {
    const codec1 = new MockCodec({ name: 'codec1', channels: validChannels, decodeResult: { data: 'first' }, canTryDecode: () => true })
    const codec2 = new MockCodec({ name: 'codec2', channels: validChannels, decodeResult: { data: 'second' }, canTryDecode: () => true })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec1, codec2], throwOnMultipleDecode: false })
    const result = parser.decodeUplink({ bytes: [1, 2], fPort: 1 })
    expect(result).toEqual({ data: 'first' })
  })

  it('should return error for invalid input in decodeUplink', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    // missing bytes
    const result = parser.decodeUplink({ fPort: 1 } as any)
    expect(result.errors![0]).toMatch(/Input is not a valid/)
  })

  it('should decodeHexUplink and call decodeUplink', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    // bytes: '0102' => [1,2]
    const result = parser.decodeHexUplink({ bytes: '0102', fPort: 1 })
    expect(result).toEqual({ data: 'codec1' })
  })

  it('should return error for invalid hex string in decodeHexUplink', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    const result = parser.decodeHexUplink({ bytes: 'ZZZZ', fPort: 1 })
    expect(result.errors![0]).toMatch(/not a valid hexadecimal/)
  })

  it('should encodeDownlink with correct codec', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels, encodeResult: [9, 8, 7] })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    const result = parser.encodeDownlink({ codec: 'codec1', input: { foo: 1 } })
    expect(result).toEqual([9, 8, 7])
  })

  it('should throw error if encodeDownlink codec not found', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    expect(() => parser.encodeDownlink({ codec: 'notfound', input: {} })).toThrow(/not found/)
  })

  it('should call adjustMeasuringRange on all codecs', () => {
    const codec1 = new MockCodec({ name: 'codec1', channels: validChannels })
    const codec2 = new MockCodec({ name: 'codec2', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec1, codec2] })
    parser.adjustMeasuringRange('A', { start: 10, end: 20 })
    expect(codec1.adjustMeasuringRange).toHaveBeenCalledWith('A', { start: 10, end: 20 })
    expect(codec2.adjustMeasuringRange).toHaveBeenCalledWith('A', { start: 10, end: 20 })
  })

  it('should call adjustRoundingDecimals on all codecs', () => {
    const codec1 = new MockCodec({ name: 'codec1', channels: validChannels })
    const codec2 = new MockCodec({ name: 'codec2', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec1, codec2] })
    parser.adjustRoundingDecimals(3)
    expect(codec1.adjustRoundingDecimals).toHaveBeenCalled()
    expect(codec2.adjustRoundingDecimals).toHaveBeenCalled()
  })

  it('should handle roundingDecimals option', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec], roundingDecimals: 2 })
    parser.adjustRoundingDecimals(5)
    expect(codec.adjustRoundingDecimals).toHaveBeenCalledWith(expect.any(Number))
  })

  it('should propagate decode errors from codec', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels, canTryDecode: true })
    codec.decode = () => {
      throw new Error('fail!')
    }
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    const result = parser.decodeUplink({ bytes: [1, 2], fPort: 1 })
    expect(result.errors![0]).toMatch(/fail!/)
  })

  it('should propagate unknown errors in decodeUplink', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels, canTryDecode: true })
    codec.decode = () => {
      // eslint-disable-next-line no-throw-literal
      throw 123
    }
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    const result = parser.decodeUplink({ bytes: [1, 2], fPort: 1 })
    expect(result.errors![0]).toMatch(/Unknown error/)
  })

  it('should return error for invalid input object in decodeHexUplink (coverage for lines 125-126)', () => {
    const codec = new MockCodec({ name: 'codec1', channels: validChannels })
    const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
    // missing bytes property, so input is invalid for createHexUplinkInputSchema
    const result = parser.decodeHexUplink({ fPort: 1 } as any)
    expect(result.errors![0]).toMatch(/Input is not a valid/)
  })
})
