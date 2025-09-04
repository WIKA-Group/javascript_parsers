import type { UplinkInput } from '../../schemas'
import type { Channel, GenericUplinkOutput } from '../../types'
import type { Codec } from '../codec'
import { getRoundingDecimals } from '../../utils'
import { checkChannelsValidity } from '../utils'

export interface TULIP1Channel extends Channel {
  channelId: number
}

export type Handler<TChannels extends TULIP1Channel[] = TULIP1Channel[], TReturn extends object = object> = (input: UplinkInput, options: { roundingDecimals: number, channels: TChannels }) => GenericUplinkOutput<TReturn>

export interface MessageHandlers<TChannels extends TULIP1Channel[] = TULIP1Channel[], TReturn extends object = object> {
  0x00?: Handler<TChannels, TReturn>
  0x01?: Handler<TChannels, TReturn>
  0x02?: Handler<TChannels, TReturn>
  0x03?: Handler<TChannels, TReturn>
  0x04?: Handler<TChannels, TReturn>
  0x05?: Handler<TChannels, TReturn>
  0x06?: Handler<TChannels, TReturn>
  0x07?: Handler<TChannels, TReturn>
  0x08?: Handler<TChannels, TReturn>
  0x09?: Handler<TChannels, TReturn>
}

type ReturnTypeOfHandlers<TChannels extends TULIP1Channel[], THandlers extends MessageHandlers<TChannels>> = {
  [K in keyof THandlers]: THandlers[K] extends Handler<TChannels> ? ReturnType<THandlers[K]> : never
}[keyof THandlers]

export interface TULIP1CodecOptions<TChannels extends TULIP1Channel[] = TULIP1Channel[], TName extends string = string, THandlers extends MessageHandlers<TChannels> = MessageHandlers<TChannels>, TEncoder extends (input: object) => number[] = (input: object) => number[]> {
  deviceName: TName
  /**
   * The list of channels to use for this codec.
   * Each channel has a name and a range of values it covers.
   * The name must be unique across all channels.
   */
  channels: TChannels
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
  encodeHandler?: TEncoder
}

export type Tulip1Codec<TChannels extends TULIP1Channel[], TTULIP1CodecOptions extends TULIP1CodecOptions<TChannels>> = Codec<`${TTULIP1CodecOptions['deviceName']}TULIP1`, ReturnTypeOfHandlers<TChannels, TTULIP1CodecOptions['handlers']>, TTULIP1CodecOptions['channels'][number]['name'], TTULIP1CodecOptions['encodeHandler']>

export function defineTULIP1Codec<const TChannels extends TULIP1Channel[], const TOptions extends TULIP1CodecOptions<TChannels> = TULIP1CodecOptions<TChannels>>(options: TOptions): Tulip1Codec<TChannels, TOptions> {
  const codecName = `${options.deviceName}TULIP1` as `${TOptions['deviceName']}TULIP1`

  let roundingDecimals = getRoundingDecimals(options.roundingDecimals)

  checkChannelsValidity(options.channels)

  // as the channels are unique here
  // also check if there are any that have the same id
  options.channels.forEach((channel, index, array) => {
    const duplicate = array.find((c, i) => c.channelId === channel.channelId && i !== index)
    if (duplicate) {
      throw new Error(`Duplicate channel ID found: ${channel.channelId} for channels ${channel.name} and ${duplicate.name} in ${codecName} Codec`)
    }
  })

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
      return handler(input, { roundingDecimals, channels: options.channels as TChannels }) as ReturnTypeOfHandlers<TChannels, TOptions['handlers']>
    }
    throw new TypeError(`No handler registered for byte ${firstByte} in ${codecName} Codec`)
  }

  return {
    name: codecName,
    encode: options.encodeHandler,
    getChannels: () => options.channels.map(c => ({
      end: c.end,
      name: c.name,
      start: c.start,
    })),
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
  } satisfies Tulip1Codec<TChannels, TOptions>
}
