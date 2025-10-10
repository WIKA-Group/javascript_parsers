import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createF98W6UplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(example => example.type === 'uplink')
const hexUplinkExamples = examples.filter(example => example.type === 'uplink_hex')
// const base64UplinkExamples = examples.filter(example => example.type === 'uplink_base64')

describe('f98W6 parser', () => {
  const {
    adjustMeasuringRange,
    decodeHexUplink,
    decodeUplink,
  } = useParser()

  const outputSchema = createF98W6UplinkOutputSchema()

  adjustMeasuringRange('strain', { start: -312.5, end: 312.5 })

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input as any)
    expect(output).toEqual(example.output)
    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })

  it.each(hexUplinkExamples)(`should decode hex uplink example: %s`, (example) => {
    const output = decodeHexUplink(example.input as any)
    expect(output).toEqual(example.output)
    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })

  /* it.each(base64UplinkExamples)(`should decode base64 uplink example: %s`, (example) => {
    const output = decodeUplink({
      bytes: example.input.bytes,
      fPort: example.input.fPort,
      recvTime: example.input.recvTime,
    } as any)
    expect(output).toEqual(example.output)
    expect(() => v.parse(outputSchema, output)).not.toThrow()
  }) */
})
