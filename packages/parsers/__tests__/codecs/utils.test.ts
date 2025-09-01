import type { Channel } from '../../src/types'
import { describe, expect, it } from 'vitest'
import { checkChannelsValidity, checkCodecsValidity } from '../../src/codecs/utils'

// Mock AnyCodec type
class MockCodec {
  name: string
  private channels: Channel[]
  constructor(name: string, channels: Channel[]) {
    this.name = name
    this.channels = channels
  }

  getChannels() {
    return this.channels
  }
}

describe('checkChannelsValidity', () => {
  it('should not throw for valid channels', () => {
    const channels: Channel[] = [
      { name: 'A', start: 0, end: 2 },
      { name: 'B', start: 2, end: 4 },
    ]
    expect(() => checkChannelsValidity(channels)).not.toThrow()
  })

  it('should throw if start >= end', () => {
    const channels: Channel[] = [
      { name: 'A', start: 2, end: 2 },
    ]
    expect(() => checkChannelsValidity(channels)).toThrow('Invalid channel range: 2 >= 2 in channel A')
  })

  it('should include codec name in error if provided', () => {
    const channels: Channel[] = [
      { name: 'B', start: 5, end: 3 },
    ]
    expect(() => checkChannelsValidity(channels, 'TestCodec')).toThrow('Invalid channel range in codec TestCodec: 5 >= 3 in channel B')
  })

  it('should throw for exact duplicate names', () => {
    expect(() => checkChannelsValidity([
      { name: 'A', start: 0, end: 1 },
      { name: 'A', start: 1, end: 2 },
    ])).toThrow(/Duplicate channel name/)
  })

  it('should not throw for names differing by case (case-sensitive)', () => {
    expect(() => checkChannelsValidity([
      { name: 'A', start: 0, end: 1 },
      { name: 'a', start: 1, end: 2 },
    ])).not.toThrow()
  })

  it('should throw for duplicate names with symbols', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo$', start: 0, end: 1 },
      { name: 'foo$', start: 1, end: 2 },
    ])).toThrow(/Duplicate channel name/)
  })

  it('should not throw for names with different symbols', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo$', start: 0, end: 1 },
      { name: 'foo#', start: 1, end: 2 },
    ])).not.toThrow()
  })

  it('should throw for duplicate names with spaces', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo bar', start: 0, end: 1 },
      { name: 'foo bar', start: 1, end: 2 },
    ])).toThrow(/Duplicate channel name/)
  })

  it('should not throw for names with different whitespace', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo bar', start: 0, end: 1 },
      { name: 'foo  bar', start: 1, end: 2 },
    ])).not.toThrow()
  })

  it('should throw for duplicate names with Unicode', () => {
    expect(() => checkChannelsValidity([
      { name: 'café', start: 0, end: 1 },
      { name: 'café', start: 1, end: 2 },
    ])).toThrow(/Duplicate channel name/)
  })

  it('should not throw for visually similar but different Unicode', () => {
    // e.g., 'cafe' (ASCII) vs 'café' (with accent)
    expect(() => checkChannelsValidity([
      { name: 'cafe', start: 0, end: 1 },
      { name: 'café', start: 1, end: 2 },
    ])).not.toThrow()
  })

  it('should throw for duplicate names with emoji', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo😀', start: 0, end: 1 },
      { name: 'foo😀', start: 1, end: 2 },
    ])).toThrow(/Duplicate channel name/)
  })

  it('should not throw for different emoji', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo😀', start: 0, end: 1 },
      { name: 'foo😁', start: 1, end: 2 },
    ])).not.toThrow()
  })

  it('should throw for duplicate names with leading/trailing whitespace', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo', start: 0, end: 1 },
      { name: 'foo ', start: 1, end: 2 },
      { name: 'foo', start: 2, end: 3 },
    ])).toThrow(/Duplicate channel name/)
  })

  it('should not throw for names that are substrings of each other', () => {
    expect(() => checkChannelsValidity([
      { name: 'foo', start: 0, end: 1 },
      { name: 'foobar', start: 1, end: 2 },
    ])).not.toThrow()
  })

  it('should throw for multiple duplicates in a larger set', () => {
    expect(() => checkChannelsValidity([
      { name: 'A', start: 0, end: 1 },
      { name: 'B', start: 1, end: 2 },
      { name: 'A', start: 2, end: 3 },
      { name: 'B', start: 3, end: 4 },
    ])).toThrow(/Duplicate channel name/)
  })
})

describe('checkCodecsValidity', () => {
  it('should throw if no codecs are provided', () => {
    expect(() => checkCodecsValidity([])).toThrow('At least one codec must be provided')
  })

  it('should not throw for valid codecs with same channel names and ranges', () => {
    const channels = [
      { name: 'A', start: 0, end: 2 },
      { name: 'B', start: 2, end: 4 },
    ]
    const codecs = [
      new MockCodec('codec1', channels),
      new MockCodec('codec2', channels),
    ]
    expect(() => checkCodecsValidity(codecs as any)).not.toThrow()
  })

  it('should throw if any codec has invalid channel range', () => {
    const valid = [{ name: 'A', start: 0, end: 2 }]
    const invalid = [{ name: 'A', start: 2, end: 1 }]
    const codecs = [
      new MockCodec('codec1', valid),
      new MockCodec('codec2', invalid),
    ]
    expect(() => checkCodecsValidity(codecs as any)).toThrow('Invalid channel range in codec codec2: 2 >= 1 in channel A')
  })

  it('should throw if codec names are not unique', () => {
    const channels = [{ name: 'A', start: 0, end: 2 }]
    const codecs = [
      new MockCodec('dup', channels),
      new MockCodec('dup', channels),
    ]
    expect(() => checkCodecsValidity(codecs as any)).toThrow('Codec names must be unique. Duplicate found: dup')
  })

  it('should throw if a codec has extra channels', () => {
    const base = [{ name: 'A', start: 0, end: 2 }]
    const extra = [{ name: 'A', start: 0, end: 2 }, { name: 'B', start: 2, end: 4 }]
    const codecs = [
      new MockCodec('codec1', base),
      new MockCodec('codec2', extra),
    ]
    expect(() => checkCodecsValidity(codecs as any)).toThrow('Codec codec2 has extra channels not present in other codecs: B')
  })

  it('should throw if a codec is missing channels', () => {
    const base = [{ name: 'A', start: 0, end: 2 }, { name: 'B', start: 2, end: 4 }]
    const missing = [{ name: 'A', start: 0, end: 2 }]
    const codecs = [
      new MockCodec('codec1', base),
      new MockCodec('codec2', missing),
    ]
    expect(() => checkCodecsValidity(codecs as any)).toThrow('Codec codec2 is missing channels present in other codecs: B')
  })

  it('should throw if channel ranges are inconsistent across codecs', () => {
    const ch1 = [{ name: 'A', start: 0, end: 2 }]
    const ch2 = [{ name: 'A', start: 1, end: 3 }]
    const codecs = [
      new MockCodec('codec1', ch1),
      new MockCodec('codec2', ch2),
    ]
    expect(() => checkCodecsValidity(codecs as any)).toThrow(/Channel A has inconsistent ranges across codecs/) // partial match
  })

  it('should not throw for multiple codecs with channels in different order', () => {
    const ch1 = [{ name: 'A', start: 0, end: 2 }, { name: 'B', start: 2, end: 4 }]
    const ch2 = [{ name: 'B', start: 2, end: 4 }, { name: 'A', start: 0, end: 2 }]
    const codecs = [
      new MockCodec('codec1', ch1),
      new MockCodec('codec2', ch2),
    ]
    expect(() => checkCodecsValidity(codecs as any)).not.toThrow()
  })
})
