import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createPEWUplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(e => e.type === 'uplink')
const hexUplinkExamples = examples.filter(e => e.type === 'hexUplink')

describe('pEW Parser', () => {
  const {
    decodeUplink,
    decodeHexUplink,
    adjustMeasuringRange,
  } = useParser()

  const outputSchema = createPEWUplinkOutputSchema()

  adjustMeasuringRange('pressure', { start: 0, end: 10 })
  adjustMeasuringRange('device temperature', { start: -45, end: 110 })

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
})
