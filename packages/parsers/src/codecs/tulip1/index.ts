import type { UplinkInput } from '../../schemas'
import type { GenericUplinkOutput } from '../../types'
import type { Codec } from '../codec'
import { getRoundingDecimals } from '../../utils'
import { checkChannelsValidity } from '../utils'

interface Channel {
  name: string
  start: number
  end: number
}

type Handler<TReturn extends object = object> = (input: UplinkInput, options: { roundingDecimals: number }) => GenericUplinkOutput<TReturn>

export interface MessageHandlers<TReturn extends object = object> {
  0x00?: Handler<TReturn>
  0x01?: Handler<TReturn>
  0x02?: Handler<TReturn>
  0x03?: Handler<TReturn>
  0x04?: Handler<TReturn>
  0x05?: Handler<TReturn>
  0x06?: Handler<TReturn>
  0x07?: Handler<TReturn>
  0x08?: Handler<TReturn>
  0x09?: Handler<TReturn>
}

type ReturnTypeOfHandlers<THandlers extends MessageHandlers<object>> = {
  [K in keyof THandlers]: THandlers[K] extends Handler ? ReturnType<THandlers[K]> : never
}[keyof THandlers]

export interface TULIP1CodecOptions<TName extends string = string, THandlers extends MessageHandlers = MessageHandlers, TEncoder extends (input: object) => number[] = (input: object) => number[]> {
  deviceName: TName
  /**
   * The list of channels to use for this codec.
   * Each channel has a name and a range of values it covers.
   * The name must be unique across all channels.
   */
  channels: Channel[]
  /**
   * The number of decimal places to round the measurements to.
   * @default 4
   */
  roundingDecimals?: number

  /**
   * The message handlers for this codec.
   * Each handler is responsible for decoding a specific message type. (0x00 - 0x09)
   */
  handlers: THandlers

  /**
   * The encoding function for this codec.
   */
  encodeHandler: TEncoder
}

export type Tulip1Codec<TTULIP1CodecOptions extends TULIP1CodecOptions> = Codec<`${TTULIP1CodecOptions['deviceName']}TULIP1`, ReturnTypeOfHandlers<TTULIP1CodecOptions['handlers']>, TTULIP1CodecOptions['channels'][number]['name'], TTULIP1CodecOptions['encodeHandler']>

export function defineTULIP1Codec<const TOptions extends TULIP1CodecOptions>(options: TOptions): Tulip1Codec<TOptions> {
  const codecName = `${options.deviceName}TULIP1` as `${TOptions['deviceName']}TULIP1`

  let roundingDecimals = getRoundingDecimals(options.roundingDecimals)

  checkChannelsValidity(options.channels)

  function canTryDecode(input: UplinkInput): boolean {
    // look at first byte and see if there is a handler for it
    const firstByte = input.bytes[0]
    return typeof firstByte === 'number' && (firstByte in options.handlers)
  }

  // eslint-disable-next-line ts/explicit-function-return-type
  function decode(input: UplinkInput) {
    const firstByte = input.bytes[0]
    if (typeof firstByte !== 'number') {
      throw new TypeError(`Input must have at least one byte for ${codecName} Codec`)
    }
    const handler = options.handlers[firstByte as any as keyof MessageHandlers]
    if (handler) {
      return handler(input, { roundingDecimals }) as ReturnTypeOfHandlers<TOptions['handlers']>
    }
    throw new TypeError(`No handler registered for byte ${firstByte} in ${codecName} Codec`)
  }

  return {
    name: codecName,
    encode: options.encodeHandler,
    getChannels: () => options.channels,
    canTryDecode,
    decode,
    adjustMeasuringRange: (name, range) => {
      const channel = options.channels.find(channel => channel.name === name)
      if (!channel) {
        throw new Error(`Channel ${name} not found in ${options.deviceName}TULIP1 Codec`)
      }
      channel.start = range.start
      channel.end = range.end
    },
    adjustRoundingDecimals: (decimals: number) => {
      roundingDecimals = getRoundingDecimals(decimals, roundingDecimals)
    },
  } satisfies Tulip1Codec<TOptions>
}
