import type { Handler, TULIP2Channel } from '../../../../codecs/tulip2'
import type {
  TRWTULIP2ChannelFailureAlarmData,
  TRWTULIP2ChannelFailureAlarmUplinkOutput,
  TRWTULIP2DataMessageUplinkOutput,
  TRWTULIP2DeviceAlarmsData,
  TRWTULIP2DeviceAlarmsUplinkOutput,
  TRWTULIP2DeviceInformationData,
  TRWTULIP2DeviceInformationUplinkOutput,
  TRWTULIP2DeviceStatisticsData,
  TRWTULIP2DeviceStatisticsUplinkOutput,
  TRWTULIP2ProcessAlarmsData,
  TRWTULIP2ProcessAlarmsUplinkOutput,
  TRWTULIP2TechnicalAlarmsData,
  TRWTULIP2TechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { TRW_NAME } from '../index'
import { ALARM_EVENTS, DEVICE_ALARM_TYPES, LPP_MEASURANDS_BY_ID, LPP_UNITS_BY_ID, MEASUREMENT_ALARM_TYPES, PROCESS_ALARM_TYPES, TECHNICAL_ALARM_TYPES } from './lookups'

const ERROR_VALUE = 0xFFFF

// Only one temperature channel for TRW, name is 'temperature'
// eslint-disable-next-line ts/explicit-function-return-type
function createTULIP2TRWChannels() {
  return [
    {
      channelId: 0,
      name: 'temperature',
      start: 0 as number, // placeholder; actual range comes from device config at runtime
      end: 10 as number, // placeholder; actual range comes from device config at runtime
    },
  ] as const satisfies TULIP2Channel[]
}

const handleDataMessage: Handler<TULIP2Channel[], TRWTULIP2DataMessageUplinkOutput> = (input, options) => {
  // Data message: 0x01/0x02, length 5 bytes expected for single channel
  if (input.bytes.length !== 5) {
    throw new Error(`Data message 01/02 needs 5 bytes but got ${input.bytes.length}`)
  }

  if (!options.channels[0]) {
    throw new Error('No channel configured for TRW')
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!

  const channelRaw = (input.bytes[3]! << 8) | input.bytes[4]!

  const value = channelRaw === ERROR_VALUE
    ? ERROR_VALUE
    : roundValue(TULIPValueToValue(channelRaw, options.channels[0]), options.roundingDecimals)

  if (value === ERROR_VALUE) {
    throw new Error('Invalid data for channel - temperature : 0xffff, 65535')
  }

  const res: TRWTULIP2DataMessageUplinkOutput = {
    data: {
      configurationId,
      messageType,
      measurement: {
        channels: [
          {
            channelId: 0,
            channelName: 'temperature',
            value,
          },
        ],
      },
    },
  }

  return res
}

const handleProcessAlarmMessage: Handler<TULIP2Channel[], TRWTULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  // Needs at least 6 bytes and (len - 3) % 3 === 0
  if (input.bytes.length < 6 || ((input.bytes.length - 3) % 3) !== 0) {
    throw new Error(`Process alarm 03 needs at least 6 bytes and got ${input.bytes.length}. Also all bytes for each alarm needed`)
  }

  if (!options.channels[0]) {
    throw new Error('No channel configured for TRW')
  }

  const configurationId = input.bytes[1]!

  const processAlarms: TRWTULIP2ProcessAlarmsData = []

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
      channelName: 'temperature',
      event,
      eventName: Object.keys(ALARM_EVENTS).find(k => (ALARM_EVENTS)[k as keyof typeof ALARM_EVENTS] === event) as keyof typeof ALARM_EVENTS,
      alarmType,
      alarmTypeName: Object.keys(PROCESS_ALARM_TYPES).find(k => (PROCESS_ALARM_TYPES)[k as keyof typeof PROCESS_ALARM_TYPES] === alarmType) as keyof typeof PROCESS_ALARM_TYPES,
      value: roundValue(value, options.roundingDecimals),
    } as TRWTULIP2ProcessAlarmsData[number])
  }

  const warnings: string[] = []

  const res: TRWTULIP2ProcessAlarmsUplinkOutput = {
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

const handleTechnicalAlarmMessage: Handler<TULIP2Channel[], TRWTULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  // Technical alarm is 5 bytes: [0x04, confId, sensorId, alarmTypeHi, alarmTypeLo]
  if (input.bytes.length !== 5) {
    throw new Error(`Technical alarm 04 needs 5 bytes but got ${input.bytes.length}.`)
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
      }] as TRWTULIP2TechnicalAlarmsData,
    },
  }
}

const handleDeviceAlarmMessage: Handler<TULIP2Channel[], TRWTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  // Device alarm is 4 bytes: [0x05, confId, alarmHi, alarmLo]
  if (input.bytes.length !== 4) {
    throw new Error(`Device alarm 05 needs at least 4 bytes got ${input.bytes.length}.`)
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
      } as TRWTULIP2DeviceAlarmsData,
    },
  }
}

const handleDeviceIdentificationMessage: Handler<TULIP2Channel[], TRWTULIP2DeviceInformationUplinkOutput> = (input) => {
  // According to our schema we require extended identification (>= 29 bytes)
  if (input.bytes.length < 29) {
    throw new Error(`Identification message 07 needs at least 29 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  const productSubId = input.bytes[3]!

  // Firmware version: byte 4 contains major.minor in nibbles, byte 5 is patch
  const firmwareVersionMajor = (input.bytes[4]! >> 4) & 0x0F
  const firmwareVersionMinor = input.bytes[4]! & 0x0F
  const firmwareVersionPatch = input.bytes[5]!
  const wirelessModuleFirmwareVersion = `${firmwareVersionMajor}.${firmwareVersionMinor}.${firmwareVersionPatch}`

  // Hardware version: byte 6 contains major.minor in nibbles, byte 7 is patch
  const hardwareVersionMajor = (input.bytes[6]! >> 4) & 0x0F
  const hardwareVersionMinor = input.bytes[6]! & 0x0F
  const hardwareVersionPatch = input.bytes[7]!
  const wirelessModuleHardwareVersion = `${hardwareVersionMajor}.${hardwareVersionMinor}.${hardwareVersionPatch}`

  // Serial number is ASCII encoded in bytes 8-18 (11 chars) - matching legacy JS implementation
  const serialNumberBytes = input.bytes.slice(8, 19)
  const serialNumber = String.fromCharCode(...serialNumberBytes)

  const measurementRangeStart = intTuple4ToFloat32WithThreshold([
    input.bytes[19]!,
    input.bytes[20]!,
    input.bytes[21]!,
    input.bytes[22]!,
  ])
  const measurementRangeEnd = intTuple4ToFloat32WithThreshold([
    input.bytes[23]!,
    input.bytes[24]!,
    input.bytes[25]!,
    input.bytes[26]!,
  ])

  const measurand = input.bytes[27]!
  const unit = input.bytes[28] || 0

  // Determine names based on IDs
  const productIdName = productId === 16 ? 'NETRIS©1 BLE+LPWAN' : `Unknown Product (ID: ${productId})`
  const productSubIdName = productSubId === 66 ? 'LoRa TRW' : `Unknown Sub-Product (ID: ${productSubId})`
  const measurandName = (LPP_MEASURANDS_BY_ID as Record<number, string>)[measurand] ?? 'Unknown'
  const unitName = LPP_UNITS_BY_ID[unit as keyof typeof LPP_UNITS_BY_ID] || 'Unknown'

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productIdName,
        productId,
        productSubId,
        productSubIdName,
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        measurementRangeStart,
        measurementRangeEnd,
        measurand,
        measurandName,
        unit,
        unitName,
      } as TRWTULIP2DeviceInformationData,
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2Channel[], TRWTULIP2DeviceStatisticsUplinkOutput> = (input) => {
  // Keep alive is 3 bytes: [0x08, confId, batteryLevel]
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message 08 needs 3 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const batteryLevelPercent = input.bytes[2]!
  const batteryLevelNewEvent = false // TRW doesn't seem to have "new event" flag

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent,
        batteryLevelPercent,
      } as TRWTULIP2DeviceStatisticsData,
    },
  }
}

const handleChannelFailureAlarmMessage: Handler<TULIP2Channel[], TRWTULIP2ChannelFailureAlarmUplinkOutput> = (input) => {
  // Channel failure is 5 bytes: [0x09, confId, sensorId, channelId, alarmType]
  if (input.bytes.length !== 5) {
    throw new Error(`Channel failure message 09 needs 5 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const sensorId = input.bytes[2]!
  const channelId = input.bytes[3]! as 0
  const alarmType = input.bytes[4]!

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
        sensorId,
        channelId,
        channelName: 'temperature',
        alarmType,
        alarmTypeNames,
      } as TRWTULIP2ChannelFailureAlarmData,
    },
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2TRWCodec() {
  return defineTULIP2Codec({
    deviceName: TRW_NAME,
    channels: createTULIP2TRWChannels(),
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
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
  })
}
