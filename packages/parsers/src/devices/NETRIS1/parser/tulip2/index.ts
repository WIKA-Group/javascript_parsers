import type { Handler, TULIP2Channel } from '../../../../codecs/tulip2'
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
import { NETRIS1_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { ALARM_EVENTS, DEVICE_ALARM_TYPES, LPP_UNITS_BY_ID, MEASUREMENT_ALARM_TYPES, PROCESS_ALARM_TYPES, TECHNICAL_ALARM_TYPES } from './lookups'

const ERROR_VALUE = 0xFFFF

// Only one measurement channel for NETRIS1, name is caller-configured 'measurement'
// eslint-disable-next-line ts/explicit-function-return-type
function createTULIP2NETRIS1Channels() {
  return [
    {
      channelId: 0,
      name: 'measurement',
      start: 0 as number, // placeholder; actual range comes from device config at runtime
      end: 10 as number, // placeholder; actual range comes from device config at runtime
    },
  ] as const satisfies TULIP2Channel[]
}

type TULIP2NETRIS1Channels = ReturnType<typeof createTULIP2NETRIS1Channels>

const handleDataMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DataMessageUplinkOutput> = (input, options) => {
  // Data message: 0x01/0x02, length 5 bytes expected for single channel
  if (input.bytes.length !== 5) {
    throw new Error(`Data message 01/02 needs 5 bytes but got ${input.bytes.length}`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!

  const channelRaw = (input.bytes[3]! << 8) | input.bytes[4]!

  const value = channelRaw === ERROR_VALUE
    ? ERROR_VALUE
    : roundValue(TULIPValueToValue(channelRaw, options.channels[0]), options.roundingDecimals)

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

  if (value === ERROR_VALUE) {
    res.warnings = [
      `${NETRIS1_NAME} (TS): Invalid data for channel - measurement : 0xffff, 65535`,
    ]
  }

  return res
}

const handleProcessAlarmMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  // Needs at least 6 bytes and (len - 3) % 3 === 0
  if (input.bytes.length < 6 || ((input.bytes.length - 3) % 3) !== 0) {
    throw new Error(`Process alarm 03 needs at least 6 bytes and got ${input.bytes.length}. Also all bytes for each alarm needed`)
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
      warnings.push(`${NETRIS1_NAME} (TS): Invalid data for channel - ${alarm.channelName} : 0xffff, 65535`)
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
      }] as NETRIS1TULIP2TechnicalAlarmsData,
    },
  }
}

const handleDeviceAlarmMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DeviceAlarmsUplinkOutput> = (input) => {
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
      } as NETRIS1TULIP2DeviceAlarmsData,
    },
  }
}

const handleDeviceIdentificationMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DeviceInformationUplinkOutput> = (input) => {
  // According to our schema we require extended identification (>= 29 bytes)
  if (input.bytes.length < 29) {
    throw new Error(`Identification message 07 needs at least 29 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!

  const productIdName = (() => {
    switch (productId) {
      case 16: return 'NETRIS©1 BLE+LPWAN'
      case 17: return 'NETRIS©1 BLE'
      default: return 'Unknown'
    }
  })()

  const productSubId = input.bytes[3]!

  const wirelessModuleFirmwareVersion = `${(input.bytes[4]! >> 4) & 0x0F}.${input.bytes[4]! & 0x0F}.${input.bytes[5]!}`
  const wirelessModuleHardwareVersion = `${(input.bytes[6]! >> 4) & 0x0F}.${input.bytes[6]! & 0x0F}.${input.bytes[7]!}`

  // always extended info; trim trailing NUL bytes without using control-char literals
  const serialBytes = input.bytes.slice(8, 19)
  let lastNonZero = serialBytes.length - 1
  while (lastNonZero >= 0 && serialBytes[lastNonZero] === 0) {
    lastNonZero--
  }
  const serialNumber = String.fromCharCode(...serialBytes.slice(0, lastNonZero + 1))

  const measurementRangeStart = roundValue(intTuple4ToFloat32WithThreshold([input.bytes[19]!, input.bytes[20]!, input.bytes[21]!, input.bytes[22]!]))
  const measurementRangeEnd = roundValue(intTuple4ToFloat32WithThreshold([input.bytes[23]!, input.bytes[24]!, input.bytes[25]!, input.bytes[26]!]))
  const measurand = input.bytes[27]!
  const unit = input.bytes[28]!

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productIdName,
        productId,
        productSubId,
        productSubIdName: resolveProductSubIdName(productSubId),
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        measurementRangeStart,
        measurementRangeEnd,
        measurand,
        measurandName: lppReturnMeasurandFromId(measurand),
        unit,
        unitName: (LPP_UNITS_BY_ID as Record<number, string>)[unit] ?? 'Unknown',
      } as NETRIS1TULIP2DeviceInformationData,
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2NETRIS1Channels, NETRIS1TULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message 08 needs 3 bytes but got ${input.bytes.length}.`)
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
    throw new Error(`Channel failure alarm 09 needs 5 bytes but got ${input.bytes.length}.`)
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

function resolveProductSubIdName(subId: number): string {
  const lpwan = (0x07 & (subId >> 5))
  const tech = (0x1F & subId)
  const lpwanName = lpwan === 0 ? 'No LPWAN' : lpwan === 1 ? 'MIOTY' : lpwan === 2 ? 'LoRa' : 'Unknown'
  const techName = tech === 0 ? 'RTD' : tech === 1 ? 'E-Signal' : tech === 2 ? 'TRW' : 'Unknown'
  return `${lpwanName} ${techName}`.trim()
}

function lppReturnMeasurandFromId(id: number): string {
  switch (id) {
    case 1: return 'Temperature'
    case 2: return 'Temperature difference'
    case 3: return 'Pressure (gauge)'
    case 4: return 'Pressure (absolute)'
    case 5: return 'Pressure (differential)'
    case 6: return 'Flow (vol.)'
    case 7: return 'Flow (mass)'
    case 8: return 'Force'
    case 9: return 'Mass'
    case 10: return 'Level'
    case 11: return 'Length'
    case 12: return 'Volume'
    case 13: return 'Current'
    case 14: return 'Voltage'
    case 15: return 'Resistance'
    case 16: return 'Capacitance'
    case 17: return 'Inductance'
    case 18: return 'Relative'
    case 19: return 'Time'
    case 20: return 'Frequency'
    case 21: return 'Speed'
    case 22: return 'Acceleration'
    case 23: return 'Density'
    case 24: return 'Density (gauge pressure at 20 °C)'
    case 25: return 'Density (absolute pressure at 20 °C)'
    case 26: return 'Humidity (relative)'
    case 27: return 'Humidity (absolute)'
    case 28: return 'Angle of rotation / inclination'
    case 60:
    case 61:
    case 62: return 'Device specific'
    default: return 'Unknown'
  }
}

// unitName is now derived from LPP_UNITS_BY_ID lookup

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
  })
}

export {}
