/* eslint-disable ts/explicit-function-return-type */
import type { AnyCodec, Codec } from './codecs/codec'
import type { HexUplinkInput, UplinkInput } from './schemas'
import type { GenericFailureUplinkOutput, GenericUplinkOutput } from './types'
import { safeParse } from 'valibot'
import { checkCodecsValidity } from './codecs/utils'
import { createHexUplinkInputSchema, createUplinkInputSchema } from './schemas'
import { getRoundingDecimals, hexStringToIntArray } from './utils'

type ChannelNamesFromCodec<TCodecs extends AnyCodec> = {
  [C in TCodecs as C['name']]: C extends Codec<any, any, infer N, any> ? N : never
}[TCodecs['name']]

type EncodeInput<TCodecs extends AnyCodec> = {
  [Codec in TCodecs as Codec['name']]: {
    codec: Codec['name']
    input: Parameters<Codec['encode']>[0]
  }
}[TCodecs['name']]

interface ParserOptions<TCodec extends AnyCodec = AnyCodec> {
  parserName: string
  /**
   * The list of codecs to use for encoding/decoding.
   * All channels of all codecs must have same name and range.
   * Otherwise, an error will be thrown on initialization.
   */
  codecs: TCodec[]
  /**
   * Whether to throw an error if multiple codecs match the input during decoding.
   * If false, result of the first matching codec will be returned.
   * @default true
   */
  throwOnMultipleDecode?: boolean

  /**
   * The number of decimal places to round to.
   * Uses the {@link getRoundingDecimals} function.
   * @default 4
   */
  roundingDecimals?: number
}

export interface DeviceParser<TParserOptions extends ParserOptions<AnyCodec>> {
  /**
   * Adjust the rounding of decimal values in the parsed data.
   * @param decimals The number of decimal places to round to.
   * Uses the {@link getRoundingDecimals} function.
   * @returns void
   */
  adjustRoundingDecimals: (decimals: number) => void
  adjustMeasuringRange: (channel: ChannelNamesFromCodec<TParserOptions['codecs'][number]>, range: { start: number, end: number }) => void

  /*
  disableCodec: (codec: TParserOptions['codecs'][number]['name']) => void
  enableCodec: (codec: TParserOptions['codecs'][number]['name']) => void
  */

  decodeUplink: (input: UplinkInput) => GenericUplinkOutput<ReturnType<TParserOptions['codecs'][number]['decode']>>
  decodeHexString: (input: HexUplinkInput) => GenericUplinkOutput<ReturnType<TParserOptions['codecs'][number]['decode']>>

  /*
  decodeBase64String: (input: string) => GenericUplinkOutput<ReturnType<TParserOptions['codecs'][number]['decode']>>
  */

  encodeDownlink: (input: EncodeInput<TParserOptions['codecs'][number]>) => number[]
}

export function defineParser<const TParserOptions extends ParserOptions>(options: TParserOptions): DeviceParser<TParserOptions> {
  const { codecs, throwOnMultipleDecode = true, parserName } = options
  const roundingDecimals = getRoundingDecimals(options.roundingDecimals)
  // first check if the codecs are valid
  checkCodecsValidity(options.codecs)

  function createError(message: string): GenericFailureUplinkOutput {
    return {
      errors: [`${parserName} (JS): ${message}`],
    }
  }

  function decode(input: UplinkInput) {
    // go through the codecs and see if they can decode it
    let c: AnyCodec | undefined
    codecs.forEach((codec) => {
      // check if it can decode the input
      const canTry = codec.canTryDecode(input)
      if (canTry) {
        // only take first codec later on
        if (!c) {
          c = codec
        }
        else if (throwOnMultipleDecode) {
          throw new Error(`Message could not be uniquely decoded. Multiple codecs matched the input.`)
        }
      }
    })
    if (!c) {
      throw new Error(`Message could not be decoded. No codec matched the input.`)
    }
    // we need to catch here the
    return c.decode(input)
  }

  function decodeUplink(input: UplinkInput) {
    // for validating input
    try {
      const validatedInput = safeParse(createUplinkInputSchema(), input)
      if (!validatedInput.success) {
        throw new Error(`Input is not a valid for decoding. Check your input data.`)
      }

      return decode(validatedInput.output)
    }
    catch (error) {
      if (error instanceof Error) {
        return createError(error.message)
      }
      return createError(`Unknown error occurred during decoding in parser ${parserName} with input ${JSON.stringify(input)}`)
    }
  }

  function decodeHexString(input: HexUplinkInput) {
    const validatedInput = safeParse(createHexUplinkInputSchema(), input)
    if (!validatedInput.success) {
      return createError(`Input is not a valid for decoding. Check your input data.`)
    }
    const intArray = hexStringToIntArray(validatedInput.output.bytes)
    if (!intArray) {
      return createError(`Input bytes is not a valid hexadecimal string.`)
    }
    // Continue with the decoding process
    return decodeUplink({
      bytes: intArray,
      fPort: validatedInput.output.fPort,
      recvTime: validatedInput.output.recvTime,
    })
  }

  function encodeDownlink(input: EncodeInput<TParserOptions['codecs'][number]>): number[] {
    const codec = codecs.find(c => c.name === input.codec)
    if (!codec) {
      throw new Error(`Codec ${input.codec} not found in parser. Input could not be encoded.`)
    }
    return codec.encode(input.input)
  }

  return {
    decodeUplink,
    decodeHexString,
    encodeDownlink,
    adjustMeasuringRange: (name, range) => {
      codecs.forEach((codec) => {
        codec.adjustMeasuringRange(name, range)
      })
    },
    adjustRoundingDecimals: (decimals) => {
      const corrected = getRoundingDecimals(decimals, roundingDecimals)
      codecs.forEach((codec) => {
        codec.adjustRoundingDecimals(corrected)
      })
    },

  } satisfies DeviceParser<TParserOptions>
}

/* const tulip1Codec = defineTULIP1Codec({
  channels: [
    {
      name: 'temperature',
      start: -40,
      end: 125,
    },
    {
      name: 'humidity',
      start: 0,
      end: 100,
    },
  ],
  deviceName: '1',
  encodeHandler: (i: {
    hello: string
  }) => [] as number[],
  handlers: {

    0x02: () => {
      return { data: { id: 2, humidity: 55.5 } } as const
    },
    0x01: () => {
      return { data: { id: 1, temperature: 22.5 } as const,
      }
    },
    0x03: someParser,
  },
})

const p = defineParser({
  deviceName: 'MyDevice',
  codecs: [tulip1Codec],
})

function someParser(): {
  data: { id: 3, press: number }
} {
  return {
    data: { id: 3, press: 1013 },
  }
}

const res = p.decodeUplink({
  bytes: [0x01, 0x02, 0x03],
})

p.encodeDownlink({
  codec: '1TULIP1',
  input: { hello: 'world' },
})
 */
