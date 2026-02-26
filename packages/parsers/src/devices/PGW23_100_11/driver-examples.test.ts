import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createPGW23_100_11UplinkOutputSchema, DownlinkInputSchema } from './schema'

const uplinkExamples = examples.filter(e => e.type === 'uplink')
const hexUplinkExamples = examples.filter(e => e.type === 'uplink_hex')
const downlinkExamples = examples.filter(e => e.type === 'downlink')
const downlinkGoodCases = downlinkExamples.filter(e => !e.description.startsWith('Badcase'))
const downlinkBadCases = downlinkExamples.filter(e => e.description.startsWith('Badcase'))
const downlinkMultiple = examples.filter(e => e.type === 'downlinkMultiple')
// const base64UplinkExamples = examples.filter(example => example.type === 'uplink_base64')

function throwSchemaError(context: string, issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]): never {
  const summary = v.summarize(issues)
  const details = JSON.stringify(issues, null, 2)
  throw new Error(`${context}\n${summary}\n${details}`)
}

describe('pgw23.100.11 parser', () => {
  const {
    decodeUplink,
    decodeHexUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
    adjustMeasuringRange,
    adjustRoundingDecimals,
  } = useParser()

  const outputSchema = createPGW23_100_11UplinkOutputSchema()
  const downlinkInputSchema = DownlinkInputSchema()

  adjustMeasuringRange('pressure', { start: 0, end: 10 })
  adjustRoundingDecimals(3)

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

    // @ts-expect-error - parser runtime type is correct
    const output = encodeDownlink(example.input)

    expect(output).toEqual(example.output)
  })

  it.each(downlinkBadCases)(`should encode downlink bad case: $description`, (example) => {
    // @ts-expect-error - parser runtime type is correct
    const output = encodeDownlink(example.input)

    expect(output).toEqual(example.output)
  })

  it.each(downlinkMultiple)(`should encode multiple downlinks example: $description`, (example) => {
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      throwSchemaError(`Multiple downlink input schema validation failed: ${example.description}`, inputRes.issues)
    }

    // @ts-expect-error - parser runtime type is correct
    const output = encodeMultipleDownlinks(example.input)

    expect(output).toEqual(example.output)
  })

  /* it.each(base64UplinkExamples)(`should decode base64 uplink example: $description`, (example) => {
    const bytesBuffer = Buffer.from(example.input.bytes.replace(/\s+/g, ''), 'base64')
    const output = decodeUplink({
      ...example.input,
      bytes: Array.from(bytesBuffer.values()),
    } as any)

    expect(output).toEqual(example.output)

    expect(() => v.parse(outputSchema, output)).not.toThrow()
  }) */
})

describe('pgw23.100.11 parser range lifecycle', () => {
  it('should decode and encode range-dependent TULIP2 values across parser lifetime', () => {
    const {
      decodeUplink,
      encodeDownlink,
      adjustMeasuringRange,
    } = useParser()

    adjustMeasuringRange('pressure', { start: 0, end: 10 })

    const tulip2DecodeAt10 = decodeUplink({
      bytes: [1, 0, 35, 9, 185, 26, 240],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip2EncodeAt10 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 24,
        channel0: {
          alarms: {
            deadBand: 0.1,
            lowThreshold: 2.5,
          },
        },
      },
    } as any)

    // const tulip3DecodeAt10 = decodeUplink({ ... })
    // const tulip3EncodeAt10 = encodeDownlink({ protocol: 'TULIP3', input: { ... } } as any)

    expect(tulip2EncodeAt10).toEqual({
      fPort: 1,
      bytes: [24, 0, 32, 0, 100, 128, 19, 136],
    })

    adjustMeasuringRange('pressure', { start: 0, end: 16 })

    const tulip2DecodeAt16 = decodeUplink({
      bytes: [1, 0, 35, 9, 185, 26, 240],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip2EncodeAt16 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 24,
        channel0: {
          alarms: {
            deadBand: 0.1,
            lowThreshold: 2.5,
          },
        },
      },
    } as any)

    // const tulip3DecodeAt16 = decodeUplink({ ... })
    // const tulip3EncodeAt16 = encodeDownlink({ protocol: 'TULIP3', input: { ... } } as any)

    expect(tulip2DecodeAt10).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })
    expect(tulip2DecodeAt16).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })

    const t2PressureAt10 = (tulip2DecodeAt10 as any).data.measurement.channels.find((c: any) => c.channelName === 'pressure').value
    const t2PressureAt16 = (tulip2DecodeAt16 as any).data.measurement.channels.find((c: any) => c.channelName === 'pressure').value

    expect(t2PressureAt10).toBeCloseTo(-0.011, 4)
    expect(t2PressureAt16).toBeCloseTo(-0.0176, 4)

    const t2BytesAt10 = (tulip2EncodeAt10 as any).bytes as number[]
    const t2BytesAt16 = (tulip2EncodeAt16 as any).bytes as number[]

    expect(tulip2EncodeAt16).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect(tulip2DecodeAt16).not.toEqual(tulip2DecodeAt10)
    expect(tulip2EncodeAt16).not.toEqual(tulip2EncodeAt10)

    expect(t2BytesAt16.slice(0, 3)).toEqual([24, 0, 32])
    expect(t2BytesAt16.length).toBe(t2BytesAt10.length)

    const u16 = (high: number, low: number): number => ((high << 8) | low)
    const t2DeadBandAt10 = u16(t2BytesAt10[3]!, t2BytesAt10[4]!)
    const t2DeadBandAt16 = u16(t2BytesAt16[3]!, t2BytesAt16[4]!)
    const t2ThresholdAt10 = u16(t2BytesAt10[6]!, t2BytesAt10[7]!)
    const t2ThresholdAt16 = u16(t2BytesAt16[6]!, t2BytesAt16[7]!)

    expect(t2DeadBandAt16).toBeLessThan(t2DeadBandAt10)
    expect(t2ThresholdAt16).toBeLessThan(t2ThresholdAt10)

    adjustMeasuringRange('pressure', { start: 0, end: 2 })

    const tulip2EncodeAt2 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 24,
        channel0: {
          alarms: {
            deadBand: 0.1,
            lowThreshold: 2.5,
          },
        },
      },
    } as any)

    expect(tulip2EncodeAt2).toMatchObject({ errors: [expect.any(String)] })
    expect((tulip2EncodeAt2 as any).errors[0]).toContain('channel0')

    // const tulip3EncodeAt2 = encodeDownlink({ protocol: 'TULIP3', input: { ... } } as any)
  })
})
