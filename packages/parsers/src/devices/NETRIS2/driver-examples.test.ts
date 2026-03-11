import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createNETRIS2UplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(e => e.type === ('uplink'))
const hexUplinkExamples = examples.filter(e => e.type === ('hexUplink'))
const downlinkExamples = examples.filter(e => e.type === ('downlink'))
const downlinkMultiple = examples.filter(e => e.type === ('downlinkMultiple'))

function throwSchemaError(context: string, issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]): never {
  const summary = v.summarize(issues)
  const details = JSON.stringify(issues, null, 2)
  throw new Error(`${context}\n${summary}\n${details}`)
}

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
      throwSchemaError(`Uplink output schema validation failed: ${example.description}`, result.issues)
    }
  })

  it.each(hexUplinkExamples)(`should decode hexUplink example: $description`, (example) => {
    // @ts-expect-error - is correct type actually
    const output = decodeHexUplink(example.input)

    expect(output).toEqual(example.output)

    const result = v.safeParse(outputSchema, output)
    if (!result.success) {
      throwSchemaError(`Hex uplink output schema validation failed: ${example.description}`, result.issues)
    }
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

  // No range changing tests as NETRIS2 doesn't support that
})
