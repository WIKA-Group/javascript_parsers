import * as v from 'valibot'
import { expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { decodeHexUplink, decodeUplink, encodeDownlink } from './index'
import { DownlinkInputSchema, UplinkOutputSchema } from './schemas'

it('all examples should match the output', () => {
  examples.filter(e => e.type === 'uplink').forEach((example) => {
    const parsedOutput = decodeUplink(example.input as any)

    expect(() => v.parse(UplinkOutputSchema, parsedOutput)).not.toThrow()
  })
  examples.filter(e => e.type === 'downlink').forEach((example) => {
    expect(encodeDownlink(example.input as any)).toEqual(example.output)

    const isValid = !('errors' in example.output)

    if (isValid) {
      expect(() => v.parse(DownlinkInputSchema, example.input as any)).not.toThrow()
    }
  })
  examples.filter(e => e.type === 'hexUplink').forEach((example) => {
    const output = decodeHexUplink(example.input as any)

    expect(output).toEqual(example.output)

    expect(() => v.parse(UplinkOutputSchema, output)).not.toThrow()
  })
})
