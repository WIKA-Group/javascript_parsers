import type { TULIP2Channel } from '.'

import type { ConfigStatus, ConfigurationStatusTypes, TULIP2ConfigurationStatusUplinkOutput } from '../../schemas/tulip2/types'
import { NETRIS1_COMMANDS } from '../../devices/NETRIS1/parser/tulip2/constants'
import { isDefinedArray, roundValue, slopeValueToValue, TULIPValueToValue } from '../../utils'
import { intTuple2ToUInt16 } from '../tulip3/registers'

export function decodeMainConfigurationResponse<T extends ConfigurationStatusTypes | Omit<ConfigurationStatusTypes, 2> & { 2: 'configuration successful' }>(bytes: number[], configurationStatusTypes: T): { readonly configurationId: number, readonly statusDescription: T[keyof T & number], readonly status: keyof T & number } {
  if (bytes.length < 3) {
    throw new Error(`Configuration status message (0x06) requires at least 3 bytes, but received ${bytes.length} bytes`)
  }

  if (bytes[1] === undefined || bytes[1] === null) {
    throw new Error(`Configuration status message (0x06) requires a configuration ID byte, but received ${bytes[1]}`)
  }
  const configurationId = bytes[1]

  if (bytes[2] === undefined || bytes[2] === null) {
    throw new Error(`Configuration status message (0x06) requires a status byte, but received ${bytes[2]}`)
  }

  function isConfigurationStatusType(
    status: number,
  ): status is keyof T & number {
    return Object.hasOwn(configurationStatusTypes, status)
  }

  // Only bits 7-4 carry the status value; bits 3-0 are reserved
  const statusId = bytes[2] >> 4

  if (!isConfigurationStatusType(statusId)) {
    throw new Error(
      `Unknown configuration status value ${statusId} in configuration status message`,
    )
  }

  const status = configurationStatusTypes[statusId]

  return { configurationId, statusDescription: status, status: statusId } as const
}

export function decodeConfigurationResponse<TChannels extends TULIP2Channel[], T extends Record<number, string> & (ConfigurationStatusTypes | Omit<ConfigurationStatusTypes, 2> & { 2: 'configuration successful' })>(bytes: number[], options: { channels: TChannels, roundingDecimals: number }, configurationStatusTypes: T): Omit<TULIP2ConfigurationStatusUplinkOutput['data'], 'messageType'> {
  if (bytes.length <= 2) {
    throw new Error(`Main configuration response message requires more than 3 bytes, but received ${bytes.length} bytes`)
  }

  const { configurationId, statusDescription, status } = decodeMainConfigurationResponse(bytes, configurationStatusTypes)

  if (bytes.length <= 3 || bytes[3] === undefined || bytes[3] === null) {
    return { configurationId, configurationStatus: { statusDescription, status } }
  }

  const commandTypeByte = bytes[3]

  const baseStatus = { statusDescription, status } as const

  switch (commandTypeByte) {
    case NETRIS1_COMMANDS.GET_MAIN_CONFIG: {
      if (bytes.length < 17) {
        throw new Error(`Get main configuration response requires 17 bytes total, but received ${bytes.length}`)
      }
      const mainConfiguration = parseMainConfigurationData(bytes.slice(4, 17))
      return {
        configurationId,
        configurationStatus: {
          ...baseStatus,
          commandType: NETRIS1_COMMANDS.GET_MAIN_CONFIG,
          commandTypeName: 'get main configuration' as const,
          ...mainConfiguration,
        },
      }
    }
    case NETRIS1_COMMANDS.RESET_BATTERY: {
      return {
        configurationId,
        configurationStatus: {
          ...baseStatus,
          commandType: NETRIS1_COMMANDS.RESET_BATTERY,
          commandTypeName: 'reset battery indicator' as const,
        },
      }
    }
    case NETRIS1_COMMANDS.GET_PROCESS_ALARM: {
      if (bytes.length < 8) {
        throw new Error(`Process alarm configuration response requires at least 8 bytes total, but received ${bytes.length}`)
      }
      const processAlarmConfig = parseProcessAlarmConfigurationData(bytes.slice(4), options)
      return {
        configurationId,
        configurationStatus: {
          ...baseStatus,
          commandType: NETRIS1_COMMANDS.GET_PROCESS_ALARM,
          commandTypeName: 'get process alarm configuration' as const,
          ...processAlarmConfig,
        },
      }
    }
    default:
      throw new Error(`Unknown command type 0x${commandTypeByte.toString(16).padStart(2, '0')} in configuration status message`)
  }
}

type MainConfigStatus = Extract<ConfigStatus, { commandType: 0x04 }>
type MainConfigData = Omit<MainConfigStatus, 'commandType' | 'commandTypeName' | 'status' | 'statusDescription'>

function parseMainConfigurationData(payload: number[]): MainConfigData {
  if (payload.length !== 13) {
    throw new Error(`Main configuration payload requires 13 bytes, but received ${payload.length} bytes`)
  }

  if (!isDefinedArray(payload)) {
    throw new Error(`Main configuration payload contains invalid bytes: ${payload}`)
  }

  const measurementPeriodNoAlarmView = new DataView(
    new Uint8Array(payload.slice(0, 4)).buffer,
  )
  const measurementPeriodNoAlarm = measurementPeriodNoAlarmView.getUint32(0)

  const transmissionMultiplierNoAlarmView = new DataView(
    new Uint8Array(payload.slice(4, 6)).buffer,
  )
  const transmissionMultiplierNoAlarm = transmissionMultiplierNoAlarmView.getUint16(0)

  const measurementPeriodWithAlarmView = new DataView(
    new Uint8Array(payload.slice(6, 10)).buffer,
  )
  const measurementPeriodWithAlarm = measurementPeriodWithAlarmView.getUint32(0)

  const transmissionMultiplierWithAlarmView = new DataView(
    new Uint8Array(payload.slice(10, 12)).buffer,
  )
  const transmissionMultiplierWithAlarm = transmissionMultiplierWithAlarmView.getUint16(0)

  // payload[12] is reserved (0x00)

  return {
    measurementPeriodNoAlarm,
    transmissionMultiplierNoAlarm,
    measurementPeriodWithAlarm,
    transmissionMultiplierWithAlarm,
  }
}

type AlarmConfigStatus = Extract<ConfigStatus, { commandType: 0x40 }>
type AlarmConfigData = Omit<AlarmConfigStatus, 'commandType' | 'commandTypeName' | 'status' | 'statusDescription'>

function parseProcessAlarmConfigurationData<TChannels extends TULIP2Channel[]>(payload: number[], options: { channels: TChannels, roundingDecimals: number }): AlarmConfigData {
  if (payload.length < 4) {
    throw new Error(`Process alarm configuration payload requires at least 4 bytes, but received ${payload.length} bytes`)
  }

  if (options.channels[0] === undefined) {
    throw new Error(`Process alarm configuration parsing requires at least one channel configuration, but received ${options.channels.length} channel configurations`)
  }
  // payload[0] is reserved (always 0x00 for NETRIS1)
  const channelConfig = options.channels[0]

  const deadBandRawView = new DataView(new Uint8Array(payload.slice(1, 3)).buffer)
  const deadBandRaw = deadBandRawView.getUint16(0)
  const deadBand = roundValue(slopeValueToValue(deadBandRaw, channelConfig), options.roundingDecimals)
  const enableByte = payload[3]!

  const lowThreshold = (enableByte & 0x80) !== 0
  const highThreshold = (enableByte & 0x40) !== 0
  const fallingSlope = (enableByte & 0x20) !== 0
  const risingSlope = (enableByte & 0x10) !== 0
  const lowThresholdWithDelay = (enableByte & 0x08) !== 0
  const highThresholdWithDelay = (enableByte & 0x04) !== 0

  const expectedLength = 4
    + (lowThreshold ? 2 : 0)
    + (highThreshold ? 2 : 0)
    + (fallingSlope ? 2 : 0)
    + (risingSlope ? 2 : 0)
    + (lowThresholdWithDelay ? 4 : 0)
    + (highThresholdWithDelay ? 4 : 0)

  if (payload.length !== expectedLength) {
    throw new Error(`Process alarm configuration payload contains an invalid length: ${payload.length}`)
  }

  let byteIndex = 4
  let lowThresholdValue, highThresholdValue, fallingSlopeValue, risingSlopeValue: number | undefined
  let lowThresholdWithDelayValue, lowThresholdWithDelayDelay: number | undefined
  let highThresholdWithDelayValue, highThresholdWithDelayDelay: number | undefined

  if (lowThreshold) {
    lowThresholdValue = roundValue(TULIPValueToValue(intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!]), channelConfig), options.roundingDecimals)
    byteIndex += 2
  }
  if (highThreshold) {
    highThresholdValue = roundValue(TULIPValueToValue(intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!]), channelConfig), options.roundingDecimals)
    byteIndex += 2
  }
  if (fallingSlope) {
    fallingSlopeValue = roundValue(slopeValueToValue(intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!]), channelConfig), options.roundingDecimals)
    byteIndex += 2
  }
  if (risingSlope) {
    risingSlopeValue = roundValue(slopeValueToValue(intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!]), channelConfig), options.roundingDecimals)
    byteIndex += 2
  }
  if (lowThresholdWithDelay) {
    lowThresholdWithDelayValue = roundValue(TULIPValueToValue(intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!]), channelConfig), options.roundingDecimals)
    byteIndex += 2
    lowThresholdWithDelayDelay = intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!])
    byteIndex += 2
  }
  if (highThresholdWithDelay) {
    highThresholdWithDelayValue = roundValue(TULIPValueToValue(intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!]), channelConfig), options.roundingDecimals)
    byteIndex += 2
    highThresholdWithDelayDelay = intTuple2ToUInt16([payload[byteIndex]!, payload[byteIndex + 1]!])
    byteIndex += 2
  }

  return {
    channel: 0 as const,
    channelName: 'measurement' as const,
    deadBand,
    lowThreshold,
    ...(lowThreshold && { lowThresholdValue }),
    highThreshold,
    ...(highThreshold && { highThresholdValue }),
    fallingSlope,
    ...(fallingSlope && { fallingSlopeValue }),
    risingSlope,
    ...(risingSlope && { risingSlopeValue }),
    lowThresholdWithDelay,
    ...(lowThresholdWithDelay && { lowThresholdWithDelayValue, lowThresholdWithDelayDelay }),
    highThresholdWithDelay,
    ...(highThresholdWithDelay && { highThresholdWithDelayValue, highThresholdWithDelayDelay }),
  }
}
