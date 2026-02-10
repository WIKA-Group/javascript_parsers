import type { UplinkInput } from '../schemas'
import type { Channel, DownlinkOutput, GenericUplinkOutput, MultipleDownlinkOutput } from '../types'

export type Codec<TProtocol extends string, TCodecName extends string, TData extends GenericUplinkOutput, TChannelName extends string | never, TEncoder extends (((input: any) => DownlinkOutput) | undefined) = undefined, TMultipleEncoder extends (((input: any) => MultipleDownlinkOutput) | undefined) = undefined> = {
  name: TCodecName
  protocol: TProtocol

  adjustRoundingDecimals: (decimals: number) => void
  adjustMeasuringRange: (name: TChannelName, range: { start: number, end: number }) => void
  getChannels: () => Channel[]

  canTryDecode: (input: UplinkInput) => boolean
  decode: (input: UplinkInput) => TData

// eslint-disable-next-line ts/no-empty-object-type
} & (undefined extends TEncoder ? {} : { encode: TEncoder })
// eslint-disable-next-line ts/no-empty-object-type
& (undefined extends TMultipleEncoder ? {} : { encodeMultiple: TMultipleEncoder })

export type AnyCodec = Codec<any, any, any, never, any, any> & { encode?: (input: any) => DownlinkOutput, encodeMultiple?: (input: any) => MultipleDownlinkOutput } | Codec<any, any, never, any, any, any> & { encode?: (input: any) => DownlinkOutput, encodeMultiple?: (input: any) => MultipleDownlinkOutput }
