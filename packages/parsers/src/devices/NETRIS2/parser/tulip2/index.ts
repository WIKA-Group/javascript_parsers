import type { EncoderFactory, Handler, MultipleEncoderFactory } from '../../../../codecs/tulip2'
import type {
  NETRIS2TULIP2ConfigurationStatusUplinkOutput,
  NETRIS2TULIP2DataMessageUplinkOutput,
  NETRIS2TULIP2DeviceStatisticsData,
  NETRIS2TULIP2DeviceStatisticsUplinkOutput,
  NETRIS2TULIP2ProcessAlarmsData,
  NETRIS2TULIP2ProcessAlarmsUplinkOutput,
  NETRIS2TULIP2RadioUnitIdentificationData,
  NETRIS2TULIP2RadioUnitIdentificationUplinkOutput,
  NETRIS2TULIP2TechnicalAlarmsData,
  NETRIS2TULIP2TechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2/uplink'
import type { Netris2Tulip2DownlinkInput } from './constants'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { validateTULIP2DownlinkInput } from '../../../../schemas/tulip2/downlink'
import { DEFAULT_ROUNDING_DECIMALS, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import {
  createTULIP2NETRIS2Channels,
  NETRIS2_DOWNLINK_FEATURE_FLAGS,
  NETRIS2_DOWNLINK_SPAN_LIMIT_FACTORS,
} from './constants'
import { NETRIS2TULIP2EncodeHandler } from './encode'
import {
  ALARM_EVENTS,
  CONFIGURATION_STATUS_TYPES,
  NETRIS2_PRODUCT_ID,
  NETRIS2_PRODUCT_SUB_ID,
  PROCESS_ALARM_TYPES,
  TECHNICAL_CAUSE_OF_FAILURE_TYPES,
} from './lookups'

const ERROR_VALUE = 0xFFFF

type TULIP2NETRIS2Channels = ReturnType<typeof createTULIP2NETRIS2Channels>

const handleDataMessage: Handler<TULIP2NETRIS2Channels, NETRIS2TULIP2DataMessageUplinkOutput> = (input, options) => {
  if (input.bytes.length < 5 || input.bytes.length > 7) {
    throw new Error(`Data message (0x01/0x02) requires at least 5 and at most 7 bytes, but received ${input.bytes.length} bytes`)
  }

  const warnings: string[] = []

  const messageType = input.bytes[0]! as 0x01 | 0x02
  const configurationId = input.bytes[1]!
  const channelMask = input.bytes[2]!

  const isChannelMaskValid = [0x00, 0x01, 0x02, 0x03].includes(channelMask)
  if (!isChannelMaskValid) {
    throw new Error(`Data message contains an invalid channel mask: ${channelMask}, expected 0x00, 0x01, 0x02 or 0x03`)
  }

  const channel0Valid = channelMask & 0x01
  const channel1Valid = channelMask & 0x02
  const hasChannel0 = input.bytes.length >= 5
  const hasChannel1 = input.bytes.length >= 7

  interface ChannelData {
    channelId: 0 | 1
    channelName: 'Electrical current1' | 'Electrical current2'
    value: number
  }

  const channels: ChannelData[] = []

  if (hasChannel0 && channel0Valid) {
    const rawValue = (input.bytes[3]! << 8) | input.bytes[4]!
    if (rawValue === ERROR_VALUE) {
      throw new Error('Invalid data for channel - channel 0: 0xffff, 65535')
    }
    const channel = options.channels[0]
    const value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)
    channels.push({
      channelId: 0,
      channelName: 'Electrical current1',
      value,
    })
  }

  if (hasChannel1 && channel1Valid) {
    const rawValue = (input.bytes[5]! << 8) | input.bytes[6]!
    if (rawValue === ERROR_VALUE) {
      throw new Error('Invalid data for channel - channel 1: 0xffff, 65535')
    }
    const channel = options.channels[1]
    const value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)
    channels.push({
      channelId: 1,
      channelName: 'Electrical current2',
      value,
    })
  }

  if (channels.length !== 1 && channels.length !== 2) {
    throw new Error(`Data message must contain 1 or 2 valid channels, but got ${channels.length}`)
  }

  const result: NETRIS2TULIP2DataMessageUplinkOutput = {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels: channels as any,
      },
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleProcessAlarmMessage: Handler<TULIP2NETRIS2Channels, NETRIS2TULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 6 || input.bytes.length % 3 !== 0) {
    throw new Error(`Process alarm message (0x03) requires at least 6 bytes (and target byte count 3n), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const processAlarms: NETRIS2TULIP2ProcessAlarmsData = []
  const warnings: string[] = []

  for (let i = 3; i < input.bytes.length; i += 3) {
    const header = input.bytes[i]!
    const sense = (header & 0b1000_0000) >> 7 as 0 | 1
    const channelId = (header & 0b0111_1000) >> 3 as 0 | 1
    const alarmType = (header & 0b0000_0111) as 0 | 1 | 2 | 3 | 4 | 5

    const rawValue = (input.bytes[i + 1]! << 8) | input.bytes[i + 2]!

    const channel = options.channels.find((candidate): candidate is TULIP2NETRIS2Channels[number] => candidate.channelId === channelId)
    if (!channel) {
      throw new Error(`Channel configuration missing for channelId ${channelId} in process alarm message`)
    }

    let value: number
    if (rawValue === ERROR_VALUE) {
      value = ERROR_VALUE
    }
    else if (alarmType === PROCESS_ALARM_TYPES['falling slope'] || alarmType === PROCESS_ALARM_TYPES['rising slope']) {
      value = roundValue(slopeValueToValue(rawValue, channel), options.roundingDecimals)
    }
    else {
      value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)
    }

    const alarmTypeName = (Object.entries(PROCESS_ALARM_TYPES).find(([, id]) => id === alarmType)?.[0]) as (keyof typeof PROCESS_ALARM_TYPES) | undefined
    const eventName = (Object.entries(ALARM_EVENTS).find(([, id]) => id === sense)?.[0]) as (keyof typeof ALARM_EVENTS) | undefined

    if (!alarmTypeName) {
      throw new Error(`Unknown alarmType ${alarmType} in process alarm message`)
    }
    if (!eventName) {
      throw new Error(`Unknown event ${sense} in process alarm message`)
    }

    processAlarms.push({
      channelId,
      channelName: channel.name,
      event: sense,
      eventName,
      alarmType,
      alarmTypeName,
      value,
    } as NETRIS2TULIP2ProcessAlarmsData[number])

    if (value === ERROR_VALUE) {
      warnings.push(`Invalid data for channel ${channelId}`)
    }
  }

  const result: NETRIS2TULIP2ProcessAlarmsUplinkOutput = {
    data: {
      messageType: 0x03,
      configurationId,
      processAlarms,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleTechnicalAlarmMessage: Handler<TULIP2NETRIS2Channels, NETRIS2TULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length < 4 || input.bytes.length > 5) {
    throw new Error(`Technical alarm message (0x04) requires at least 4 and at most 5 bytes, but received ${input.bytes.length} bytes`)
  }

  const warnings: string[] = []

  const configurationId = input.bytes[1]!
  const bitMask = input.bytes[2]!

  if (![0x01, 0x02, 0x03].includes(bitMask)) {
    throw new Error(`Technical alarm message contains invalid bitMask: ${bitMask}, expected 0x01, 0x02, or 0x03`)
  }

  const requiredBitMaskLength = bitMask === 0x03 ? 5 : 4

  if (input.bytes.length < requiredBitMaskLength) {
    throw new Error(`Technical alarm message with bitMask ${bitMask} needs ${requiredBitMaskLength} bytes but got ${input.bytes.length}`)
  }

  if (input.bytes.length > requiredBitMaskLength) {
    throw new Error(`Technical alarm message expected ${requiredBitMaskLength} bytes for bitMask ${bitMask} but got ${input.bytes.length}`)
  }

  const technicalAlarms: NETRIS2TULIP2TechnicalAlarmsData = []

  const processChannel = (channelId: 0 | 1, byteIndex: number): void => {
    const byte = input.bytes[byteIndex]!
    const sense = (byte & 0b1000_0000) >> 7 as 0 | 1
    const causeOfFailure = (byte & 0b0111_1111) as 0 | 1 | 2 | 3 | 4 | 5

    const eventName = (Object.entries(ALARM_EVENTS).find(([, id]) => id === sense)?.[0]) as (keyof typeof ALARM_EVENTS) | undefined
    if (!eventName) {
      throw new Error(`Unknown sense ${sense} in technical alarm message for channel ${channelId}`)
    }

    const causeOfFailureName = (Object.entries(TECHNICAL_CAUSE_OF_FAILURE_TYPES).find(([, id]) => id === causeOfFailure)?.[0]) as (keyof typeof TECHNICAL_CAUSE_OF_FAILURE_TYPES) | undefined
    if (!causeOfFailureName) {
      throw new Error(`Unknown causeOfFailure ${causeOfFailure} in technical alarm message for channel ${channelId}`)
    }

    const channelName = channelId === 0 ? 'Electrical current1' : 'Electrical current2'

    technicalAlarms.push({
      channelId,
      channelName,
      event: sense,
      eventName,
      causeOfFailure,
      causeOfFailureName,
    } as NETRIS2TULIP2TechnicalAlarmsData[number])
  }

  if (bitMask === 0x01 || bitMask === 0x03) {
    processChannel(0, 3)
  }

  if (bitMask === 0x02 || bitMask === 0x03) {
    const byteIndex = bitMask === 0x03 ? 4 : 3
    processChannel(1, byteIndex)
  }

  const result: NETRIS2TULIP2TechnicalAlarmsUplinkOutput = {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleConfigurationStatusMessage: Handler<TULIP2NETRIS2Channels, NETRIS2TULIP2ConfigurationStatusUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Configuration status message (0x06) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const warnings: string[] = []

  const configurationId = input.bytes[1]!
  const statusId = input.bytes[2]! as keyof typeof CONFIGURATION_STATUS_TYPES

  const validStatuses = [0x20, 0x30, 0x60, 0x70] as const
  if (!validStatuses.includes(statusId)) {
    throw new Error(`Unknown status ${statusId} in configuration status message`)
  }

  const status = CONFIGURATION_STATUS_TYPES[statusId]

  const result: NETRIS2TULIP2ConfigurationStatusUplinkOutput = {
    data: {
      messageType: 0x06,
      configurationId,
      configurationStatus: {
        statusId,
        status,
      },
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleRadioUnitIdentificationMessage: Handler<TULIP2NETRIS2Channels, NETRIS2TULIP2RadioUnitIdentificationUplinkOutput> = (input) => {
  if (input.bytes.length !== 24) {
    throw new Error(`Device identification message (0x07) requires 24 bytes, but received ${input.bytes.length} bytes`)
  }

  const warnings: string[] = []

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!

  if (productId !== NETRIS2_PRODUCT_ID) {
    // product ID also in hex
    throw new Error(`Invalid productId ${productId} in device identification message. Expected ${NETRIS2_PRODUCT_ID} (NETRIS2).`)
  }

  const productSubId = input.bytes[3]!
  if (productSubId !== NETRIS2_PRODUCT_SUB_ID) {
    throw new Error(`Unknown productSubId ${productSubId} in device identification message. Only LoRaWAN (0) is supported.`)
  }

  const radioUnitModemFirmwareVersion = `${input.bytes[4]! >> 4}.${input.bytes[4]! & 0x0F}.${input.bytes[5]}` as `${number}.${number}.${number}`
  const radioUnitModemHardwareVersion = `${input.bytes[6]! >> 4}.${input.bytes[6]! & 0x0F}.${input.bytes[7]}` as `${number}.${number}.${number}`
  const radioUnitFirmwareVersion = `${input.bytes[8]! >> 4}.${input.bytes[8]! & 0x0F}.${input.bytes[9]}` as `${number}.${number}.${number}`
  const radioUnitHardwareVersion = `${input.bytes[10]! >> 4}.${input.bytes[10]! & 0x0F}.${input.bytes[11]}` as `${number}.${number}.${number}`

  const serialNumber = input.bytes
    .slice(12, 23)
    .map(byte => String.fromCharCode(byte))
    .join('')

  const result: NETRIS2TULIP2RadioUnitIdentificationUplinkOutput = {
    data: {
      messageType: 0x07,
      configurationId,
      radioUnitIdentification: {
        productId: NETRIS2_PRODUCT_ID,
        productIdName: 'NETRIS2',
        productSubId: NETRIS2_PRODUCT_SUB_ID,
        productSubIdName: 'standard',
        radioUnitModemFirmwareVersion,
        radioUnitModemHardwareVersion,
        radioUnitFirmwareVersion,
        radioUnitHardwareVersion,
        serialNumber,
      } as NETRIS2TULIP2RadioUnitIdentificationData,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleKeepAliveMessage: Handler<TULIP2NETRIS2Channels, NETRIS2TULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 12) {
    throw new Error(`Keep alive message (0x08) requires 12 bytes, but received ${input.bytes.length} bytes`)
  }

  const warnings: string[] = []

  const configurationId = input.bytes[1]!

  const numberOfMeasurements = (((input.bytes[2]! << 24) >>> 0) + ((input.bytes[3]! << 16) >>> 0) + ((input.bytes[4]! << 8) >>> 0) + input.bytes[5]!) >>> 0
  const numberOfTransmissions = (((input.bytes[6]! << 24) >>> 0) + ((input.bytes[7]! << 16) >>> 0) + ((input.bytes[8]! << 8) >>> 0) + input.bytes[9]!) >>> 0

  const batteryResetSinceLastKeepAlive = !!(input.bytes[10]! & 0b1000_0000)
  const estimatedBatteryPercent = input.bytes[10]! & 0b0111_1111
  const batteryCalculationError = estimatedBatteryPercent === 0x7F
  const radioUnitTemperatureLevel_C = input.bytes[11]!

  const result: NETRIS2TULIP2DeviceStatisticsUplinkOutput = {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        numberOfMeasurements,
        numberOfTransmissions,
        batteryResetSinceLastKeepAlive,
        estimatedBatteryPercent,
        batteryCalculationError,
        radioUnitTemperatureLevel_C,
      } as NETRIS2TULIP2DeviceStatisticsData,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const netris2EncoderFactory: EncoderFactory<Netris2Tulip2DownlinkInput> = (options) => {
  const featureFlags = NETRIS2_DOWNLINK_FEATURE_FLAGS
  return (input: Netris2Tulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, undefined, NETRIS2_DOWNLINK_SPAN_LIMIT_FACTORS)
    return NETRIS2TULIP2EncodeHandler(validated)
  }
}

const netris2MultipleEncodeFactory: MultipleEncoderFactory<Netris2Tulip2DownlinkInput> = (options) => {
  const featureFlags = NETRIS2_DOWNLINK_FEATURE_FLAGS
  return (input: Netris2Tulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, undefined, NETRIS2_DOWNLINK_SPAN_LIMIT_FACTORS)
    return NETRIS2TULIP2EncodeHandler(validated, true)
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRIS2TULIP2Codec() {
  return defineTULIP2Codec({
    deviceName: 'NETRIS2',
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createTULIP2NETRIS2Channels(),
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleTechnicalAlarmMessage,
      0x06: handleConfigurationStatusMessage,
      0x07: handleRadioUnitIdentificationMessage,
      0x08: handleKeepAliveMessage,
    },
    encoderFactory: netris2EncoderFactory,
    multipleEncodeFactory: netris2MultipleEncodeFactory,
  })
}
