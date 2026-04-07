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

  adjustMeasuringRange('measurement', { start: -312.5, end: 312.5 })

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

describe('netrisF parser range lifecycle', () => {
  it('should decode and encode range-dependent TULIP2/TULIP3 values across parser lifetime', () => {
    const {
      decodeUplink,
      encodeDownlink,
      adjustMeasuringRange,
    } = useParser()

    adjustMeasuringRange('measurement', { start: -312.5, end: 312.5 })

    const tulip2DecodeAt625 = decodeUplink({
      bytes: [2, 0, 35, 9, 185, 26, 240],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt625 = decodeUplink({
      bytes: [16, 1, 6, 46, 151, 14, 21, 47],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip2EncodeAt625 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 24,
        channel0: {
          alarms: {
            deadBand: 10,
            lowThreshold: 100,
          },
        },
      },
    } as any)

    const tulip3EncodeAt625 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 100,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip2EncodeAt625).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect(tulip3EncodeAt625).toMatchObject({ fPort: 1, bytes: expect.any(Array) })

    adjustMeasuringRange('measurement', { start: -500, end: 500 })

    const tulip2DecodeAt1000 = decodeUplink({
      bytes: [2, 0, 35, 9, 185, 26, 240],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt1000 = decodeUplink({
      bytes: [16, 1, 6, 46, 151, 14, 21, 47],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip2EncodeAt1000 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 24,
        channel0: {
          alarms: {
            deadBand: 10,
            lowThreshold: 100,
          },
        },
      },
    } as any)

    const tulip3EncodeAt1000 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 100,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip2DecodeAt625).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })
    expect(tulip2DecodeAt1000).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })
    expect(tulip3DecodeAt625).toMatchObject({ data: { measurements: expect.any(Array) } })
    expect(tulip3DecodeAt1000).toMatchObject({ data: { measurements: expect.any(Array) } })

    const t2StrainAt625 = (tulip2DecodeAt625 as any).data.measurement.channels.find((c: any) => c.channelName === 'measurement').value
    const t2StrainAt1000 = (tulip2DecodeAt1000 as any).data.measurement.channels.find((c: any) => c.channelName === 'measurement').value
    const t3StrainAt625 = (tulip3DecodeAt625 as any).data.measurements.find((m: any) => m.channelName === 'measurement').value
    const t3StrainAt1000 = (tulip3DecodeAt1000 as any).data.measurements.find((m: any) => m.channelName === 'measurement').value

    expect(t2StrainAt1000).not.toBe(t2StrainAt625)
    expect(t3StrainAt1000).not.toBe(t3StrainAt625)

    const t2BytesAt625 = (tulip2EncodeAt625 as any).bytes as number[]
    const t2BytesAt1000 = (tulip2EncodeAt1000 as any).bytes as number[]
    const t3BytesAt625 = (tulip3EncodeAt625 as any).bytes as number[]
    const t3BytesAt1000 = (tulip3EncodeAt1000 as any).bytes as number[]

    expect(tulip2EncodeAt1000).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect(tulip3EncodeAt1000).toMatchObject({ fPort: 1, bytes: expect.any(Array) })

    expect(tulip2DecodeAt1000).not.toEqual(tulip2DecodeAt625)
    expect(tulip3DecodeAt1000).not.toEqual(tulip3DecodeAt625)
    expect(tulip2EncodeAt1000).not.toEqual(tulip2EncodeAt625)
    expect(tulip3EncodeAt1000).toEqual(tulip3EncodeAt625)

    expect(t2BytesAt1000.slice(0, 3)).toEqual([24, 0, 32])
    expect(t2BytesAt1000.length).toBe(t2BytesAt625.length)

    const u16 = (high: number, low: number): number => ((high << 8) | low)
    const t2DeadBandAt625 = u16(t2BytesAt625[3]!, t2BytesAt625[4]!)
    const t2DeadBandAt1000 = u16(t2BytesAt1000[3]!, t2BytesAt1000[4]!)
    const t2ThresholdAt625 = u16(t2BytesAt625[6]!, t2BytesAt625[7]!)
    const t2ThresholdAt1000 = u16(t2BytesAt1000[6]!, t2BytesAt1000[7]!)

    expect(t2DeadBandAt1000).toBeLessThan(t2DeadBandAt625)
    expect(t2ThresholdAt1000).toBeLessThan(t2ThresholdAt625)
    expect(t3BytesAt1000).toEqual(t3BytesAt625)

    adjustMeasuringRange('measurement', { start: -50, end: 50 })

    const tulip3EncodeAt100 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 100,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip3EncodeAt100).toMatchObject({ errors: [expect.stringContaining('Validation failed')] })
    expect((tulip3EncodeAt100 as any).errors[0]).toContain('<= 50')
  })
})
