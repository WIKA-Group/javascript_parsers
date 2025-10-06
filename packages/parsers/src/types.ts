export type MappedChannels<Type> = Record<`channel${number}`, Type>

export interface GenericSuccessfulUplinkOutput {
  warnings?: string[]
  data: object
  errors?: never
}

export interface GenericFailureUplinkOutput {
  errors: string[]
  warnings?: never
  data?: never
}

export type GenericUplinkOutput<TData extends GenericSuccessfulUplinkOutput = GenericSuccessfulUplinkOutput> = TData | GenericFailureUplinkOutput

export interface Range {
  start: number
  end: number
}

export interface Channel<TName extends string = string> extends Range {
  adjustMeasurementRangeDisallowed?: true
  name: TName
}

declare const __brand: unique symbol
interface Brand<B> { [__brand]: B }
export type Branded<T, B> = T & Brand<B>

type ParseInt<T extends string>
  = T extends `${infer Digit extends number}`
  //                         ^^^^^^^^^^^^^^
  //                         key element
    ? Digit
    : never

type ReverseString<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${ReverseString<Rest>}${First}`
  : ''

// Tail-recursive helper for removing leading zeros
type RemoveLeadingZerosHelper<S extends string>
  = S extends `0${infer Rest}`
    ? Rest extends ''
      ? '0' // String is all zeros, return '0'
      : RemoveLeadingZerosHelper<Rest>
    : S // No leading zero, return as-is

// Main type that uses the tail-recursive helper
type RemoveLeadingZeros<S extends string>
  = S extends '0'
    ? S // Single '0' stays as '0'
    : RemoveLeadingZerosHelper<S>

type PutSign<S extends string> = `-${S}`

// `S` is a reversed string representing some number, e.g., "0321" instead of 1230
type InternalMinusOne<S extends string>
  = S extends `${infer Digit extends number}${infer Rest}`
    ? Digit extends 0
      ? `9${InternalMinusOne<Rest>}`
      : `${[9, 0, 1, 2, 3, 4, 5, 6, 7, 8][Digit]}${Rest}`
    : never

type InternalPlusOne<S extends string> = S extends '9'
  ? '01'
  : S extends `${infer Digit extends number}${infer Rest}`
    ? Digit extends 9
      ? `0${InternalPlusOne<Rest>}`
      : `${[1, 2, 3, 4, 5, 6, 7, 8, 9][Digit]}${Rest}`
    : never

export type MinusOne<T extends number> = T extends 0
  ? -1 // T = 0
  : `${T}` extends `-${infer Abs}`
    ? ParseInt<PutSign<ReverseString<InternalPlusOne<ReverseString<Abs>>>>> // T < 0
// T > 0
    : ParseInt<
      RemoveLeadingZeros<ReverseString<InternalMinusOne<ReverseString<`${T}`>>>>
    >
