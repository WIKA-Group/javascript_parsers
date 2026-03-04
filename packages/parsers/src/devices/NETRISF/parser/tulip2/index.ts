import type { EncoderFactory, Handler, MultipleEncoderFactory } from '../../../../codecs/tulip2'
import type {
  MeasurementUnitId,
  MeasurementUnitName,
  NetrisFTULIP2ConfigurationStatusUplinkOutput,
  NetrisFTULIP2DataMessageUplinkOutput,
  NetrisFTULIP2DeviceAlarmsData,
  NetrisFTULIP2DeviceAlarmsUplinkOutput,
  NetrisFTULIP2DeviceInformationUplinkOutput,
  NetrisFTULIP2DeviceStatisticsUplinkOutput,
  NetrisFTULIP2ProcessAlarmsData,
  NetrisFTULIP2ProcessAlarmsUplinkOutput,
  NetrisFTULIP2TechnicalAlarmsData,
  NetrisFTULIP2TechnicalAlarmsUplinkOutput,
  TemperatureUnitId,
  TemperatureUnitName,
} from '../../schema/tulip2'
import type { NetrisFTulip2DownlinkInput } from './constants'
import { NETRISF_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { createDownlinkResetBatteryIndicatorSchema, validateTULIP2DownlinkInput } from '../../../../schemas/tulip2/downlink'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createNetrisFTULIP2GetConfigurationSchema } from '../../schema/tulip2'
import { createNetrisFTULIP2Channels, NETRISF_BATTERY_VOLTAGE_CHANNEL, NETRISF_DEVICE_TEMPERATURE_CHANNEL, NETRISF_STRAIN_CHANNEL } from './channels'
import { NETRISF_DOWNLINK_FEATURE_FLAGS } from './constants'
import { NETRISFTULIP2EncodeHandler } from './encode'
import {
  ALARM_EVENTS,
  CONFIG_STATUS_COMMAND_TYPES,
  CONFIG_STATUS_NAMES_BY_VALUE,
  DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE,
  DEVICE_ALARM_TYPES,
  MEASUREMENT_TYPES_BY_ID,
  PHYSICAL_UNIT_NAMES_BY_ID,
  PROCESS_ALARM_CHANNEL_NAMES_BY_ID,
  PROCESS_ALARM_TYPES,
  PRODUCT_SUB_ID_NAMES,
  TECHNICAL_ALARM_TYPES,
} from './lookups'

const ERROR_VALUE = 0xFFFF

type NetrisFChannels = ReturnType<typeof createNetrisFTULIP2Channels>

type AlarmEvent = (typeof ALARM_EVENTS)[keyof typeof ALARM_EVENTS]

const handleDataMessage: Handler<NetrisFChannels, NetrisFTULIP2DataMessageUplinkOutput> = (input, options) => {
  if (input.bytes.length !== 7) {
    throw new Error(`Data message (0x01/0x02) requires 7 bytes, but received ${input.bytes.length} bytes`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!
  const batteryVoltage = input.bytes[2]! / 10
  const rawStrain = (input.bytes[3]! << 8) | input.bytes[4]!
  const rawTemperature = (input.bytes[5]! << 8) | input.bytes[6]!

  const strainChannel = options.channels.find((candidate): candidate is NetrisFChannels[number] => candidate.channelId === NETRISF_STRAIN_CHANNEL.channelId)
  const temperatureChannel = options.channels.find((candidate): candidate is NetrisFChannels[number] => candidate.channelId === NETRISF_DEVICE_TEMPERATURE_CHANNEL.channelId)

  if (!strainChannel || !temperatureChannel) {
    throw new Error('Channel configuration missing for strain or temperature channel')
  }

  const strainValue = roundValue(TULIPValueToValue(rawStrain, strainChannel), options.roundingDecimals)
  const temperatureValue = roundValue(TULIPValueToValue(rawTemperature, temperatureChannel), options.roundingDecimals)

  return {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels: [
          {
            channelId: strainChannel.channelId,
            channelName: strainChannel.name,
            value: strainValue,
          },
          {
            channelId: temperatureChannel.channelId,
            channelName: temperatureChannel.name,
            value: temperatureValue,
          },
          {
            channelId: NETRISF_BATTERY_VOLTAGE_CHANNEL.channelId,
            channelName: NETRISF_BATTERY_VOLTAGE_CHANNEL.name,
            value: roundValue(batteryVoltage, options.roundingDecimals),
          },
        ],
      },
    },
  }
}

const handleProcessAlarmMessage: Handler<NetrisFChannels, NetrisFTULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 5 || ((input.bytes.length - 2) % 3) !== 0) {
    throw new Error(`Process alarm message (0x03) requires at least 5 bytes (and target byte count 3n+2), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const processAlarms: NetrisFTULIP2ProcessAlarmsData = []
  const warnings: string[] = []

  for (let byteIndex = 2, alarmIndex = 0; byteIndex < input.bytes.length; byteIndex += 3, alarmIndex += 1) {
    const header = input.bytes[byteIndex]!
    const event = ((header & 0x80) >> 7) as AlarmEvent
    const channelId = (header & 0x40) >> 6
    const alarmTypeBits = header & 0x3F
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!

    const alarmTypeEntry = (Object.entries(PROCESS_ALARM_TYPES) as [keyof typeof PROCESS_ALARM_TYPES, number][]).find(([, mask]) => (alarmTypeBits & mask) !== 0)
    const alarmType = alarmTypeEntry?.[1]
    const alarmTypeName = alarmTypeEntry?.[0]
    const eventName = (Object.entries(ALARM_EVENTS) as [keyof typeof ALARM_EVENTS, number][]).find(([, id]) => id === event)?.[0]
    const channelName = PROCESS_ALARM_CHANNEL_NAMES_BY_ID[channelId as keyof typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID]

    if (!alarmTypeEntry || alarmType === undefined) {
      throw new Error(`Unknown alarmType ${alarmTypeBits} in process alarm message`)
    }

    if (!eventName) {
      throw new Error(`Unknown event ${event} in process alarm message`)
    }

    if (!channelName) {
      throw new Error(`Unknown channelId ${channelId} in process alarm message`)
    }

    const channel = options.channels.find(candidate => candidate.channelId === channelId)
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

    processAlarms[alarmIndex] = {
      channelId,
      channelName,
      event,
      eventName,
      alarmType,
      alarmTypeName,
      value,
    } as NetrisFTULIP2ProcessAlarmsData[number]

    if (value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${channelName} channel`)
    }
  }

  const result: NetrisFTULIP2ProcessAlarmsUplinkOutput = {
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

const handleTechnicalAlarmMessage: Handler<NetrisFChannels, NetrisFTULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Technical alarm message (0x04) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const payload = input.bytes[2]!
  const event = ((payload & 0x80) >> 7) as AlarmEvent
  const alarmType = payload & 0x7F

  const eventName = (Object.entries(ALARM_EVENTS) as [keyof typeof ALARM_EVENTS, number][]).find(([, id]) => id === event)?.[0]
  if (!eventName) {
    throw new Error(`Unknown event ${event} in technical alarm message`)
  }

  const alarmTypeEntry = (Object.entries(TECHNICAL_ALARM_TYPES) as [keyof typeof TECHNICAL_ALARM_TYPES, number][]).find(([, mask]) => (alarmType & mask) !== 0)
  if (!alarmTypeEntry) {
    throw new Error(`Unknown technical alarm type ${alarmType} in technical alarm message`)
  }

  const [alarmTypeName, normalizedAlarmType] = alarmTypeEntry

  return {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms: [
        {
          alarmType: normalizedAlarmType,
          alarmTypeName,
          event,
          eventName,
        },
      ] as NetrisFTULIP2TechnicalAlarmsData,
    },
  }
}

const handleDeviceAlarmMessage: Handler<NetrisFChannels, NetrisFTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length < 3 || input.bytes.length > 4) {
    throw new Error(`Device alarm message (0x05) requires 3 or 4 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const payload = input.bytes[2]!
  const event = ((payload & 0x80) >> 7) as AlarmEvent
  const eventName = (Object.entries(ALARM_EVENTS) as [keyof typeof ALARM_EVENTS, number][]).find(([, id]) => id === event)?.[0]
  if (!eventName) {
    throw new Error(`Unknown event ${event} in device alarm message`)
  }
  const causeOfFailure = (payload & 0x60) >> 6
  const causeOfFailureName = DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE[causeOfFailure as keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE]
    ?? DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE[1]
  const rawAlarmType = payload & 0x1F
  const alarmTypeEntry = (Object.entries(DEVICE_ALARM_TYPES) as Array<[
    keyof typeof DEVICE_ALARM_TYPES,
    (typeof DEVICE_ALARM_TYPES)[keyof typeof DEVICE_ALARM_TYPES],
  ]>).find(([, id]) => id === rawAlarmType)
  if (!alarmTypeEntry) {
    throw new Error(`Unknown alarmType ${rawAlarmType} in device alarm message`)
  }
  const [alarmTypeName, alarmType] = alarmTypeEntry

  const deviceAlarm: NetrisFTULIP2DeviceAlarmsData = {
    event,
    eventName,
    causeOfFailure,
    causeOfFailureName,
    alarmType,
    alarmTypeName,
  }

  if (alarmType === DEVICE_ALARM_TYPES['low battery alarm']) {
    if (input.bytes.length < 4) {
      throw new Error('Device alarm 05 payload missing battery value byte')
    }
    deviceAlarm.batteryValue = input.bytes[3]! / 10
  }

  return {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm,
    },
  }
}

const handleConfigurationStatusMessage: Handler<NetrisFChannels, NetrisFTULIP2ConfigurationStatusUplinkOutput> = (input, options) => {
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

  type CommandResponse = NetrisFTULIP2ConfigurationStatusUplinkOutput['data']['commandResponse']
  let commandResponse: CommandResponse

  if (input.bytes.length > 3) {
    const commandTypeByte = input.bytes[3]!

    if (commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get main configuration']) {
      if (input.bytes.length < 19) {
        throw new Error(`Get main configuration response requires 19 bytes total, but received ${input.bytes.length}`)
      }
      const commandStatus = input.bytes[4]! as 0
      const measurementPeriodNoAlarm = ((input.bytes[5]! * 0x1000000) + (input.bytes[6]! << 16) + (input.bytes[7]! << 8) + input.bytes[8]!) >>> 0
      const transmissionMultiplierNoAlarm = (input.bytes[9]! << 8) | input.bytes[10]!
      const measurementPeriodWithAlarm = ((input.bytes[11]! * 0x1000000) + (input.bytes[12]! << 16) + (input.bytes[13]! << 8) + input.bytes[14]!) >>> 0
      const transmissionMultiplierWithAlarm = (input.bytes[15]! << 8) | input.bytes[16]!
      // byte 17 reserved
      const bleAdvertisingEnabled = input.bytes[18]! === 0

      commandResponse = {
        commandType: CONFIG_STATUS_COMMAND_TYPES['get main configuration'],
        commandTypeName: 'get main configuration',
        commandStatus,
        measurementPeriodNoAlarm,
        transmissionMultiplierNoAlarm,
        measurementPeriodWithAlarm,
        transmissionMultiplierWithAlarm,
        bleAdvertisingEnabled,
      }
    }
    else if (commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['reset battery indicator']) {
      if (input.bytes.length < 5) {
        throw new Error(`Reset battery indicator response requires 5 bytes total, but received ${input.bytes.length}`)
      }
      const commandStatus = input.bytes[4]! as 0 | 1
      const resetSuccess = commandStatus === 0

      commandResponse = {
        commandType: CONFIG_STATUS_COMMAND_TYPES['reset battery indicator'],
        commandTypeName: 'reset battery indicator',
        commandStatus,
        resetSuccess,
      }
    }
    else if (
      commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get process alarm configuration strain']
      || commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get process alarm configuration temperature']
    ) {
      if (input.bytes.length < 9) {
        throw new Error(`Process alarm configuration response requires at least 9 bytes total, but received ${input.bytes.length}`)
      }

      const commandTypeName = (commandTypeByte === 0x50
        ? 'get process alarm configuration strain'
        : 'get process alarm configuration temperature') as
        | 'get process alarm configuration strain'
        | 'get process alarm configuration temperature'
      const commandStatus = input.bytes[4]! as 0
      const channel = input.bytes[5]! as 0 | 1
      const channelName = PROCESS_ALARM_CHANNEL_NAMES_BY_ID[channel]
      if (!channelName) {
        throw new Error(`Unknown channel ${channel} in process alarm configuration response`)
      }

      const deadBandRaw = (input.bytes[6]! << 8) | input.bytes[7]!
      const channelConfig = options.channels.find(c => c.channelId === channel)
      if (!channelConfig) {
        throw new Error(`Channel configuration missing for channelId ${channel} in process alarm configuration response`)
      }

      const deadBand = roundValue(slopeValueToValue(deadBandRaw, channelConfig), options.roundingDecimals)
      const enableByte = input.bytes[8]!

      const lowThreshold = (enableByte & 0x80) !== 0
      const highThreshold = (enableByte & 0x40) !== 0
      const fallingSlope = (enableByte & 0x20) !== 0
      const risingSlope = (enableByte & 0x10) !== 0
      const lowThresholdWithDelay = (enableByte & 0x08) !== 0
      const highThresholdWithDelay = (enableByte & 0x04) !== 0

      let byteIdx = 9
      let lowThresholdValue: number | undefined
      let highThresholdValue: number | undefined
      let fallingSlopeValue: number | undefined
      let risingSlopeValue: number | undefined
      let lowThresholdWithDelayValue: number | undefined
      let lowThresholdWithDelayDelay: number | undefined
      let highThresholdWithDelayValue: number | undefined
      let highThresholdWithDelayDelay: number | undefined

      if (lowThreshold) {
        const raw = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        lowThresholdValue = roundValue(TULIPValueToValue(raw, channelConfig), options.roundingDecimals)
        byteIdx += 2
      }
      if (highThreshold) {
        const raw = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        highThresholdValue = roundValue(TULIPValueToValue(raw, channelConfig), options.roundingDecimals)
        byteIdx += 2
      }
      if (fallingSlope) {
        const raw = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        fallingSlopeValue = roundValue(slopeValueToValue(raw, channelConfig), options.roundingDecimals)
        byteIdx += 2
      }
      if (risingSlope) {
        const raw = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        risingSlopeValue = roundValue(slopeValueToValue(raw, channelConfig), options.roundingDecimals)
        byteIdx += 2
      }
      if (lowThresholdWithDelay) {
        const rawThresh = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        lowThresholdWithDelayValue = roundValue(TULIPValueToValue(rawThresh, channelConfig), options.roundingDecimals)
        byteIdx += 2
        lowThresholdWithDelayDelay = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        byteIdx += 2
      }
      if (highThresholdWithDelay) {
        const rawThresh = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        highThresholdWithDelayValue = roundValue(TULIPValueToValue(rawThresh, channelConfig), options.roundingDecimals)
        byteIdx += 2
        highThresholdWithDelayDelay = (input.bytes[byteIdx]! << 8) | input.bytes[byteIdx + 1]!
        byteIdx += 2
      }

      commandResponse = {
        commandType: commandTypeByte as 0x50 | 0x51,
        commandTypeName,
        commandStatus,
        channel,
        channelName: channelName as 'strain' | 'device temperature',
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
    else if (
      commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get channel property configuration strain']
      || commandTypeByte === CONFIG_STATUS_COMMAND_TYPES['get channel property configuration temperature']
    ) {
      if (input.bytes.length < 9) {
        throw new Error(`Channel property configuration response requires 9 bytes total, but received ${input.bytes.length}`)
      }

      const commandTypeName = (commandTypeByte === 0x60
        ? 'get channel property configuration strain'
        : 'get channel property configuration temperature') as
        | 'get channel property configuration strain'
        | 'get channel property configuration temperature'
      const commandStatus = input.bytes[4]! as 0
      const channel = input.bytes[5]! as 0 | 1
      const channelName = PROCESS_ALARM_CHANNEL_NAMES_BY_ID[channel]
      if (!channelName) {
        throw new Error(`Unknown channel ${channel} in channel property configuration response`)
      }

      const rawOffset = (input.bytes[6]! << 8) | input.bytes[7]!
      const measurementOffset = rawOffset > 0x7FFF ? rawOffset - 0x10000 : rawOffset

      commandResponse = {
        commandType: commandTypeByte as 0x60 | 0x61,
        commandTypeName,
        commandStatus,
        channel,
        channelName: channelName as 'strain' | 'device temperature',
        measurementOffset,
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

const handleDeviceIdentificationMessage: Handler<NetrisFChannels, NetrisFTULIP2DeviceInformationUplinkOutput> = (input) => {
  if (input.bytes.length < 8 || input.bytes.length > 38) {
    throw new Error(`Device identification message (0x07) requires at least 8 and at most 38 bytes, but received ${input.bytes.length} bytes`)
  }

  if (input.bytes.length < 38) {
    throw new Error(`Device identification frame 07 has not all bytes included, received ${input.bytes.length}/38 bytes`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  if (productId !== 11) {
    throw new Error(`Invalid productId ${productId} in device identification message. Expected 11 (NETRIS_F).`)
  }
  const productIdName = 'NETRIS_F'
  const productSubId = input.bytes[3]!
  const productSubIdName = (Object.entries(PRODUCT_SUB_ID_NAMES) as [keyof typeof PRODUCT_SUB_ID_NAMES, number][]).find(([, id]) => id === productSubId)?.[0]

  if (!productSubIdName) {
    throw new Error(`Unknown productSubId ${productSubId} in device identification message. Only LoRaWAN (0) is supported.`)
  }

  const wirelessModuleFirmwareVersion = `${(input.bytes[4]! >> 4) & 0x0F}.${input.bytes[4]! & 0x0F}.${input.bytes[5]!}`
  const wirelessModuleHardwareVersion = `${(input.bytes[6]! >> 4) & 0x0F}.${input.bytes[6]! & 0x0F}.${input.bytes[7]!}`

  let serialNumber = ''
  for (let index = 8; index < 19; index += 1) {
    const char = input.bytes[index]!
    if (char === 0) {
      break
    }
    serialNumber += String.fromCharCode(char)
  }

  const measurementType = MEASUREMENT_TYPES_BY_ID[input.bytes[19]! as keyof typeof MEASUREMENT_TYPES_BY_ID] ?? 'unknown'

  const measurementRangeStart = intTuple4ToFloat32WithThreshold([
    input.bytes[20]!,
    input.bytes[21]!,
    input.bytes[22]!,
    input.bytes[23]!,
  ])

  const measurementRangeEnd = intTuple4ToFloat32WithThreshold([
    input.bytes[24]!,
    input.bytes[25]!,
    input.bytes[26]!,
    input.bytes[27]!,
  ])

  const measurementRangeStartDeviceTemperature = intTuple4ToFloat32WithThreshold([
    input.bytes[28]!,
    input.bytes[29]!,
    input.bytes[30]!,
    input.bytes[31]!,
  ])

  const measurementRangeEndDeviceTemperature = intTuple4ToFloat32WithThreshold([
    input.bytes[32]!,
    input.bytes[33]!,
    input.bytes[34]!,
    input.bytes[35]!,
  ])

  const measurementUnit = input.bytes[36]!
  const unitName = PHYSICAL_UNIT_NAMES_BY_ID[measurementUnit as keyof typeof PHYSICAL_UNIT_NAMES_BY_ID] ?? 'Unknown'
  const deviceTemperatureUnit = input.bytes[37]!
  const deviceTemperatureUnitName = PHYSICAL_UNIT_NAMES_BY_ID[deviceTemperatureUnit as keyof typeof PHYSICAL_UNIT_NAMES_BY_ID] ?? 'Unknown'

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productId,
        productIdName,
        productSubId: productSubId as 0,
        productSubIdName: productSubIdName as 'LoRaWAN',
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        measurementType,
        measurementRangeStart,
        measurementRangeEnd,
        measurementRangeStartDeviceTemperature,
        measurementRangeEndDeviceTemperature,
        measurementUnit: measurementUnit as MeasurementUnitId,
        unitName: unitName as MeasurementUnitName,
        deviceTemperatureUnit: deviceTemperatureUnit as TemperatureUnitId,
        deviceTemperatureUnitName: deviceTemperatureUnitName as TemperatureUnitName,
      },
    },
  } satisfies NetrisFTULIP2DeviceInformationUplinkOutput
}

const handleKeepAliveMessage: Handler<NetrisFChannels, NetrisFTULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message (0x08) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const payload = input.bytes[2]!

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent: ((payload & 0x80) >> 7) !== 0,
        batteryLevelPercent: payload & 0x7F,
      },
    },
  }
}

const netrisFEncoderFactory: EncoderFactory<NetrisFTulip2DownlinkInput> = (options) => {
  const featureFlags = NETRISF_DOWNLINK_FEATURE_FLAGS
  return (input: NetrisFTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, [createDownlinkResetBatteryIndicatorSchema(featureFlags), createNetrisFTULIP2GetConfigurationSchema()])
    return NETRISFTULIP2EncodeHandler(validated as NetrisFTulip2DownlinkInput)
  }
}

const netrisFMultipleEncodeFactory: MultipleEncoderFactory<NetrisFTulip2DownlinkInput> = (options) => {
  const featureFlags = NETRISF_DOWNLINK_FEATURE_FLAGS
  return (input: NetrisFTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, [createDownlinkResetBatteryIndicatorSchema(featureFlags), createNetrisFTULIP2GetConfigurationSchema()])
    return NETRISFTULIP2EncodeHandler(validated as NetrisFTulip2DownlinkInput, true)
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createNetrisFTULIP2Codec() {
  return defineTULIP2Codec({
    deviceName: NETRISF_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createNetrisFTULIP2Channels(),
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x06: handleConfigurationStatusMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleKeepAliveMessage,
    },
    encoderFactory: netrisFEncoderFactory,
    multipleEncodeFactory: netrisFMultipleEncodeFactory,
  })
}
