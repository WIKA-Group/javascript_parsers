import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createPGW23_100_11UplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(example => example.type === 'uplink')
const hexUplinkExamples = examples.filter(example => example.type === 'uplink_hex')
// const base64UplinkExamples = examples.filter(example => example.type === 'uplink_base64')

describe('pgw23.100.11 parser', () => {
  const {
    decodeUplink,
    decodeHexUplink,
    adjustMeasuringRange,
    adjustRoundingDecimals,
  } = useParser()

  const outputSchema = createPGW23_100_11UplinkOutputSchema()

  adjustMeasuringRange('pressure', { start: 0, end: 10 })
  adjustRoundingDecimals(3)

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input as any)

    expect(output).toEqual(example.output)

    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })

  it.each(hexUplinkExamples)(`should decode hex uplink example: $description`, (example) => {
    const output = decodeHexUplink(example.input as any)

    expect(output).toEqual(example.output)

    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })

  /* it.each(base64UplinkExamples)(`should decode base64 uplink example: $description`, (example) => {
    const bytesBuffer = Buffer.from(example.input.bytes.replace(/\s+/g, ''), 'base64')
    const output = decodeUplink({
      ...example.input,
      bytes: Array.from(bytesBuffer.values()),
    } as any)

    expect(output).toEqual(example.output)

    expect(() => v.parse(outputSchema, output)).not.toThrow()
  }) */
})
