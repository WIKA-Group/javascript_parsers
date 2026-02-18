import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createTRUUplinkOutputSchema } from './schema'

const uplinkExamples = examples.filter(example => example.type === 'uplink')
const hexUplinkExamples = examples.filter(example => example.type === 'uplink_hex')
const downlinkExamples = examples.filter(example => example.type === 'downlink')
const downlinkGoodCases = downlinkExamples.filter(example => !example.description.startsWith('Badcase'))
const downlinkBadCases = downlinkExamples.filter(example => example.description.startsWith('Badcase'))
const downlinkMultipleExamples = examples.filter(example => example.type === 'downlinkMultiple')
// const base64UplinkExamples = examples.filter(example => example.type === 'uplink_base64')

describe('tRU+NETRIS3 parser', () => {
  const {
    adjustMeasuringRange,
    decodeHexUplink,
    decodeUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
  } = useParser()

  const outputSchema = createTRUUplinkOutputSchema()

  adjustMeasuringRange('temperature', { start: 0, end: 600 })

  it.each(uplinkExamples)(`should decode uplink example: $description`, (example) => {
    const output = decodeUplink(example.input as any)
    expect(output).toEqual(example.output)
    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })

  it.each(hexUplinkExamples)(`should decode hex uplink example: %s`, (example) => {
    const output = decodeHexUplink(example.input as any)
    expect(output).toEqual(example.output)
    expect(() => v.parse(outputSchema, output)).not.toThrow()
  })

  it.each(downlinkGoodCases)(`should encode downlink example: $description`, (example) => {
    const output = encodeDownlink(example.input as any)
    expect(output).toEqual(example.output)
  })

  it.each(downlinkBadCases)(`should encode downlink badcase: $description`, (example) => {
    const output = encodeDownlink(example.input as any)
    expect(output).toEqual(example.output)
    expect(output).toMatchObject({
      errors: [expect.stringContaining('(JS):')],
    })
  })

  it.each(downlinkMultipleExamples)(`should encode multiple downlinks example: $description`, (example) => {
    const output = encodeMultipleDownlinks(example.input as any)
    expect(output).toEqual(example.output)
  })

  /* it.each(base64UplinkExamples)(`should decode base64 uplink example: %s`, (example) => {
    const output = decodeUplink({
      bytes: example.input.bytes,
      fPort: example.input.fPort,
      recvTime: example.input.recvTime,
    } as any)
    expect(output).toEqual(example.output)
    expect(() => v.parse(outputSchema, output)).not.toThrow()
  }) */
})

describe('tRU+NETRIS3 parser range lifecycle', () => {
  it('should decode and encode range-dependent TULIP2/TULIP3 values across parser lifetime', () => {
    const {
      decodeUplink,
      encodeDownlink,
      adjustMeasuringRange,
    } = useParser()

    adjustMeasuringRange('temperature', { start: 0, end: 600 })

    const tulip2DecodeAt600 = decodeUplink({
      bytes: [1, 0, 0, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt600 = decodeUplink({
      bytes: [16, 1, 6, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3EncodeAt600 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 250,
              },
            },
          },
        },
      },
    } as any)

    adjustMeasuringRange('temperature', { start: 0, end: 900 })

    const tulip2DecodeAt900 = decodeUplink({
      bytes: [1, 0, 0, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3DecodeAt900 = decodeUplink({
      bytes: [16, 1, 6, 46, 151],
      fPort: 1,
      recvTime: '1992-12-22T17:00:00+01:00',
    } as any)

    const tulip3EncodeAt900 = encodeDownlink({
      protocol: 'TULIP3',
      input: {
        action: 'writeRegisters',
        input: {
          sensor1: {
            channel1: {
              configuration: {
                lowThresholdAlarmValue: 375,
              },
            },
          },
        },
      },
    } as any)

    expect(tulip2DecodeAt900).not.toEqual(tulip2DecodeAt600)
    expect(tulip3DecodeAt900).not.toEqual(tulip3DecodeAt600)
    expect(tulip3EncodeAt600).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect(tulip3EncodeAt900).toMatchObject({ fPort: 1, bytes: expect.any(Array) })
    expect((tulip3EncodeAt900 as any).bytes).not.toEqual((tulip3EncodeAt600 as any).bytes)
  })
})
