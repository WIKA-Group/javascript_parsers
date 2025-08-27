import type { UplinkInput } from '../schemas'
import type { Channel, GenericUplinkOutput } from '../types'

export interface Codec<TCodecName extends string, TData extends GenericUplinkOutput<object>, TChannelName extends string, TEncoder extends (input: object) => number[]> {
  name: TCodecName

  adjustRoundingDecimals: (decimals: number) => void
  adjustMeasuringRange: (name: TChannelName, range: { start: number, end: number }) => void
  getChannels: () => Channel[]

  canTryDecode: (input: UplinkInput) => boolean
  decode: (input: UplinkInput) => TData
  /**
   * How to encode the data for downlink messages.
   * Input should be typed AND validated via a schema.
   * @param input The input data to encode.
   * @returns The encoded byte array.
   */
  encode: TEncoder
}

export type AnyCodec = Codec<any, any, any, any>
