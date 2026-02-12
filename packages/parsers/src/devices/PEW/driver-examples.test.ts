import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createPEWUplinkOutputSchema, DownlinkInputSchema } from './schema'

const uplinkExamples = examples.filter(e => e.type === ('uplink'))
const hexUplinkExamples = examples.filter(e => e.type === ('hexUplink'))
const downlinkExamples = examples.filter(e => e.type === ('downlink'))
const downlinkGoodCases = downlinkExamples.filter(e => !e.description.startsWith('Badcase'))
const downlinkBadCases = downlinkExamples.filter(e => e.description.startsWith('Badcase'))
const downlinkMultiple = examples.filter(e => e.type === ('downlinkMultiple'))

describe('pEW Parser', () => {
  const {
    decodeUplink,
    decodeHexUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
    adjustMeasuringRange,
  } = useParser()

  const outputSchema = createPEWUplinkOutputSchema()
  const downlinkInputSchema = DownlinkInputSchema()

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

  it.each(downlinkGoodCases)(`should encode downlink example: $description`, (example) => {
    // Validate the input against the PEW downlink schema
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      expect(v.summarize(inputRes.issues)).toBe(null)
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
    // Validate the input against the PEW downlink schema
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      console.error('Downlink input schema validation failed:', JSON.stringify(inputRes.issues, null, 2))
    }
    expect(inputRes.success).toBe(true)

    // @ts-expect-error - is correct type actually
    const output = encodeMultipleDownlinks(example.input)

    expect(output).toEqual(example.output)
  })

  // TODO: dont forget to test if it is possible to correctly adjust measuring range back and forth
  // and check that the ranges change for the decode calls
})
