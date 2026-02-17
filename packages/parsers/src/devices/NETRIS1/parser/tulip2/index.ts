import type { EncoderFactory, Handler, MultipleEncoderFactory } from '../../../../codecs/tulip2'
import type {
  NETRIS1TULIP2ChannelFailureAlarmData,
  NETRIS1TULIP2ChannelFailureAlarmUplinkOutput,
  NETRIS1TULIP2DataMessageUplinkOutput,
  NETRIS1TULIP2DeviceAlarmsData,
  NETRIS1TULIP2DeviceAlarmsUplinkOutput,
  NETRIS1TULIP2DeviceInformationData,
  NETRIS1TULIP2DeviceInformationUplinkOutput,
  NETRIS1TULIP2DeviceStatisticsData,
  NETRIS1TULIP2DeviceStatisticsUplinkOutput,
  NETRIS1TULIP2ProcessAlarmsData,
  NETRIS1TULIP2ProcessAlarmsUplinkOutput,
  NETRIS1TULIP2TechnicalAlarmsData,
  NETRIS1TULIP2TechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2'
import type { NETRIS1Tulip2Channels, NETRIS1Tulip2DownlinkInput } from './constants'
import { NETRIS1_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { validateTULIP2DownlinkInput } from '../../../../schemas/tulip2/downlink'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createNETRIS1TULIP2GetConfigurationSchema, createNETRIS1TULIP2ResetBatterySchema } from '../../schema/tulip2'
import { createTULIP2NETRIS1Channels, NETRIS1_DOWNLINK_FEATURE_FLAGS } from './constants'
import { NETRIS1TULIP2EncodeHandler } from './encode'
import { ALARM_EVENTS, DEVICE_ALARM_TYPES, LPP_MEASURANDS_BY_ID, LPP_UNITS_BY_ID, LPWAN_IDS_BY_ID, MEASUREMENT_ALARM_TYPES, PROCESS_ALARM_TYPES, PRODUCT_IDS_BY_ID, SENSOR_IDS_BY_ID, TECHNICAL_ALARM_TYPES } from './lookups'

const ERROR_VALUE = 0xFFFF

type TULIP2NETRIS1Channels = NETRIS1Tulip2Channels

const handleDataMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DataMessageUplinkOutput> = (input, options) => {
  // Data message: 0x01/0x02, length 5 bytes expected for single channel
  if (input.bytes.length !== 5) {
    throw new Error(`Data message (0x01/0x02) requires 5 bytes, but received ${input.bytes.length} bytes`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!

  const channelRaw = (input.bytes[3]! << 8) | input.bytes[4]!

  const value = channelRaw === ERROR_VALUE
    ? ERROR_VALUE
    : roundValue(TULIPValueToValue(channelRaw, options.channels[0]), options.roundingDecimals)

  if (value === ERROR_VALUE) {
    throw new Error('Invalid data for channel - measurement : 0xffff, 65535')
  }

  const res: NETRIS1TULIP2DataMessageUplinkOutput = {
    data: {
      configurationId,
      messageType,
      measurement: {
        channels: [
          {
            channelId: 0,
            channelName: 'measurement',
            value,
          },
        ],
      },
    },
  }

  return res
}

const handleProcessAlarmMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  // Needs at least 6 bytes and (len - 3) % 3 === 0
  if (input.bytes.length < 6 || ((input.bytes.length - 3) % 3) !== 0) {
    throw new Error(`Process alarm message (0x03) requires at least 6 bytes (and target byte count 3n+3), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!

  const processAlarms: NETRIS1TULIP2ProcessAlarmsData = []

  for (let byteIndex = 3; byteIndex < input.bytes.length; byteIndex += 3) {
    const channelId = (input.bytes[2]! & 0x0F) as 0
    const event = ((input.bytes[byteIndex]! & 0x80) >> 7) as 0 | 1
    const alarmType = (input.bytes[byteIndex]! & 0x07) as 0 | 1 | 2 | 3 | 4 | 5

    const isSlope = alarmType === PROCESS_ALARM_TYPES['rising slope'] || alarmType === PROCESS_ALARM_TYPES['falling slope']
    const raw = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!
    const value = isSlope ? slopeValueToValue(raw, options.channels[0]) : TULIPValueToValue(raw, options.channels[0])

    processAlarms.push({
      sensorId: 0,
      channelId,
      channelName: 'measurement',
      event,
      eventName: Object.keys(ALARM_EVENTS).find(k => (ALARM_EVENTS)[k as keyof typeof ALARM_EVENTS] === event) as keyof typeof ALARM_EVENTS,
      alarmType,
      alarmTypeName: Object.keys(PROCESS_ALARM_TYPES).find(k => (PROCESS_ALARM_TYPES)[k as keyof typeof PROCESS_ALARM_TYPES] === alarmType) as keyof typeof PROCESS_ALARM_TYPES,
      value: roundValue(value, options.roundingDecimals),
    } as NETRIS1TULIP2ProcessAlarmsData[number])
  }

  const warnings: string[] = []

  const res: NETRIS1TULIP2ProcessAlarmsUplinkOutput = {
    data: {
      messageType: 0x03,
      configurationId,
      processAlarms,
    },
  }

  // Check for ERROR_VALUE in process alarms and add warnings
  for (const alarm of processAlarms) {
    if (alarm.value === ERROR_VALUE) {
      warnings.push(`Invalid data for channel - ${alarm.channelName} : 0xffff, 65535`)
    }
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

const handleTechnicalAlarmMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  // Technical alarm is 5 bytes: [0x04, confId, sensorId, alarmTypeHi, alarmTypeLo]
  if (input.bytes.length !== 5) {
    throw new Error(`Technical alarm message (0x04) requires 5 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  // sensor id is always 0 per spec
  const alarmType = ((input.bytes[3]! << 8) | input.bytes[4]!) & 0x7FFF

  const alarmTypeNames: (keyof typeof TECHNICAL_ALARM_TYPES)[] = []
  ;(Object.entries(TECHNICAL_ALARM_TYPES) as [keyof typeof TECHNICAL_ALARM_TYPES, number][]).forEach(([name, bit]) => {
    if ((alarmType & bit) !== 0) {
      alarmTypeNames.push(name)
    }
  })

  return {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms: [{
        sensorId: 0,
        alarmType,
        alarmTypeNames,
      }] as NETRIS1TULIP2TechnicalAlarmsData,
    },
  }
}

const handleDeviceAlarmMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DeviceAlarmsUplinkOutput> = (input) => {
  // Device alarm is 4 bytes: [0x05, confId, alarmHi, alarmLo]
  if (input.bytes.length !== 4) {
    throw new Error(`Device alarm message (0x05) requires 4 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const alarmType = ((input.bytes[2]! << 8) | input.bytes[3]!) & 0x7FFF

  const alarmTypeNames: (keyof typeof DEVICE_ALARM_TYPES)[] = []
  ;(Object.entries(DEVICE_ALARM_TYPES) as [keyof typeof DEVICE_ALARM_TYPES, number][]).forEach(([name, bit]) => {
    if ((alarmType & bit) !== 0) {
      alarmTypeNames.push(name)
    }
  })

  return {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm: {
        alarmType,
        alarmTypeNames,
      } as NETRIS1TULIP2DeviceAlarmsData,
    },
  }
}

const handleDeviceIdentificationMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DeviceInformationUplinkOutput> = (input) => {
  // According to our schema we require extended identification (>= 29 bytes)
  if (input.bytes.length < 29) {
    throw new Error(`Device identification message (0x07) requires at least 29 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  const productIdName = (PRODUCT_IDS_BY_ID as Record<number, string>)[productId] ?? 'Unknown'

  const productSubId = input.bytes[3]!
  const sensorId = productSubId & 0x1F // Bits 4-0
  const sensorIdName = (SENSOR_IDS_BY_ID as Record<number, string>)[sensorId] ?? 'Unknown'
  const lpwanId = (productSubId >> 5) & 0x07 // Bits 7-5
  const lpwanIdName = (LPWAN_IDS_BY_ID as Record<number, string>)[lpwanId] ?? 'Unknown'
  const productSubIdName = `${sensorIdName} ${lpwanIdName}`

  const wirelessModuleFirmwareVersion = `${(input.bytes[4]! >> 4) & 0x0F}.${input.bytes[4]! & 0x0F}.${input.bytes[5]!}`
  const wirelessModuleHardwareVersion = `${(input.bytes[6]! >> 4) & 0x0F}.${input.bytes[6]! & 0x0F}.${input.bytes[7]!}`

  // always extended info; trim trailing NUL bytes without using control-char literals
  const serialBytes = input.bytes.slice(8, 19)
  let lastNonZero = serialBytes.length - 1
  while (lastNonZero >= 0 && serialBytes[lastNonZero] === 0) {
    lastNonZero--
  }
  const serialNumber = String.fromCharCode(...serialBytes.slice(0, lastNonZero + 1))

  const measurementRangeStart = intTuple4ToFloat32WithThreshold([input.bytes[19]!, input.bytes[20]!, input.bytes[21]!, input.bytes[22]!])
  const measurementRangeEnd = intTuple4ToFloat32WithThreshold([input.bytes[23]!, input.bytes[24]!, input.bytes[25]!, input.bytes[26]!])
  const measurand = input.bytes[27]!
  const measurandName = (LPP_MEASURANDS_BY_ID as Record<number, string>)[measurand] ?? 'Unknown'
  const unit = input.bytes[28]!
  const unitName = (LPP_UNITS_BY_ID as Record<number, string>)[unit] ?? 'Unknown'

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productId,
        productIdName,
        sensorId,
        sensorIdName,
        lpwanId,
        lpwanIdName,
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        measurementRangeStart,
        measurementRangeEnd,
        measurand,
        measurandName,
        unit,
        unitName,
        productSubId,
        productSubIdName,
      } as NETRIS1TULIP2DeviceInformationData,
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message (0x08) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const batteryByte = input.bytes[2]!

  const batteryLevelNewEvent = ((batteryByte & 0x80) >> 7) === 1
  const batteryLevelPercent = batteryByte & 0x7F

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent,
        batteryLevelPercent,
      } as NETRIS1TULIP2DeviceStatisticsData,
    },
  }
}

const handleChannelFailureAlarmMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2ChannelFailureAlarmUplinkOutput> = (input) => {
  if (input.bytes.length !== 5) {
    throw new Error(`Channel failure alarm message (0x09) requires 5 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const channelId = (input.bytes[2]! & 0x0F) as 0
  const alarmType = ((input.bytes[3]! << 8) | input.bytes[4]!) & 0x7FFF

  const alarmTypeNames: (keyof typeof MEASUREMENT_ALARM_TYPES)[] = []
  ;(Object.entries(MEASUREMENT_ALARM_TYPES) as [keyof typeof MEASUREMENT_ALARM_TYPES, number][]).forEach(([name, bit]) => {
    if ((alarmType & bit) !== 0) {
      alarmTypeNames.push(name)
    }
  })

  return {
    data: {
      messageType: 0x09,
      configurationId,
      channelFailureAlarm: {
        sensorId: 0,
        channelId,
        channelName: 'measurement',
        alarmType,
        alarmTypeNames,
      } as NETRIS1TULIP2ChannelFailureAlarmData,
    },
  }
}

const netris1EncoderFactory: EncoderFactory<NETRIS1Tulip2DownlinkInput> = (options) => {
  const featureFlags = NETRIS1_DOWNLINK_FEATURE_FLAGS
  return (input: NETRIS1Tulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, [createNETRIS1TULIP2GetConfigurationSchema(), createNETRIS1TULIP2ResetBatterySchema()])
    return NETRIS1TULIP2EncodeHandler(validated as NETRIS1Tulip2DownlinkInput)
  }
}

const netris1MultipleEncodeFactory: MultipleEncoderFactory<NETRIS1Tulip2DownlinkInput> = (options) => {
  const featureFlags = NETRIS1_DOWNLINK_FEATURE_FLAGS
  return (input: NETRIS1Tulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, [createNETRIS1TULIP2GetConfigurationSchema(), createNETRIS1TULIP2ResetBatterySchema()])
    return NETRIS1TULIP2EncodeHandler(validated as NETRIS1Tulip2DownlinkInput, true)
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2NETRIS1Codec() {
  return defineTULIP2Codec({
    deviceName: NETRIS1_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createTULIP2NETRIS1Channels(),
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleKeepAliveMessage,
      0x09: handleChannelFailureAlarmMessage,
    },
    encoderFactory: netris1EncoderFactory,
    multipleEncodeFactory: netris1MultipleEncodeFactory,
  })
}

export {}
