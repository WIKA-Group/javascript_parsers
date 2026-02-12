import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createPEWUplinkOutputSchema, DownlinkInputSchema } from './schema'

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
    // Validate the input against the PEW downlink schema
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
    // Validate the input against the PEW downlink schema
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      throwSchemaError(`Multiple downlink input schema validation failed: ${example.description}`, inputRes.issues)
    }

    // @ts-expect-error - is correct type actually
    const output = encodeMultipleDownlinks(example.input)

    expect(output).toEqual(example.output)
  })

  // TODO: dont forget to test if it is possible to correctly adjust measuring range back and forth
  // and check that the ranges change for the decode calls
})

describe('pEW Parser range lifecycle', () => {
  it('should decode and encode range-dependent TULIP2/TULIP3 values across parser lifetime', () => {
    const {
      decodeUplink,
      encodeDownlink,
      adjustMeasuringRange,
    } = useParser()

    // Start from default PEW pressure range
    adjustMeasuringRange('pressure', { start: 0, end: 10 })

    const tulip2DecodeAt10 = decodeUplink({
      bytes: [1, 0, 35, 9, 185, 26, 240],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt10 = decodeUplink({
      bytes: [16, 1, 6, 46, 151, 14, 21, 47],
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

    const tulip3EncodeAt10 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 2.5,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip2EncodeAt10).toEqual({
      fPort: 1,
      bytes: [24, 0, 32, 0, 100, 128, 19, 136],
    })
    expect(tulip3EncodeAt10).toMatchObject({ fPort: 1, bytes: expect.any(Array) })

    adjustMeasuringRange('pressure', { start: 0, end: 16 })

    const tulip2DecodeAt16 = decodeUplink({
      bytes: [1, 0, 35, 9, 185, 26, 240],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt16 = decodeUplink({
      bytes: [16, 1, 6, 46, 151, 14, 21, 47],
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

    const tulip3EncodeAt16 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 2.5,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip2DecodeAt10).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })
    expect(tulip2DecodeAt16).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })
    expect(tulip3DecodeAt10).toMatchObject({ data: { measurements: expect.any(Array) } })
    expect(tulip3DecodeAt16).toMatchObject({ data: { measurements: expect.any(Array) } })

    const t2PressureAt10 = (tulip2DecodeAt10 as any).data.measurement.channels.find((c: any) => c.channelName === 'pressure').value
    const t2PressureAt16 = (tulip2DecodeAt16 as any).data.measurement.channels.find((c: any) => c.channelName === 'pressure').value
    const t3PressureAt10 = (tulip3DecodeAt10 as any).data.measurements.find((m: any) => m.channelName === 'pressure').value
    const t3PressureAt16 = (tulip3DecodeAt16 as any).data.measurements.find((m: any) => m.channelName === 'pressure').value

    expect(t2PressureAt10).toBeCloseTo(-0.011, 4)
    expect(t2PressureAt16).toBeCloseTo(-0.0176, 4)
    expect(t3PressureAt10).toBeCloseTo(9.427, 4)
    expect(t3PressureAt16).toBeCloseTo(15.0832, 4)

    const t2BytesAt10 = (tulip2EncodeAt10 as any).bytes as number[]
    const t2BytesAt16 = (tulip2EncodeAt16 as any).bytes as number[]
    const t3BytesAt10 = (tulip3EncodeAt10 as any).bytes as number[]
    const t3BytesAt16 = (tulip3EncodeAt16 as any).bytes as number[]

    expect(tulip2EncodeAt16).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect(tulip3EncodeAt16).toMatchObject({ fPort: 1, bytes: expect.any(Array) })

    expect(tulip2DecodeAt16).not.toEqual(tulip2DecodeAt10)
    expect(tulip3DecodeAt16).not.toEqual(tulip3DecodeAt10)
    expect(tulip2EncodeAt16).not.toEqual(tulip2EncodeAt10)
    expect(tulip3EncodeAt16).toEqual(tulip3EncodeAt10)

    expect(t2BytesAt16.slice(0, 3)).toEqual([24, 0, 32])
    expect(t2BytesAt16.length).toBe(t2BytesAt10.length)

    const u16 = (high: number, low: number): number => ((high << 8) | low)
    const t2DeadBandAt10 = u16(t2BytesAt10[3]!, t2BytesAt10[4]!)
    const t2DeadBandAt16 = u16(t2BytesAt16[3]!, t2BytesAt16[4]!)
    const t2ThresholdAt10 = u16(t2BytesAt10[6]!, t2BytesAt10[7]!)
    const t2ThresholdAt16 = u16(t2BytesAt16[6]!, t2BytesAt16[7]!)

    expect(t2DeadBandAt16).toBeLessThan(t2DeadBandAt10)
    expect(t2ThresholdAt16).toBeLessThan(t2ThresholdAt10)
    expect(t3BytesAt16).toEqual(t3BytesAt10)

    adjustMeasuringRange('pressure', { start: 0, end: 2 })

    const tulip3EncodeAt2 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 2.5,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip3EncodeAt2).toMatchObject({ errors: [expect.stringContaining('Validation failed')] })
    expect((tulip3EncodeAt2 as any).errors[0]).toContain('<= 2')
  })
})
