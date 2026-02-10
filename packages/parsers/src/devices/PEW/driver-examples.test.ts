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

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input as any)

    expect(output).toEqual(example.output)

    const res = v.safeParse(outputSchema, output)
    if (!res.success) {
      // If the schema validation fails, we want to see the output (summary not helpful)
      expect(output).toBeUndefined()
    }
  })

  it.each(hexUplinkExamples)(`should decode hex uplink example: %s`, (example) => {
    const output = decodeHexUplink(example.input as any)
    expect(output).toEqual(example.output)

    const res = v.safeParse(outputSchema, output)
    if (!res.success) {
      // If the schema validation fails, we want to see the output (summary not helpful)
      expect(output).toBeUndefined()
    }
  })

  // TODO: dont forget to test if it is possible to correctly adjust measuring range back and forth
  // and check that the ranges change for the decode calls
})
