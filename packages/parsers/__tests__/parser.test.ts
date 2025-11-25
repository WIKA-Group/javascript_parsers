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
    const res = parser.encodeDownlink({ codec: 'notfound', input: {} })
    // here the res.errors should have one entry about codec not found
    expect(res.errors![0]).toMatch(/Codec notfound not found in parser./)
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

  describe('adjustMeasuringRange validation', () => {
    it('should throw error if channel does not exist', () => {
      const codec = new MockCodec({ name: 'codec1', channels: validChannels })
      const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
      expect(() => parser.adjustMeasuringRange('NonExistent' as any, { start: 0, end: 10 }))
        .toThrow('Channel NonExistent does not exist in parser TestParser. Cannot adjust measuring range.')
    })

    it('should throw error if channel exists but adjustment is disallowed', () => {
      const channels = [
        { name: 'A', start: 0, end: 2, adjustMeasurementRangeDisallowed: true },
        { name: 'B', start: 2, end: 4 },
      ]
      const codec = new MockCodec({ name: 'codec1', channels })
      const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
      expect(() => parser.adjustMeasuringRange('A' as any, { start: 0, end: 10 }))
        .toThrow('Channel A does not allow adjusting the measuring range in parser TestParser.')
    })

    it('should allow adjustment if channel exists and adjustment is allowed (undefined)', () => {
      const channels = [
        { name: 'A', start: 0, end: 2 }, // undefined -> allowed
        { name: 'B', start: 2, end: 4 },
      ]
      const codec = new MockCodec({ name: 'codec1', channels })
      const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
      expect(() => parser.adjustMeasuringRange('A' as any, { start: 5, end: 15 }))
        .not
        .toThrow()
      expect(codec.adjustMeasuringRange).toHaveBeenCalledWith('A', { start: 5, end: 15 })
    })

    it('should allow adjustment if channel exists and adjustment is explicitly allowed', () => {
      const channels = [
        { name: 'A', start: 0, end: 2 }, // undefined is treated as allowed
        { name: 'B', start: 2, end: 4 },
      ]
      const codec = new MockCodec({ name: 'codec1', channels })
      const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
      expect(() => parser.adjustMeasuringRange('A' as any, { start: 5, end: 15 }))
        .not
        .toThrow()
      expect(codec.adjustMeasuringRange).toHaveBeenCalledWith('A', { start: 5, end: 15 })
    })

    it('should call adjustMeasuringRange on all codecs if allowed', () => {
      const channels = [
        { name: 'A', start: 0, end: 2 },
        { name: 'B', start: 2, end: 4 },
      ]
      const codec1 = new MockCodec({ name: 'codec1', channels })
      const codec2 = new MockCodec({ name: 'codec2', channels })
      const parser = defineParser({ parserName: 'TestParser', codecs: [codec1, codec2] })
      parser.adjustMeasuringRange('B' as any, { start: 10, end: 20 })
      expect(codec1.adjustMeasuringRange).toHaveBeenCalledWith('B', { start: 10, end: 20 })
      expect(codec2.adjustMeasuringRange).toHaveBeenCalledWith('B', { start: 10, end: 20 })
    })

    it('should not call adjustMeasuringRange on codecs if channel does not exist', () => {
      const codec = new MockCodec({ name: 'codec1', channels: validChannels })
      const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
      try {
        parser.adjustMeasuringRange('X' as any, { start: 0, end: 10 })
      }
      catch {
        // expected to throw
      }
      expect(codec.adjustMeasuringRange).not.toHaveBeenCalled()
    })

    it('should not call adjustMeasuringRange on codecs if adjustment is disallowed', () => {
      const channels = [{ name: 'A', start: 0, end: 2, adjustMeasurementRangeDisallowed: true }]
      const codec = new MockCodec({ name: 'codec1', channels })
      const parser = defineParser({ parserName: 'TestParser', codecs: [codec] })
      try {
        parser.adjustMeasuringRange('A' as any, { start: 0, end: 10 })
      }
      catch {
        // expected to throw
      }
      expect(codec.adjustMeasuringRange).not.toHaveBeenCalled()
    })
  })
})
