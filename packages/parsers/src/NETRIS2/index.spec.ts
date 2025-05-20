import { expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { decodeHexUplink, decodeUplink, encodeDownlink } from './index'

it('all examples should match the output', () => {
  examples.filter(e => e.type === 'uplink').forEach((example) => {
    expect(decodeUplink(example.input as any)).toEqual(example.output)
  })
  examples.filter(e => e.type === 'downlink').forEach((example) => {
    expect(encodeDownlink(example.input as any)).toEqual(example.output)
  })
  examples.filter(e => e.type === 'hexUplink').forEach((example) => {
    expect(decodeHexUplink(example.input as any)).toEqual(example.output)
  })
})
