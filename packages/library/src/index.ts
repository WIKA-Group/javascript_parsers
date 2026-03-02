import type { HexUplinkInput, UplinkInput } from '../../parsers/src/schemas'
import type { DownlinkOutput, GenericUplinkOutputFailure, MultipleDownlinkOutput, MultipleDownlinkOutputFailure } from '../../parsers/src/types'
import A2GParser from '../../parsers/src/devices/A2G/parser'
import FLRUParser from '../../parsers/src/devices/FLRU_NETRIS3/parser'
import GD20WParser from '../../parsers/src/devices/GD20W/parser'
import NETRIS1Parser from '../../parsers/src/devices/NETRIS1/parser'
import NETRIS2Parser from '../../parsers/src/devices/NETRIS2/parser'
import NETRISFParser from '../../parsers/src/devices/NETRISF/parser'
import PEUParser from '../../parsers/src/devices/PEU_NETRIS3/parser'
import PEWParser from '../../parsers/src/devices/PEW/parser'
import PGUParser from '../../parsers/src/devices/PGU_NETRIS3/parser'
import PGW23Parser from '../../parsers/src/devices/PGW23_100_11/parser'
import TGUParser from '../../parsers/src/devices/TGU_NETRIS3/parser'
import TRUParser from '../../parsers/src/devices/TRU_NETRIS3/parser'
import TRWParser from '../../parsers/src/devices/TRW/parser'

export {
  A2GParser,
  FLRUParser,
  GD20WParser,
  NETRIS1Parser,
  NETRIS2Parser,
  NETRISFParser,
  PEUParser,
  PEWParser,
  PGUParser,
  PGW23Parser,
  TGUParser,
  TRUParser,
  TRWParser,
}

// IMPORTANT: info why this is done like this

type Prettify<T> = {
  [K in keyof T]: [Extract<T[K], object>] extends [never] ? T[K] : Prettify<Extract<T[K], object>> | Exclude<T[K], object>
} & {}

type InferGenericSuccessfulUplinkData<T> = T extends { data: object } ? T : never

// generic inputs and outputs
export type DecodeUplinkInput = UplinkInput
export type DecodeUplinkFailureOutput = GenericUplinkOutputFailure
export type DecodeHexUplinkInput = HexUplinkInput
export type DecodeHexUplinkFailureOutput = GenericUplinkOutputFailure

export type EncodeDownlinkOutput = DownlinkOutput
export type EncodeDownlinkFailureOutput = GenericUplinkOutputFailure
export type EncodeMultipleDownlinksOutput = MultipleDownlinkOutput
export type EncodeMultipleDownlinksFailureOutput = MultipleDownlinkOutputFailure

// NETRISF
export type NETRISFDecodeUplinkOutput = ReturnType<ReturnType<typeof NETRISFParser>['decodeUplink']>
export type NETRISFDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<NETRISFDecodeUplinkOutput>
export type NETRISFDecodeHexUplinkOutput = ReturnType<ReturnType<typeof NETRISFParser>['decodeHexUplink']>
export type NETRISFDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<NETRISFDecodeHexUplinkOutput>
// FLRU_NETRIS3

export type FLRUNETRIS3DecodeUplinkgOutput = ReturnType<ReturnType<typeof FLRUParser>['decodeUplink']>
export type FLRUNETRIS3DecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<FLRUNETRIS3DecodeUplinkgOutput>
export type FLRUNETRIS3DecodeHexUplinkOutput = ReturnType<ReturnType<typeof FLRUParser>['decodeHexUplink']>
export type FLRUNETRIS3DecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<FLRUNETRIS3DecodeHexUplinkOutput>
// downlink input
export type FLRUNETRIS3EncodeTULIP2DownLinkInput = Prettify<Extract<Parameters<ReturnType<typeof FLRUParser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type FLRUNETRIS3EncodeTULIP3DownLinkInput = Prettify<Extract<Parameters<ReturnType<typeof FLRUParser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type FLRUNETRIS3EncodeTULIP2MultipleDownlinksInput = Prettify<Extract<Parameters<ReturnType<typeof FLRUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type FLRUNETRIS3EncodeTULIP3MultipleDownlinksInput = Prettify<Extract<Parameters<ReturnType<typeof FLRUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// GD20W
export type GD20WDecodeUplinkOutput = ReturnType<ReturnType<typeof GD20WParser>['decodeUplink']>
export type GD20WDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<GD20WDecodeUplinkOutput>
export type GD20WDecodeHexUplinkOutput = ReturnType<ReturnType<typeof GD20WParser>['decodeHexUplink']>
export type GD20WDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<GD20WDecodeHexUplinkOutput>

// NETRIS1
export type NETRIS1DecodeUplinkOutput = ReturnType<ReturnType<typeof NETRIS1Parser>['decodeUplink']>
export type NETRIS1DecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<NETRIS1DecodeUplinkOutput>
export type NETRIS1DecodeHexUplinkOutput = ReturnType<ReturnType<typeof NETRIS1Parser>['decodeHexUplink']>
export type NETRIS1DecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<NETRIS1DecodeHexUplinkOutput>

export type NETRIS1TULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof NETRIS1Parser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type NETRIS1TULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof NETRIS1Parser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type NETRIS1TULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof NETRIS1Parser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type NETRIS1TULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof NETRIS1Parser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// NETRIS2
export type NETRIS2DecodeUplinkOutput = ReturnType<ReturnType<typeof NETRIS2Parser>['decodeUplink']>
export type NETRIS2DecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<NETRIS2DecodeUplinkOutput>
export type NETRIS2DecodeHexUplinkOutput = ReturnType<ReturnType<typeof NETRIS2Parser>['decodeHexUplink']>
export type NETRIS2DecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<NETRIS2DecodeHexUplinkOutput>

export type NETRIS2TULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof NETRIS2Parser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type NETRIS2TULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof NETRIS2Parser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type NETRIS2TULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof NETRIS2Parser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type NETRIS2TULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof NETRIS2Parser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// PEU
export type PEUDecodeUplinkOutput = ReturnType<ReturnType<typeof PEUParser>['decodeUplink']>
export type PEUDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PEUDecodeUplinkOutput>
export type PEUDecodeHexUplinkOutput = ReturnType<ReturnType<typeof PEUParser>['decodeHexUplink']>
export type PEUDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PEUDecodeHexUplinkOutput>

export type PEUTULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof PEUParser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type PEUTULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof PEUParser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type PEUTULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof PEUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type PEUTULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof PEUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// PEW
export type PEWDecodeUplinkOutput = ReturnType<ReturnType<typeof PEWParser>['decodeUplink']>
export type PEWDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PEWDecodeUplinkOutput>
export type PEWDecodeHexUplinkOutput = ReturnType<ReturnType<typeof PEWParser>['decodeHexUplink']>
export type PEWDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PEWDecodeHexUplinkOutput>

export type PEWTULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof PEWParser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type PEWTULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof PEWParser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type PEWTULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof PEWParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type PEWTULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof PEWParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// PGU_NETRIS3
export type PGUDecodeUplinkOutput = ReturnType<ReturnType<typeof PGUParser>['decodeUplink']>
export type PGUDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PGUDecodeUplinkOutput>
export type PGUDecodeHexUplinkOutput = ReturnType<ReturnType<typeof PGUParser>['decodeHexUplink']>
export type PGUDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PGUDecodeHexUplinkOutput>

export type PGUTULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof PGUParser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type PGUTULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof PGUParser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type PGUTULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof PGUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type PGUTULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof PGUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// PGW23.100.11
export type PGW23DecodeUplinkOutput = ReturnType<ReturnType<typeof PGW23Parser>['decodeUplink']>
export type PGW23DecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PGW23DecodeUplinkOutput>
export type PGW23DecodeHexUplinkOutput = ReturnType<ReturnType<typeof PGW23Parser>['decodeHexUplink']>
export type PGW23DecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<PGW23DecodeHexUplinkOutput>

// TGU_NETRIS3
export type TGUDecodeUplinkOutput = ReturnType<ReturnType<typeof TGUParser>['decodeUplink']>
export type TGUDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<TGUDecodeUplinkOutput>
export type TGUDecodeHexUplinkOutput = ReturnType<ReturnType<typeof TGUParser>['decodeHexUplink']>
export type TGUDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<TGUDecodeHexUplinkOutput>

export type TGUTULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof TGUParser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type TGUTULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof TGUParser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type TGUTULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof TGUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type TGUTULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof TGUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// TRU_NETRIS3
export type TRUDecodeUplinkOutput = ReturnType<ReturnType<typeof TRUParser>['decodeUplink']>
export type TRUDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<TRUDecodeUplinkOutput>
export type TRUDecodeHexUplinkOutput = ReturnType<ReturnType<typeof TRUParser>['decodeHexUplink']>
export type TRUDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<TRUDecodeHexUplinkOutput>

export type TRUTULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof TRUParser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type TRUTULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof TRUParser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type TRUTULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof TRUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type TRUTULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof TRUParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>

// TRW
export type TRWDecodeUplinkOutput = ReturnType<ReturnType<typeof TRWParser>['decodeUplink']>
export type TRWDecodeUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<TRWDecodeUplinkOutput>
export type TRWDecodeHexUplinkOutput = ReturnType<ReturnType<typeof TRWParser>['decodeHexUplink']>
export type TRWDecodeHexUplinkSuccessfulOutput = InferGenericSuccessfulUplinkData<TRWDecodeHexUplinkOutput>

export type TRWTULIP2EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof TRWParser>['encodeDownlink']>[0], { protocol: 'TULIP2' }>['input']>
export type TRWTULIP3EncodeDownlink = Prettify<Extract<Parameters<ReturnType<typeof TRWParser>['encodeDownlink']>[0], { protocol: 'TULIP3' }>['input']>
export type TRWTULIP2EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof TRWParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP2' }>['input']>
export type TRWTULIP3EncodeMultipleDownlinks = Prettify<Extract<Parameters<ReturnType<typeof TRWParser>['encodeMultipleDownlinks']>[0], { protocol: 'TULIP3' }>['input']>
