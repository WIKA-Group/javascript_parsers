import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createGD20WUplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(example => example.type === 'uplink')

describe('gd20w parser', () => {
  const { decodeUplink } = useParser()
  const outputSchema = createGD20WUplinkOutputSchema()

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input)

    expect(output).toEqual(example.output)

    const result = v.safeParse(outputSchema, output)
    if (!result.success) {
      console.error('Schema validation failed:', JSON.stringify(result.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })
})
