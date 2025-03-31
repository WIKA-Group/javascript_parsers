import * as v from 'valibot'

/** CONSTANTS */

const DEFAULT_ROUNDING_DECIMALS = 4

/** END CONSTANTS */

/**
 * @asType integer
 * @minimum 1
 * @maximum 224
 */
export type fPort = number

export interface ChannelMeasurement {
  channelId: number
  value: number
  channelName: string
}

export interface UplinkInput {
  /**
   * The uplink payload byte array, where each byte is represented by an integer between 0 and 255.
   *  @format: integer[]
   */
  bytes: number[

  ]
  /**
   * The uplink message LoRaWAN `fPort`
   * @format: int
   */
  fPort: fPort
  /**
   * ISO 8601 string representation of the time the message was received by the network server.
   */
  recvTime?: string
}

export interface DownlinkOutputSuccessful extends BaseMessage {
  /**
   * The uplink payload byte array, where each byte is represented by an integer between 0 and 255.
   *  @format: integer[]
   */
  bytes: number[]
  /**
   * The uplink message LoRaWAN `fPort`
   * @format: int
   */
  fPort: fPort
}

export type OutputError = string
export type OutputWarning = string

export interface OutputFailure {
  /**
   * A list of error messages while decoding the provided payload.
   */
  errors: OutputError[]
}

export interface BaseMessage {
  warnings?: OutputWarning[]
}

export interface BaseData<TMessage extends number = number> {
  messageType: TMessage

  configurationId: number
}

/**
 * Converts an array of numbers to an array of bytes.
 * @param numbers The numbers to convert
 * @returns The byte array
 * @example
 * numbersToIntArray([0x1234, 0x5678]) // [0x12, 0x34, 0x56, 0x78]
 */
export function numbersToIntArray(numbers: {
  value: number
  bytes: number
}[]): number[] {
  return numbers.map(({ value, bytes }) => numberToIntArray(value, bytes)).flat()
}
/**
 * Converts a number to an array of bytes.
 * The function does not do type checking, so make sure to pass a valid uInt.
 * Otherwise there will be unexpected results.
 * Negative numbers are not supported
 * @param value The number to convert
 * @param byteLength The number of bytes
 * @returns The byte array
 * @example
 * numberToIntArray(0x1234, 2) // [0x12, 0x34]
 * numberToIntArray(2, 2) // [0x00, 0x02]
 */
export function numberToIntArray(value: number, byteLength: number): number[] {
  const hexString = value.toString(16).padStart(byteLength * 2, '0')
  const arr: number[] = Array.from({ length: byteLength })
  let i = 0
  let j = 0
  while (i < hexString.length) {
    arr[j] = Number.parseInt(hexString.slice(i, i + 2), 16)
    i += 2
    j++
  }
  return arr
}

export interface Channel {
  name: string
  start: number
  end: number
  span: number
}

export interface ParserConfig {
  deviceName: string
  channels: Omit<Channel, 'span'>[]
  /**
   * The number of decimal places to round the measurements to.
   * Falls back to 4 if invalid or not provided.
   * @default 4
   */
  roundingDecimals?: number
}

// eslint-disable-next-line ts/explicit-function-return-type
export function useBaseParser(config: ParserConfig) {
  const DEVICE_NAME = config.deviceName

  // create shared schema for rounding decimals
  const roundingDecimalsSchema = v.pipe(v.number(), v.integer(), v.minValue(0))

  // Default to 3 decimal places
  let ROUNDING_DECIMALS = v.parse(v.fallback(roundingDecimalsSchema, DEFAULT_ROUNDING_DECIMALS), config.roundingDecimals)

  //
  // Common Utils
  //

  /**
   * Adjust the number of decimal places to round the measurements to.
   * Falls back to the previous value if invalid or not provided.
   * @param newDecimals The new number of decimal places
   */
  function adjustRoundingDecimals(newDecimals: number): void {
    ROUNDING_DECIMALS = v.parse(v.fallback(roundingDecimalsSchema, ROUNDING_DECIMALS), newDecimals)
  }

  function roundValue(value: number): number {
    const factor = 10 ** ROUNDING_DECIMALS
    return Math.round(value * factor) / factor
  }

  function createErrorMessage(newErrors: OutputError[]): OutputFailure {
    return {
      errors: newErrors.map(error => `${DEVICE_NAME} (JS): ${error}`),
    }
  }

  function addWarningMessages(existingWarnings: OutputWarning[], newWarnings: OutputWarning[]): void {
    newWarnings.forEach((warning) => {
      existingWarnings.push(`${DEVICE_NAME} (JS): ${warning}`)
    })
  }

  //
  // Parsing Utils
  //

  /**
   * Validate the input object
   * @param input The input object to validate
   * @returns The validated input object or an error object
   */
  function validateUplinkInput(input: unknown): UplinkInput | OutputFailure {
    const inputSchema = v.object({
      bytes: v.array(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255))),
      fPort: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(255)),
      recvTime: v.optional(v.string()),
    })

    const res = v.safeParse(inputSchema, input)

    if (!res.success) {
      // TODO: better error message
      return createErrorMessage(res.issues.map(issue => issue.message))
    }

    return res.output
  }

  function checkSemVerVersions(semVers: string[]): OutputWarning[] | null {
    const warnings: OutputWarning[] = []

    for (const semVer of semVers) {
      const parts = semVer.split('.')
      if (parts.length !== 3) {
        warnings.push(`Invalid semantic version format: ${semVer}`)
        return warnings
      }

      const [majorStr, minorStr, patchStr] = parts
      const major = Number.parseInt(majorStr!)
      const minor = Number.parseInt(minorStr!)
      const patch = Number.parseInt(patchStr!)

      // Check if the parsed int, when converted back to a string, matches the original string
      // This ensures the part was a valid integer
      if (major.toString() !== majorStr || minor.toString() !== minorStr || patch.toString() !== patchStr) {
        warnings.push(`Semantic version contains non-integer value: ${semVer}`)
        return warnings
      }

      if (major < 0 || major > 16) {
        warnings.push(`Major version ${major} is out of range for semver ${semVer}`)
      }
      if (minor < 0 || minor > 16) {
        warnings.push(`Minor version ${minor} is out of range for semver ${semVer}`)
      }
      if (patch < 0 || patch > 255) {
        warnings.push(`Patch version ${patch} is out of range for semver ${semVer}`)
      }
    }

    return warnings.length > 0 ? warnings : null
  }

  //
  // Measurement Utils
  //

  const channels: Channel[] = config.channels.map(channel => ({
    name: channel.name,
    start: channel.start,
    end: channel.end,
    span: channel.end - channel.start,
  }))

  function getChannel(channelId: number): Channel | OutputError {
    const channel = channels[channelId]
    if (!channel) {
      return `Channel ${channel} is not defined in the configuration`
    }
    return channel
  }

  // TODO: is not really easy for the user to change ranges of specific channels
  // Better: Switch to object {
  // 1: { start: 0, end: 100 },
  // }
  // Or even better: use function syntax to pass the user the specific channel and he can change it
  // ! dont give direct access but give him an object that can later be integrated
  function adjustMeasurementRange(channelId: number, newBounds: Pick<Channel, 'start' | 'end'>): void | OutputError {
    const channel = getChannel(channelId)
    if (typeof channel === 'string')
      return channel
    channel.start = newBounds.start
    channel.end = newBounds.end
    channel.span = newBounds.end - newBounds.start
  }

  /**
   * Get an adjusted value for a given channel for a given measurement
   * @param channelId The channel ID
   * @param value The measurement value
   */
  function getRealMeasurementValue(channelId: number, value: number): number | OutputError {
    const channel = getChannel(channelId)
    if (typeof channel === 'string')
      return channel
    const realVal = ((value - 2_500) / 10_000) * channel.span + channel.start
    const roundedVal = roundValue(realVal)
    return roundedVal
  }

  function getRealSlopeValue(channelId: number, value: number): number | OutputError {
    const channel = getChannel(channelId)
    if (typeof channel === 'string')
      return channel
    const realVal = (value / 10_000) * channel.span
    const roundedVal = roundValue(realVal)
    return roundedVal
  }

  function createChannelData(channelId: number, value: number): ChannelMeasurement | OutputError {
    const v = getRealMeasurementValue(channelId, value)

    if (typeof v === 'string')
      return v
    const channelName = (getChannel(channelId) as Channel).name
    return {
      channelId,
      value: v,
      channelName,
    }
  }

  return {
    validateUplinkInput,
    adjustRoundingDecimals,
    createErrorMessage,
    addWarningMessages,
    createChannelData,
    checkSemVerVersions,
    getRealSlopeValue,
    getRealMeasurementValue,
    adjustMeasurementRange,
  }
}
