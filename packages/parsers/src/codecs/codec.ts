import type { UplinkInput } from '../schemas'
import type { Channel, GenericUplinkOutput } from '../types'

export type Codec<TCodecName extends string, TData extends GenericUplinkOutput<object>, TChannelName extends string, TEncoder extends (((input: any) => number[]) | undefined) = undefined> = {
  name: TCodecName

  adjustRoundingDecimals: (decimals: number) => void
  adjustMeasuringRange: (name: TChannelName, range: { start: number, end: number }) => void
  getChannels: () => Channel[]

  canTryDecode: (input: UplinkInput) => boolean
  decode: (input: UplinkInput) => TData

// eslint-disable-next-line ts/no-empty-object-type
} & (undefined extends TEncoder ? {} : { encode: TEncoder })

export type AnyCodec = Codec<any, any, any, any> & { encode?: (input: any) => number[] }
