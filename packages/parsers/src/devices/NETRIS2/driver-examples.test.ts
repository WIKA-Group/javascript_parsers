import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createNETRIS2UplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(e => e.type === ('uplink'))
const hexUplinkExamples = examples.filter(e => e.type === ('hexUplink'))
const downlinkExamples = examples.filter(e => e.type === ('downlink'))
const downlinkMultiple = examples.filter(e => e.type === ('downlinkMultiple'))

describe('netris2 parser', () => {
  const {
    decodeUplink,
    decodeHexUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
  } = useParser()

  const outputSchema = createNETRIS2UplinkOutputSchema()

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    // @ts-expect-error - is correct type actually
    const output = decodeUplink(example.input)

    expect(output).toEqual(example.output)

    const result = v.safeParse(outputSchema, output)
    if (!result.success) {
      console.error('Schema validation failed:', JSON.stringify(result.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })

  it.each(hexUplinkExamples)(`should decode hexUplink example: $description`, (example) => {
    // @ts-expect-error - is correct type actually
    const output = decodeHexUplink(example.input)

    expect(output).toEqual(example.output)

    const result = v.safeParse(outputSchema, output)
    if (!result.success) {
      console.error('Schema validation failed:', JSON.stringify(result.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })

  it.each(downlinkExamples)(`should encode downlink example: $description`, (example) => {
    // @ts-expect-error - is correct type actually
    const output = encodeDownlink(example.input)

    expect(output).toEqual(example.output)
  })

  it.each(downlinkMultiple)(`should encode multiple downlinks example: $description`, (example) => {
    // @ts-expect-error - is correct type actually
    const output = encodeMultipleDownlinks(example.input)

    expect(output).toEqual(example.output)

    /* encodeDownlink({
      codec: "NETRIS2TULIP2",
      input:  {

      }
    }) */
  })
})
