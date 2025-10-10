import { Buffer } from 'node:buffer'
import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createA2GUplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(example => example.type === 'uplink')
const hexUplinkExamples = examples.filter(example => example.type === 'uplink_hex')
const base64UplinkExamples = examples.filter(example => example.type === 'uplink_base64')

describe('a2g parser', () => {
  const {
    decodeUplink,
    decodeHexUplink,
    adjustMeasuringRange,
    adjustRoundingDecimals,
  } = useParser()

  const outputSchema = createA2GUplinkOutputSchema()

  adjustMeasuringRange('pressure', { start: -2500, end: 2500 })
  adjustMeasuringRange('flow', { start: 0, end: 10_000 })
  adjustRoundingDecimals(4)

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

  it.each(base64UplinkExamples)(`should decode base64 uplink example: $description`, (example) => {
    if (typeof example.input.bytes !== 'string') {
      throw new TypeError('Base64 examples must provide byte payload as string')
    }
    const bytesBuffer = Buffer.from(example.input.bytes.replace(/\s+/g, ''), 'base64')
    const output = decodeUplink({
      ...example.input,
      bytes: Array.from(bytesBuffer.values()),
    } as any)

    expect(output).toEqual(example.output)

    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })
})
