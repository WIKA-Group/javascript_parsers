import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createTRWUplinkOutputSchema } from './schema'

examples.forEach((e) => {
  if (!e.type) {
    throw new Error(`Example is missing type: ${JSON.stringify(e)}`)
  }
})

const uplinkExamples = examples.filter(e => e.type.startsWith('uplink'))

describe('trw parser', () => {
  const {
    decodeUplink,
    adjustMeasuringRange,
  } = useParser()

  const outputSchema = createTRWUplinkOutputSchema()

  adjustMeasuringRange('temperature', { start: 0, end: 10 })

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input)

    expect(output).toEqual(example.output)

    const res = v.safeParse(outputSchema, output)
    if (!res.success) {
      // If the schema validation fails, we want to see the output (summary not helpful)
      expect(output).toBeUndefined()
    }
  })
})
