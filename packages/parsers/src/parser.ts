/* eslint-disable ts/explicit-function-return-type */
import type { AnyCodec, Codec } from './codecs/codec'
import type { HexUplinkInput, UplinkInput } from './schemas'
import type { DownlinkOutput, GenericUplinkOutput, GenericUplinkOutputFailure, MultipleDownlinkOutput } from './types'
import { safeParse } from 'valibot'
import { checkCodecsValidity } from './codecs/utils'
import { createHexUplinkInputSchema, createUplinkInputSchema } from './schemas'
import { getRoundingDecimals, hexStringToIntArray } from './utils'

type ChannelNamesFromCodec<TCodecs extends AnyCodec> = {
  [C in TCodecs as C['name']]: C extends Codec<any, any, infer N, any> ? N : never
}[TCodecs['name']]

type EncodeInput<TCodecs extends AnyCodec> = TCodecs extends { encode: infer THandler extends (input: any) => any }
  ? THandler extends (input: infer TInput) => any ? {
    codec: TCodecs['name']
    input: TInput
  }
    : never : never

type EncodeMultipleInput<TCodecs extends AnyCodec> = TCodecs extends { encodeMultiple: infer THandler extends (input: any) => any }
  ? THandler extends (input: infer TInput) => any ? {
    codec: TCodecs['name']
    input: TInput
  }
    : never : never

type HasEncoder<TParserOptions extends ParserOptions<AnyCodec>> = TParserOptions['codecs'][number] extends { encode: (input: any) => any } ? true : false
type HasMultipleEncoder<TParserOptions extends ParserOptions<AnyCodec>> = TParserOptions['codecs'][number] extends { encodeMultiple: (input: any) => any } ? true : false

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

export type DeviceParser<TParserOptions extends ParserOptions<AnyCodec>> = {
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
  decodeHexUplink: (input: HexUplinkInput) => GenericUplinkOutput<ReturnType<TParserOptions['codecs'][number]['decode']>>

  /*
  decodeBase64String: (input: string) => GenericUplinkOutput<ReturnType<TParserOptions['codecs'][number]['decode']>>
  */

} & (HasEncoder<TParserOptions> extends true ? {
  encodeDownlink: (input: EncodeInput<TParserOptions['codecs'][number]>) => DownlinkOutput
// eslint-disable-next-line ts/no-empty-object-type
} : {}) & (HasMultipleEncoder<TParserOptions> extends true ? {
  encodeMultipleDownlinks: (input: EncodeMultipleInput<TParserOptions['codecs'][number]>) => MultipleDownlinkOutput
// eslint-disable-next-line ts/no-empty-object-type
} : {})

export function defineParser<const TParserOptions extends ParserOptions>(options: TParserOptions): DeviceParser<TParserOptions> {
  const { codecs, throwOnMultipleDecode = true, parserName } = options
  const roundingDecimals = getRoundingDecimals(options.roundingDecimals)
  // first check if the codecs are valid and get channel adjustment permissions
  const channelAdjustmentPermissions = checkCodecsValidity(options.codecs)

  function createError(message: string): GenericUplinkOutputFailure {
    return {
      errors: [addPrefixToMessage(message)],
    }
  }

  function addPrefixToMessage(message: string): string {
    return `${parserName} (JS): ${message}`
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
      const result = decode(validatedInput.output)
      // if there are warning, we add the prefix to the messages
      if (result.warnings) {
        result.warnings = result.warnings.map(addPrefixToMessage)
      }
      return result
    }
    catch (error) {
      if (error instanceof Error) {
        return createError(error.message)
      }
      return createError(`Unknown error occurred during decoding in parser ${parserName} with input ${JSON.stringify(input)}`)
    }
  }

  function decodeHexUplink(input: HexUplinkInput) {
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

  function encodeDownlink(input: EncodeInput<TParserOptions['codecs'][number]>): DownlinkOutput {
    try {
      const codec = codecs.find(c => c.name === input.codec)
      if (!codec) {
        throw new Error(`Codec ${input.codec} not found in parser. Available codecs: ${codecs.map(c => c.name).join(', ')}`)
      }
      if (!('encode' in codec)) {
        throw new Error(`Codec ${input.codec} does not support encoding. Input could not be encoded.`)
      }
      return codec.encode!(input.input)
    }
    catch (error) {
      if (error instanceof Error) {
        return createError(error.message)
      }
      return createError(`Unknown error occurred during encoding in parser ${parserName} with input ${JSON.stringify(input)}`)
    }
  }

  function encodeMultipleDownlinks(input: EncodeMultipleInput<TParserOptions['codecs'][number]>): MultipleDownlinkOutput {
    try {
      const codec = codecs.find(c => c.name === input.codec)
      if (!codec) {
        throw new Error(`Codec ${input.codec} not found in parser. Available codecs: ${codecs.map(c => c.name).join(', ')}`)
      }
      if (!('encodeMultiple' in codec)) {
        throw new Error(`Codec ${input.codec} does not support multiple encoding. Input could not be encoded.`)
      }
      return codec.encodeMultiple!(input.input)
    }
    catch (error) {
      if (error instanceof Error) {
        return createError(error.message)
      }
      return createError(`Unknown error occurred during multiple encoding in parser ${parserName} with input ${JSON.stringify(input)}`)
    }
  }

  return {
    decodeUplink,
    decodeHexUplink,
    encodeDownlink,
    encodeMultipleDownlinks,
    adjustMeasuringRange: (name, range) => {
      // Check if channel exists
      if (!(name in channelAdjustmentPermissions)) {
        throw new Error(`Channel ${name} does not exist in parser ${parserName}. Cannot adjust measuring range.`)
      }

      // Check if adjustment is allowed for this channel
      if (channelAdjustmentPermissions[name]) {
        throw new Error(`Channel ${name} does not allow adjusting the measuring range in parser ${parserName}.`)
      }

      // Adjust range for all codecs
      codecs.forEach((codec) => {
        // @ts-expect-error - string not assignable to never (when there are no channels that allow)
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
