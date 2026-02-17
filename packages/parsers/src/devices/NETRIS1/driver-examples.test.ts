import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createNETRIS1UplinkOutputSchema, DownlinkInputSchema } from './schema'

const uplinkExamples = examples.filter(e => e.type.startsWith('uplink'))
const downlinkExamples = examples.filter(e => e.type === ('downlink'))
const downlinkGoodCases = downlinkExamples.filter(e => !e.description.startsWith('Badcase'))
const downlinkBadCases = downlinkExamples.filter(e => e.description.startsWith('Badcase'))
const downlinkMultiple = examples.filter(e => e.type === ('downlinkMultiple'))
const downlinkMultipleGoodCases = downlinkMultiple.filter(e => !e.description.startsWith('Badcase'))
const downlinkMultipleBadCases = downlinkMultiple.filter(e => e.description.startsWith('Badcase'))

describe('netris1 parser', () => {
  const {
    decodeUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
    adjustMeasuringRange,
  } = useParser()

  const outputSchema = createNETRIS1UplinkOutputSchema()
  const downlinkInputSchema = DownlinkInputSchema()

  adjustMeasuringRange('measurement', { start: 0, end: 10 })

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input as any)

    expect(output).toEqual(example.output)

    const res = v.safeParse(outputSchema, output)
    if (!res.success) {
      // If the schema validation fails, we want to see the output (summary not helpful)
      expect(output).toBeUndefined()
    }
  })

  it.each(downlinkGoodCases)(`should encode downlink example: $description`, (example) => {
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      expect(inputRes).toBeUndefined()
    }

    const output = encodeDownlink(example.input as any)
    expect(output).toEqual(example.output)
  })

  it.each(downlinkBadCases)(`should return prefixed error for bad downlink: $description`, (example) => {
    const output = encodeDownlink(example.input as any)
    expect(output).toEqual(example.output)
    expect(output).toMatchObject({
      errors: [expect.stringContaining('NETRIS1 (JS):')],
    })
  })

  it.each(downlinkMultipleGoodCases)(`should encode multiple downlinks example: $description`, (example) => {
    const inputRes = v.safeParse(downlinkInputSchema, example.input)
    if (!inputRes.success) {
      expect(inputRes).toBeUndefined()
    }

    const output = encodeMultipleDownlinks(example.input as any)
    expect(output).toEqual(example.output)
  })

  it.each(downlinkMultipleBadCases)(`should return prefixed errors for multiple bad downlink: $description`, (example) => {
    const output = encodeMultipleDownlinks(example.input as any)
    expect(output).toEqual(example.output)
    expect(output).toMatchObject({
      errors: [expect.stringContaining('NETRIS1 (JS):')],
    })
  })
})

describe('netris1 parser range lifecycle', () => {
  it('should decode and encode range-dependent TULIP2/TULIP3 values across parser lifetime (0-10 -> 5-15)', () => {
    const {
      decodeUplink,
      encodeDownlink,
      adjustMeasuringRange,
    } = useParser()

    adjustMeasuringRange('measurement', { start: 0, end: 10 })

    const tulip2DecodeAt0to10 = decodeUplink({
      bytes: [1, 0, 0, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt0to10 = decodeUplink({
      bytes: [16, 1, 6, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip2EncodeAt0to10 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 4,
        channel0: {
          alarms: {
            deadBand: 0.1,
            lowThreshold: 6,
          },
        },
      },
    } as any)

    const tulip3EncodeAt0to10 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 6,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip2DecodeAt0to10).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })
    expect(tulip2EncodeAt0to10).toMatchObject({ fPort: 1, bytes: expect.any(Array) })

    adjustMeasuringRange('measurement', { start: 5, end: 15 })

    const tulip2DecodeAt5to15 = decodeUplink({
      bytes: [1, 0, 0, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt5to15 = decodeUplink({
      bytes: [16, 1, 6, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip2EncodeAt5to15 = encodeDownlink({
      protocol: 'TULIP2',
      input: {
        deviceAction: 'configuration',
        configurationId: 4,
        channel0: {
          alarms: {
            deadBand: 0.1,
            lowThreshold: 6,
          },
        },
      },
    } as any)

    const tulip3EncodeAt5to15 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 6,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip2DecodeAt5to15).toMatchObject({ data: { measurement: { channels: expect.any(Array) } } })
    expect(tulip2EncodeAt5to15).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect(tulip3DecodeAt0to10).toMatchObject({ data: { measurements: expect.any(Array) } })
    expect(tulip3DecodeAt5to15).toMatchObject({ data: { measurements: expect.any(Array) } })
    expect(tulip3EncodeAt0to10).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect(tulip3EncodeAt5to15).toMatchObject({ fPort: 1, bytes: expect.any(Array) })

    const t2ValueAt0to10 = (tulip2DecodeAt0to10 as any).data.measurement.channels.find((c: any) => c.channelName === 'measurement').value
    const t2ValueAt5to15 = (tulip2DecodeAt5to15 as any).data.measurement.channels.find((c: any) => c.channelName === 'measurement').value
    const t3ValueAt0to10 = (tulip3DecodeAt0to10 as any).data.measurements.find((m: any) => m.channelName === 'measurement').value
    const t3ValueAt5to15 = (tulip3DecodeAt5to15 as any).data.measurements.find((m: any) => m.channelName === 'measurement').value

    expect(t2ValueAt0to10).toBeCloseTo(9.427, 4)
    expect(t2ValueAt5to15).toBeCloseTo(14.427, 4)
    expect(t3ValueAt0to10).toBeCloseTo(9.427, 4)
    expect(t3ValueAt5to15).toBeCloseTo(14.427, 4)

    const bytesAt0to10 = (tulip2EncodeAt0to10 as any).bytes as number[]
    const bytesAt5to15 = (tulip2EncodeAt5to15 as any).bytes as number[]

    expect(bytesAt0to10.slice(0, 3)).toEqual([4, 32, 0])
    expect(bytesAt5to15.slice(0, 3)).toEqual([4, 32, 0])
    expect(bytesAt0to10.length).toBe(bytesAt5to15.length)

    const toU16 = (hi: number, lo: number): number => ((hi << 8) | lo)
    const deadBandAt0to10 = toU16(bytesAt0to10[3]!, bytesAt0to10[4]!)
    const deadBandAt5to15 = toU16(bytesAt5to15[3]!, bytesAt5to15[4]!)
    const thresholdAt0to10 = toU16(bytesAt0to10[6]!, bytesAt0to10[7]!)
    const thresholdAt5to15 = toU16(bytesAt5to15[6]!, bytesAt5to15[7]!)

    expect(deadBandAt0to10).toBe(100)
    expect(deadBandAt5to15).toBe(100)
    expect(thresholdAt0to10).toBe(8500)
    expect(thresholdAt5to15).toBe(3500)

    expect(tulip2DecodeAt5to15).not.toEqual(tulip2DecodeAt0to10)
    expect(tulip2EncodeAt5to15).not.toEqual(tulip2EncodeAt0to10)
    expect(tulip3DecodeAt5to15).not.toEqual(tulip3DecodeAt0to10)
    expect(tulip3EncodeAt5to15).toEqual(tulip3EncodeAt0to10)

    adjustMeasuringRange('measurement', { start: 5, end: 5.5 })

    const tulip3EncodeAt5to55 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 6,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip3EncodeAt5to55).toMatchObject({ errors: [expect.stringContaining('Validation failed')] })
    expect((tulip3EncodeAt5to55 as any).errors[0]).toContain('<= 5.5')
  })
})
