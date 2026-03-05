import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createGD20WUplinkOutputSchema, DownlinkInputSchema } from './schema'

const uplinkExamples = examples.filter(e => e.type === ('uplink'))
const hexUplinkExamples = examples.filter(e => e.type === ('uplink_hex'))
const downlinkExamples = examples.filter(e => e.type === ('downlink'))
const downlinkGoodCases = downlinkExamples.filter(e => !e.description.startsWith('Badcase'))
const downlinkBadCases = downlinkExamples.filter(e => e.description.startsWith('Badcase'))
const downlinkMultiple = examples.filter(e => e.type === ('downlinkMultiple'))

function throwSchemaError(context: string, issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]): never {
  const summary = v.summarize(issues)
  const details = JSON.stringify(issues, null, 2)
  throw new Error(`${context}\n${summary}\n${details}`)
}

describe('gd20w parser', () => {
  const {
    decodeUplink,
    decodeHexUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
    adjustMeasuringRange,
  } = useParser()

  const outputSchema = createGD20WUplinkOutputSchema()
  const downlinkInputSchema = DownlinkInputSchema()

  adjustMeasuringRange('channel0', { start: 0, end: 12 })

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input as any)

    expect(output).toEqual(example.output)

    const res = v.safeParse(outputSchema, output)
    if (!res.success) {
      throwSchemaError(`Uplink output schema validation failed: ${example.description}`, res.issues)
    }
  })

  it.each(hexUplinkExamples)(`should decode hex uplink example: $description`, (example) => {
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

    // @ts-expect-error - runtime validation inside parser handles this input shape
    const output = encodeDownlink(example.input)
    expect(output).toEqual(example.output)
  })

  it.each(downlinkBadCases)(`should encode downlink bad case: $description`, (example) => {
    // @ts-expect-error - runtime validation inside parser handles this input shape
    const output = encodeDownlink(example.input)
    expect(output).toEqual(example.output)
  })

  it.each(downlinkMultiple)(`should encode multiple downlinks example: $description`, (example) => {
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      throwSchemaError(`Multiple downlink input schema validation failed: ${example.description}`, inputRes.issues)
    }

    // @ts-expect-error - runtime validation inside parser handles this input shape
    const output = encodeMultipleDownlinks(example.input)
    expect(output).toEqual(example.output)
  })
})

describe('gd20w parser range lifecycle', () => {
  it('should change decode and encode output when measuring range is adjusted', () => {
    const {
      decodeUplink,
      encodeDownlink,
      adjustMeasuringRange,
    } = useParser()

    adjustMeasuringRange('channel0', { start: 0, end: 12 })

    const decodeAt12 = decodeUplink({
      fPort: 1,
      bytes: [1, 4, 0, 18, 84, 1, 33, 53, 4, 23, 84],
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const encodeAt12 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 1,
        channel0: {
          alarms: {
            deadBand: 0.12,
            lowThreshold: 3,
          },
        },
      },
    } as any)

    expect(encodeAt12).toEqual({
      fPort: 1,
      bytes: [1, 32, 0, 0, 100, 128, 19, 136],
    })

    adjustMeasuringRange('channel0', { start: 0, end: 24 })

    const decodeAt24 = decodeUplink({
      fPort: 1,
      bytes: [1, 4, 0, 18, 84, 1, 33, 53, 4, 23, 84],
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const encodeAt24 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 1,
        channel0: {
          alarms: {
            deadBand: 0.12,
            lowThreshold: 3,
          },
        },
      },
    } as any)

    const valueAt12 = (decodeAt12 as any).data.measurements.channels.find((c: any) => c.channelId === 0).value
    const valueAt24 = (decodeAt24 as any).data.measurements.channels.find((c: any) => c.channelId === 0).value

    expect(valueAt12).toBeCloseTo(2.63, 2)
    expect(valueAt24).toBeCloseTo(5.261, 3)

    expect(encodeAt24).toEqual({
      fPort: 1,
      bytes: [1, 32, 0, 0, 50, 128, 14, 166],
    })

    expect(encodeAt24).not.toEqual(encodeAt12)
    expect(decodeAt24).not.toEqual(decodeAt12)
  })
})
