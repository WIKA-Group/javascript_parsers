import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createNetrisFUplinkOutputSchema, DownlinkInputSchema } from './schema'

const uplinkExamples = examples.filter(example => example.type === 'uplink')
const hexUplinkExamples = examples.filter(example => example.type === 'uplink_hex')
const downlinkExamples = examples.filter(example => example.type === 'downlink')
const downlinkGoodCases = downlinkExamples.filter(e => !e.description.startsWith('Badcase'))
const downlinkBadCases = downlinkExamples.filter(e => e.description.startsWith('Badcase'))
const downlinkMultiple = examples.filter(example => example.type === 'downlinkMultiple')

function throwSchemaError(context: string, issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]): never {
  const summary = v.summarize(issues)
  const details = JSON.stringify(issues, null, 2)
  throw new Error(`${context}\n${summary}\n${details}`)
}

describe('netrisF parser', () => {
  const {
    adjustMeasuringRange,
    decodeHexUplink,
    decodeUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
  } = useParser()

  const outputSchema = createNetrisFUplinkOutputSchema()
  const downlinkInputSchema = DownlinkInputSchema()

  adjustMeasuringRange('strain', { start: -312.5, end: 312.5 })

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input as any)
    expect(output).toEqual(example.output)

    const res = v.safeParse(outputSchema, output)
    if (!res.success) {
      throwSchemaError(`Uplink output schema validation failed: ${example.description}`, res.issues)
    }
  })

  it.each(hexUplinkExamples)(`should decode hex uplink example: %s`, (example) => {
    const output = decodeHexUplink(example.input as any)
    expect(output).toEqual(example.output)

    const res = v.safeParse(outputSchema, output)
    if (!res.success) {
      throwSchemaError(`Hex uplink output schema validation failed: ${example.description}`, res.issues)
    }
  })

  it.each(downlinkGoodCases)(`should encode downlink example: $description`, (example) => {
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      throwSchemaError(`Downlink input schema validation failed: ${example.description}`, inputRes.issues)
    }

    // @ts-expect-error - is correct type actually
    const output = encodeDownlink(example.input)
    expect(output).toEqual(example.output)
  })

  it.each(downlinkBadCases)(`should encode downlink bad case: $description`, (example) => {
    // @ts-expect-error - is correct type actually
    const output = encodeDownlink(example.input)
    expect(output).toEqual(example.output)
  })

  it.each(downlinkMultiple)(`should encode multiple downlinks example: $description`, (example) => {
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      throwSchemaError(`Multiple downlink input schema validation failed: ${example.description}`, inputRes.issues)
    }

    // @ts-expect-error - is correct type actually
    const output = encodeMultipleDownlinks(example.input)
    expect(output).toEqual(example.output)
  })
})
