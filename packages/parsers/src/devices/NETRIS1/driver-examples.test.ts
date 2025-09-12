import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createNETRIS1UplinkOutputSchema } from './schema'

examples.forEach((e) => {
  if (!e.type) {
    throw new Error(`Example is missing type: ${JSON.stringify(e)}`)
  }
})

const uplinkExamples = examples.filter(e => e.type.startsWith('uplink'))

describe('netris1 parser', () => {
  const {
    decodeUplink,
    adjustMeasuringRange,
  } = useParser()

  const outputSchema = createNETRIS1UplinkOutputSchema()

  adjustMeasuringRange('measurement', { start: 0, end: 10 })

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input)

    expect(output).toEqual(example.output)

    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })
})
