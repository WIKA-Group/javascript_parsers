import type { EncoderFactory, Handler, MultipleEncoderFactory } from '../../../../codecs/tulip2'
import type { PEWTULIP2ChannelPropertyConfigurationUplinkOutput, PEWTULIP2ConfigurationStatusUplinkOutput, PEWTULIP2DataMessageUplinkOutput, PEWTULIP2DeviceAlarmsData, PEWTULIP2DeviceAlarmsUplinkOutput, PEWTULIP2DeviceInformationData, PEWTULIP2DeviceInformationUplinkOutput, PEWTULIP2DeviceStatisticsData, PEWTULIP2DeviceStatisticsUplinkOutput, PEWTULIP2MainConfigurationUplinkOutput, PEWTULIP2ProcessAlarmConfigurationUplinkOutput, PEWTULIP2ProcessAlarmsData, PEWTULIP2ProcessAlarmsUplinkOutput, PEWTULIP2TechnicalAlarmsData, PEWTULIP2TechnicalAlarmsUplinkOutput } from '../../schema/tulip2'
import type { PewTulip2Channels, PewTulip2DownlinkInput } from './constants'
import { PEW_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { intTuple2ToUInt16 } from '../../../../codecs/tulip3/registers'
import { createDownlinkResetBatteryIndicatorSchema, validateTULIP2DownlinkInput } from '../../../../schemas/tulip2/downlink'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createPEWTULIP2DropConfigurationSchema, createPEWTULIP2GetConfigurationSchema } from '../../schema/tulip2'
import { createTULIP2PEWChannels, PEW_DOWNLINK_FEATURE_FLAGS } from './constants'
import { PEWTULIP2EncodeHandler } from './encode'
import { ALARM_EVENTS, CONFIG_STATUS_COMMAND_TYPES, CONFIG_STATUS_NAMES_BY_VALUE, DEVICE_ALARM_CAUSE_OF_FAILURE, DEVICE_ALARM_TYPES, PRESSURE_TYPES, PRESSURE_UNITS, PROCESS_ALARM_TYPES, TECHNICAL_ALARM_TYPES } from './lookups'

const ERROR_VALUE = 0xFFFF

type TULIP2PEWChannels = PewTulip2Channels
interface TULIP2PEWDecodeOptions {
  roundingDecimals: number
  channels: TULIP2PEWChannels
}
type PEWTULIP2MainConfigurationData = PEWTULIP2MainConfigurationUplinkOutput['data']['mainConfiguration']
type PEWTULIP2ProcessAlarmConfigurationData = PEWTULIP2ProcessAlarmConfigurationUplinkOutput['data']['processAlarmConfiguration']
type PEWTULIP2ChannelPropertyConfigurationData = PEWTULIP2ChannelPropertyConfigurationUplinkOutput['data']['channelPropertyConfiguration']

const handleDataMessage: Handler<TULIP2PEWChannels, PEWTULIP2DataMessageUplinkOutput> = (input, options) => {
  // validate that the message needs to be 7 bytes long
  if (input.bytes.length !== 7) {
    throw new Error(`Data message (0x01/0x02) requires 7 bytes, but received ${input.bytes.length} bytes`)
  }

  const messageType = input.bytes[0]! as 1 | 2

  const configurationId = input.bytes[1]!

  const pressureValue = roundValue(TULIPValueToValue(input.bytes[3]! << 8 | input.bytes[4]!, options.channels[0]), options.roundingDecimals)

  const temperatureValue = roundValue(TULIPValueToValue(input.bytes[5]! << 8 | input.bytes[6]!, options.channels[1]), options.roundingDecimals)

  const batteryValue = input.bytes[2]! / 10

  return {
    data: {
      configurationId,
      messageType,
      measurement: {
        channels: [
          {
            channelId: 0,
            channelName: 'pressure',
            value: pressureValue,
          },
          {
            channelId: 1,
            channelName: 'device temperature',
            value: temperatureValue,
          },
          {
            channelId: 2,
            channelName: 'battery voltage',
            value: batteryValue,
          },
        ],
      },
    },
  }
}

const handleProcessAlarmMessage: Handler<TULIP2PEWChannels, PEWTULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  // validate that it needs atleast 5 bytes AND that length-2 % 3
  if (input.bytes.length < 5 || (input.bytes.length - 2) % 3 !== 0) {
    throw new Error(`Process alarm message (0x03) requires at least 5 bytes (and target byte count 3n+2), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!

  const processAlarms: PEWTULIP2ProcessAlarmsData = []

  for (let byteIndex = 2; byteIndex < input.bytes.length; byteIndex += 3) {
    const channelId = ((input.bytes[byteIndex]! & 0x40) >> 6) as 0 | 1
    const channel = options.channels.find(c => c.channelId === channelId)
    if (!channel) {
      throw new TypeError(`Unknown channel ID: ${channelId} in process alarm message`)
    }

    const event = ((input.bytes[byteIndex]! & 0x80) >> 7) as 0 | 1
    const alarmTypeByte = input.bytes[byteIndex]!
    const alarmType = alarmTypeByte & 0x3F
    const alarmFlags = {
      lowThreshold: !!(alarmType & PROCESS_ALARM_TYPES['low threshold']),
      highThreshold: !!(alarmType & PROCESS_ALARM_TYPES['high threshold']),
      fallingSlope: !!(alarmType & PROCESS_ALARM_TYPES['falling slope']),
      risingSlope: !!(alarmType & PROCESS_ALARM_TYPES['rising slope']),
      lowThresholdDelay: !!(alarmType & PROCESS_ALARM_TYPES['low threshold with delay']),
      highThresholdDelay: !!(alarmType & PROCESS_ALARM_TYPES['high threshold with delay']),
    }

    // if alarmType is 2 | 3 -> slopeValue with ranges else use TULIPValue
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!
    const isSlope = alarmFlags.fallingSlope || alarmFlags.risingSlope
    const value = isSlope
      ? slopeValueToValue(rawValue, channel)
      : TULIPValueToValue(rawValue, channel)

    processAlarms.push({
      channelId,
      channelName: channel.name,
      value: roundValue(value, options.roundingDecimals),
      event,
      alarmFlags,
      eventName: Object.keys(ALARM_EVENTS).find(key => ALARM_EVENTS[key as keyof typeof ALARM_EVENTS] === event),
    } as PEWTULIP2ProcessAlarmsData[number])
  }

  const warnings: string[] = []

  const res: PEWTULIP2ProcessAlarmsUplinkOutput = {
    data: {
      messageType: 0x03,
      configurationId,
      processAlarms,
    },
  }

  // if any of the values are the error value add a warning
  for (const alarm of processAlarms) {
    if (alarm.value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${alarm.channelName} channel`)
    }
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

const handleTechnicalAlarmMessage: Handler<TULIP2PEWChannels, PEWTULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  // Technical alarm messages are exactly 3 bytes: [0x04, configurationId, alarmByte]
  if (input.bytes.length !== 3) {
    throw new Error(`Technical alarm message (0x04) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!

  const alarmByte = input.bytes[2]!

  // Bit 7 = event (0 = triggered, 1 = turned off)
  const event = ((alarmByte & 0x80) >> 7) as 0 | 1

  // Bits 6-0 = status bits
  const alarmType = alarmByte & 0x7F

  // Map set bits to human readable names from TECHNICAL_ALARM_TYPES
  const alarmTypeNames: (keyof typeof TECHNICAL_ALARM_TYPES)[] = [];

  (Object.entries(TECHNICAL_ALARM_TYPES) as [keyof typeof TECHNICAL_ALARM_TYPES, number][]).forEach(([name, bit]) => {
    if ((alarmType & bit) !== 0) {
      alarmTypeNames.push(name)
    }
  })

  const eventName = Object.keys(ALARM_EVENTS).find(k => (ALARM_EVENTS as any)[k] === event) as keyof typeof ALARM_EVENTS

  const res: PEWTULIP2TechnicalAlarmsUplinkOutput = {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms: [{
        event,
        eventName,
        alarmType,
        alarmTypeNames,
      }] as PEWTULIP2TechnicalAlarmsData,
    },
  }

  return res
}

const handleDeviceAlarmMessage: Handler<TULIP2PEWChannels, PEWTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  // Device alarm messages are 3 or 4 bytes: [0x05, configurationId, alarmByte, [value]]
  if (input.bytes.length < 3 || input.bytes.length > 4) {
    throw new Error(`Device alarm message (0x05) requires 3 or 4 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!

  const alarmByte = input.bytes[2]!

  const event = ((alarmByte & 0x80) >> 7) as 0 | 1
  const eventName = Object.keys(ALARM_EVENTS).find(k => (ALARM_EVENTS as any)[k] === event) as keyof typeof ALARM_EVENTS

  const causeOfFailure = (alarmByte & 0x60) >> 6
  const causeOfFailureName = Object.keys(DEVICE_ALARM_CAUSE_OF_FAILURE).find(k => (DEVICE_ALARM_CAUSE_OF_FAILURE as any)[k] === causeOfFailure) as keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE

  const alarmType = alarmByte & 0x1F
  const alarmTypeName = Object.keys(DEVICE_ALARM_TYPES).find(k => (DEVICE_ALARM_TYPES as any)[k] === alarmType) as keyof typeof DEVICE_ALARM_TYPES

  // low battery alarm (type 0) contains a signed int8 value at byte 3 divided by 10
  let value: number | undefined
  if (alarmType === 0 && input.bytes.length === 4) {
    value = input.bytes[3]! / 10
  }

  const data = {
    event,
    eventName,
    alarmType,
    alarmTypeName,
    causeOfFailure,
    causeOfFailureName,
  } as PEWTULIP2DeviceAlarmsData

  if (alarmType === 0) {
    data.value = value
  }

  const res: PEWTULIP2DeviceAlarmsUplinkOutput = {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm: data,
    },
  }

  return res
}

/**
 * Parse the raw main configuration payload.
 *
 * Expected payload bytes, without message header and configuration id:
 * [measurementPeriodNoAlarm(4), transmissionMultiplierNoAlarm(2), measurementPeriodWithAlarm(4), transmissionMultiplierWithAlarm(2), reserved(1), advertisingFlag(1)]
 */
function parseMainConfigurationData(payload: number[]): PEWTULIP2MainConfigurationData {
  if (payload.length !== 14) {
    throw new Error(`Main configuration payload requires 14 bytes, but received ${payload.length} bytes`)
  }

  const measurementPeriodNoAlarm = ((payload[0]! * 0x1000000) + (payload[1]! << 16) + (payload[2]! << 8) + payload[3]!) >>> 0
  const transmissionMultiplierNoAlarm = intTuple2ToUInt16([payload[4]!, payload[5]!])
  const measurementPeriodWithAlarm = ((payload[6]! * 0x1000000) + (payload[7]! << 16) + (payload[8]! << 8) + payload[9]!) >>> 0
  const transmissionMultiplierWithAlarm = intTuple2ToUInt16([payload[10]!, payload[11]!])
  const bleAdvertisingEnabled = payload[13]! === 0

  return {
    measurementPeriodNoAlarm,
    transmissionMultiplierNoAlarm,
    measurementPeriodWithAlarm,
    transmissionMultiplierWithAlarm,
    bleAdvertisingEnabled,
  }
}

/**
 * Parse the raw process alarm configuration payload.
 *
 * Expected payload bytes, without message header and configuration id:
 * [channel(1), deadBand(2), enableMask(1), ...alarmValues]
 */
function parseProcessAlarmConfigurationData(payload: number[], options: TULIP2PEWDecodeOptions): PEWTULIP2ProcessAlarmConfigurationData {
  if (payload.length < 4) {
    throw new Error(`Process alarm configuration payload requires at least 4 bytes, but received ${payload.length} bytes`)
  }

  const channel = payload[0]! as 0 | 1
  const channelConfig = options.channels.find(c => c.channelId === channel)

  if (!channelConfig) {
    throw new Error(`Unknown channel ${channel} in process alarm configuration message`)
  }

  const deadBandRaw = intTuple2ToUInt16([payload[1]!, payload[2]!])
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
  let lowThresholdValue: number | undefined
  let highThresholdValue: number | undefined
  let fallingSlopeValue: number | undefined
  let risingSlopeValue: number | undefined
  let lowThresholdWithDelayValue: number | undefined
  let lowThresholdWithDelayDelay: number | undefined
  let highThresholdWithDelayValue: number | undefined
  let highThresholdWithDelayDelay: number | undefined

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
    channel,
    channelName: channelConfig.name,
    deadBand,
    lowThreshold,
    lowThresholdValue,
    highThreshold,
    highThresholdValue,
    fallingSlope,
    fallingSlopeValue,
    risingSlope,
    risingSlopeValue,
    lowThresholdWithDelay,
    lowThresholdWithDelayValue,
    lowThresholdWithDelayDelay,
    highThresholdWithDelay,
    highThresholdWithDelayValue,
    highThresholdWithDelayDelay,
  }
}

/**
 * Parse the raw channel property configuration payload.
 *
 * Expected payload bytes, without message header and configuration id:
 * [channel(1), measurementOffset(2), reserved(1)]
 */
function parseChannelPropertyConfigurationData(payload: number[], options: Pick<TULIP2PEWDecodeOptions, 'channels'>): PEWTULIP2ChannelPropertyConfigurationData {
  if (payload.length !== 4) {
    throw new Error(`Channel property configuration payload requires 4 bytes, but received ${payload.length} bytes`)
  }

  const channel = payload[0]! as 0 | 1
  const channelConfig = options.channels.find(c => c.channelId === channel)

  if (!channelConfig) {
    throw new Error(`Unknown channel ${channel} in channel property configuration message`)
  }

  const rawOffset = intTuple2ToUInt16([payload[1]!, payload[2]!])
  const measurementOffset = rawOffset > 0x7FFF ? rawOffset - 0x10000 : rawOffset

  return {
    channel,
    channelName: channelConfig.name,
    measurementOffset,
  }
}

const handleConfigurationStatusMessage: Handler<TULIP2PEWChannels, PEWTULIP2ConfigurationStatusUplinkOutput> = (input, options) => {
  if (input.bytes.length < 3) {
    throw new Error(`Configuration status message (0x06) requires at least 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const statusByte = input.bytes[2]!
  const rawConfigStatus = (statusByte >> 4) & 0x0F
  const configStatusName = CONFIG_STATUS_NAMES_BY_VALUE[rawConfigStatus as keyof typeof CONFIG_STATUS_NAMES_BY_VALUE]

  if (!configStatusName) {
    throw new Error(`Unknown configuration status value ${rawConfigStatus} in configuration status message`)
  }

  const configStatus = rawConfigStatus as keyof typeof CONFIG_STATUS_NAMES_BY_VALUE

  type CommandResponse = PEWTULIP2ConfigurationStatusUplinkOutput['data']['commandResponse']
  let commandResponse: CommandResponse

  if (input.bytes.length > 3) {
    const commandTypeByte = input.bytes[3]!

    if (commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get main configuration']) {
      if (input.bytes.length < 19) {
        throw new Error(`Get main configuration response requires 19 bytes total, but received ${input.bytes.length}`)
      }

      const commandStatus = input.bytes[4]! as 0
      const mainConfiguration = parseMainConfigurationData(input.bytes.slice(5, 19))

      commandResponse = {
        commandType: CONFIG_STATUS_COMMAND_TYPES['get main configuration'],
        commandTypeName: 'get main configuration',
        commandStatus,
        ...mainConfiguration,
      }
    }
    else if (commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['reset battery indicator']) {
      if (input.bytes.length < 5) {
        throw new Error(`Reset battery indicator response requires 5 bytes total, but received ${input.bytes.length}`)
      }

      const commandStatus = input.bytes[4]! as 0 | 1

      commandResponse = {
        commandType: CONFIG_STATUS_COMMAND_TYPES['reset battery indicator'],
        commandTypeName: 'reset battery indicator',
        commandStatus,
        resetSuccess: commandStatus === 0,
      }
    }
    else if (
      commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get process alarm configuration pressure']
      || commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get process alarm configuration temperature']
    ) {
      if (input.bytes.length < 9) {
        throw new Error(`Process alarm configuration response requires at least 9 bytes total, but received ${input.bytes.length}`)
      }

      const commandTypeName = (commandTypeByte === 0x50
        ? 'get process alarm configuration pressure'
        : 'get process alarm configuration temperature') as
        | 'get process alarm configuration pressure'
        | 'get process alarm configuration temperature'
      const commandStatus = input.bytes[4]! as 0
      const processAlarmConfiguration = parseProcessAlarmConfigurationData(input.bytes.slice(5), options)

      commandResponse = {
        commandType: commandTypeByte as 0x50 | 0x51,
        commandTypeName,
        commandStatus,
        ...processAlarmConfiguration,
      }
    }
    else if (
      commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get channel property configuration pressure']
      || commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get channel property configuration temperature']
    ) {
      if (input.bytes.length < 9) {
        throw new Error(`Channel property configuration response requires 9 bytes total, but received ${input.bytes.length}`)
      }

      const commandTypeName = (commandTypeByte === 0x60
        ? 'get channel property configuration pressure'
        : 'get channel property configuration temperature') as
        | 'get channel property configuration pressure'
        | 'get channel property configuration temperature'
      const commandStatus = input.bytes[4]! as 0
      const channelPropertyConfiguration = parseChannelPropertyConfigurationData(input.bytes.slice(5), options)

      commandResponse = {
        commandType: commandTypeByte as 0x60 | 0x61,
        commandTypeName,
        commandStatus,
        ...channelPropertyConfiguration,
      }
    }
    else {
      throw new Error(`Unknown command type 0x${commandTypeByte.toString(16).padStart(2, '0')} in configuration status message`)
    }
  }

  return {
    data: {
      messageType: 0x06 as const,
      configurationId,
      configStatus,
      configStatusName: configStatusName as typeof CONFIG_STATUS_NAMES_BY_VALUE[keyof typeof CONFIG_STATUS_NAMES_BY_VALUE],
      commandResponse,
    },
  }
}

const handleMainConfigurationMessage: Handler<TULIP2PEWChannels, PEWTULIP2MainConfigurationUplinkOutput> = (input) => {
  if (input.bytes.length !== 16) {
    throw new Error(`Main configuration message (0x0B) requires 16 bytes, but received ${input.bytes.length} bytes`)
  }

  return {
    data: {
      messageType: 0x0B as const,
      configurationId: input.bytes[1]!,
      mainConfiguration: parseMainConfigurationData(input.bytes.slice(2)),
    },
  }
}

const handleProcessAlarmConfigurationMessage: Handler<TULIP2PEWChannels, PEWTULIP2ProcessAlarmConfigurationUplinkOutput> = (input, options) => {
  if (input.bytes.length < 6) {
    throw new Error(`Process alarm configuration message (0x0C) requires at least 6 bytes, but received ${input.bytes.length} bytes`)
  }

  return {
    data: {
      messageType: 0x0C as const,
      configurationId: input.bytes[1]!,
      processAlarmConfiguration: parseProcessAlarmConfigurationData(input.bytes.slice(2), options),
    },
  }
}

const handleChannelPropertyConfigurationMessage: Handler<TULIP2PEWChannels, PEWTULIP2ChannelPropertyConfigurationUplinkOutput> = (input, options) => {
  if (input.bytes.length !== 6) {
    throw new Error(`Channel property configuration message (0x0D) requires 6 bytes, but received ${input.bytes.length} bytes`)
  }

  return {
    data: {
      messageType: 0x0D as const,
      configurationId: input.bytes[1]!,
      channelPropertyConfiguration: parseChannelPropertyConfigurationData(input.bytes.slice(2), options),
    },
  }
}

const handleDeviceIdentificationMessage: Handler<TULIP2PEWChannels, PEWTULIP2DeviceInformationUplinkOutput> = (input) => {
  // validate if 8 or 38 bytes are present
  if (input.bytes.length !== 8 && input.bytes.length !== 38) {
    throw new Error(`Device identification message (0x07) requires 8 or 38 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!

  const productId = input.bytes[2]!

  if (productId !== 11) {
    throw new Error(`Invalid productId ${productId} in device identification message. Expected 11 (PEW).`)
  }

  const productIdName = 'PEW'

  const productSubId = input.bytes[3]!

  if (productSubId !== 0) {
    throw new Error(`Unknown productSubId ${productSubId} in device identification message. Only LoRaWAN (0) is supported.`)
  }

  // firmware version is semver with nibble.nibble.byte
  const wirelessModuleFirmwareVersion = `${(input.bytes[4]! >> 4) & 0x0F}.${input.bytes[4]! & 0x0F}.${input.bytes[5]!}`

  const wirelessModuleHardwareVersion = `${(input.bytes[6]! >> 4) & 0x0F}.${input.bytes[6]! & 0x0F}.${input.bytes[7]!}`

  if (input.bytes.length === 8) {
    return {
      data: {
        messageType: 0x07,
        configurationId,
        deviceInformation: {
          productId,
          productIdName,
          productSubId,
          productSubIdName: 'LoRaWAN',
          wirelessModuleFirmwareVersion,
          wirelessModuleHardwareVersion,
        } satisfies PEWTULIP2DeviceInformationData,
      },
    }
  }

  // read the next 11 bytes as ascii
  const serialNumber = String.fromCharCode(...input.bytes.slice(8, 19))

  const pressureTypeId = input.bytes[19]!

  if (!(pressureTypeId === 1) && !(pressureTypeId === 2)) {
    throw new Error(`Unknown pressure type ${pressureTypeId} in device identification message. Expected 1 (relative) or 2 (absolute).`)
  }

  const pressureType = Object.keys(PRESSURE_TYPES).find(typeName => (PRESSURE_TYPES)[typeName as keyof typeof PRESSURE_TYPES] === pressureTypeId)! as keyof typeof PRESSURE_TYPES

  const measurementRangeStartPressure = intTuple4ToFloat32WithThreshold([input.bytes[20]!, input.bytes[21]!, input.bytes[22]!, input.bytes[23]!])

  const measurementRangeEndPressure = intTuple4ToFloat32WithThreshold([input.bytes[24]!, input.bytes[25]!, input.bytes[26]!, input.bytes[27]!])

  const measurementRangeStartDeviceTemperature = intTuple4ToFloat32WithThreshold([input.bytes[28]!, input.bytes[29]!, input.bytes[30]!, input.bytes[31]!])

  const measurementRangeEndDeviceTemperature = intTuple4ToFloat32WithThreshold([input.bytes[32]!, input.bytes[33]!, input.bytes[34]!, input.bytes[35]!])

  const pressureUnit = input.bytes[36]!

  // must be 6,7, or 237
  if (![6, 7, 237].includes(pressureUnit)) {
    throw new Error(`Unknown pressure unit ${pressureUnit} in device identification message. Expected 6 (bar), 7 (mbar), or 237 (MPa).`)
  }
  const pressureUnitName = Object.keys(PRESSURE_UNITS).find(key => PRESSURE_UNITS[key as keyof typeof PRESSURE_UNITS] === pressureUnit)!

  const deviceTemperatureUnit = input.bytes[37]!

  // must be 32
  if (deviceTemperatureUnit !== 32) {
    throw new Error(`Unknown temperature unit ${deviceTemperatureUnit} in device identification message. Expected 32 (°C).`)
  }

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productIdName,
        productId,
        productSubId,
        productSubIdName: 'LoRaWAN',
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        pressureType,
        measurementRangeStartPressure,
        measurementRangeEndPressure,
        measurementRangeStartDeviceTemperature,
        measurementRangeEndDeviceTemperature,
        pressureUnit,
        pressureUnitName,
        deviceTemperatureUnit,
        deviceTemperatureUnitName: '°C',
      } as PEWTULIP2DeviceInformationData,
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2PEWChannels, PEWTULIP2DeviceStatisticsUplinkOutput> = (input) => {
  // Keep alive message is 3 bytes: [0x08, configurationId, batteryByte]
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message (0x08) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const batteryByte = input.bytes[2]!

  const batteryLevelNewEvent = ((batteryByte & 0x80) >> 7) === 1
  const batteryLevelPercent = batteryByte & 0x7F

  const res: PEWTULIP2DeviceStatisticsUplinkOutput = {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent,
        batteryLevelPercent,
      } as PEWTULIP2DeviceStatisticsData,
    },
  }

  return res
}

const pewEncoderFactory: EncoderFactory<PewTulip2DownlinkInput> = (options) => {
  const featureFlags = PEW_DOWNLINK_FEATURE_FLAGS
  return (input: PewTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, [createDownlinkResetBatteryIndicatorSchema(featureFlags), createPEWTULIP2DropConfigurationSchema(), createPEWTULIP2GetConfigurationSchema()])
    return PEWTULIP2EncodeHandler(validated as PewTulip2DownlinkInput)
  }
}

const pewMultipleEncodeFactory: MultipleEncoderFactory<PewTulip2DownlinkInput> = (options) => {
  const featureFlags = PEW_DOWNLINK_FEATURE_FLAGS
  return (input: PewTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, [createDownlinkResetBatteryIndicatorSchema(featureFlags), createPEWTULIP2DropConfigurationSchema(), createPEWTULIP2GetConfigurationSchema()])
    return PEWTULIP2EncodeHandler(validated as PewTulip2DownlinkInput, true)
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2PEWCodec() {
  return defineTULIP2Codec({
    deviceName: PEW_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createTULIP2PEWChannels(),
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x06: handleConfigurationStatusMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleKeepAliveMessage,
      0x0B: handleMainConfigurationMessage,
      0x0C: handleProcessAlarmConfigurationMessage,
      0x0D: handleChannelPropertyConfigurationMessage,
    },
    encoderFactory: pewEncoderFactory,
    multipleEncodeFactory: pewMultipleEncodeFactory,
  })
}
