import type { UplinkInput } from '../../schemas'
import type { Channel, DownlinkOutput, GenericUplinkOutput, MultipleDownlinkOutput } from '../../types'
import type { Codec } from '../codec'
import { getRoundingDecimals } from '../../utils'
import { checkChannelsValidity } from '../utils'

export interface TULIP2Channel extends Channel {
  channelId: number
}

export type Encoder<TInput = any> = (input: TInput) => DownlinkOutput

export type MultipleEncoder<TInput = any> = (input: TInput) => MultipleDownlinkOutput

export type EncoderFactory<TInput = any> = (options: { getChannels: () => TULIP2Channel[] }) => Encoder<TInput>

export type MultipleEncoderFactory<TInput = any> = (options: { getChannels: () => TULIP2Channel[] }) => MultipleEncoder<TInput>

type ReturnOfFactory<TFactory extends EncoderFactory<any> | MultipleEncoderFactory<any> | undefined> = TFactory extends (...args: any[]) => infer TResult ? TResult : undefined

export type Handler<TChannels extends TULIP2Channel[] = TULIP2Channel[], TReturn extends GenericUplinkOutput = GenericUplinkOutput> = (input: UplinkInput, options: { roundingDecimals: number, channels: TChannels }) => TReturn

export interface MessageHandlers<TChannels extends TULIP2Channel[] = TULIP2Channel[], TReturn extends GenericUplinkOutput = GenericUplinkOutput> {
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

export type ReturnTypeOfHandlers<TChannels extends TULIP2Channel[], THandlers extends MessageHandlers<TChannels, any>> = {
  [K in keyof THandlers]: THandlers[K] extends Handler<TChannels, infer TReturn> ? TReturn : never
}[keyof THandlers]

export interface TULIP2CodecOptions<TChannels extends TULIP2Channel[] = TULIP2Channel[], TName extends string = string, THandlers extends MessageHandlers<TChannels> = MessageHandlers<TChannels>, TEncoderFactory extends EncoderFactory<any> | undefined = undefined, TMultipleEncoderFactory extends MultipleEncoderFactory<any> | undefined = undefined> {
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
  encoderFactory?: TEncoderFactory

  /**
   * The multiple message encoding function for this codec.
   */
  multipleEncodeFactory?: TMultipleEncoderFactory
}

type TULIP2AdjustableChannelNames<TChannels extends TULIP2Channel[]> = {
  [K in keyof TChannels]: TChannels[K] extends TULIP2Channel ? (TChannels[K]['adjustMeasurementRangeDisallowed'] extends true ? never : TChannels[K]['name']) : never
}[number]

export type TULIP2Codec<TChannels extends TULIP2Channel[], TName extends string, THandlers extends MessageHandlers<TChannels>, TEncoderFactory extends EncoderFactory<any> | undefined = undefined, TMultipleEncoderFactory extends MultipleEncoderFactory<any> | undefined = undefined> = Codec<`${TName}TULIP2`, ReturnTypeOfHandlers<TChannels, THandlers>, TULIP2AdjustableChannelNames<TChannels>, ReturnOfFactory<TEncoderFactory>, ReturnOfFactory<TMultipleEncoderFactory>>

/**
 * Creates a TULIP2 protocol codec for decoding and encoding IoT device messages.
 *
 * TULIP2 is a protocol that uses the first byte (0x00-0x09) as a message type identifier,
 * followed by payload data. Each message type is handled by a specific handler function.
 *
 *
 * @param options - Configuration object for the TULIP2 codec, see {@link TULIP2CodecOptions}
 *
 * @returns A fully configured TULIP2 codec with decode, encode, and adjustment capabilities
 *
 * @throws {Error} When channel names are duplicated
 * @throws {Error} When channel IDs are duplicated
 * @throws {Error} When channel ranges are invalid (start >= end)
 *
 * @example
 * ```typescript
 * // Define channels with unique names and IDs
 * const defineChannels () =>  ([
 *   { name: 'temperature', start: -40, end: 125, channelId: 0 },
 *   { name: 'humidity', start: 0, end: 100, channelId: 1 }
 * ] as const);
 *
 * // Define message handlers
 * const handlers = {
 *   0x01: (input, { roundingDecimals, channels }) => ({
 *     data: { temperature: 22.5, timestamp: Date.now() }
 *   }),
 *   0x02: (input, { roundingDecimals, channels }) => ({
 *     data: { humidity: 55.0, timestamp: Date.now() }
 *   })
 * };
 *
 * // Create codec
 * const codec = defineTULIP2Codec({
 *   deviceName: 'SensorDevice',
 *   channels: defineChannels(),
 *   handlers,
 *   encodeHandler: (data) => [0x01, 0x42] // Optional encoder
 * });
 * ```
 *
 * @warning **ANTI-PATTERN**: Do not reuse the same channel array reference across multiple codec instances.
 * The channels array is mutated when `adjustMeasuringRange` is called, which can cause unexpected
 * behavior when multiple parsers share the same channel references. Always create fresh channel
 * arrays for each codec instance to avoid channel pollution:
 *
 * ```typescript
 * // ❌ WRONG - Reusing channel reference
 * const sharedChannels = [{ name: 'temp', start: 0, end: 100, channelId: 0 }];
 * const codec1 = defineTULIP2Codec({ channels: sharedChannels, ... });
 * const codec2 = defineTULIP2Codec({ channels: sharedChannels, ... }); // Will share mutations!
 *
 * // ✅ CORRECT - Fresh channel arrays
 * const codec1 = defineTULIP2Codec({
 *   channels: [{ name: 'temp', start: 0, end: 100, channelId: 0 }], ...
 * });
 * const codec2 = defineTULIP2Codec({
 *   channels: [{ name: 'temp', start: 0, end: 100, channelId: 0 }], ...
 * });
 * ```
 *
 * @see {@link TULIP2CodecOptions} for detailed options interface
 * @see {@link MessageHandlers} for handler function signatures
 * @see {@link TULIP2Channel} for channel configuration interface
 */
export function defineTULIP2Codec<const TChannels extends TULIP2Channel[], TName extends string, THandlers extends MessageHandlers<TChannels>, TEncoderFactory extends EncoderFactory<any> | undefined = undefined, TMultipleEncoderFactory extends MultipleEncoderFactory<any> | undefined = undefined>(options: TULIP2CodecOptions<TChannels, TName, THandlers, TEncoderFactory, TMultipleEncoderFactory>): TULIP2Codec<TChannels, TName, THandlers, TEncoderFactory, TMultipleEncoderFactory> {
  const codecName = `${options.deviceName}TULIP2` as `${TName}TULIP2`

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
      return handler(input, { roundingDecimals, channels: options.channels as TChannels }) as ReturnTypeOfHandlers<TChannels, THandlers>
    }
    throw new TypeError(`No handler registered for byte ${firstByte} in ${codecName} Codec`)
  }

  function getChannels(): Channel[] {
    return options.channels.map(c => ({
      end: c.end,
      name: c.name,
      start: c.start,
      ...(c.adjustMeasurementRangeDisallowed ? { adjustMeasurementRangeDisallowed: true as const } : {}),
    }))
  }

  const codec = {
    name: codecName,
    getChannels,
    canTryDecode,
    decode,
    adjustMeasuringRange: (name, range) => {
      const channel = options.channels.find(channel => channel.name === name)
      if (!channel) {
        throw new Error(`Channel ${name} not found in ${options.deviceName}TULIP2 Codec`)
      }
      channel.start = range.start
      channel.end = range.end
    },
    adjustRoundingDecimals: (decimals: number) => {
      roundingDecimals = getRoundingDecimals(decimals, roundingDecimals)
    },
  } as TULIP2Codec<TChannels, TName, THandlers, TEncoderFactory, TMultipleEncoderFactory>

  if (options.encoderFactory) {
    // @ts-expect-error - TS cannot infer correctly here
    codec.encode = options.encoderFactory({ getChannels: () => options.channels }) as ReturnOfFactory<TEncoderFactory>
  }
  if (options.multipleEncodeFactory) {
    // @ts-expect-error - TS cannot infer correctly here
    codec.encodeMultiple = options.multipleEncodeFactory({ getChannels: () => options.channels }) as ReturnOfFactory<TMultipleEncoderFactory>
  }

  return codec
}
